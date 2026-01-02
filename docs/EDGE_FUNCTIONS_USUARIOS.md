# 📧 Edge Functions - Sistema de Emails para Usuários - ISF IA

## 📋 Visão Geral

Este documento descreve todas as Edge Functions relacionadas ao ciclo de vida do usuário: cadastro, trial, premium, inatividade e notificações para desenvolvedores.

**⚠️ Importante**: Todas as funções enviam emails **individualmente** para cada usuário usando o email do próprio usuário. Não é necessário configurar `EMAIL_TO`. Apenas a função 6 (notificações do dev) usa `DEV_EMAIL` para enviar para o desenvolvedor. Os relatórios de inspeções também enviam individualmente para cada usuário, e o dev recebe um relatório consolidado via `DEV_EMAIL`.

## 🎯 Edge Functions Disponíveis

### 1. 🎉 enviar-email-boas-vindas
**Status**: 🆕 Novo

**⏰ Trigger**
- **Quando**: Imediatamente após cadastro do usuário
- **Método**: Database Trigger ou Webhook do Supabase Auth

**🎯 Propósito**
Envia email de boas-vindas quando um novo usuário se cadastra no sistema, apresentando o app e suas funcionalidades.

**📊 Fluxo de Funcionamento**
```
1. Usuário faz cadastro (supabase.auth.signUp)
   ↓
2. Database trigger ou webhook detecta novo usuário
   ↓
3. Buscar dados do usuário (email, nome, plan)
   ↓
4. Gerar HTML de boas-vindas
   ↓
5. Enviar email via SMTP
```

**🔍 Lógica Detalhada**

**Passo 1: Detectar Novo Usuário**

**Opção A: Database Trigger (Recomendado)**
```sql
-- Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.on_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  -- Chamar Edge Function via HTTP
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

-- Criar trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_user();
```

**Opção B: Webhook do Supabase Auth**
- Configurar webhook em: Settings > Auth > Webhooks
- URL: `https://seu-projeto.supabase.co/functions/v1/enviar-email-boas-vindas`
- Event: `user.created`

**Passo 2: Buscar Dados do Usuário**
```typescript
// Buscar perfil do usuário
const { data: profile } = await supabase
  .from('profiles')
  .select('full_name, plan, role')
  .eq('id', user_id)
  .single()

const userName = profile?.full_name || email.split('@')[0]
const userPlan = profile?.plan || 'trial'
```

**Passo 3: Gerar HTML de Boas-Vindas**
- Header verde (#53D769) - mensagem positiva
- Mensagem de boas-vindas personalizada
- Lista de funcionalidades do app
- Informações sobre trial (se aplicável)
- Botão para acessar o app
- Links para documentação/ajuda
- Contato: `isfiasegurancanotrabalho@gmail.com` para suporte

**📧 Conteúdo do Email**
- **Assunto**: "🎉 Bem-vindo ao ISF IA - Gestão de Inspeções!"
- **Mensagem**: Personalizada com nome do usuário
- **Funcionalidades**: Lista das principais features
- **Trial**: Informações sobre período trial (se aplicável)
- **Contato**: `isfiasegurancanotrabalho@gmail.com` para suporte e dúvidas
- **CTA**: Botão para acessar o app

**📧 Destinatário**
- Email do novo usuário

---

### 2. 📧 enviar-lembrete-inatividade
**Status**: 🆕 Novo

**⏰ Agendamento**
- Frequência: Semanalmente (Segunda-feira às 11h UTC)
- Cron: `0 11 * * 1`

**🎯 Propósito**
Envia email de lembrete para usuários que não acessam o app há mais de 7 dias, lembrando-os das vantagens e funcionalidades.

**📊 Fluxo de Funcionamento**
```
1. Buscar usuários ativos
   ↓
2. Verificar último acesso (last_sign_in_at)
   ↓
3. Filtrar usuários inativos há mais de 7 dias
   ↓
4. Verificar se já recebeu lembrete recente
   ↓
5. Gerar HTML de lembrete
   ↓
6. Enviar email via SMTP
```

**🔍 Lógica Detalhada**

**Passo 1: Buscar Usuários Ativos**
```typescript
// Buscar usuários com perfil ativo
const { data: users } = await supabase
  .from('profiles')
  .select('id, full_name, plan')
  
// Para cada usuário, buscar dados de auth.users
for (const profile of users) {
  const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
  // Ou usar RPC function se disponível
}
```

**Passo 2: Verificar Inatividade**
```typescript
const hoje = new Date()
const seteDiasAtras = new Date(hoje)
seteDiasAtras.setDate(hoje.getDate() - 7)

const usuariosInativos = []

for (const user of users) {
  const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null
  const createdAt = new Date(user.created_at)
  
  // Considera inativo se:
  // 1. Não tem last_sign_in_at E foi criado há mais de 7 dias
  // 2. Tem last_sign_in_at E foi há mais de 7 dias
  const diasInativo = lastSignIn 
    ? Math.floor((hoje.getTime() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24))
    : Math.floor((hoje.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diasInativo >= 7) {
    usuariosInativos.push({
      ...user,
      dias_inativo: diasInativo
    })
  }
}
```

**Passo 3: Verificar Lembretes Recentes**
```typescript
// Verificar se já recebeu lembrete nos últimos 14 dias
// (evita spam - só envia 1 lembrete a cada 14 dias)
const { data: lembretesRecentes } = await supabase
  .from('email_logs') // Tabela para rastrear emails enviados
  .select('user_id, sent_at')
  .eq('email_type', 'lembrete_inatividade')
  .gte('sent_at', new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString())

const usuariosComLembrete = new Set(lembretesRecentes?.map(l => l.user_id) || [])

const usuariosParaLembrar = usuariosInativos.filter(
  u => !usuariosComLembrete.has(u.id)
)
```

**Passo 4: Gerar HTML de Lembrete**
- Header amarelo (#FFCC00) - atenção
- Mensagem personalizada
- Lista de vantagens do app
- Estatísticas do usuário (se disponível)
- Botão para acessar o app
- Oferta especial (se aplicável)
- Contato: `isfiasegurancanotrabalho@gmail.com` para suporte

**📧 Conteúdo do Email**
- **Assunto**: "👋 Estamos com saudade! Volte ao ISF IA"
- **Mensagem**: Personalizada com nome e dias inativo
- **Vantagens**: Lista de benefícios do app
- **Estatísticas**: Equipamentos cadastrados, inspeções realizadas (se disponível)
- **Contato**: `isfiasegurancanotrabalho@gmail.com` para suporte
- **CTA**: Botão para acessar o app

**📧 Destinatários**
- Email individual de cada usuário inativo há mais de 7 dias (máximo 1 email a cada 14 dias)
- Cada email é enviado para o email do próprio usuário (não usa `EMAIL_TO`)

**📈 Estatísticas Retornadas**
```json
{
  "success": true,
  "message": "Lembretes enviados com sucesso",
  "usuarios_inativos": 15,
  "emails_enviados": 12,
  "usuarios_com_lembrete_recente": 3
}
```

---

### 3. ⬆️ enviar-email-upgrade-premium
**Status**: 🆕 Novo

**⏰ Trigger**
- **Quando**: Quando usuário faz upgrade para premium
- **Método**: Database Trigger na tabela `profiles` ou `licenses`

**🎯 Propósito**
Envia email de parabéns quando um usuário faz upgrade para premium, destacando os benefícios e funcionalidades premium.

**📊 Fluxo de Funcionamento**
```
1. Usuário faz upgrade (plan muda de 'trial' para 'premium')
   ↓
2. Database trigger detecta mudança
   ↓
3. Buscar dados do usuário
   ↓
4. Gerar HTML de upgrade
   ↓
5. Enviar email via SMTP
```

**🔍 Lógica Detalhada**

**Passo 1: Detectar Upgrade**
```sql
-- Criar função que será chamada pelo trigger
CREATE OR REPLACE FUNCTION public.on_user_upgrade()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  -- Verificar se mudou de trial para premium
  IF OLD.plan = 'trial' AND NEW.plan = 'premium' THEN
    -- Chamar Edge Function
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

-- Criar trigger
CREATE TRIGGER on_profile_upgrade
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.on_user_upgrade();
```

**Passo 2: Gerar HTML de Upgrade**
- Header dourado/amarelo (#FFCC00) - premium
- Mensagem de parabéns
- Lista de benefícios premium
- Funcionalidades exclusivas
- Informações sobre suporte premium
- Contato: `isfiasegurancanotrabalho@gmail.com` para suporte prioritário

**📧 Conteúdo do Email**
- **Assunto**: "🎉 Parabéns! Você agora é Premium no ISF IA"
- **Mensagem**: Parabéns pelo upgrade
- **Benefícios Premium**: Lista de funcionalidades premium
- **Suporte**: Informações sobre suporte prioritário
- **Contato**: `isfiasegurancanotrabalho@gmail.com` para suporte
- **CTA**: Botão para explorar funcionalidades premium

**📧 Destinatário**
- Usuário que fez upgrade

---

### 4. ⏰ enviar-notificacao-trial-expirando
**Status**: 🆕 Novo

**⏰ Agendamento**
- Frequência: Diariamente às 10h UTC
- Cron: `0 10 * * *`

**🎯 Propósito**
Envia notificações quando o trial está próximo do fim, lembrando o usuário sobre a necessidade de upgrade para premium.

**📊 Fluxo de Funcionamento**
```
1. Buscar usuários com trial ativo
   ↓
2. Verificar data de término do trial (trial_ends_at)
   ↓
3. Categorizar por prazo (3 dias, 1 dia, expirado)
   ↓
4. Gerar HTML de notificação
   ↓
5. Enviar email via SMTP
```

**🔍 Lógica Detalhada**

**Passo 1: Buscar Usuários com Trial**
```typescript
const hoje = new Date()
hoje.setHours(0, 0, 0, 0)

// Buscar usuários com plan = 'trial' e trial_ends_at definido
const { data: usuariosTrial } = await supabase
  .from('profiles')
  .select('id, full_name, trial_ends_at')
  .eq('plan', 'trial')
  .not('trial_ends_at', 'is', null)

// Para cada usuário, buscar email
const usuariosComEmail = []

for (const profile of usuariosTrial || []) {
  // Buscar email do auth.users
  const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
  
  if (authUser?.user?.email) {
    usuariosComEmail.push({
      ...profile,
      email: authUser.user.email
    })
  }
}
```

**Passo 2: Categorizar por Prazo**
```typescript
const notificacoes = {
  expirado: [],      // Trial já expirou
  expiraHoje: [],    // Expira hoje
  expiraAmanha: [],  // Expira amanhã
  expiraEm3Dias: []  // Expira em 3 dias
}

for (const user of usuariosComEmail) {
  const trialEnds = new Date(user.trial_ends_at)
  trialEnds.setHours(0, 0, 0, 0)
  
  const diasRestantes = Math.floor((trialEnds.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
  
  if (diasRestantes < 0) {
    notificacoes.expirado.push(user)
  } else if (diasRestantes === 0) {
    notificacoes.expiraHoje.push(user)
  } else if (diasRestantes === 1) {
    notificacoes.expiraAmanha.push(user)
  } else if (diasRestantes === 3) {
    notificacoes.expiraEm3Dias.push(user)
  }
}
```

**Passo 3: Verificar Notificações Recentes**
```typescript
// Evitar spam - só enviar 1 notificação por categoria
const { data: notificacoesRecentes } = await supabase
  .from('email_logs')
  .select('user_id, email_type, sent_at')
  .eq('email_type', 'trial_expirando')
  .gte('sent_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())

const usuariosNotificados = new Set(
  notificacoesRecentes?.map(n => `${n.user_id}_${n.email_type}`) || []
)
```

**Passo 4: Gerar HTML por Categoria**
- **Expirado**: Header vermelho (#FC3D39) - urgente
- **Expira Hoje**: Header laranja (#FF9500) - muito urgente
- **Expira Amanhã**: Header amarelo (#FFCC00) - atenção
- **Expira em 3 Dias**: Header azul (#007AFF) - informativo
- **Contato em todos**: Link mailto para `isfiasegurancanotrabalho@gmail.com`

**📧 Conteúdo do Email**
- **Assunto**: Varia conforme categoria:
  - "⚠️ Seu trial expirou - Upgrade para Premium agora"
  - "⏰ Seu trial expira hoje - Não perca acesso!"
  - "⏰ Seu trial expira amanhã - Upgrade agora"
  - "📅 Seu trial expira em 3 dias - Continue usando o ISF IA"
- **Mensagem**: Personalizada com nome e dias restantes
- **Benefícios Premium**: Lista de vantagens
- **Como Fazer Upgrade**: Instruções passo a passo
- **Contato**: `isfiasegurancanotrabalho@gmail.com` para solicitar upgrade
- **CTA**: Botão para fazer upgrade

**📧 Destinatários**
- Email individual de cada usuário com trial expirando (categorizados por prazo)
- Cada email é enviado para o email do próprio usuário (não usa `EMAIL_TO`)

**📈 Estatísticas Retornadas**
```json
{
  "success": true,
  "message": "Notificações de trial enviadas",
  "expirado": 2,
  "expira_hoje": 1,
  "expira_amanha": 3,
  "expira_em_3_dias": 5,
  "total": 11
}
```

---

### 5. 💰 enviar-solicitacao-premium
**Status**: 🆕 Novo

**⏰ Trigger**
- **Quando**: Quando trial expira e usuário tenta acessar
- **Método**: Chamada manual via Edge Function ou trigger

**🎯 Propósito**
Envia email com instruções detalhadas sobre como solicitar upgrade para premium, incluindo informações de contato e processo.

**📊 Fluxo de Funcionamento**
```
1. Usuário com trial expirado tenta acessar
   ↓
2. Sistema detecta trial expirado
   ↓
3. Chamar Edge Function
   ↓
4. Gerar HTML de solicitação
   ↓
5. Enviar email via SMTP
```

**🔍 Lógica Detalhada**

**Passo 1: Verificar Trial Expirado**
```typescript
// Verificar se trial expirou
const hoje = new Date()
const trialEnds = new Date(user.trial_ends_at)

if (trialEnds < hoje && user.plan === 'trial') {
  // Trial expirado - enviar email
  await enviarSolicitacaoPremium(user)
}
```

**Passo 2: Gerar HTML de Solicitação**
- Header vermelho (#FC3D39) - urgente
- Mensagem sobre trial expirado
- Instruções para solicitar premium
- Informações de contato: `isfiasegurancanotrabalho@gmail.com`
- Link mailto para solicitação: `mailto:isfiasegurancanotrabalho@gmail.com?subject=Solicitação Premium&body=Gostaria de solicitar upgrade para Premium`
- Benefícios do premium

**📧 Conteúdo do Email**
- **Assunto**: "🔒 Seu trial expirou - Solicite Premium agora"
- **Mensagem**: Trial expirado, precisa de premium
- **Como Solicitar**: Instruções passo a passo
- **Contato**: `isfiasegurancanotrabalho@gmail.com` para solicitar upgrade para premium
- **Benefícios**: Lista de vantagens premium
- **CTA**: Botão para solicitar premium (link mailto)

**📧 Destinatário**
- Usuário com trial expirado

---

### 6. 🔔 enviar-notificacoes-dev
**Status**: 🆕 Novo

**⏰ Agendamento**
- Frequência: Diariamente às 12h UTC
- Cron: `0 12 * * *`

**🎯 Propósito**
Envia notificações diárias para o desenvolvedor sobre novos feedbacks e novos usuários cadastrados.

**📊 Fluxo de Funcionamento**
```
1. Buscar novos feedbacks (últimas 24h)
   ↓
2. Buscar novos usuários (últimas 24h)
   ↓
3. Agrupar por tipo
   ↓
4. Gerar HTML de notificações
   ↓
5. Enviar email para dev
```

**🔍 Lógica Detalhada**

**Passo 1: Buscar Novos Feedbacks**
```typescript
const hoje = new Date()
const ontem = new Date(hoje)
ontem.setDate(hoje.getDate() - 1)

const { data: novosFeedbacks } = await supabase
  .from('user_feedback')
  .select('*, profiles(full_name)')
  .gte('created_at', ontem.toISOString())
  .order('created_at', { ascending: false })

// Agrupar por tipo
const feedbacksPorTipo = {
  feedback: novosFeedbacks?.filter(f => f.type === 'feedback') || [],
  suggestion: novosFeedbacks?.filter(f => f.type === 'suggestion') || []
}
```

**Passo 2: Buscar Novos Usuários**
```typescript
// Buscar novos usuários (últimas 24h)
const { data: novosUsuarios } = await supabase
  .from('profiles')
  .select('id, full_name, plan, created_at')
  .gte('created_at', ontem.toISOString())
  .order('created_at', { ascending: false })

// Para cada usuário, buscar email
const usuariosComEmail = []

for (const profile of novosUsuarios || []) {
  const { data: authUser } = await supabase.auth.admin.getUserById(profile.id)
  if (authUser?.user?.email) {
    usuariosComEmail.push({
      ...profile,
      email: authUser.user.email
    })
  }
}
```

**Passo 3: Calcular Estatísticas**
```typescript
const stats = {
  novos_usuarios: usuariosComEmail.length,
  novos_feedbacks: novosFeedbacks?.length || 0,
  feedbacks_por_tipo: {
    feedback: feedbacksPorTipo.feedback.length,
    suggestion: feedbacksPorTipo.suggestion.length
  },
  usuarios_por_plano: {
    trial: usuariosComEmail.filter(u => u.plan === 'trial').length,
    premium: usuariosComEmail.filter(u => u.plan === 'premium').length
  }
}
```

**Passo 4: Gerar HTML de Notificações**
- Header azul (#007AFF) - informativo
- Resumo diário
- Lista de novos usuários
- Lista de novos feedbacks
- Estatísticas do dia

**📧 Conteúdo do Email**
- **Assunto**: "📊 Notificações ISF IA - [Data] - Novos Usuários e Feedbacks"
- **Resumo**: Estatísticas do dia
- **Novos Usuários**: Lista com nome, email, plano
- **Novos Feedbacks**: Lista com tipo, mensagem, autor
- **Estatísticas**: Totais e por categoria

**📧 Destinatário**
- Email do desenvolvedor (configurável via secret `DEV_EMAIL`)
- Esta é a única função de usuários que usa um email fixo (não o email do usuário)

**📈 Estatísticas Retornadas**
```json
{
  "success": true,
  "message": "Notificações enviadas para dev",
  "stats": {
    "novos_usuarios": 3,
    "novos_feedbacks": 5,
    "feedbacks_por_tipo": {
      "feedback": 3,
      "suggestion": 2
    }
  }
}
```

---

## 🔧 Configuração

### Secrets Necessárias

**Para todas as funções de usuários:**
```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_USER=seu-email@gmail.com
SMTP_PASS=sua-senha-de-app
EMAIL_FROM=seu-email@gmail.com
SUPA_URL=https://seu-projeto.supabase.co
SUPA_SERVICE_ROLE_KEY=sua_service_role_key
```

**Apenas para notificações do dev (função 11):**
```env
DEV_EMAIL=dev@email.com  # Email do desenvolvedor para receber notificações
```

**Nota**: `EMAIL_TO` não é necessário, pois todas as funções enviam emails individualmente para o email de cada usuário. O dev recebe relatórios diferenciados/consolidados via `DEV_EMAIL`.

### Database Triggers

```sql
-- Trigger para email de boas-vindas
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.on_new_user();

-- Trigger para email de upgrade
CREATE TRIGGER on_profile_upgrade
  AFTER UPDATE ON profiles
  FOR EACH ROW
  WHEN (OLD.plan IS DISTINCT FROM NEW.plan)
  EXECUTE FUNCTION public.on_user_upgrade();
```

### Cron Jobs

```sql
-- Lembrete de inatividade (Segunda 11h UTC)
SELECT cron.schedule(
  'enviar-lembrete-inatividade',
  '0 11 * * 1',
  $$ SELECT public.enviar_lembrete_inatividade(); $$
);

-- Notificação de trial expirando (Diário 10h UTC)
SELECT cron.schedule(
  'enviar-notificacao-trial-expirando',
  '0 10 * * *',
  $$ SELECT public.enviar_notificacao_trial_expirando(); $$
);

-- Notificações para dev (Diário 12h UTC)
SELECT cron.schedule(
  'enviar-notificacoes-dev',
  '0 12 * * *',
  $$ SELECT public.enviar_notificacoes_dev(); $$
);
```

---

## 📊 Tabelas Utilizadas

### auth.users
- `id` - ID do usuário
- `email` - Email do usuário
- `created_at` - Data de criação
- `last_sign_in_at` - Último acesso

### profiles
- `id` - ID do perfil (FK para auth.users)
- `full_name` - Nome completo
- `plan` - Plano (trial/premium)
- `role` - Role (admin/user)
- `trial_ends_at` - Data de término do trial

### user_feedback
- `id` - ID do feedback
- `user_id` - ID do usuário
- `type` - Tipo (feedback/suggestion)
- `message` - Mensagem
- `created_at` - Data de criação

### email_logs (Criar se não existir)
```sql
CREATE TABLE IF NOT EXISTS email_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  email_type TEXT NOT NULL,
  sent_at TIMESTAMP DEFAULT NOW(),
  email_address TEXT,
  status TEXT DEFAULT 'sent'
);

CREATE INDEX idx_email_logs_user_id ON email_logs(user_id);
CREATE INDEX idx_email_logs_type ON email_logs(email_type);
CREATE INDEX idx_email_logs_sent_at ON email_logs(sent_at);
```

---

## 🎨 Design dos Emails

### Cores por Tipo
- **Boas-vindas**: Verde (#53D769) - positivo
- **Lembrete**: Amarelo (#FFCC00) - atenção
- **Upgrade**: Dourado (#FFCC00) - premium
- **Trial Expirando**: Vermelho (#FC3D39) - urgente
- **Solicitação Premium**: Vermelho (#FC3D39) - urgente
- **Notificações Dev**: Azul (#007AFF) - informativo

### Estrutura Padrão
- Header com cor do tipo
- Mensagem personalizada
- Conteúdo principal
- Call-to-action (botão)
- **Contato**: `isfiasegurancanotrabalho@gmail.com` (emails que direcionam contato)
- Rodapé com informações do app

### Email de Contato Padrão
**Todos os templates de email que direcionam o usuário para contato devem usar:**
- **Email**: `isfiasegurancanotrabalho@gmail.com`
- **Formato**: Link mailto quando aplicável
- **Uso**: Suporte, solicitação de upgrade, dúvidas, etc.

---

## 📝 Notas Importantes

1. **Evitar Spam**: Sistema verifica `email_logs` para evitar envios duplicados
2. **Personalização**: Todos os emails usam nome do usuário quando disponível
3. **Fallback**: Se nome não disponível, usa parte do email
4. **Logs**: Todos os emails são registrados em `email_logs`
5. **Erros**: Erros não bloqueiam o sistema, apenas são logados

---

## ✅ Checklist de Implementação

Para cada função:

- [ ] Edge Function criada no Dashboard
- [ ] Secrets configuradas (incluindo DEV_EMAIL)
- [ ] Database triggers criados (se aplicável)
- [ ] Cron jobs agendados (se aplicável)
- [ ] Tabela `email_logs` criada
- [ ] Teste manual executado
- [ ] Logs verificados
- [ ] Email recebido

---

## 🎉 Status

✅ **6 Edge Functions documentadas**
✅ Sistema completo de emails para usuários
✅ Pronto para implementação

