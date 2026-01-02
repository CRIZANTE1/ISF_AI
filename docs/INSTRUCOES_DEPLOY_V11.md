# Instruções para Deploy da Versão 11 Corrigida

## Correções a Aplicar:

### 1. Border-radius: 20px em todos os cards
**Localização:** Função `gerarCardGlassmorphism` e todos os cards customizados

**Substituir:**
```
border: 1px solid rgba(255,255,255,0.15); margin-bottom: 20px; box-shadow:
```

**Por:**
```
border: 1px solid rgba(255,255,255,0.15); border-radius: 20px; margin-bottom: 20px; box-shadow:
```

**Aplicar em:**
- Função `gerarCardGlassmorphism`
- Card 2 (Taxa de Aprovação) em `gerarHTMLDashboardDev`
- Card 5 (Equipamentos Não Inspecionados) em `gerarHTMLDashboardDev`
- Card 6 (Status das Inspeções) em `gerarHTMLDashboardDev`
- Top 5 Tipos de Equipamentos em `gerarHTMLDashboardDev`

### 2. Espaçamento entre cards (15px)
**Localização:** `gerarHTML` e `gerarHTMLDashboardDev`

**Substituir:**
```
padding-right: 8px
padding: 0 8px
padding-left: 8px
padding-right: 12px
padding: 0 12px
padding-left: 12px
```

**Por:**
```
padding-right: 15px
padding: 0 15px
padding-left: 15px
```

### 3. Informações detalhadas no relatório dev
**Localização:** Função `serve` - coletar dados por usuário antes de gerar HTML do dev

**Adicionar interface:**
```typescript
interface UserStatsForDev {
  userId: string
  userName: string
  totalEquipamentos: number
  totalInspecoes: number
  aprovadas: number
  reprovadas: number
  pendentes: number
  pendenciasArrastando: number
  equipamentosNaoInspecionados: number
}
```

**No loop de usuários, coletar:**
```typescript
const userStatsForDev: UserStatsForDev[] = []
// ... no loop de profiles
userStatsForDev.push({
  userId: profile.id,
  userName: userName,
  totalEquipamentos: equipamentos.length,
  totalInspecoes: inspecoesMes.length,
  aprovadas: userStats.aprovadas,
  reprovadas: userStats.reprovadas,
  pendentes: userStats.pendentes,
  pendenciasArrastando: pendenciasArrastandoCount,
  equipamentosNaoInspecionados: equipamentosNaoInspecionados
})
```

**Passar para `gerarHTMLDashboardDev`:**
```typescript
const devHtml = gerarHTMLDashboardDev(allEquipmentsForDev, allInspectionsForDev, allPendenciasForDev, dataInicio, dataFim, devStats, userStatsForDev)
```

**Adicionar seção HTML em `gerarHTMLDashboardDev`:**
```typescript
// Tabela de estatísticas por usuário
let tabelaUsuariosHTML = ''
if (userStatsForDev && userStatsForDev.length > 0) {
  // Criar tabela com estatísticas de cada usuário
}
```

