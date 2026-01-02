# Correções para enviar-relatorio-mensal - Versão 2

## Problemas:
1. Bordas não estão arredondadas
2. Cards estão grudados
3. Relatório do dev não tem informações suficientes

## Soluções Implementadas:

### 1. Bordas Arredondadas
- Usar `border-radius: 20px` nos cards
- Para compatibilidade com email, usar div dentro de célula de tabela com border-radius

### 2. Espaçamento entre Cards
- Aumentar padding nas células: `padding: 0 15px` (ao invés de 8px)
- Adicionar margin-bottom nos cards: `margin-bottom: 20px`

### 3. Informações no Relatório Dev
- Estatísticas por usuário (equipamentos, inspeções, pendências)
- Detalhes de equipamentos por tipo
- Lista de pendências detalhada
- Equipamentos não inspecionados por usuário
- Tabelas com informações completas

