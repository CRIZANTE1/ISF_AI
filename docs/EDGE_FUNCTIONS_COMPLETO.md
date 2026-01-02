# 📧 Sistema Completo de Edge Functions - ISF IA

## 📋 Visão Geral

Este documento descreve todas as Edge Functions do sistema ISF IA para processamento e envio de emails relacionados a:
- 📊 **Relatórios de Inspeções** (diário, semanal, mensal, alertas, pendências) - enviam individualmente para cada usuário
- 👤 **Emails para Usuários** (boas-vindas, lembrete, upgrade, trial, solicitação, dev) - enviam individualmente para cada usuário

**⚠️ Importante**: 
- **Todas as funções** enviam emails individualmente para o email de cada usuário
- **DEV_EMAIL**: Apenas o desenvolvedor recebe relatórios diferenciados/consolidados
- **Não usa `EMAIL_TO`**: Cada usuário recebe seu próprio relatório personalizado

## 📚 Documentação Relacionada

- **Emails para Usuários (Detalhado)**: `EDGE_FUNCTIONS_USUARIOS.md`
- **Detalhado**: `EDGE_FUNCTIONS_DETALHADO.md`
- **Referência Rápida**: `EDGE_FUNCTIONS_REFERENCIA_RAPIDA.md`
- **Sistema de Emails**: `EMAIL_PROCESSING_SYSTEM.md`
- **Relatório Diário**: `EDGE_FUNCTION_RELATORIO_EMAIL.md`

## 🎯 Edge Functions Disponíveis

### 📊 Relatórios de Inspeções

### 1. 📊 enviar-relatorio-diario
**Status**: ✅ Implementado

**⏰ Agendamento**
- Frequência: Diariamente às 8h UTC
- Cron: `0 8 * * *`

**🎯 Propósito**
Envia relatório diário consolidado de todas as inspeções realizadas no dia anterior, com estatísticas e lista detalhada.

**📊 Conteúdo**
- Estatísticas: Total, Aprovadas, Reprovadas, Pendentes, Com Plano de Ação
- Tabela com até 50 inspeções do dia anterior
- Design ISF IA (preto, verde, vermelho)

**📧 Destinatários**
- Email individual de cada usuário ativo
- Cada usuário recebe seu próprio relatório com suas inspeções
- O desenvolvedor também recebe um relatório consolidado via `DEV_EMAIL`

---

### 2. 📅 enviar-relatorio-semanal
**Status**: ✅ Implementado

**⏰ Agendamento**
- Frequência: Semanalmente (Segunda-feira às 8h UTC)
- Cron: `0 8 * * 1`

**🎯 Propósito**
Envia relatório semanal consolidado de todas as inspeções realizadas na semana anterior, com estatísticas agregadas e tendências.

**📊 Conteúdo**
- Estatísticas da semana:
  - Total de inspeções
  - Taxa de aprovação (%)
  - Equipamentos reprovados
  - Equipamentos com plano de ação criado
  - Tendência comparada com semana anterior
- Resumo por tipo de equipamento
- Top 10 equipamentos mais inspecionados
- Gráficos de distribuição por status

**📧 Destinatários**
- Email individual de cada usuário ativo
- Cada usuário recebe seu próprio relatório com suas inspeções
- O desenvolvedor também recebe um relatório consolidado via `DEV_EMAIL`

---

### 3. 📆 enviar-relatorio-mensal
**Status**: ✅ Implementado

**⏰ Agendamento**
- Frequência: Mensalmente (Dia 1 às 9h UTC)
- Cron: `0 9 1 * *`

**🎯 Propósito**
Envia relatório mensal executivo com estatísticas consolidadas, tendências e análises do mês anterior.

**📊 Conteúdo**
- Estatísticas mensais:
  - Total de inspeções
  - Taxa de aprovação mensal
  - Equipamentos reprovados
  - Equipamentos com plano de ação
  - Comparação com mês anterior
- Distribuição por tipo de equipamento
- Análise de tendências
- Equipamentos mais problemáticos
- Recomendações e insights

**📧 Destinatários**
- Email individual de cada usuário ativo
- Cada usuário recebe seu próprio relatório com suas inspeções
- O desenvolvedor também recebe um relatório consolidado via `DEV_EMAIL`

---

### 4. ⚠️ enviar-alertas-vencimento
**Status**: ✅ Implementado

**⏰ Agendamento**
- Frequência: Semanalmente (Segunda-feira às 9h UTC)
- Cron: `0 9 * * 1`

**🎯 Propósito**
Envia alertas semanais sobre equipamentos que estão próximos do vencimento ou já vencidos, permitindo ação preventiva.

**📊 Conteúdo**
- Equipamentos vencidos (crítico - ação imediata)
- Equipamentos vencendo em 7 dias (urgente)
- Equipamentos vencendo em 15 dias (atenção)
- Equipamentos vencendo em 30 dias (preventivo)
- Lista detalhada com:
  - ID do equipamento
  - Tipo de equipamento
  - Data de vencimento
  - Dias restantes/vencidos
  - Localização

**📧 Destinatários**
- Email individual de cada usuário ativo
- Cada usuário recebe seu próprio relatório com suas inspeções
- O desenvolvedor também recebe um relatório consolidado via `DEV_EMAIL`

**🔍 Lógica de Detecção**
- Verifica `data_proxima_inspecao` em todas as tabelas de equipamentos
- Verifica `data_proxima_manutencao_2_nivel` e `data_proxima_manutencao_3_nivel` para extintores
- Categoriza por prazo de vencimento

---

### 5. 🚨 enviar-notificacoes-pendencias
**Status**: ✅ Implementado

**⏰ Agendamento**
- Frequência: Semanalmente (Segunda-feira às 10h UTC)
- Cron: `0 10 * * 1`

**🎯 Propósito**
Envia notificações semanais sobre equipamentos reprovados que não possuem plano de ação definido, exigindo atenção imediata.

**📊 Conteúdo**
- Equipamentos reprovados sem plano de ação:
  - ID do equipamento
  - Tipo de equipamento
  - Data da reprovação
  - Status atual
  - Observações da inspeção
  - Localização
- Estatísticas:
  - Total de pendências
  - Por tipo de equipamento
  - Tempo desde a reprovação

**📧 Destinatários**
- Email individual de cada usuário ativo
- Cada usuário recebe seu próprio relatório com suas inspeções
- O desenvolvedor também recebe um relatório consolidado via `DEV_EMAIL`

**🔍 Lógica de Detecção**
- Busca inspeções com `status_geral = 'reprovado'` ou `status = 'reprovado'`
- Filtra apenas aquelas com `plano_de_acao` vazio ou null
- Considera inspeções dos últimos 90 dias

---

## 🔄 Fluxo Completo do Sistema

### Cenário 1: Relatório Diário
```
1. Cron job executa (diário 8h UTC)
   ↓
2. enviar-relatorio-diario
   ├─ Busca inspeções do dia anterior
   ├─ Calcula estatísticas
   ├─ Gera HTML com design ISF IA
   └─ Envia email para destinatários
   ↓
3. Destinatários recebem relatório diário
```

### Cenário 2: Relatório Semanal
```
1. Cron job executa (segunda 8h UTC)
   ↓
2. enviar-relatorio-semanal
   ├─ Busca inspeções da semana anterior
   ├─ Calcula estatísticas agregadas
   ├─ Compara com semana anterior
   ├─ Gera HTML com gráficos
   └─ Envia email para destinatários
   ↓
3. Destinatários recebem relatório semanal
```

### Cenário 3: Relatório Mensal
```
1. Cron job executa (dia 1 às 9h UTC)
   ↓
2. enviar-relatorio-mensal
   ├─ Busca inspeções do mês anterior
   ├─ Calcula estatísticas mensais
   ├─ Analisa tendências
   ├─ Gera HTML executivo
   └─ Envia email para destinatários
   ↓
3. Destinatários recebem relatório mensal
```

### Cenário 4: Alertas de Vencimento
```
1. Cron job executa (segunda 9h UTC)
   ↓
2. enviar-alertas-vencimento
   ├─ Busca equipamentos com datas próximas
   ├─ Categoriza por prazo (vencido, 7d, 15d, 30d)
   ├─ Gera HTML com alertas
   └─ Envia email para destinatários
   ↓
3. Destinatários recebem alertas de vencimento
```

### Cenário 5: Notificações de Pendências
```
1. Cron job executa (segunda 10h UTC)
   ↓
2. enviar-notificacoes-pendencias
   ├─ Busca equipamentos reprovados sem plano
   ├─ Calcula tempo desde reprovação
   ├─ Gera HTML com lista de pendências
   └─ Envia email para destinatários
   ↓
3. Destinatários recebem notificações de pendências
```

### Cenário 6: Email de Boas-vindas
```
1. Usuário faz cadastro (supabase.auth.signUp)
   ↓
2. Database trigger detecta novo usuário
   ↓
3. enviar-email-boas-vindas
   ├─ Busca dados do usuário
   ├─ Gera HTML de boas-vindas
   └─ Envia email para novo usuário
   ↓
4. Novo usuário recebe email de boas-vindas
```

### Cenário 7: Lembrete de Inatividade
```
1. Cron job executa (segunda 11h UTC)
   ↓
2. enviar-lembrete-inatividade
   ├─ Busca usuários inativos há mais de 7 dias
   ├─ Verifica se já recebeu lembrete recente
   ├─ Gera HTML de lembrete
   └─ Envia email para usuários inativos
   ↓
3. Usuários inativos recebem lembrete
```

### Cenário 8: Upgrade para Premium
```
1. Usuário faz upgrade (plan muda para 'premium')
   ↓
2. Database trigger detecta mudança
   ↓
3. enviar-email-upgrade-premium
   ├─ Busca dados do usuário
   ├─ Gera HTML de parabéns
   └─ Envia email para usuário
   ↓
4. Usuário recebe email de parabéns
```

### Cenário 9: Trial Expirando
```
1. Cron job executa (diário 10h UTC)
   ↓
2. enviar-notificacao-trial-expirando
   ├─ Busca usuários com trial
   ├─ Categoriza por prazo (expirado, hoje, amanhã, 3 dias)
   ├─ Gera HTML de notificação
   └─ Envia email para usuários
   ↓
3. Usuários recebem notificação sobre trial
```

### Cenário 10: Solicitação Premium
```
1. Usuário com trial expirado tenta acessar
   ↓
2. Sistema detecta trial expirado
   ↓
3. enviar-solicitacao-premium
   ├─ Gera HTML com instruções
   └─ Envia email para usuário
   ↓
4. Usuário recebe email com instruções
```

### Cenário 11: Notificações para Dev
```
1. Cron job executa (diário 12h UTC)
   ↓
2. enviar-notificacoes-dev
   ├─ Busca novos feedbacks (últimas 24h)
   ├─ Busca novos usuários (últimas 24h)
   ├─ Gera HTML com resumo
   └─ Envia email para dev
   ↓
3. Dev recebe notificações diárias
```

---

## 📊 Comparação das Funções

### Relatórios de Inspeções

| Função | Frequência | Horário | Foco | Header |
|--------|-----------|---------|------|--------|
| **enviar-relatorio-diario** | Diário | 8h UTC | Inspeções do dia anterior | Preto |
| **enviar-relatorio-semanal** | Semanal | Segunda 8h | Inspeções da semana | Verde |
| **enviar-relatorio-mensal** | Mensal | Dia 1, 9h | Estatísticas mensais | Azul |
| **enviar-alertas-vencimento** | Semanal | Segunda 9h | Equipamentos vencendo | Vermelho |
| **enviar-notificacoes-pendencias** | Semanal | Segunda 10h | Reprovados sem plano | Amarelo |

### Emails para Usuários

| Função | Frequência | Horário | Foco | Header |
|--------|-----------|---------|------|--------|
| **enviar-email-boas-vindas** | Imediato | On signup | Boas-vindas | Verde |
| **enviar-lembrete-inatividade** | Semanal | Segunda 11h | Usuários inativos | Amarelo |
| **enviar-email-upgrade-premium** | Imediato | On upgrade | Parabéns premium | Dourado |
| **enviar-notificacao-trial-expirando** | Diário | 10h UTC | Trial expirando | Vermelho |
| **enviar-solicitacao-premium** | Imediato | Trial expirado | Solicitar premium | Vermelho |
| **enviar-notificacoes-dev** | Diário | 12h UTC | Novos feedbacks/usuários | Azul |

---

## 🔑 Conceitos Importantes

### Categorização de Vencimentos

**Por que categorizar?**
- Diferentes prazos requerem diferentes ações
- Priorização clara (vencidos > 7 dias > 15 dias > 30 dias)
- Planejamento preventivo

**Categorias:**
- 🔴 **Vencidos**: Ação imediata necessária
- 🟠 **Próximos 7 dias**: Ação urgente
- 🟡 **Próximos 15 dias**: Atenção, planejamento
- 🟢 **Próximos 30 dias**: Preventivo, planejamento futuro

### Detecção de Pendências

**Critérios:**
- `status_geral = 'reprovado'` OU `status = 'reprovado'`
- `plano_de_acao` vazio, null ou 'N/A'
- Inspeção dos últimos 90 dias

**Por que 90 dias?**
- Foca em pendências recentes
- Evita spam de pendências antigas
- Prioriza ações imediatas

### Agrupamento de Dados

**Por que agrupar?**
- Um equipamento pode ter múltiplas inspeções
- Queremos mostrar apenas a mais recente
- Evita confusão e informação duplicada

**Regras:**
- Por equipamento: Pega a inspeção mais recente
- Por tipo: Agrupa estatísticas por tipo de equipamento
- Por data: Agrupa por período (dia, semana, mês)

---

## ⚙️ Configuração

### Secrets Necessárias

Todas as funções usam as mesmas secrets:

**Secrets para Todas as Funções:**
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
- **Não usa `EMAIL_TO`**: Cada usuário recebe seu próprio relatório personalizado com seus dados

### Cron Jobs SQL

```sql
-- Relatório Diário (8h UTC diariamente)
SELECT cron.schedule(
  'enviar-relatorio-diario',
  '0 8 * * *',
  $$
  SELECT public.enviar_relatorio_diario();
  $$
);

-- Relatório Semanal (Segunda 8h UTC)
SELECT cron.schedule(
  'enviar-relatorio-semanal',
  '0 8 * * 1',
  $$
  SELECT public.enviar_relatorio_semanal();
  $$
);

-- Relatório Mensal (Dia 1, 9h UTC)
SELECT cron.schedule(
  'enviar-relatorio-mensal',
  '0 9 1 * *',
  $$
  SELECT public.enviar_relatorio_mensal();
  $$
);

-- Alertas de Vencimento (Segunda 9h UTC)
SELECT cron.schedule(
  'enviar-alertas-vencimento',
  '0 9 * * 1',
  $$
  SELECT public.enviar_alertas_vencimento();
  $$
);

-- Notificações de Pendências (Segunda 10h UTC)
SELECT cron.schedule(
  'enviar-notificacoes-pendencias',
  '0 10 * * 1',
  $$
  SELECT public.enviar_notificacoes_pendencias();
  $$
);

-- Lembrete de Inatividade (Segunda 11h UTC)
SELECT cron.schedule(
  'enviar-lembrete-inatividade',
  '0 11 * * 1',
  $$
  SELECT public.enviar_lembrete_inatividade();
  $$
);

-- Notificação Trial Expirando (Diário 10h UTC)
SELECT cron.schedule(
  'enviar-notificacao-trial-expirando',
  '0 10 * * *',
  $$
  SELECT public.enviar_notificacao_trial_expirando();
  $$
);

-- Notificações para Dev (Diário 12h UTC)
SELECT cron.schedule(
  'enviar-notificacoes-dev',
  '0 12 * * *',
  $$
  SELECT public.enviar_notificacoes_dev();
  $$
);
```

### Database Triggers

```sql
-- Trigger para email de boas-vindas (on signup)
CREATE OR REPLACE FUNCTION public.on_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/enviar-email-boas-vindas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'created_at', NEW.created_at
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_user();

-- Trigger para email de upgrade (on upgrade to premium)
CREATE OR REPLACE FUNCTION public.on_user_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  IF OLD.plan = 'trial' AND NEW.plan = 'premium' THEN
    PERFORM net.http_post(
      url := 'https://seu-projeto.supabase.co/functions/v1/enviar-email-upgrade-premium',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || service_role_key
      ),
      body := jsonb_build_object(
        'user_id', NEW.id,
        'email', (SELECT email FROM auth.users WHERE id = NEW.id),
        'full_name', NEW.full_name
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_profile_upgrade
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.on_user_upgrade();
```

---

## 📝 Notas Finais

- ✅ Todas as funções são independentes
- ✅ Todas usam SMTP direto (porta 465)
- ✅ Todas seguem design ISF IA
- ✅ Todas têm tratamento de erros
- ✅ Sistema preventivo e reativo
- ✅ Logs detalhados para debugging
- ✅ Sistema de email_logs para evitar spam
- ✅ Triggers para eventos imediatos (signup, upgrade)
- ✅ Cron jobs para eventos periódicos (lembretes, notificações)

---

## 📚 Documentação Relacionada

- **Emails para Usuários**: `EDGE_FUNCTIONS_USUARIOS.md` (detalhado)
- **Detalhado**: `EDGE_FUNCTIONS_DETALHADO.md`
- **Referência Rápida**: `EDGE_FUNCTIONS_REFERENCIA_RAPIDA.md`
- **Sistema de Emails**: `EMAIL_PROCESSING_SYSTEM.md`

## 🎉 Status Atual

✅ **11 Edge Functions documentadas**
✅ **5 Relatórios de Inspeções** (diário, semanal, mensal, alertas, pendências)
✅ **6 Emails para Usuários** (boas-vindas, lembrete, upgrade, trial, solicitação, dev)
✅ Código limpo e bem estruturado
✅ Lógica consistente entre funções
✅ Templates HTML padronizados
✅ Sistema completo e operacional

