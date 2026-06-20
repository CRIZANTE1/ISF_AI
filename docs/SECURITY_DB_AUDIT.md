# Auditoria de segurança do banco (Supabase)

Documento de referência gerado a partir dos **Supabase Database Advisors** do projeto **Android_studio** (`flqbsqleqdierrqhlirw`).

> **Importante:** este documento **não altera o banco**. O SQL abaixo é apenas recomendação para aplicação manual futura, quando houver janela de manutenção e testes em staging.

Projeto: https://flqbsqleqdierrqhlirw.supabase.co

---

## Resumo executivo

| Prioridade | Item | Impacto |
|---|---|---|
| Crítico | `email_logs` sem RLS | Qualquer cliente com anon key pode ler/gravar logs de e-mail |
| Alto | Funções `SECURITY DEFINER` expostas a `anon` | RPCs admin/cron invocáveis sem autenticação adequada |
| Médio | Policy permissiva em `licenses` | Policy `USING (true)` efetivamente bypassa RLS |
| Médio | Policies `WITH CHECK (true)` em logs | Insert irrestrito (pode ser intencional para auditoria) |
| Info | Extensão `pg_net` em `public` | Boas práticas de isolamento de schema |

---

## 1. Crítico: `email_logs` sem Row Level Security

**Problema:** a tabela `public.email_logs` está exposta ao PostgREST sem RLS habilitado.

**Risco:** leitura e escrita de histórico de e-mails por qualquer requisição autenticada com a chave anon do app.

**Uso no app:** edge functions (`limpar-usuarios-inativos`, `deletar-usuarios-com-aviso-expirado`, `delete-user`) inserem/consultam via **service role** — não dependem de RLS desabilitado.

**SQL sugerido (não executar automaticamente):**

```sql
ALTER TABLE public.email_logs ENABLE ROW LEVEL SECURITY;

-- Edge functions (service role) continuam com bypass de RLS.
-- Usuários autenticados: apenas seus próprios registros (se necessário no app)
CREATE POLICY "Users read own email logs"
  ON public.email_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Inserções apenas via service role (sem policy para authenticated/anon)
```

Referência: [RLS disabled in public](https://supabase.com/docs/guides/database/database-linter?lint=0013_rls_disabled_in_public)

---

## 2. Alto: funções RPC admin executáveis por `anon`

**Problema:** funções `SECURITY DEFINER` no schema `public` estão com `EXECUTE` concedido a `anon` e/ou `authenticated`, permitindo chamadas via `/rest/v1/rpc/...`.

**Funções sensíveis identificadas:**

| Função | Risco |
|---|---|
| `associate_license_to_user` | Associar licença a usuário arbitrário |
| `associate_licenses_to_users` | Associação em massa |
| `associate_all_licenses_to_most_active_user` | Reatribuição global |
| `list_unassociated_licenses` | Enumera licenças |
| `limpar_usuarios_inativos` | Limpeza de usuários |
| `deletar_usuarios_com_aviso_expirado` | Exclusão de usuários |
| `cleanup_old_logs` / `cleanup_old_logs_v2` | Limpeza de auditoria |
| `enviar_*` (relatórios, notificações, cron) | Disparo manual de jobs |
| `block_ip`, `create_security_alert` | Manipulação de segurança |
| `generate_unique_equipment_id` | Geração de IDs (menor risco, mas exposta) |

**SQL sugerido (exemplo — ajustar por função):**

```sql
REVOKE EXECUTE ON FUNCTION public.limpar_usuarios_inativos() FROM anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.associate_license_to_user(text, uuid) FROM anon, authenticated;
-- Repetir para demais funções internas; manter EXECUTE apenas para service_role
-- ou role dedicada usada pelos cron jobs.
```

Referência: [Public Can Execute SECURITY DEFINER Function](https://supabase.com/docs/guides/database/database-linter?lint=0028_anon_security_definer_function_executable)

**Nota para o app:** o cliente mobile/web **não deve** chamar essas RPCs diretamente. Verificar se algum código em `src/` invoca `.rpc('limpar_usuarios_inativos')` etc. — hoje o uso esperado é apenas via **Edge Functions** com service role.

---

## 3. Médio: RLS permissivo em `licenses`

**Problema:** policy `Admins can manage licenses` com `USING (true)` e `WITH CHECK (true)` para operação `ALL`.

**Risco:** qualquer role coberto pela policy tem acesso total à tabela de licenças.

**Recomendação:** restringir a admins verificados via `profiles`:

```sql
-- Exemplo conceitual — validar nomes exatos das policies existentes antes de aplicar
DROP POLICY IF EXISTS "Admins can manage licenses" ON public.licenses;

CREATE POLICY "Admins can manage licenses"
  ON public.licenses FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );
```

Referência: [Permissive RLS policy](https://supabase.com/docs/guides/database/database-linter?lint=0024_permissive_rls_policy)

---

## 4. Médio: insert irrestrito em logs de auditoria

**Tabelas:** `user_access_logs`, `user_action_logs`, `security_alerts`

**Policies:** `WITH CHECK (true)` em INSERT — permite insert de qualquer linha.

**Trade-off:** útil para o app registrar login/ações via RPC `log_user_access` / `log_user_action`. Documentar como **aceitável** se combinado com revogação de EXECUTE nas RPCs para `anon`.

---

## 5. Outros avisos

### Funções com `search_path` mutável

Funções como `update_purchases_updated_at`, `log_user_action`, `on_new_user` não fixam `search_path`. Recomendação: `SET search_path = public` na definição.

Referência: [Function search path mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)

### Proteção de senhas vazadas (Auth)

Advisor reporta **Leaked Password Protection** desabilitado no Auth. Configurar no Dashboard: Authentication → Settings.

Referência: [Password security](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

### Extensão `pg_net` em `public`

Mover para schema dedicado em manutenção futura.

Referência: [Extension in public](https://supabase.com/docs/guides/database/database-linter?lint=0014_extension_in_public)

---

## Checklist antes de aplicar correções no banco

1. Testar em branch/staging do Supabase
2. Confirmar que Edge Functions usam `service_role` e não dependem de RLS desabilitado em `email_logs`
3. Validar cron jobs após `REVOKE EXECUTE` nas funções SQL
4. Re-executar advisors: Dashboard → Database → Advisors ou MCP `get_advisors`
5. Regression test: login, licenciamento, exportação LGPD, inspeções de extintor

---

## Histórico

| Data | Origem | Ação no repositório |
|---|---|---|
| 2026-06-19 | Supabase MCP advisors | Documento criado; **nenhuma migration aplicada** |
