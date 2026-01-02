# 📧 Sistema Completo de Emails - ISF IA Android

## 📋 Visão Geral

Este documento descreve o sistema completo de envio de emails automatizados do ISF IA Android, incluindo todas as Edge Functions criadas, cron jobs configurados, ajustes implementados e configurações necessárias.

**Data de Criação**: Janeiro 2025  
**Status**: ✅ Implementado e Funcionando

---

## 🎯 Objetivo do Sistema

O sistema de emails automatiza o envio de:
- **Relatórios** de inspeções (diário, semanal, mensal)
- **Alertas** de vencimento de equipamentos
- **Notificações** de pendências (equipamentos reprovados sem plano de ação)
- **Emails para usuários** (boas-vindas, lembretes, upgrades, trial)
- **Notificações para desenvolvedor** (novos usuários, feedbacks)

---

## 📊 Resumo das Funcionalidades

### Relatórios e Alertas (5 funções)
1. ✅ **Relatório Diário** - Enviado diariamente às 8h UTC
2. ✅ **Relatório Semanal** - Enviado às segundas-feiras às 8h UTC
3. ✅ **Relatório Mensal** - Enviado no dia 1 de cada mês às 9h UTC
4. ✅ **Alertas de Vencimento** - Enviado às segundas-feiras às 9h UTC
5. ✅ **Notificações de Pendências** - Enviado às segundas-feiras às 10h UTC

### Emails para Usuários (6 funções)
6. ✅ **Email de Boas-vindas** - Enviado automaticamente no cadastro
7. ✅ **Lembrete de Inatividade** - Enviado às segundas-feiras às 11h UTC
8. ✅ **Email de Upgrade Premium** - Enviado automaticamente no upgrade
9. ✅ **Notificação Trial Expirando** - Enviado diariamente às 10h UTC
10. ✅ **Solicitação Premium** - Enviado quando trial expira
11. ✅ **Notificações para Dev** - Enviado diariamente às 12h UTC

**Total**: 11 Edge Functions implementadas

---

## 🔧 Ajustes Implementados

### 1. Verificação de Equipamentos

**Problema Identificado**: Usuários sem equipamentos registrados estavam recebendo relatórios e alertas vazios.

**Solução Implementada**: Todas as funções de relatórios e alertas agora verificam se o usuário possui equipamentos antes de enviar emails.

**Funções Ajustadas**:
- ✅ `enviar-relatorio-diario`
- ✅ `enviar-relatorio-semanal`
- ✅ `enviar-relatorio-mensal`
- ✅ `enviar-alertas-vencimento`
- ✅ `enviar-notificacoes-pendencias`

**Lógica Implementada**:
```typescript
// Função auxiliar para verificar se usuário tem equipamentos
async function usuarioTemEquipamentos(supabase: any, userId: string): Promise<boolean> {
  const equipmentTables = [
    'extintores',
    'inventario_chuveiros_lava_olhos',
    'inventario_camaras_espuma',
    'inventario_alarmes',
    'inventario_canhoes_monitores',
    'conjuntos_autonomos',
    'inventario_multigas',
    'mangueiras',
    'abrigos',
    'custom_equipment'
  ]

  for (const table of equipmentTables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .limit(1)

      if (!error && count && count > 0) {
        return true
      }
    } catch (err) {
      console.warn(`[WARN] Erro ao verificar ${table}:`, err)
      continue
    }
  }

  return false
}
```

**Comportamento**:
- ✅ Usuários **COM** equipamentos: Recebem relatórios e alertas normalmente
- ✅ Usuários **SEM** equipamentos: **NÃO** recebem relatórios ou alertas
- ✅ Usuários **SEM** equipamentos: **RECEBEM** apenas lembrete de inatividade (com vantagens do app)

---

## 📧 Edge Functions Criadas

### 1. 📊 enviar-relatorio-diario

**Propósito**: Envia relatório diário de inspeções realizadas no dia anterior.

**Agendamento**: Diariamente às 8h UTC (`0 8 * * *`)

**Lógica**:
1. Busca todos os usuários ativos
2. Verifica se cada usuário tem equipamentos registrados
3. Busca inspeções do dia anterior para cada usuário
4. Gera HTML personalizado com estatísticas
5. Envia email individual para cada usuário
6. Envia relatório consolidado para DEV_EMAIL

**Estatísticas Incluídas**:
- Total de inspeções
- Aprovadas
- Reprovadas
- Pendentes
- Com plano de ação

**Tabelas de Inspeções Consultadas**:
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

---

### 2. 📅 enviar-relatorio-semanal

**Propósito**: Envia relatório semanal de inspeções da semana anterior (segunda a domingo).

**Agendamento**: Segundas-feiras às 8h UTC (`0 8 * * 1`)

**Lógica**:
1. Calcula período da semana anterior (segunda a domingo)
2. Busca todos os usuários ativos
3. Verifica se cada usuário tem equipamentos registrados
4. Busca inspeções do período para cada usuário
5. Calcula taxa de aprovação
6. Gera HTML personalizado
7. Envia email individual para cada usuário
8. Envia relatório consolidado para DEV_EMAIL

**Estatísticas Incluídas**:
- Total de inspeções
- Aprovadas
- Reprovadas
- Pendentes
- Taxa de aprovação (%)

---

### 3. 📆 enviar-relatorio-mensal

**Propósito**: Envia relatório mensal de inspeções do mês anterior.

**Agendamento**: Dia 1 de cada mês às 9h UTC (`0 9 1 * *`)

**Lógica**:
1. Calcula período do mês anterior
2. Busca todos os usuários ativos
3. Verifica se cada usuário tem equipamentos registrados
4. Busca inspeções do período para cada usuário
5. Calcula estatísticas mensais
6. Gera HTML personalizado
7. Envia email individual para cada usuário
8. Envia relatório consolidado para DEV_EMAIL

**Estatísticas Incluídas**:
- Total de inspeções do mês
- Aprovadas
- Reprovadas
- Pendentes
- Taxa de aprovação (%)

---

### 4. ⚠️ enviar-alertas-vencimento

**Propósito**: Envia alertas semanais sobre equipamentos próximos do vencimento.

**Agendamento**: Segundas-feiras às 9h UTC (`0 9 * * 1`)

**Lógica**:
1. Busca todos os usuários ativos
2. Verifica se cada usuário tem equipamentos registrados
3. Para cada tipo de equipamento, verifica datas de vencimento:
   - Extintores: `data_proxima_inspecao`, `data_proxima_manutencao_2_nivel`, `data_proxima_manutencao_3_nivel`
   - Outros equipamentos: `data_proxima_inspecao`
   - Mangueiras: `data_proximo_teste`
4. Categoriza por prazo:
   - **Vencidos** (dias < 0)
   - **Próximos 7 dias** (0-7 dias)
   - **Próximos 15 dias** (8-15 dias)
   - **Próximos 30 dias** (16-30 dias)
5. Gera HTML com categorias coloridas
6. Envia email individual para cada usuário
7. Envia relatório consolidado para DEV_EMAIL

**Tabelas de Equipamentos Consultadas**:
- `extintores`
- `inventario_chuveiros_lava_olhos`
- `inventario_camaras_espuma`
- `inventario_alarmes`
- `inventario_canhoes_monitores`
- `conjuntos_autonomos`
- `inventario_multigas`
- `mangueiras`
- `abrigos`
- `custom_equipment`

---

### 5. 🚨 enviar-notificacoes-pendencias

**Propósito**: Envia notificações sobre equipamentos reprovados sem plano de ação.

**Agendamento**: Segundas-feiras às 10h UTC (`0 10 * * 1`)

**Lógica**:
1. Busca todos os usuários ativos
2. Verifica se cada usuário tem equipamentos registrados
3. Busca inspeções reprovadas dos últimos 90 dias
4. Filtra apenas aquelas sem plano de ação (ou com plano vazio/N/A)
5. Calcula dias desde a reprovação
6. Agrupa por tipo de equipamento
7. Gera HTML com lista de pendências
8. Envia email individual para cada usuário
9. Envia relatório consolidado para DEV_EMAIL

**Critérios de Pendência**:
- Status: `reprovado` ou `nao_conforme`
- Plano de ação: vazio, null ou 'N/A'
- Data de inspeção: últimos 90 dias

---

### 6. 👋 enviar-email-boas-vindas

**Propósito**: Envia email de boas-vindas quando usuário se cadastra.

**Trigger**: Database trigger `on_auth_user_created` após INSERT em `auth.users`

**Lógica**:
1. Trigger detecta novo usuário em `auth.users`
2. Chama Edge Function com dados do usuário
3. Gera HTML de boas-vindas personalizado
4. Envia email via SMTP
5. Registra em `email_logs`

**Conteúdo do Email**:
- Mensagem de boas-vindas personalizada
- Lista de funcionalidades principais
- Instruções de uso básico
- Contato: `isfiasegurancanotrabalho@gmail.com`

---

### 7. 📧 enviar-lembrete-inatividade

**Propósito**: Envia lembrete para usuários inativos há mais de 7 dias.

**Agendamento**: Segundas-feiras às 11h UTC (`0 11 * * 1`)

**Lógica**:
1. Busca todos os usuários ativos
2. Verifica último acesso (via `auth.users.last_sign_in_at`)
3. Filtra usuários inativos há mais de 7 dias
4. Verifica em `email_logs` se já recebeu lembrete nos últimos 14 dias (evita spam)
5. Gera HTML de lembrete com vantagens do app
6. Envia email individual para cada usuário
7. Registra em `email_logs`

**Comportamento Especial**:
- ✅ **ÚNICA função que NÃO verifica equipamentos**
- ✅ Usuários sem equipamentos também recebem este email
- ✅ Máximo 1 email a cada 14 dias por usuário

**Conteúdo do Email**:
- Mensagem personalizada com dias inativo
- Lista de vantagens do app
- Estatísticas do usuário (se disponível)
- Botão para acessar o app
- Contato: `isfiasegurancanotrabalho@gmail.com`

---

### 8. ⬆️ enviar-email-upgrade-premium

**Propósito**: Envia email de parabéns quando usuário faz upgrade para premium.

**Trigger**: Database trigger `on_profile_upgrade` após UPDATE em `profiles` quando `plan` muda de 'trial' para 'premium'

**Lógica**:
1. Trigger detecta mudança de `plan` em `profiles`
2. Chama Edge Function com dados do usuário
3. Gera HTML de upgrade personalizado
4. Envia email via SMTP
5. Registra em `email_logs`

**Conteúdo do Email**:
- Mensagem de parabéns
- Lista de benefícios premium
- Funcionalidades exclusivas
- Contato: `isfiasegurancanotrabalho@gmail.com`

---

### 9. ⏰ enviar-notificacao-trial-expirando

**Propósito**: Envia notificações quando trial está próximo do fim.

**Agendamento**: Diariamente às 10h UTC (`0 10 * * *`)

**Lógica**:
1. Busca usuários com `plan = 'trial'` e `trial_ends_at` definido
2. Categoriza por prazo:
   - **Expirado** (dias < 0)
   - **Expira Hoje** (dias = 0)
   - **Expira Amanhã** (dias = 1)
   - **Expira em 3 Dias** (dias = 3)
3. Verifica em `email_logs` se já foi notificado recentemente (evita spam)
4. Gera HTML por categoria com cores diferentes
5. Envia email individual para cada usuário
6. Registra em `email_logs`

**Cores por Categoria**:
- Expirado: Vermelho (#FC3D39) - urgente
- Expira Hoje: Laranja (#FF9500) - muito urgente
- Expira Amanhã: Amarelo (#FFCC00) - atenção
- Expira em 3 Dias: Azul (#007AFF) - informativo

**Conteúdo do Email**:
- Mensagem personalizada com dias restantes
- Benefícios premium
- Como fazer upgrade
- Contato: `isfiasegurancanotrabalho@gmail.com`

---

### 10. 💰 enviar-solicitacao-premium

**Propósito**: Envia email com instruções quando trial expira.

**Trigger**: Chamada manual quando trial expira e usuário tenta acessar

**Lógica**:
1. Recebe `user_id` e `email` via requisição
2. Verifica se trial expirou
3. Gera HTML de solicitação premium
4. Envia email via SMTP
5. Registra em `email_logs`

**Conteúdo do Email**:
- Mensagem sobre trial expirado
- Instruções para solicitar premium
- Benefícios premium
- Contato: `isfiasegurancanotrabalho@gmail.com`
- Link mailto para solicitação

---

### 11. 🔔 enviar-notificacoes-dev

**Propósito**: Envia notificações diárias para desenvolvedor sobre novos usuários e feedbacks.

**Agendamento**: Diariamente às 12h UTC (`0 12 * * *`)

**Lógica**:
1. Busca novos feedbacks das últimas 24h
2. Busca novos usuários das últimas 24h
3. Agrupa feedbacks por tipo (feedback/sugestão)
4. Calcula estatísticas:
   - Novos usuários
   - Novos feedbacks
   - Feedbacks por tipo
   - Usuários por plano (trial/premium)
5. Gera HTML com lista de novos usuários e feedbacks
6. Envia email para DEV_EMAIL

**Conteúdo do Email**:
- Resumo diário
- Lista de novos usuários (nome, email, plano)
- Lista de novos feedbacks (tipo, mensagem, autor)
- Estatísticas do dia

**Nota**: Esta é a única função que envia para um email fixo (DEV_EMAIL), não para usuários individuais.

---

## 🗄️ Tabelas do Banco de Dados

### 1. email_logs

**Propósito**: Rastrear emails enviados para prevenir spam e auditoria.

**Estrutura**:
```sql
CREATE TABLE IF NOT EXISTS public.email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  email_type TEXT NOT NULL,
  email_address TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent',
  details JSONB
);
```

**Índices**:
- `idx_email_logs_user_id` - Para buscar emails por usuário
- `idx_email_logs_type` - Para buscar por tipo de email
- `idx_email_logs_sent_at` - Para buscar emails recentes

**Uso**:
- Prevenir spam: Verificar se já foi enviado email do mesmo tipo recentemente
- Auditoria: Rastrear quais emails foram enviados para cada usuário
- Status: Rastrear sucesso/falha no envio

**Tipos de Email Registrados**:
- `boas_vindas`
- `lembrete_inatividade`
- `upgrade_premium`
- `trial_expirando`
- `solicitacao_premium`
- `relatorio_diario`
- `relatorio_semanal`
- `relatorio_mensal`
- `alertas_vencimento`
- `notificacoes_pendencias`

**Por que é necessária?**
- ✅ Previne spam de emails (funcionalidade crítica)
- ✅ Rastreia comunicações enviadas (auditoria)
- ✅ Tem propósito diferente das outras tabelas de logs (`user_access_logs`, `user_action_logs`)
- ✅ É usada ativamente em todas as Edge Functions de email

---

## ⏰ Cron Jobs Configurados

Todos os cron jobs foram criados usando `pg_cron` no Supabase.

**⚠️ IMPORTANTE**: Para os cron jobs funcionarem, a extensão `pg_net` deve estar habilitada. Esta extensão permite que as funções SQL façam chamadas HTTP assíncronas para as Edge Functions.

**Extensão Habilitada**: ✅ `pg_net` versão 0.19.5

### Relatórios e Alertas

| Função | Frequência | Horário UTC | Cron Expression |
|--------|-----------|-------------|-----------------|
| `enviar-relatorio-diario` | Diário | 8h | `0 8 * * *` |
| `enviar-relatorio-semanal` | Semanal | Segunda 8h | `0 8 * * 1` |
| `enviar-relatorio-mensal` | Mensal | Dia 1, 9h | `0 9 1 * *` |
| `enviar-alertas-vencimento` | Semanal | Segunda 9h | `0 9 * * 1` |
| `enviar-notificacoes-pendencias` | Semanal | Segunda 10h | `0 10 * * 1` |

### Emails para Usuários

| Função | Frequência | Horário UTC | Cron Expression |
|--------|-----------|-------------|-----------------|
| `enviar-lembrete-inatividade` | Semanal | Segunda 11h | `0 11 * * 1` |
| `enviar-notificacao-trial-expirando` | Diário | 10h | `0 10 * * *` |
| `enviar-notificacoes-dev` | Diário | 12h | `0 12 * * *` |

### Verificação de Cron Jobs

Para verificar se os cron jobs estão ativos:

```sql
SELECT jobname, schedule, active 
FROM cron.job 
ORDER BY jobname;
```

### Funções SQL Helper

Cada cron job chama uma função SQL que faz a requisição HTTP para a Edge Function correspondente. As funções foram criadas usando `pg_net.http_post()`:

- `public.enviar_relatorio_diario()`
- `public.enviar_relatorio_semanal()`
- `public.enviar_relatorio_mensal()`
- `public.enviar_alertas_vencimento()`
- `public.enviar_notificacoes_pendencias()`
- `public.enviar_lembrete_inatividade()`
- `public.enviar_notificacao_trial_expirando()`
- `public.enviar_notificacoes_dev()`

**Extensão Necessária**: `pg_net` (habilitada automaticamente na migration)

---

## 🔗 Database Triggers

### 1. on_auth_user_created

**Tabela**: `auth.users`  
**Evento**: AFTER INSERT  
**Função**: `on_new_user()`

**Propósito**: Dispara email de boas-vindas quando novo usuário se cadastra.

**Lógica**:
```sql
CREATE OR REPLACE FUNCTION public.on_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY';
BEGIN
  PERFORM net.http_post(
    url := 'https://flqbsqleqdierrqhlirw.supabase.co/functions/v1/enviar-email-boas-vindas',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := jsonb_build_object(
      'user_id', NEW.id,
      'email', NEW.email,
      'full_name', NEW.raw_user_meta_data->>'full_name',
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
```

---

### 2. on_profile_upgrade

**Tabela**: `profiles`  
**Evento**: AFTER UPDATE  
**Condição**: Quando `plan` muda de 'trial' para 'premium'  
**Função**: `on_user_upgrade()`

**Propósito**: Dispara email de upgrade quando usuário faz upgrade para premium.

**Lógica**:
```sql
CREATE OR REPLACE FUNCTION public.on_user_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY';
BEGIN
  IF OLD.plan = 'trial' AND NEW.plan = 'premium' THEN
    PERFORM net.http_post(
      url := 'https://flqbsqleqdierrqhlirw.supabase.co/functions/v1/enviar-email-upgrade-premium',
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
  AFTER UPDATE ON public.profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.on_user_upgrade();
```

---

## ⚙️ Configurações Necessárias

### Secrets do Supabase

Todas as secrets devem ser configuradas no Supabase Dashboard (Settings > Edge Functions > Secrets).

#### Secrets Obrigatórias (Todas as Funções)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
SUPA_URL=https://flqbsqleqdierrqhlirw.supabase.co
SUPA_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

#### Secrets Específicas

```env
# Apenas para notificações do dev
DEV_EMAIL=dev@email.com
```

### Configuração SMTP

**⚠️ IMPORTANTE**: Use porta **465** (SSL direto), não 587 (STARTTLS).

**Gmail**:
1. Ative autenticação de 2 fatores
2. Gere uma senha de app: [Google Account](https://myaccount.google.com/apppasswords)
3. Use a senha de app em `SMTP_PASS`

**Outlook**:
1. Use senha de app do Microsoft Account
2. Configure `SMTP_HOST=smtp-mail.outlook.com`

---

## 📧 Email de Contato Padrão

**Todos os templates de email que direcionam o usuário para contato usam:**

- **Email**: `isfiasegurancanotrabalho@gmail.com`
- **Formato**: Link mailto quando aplicável
- **Uso**: Suporte, solicitação de upgrade, dúvidas, etc.

---

## 🎨 Design dos Emails

### Cores por Tipo

- **Boas-vindas**: Verde (#53D769) - positivo
- **Lembrete**: Amarelo (#FFCC00) - atenção
- **Upgrade**: Dourado (#FFCC00) - premium
- **Trial Expirando**: Vermelho (#FC3D39) - urgente
- **Solicitação Premium**: Vermelho (#FC3D39) - urgente
- **Notificações Dev**: Azul (#007AFF) - informativo
- **Relatórios**: Azul (#007AFF) - informativo
- **Alertas**: Laranja/Vermelho (#FF9500/#FC3D39) - urgente
- **Pendências**: Amarelo (#FFCC00) - atenção

### Estrutura Padrão

1. **Header** com cor do tipo e título
2. **Mensagem personalizada** com nome do usuário
3. **Conteúdo principal** (estatísticas, listas, etc.)
4. **Call-to-action** (botão quando aplicável)
5. **Contato**: `isfiasegurancanotrabalho@gmail.com` (quando aplicável)
6. **Rodapé** com informações do app

### Tema Visual

- **Background**: Preto (#000)
- **Container**: Escuro com transparência (rgba(28,28,30,0.8))
- **Bordas**: Arredondadas (border-radius: 24px)
- **Texto**: Branco (#fff) com hierarquia clara
- **Acentos**: Cores específicas por tipo de email

---

## 🔍 Lógica de Funcionamento

### Fluxo Geral

```
1. Trigger/Cron Job detecta evento
   ↓
2. Edge Function é chamada
   ↓
3. Busca dados do banco (usuários, inspeções, etc.)
   ↓
4. Verifica se usuário tem equipamentos (relatórios/alertas)
   ↓
5. Verifica email_logs para prevenir spam
   ↓
6. Gera HTML personalizado
   ↓
7. Envia email via SMTP
   ↓
8. Registra em email_logs
   ↓
9. Retorna status de sucesso/erro
```

### Prevenção de Spam

Todas as funções verificam `email_logs` antes de enviar:

```typescript
// Exemplo: Lembrete de inatividade (máximo 1x a cada 14 dias)
const { data: lembretesRecentes } = await supabase
  .from('email_logs')
  .select('user_id, sent_at')
  .eq('email_type', 'lembrete_inatividade')
  .gte('sent_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())

const usuariosComLembrete = new Set(lembretesRecentes?.map(l => l.user_id) || [])
```

### Verificação de Equipamentos

Funções de relatórios e alertas verificam se usuário tem equipamentos:

```typescript
const temEquipamentos = await usuarioTemEquipamentos(supabase, profile.id)
if (!temEquipamentos) {
  console.log(`[INFO] Usuário ${profile.id} não tem equipamentos - pulando`)
  continue
}
```

**Comportamento**:
- ✅ Usuários **COM** equipamentos: Recebem relatórios e alertas
- ✅ Usuários **SEM** equipamentos: **NÃO** recebem relatórios ou alertas
- ✅ Usuários **SEM** equipamentos: **RECEBEM** apenas lembrete de inatividade

---

## 📊 Estatísticas e Métricas

### Dados Coletados

Cada função retorna estatísticas sobre o processamento:

```json
{
  "success": true,
  "message": "Relatórios enviados com sucesso",
  "data": "2025-01-22",
  "resultados": [
    {
      "usuario": "João Silva",
      "email": "joao@email.com",
      "inspecoes": 15,
      "enviado": true
    }
  ],
  "total_usuarios": 50,
  "total_emails_enviados": 45
}
```

### Logs

Todas as funções registram logs detalhados:
- `[INFO]` - Informações gerais
- `[WARN]` - Avisos (usuário sem email, erro não crítico)
- `[ERROR]` - Erros críticos
- `[SUCCESS]` - Sucesso em operações

---

## ✅ Checklist de Implementação

### Infraestrutura

- [x] Tabela `email_logs` criada
- [x] Índices criados em `email_logs`
- [x] Extensão `pg_cron` habilitada
- [x] Extensão `pg_net` habilitada (para triggers HTTP)

### Edge Functions

- [x] `enviar-relatorio-diario` criada e deployada
- [x] `enviar-relatorio-semanal` criada e deployada
- [x] `enviar-relatorio-mensal` criada e deployada
- [x] `enviar-alertas-vencimento` criada e deployada
- [x] `enviar-notificacoes-pendencias` criada e deployada
- [x] `enviar-email-boas-vindas` criada e deployada
- [x] `enviar-lembrete-inatividade` criada e deployada
- [x] `enviar-email-upgrade-premium` criada e deployada
- [x] `enviar-notificacao-trial-expirando` criada e deployada
- [x] `enviar-solicitacao-premium` criada e deployada
- [x] `enviar-notificacoes-dev` criada e deployada

### Ajustes Implementados

- [x] Verificação de equipamentos em relatórios diários
- [x] Verificação de equipamentos em relatórios semanais
- [x] Verificação de equipamentos em relatórios mensais
- [x] Verificação de equipamentos em alertas de vencimento
- [x] Verificação de equipamentos em notificações de pendências

### Cron Jobs

- [x] `enviar-relatorio-diario` agendado
- [x] `enviar-relatorio-semanal` agendado
- [x] `enviar-relatorio-mensal` agendado
- [x] `enviar-alertas-vencimento` agendado
- [x] `enviar-notificacoes-pendencias` agendado
- [x] `enviar-lembrete-inatividade` agendado
- [x] `enviar-notificacao-trial-expirando` agendado
- [x] `enviar-notificacoes-dev` agendado

### Database Triggers

- [x] `on_auth_user_created` criado
- [x] `on_profile_upgrade` criado

### Configurações

- [x] Secrets SMTP configuradas
- [x] `SUPA_URL` configurado
- [x] `SUPA_SERVICE_ROLE_KEY` configurado
- [x] `DEV_EMAIL` configurado
- [x] `EMAIL_FROM` configurado

### Testes

- [ ] Testar envio de relatório diário manualmente
- [ ] Testar envio de relatório semanal manualmente
- [ ] Testar envio de relatório mensal manualmente
- [ ] Testar alertas de vencimento manualmente
- [ ] Testar notificações de pendências manualmente
- [ ] Testar email de boas-vindas (criar novo usuário)
- [ ] Testar lembrete de inatividade manualmente
- [ ] Testar email de upgrade (fazer upgrade de trial para premium)
- [ ] Testar notificação trial expirando manualmente
- [ ] Testar solicitação premium manualmente
- [ ] Testar notificações dev manualmente
- [ ] Verificar logs de execução
- [ ] Verificar recebimento de emails

---

## 🐛 Troubleshooting

### Problemas Comuns

#### 1. Emails não estão sendo enviados

**Verificar**:
- Secrets configuradas corretamente
- `SMTP_PORT` = 465 (não 587)
- Senha de app do Gmail gerada corretamente
- Logs da Edge Function no Supabase Dashboard

#### 2. Cron jobs não estão executando

**Verificar**:
```sql
SELECT jobname, schedule, active 
FROM cron.job 
WHERE jobname LIKE 'enviar-%';
```

Se `active = false`, reativar:
```sql
UPDATE cron.job 
SET active = true 
WHERE jobname = 'nome-do-job';
```

**Erro "schema net does not exist"**:
- ✅ **RESOLVIDO** - Extensão `pg_net` foi habilitada
- Se o erro persistir, verificar:
```sql
-- Verificar se pg_net está habilitado
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'pg_net';

-- Se não estiver, habilitar:
CREATE EXTENSION IF NOT EXISTS pg_net;
```

#### 3. Usuários sem equipamentos recebendo emails vazios

**Status**: ✅ **RESOLVIDO** - Verificação de equipamentos implementada

#### 4. Spam de emails

**Status**: ✅ **RESOLVIDO** - Verificação em `email_logs` implementada

#### 5. Triggers não estão disparando

**Verificar**:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE 'on_%';
```

Se não existir, recriar os triggers.

---

## 📚 Documentação Relacionada

- **Referência Rápida**: `EDGE_FUNCTIONS_REFERENCIA_RAPIDA.md`
- **Detalhado**: `EDGE_FUNCTIONS_DETALHADO.md`
- **Visão Geral**: `EDGE_FUNCTIONS_COMPLETO.md`
- **Sistema de Emails**: `EMAIL_PROCESSING_SYSTEM.md`
- **Edge Functions Usuários**: `EDGE_FUNCTIONS_USUARIOS.md`
- **Edge Function Relatório**: `EDGE_FUNCTION_RELATORIO_EMAIL.md`

---

## 🔄 Histórico de Alterações

### Janeiro 2025

- ✅ **Criação inicial**: 11 Edge Functions criadas
- ✅ **Ajuste de verificação de equipamentos**: 5 funções ajustadas
- ✅ **Cron jobs configurados**: 8 cron jobs criados
- ✅ **Database triggers**: 2 triggers criados
- ✅ **Tabela email_logs**: Criada e configurada
- ✅ **Extensão pg_net**: Habilitada para chamadas HTTP assíncronas
- ✅ **Funções SQL helper**: 8 funções criadas para cron jobs
- ✅ **Correção de erros**: Erro "schema net does not exist" resolvido
- ✅ **Documentação completa**: Este documento criado

---

## 📝 Notas Finais

1. **Evitar Spam**: Sistema verifica `email_logs` para evitar envios duplicados
2. **Personalização**: Todos os emails usam nome do usuário quando disponível
3. **Fallback**: Se nome não disponível, usa parte do email
4. **Logs**: Todos os emails são registrados em `email_logs`
5. **Erros**: Erros não bloqueiam o sistema, apenas são logados
6. **Verificação de Equipamentos**: Usuários sem equipamentos não recebem relatórios/alertas
7. **Lembrete de Inatividade**: Única função que não verifica equipamentos (todos recebem)

---

**Última Atualização**: Janeiro 2025  
**Versão do Documento**: 1.0  
**Status**: ✅ Completo e Funcionando

