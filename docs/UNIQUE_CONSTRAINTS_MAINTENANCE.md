# Manutenção de Constraints Únicas - Sincronização Offline

## ⚠️ Risco Crítico

A função `extractUniqueFields` em `src/utils/offlineSync.ts` mapeia **manualmente** as restrições de unicidade (UNIQUE constraints) do banco de dados. 

**Se o esquema do banco mudar e este arquivo não for atualizado, a sincronização pode:**
- Falhar silenciosamente ao detectar duplicatas
- Gerar registros duplicados no banco
- Perder dados durante a sincronização

## 🔍 Como Verificar as Constraints Reais

Execute esta query no **Supabase SQL Editor** para listar todas as constraints UNIQUE:

```sql
SELECT 
  tc.table_name, 
  kcu.column_name,
  tc.constraint_name,
  kcu.ordinal_position
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'UNIQUE'
  AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.ordinal_position;
```

### Para Constraints Compostas

Se uma constraint única envolve múltiplos campos, você verá múltiplas linhas com o mesmo `constraint_name` mas diferentes `column_name`. Agrupe-as no mapeamento como um array.

**Exemplo:**
```
table_name: extintores
constraint_name: extintores_numero_identificacao_user_id_key
column_name: numero_identificacao (ordinal_position: 1)
column_name: user_id (ordinal_position: 2)
```

Mapeamento:
```typescript
'extintores': ['numero_identificacao', 'user_id'], // Composta
```

## 📝 Como Atualizar o Mapeamento

1. **Execute a query acima** após qualquer mudança no schema do banco
2. **Compare** as constraints listadas com o mapeamento em `src/utils/offlineSync.ts`
3. **Adicione** novas tabelas ou atualize constraints existentes
4. **Teste** a sincronização offline após mudanças

## 📋 Status das Tabelas (Última Verificação: 2025-12-20)

### Tabelas de Equipamentos (✅ Mapeadas)
- ✅ `abrigos` → `['id_abrigo']`
- ✅ `conjuntos_autonomos` → `['numero_serie_equipamento']`
- ✅ `inventario_alarmes` → `['id_sistema']`
- ✅ `inventario_camaras_espuma` → `['id_camara']`
- ✅ `inventario_canhoes_monitores` → `['id_equipamento']`
- ✅ `inventario_chuveiros_lava_olhos` → `['id_equipamento']`
- ✅ `inventario_multigas` → `['id_equipamento']`
- ✅ `mangueiras` → `['id_mangueira']`
- ✅ `extintores` → `['numero_identificacao', 'user_id']` (composta)
- ✅ `custom_equipment` → `['equipment_type_id', 'id_equipamento', 'user_id']` (composta)

### Tabelas de Inspeção
- ✅ `inspecoes_extintores` → `['numero_identificacao', 'data_servico', 'user_id']` (composta)
- ✅ `inspecoes_scba` → **Verificado: SEM constraint UNIQUE** (permite múltiplas inspeções)
- ✅ `inspecoes_multigas` → **Verificado: SEM constraint UNIQUE** (permite múltiplas inspeções)
- ✅ `inspecoes_camaras_espuma` → **Verificado: SEM constraint UNIQUE** (permite múltiplas inspeções)
- ✅ `inspecoes_canhoes_monitores` → **Verificado: SEM constraint UNIQUE** (permite múltiplas inspeções)
- ✅ `inspecoes_chuveiros_lava_olhos` → **Verificado: SEM constraint UNIQUE** (permite múltiplas inspeções)
- ✅ `inspecoes_alarmes` → **Verificado: SEM constraint UNIQUE** (permite múltiplas inspeções)
- ✅ `inspecoes_abrigos` → **Verificado: SEM constraint UNIQUE** (permite múltiplas inspeções)
- ❓ `inspecoes_mangueiras` → **Não verificada** (provavelmente sem constraint)

### Outras Tabelas
- ✅ `locais` → `['local_id']` (adicionado em 2025-12-20)
- ❓ `equipment` (tabela genérica) → **Não verificada**
- ❓ `profiles` → **Não verificada**

### Nota Importante
As tabelas de inspeção (exceto `inspecoes_extintores`) **não têm constraints UNIQUE** no banco de dados. Isso significa que é permitido ter múltiplas inspeções para o mesmo equipamento na mesma data. Se constraints forem adicionadas no futuro, este mapeamento deve ser atualizado.

## 🧪 Testando Após Atualizações

1. **Criar um registro** offline (sem internet)
2. **Sincronizar** quando a conexão voltar
3. **Verificar logs** para alertas de tabelas não mapeadas
4. **Tentar criar duplicata** e verificar se é detectada corretamente

## 📌 Checklist de Manutenção

Quando você:
- [ ] Adiciona uma nova tabela com constraint UNIQUE
- [ ] Modifica uma constraint UNIQUE existente
- [ ] Remove uma constraint UNIQUE
- [ ] Adiciona campos a uma constraint composta

Você deve:
- [ ] Executar a query SQL para verificar constraints
- [ ] Atualizar o mapeamento em `extractUniqueFields`
- [ ] Adicionar comentário com data da atualização
- [ ] Testar sincronização offline
- [ ] Verificar logs para alertas

## 🔗 Arquivos Relacionados

- `src/utils/offlineSync.ts` - Função `extractUniqueFields` (linha ~28)
- `docs/ARCHITECTURE_ISSUES.md` - Documentação de problemas arquiteturais

