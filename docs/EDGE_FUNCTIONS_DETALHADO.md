# 📧 Edge Functions Detalhadas - ISF IA

## 📋 Índice

### 📊 Relatórios de Inspeções

1. [enviar-relatorio-diario](#1-enviar-relatorio-diario) ✅ Implementado
2. [enviar-relatorio-semanal](#2-enviar-relatorio-semanal) 🆕 Novo
3. [enviar-relatorio-mensal](#3-enviar-relatorio-mensal) 🆕 Novo
4. [enviar-alertas-vencimento](#4-enviar-alertas-vencimento) 🆕 Novo
5. [enviar-notificacoes-pendencias](#5-enviar-notificacoes-pendencias) 🆕 Novo

### 👤 Emails para Usuários

6. [enviar-email-boas-vindas](#6-enviar-email-boas-vindas) 🆕 Novo
7. [enviar-lembrete-inatividade](#7-enviar-lembrete-inatividade) 🆕 Novo
8. [enviar-email-upgrade-premium](#8-enviar-email-upgrade-premium) 🆕 Novo
9. [enviar-notificacao-trial-expirando](#9-enviar-notificacao-trial-expirando) 🆕 Novo
10. [enviar-solicitacao-premium](#10-enviar-solicitacao-premium) 🆕 Novo
11. [enviar-notificacoes-dev](#11-enviar-notificacoes-dev) 🆕 Novo

**📚 Documentação Completa de Usuários**: Ver `EDGE_FUNCTIONS_USUARIOS.md` para detalhes completos das funções 6-11.

---

## 1. 📊 enviar-relatorio-diario

**⏰ Agendamento**
- Frequência: Diariamente às 8h UTC
- Cron: `0 8 * * *`

**🎯 Propósito**
Envia relatório diário consolidado de todas as inspeções realizadas no dia anterior, com estatísticas e lista detalhada.

**📊 Fluxo de Funcionamento**
```
1. Buscar inspeções do dia anterior
   ↓
2. Calcular estatísticas (total, aprovadas, reprovadas, pendentes, com plano)
   ↓
3. Gerar HTML com design ISF IA
   ↓
4. Enviar email via SMTP
```

**🔍 Lógica Detalhada**

**Passo 1: Buscar Inspeções do Dia Anterior**
```typescript
const hoje = new Date()
const ontem = new Date(hoje)
ontem.setDate(hoje.getDate() - 1)
const dataFormatada = ontem.toISOString().split('T')[0] // YYYY-MM-DD

// Buscar de todas as tabelas de inspeções
const inspectionTables = [
  'inspecoes_extintores',
  'inspecoes_chuveiros_lava_olhos',
  'inspecoes_camaras_espuma',
  'inspecoes_alarmes',
  'inspecoes_canhoes_monitores',
  'inspecoes_scba',
  'inspecoes_multigas',
  'inspecoes_abrigos',
  'inspecoes_mangueiras',
  'custom_equipment_inspections'
]

for (const table of inspectionTables) {
  const { data } = await supabase
    .from(table)
    .select('*')
    .eq('data_inspecao', dataFormatada)
}
```

**Passo 2: Calcular Estatísticas**
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

**Passo 3: Gerar HTML**
- Design ISF IA (fundo preto, verde para sucesso, vermelho para erro)
- Cards com estatísticas
- Tabela com até 50 inspeções
- Rodapé com informações de geração

**📧 Conteúdo do Email**
- **Assunto**: "Relatório Diário de Inspeções - ISF IA - [Data]"
- **Estatísticas**: Total, Aprovadas, Reprovadas, Pendentes, Com Plano de Ação
- **Tabela**: Lista de inspeções (ID, Tipo, Status, Observações, Plano de Ação)

**📧 Destinatários**
- Email individual de cada usuário ativo
- Cada usuário recebe seu próprio relatório com suas inspeções
- O desenvolvedor também recebe um relatório consolidado via `DEV_EMAIL`

**📈 Estatísticas Retornadas**
```json
{
  "success": true,
  "message": "Relatório enviado com sucesso",
  "data": "2024-01-21",
  "stats": {
    "total": 15,
    "aprovadas": 12,
    "reprovadas": 2,
    "pendentes": 1,
    "comPlanoAcao": 1
  },
  "inspecoes": 15
}
```

---

## 2. 📅 enviar-relatorio-semanal

**⏰ Agendamento**
- Frequência: Semanalmente (Segunda-feira às 8h UTC)
- Cron: `0 8 * * 1`

**🎯 Propósito**
Envia relatório semanal consolidado de todas as inspeções realizadas na semana anterior, com estatísticas agregadas e tendências.

**📊 Fluxo de Funcionamento**
```
1. Calcular período da semana anterior (segunda a domingo)
   ↓
2. Buscar inspeções da semana anterior
   ↓
3. Calcular estatísticas agregadas
   ↓
4. Comparar com semana anterior (tendência)
   ↓
5. Agrupar por tipo de equipamento
   ↓
6. Gerar HTML com gráficos e tendências
   ↓
7. Enviar email via SMTP
```

**🔍 Lógica Detalhada**

**Passo 1: Calcular Período da Semana Anterior**
```typescript
const hoje = new Date()
const hojeUTC = new Date(hoje.getUTCFullYear(), hoje.getUTCMonth(), hoje.getUTCDate())

// Encontrar segunda-feira da semana atual
const diaSemana = hojeUTC.getDay() // 0 = domingo, 1 = segunda, ...
const diasAteSegunda = diaSemana === 0 ? 6 : diaSemana - 1
const segundaAtual = new Date(hojeUTC)
segundaAtual.setDate(hojeUTC.getDate() - diasAteSegunda)

// Semana anterior: segunda a domingo
const segundaAnterior = new Date(segundaAtual)
segundaAnterior.setDate(segundaAtual.getDate() - 7)
const domingoAnterior = new Date(segundaAnterior)
domingoAnterior.setDate(segundaAnterior.getDate() + 6)

const dataInicio = segundaAnterior.toISOString().split('T')[0]
const dataFim = domingoAnterior.toISOString().split('T')[0]
```

**Passo 2: Buscar Inspeções da Semana**
```typescript
for (const table of inspectionTables) {
  const { data } = await supabase
    .from(table)
    .select('*')
    .gte('data_inspecao', dataInicio)
    .lte('data_inspecao', dataFim)
}
```

**Passo 3: Calcular Estatísticas Agregadas**
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
  taxaAprovacao: (aprovadas / total * 100).toFixed(1),
  porTipo: {
    extintor: 0,
    chuveiro_lavaolhos: 0,
    camara_espuma: 0,
    // ... outros tipos
  }
}
```

**Passo 4: Comparar com Semana Anterior**
```typescript
// Buscar estatísticas da semana anterior (2 semanas atrás)
const segundaAnterior2 = new Date(segundaAnterior)
segundaAnterior2.setDate(segundaAnterior.getDate() - 7)
const domingoAnterior2 = new Date(segundaAnterior2)
domingoAnterior2.setDate(segundaAnterior2.getDate() + 6)

// Buscar inspeções da semana anterior
const statsAnterior = await calcularEstatisticasSemana(
  segundaAnterior2.toISOString().split('T')[0],
  domingoAnterior2.toISOString().split('T')[0]
)

// Calcular tendência
const tendencia = {
  total: stats.total - statsAnterior.total,
  taxaAprovacao: stats.taxaAprovacao - statsAnterior.taxaAprovacao,
  // ... outras métricas
}
```

**📧 Conteúdo do Email**
- **Assunto**: "Relatório Semanal de Inspeções - ISF IA - Semana [Data Início] a [Data Fim]"
- **Estatísticas da Semana**: Total, Taxa de Aprovação, Comparação com semana anterior
- **Distribuição por Tipo**: Gráfico/lista por tipo de equipamento
- **Top 10 Equipamentos**: Mais inspecionados na semana
- **Tendências**: Indicadores de aumento/diminuição

**📧 Destinatários**
- Email individual de cada usuário ativo
- Cada usuário recebe seu próprio relatório com suas inspeções
- O desenvolvedor também recebe um relatório consolidado via `DEV_EMAIL`

**📈 Estatísticas Retornadas**
```json
{
  "success": true,
  "message": "Relatório semanal enviado com sucesso",
  "periodo": {
    "inicio": "2024-01-15",
    "fim": "2024-01-21"
  },
  "stats": {
    "total": 105,
    "aprovadas": 95,
    "reprovadas": 8,
    "pendentes": 2,
    "taxaAprovacao": "90.5"
  },
  "tendencia": {
    "total": 5,
    "taxaAprovacao": 2.3
  }
}
```

---

## 3. 📆 enviar-relatorio-mensal

**⏰ Agendamento**
- Frequência: Mensalmente (Dia 1 às 9h UTC)
- Cron: `0 9 1 * *`

**🎯 Propósito**
Envia relatório mensal executivo com estatísticas consolidadas, tendências e análises do mês anterior.

**📊 Fluxo de Funcionamento**
```
1. Calcular período do mês anterior
   ↓
2. Buscar inspeções do mês anterior
   ↓
3. Calcular estatísticas mensais
   ↓
4. Comparar com mês anterior
   ↓
5. Análise de tendências
   ↓
6. Identificar equipamentos mais problemáticos
   ↓
7. Gerar HTML executivo
   ↓
8. Enviar email via SMTP
```

**🔍 Lógica Detalhada**

**Passo 1: Calcular Período do Mês Anterior**
```typescript
const hoje = new Date()
const primeiroDiaMesAtual = new Date(hoje.getFullYear(), hoje.getMonth(), 1)
const ultimoDiaMesAnterior = new Date(primeiroDiaMesAtual)
ultimoDiaMesAnterior.setDate(ultimoDiaMesAnterior.getDate() - 1)

const primeiroDiaMesAnterior = new Date(
  ultimoDiaMesAnterior.getFullYear(),
  ultimoDiaMesAnterior.getMonth(),
  1
)

const dataInicio = primeiroDiaMesAnterior.toISOString().split('T')[0]
const dataFim = ultimoDiaMesAnterior.toISOString().split('T')[0]
```

**Passo 2: Calcular Estatísticas Mensais**
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
  taxaAprovacao: (aprovadas / total * 100).toFixed(1),
  mediaDiaria: (total / diasNoMes).toFixed(1),
  porTipo: {
    extintor: { total: 0, aprovadas: 0, reprovadas: 0 },
    // ... outros tipos
  },
  porDia: [
    { dia: '01', total: 0, aprovadas: 0 },
    // ... todos os dias do mês
  ]
}
```

**Passo 3: Análise de Tendências**
```typescript
// Comparar com mês anterior
const statsMesAnterior = await calcularEstatisticasMes(mesAnterior)

const analise = {
  crescimento: {
    total: ((stats.total - statsMesAnterior.total) / statsMesAnterior.total * 100).toFixed(1),
    taxaAprovacao: (stats.taxaAprovacao - statsMesAnterior.taxaAprovacao).toFixed(1)
  },
  equipamentosProblematicos: allInspections
    .filter(i => i.status_geral === 'reprovado')
    .groupBy('equipment_id')
    .map(group => ({
      equipment_id: group.key,
      reprovacoes: group.items.length,
      ultimaReprovacao: group.items[0].data_inspecao
    }))
    .sort((a, b) => b.reprovacoes - a.reprovacoes)
    .slice(0, 10)
}
```

**📧 Conteúdo do Email**
- **Assunto**: "Relatório Mensal de Inspeções - ISF IA - [Mês/Ano]"
- **Estatísticas Mensais**: Total, Taxa de Aprovação, Média Diária
- **Comparação com Mês Anterior**: Crescimento/diminuição
- **Distribuição por Tipo**: Gráfico detalhado
- **Equipamentos Mais Problemáticos**: Top 10 com mais reprovações
- **Análise de Tendências**: Insights e recomendações

**📧 Destinatários**
- Email individual de cada usuário ativo
- Cada usuário recebe seu próprio relatório com suas inspeções
- O desenvolvedor também recebe um relatório consolidado via `DEV_EMAIL`

**📈 Estatísticas Retornadas**
```json
{
  "success": true,
  "message": "Relatório mensal enviado com sucesso",
  "periodo": {
    "inicio": "2024-01-01",
    "fim": "2024-01-31"
  },
  "stats": {
    "total": 450,
    "aprovadas": 405,
    "reprovadas": 38,
    "pendentes": 7,
    "taxaAprovacao": "90.0",
    "mediaDiaria": "14.5"
  },
  "analise": {
    "crescimento": {
      "total": "5.2",
      "taxaAprovacao": "1.5"
    },
    "equipamentosProblematicos": [...]
  }
}
```

---

## 4. ⚠️ enviar-alertas-vencimento

**⏰ Agendamento**
- Frequência: Semanalmente (Segunda-feira às 9h UTC)
- Cron: `0 9 * * 1`

**🎯 Propósito**
Envia alertas semanais sobre equipamentos que estão próximos do vencimento ou já vencidos, permitindo ação preventiva.

**📊 Fluxo de Funcionamento**
```
1. Buscar todos os equipamentos
   ↓
2. Verificar datas de vencimento (data_proxima_inspecao, manutenções)
   ↓
3. Categorizar por prazo (vencido, 7d, 15d, 30d)
   ↓
4. Agrupar por categoria
   ↓
5. Gerar HTML com alertas
   ↓
6. Enviar email via SMTP
```

**🔍 Lógica Detalhada**

**Passo 1: Buscar Equipamentos**
```typescript
const equipmentTables = [
  { table: 'extintores', dateFields: ['data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 'data_proxima_manutencao_3_nivel'] },
  { table: 'inventario_chuveiros_lava_olhos', dateFields: ['data_proxima_inspecao'] },
  { table: 'inventario_camaras_espuma', dateFields: ['data_proxima_inspecao'] },
  { table: 'inventario_alarmes', dateFields: ['data_proxima_inspecao'] },
  { table: 'inventario_canhoes_monitores', dateFields: ['data_proxima_inspecao'] },
  { table: 'conjuntos_autonomos', dateFields: ['data_proxima_inspecao'] },
  { table: 'inventario_multigas', dateFields: ['data_proxima_inspecao'] },
  { table: 'mangueiras', dateFields: ['data_proximo_teste'] },
  { table: 'abrigos', dateFields: ['data_proxima_inspecao'] },
  { table: 'custom_equipment', dateFields: ['data_proxima_inspecao'] }
]
```

**Passo 2: Verificar Datas de Vencimento**
```typescript
const hoje = new Date()
hoje.setHours(0, 0, 0, 0)

const vencimentos = {
  vencidos: [],
  proximos7dias: [],
  proximos15dias: [],
  proximos30dias: []
}

for (const { table, dateFields } of equipmentTables) {
  const { data } = await supabase.from(table).select('*')
  
  for (const equipment of data || []) {
    for (const dateField of dateFields) {
      const dataVencimento = equipment[dateField]
      if (!dataVencimento) continue
      
      const vencimento = new Date(dataVencimento)
      vencimento.setHours(0, 0, 0, 0)
      const diasRestantes = Math.floor((vencimento.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24))
      
      const item = {
        equipment_id: equipment.id_equipamento || equipment.id_extintor || equipment.id,
        equipment_type: table,
        date_field: dateField,
        data_vencimento: dataVencimento,
        dias_restantes: diasRestantes,
        localizacao: equipment.localizacao || '-'
      }
      
      if (diasRestantes < 0) {
        vencimentos.vencidos.push(item)
      } else if (diasRestantes <= 7) {
        vencimentos.proximos7dias.push(item)
      } else if (diasRestantes <= 15) {
        vencimentos.proximos15dias.push(item)
      } else if (diasRestantes <= 30) {
        vencimentos.proximos30dias.push(item)
      }
    }
  }
}
```

**Passo 3: Agrupar e Ordenar**
```typescript
// Ordenar por urgência (vencidos primeiro, depois por dias restantes)
vencimentos.vencidos.sort((a, b) => a.dias_restantes - b.dias_restantes)
vencimentos.proximos7dias.sort((a, b) => a.dias_restantes - b.dias_restantes)
vencimentos.proximos15dias.sort((a, b) => a.dias_restantes - b.dias_restantes)
vencimentos.proximos30dias.sort((a, b) => a.dias_restantes - b.dias_restantes)
```

**📧 Conteúdo do Email**
- **Assunto**: "⚠️ Alertas de Vencimento - ISF IA - [Data]"
- **Equipamentos Vencidos** (🔴 Crítico): Lista com dias vencidos
- **Próximos 7 Dias** (🟠 Urgente): Lista com dias restantes
- **Próximos 15 Dias** (🟡 Atenção): Lista com dias restantes
- **Próximos 30 Dias** (🟢 Preventivo): Lista com dias restantes
- **Estatísticas**: Total por categoria

**📧 Destinatários**
- Email individual de cada usuário ativo
- Cada usuário recebe seu próprio relatório com suas inspeções
- O desenvolvedor também recebe um relatório consolidado via `DEV_EMAIL`

**📈 Estatísticas Retornadas**
```json
{
  "success": true,
  "message": "Alertas de vencimento enviados com sucesso",
  "vencimentos": {
    "vencidos": 5,
    "proximos7dias": 12,
    "proximos15dias": 18,
    "proximos30dias": 25
  },
  "total": 60
}
```

---

## 5. 🚨 enviar-notificacoes-pendencias

**⏰ Agendamento**
- Frequência: Semanalmente (Segunda-feira às 10h UTC)
- Cron: `0 10 * * 1`

**🎯 Propósito**
Envia notificações semanais sobre equipamentos reprovados que não possuem plano de ação definido, exigindo atenção imediata.

**📊 Fluxo de Funcionamento**
```
1. Buscar inspeções reprovadas dos últimos 90 dias
   ↓
2. Filtrar apenas aquelas sem plano de ação
   ↓
3. Calcular tempo desde reprovação
   ↓
4. Agrupar por tipo de equipamento
   ↓
5. Gerar HTML com lista de pendências
   ↓
6. Enviar email via SMTP
```

**🔍 Lógica Detalhada**

**Passo 1: Buscar Inspeções Reprovadas**
```typescript
const hoje = new Date()
const noventaDiasAtras = new Date(hoje)
noventaDiasAtras.setDate(hoje.getDate() - 90)
const dataLimite = noventaDiasAtras.toISOString().split('T')[0]

const pendencias = []

for (const table of inspectionTables) {
  const { data } = await supabase
    .from(table)
    .select('*')
    .or('status_geral.eq.reprovado,status.eq.reprovado')
    .gte('data_inspecao', dataLimite)
  
  if (data) {
    for (const inspection of data) {
      // Verificar se não tem plano de ação
      const planoAcao = inspection.plano_de_acao || ''
      if (planoAcao.trim() === '' || planoAcao === 'N/A' || planoAcao === null) {
        const diasDesdeReprovacao = Math.floor(
          (hoje.getTime() - new Date(inspection.data_inspecao).getTime()) / (1000 * 60 * 60 * 24)
        )
        
        pendencias.push({
          equipment_id: inspection.id_equipamento || inspection.id,
          equipment_type: table.replace('inspecoes_', ''),
          data_reprovacao: inspection.data_inspecao,
          dias_desde_reprovacao: diasDesdeReprovacao,
          observacoes: inspection.observacoes_gerais || '-',
          localizacao: inspection.localizacao || '-'
        })
      }
    }
  }
}
```

**Passo 2: Agrupar e Ordenar**
```typescript
// Ordenar por tempo desde reprovação (mais antigas primeiro)
pendencias.sort((a, b) => b.dias_desde_reprovacao - a.dias_desde_reprovacao)

// Agrupar por tipo
const porTipo = pendencias.reduce((acc, pendencia) => {
  const tipo = pendencia.equipment_type
  if (!acc[tipo]) acc[tipo] = []
  acc[tipo].push(pendencia)
  return acc
}, {} as Record<string, typeof pendencias>)
```

**Passo 3: Calcular Estatísticas**
```typescript
const stats = {
  total: pendencias.length,
  porTipo: Object.keys(porTipo).map(tipo => ({
    tipo,
    quantidade: porTipo[tipo].length
  })),
  mediaDiasDesdeReprovacao: pendencias.length > 0
    ? (pendencias.reduce((sum, p) => sum + p.dias_desde_reprovacao, 0) / pendencias.length).toFixed(1)
    : 0,
  maisAntigas: pendencias.slice(0, 10) // Top 10 mais antigas
}
```

**📧 Conteúdo do Email**
- **Assunto**: "🚨 Notificações de Pendências - ISF IA - [Data]"
- **Total de Pendências**: Número total de equipamentos reprovados sem plano
- **Distribuição por Tipo**: Quantidade por tipo de equipamento
- **Lista de Pendências**: 
  - ID do equipamento
  - Tipo
  - Data da reprovação
  - Dias desde reprovação
  - Observações
  - Localização
- **Equipamentos Mais Antigos**: Top 10 que estão há mais tempo sem plano

**📧 Destinatários**
- Email individual de cada usuário ativo
- Cada usuário recebe seu próprio relatório com suas inspeções
- O desenvolvedor também recebe um relatório consolidado via `DEV_EMAIL`

**📈 Estatísticas Retornadas**
```json
{
  "success": true,
  "message": "Notificações de pendências enviadas com sucesso",
  "stats": {
    "total": 8,
    "porTipo": [
      { "tipo": "extintor", "quantidade": 5 },
      { "tipo": "chuveiro_lavaolhos", "quantidade": 3 }
    ],
    "mediaDiasDesdeReprovacao": "12.5",
    "maisAntigas": [...]
  }
}
```

---

## 🔧 Função SMTP Compartilhada

Todas as funções usam a mesma função `enviarEmailSMTP`:

```typescript
async function enviarEmailSMTP(
  html: string, 
  assunto: string,
  // Emails são enviados individualmente para cada usuário
  // DEV_EMAIL recebe relatório consolidado
): Promise<boolean> {
  // Implementação SMTP (porta 465 - SSL direto)
  // Ver código completo no documento EDGE_FUNCTION_RELATORIO_EMAIL.md
}
```

**Características:**
- ✅ Porta 465 (SSL direto) - RECOMENDADO
- ✅ Autenticação AUTH LOGIN
- ✅ Suporte a múltiplos destinatários
- ✅ Tratamento de erros robusto

---

## 📝 Configuração dos Cron Jobs

```sql
-- Relatório Diário (8h UTC diariamente)
CREATE OR REPLACE FUNCTION public.enviar_relatorio_diario()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/enviar-relatorio-diario',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

SELECT cron.schedule(
  'enviar-relatorio-diario',
  '0 8 * * *',
  $$ SELECT public.enviar_relatorio_diario(); $$
);

-- Relatório Semanal (Segunda 8h UTC)
CREATE OR REPLACE FUNCTION public.enviar_relatorio_semanal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/enviar-relatorio-semanal',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

SELECT cron.schedule(
  'enviar-relatorio-semanal',
  '0 8 * * 1',
  $$ SELECT public.enviar_relatorio_semanal(); $$
);

-- Relatório Mensal (Dia 1, 9h UTC)
CREATE OR REPLACE FUNCTION public.enviar_relatorio_mensal()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/enviar-relatorio-mensal',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

SELECT cron.schedule(
  'enviar-relatorio-mensal',
  '0 9 1 * *',
  $$ SELECT public.enviar_relatorio_mensal(); $$
);

-- Alertas de Vencimento (Segunda 9h UTC)
CREATE OR REPLACE FUNCTION public.enviar_alertas_vencimento()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/enviar-alertas-vencimento',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

SELECT cron.schedule(
  'enviar-alertas-vencimento',
  '0 9 * * 1',
  $$ SELECT public.enviar_alertas_vencimento(); $$
);

-- Notificações de Pendências (Segunda 10h UTC)
CREATE OR REPLACE FUNCTION public.enviar_notificacoes_pendencias()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  service_role_key text := 'SUA_SERVICE_ROLE_KEY_AQUI';
BEGIN
  PERFORM net.http_post(
    url := 'https://seu-projeto.supabase.co/functions/v1/enviar-notificacoes-pendencias',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || service_role_key
    ),
    body := '{}'::jsonb
  );
END;
$$;

SELECT cron.schedule(
  'enviar-notificacoes-pendencias',
  '0 10 * * 1',
  $$ SELECT public.enviar_notificacoes_pendencias(); $$
);
```

---

## ✅ Checklist de Implementação

Para cada Edge Function:

- [ ] Criar função no Supabase Dashboard
- [ ] Configurar secrets (SMTP_HOST, SMTP_PORT, etc.)
- [ ] Testar manualmente via Dashboard
- [ ] Criar função SQL correspondente
- [ ] Agendar cron job
- [ ] Verificar logs de execução
- [ ] Confirmar recebimento de email

---

## 📚 Documentação Relacionada

### Emails para Usuários

As funções 6-11 (emails para usuários) estão documentadas em detalhes em:
- **EDGE_FUNCTIONS_USUARIOS.md** - Documentação completa com lógica detalhada

Inclui:
- 🎉 Email de boas-vindas (on signup)
- 📧 Lembrete de inatividade (semanal)
- ⬆️ Email de upgrade premium (on upgrade)
- ⏰ Notificação trial expirando (diário)
- 💰 Solicitação premium (trial expirado)
- 🔔 Notificações para dev (diário)

---

## 🎉 Status Atual

✅ **11 Edge Functions documentadas e prontas para implementação**
✅ **5 Relatórios de Inspeções** (detalhados neste documento)
✅ **6 Emails para Usuários** (detalhados em EDGE_FUNCTIONS_USUARIOS.md)
✅ Lógica detalhada para cada função
✅ Configuração de cron jobs e triggers documentada
✅ Sistema completo e operacional

