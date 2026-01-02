# 📧 Edge Functions - Referência Rápida - ISF IA

## 🚀 Quick Start

### Secrets Necessárias

**Para Todas as Funções:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
DEV_EMAIL=dev@email.com  # Para o dev receber relatórios diferenciados/consolidados
SUPA_URL=https://seu-projeto.supabase.co
SUPA_SERVICE_ROLE_KEY=sua_service_role_key
```

**Nota**: 
- **Todas as funções** enviam emails individualmente para o email de cada usuário
- **DEV_EMAIL**: Apenas o desenvolvedor recebe relatórios diferenciados/consolidados
- **Não usa `EMAIL_TO`**: Cada usuário recebe seu próprio relatório personalizado

---

## 📊 Edge Functions Disponíveis

### 📊 Relatórios de Inspeções

### 1. 📊 enviar-relatorio-diario
- **Frequência**: Diário às 8h UTC
- **Cron**: `0 8 * * *`
- **Função SQL**: `enviar_relatorio_diario()`
- **URL**: `/functions/v1/enviar-relatorio-diario`
- **Status**: ✅ Implementado

### 2. 📅 enviar-relatorio-semanal
- **Frequência**: Semanal (Segunda 8h UTC)
- **Cron**: `0 8 * * 1`
- **Função SQL**: `enviar_relatorio_semanal()`
- **URL**: `/functions/v1/enviar-relatorio-semanal`
- **Status**: 🆕 Novo

### 3. 📆 enviar-relatorio-mensal
- **Frequência**: Mensal (Dia 1, 9h UTC)
- **Cron**: `0 9 1 * *`
- **Função SQL**: `enviar_relatorio_mensal()`
- **URL**: `/functions/v1/enviar-relatorio-mensal`
- **Status**: 🆕 Novo

### 4. ⚠️ enviar-alertas-vencimento
- **Frequência**: Semanal (Segunda 9h UTC)
- **Cron**: `0 9 * * 1`
- **Função SQL**: `enviar_alertas_vencimento()`
- **URL**: `/functions/v1/enviar-alertas-vencimento`
- **Status**: 🆕 Novo

### 5. 🚨 enviar-notificacoes-pendencias
- **Frequência**: Semanal (Segunda 10h UTC)
- **Cron**: `0 10 * * 1`
- **Função SQL**: `enviar_notificacoes_pendencias()`
- **URL**: `/functions/v1/enviar-notificacoes-pendencias`
- **Status**: 🆕 Novo

### 👤 Emails para Usuários

### 6. 🎉 enviar-email-boas-vindas
- **Trigger**: Imediato (on signup)
- **Método**: Database Trigger ou Webhook
- **URL**: `/functions/v1/enviar-email-boas-vindas`
- **Status**: 🆕 Novo

### 7. 📧 enviar-lembrete-inatividade
- **Frequência**: Semanal (Segunda 11h UTC)
- **Cron**: `0 11 * * 1`
- **Função SQL**: `enviar_lembrete_inatividade()`
- **URL**: `/functions/v1/enviar-lembrete-inatividade`
- **Status**: 🆕 Novo

### 8. ⬆️ enviar-email-upgrade-premium
- **Trigger**: Imediato (on upgrade)
- **Método**: Database Trigger
- **URL**: `/functions/v1/enviar-email-upgrade-premium`
- **Status**: 🆕 Novo

### 9. ⏰ enviar-notificacao-trial-expirando
- **Frequência**: Diário às 10h UTC
- **Cron**: `0 10 * * *`
- **Função SQL**: `enviar_notificacao_trial_expirando()`
- **URL**: `/functions/v1/enviar-notificacao-trial-expirando`
- **Status**: 🆕 Novo

### 10. 💰 enviar-solicitacao-premium
- **Trigger**: Imediato (trial expirado)
- **Método**: Chamada manual ou trigger
- **URL**: `/functions/v1/enviar-solicitacao-premium`
- **Status**: 🆕 Novo

### 11. 🔔 enviar-notificacoes-dev
- **Frequência**: Diário às 12h UTC
- **Cron**: `0 12 * * *`
- **Função SQL**: `enviar_notificacoes_dev()`
- **URL**: `/functions/v1/enviar-notificacoes-dev`
- **Status**: 🆕 Novo

---

## 🔧 Configuração Rápida

### 1. Criar Edge Function no Dashboard

1. Acesse: https://app.supabase.com
2. Vá em **Edge Functions** > **Create a new function**
3. Nome: `nome-da-funcao`
4. Cole o código da função
5. Clique em **Deploy**

### 2. Configurar Secrets

No Supabase Dashboard > Settings > Edge Functions > Secrets:

Adicione todas as 8 secrets listadas acima.

### 3. Criar Função SQL e Cron Job

```sql
-- Substitua 'nome-da-funcao' e 'NOME_FUNCAO' pelos valores corretos
CREATE OR REPLACE FUNCTION public.NOME_FUNCAO()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/nome-da-funcao',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Agendar cron job (ajuste o cron conforme necessário)
SELECT cron.schedule(
  'nome-do-cron',
  '0 8 * * *',  -- Ajuste conforme necessário
  $$ SELECT public.NOME_FUNCAO(); $$
);
```

---

## 📋 Tabelas Consultadas

### Tabelas de Inspeções
- `inspecoes_extintores`
- `inspecoes_chuveiros_lava_olhos`
- `inspecoes_camaras_espuma`
- `inspecoes_alarmes`
- `inspecoes_canhoes_monitores`
- `inspecoes_scba`
- `inspecoes_multigas`
- `inspecoes_abrigos`
- `inspecoes_mangueiras`
- `custom_equipment_inspections`

### Tabelas de Equipamentos
- `extintores` (campos: `data_proxima_inspecao`, `data_proxima_manutencao_2_nivel`, `data_proxima_manutencao_3_nivel`)
- `inventario_chuveiros_lava_olhos` (campo: `data_proxima_inspecao`)
- `inventario_camaras_espuma` (campo: `data_proxima_inspecao`)
- `inventario_alarmes` (campo: `data_proxima_inspecao`)
- `inventario_canhoes_monitores` (campo: `data_proxima_inspecao`)
- `conjuntos_autonomos` (campo: `data_proxima_inspecao`)
- `inventario_multigas` (campo: `data_proxima_inspecao`)
- `mangueiras` (campo: `data_proximo_teste`)
- `abrigos` (campo: `data_proxima_inspecao`)
- `custom_equipment` (campo: `data_proxima_inspecao`)

---

## 🎨 Design ISF IA

### Cores
- **Fundo**: Preto (#000000)
- **Superfície**: Escura (rgba(28, 28, 30, 0.8))
- **Texto primário**: Branco (#FFFFFF)
- **Texto secundário**: Cinza (#8E8E93)
- **Sucesso**: Verde (#53D769)
- **Erro**: Vermelho (#FC3D39)
- **Aviso**: Amarelo (#FFCC00)

### Estilo
- **Border radius**: 24px
- **Fonte**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **Layout**: Responsivo, max-width 1200px

---

## ⚠️ Troubleshooting Rápido

### Email não está sendo enviado
1. Verifique logs da Edge Function
2. Confirme secrets configuradas
3. Teste manualmente via Dashboard
4. Verifique pasta de spam

### Erro: "SMTP Authentication failed"
- Use **Senha de App** do Gmail (não senha normal)
- Verifique `SMTP_USER` e `SMTP_PASS`

### Erro: "InvalidData: received corrupt message"
- Use porta **465** (SSL direto) ao invés de 587
- Atualize `SMTP_PORT` para `465`

### Cron Job não está executando
- Verifique se `pg_cron` está habilitado
- Confirme horário do cron (use UTC)
- Verifique logs do cron job

---

## 📚 Documentação Completa

- **Emails para Usuários**: `docs/EDGE_FUNCTIONS_USUARIOS.md` (detalhado)
- **Detalhado**: `docs/EDGE_FUNCTIONS_DETALHADO.md`
- **Visão Geral**: `docs/EDGE_FUNCTIONS_COMPLETO.md`
- **Relatório Diário**: `docs/EDGE_FUNCTION_RELATORIO_EMAIL.md`
- **Sistema de Emails**: `docs/EMAIL_PROCESSING_SYSTEM.md`

---

## ✅ Checklist de Implementação

Para cada função:

- [ ] Edge Function criada no Dashboard
- [ ] Secrets configuradas
- [ ] Teste manual executado
- [ ] Função SQL criada
- [ ] Cron job agendado
- [ ] Logs verificados
- [ ] Email recebido

---

## 🎉 Status

✅ **11 Edge Functions documentadas**
✅ **5 Relatórios de Inspeções**
✅ **6 Emails para Usuários**
✅ Sistema completo e operacional
✅ Pronto para implementação

