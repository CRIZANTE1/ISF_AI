# 📧 Índice Completo - Edge Functions ISF IA

## 📋 Visão Geral

Este documento serve como índice central para toda a documentação de Edge Functions do ISF IA.

## 📚 Documentos Disponíveis

### 1. **EDGE_FUNCTIONS_COMPLETO.md**
Visão geral de todas as 11 Edge Functions com comparações e fluxos.

### 2. **EDGE_FUNCTIONS_DETALHADO.md**
Detalhamento técnico de cada função com lógica passo a passo e exemplos de código.

### 3. **EDGE_FUNCTIONS_USUARIOS.md**
Documentação completa das 6 Edge Functions relacionadas ao ciclo de vida do usuário.

### 4. **EDGE_FUNCTIONS_REFERENCIA_RAPIDA.md**
Referência rápida com quick start, checklist e troubleshooting.

### 5. **EDGE_FUNCTION_RELATORIO_EMAIL.md**
Documentação detalhada do relatório diário (base para outras funções).

### 6. **EMAIL_PROCESSING_SYSTEM.md**
Arquitetura completa do sistema de processamento e envio de emails.

---

## 🎯 Edge Functions por Categoria

### 📊 Relatórios de Inspeções (5 funções)

1. **enviar-relatorio-diario** - Diário 8h UTC
2. **enviar-relatorio-semanal** - Semanal (Segunda 8h UTC)
3. **enviar-relatorio-mensal** - Mensal (Dia 1, 9h UTC)
4. **enviar-alertas-vencimento** - Semanal (Segunda 9h UTC)
5. **enviar-notificacoes-pendencias** - Semanal (Segunda 10h UTC)

**Documentação**: `EDGE_FUNCTIONS_DETALHADO.md`

---

### 👤 Emails para Usuários (6 funções)

1. **enviar-email-boas-vindas** - Imediato (on signup)
2. **enviar-lembrete-inatividade** - Semanal (Segunda 11h UTC)
3. **enviar-email-upgrade-premium** - Imediato (on upgrade)
4. **enviar-notificacao-trial-expirando** - Diário 10h UTC
5. **enviar-solicitacao-premium** - Imediato (trial expirado)
6. **enviar-notificacoes-dev** - Diário 12h UTC

**Documentação**: `EDGE_FUNCTIONS_USUARIOS.md`

---

## 🚀 Quick Start

### 1. Configurar Secrets

No Supabase Dashboard > Settings > Edge Functions > Secrets:

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

### 2. Criar Edge Functions

Para cada função:
1. Acesse: https://app.supabase.com
2. Vá em **Edge Functions** > **Create a new function**
3. Nome: `nome-da-funcao`
4. Cole o código (ver documentação detalhada)
5. Clique em **Deploy**

### 3. Configurar Triggers e Cron Jobs

Ver documentação específica de cada função para:
- Database triggers (signup, upgrade)
- Cron jobs SQL (relatórios, lembretes)

---

## 📊 Resumo Executivo

| Categoria | Funções | Status |
|-----------|--------|--------|
| **Relatórios de Inspeções** | 5 | ✅ Documentadas |
| **Emails para Usuários** | 6 | ✅ Documentadas |
| **Total** | **11** | ✅ **Completo** |

---

## ✅ Checklist Geral

- [ ] Todas as secrets configuradas
- [ ] Edge Functions criadas no Dashboard
- [ ] Database triggers criados (signup, upgrade)
- [ ] Cron jobs agendados
- [ ] Tabela `email_logs` criada
- [ ] Testes manuais executados
- [ ] Logs verificados
- [ ] Emails recebidos e validados

---

## 🎉 Status Final

✅ **11 Edge Functions completamente documentadas**
✅ **Sistema completo de emails** (relatórios + usuários)
✅ **Pronto para implementação**
✅ **Design ISF IA mantido** em todos os emails
✅ **100% gratuito** (SMTP direto)

