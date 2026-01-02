# 📧 Sistema de Processamento e Envio de Emails - ISF IA Android

## 📋 Visão Geral

Este documento explica como o sistema de processamento e envio de emails funciona no aplicativo **ISF IA Android**. O sistema utiliza **Supabase Edge Functions** para processar e enviar emails automaticamente via SMTP direto, mantendo a identidade visual do app.

## 🏗️ Arquitetura do Sistema

### Fluxo de Processamento de Emails

```
┌─────────────────────────────────────────────────────────────────┐
│                    APLICATIVO ANDROID (ISF IA)                  │
│                                                                 │
│  ┌──────────────────┐      ┌──────────────────┐               │
│  │  Notificações    │      │  Inspeções/      │               │
│  │  Locais (Push)   │      │  Equipamentos    │               │
│  └──────────────────┘      └──────────────────┘               │
│           │                           │                        │
│           └───────────┬───────────────┘                        │
│                       │                                        │
│                       ▼                                        │
│              ┌─────────────────┐                               │
│              │   Supabase DB   │                               │
│              │  (Dados das     │                               │
│              │   Inspeções)    │                               │
│              └─────────────────┘                               │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SUPABASE EDGE FUNCTION                        │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  enviar-relatorio-inspecoes (Edge Function)              │  │
│  │                                                           │  │
│  │  1. Busca dados do dia anterior no Supabase              │  │
│  │  2. Calcula estatísticas (aprovadas, reprovadas, etc.)  │  │
│  │  3. Gera HTML com design ISF IA                          │  │
│  │  4. Envia email via SMTP direto (porta 465)             │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    SERVIDOR SMTP (Gmail/Outlook)                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  SMTP Protocol (SSL direto - porta 465)                 │  │
│  │  - Autenticação AUTH LOGIN                                │  │
│  │  - Envio do email HTML                                    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────┬──────────────────────────────────────┘
                          │
                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DESTINATÁRIOS                                │
│                                                                 │
│  • Email 1: destinatario1@email.com                           │
│  • Email 2: destinatario2@email.com                            │
│  • ...                                                          │
└─────────────────────────────────────────────────────────────────┘
```

## 🔄 Componentes do Sistema

### 1. **Aplicativo Android (Cliente)**

O app Android não envia emails diretamente. Ele:

- ✅ **Registra inspeções** no banco de dados Supabase
- ✅ **Envia notificações locais** via Capacitor (push notifications)
- ✅ **Sincroniza dados** offline-first com Supabase
- ❌ **NÃO envia emails** (delegado para Edge Functions)

**Arquivos relacionados:**
- `src/services/notificationService.ts` - Notificações locais
- `src/utils/notificationUtils.ts` - Utilitários de notificação
- `src/utils/offlineOperations.ts` - Sincronização offline

### 2. **Supabase Database (Armazenamento)**

O banco de dados Supabase armazena:

- ✅ Todas as inspeções de equipamentos
- ✅ Dados de equipamentos (extintores, mangueiras, etc.)
- ✅ Histórico de ações e auditoria
- ✅ Dados de usuários

**Tabelas principais:**
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

### 3. **Supabase Edge Function (Processamento)**

A Edge Function `enviar-relatorio-inspecoes` é responsável por:

1. **Buscar dados** do dia anterior no Supabase
2. **Calcular estatísticas** (total, aprovadas, reprovadas, pendentes, com plano de ação)
3. **Gerar HTML** com design ISF IA (fundo preto, verde para sucesso, vermelho para erro)
4. **Enviar email** via SMTP direto (porta 465 - SSL)

**Localização:**
- `supabase/functions/enviar-relatorio-inspecoes/index.ts`

**Configuração:**
- Secrets no Supabase Dashboard (SMTP_HOST, SMTP_PORT, SMTP_USER, etc.)

### 4. **Cron Job (Automação)**

O cron job executa automaticamente a Edge Function:

- **Frequência**: Diariamente (configurável)
- **Horário**: 8h UTC (configurável)
- **Método**: `pg_cron` extension do PostgreSQL

**Localização:**
- SQL no Supabase Dashboard > Database > Cron Jobs

## 📊 Fluxo Detalhado de Processamento

### Passo 1: Registro de Inspeção no App

```typescript
// No app Android, quando uma inspeção é registrada:
const { data, error } = await supabase
  .from('inspecoes_extintores')
  .insert({
    id_equipamento: 'EXT-001',
    data_inspecao: '2024-01-22',
    status_geral: 'aprovado',
    observacoes_gerais: 'Equipamento em bom estado',
    plano_de_acao: null,
    user_id: currentUser.id
  });
```

**Resultado:**
- ✅ Dados salvos no Supabase
- ✅ Sincronização offline-first (se offline, salva localmente e sincroniza depois)
- ✅ Notificação local enviada ao usuário (opcional)

### Passo 2: Execução do Cron Job

O cron job executa automaticamente todos os dias às 8h UTC:

```sql
-- Cron job configurado no Supabase
SELECT cron.schedule(
  'enviar-relatorio-inspecoes',
  '0 8 * * *', -- Todos os dias às 8h UTC
  $$
  SELECT public.enviar_relatorio_inspecoes();
  $$
);
```

**O que acontece:**
1. Cron job dispara a função SQL `enviar_relatorio_inspecoes()`
2. Função SQL chama a Edge Function via HTTP POST
3. Edge Function inicia o processamento

### Passo 3: Processamento na Edge Function

A Edge Function executa os seguintes passos:

#### 3.1. Buscar Dados do Dia Anterior

```typescript
// Calcular data do dia anterior
const hoje = new Date()
const ontem = new Date(hoje)
ontem.setDate(hoje.getDate() - 1)
const dataFormatada = ontem.toISOString().split('T')[0] // YYYY-MM-DD

// Buscar inspeções de todas as tabelas
const inspectionTables = [
  'inspecoes_extintores',
  'inspecoes_chuveiros_lava_olhos',
  // ... outras tabelas
]

for (const table of inspectionTables) {
  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('data_inspecao', dataFormatada)
}
```

#### 3.2. Calcular Estatísticas

```typescript
const stats = {
  total: allInspections.length,
  aprovadas: allInspections.filter(i => 
    i.status_geral === 'aprovado' || i.status === 'aprovado'
  ).length,
  reprovadas: allInspections.filter(i => 
    i.status_geral === 'reprovado' || i.status === 'reprovado'
  ).length,
  pendentes: allInspections.filter(i => 
    i.status_geral === 'pendente' || i.status === 'pendente'
  ).length,
  comPlanoAcao: allInspections.filter(i => 
    i.plano_de_acao && i.plano_de_acao.trim() !== ''
  ).length,
}
```

#### 3.3. Gerar HTML com Design ISF IA

```typescript
function gerarHTML(inspecoes: InspectionRecord[], data: string, stats: Stats): string {
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <style>
        body {
            background: #000000;  /* Fundo preto */
            color: #FFFFFF;        /* Texto branco */
        }
        .stat-value.success {
            color: #53D769;       /* Verde para sucesso */
        }
        .stat-value.error {
            color: #FC3D39;       /* Vermelho para erro */
        }
        /* ... mais estilos ... */
    </style>
</head>
<body>
    <!-- Conteúdo do relatório -->
</body>
</html>`
}
```

**Características do design:**
- ✅ Fundo preto (#000000) - identidade visual ISF IA
- ✅ Superfície escura (rgba(28, 28, 30, 0.8))
- ✅ Verde (#53D769) para aprovadas
- ✅ Vermelho (#FC3D39) para reprovadas
- ✅ Amarelo (#FFCC00) para pendentes
- ✅ Border radius: 24px (estilo Apple Fitness)

#### 3.4. Enviar Email via SMTP

```typescript
async function enviarEmailSMTP(html: string, data: string): Promise<boolean> {
  // 1. Conectar ao servidor SMTP (porta 465 - SSL direto)
  const conn = await Deno.connectTls({ 
    hostname: SMTP_HOST, 
    port: 465 
  })
  
  // 2. Handshake SMTP
  await sendCommand('EHLO ' + SMTP_HOST)
  
  // 3. Autenticação AUTH LOGIN
  await sendCommand('AUTH LOGIN')
  await sendCommand(btoa(SMTP_USER))
  await sendCommand(btoa(SMTP_PASS))
  
  // 4. Enviar email
  await sendCommand(`MAIL FROM:<${EMAIL_FROM}>`)
  // Emails são enviados individualmente para cada usuário
  // Loop através de todos os usuários ativos
    await sendCommand(`RCPT TO:<${to}>`)
  }
  await sendCommand('DATA')
  await conn.write(encoder.encode(emailBody + '\r\n.\r\n'))
  
  // 5. Fechar conexão
  await sendCommand('QUIT')
  conn.close()
}
```

**Configuração SMTP:**
- **Porta**: 465 (SSL direto) ✅ **RECOMENDADO**
- **Autenticação**: AUTH LOGIN (base64)
- **Protocolo**: SMTP padrão

### Passo 4: Recebimento do Email

O destinatário recebe o email com:

- ✅ **Assunto**: "Relatório Diário de Inspeções - ISF IA - [Data]"
- ✅ **Conteúdo HTML**: Relatório formatado com design ISF IA
- ✅ **Estatísticas**: Cards com total, aprovadas, reprovadas, pendentes
- ✅ **Tabela**: Lista de inspeções do dia anterior
- ✅ **Rodapé**: Informações de geração automática

## 🔧 Configuração do Sistema

### 1. Configurar Secrets no Supabase

No Supabase Dashboard > Settings > Edge Functions > Secrets:

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
- **Não usa `EMAIL_TO`**: Cada usuário recebe seu próprio relatório personalizado com seus dados

### 2. Criar Edge Function

1. Acesse: https://app.supabase.com
2. Vá em **Edge Functions** > **Create a new function**
3. Nome: `enviar-relatorio-inspecoes`
4. Cole o código da Edge Function
5. Clique em **Deploy**

### 3. Configurar Cron Job

No Supabase Dashboard > Database > SQL Editor:

```sql
-- Criar função SQL
CREATE OR REPLACE FUNCTION public.enviar_relatorio_inspecoes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/enviar-relatorio-inspecoes',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

-- Agendar execução diária
SELECT cron.schedule(
  'enviar-relatorio-inspecoes',
  '0 8 * * *',
  $$
  SELECT public.enviar_relatorio_inspecoes();
  $$
);
```

## 📧 Tipos de Emails Enviados

### 1. 📊 Relatório Diário de Inspeções ✅

**Frequência**: Diariamente às 8h UTC

**Conteúdo**:
- Estatísticas do dia anterior
- Lista de inspeções realizadas
- Status de cada inspeção (aprovada, reprovada, pendente)
- Equipamentos com plano de ação

**Destinatários**: Email individual de cada usuário ativo

**Edge Function**: `enviar-relatorio-diario`

---

### 2. 📅 Relatório Semanal de Inspeções ✅

**Frequência**: Semanalmente (Segunda-feira às 8h UTC)

**Conteúdo**:
- Estatísticas da semana anterior
- Taxa de aprovação
- Comparação com semana anterior (tendência)
- Distribuição por tipo de equipamento
- Top 10 equipamentos mais inspecionados

**Destinatários**: Configuráveis via `EMAIL_TO`

**Edge Function**: `enviar-relatorio-semanal`

---

### 3. 📆 Relatório Mensal de Inspeções ✅

**Frequência**: Mensalmente (Dia 1 às 9h UTC)

**Conteúdo**:
- Estatísticas mensais consolidadas
- Taxa de aprovação mensal
- Comparação com mês anterior
- Análise de tendências
- Equipamentos mais problemáticos
- Recomendações e insights

**Destinatários**: Configuráveis via `EMAIL_TO`

**Edge Function**: `enviar-relatorio-mensal`

---

### 4. ⚠️ Alertas de Vencimento ✅

**Frequência**: Semanalmente (Segunda-feira às 9h UTC)

**Conteúdo**:
- Equipamentos vencidos (crítico - ação imediata)
- Equipamentos vencendo em 7 dias (urgente)
- Equipamentos vencendo em 15 dias (atenção)
- Equipamentos vencendo em 30 dias (preventivo)
- Lista detalhada com ID, tipo, data de vencimento, dias restantes/vencidos, localização

**Destinatários**: Configuráveis via `EMAIL_TO`

**Edge Function**: `enviar-alertas-vencimento`

**Lógica de Detecção**:
- Verifica `data_proxima_inspecao` em todas as tabelas
- Verifica `data_proxima_manutencao_2_nivel` e `data_proxima_manutencao_3_nivel` para extintores
- Categoriza por prazo de vencimento

---

### 5. 🚨 Notificações de Pendências ✅

**Frequência**: Semanalmente (Segunda-feira às 10h UTC)

**Conteúdo**:
- Equipamentos reprovados sem plano de ação
- ID do equipamento, tipo, data da reprovação
- Tempo desde a reprovação
- Observações da inspeção
- Estatísticas: total de pendências, por tipo, tempo médio

**Destinatários**: Configuráveis via `EMAIL_TO`

**Edge Function**: `enviar-notificacoes-pendencias`

**Lógica de Detecção**:
- Busca inspeções com `status_geral = 'reprovado'` ou `status = 'reprovado'`
- Filtra apenas aquelas com `plano_de_acao` vazio ou null
- Considera inspeções dos últimos 90 dias

## 🔐 Segurança

### Credenciais SMTP

- ✅ **Senha de App**: Use senha de app do Gmail (não senha normal)
- ✅ **Secrets**: Armazenadas no Supabase Dashboard (criptografadas)
- ✅ **Service Role Key**: Nunca compartilhe (acesso total ao banco)

### Validação de Dados

- ✅ **Validação de email**: Verifica formato antes de enviar
- ✅ **Sanitização HTML**: Previne XSS nos emails
- ✅ **Envio individual**: Cada usuário recebe seu próprio relatório personalizado

## 📊 Monitoramento

### Logs da Edge Function

No Supabase Dashboard > Edge Functions > `enviar-relatorio-inspecoes` > Logs:

```
[INFO] Buscando inspeções de: 2024-01-21
[INFO] Total de inspeções encontradas: 15
[INFO] Estatísticas: { total: 15, aprovadas: 12, reprovadas: 2, pendentes: 1 }
[DEBUG] SMTP Greeting: 220 smtp.gmail.com ESMTP
[DEBUG] SMTP EHLO: 250-smtp.gmail.com
[SUCCESS] Email enviado com sucesso via SMTP!
```

### Status do Cron Job

```sql
-- Ver histórico de execuções
SELECT 
  runid,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details 
WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'enviar-relatorio-inspecoes')
ORDER BY start_time DESC
LIMIT 10;
```

## ⚠️ Troubleshooting

### Email não está sendo enviado

1. **Verifique os logs** da Edge Function no Dashboard
2. **Confirme as secrets** estão configuradas corretamente
3. **Teste manualmente** a Edge Function via Dashboard
4. **Verifique a pasta de spam** dos destinatários

### Erro: "SMTP Authentication failed"

- ✅ Use **Senha de App** do Gmail (não senha normal)
- ✅ Verifique se `SMTP_USER` e `SMTP_PASS` estão corretos
- ✅ Confirme que autenticação de 2 fatores está habilitada

### Erro: "InvalidData: received corrupt message"

- ✅ **Solução**: Use porta 465 (SSL direto) ao invés de 587
- ✅ Atualize `SMTP_PORT` para `465` nas secrets

### Cron Job não está executando

- ✅ Verifique se `pg_cron` está habilitado
- ✅ Confirme o horário do cron (use horário UTC)
- ✅ Verifique os logs do cron job no SQL Editor

## 🎨 Design do Email

O email mantém a identidade visual do ISF IA:

### Cores

- **Fundo**: Preto (#000000)
- **Superfície**: Escura (rgba(28, 28, 30, 0.8))
- **Texto primário**: Branco (#FFFFFF)
- **Texto secundário**: Cinza (#8E8E93)
- **Sucesso**: Verde (#53D769)
- **Erro**: Vermelho (#FC3D39)
- **Aviso**: Amarelo (#FFCC00)

### Tipografia

- **Fonte**: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto
- **Tamanhos**: 32px (título), 16px (subtítulo), 14px (corpo)

### Layout

- **Container**: Max-width 1200px, centralizado
- **Border radius**: 24px (cards e container)
- **Espaçamento**: 20px (gap entre elementos)
- **Padding**: 40px (container), 20px (cards)

## 📝 Comparação com App de Referência

### App de Referência (ISF_AI - Streamlit)

- ✅ Usa **Google Sheets** como fila de notificações
- ✅ **GitHub Actions** processa e envia emails
- ✅ Sistema baseado em planilhas
- ✅ Processamento assíncrono via fila

### App Android (ISFIA_ANDROID)

- ✅ Usa **Supabase Database** diretamente
- ✅ **Edge Functions** processam e enviam emails
- ✅ Sistema baseado em banco de dados
- ✅ Processamento em tempo real via cron job

**Vantagens do sistema Android:**
- ✅ Mais rápido (sem fila intermediária)
- ✅ Mais confiável (banco de dados transacional)
- ✅ Mais escalável (Supabase Edge Functions)
- ✅ Design integrado (mesma identidade visual)

## 📊 Resumo dos Emails Enviados

### 📊 Relatórios de Inspeções

| Tipo | Frequência | Horário | Status |
|------|-----------|---------|--------|
| **Relatório Diário** | Diário | 8h UTC | ✅ Implementado |
| **Relatório Semanal** | Semanal | Segunda 8h UTC | ✅ Implementado |
| **Relatório Mensal** | Mensal | Dia 1, 9h UTC | ✅ Implementado |
| **Alertas de Vencimento** | Semanal | Segunda 9h UTC | ✅ Implementado |
| **Notificações de Pendências** | Semanal | Segunda 10h UTC | ✅ Implementado |

### 👤 Emails para Usuários

| Tipo | Frequência | Horário | Status |
|------|-----------|---------|--------|
| **Email de Boas-vindas** | Imediato (on signup) | - | 🆕 Novo |
| **Lembrete de Inatividade** | Semanal | Segunda 11h UTC | 🆕 Novo |
| **Email de Upgrade Premium** | Imediato (on upgrade) | - | 🆕 Novo |
| **Notificação Trial Expirando** | Diário | 10h UTC | 🆕 Novo |
| **Solicitação Premium** | Imediato (trial expirado) | - | 🆕 Novo |
| **Notificações para Dev** | Diário | 12h UTC | 🆕 Novo |

## 🚀 Melhorias Futuras

### 1. Notificações por Email em Tempo Real

Enviar email imediatamente quando:
- Equipamento é reprovado
- Plano de ação é criado
- Inspeção crítica é registrada

### 2. Templates de Email Personalizados

- Templates diferentes por tipo de notificação
- Personalização por usuário
- Suporte a múltiplos idiomas

### 3. Relatórios Avançados

- Gráficos interativos
- Exportação em PDF
- Análise preditiva

### 4. Integração com Push Notifications

- Notificações push quando email é enviado
- Link direto para o relatório no app
- Ações rápidas (aprovar, reprovar)

## 📚 Referências

- [Documentação Edge Functions - Supabase](https://supabase.com/docs/guides/functions)
- [Documentação SMTP - Gmail](https://support.google.com/mail/answer/7126229)
- [Documentação pg_cron](https://github.com/citusdata/pg_cron)
- [Documento de Configuração - Edge Function Relatório Email](./EDGE_FUNCTION_RELATORIO_EMAIL.md)

## ✅ Checklist de Verificação

Antes de considerar o sistema funcionando:

- [ ] Edge Function criada e deployada
- [ ] Todas as secrets configuradas (SMTP_HOST, SMTP_PORT, etc.)
- [ ] SMTP_PORT configurado como 465 (não 587)
- [ ] Senha de App do Gmail configurada
- [ ] Cron job criado e agendado
- [ ] Teste manual executado com sucesso
- [ ] Email recebido nos destinatários
- [ ] Logs mostram execução sem erros
- [ ] Design do email mantém identidade visual ISF IA

## 📚 Documentação Relacionada

- **Edge Functions Usuários**: `EDGE_FUNCTIONS_USUARIOS.md` (detalhado)
- **Edge Functions Completo**: `EDGE_FUNCTIONS_COMPLETO.md`
- **Edge Functions Detalhado**: `EDGE_FUNCTIONS_DETALHADO.md`
- **Referência Rápida**: `EDGE_FUNCTIONS_REFERENCIA_RAPIDA.md`

## 🎉 Conclusão

O sistema de processamento e envio de emails do ISF IA Android utiliza uma arquitetura moderna e escalável:

- ✅ **Supabase Edge Functions** para processamento
- ✅ **SMTP direto** para envio (100% gratuito)
- ✅ **Design ISF IA** mantido nos emails
- ✅ **Automação completa** via cron jobs e triggers
- ✅ **Monitoramento** via logs do Supabase
- ✅ **11 Edge Functions** documentadas e prontas para implementação

**Total de Emails:**
- **5 Relatórios de Inspeções** (diário, semanal, mensal, alertas, pendências)
- **6 Emails para Usuários** (boas-vindas, lembrete, upgrade, trial, solicitação, dev)

O sistema está pronto para produção e pode ser facilmente estendido para novos tipos de notificações e relatórios.

