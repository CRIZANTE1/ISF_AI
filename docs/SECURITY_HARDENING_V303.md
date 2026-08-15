# Security Hardening — v3.0.3

**Data:** 15/08/2026  
**Versão:** 3.0.3 (versionCode 44)  
**Responsável:** Auditoria automatizada + revisão manual  
**Projeto Supabase:** `flqbsqleqdierrqhlirw`

---

## Resumo executivo

Esta versão implementa o hardening de segurança completo do aplicativo ISF-IA, cobrindo camada Android, Storage, Edge Functions e banco de dados (RLS, privilégios e funções SQL). Todas as vulnerabilidades identificadas no audit de agosto/2026 foram corrigidas ou mitigadas.

---

## 1. Android

### 1.1 Backup desabilitado

**Arquivo:** `android/app/src/main/AndroidManifest.xml`

**Problema:** `android:allowBackup="true"` permitia extração do banco de dados local via `adb backup`, expondo dados sensíveis armazenados no device.

**Correção:**
```xml
android:allowBackup="false"
android:fullBackupContent="false"
```

### 1.2 FileProvider com escopo restrito

**Arquivo:** `android/app/src/main/res/xml/file_paths.xml`

**Problema:** `path="."` expunha toda a raiz do armazenamento externo ao FileProvider, permitindo que um app malicioso com o Content URI adequado acessasse qualquer arquivo.

**Correção:** caminhos restritos a diretórios específicos:
```xml
<external-path name="external_pictures" path="Pictures/" />
<cache-path name="camera_tmp" path="camera_tmp/" />
```

---

## 2. Storage (Supabase)

### 2.1 Upload com path forçado por usuário

**Arquivos:** `src/utils/storage.ts`, `src/pages/Profile.tsx`

**Problema:** uploads de evidências e avatares podiam ser feitos em qualquer caminho do bucket, permitindo que um usuário sobrescrevesse arquivos de outro.

**Correção:** todas as funções de upload agora forçam o prefixo `{userId}/` antes do nome do arquivo:

```ts
// storage.ts
function requireUserId(): string { ... }
function userScopedPath(userId: string, fileName: string): string {
  return `${userId}/${fileName}`;
}
```

**Buckets afetados:** `evidence-photos`, `avatars`  
**Política RLS no banco:** `storage.objects` restringe `name LIKE auth.uid() || '/%'`

---

## 3. Edge Functions

### 3.1 Autenticação CRON_SECRET

**Funções alteradas:**
- `limpar-usuarios-inativos`
- `cleanup-old-logs-v2`
- `deletar-usuarios-com-aviso-expirado`
- `enviar-notificacoes-pendencias`
- `enviar-relatorio-diario`
- `enviar-relatorio-mensal`

**Problema:** as funções não validavam quem as chamava. Qualquer requisição HTTP sem autenticação retornava 200 e executava a lógica interna.

**Correção:** cada função agora aceita dois modos de autenticação:

```ts
// Modo cron: header Authorization: Bearer CRON_SECRET
const cronSecret = Deno.env.get('CRON_SECRET');
const authHeader = req.headers.get('Authorization');

if (authHeader === `Bearer ${cronSecret}`) {
  // chamada válida de cron job
} else {
  // verificar JWT de admin como fallback
}
```

**Deploy:** realizado via Supabase CLI em 15/08/2026.

---

## 4. Banco de dados — Migrations aplicadas

### 4.1 Visão geral das migrations de segurança

| Migration | Data | Descrição |
|---|---|---|
| `20260815123111_security_hardening_rls` | 15/08/2026 | RLS + helper `is_admin()` |
| `20260815123123_security_hardening_idor` | 15/08/2026 | Correção de IDOR em inspeções e logs |
| `20260815123135_security_hardening_logs_revoke` | 15/08/2026 | Revoke em RPCs de auditoria |
| `20260815123154_security_hardening_storage_admin` | 15/08/2026 | Policies de storage + RPC admin |
| `20260815123407_security_hardening_remove_jwt` | 15/08/2026 | Remoção de JWT hardcoded nas funções SQL |
| `20260815123538_security_hardening_revoke_remaining` | 15/08/2026 | Revoke final em funções remanescentes |
| `fix_email_logs_rls_and_search_path` | 15/08/2026 | RLS de `email_logs` + search_path de 5 funções |
| `revoke_sensitive_function_access` | 15/08/2026 | Revoke de anon/authenticated em funções sensíveis |
| `restore_is_admin_and_get_users_execute` | 15/08/2026 | Restauração de EXECUTE necessário para RLS |

### 4.2 RLS — `email_logs`

**Problema:** RLS habilitado mas sem nenhuma policy — qualquer query retornava vazio ou erro.

**Correção:**
```sql
-- Admin vê tudo
CREATE POLICY "admin_all_email_logs" ON public.email_logs
  FOR ALL TO authenticated USING (public.is_admin());

-- Usuário vê apenas seus próprios logs
CREATE POLICY "users_own_email_logs" ON public.email_logs
  FOR SELECT TO authenticated USING (user_id = auth.uid());
```

### 4.3 Prevenção de escalada de privilégio

**Problema:** um usuário autenticado podia fazer `UPDATE profiles SET role = 'admin'` diretamente via PostgREST.

**Correção:** trigger `BEFORE UPDATE` na tabela `profiles`:
```sql
CREATE OR REPLACE FUNCTION prevent_privilege_escalation()
  RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    NEW.role := OLD.role;         -- não permite alterar role
    NEW.is_premium := OLD.is_premium; -- não permite alterar premium
  END IF;
  RETURN NEW;
END;
$$;
```

### 4.4 IDOR — correção de policies permissivas

**Problema:** várias tabelas tinham policies com `USING (auth.role() = 'authenticated')`, permitindo que qualquer usuário logado visse dados de qualquer outro usuário.

**Correção:** policies substituídas por `USING (user_id = auth.uid())` em todas as tabelas de inspeção, logs de ação e logs de acesso.

### 4.5 JWT hardcoded removido

**Problema:** funções SQL do cron (`on_new_user`, `handle_new_user`, `on_user_upgrade`) contiam um JWT de `service_role` hardcoded no corpo da função, o qual era visível no `pg_proc` para qualquer usuário com acesso a informações do sistema.

**Correção:** as funções foram reescritas sem o JWT. A lógica de envio de e-mail foi delegada inteiramente às Edge Functions, chamadas com `Authorization: Bearer CRON_SECRET`.

### 4.6 `search_path` corrigido

**Funções corrigidas** (adicionado `SET search_path = public`):

| Função | Tipo |
|---|---|
| `update_user_feedback_updated_at` | Trigger |
| `get_local_date` | Utilitário |
| `set_user_id_log_acoes_mangueiras` | Trigger |
| `testar_cron_job_individual` | Debug/admin |
| `testar_todos_cron_jobs` | Debug/admin |

**Risco mitigado:** sem `search_path` fixo, um atacante com permissão de criar objetos poderia criar uma função ou tabela com o mesmo nome em outro schema e desviar a execução (schema poisoning).

### 4.7 Revogação de privilégios em funções SECURITY DEFINER

#### Revogado para `anon`

| Função | Motivo |
|---|---|
| `is_ip_blocked(inet)` | Verificação de IP deve ser server-side |
| `log_user_access(...)` | Logging de acesso não deve ser invocável anonimamente |
| `log_user_action(...)` | Idem |

#### Revogado para `authenticated`

| Função | Motivo |
|---|---|
| `block_ip(...)` | Operação exclusivamente admin |
| `cleanup_old_logs_v2()` | Chamada apenas por cron via Edge Function |
| `create_security_alert(...)` | Operação exclusivamente admin/sistema |

#### Mantido para `authenticated` (necessário)

| Função | Motivo |
|---|---|
| `is_admin()` | Usado internamente em todas as policies RLS — revogar quebra o banco |
| `get_all_users_with_profiles()` | Chamada pelo painel admin no app; tem verificação interna de `is_admin()` |
| `generate_unique_equipment_id(...)` | Chamada por usuários normais ao criar equipamentos |

---

## 5. Único item pendente (manual)

**Proteção de senhas vazadas** — ativar no Dashboard:

> Supabase Dashboard → Auth → Settings → Password Security  
> → Enable **"Leaked password protection"** (verifica contra HaveIBeenPwned)

Não pode ser ativado via SQL ou CLI, apenas pelo painel.

---

## 6. Referências

- [Supabase RLS Guide](https://supabase.com/docs/guides/database/row-level-security)
- [Supabase Database Linter](https://supabase.com/docs/guides/database/database-linter)
- [OWASP IDOR](https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/05-Authorization_Testing/04-Testing_for_Insecure_Direct_Object_References)
- [PostgreSQL search_path](https://www.postgresql.org/docs/current/ddl-schemas.html#DDL-SCHEMAS-PATH)
- Auditoria anterior: [`docs/SECURITY_DB_AUDIT.md`](./SECURITY_DB_AUDIT.md)
