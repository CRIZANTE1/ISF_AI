# Correções para enviar-relatorio-mensal

## Problemas identificados:
1. Bordas não estão arredondadas
2. Cards estão grudados (sem espaçamento)
3. Relatório do dev não tem informações suficientes

## Soluções:

### 1. Bordas Arredondadas
- Usar `border-radius: 20px` nos cards
- Para compatibilidade com email, usar div dentro de célula de tabela

### 2. Espaçamento entre Cards
- Aumentar padding nas células: `padding: 0 15px` (ao invés de 8px)
- Adicionar margin-bottom nos cards

### 3. Mais Informações no Relatório Dev
- Estatísticas por usuário
- Detalhes de equipamentos por tipo
- Lista de pendências detalhada
- Equipamentos não inspecionados por usuário
- Tabelas com informações completas

