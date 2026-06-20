# Importação BAERI (Excel → Supabase)

Documentação do fluxo de importação em lote do arquivo `BAERI.xlsx` para o projeto Supabase **ISFIA**, incluindo manutenção pós-importação (resolução de planos de ação).

## Contexto

- **Projeto Supabase:** `flqbsqleqdierrqhlirw`
- **Arquivo fonte:** `BAERI.xlsx` (exportação/planilha operacional BAERI)
- **Usuário destino (importação):** CRISTIAN CARLOS  
  - `user_id`: `2cce6373-6ecc-4bf3-a44c-1df959d7cc84`  
  - E-mail: `bboycrysforever@gmail.com`

O import **não** usa `dataImport.ts` do app (formato JSON de exportação). São scripts Node dedicados que leem o XLSX e geram SQL idempotente.

---

## Pré-requisitos

### 1. Dependências

```bash
npm install
```

Pacotes usados: `xlsx` (devDependency).

### 2. Token de acesso (Management API)

No `.env` na raiz do projeto:

```env
SUPABASE_ACCESS_TOKEN=sbp_...
```

Obtenha em [supabase.com/dashboard/account/tokens](https://supabase.com/dashboard/account/tokens) (Personal Access Token, prefixo `sbp_`).

**Não use** a chave `anon` / `publishable` (`sb_publishable_...`) — retorna **401** na execução dos batches.

### 3. Arquivo Excel

Por padrão os scripts procuram:

```
C:\Users\ce9x\Downloads\BAERI.xlsx
```

Outro caminho:

```bash
node scripts/import-baeri-extintores.mjs --xlsx "D:\caminho\BAERI.xlsx"
```

Outro usuário:

```bash
node scripts/import-baeri-extintores.mjs --user-id "uuid-do-usuario"
```

---

## Scripts e comandos npm

| Comando | Descrição |
|---------|-----------|
| `npm run import:baeri:dry-run` | Valida extintores; gera relatório sem SQL |
| `npm run import:baeri` | Gera SQL + batches de extintores |
| `npm run import:baeri:execute` | Gera e aplica batches `batch_*.sql` |
| `npm run import:baeri:camaras-abrigos:dry-run` | Dry-run câmaras + abrigos |
| `npm run import:baeri:camaras-abrigos:execute` | Gera e aplica `batch_ca_*.sql` |
| `npm run import:baeri:chuveiros:dry-run` | Dry-run chuveiros/lava-olhos |
| `npm run import:baeri:chuveiros:execute` | Gera e aplica `batch_cl_*.sql` |

Executor genérico:

```bash
node scripts/execute-baeri-batches.mjs              # batch_*.sql (extintores)
node scripts/execute-baeri-batches.mjs batch_ca_    # câmaras/abrigos
node scripts/execute-baeri-batches.mjs batch_cl_    # chuveiros
```

---

## Arquivos gerados

Diretório: `supabase/seed/`

| Arquivo | Conteúdo |
|---------|----------|
| `baeri_extintores.sql` | SQL completo extintores |
| `baeri_import_report.json` | Relatório dry-run extintores |
| `batch_00.sql` … `batch_15.sql` | Batches extintores |
| `baeri_camaras_abrigos.sql` | SQL câmaras + abrigos |
| `baeri_camaras_abrigos_report.json` | Relatório câmaras/abrigos |
| `batch_ca_*.sql` | Batches câmaras/abrigos |
| `baeri_chuveiros.sql` | SQL chuveiros |
| `baeri_chuveiros_report.json` | Relatório chuveiros |
| `batch_cl_*.sql` | Batches chuveiros |

---

## Mapeamento Excel → banco

### Extintores

| Aba Excel | Tabela Supabase |
|-----------|-----------------|
| `extintores` | `extintores` (cadastro deduplicado por `numero_identificacao`) + `inspecoes_extintores` (histórico) |
| `log_baixas_extintores` | `log_baixa_extintores` |

- Cadastro: `ON CONFLICT (numero_identificacao, user_id) DO NOTHING`
- Inspeções: `WHERE NOT EXISTS` (múltiplas por equipamento)
- Baixas: deduplicação por ID de extintor

### Câmaras de espuma e abrigos

| Aba Excel | Tabela Supabase |
|-----------|-----------------|
| `camaras_espuma_inventario` | `inventario_camaras_espuma` |
| `inspecoes_camaras_espuma` | `inspecoes_camaras_espuma` |
| `abrigos` | `abrigos` |
| `inspecoes_abrigos` | `inspecoes_abrigos` |

Mapeamentos relevantes:

- Câmara: coluna Excel `modelo` → `tipo_camara`; `tamanho_especifico` → `numero_mcs`
- Abrigo: `itens_json` → JSONB
- Inventário: `ON CONFLICT (id_camara)` / `ON CONFLICT (id_abrigo) DO NOTHING` (constraint global por ID)

### Chuveiros / lava-olhos

| Aba Excel | Tabela Supabase |
|-----------|-----------------|
| `chuveiros_lava_olhos` | `inventario_chuveiros_lava_olhos` |
| `inspecoes_chuveiros_lava_olhos` | `inspecoes_chuveiros_lava_olhos` |

- Inventário: `ON CONFLICT (id_equipamento) DO NOTHING`
- Inspeções: deduplicação por `id_equipamento|data_inspecao`
- Aba `log_acoes_chuveiros`: colunas desalinhadas no Excel — **não importada**

---

## Resultado da importação BAERI (CRISTIAN CARLOS)

Contagens após execução bem-sucedida:

| Recurso | Quantidade |
|---------|------------|
| Extintores (cadastro) | 97 (92 Excel + registros pré-existentes) |
| Inspeções extintores | ~1273 |
| Log baixas extintores | 5 |
| Câmaras de espuma | 16 |
| Inspeções câmaras | 42 |
| Abrigos | 17 (14 Excel + 3 teste `ABR-*`) |
| Inspeções abrigos | 73 |
| Chuveiros/lava-olhos | 13 |
| Inspeções chuveiros | 119 (126 linhas Excel, 7 duplicatas ignoradas) |

Registros de teste (`CAM-*`, `ABR-*`, etc.) de outros usuários permanecem no banco se não conflitarem com IDs do Excel.

---

## Idempotência

Todos os scripts podem ser reexecutados com segurança:

- **Cadastro:** `INSERT … ON CONFLICT DO NOTHING`
- **Inspeções:** `INSERT … WHERE NOT EXISTS`
- **Batches:** prefixos distintos (`batch_`, `batch_ca_`, `batch_cl_`) evitam misturar execuções

---

## Resolução em lote de planos de ação

Operação administrativa aplicada via SQL (Management API), replicando a lógica de `ActionPlansPage.tsx`:

### Critério de “pendente”

Inspeção entra como plano de ação pendente quando:

1. `plano_de_acao` preenchido
2. Texto **não** contém “manter em monitoramento”
3. Texto **não** é `N/A`
4. Status ainda não resolvido:
   - Extintores: `aprovado_inspecao` sem “Sim” / “Aprovado”
   - Demais tipos: `status_geral` sem “Aprovado” / “OK”

### Resolução aplicada (jun/2026)

| Tipo | Resolvidos | Ação |
|------|------------|------|
| Extintores | 24 | `aprovado_inspecao = 'Sim'` + `log_acoes_extintores` |
| Câmaras de espuma | 6 | `status_geral = 'Aprovado'` + `log_acoes_camaras_espuma` |
| Chuveiros/lava-olhos | **0** (mantidos) | **2 pendentes preservados** a pedido |

Log inserido por registro:

- `acao_realizada`: `Plano de ação resolvido`
- `data_acao`: data atual
- `responsavel_acao`: e-mail do usuário

### Pendências conhecidas após resolução

- **Chuveiros/lava-olhos:** 2 planos de ação ainda pendentes (intencional)
- **Abrigos:** 15 inspeções com `Reprovado com Pendências` mas **`plano_de_acao` NULL** — não aparecem na tela “Planos de Ação” do app; exigem tratamento separado se desejado

### SQL de referência (repetível)

Ajuste `user_id` e filtros conforme necessário:

```sql
-- Extintores: log + aprovação
INSERT INTO log_acoes_extintores (
  id_equipamento, problema_original, acao_realizada, data_acao, responsavel_acao, user_id, inspection_id
)
SELECT
  i.numero_identificacao, i.plano_de_acao, 'Plano de ação resolvido', CURRENT_DATE,
  'email@usuario.com', i.user_id, i.id
FROM inspecoes_extintores i
WHERE i.user_id = 'UUID'
  AND i.plano_de_acao IS NOT NULL
  AND TRIM(i.plano_de_acao) <> ''
  AND i.plano_de_acao NOT ILIKE '%manter em monitoramento%'
  AND i.plano_de_acao <> 'N/A'
  AND COALESCE(i.aprovado_inspecao, '') NOT ILIKE '%sim%'
  AND COALESCE(i.aprovado_inspecao, '') NOT ILIKE '%aprovado%';

UPDATE inspecoes_extintores
SET aprovado_inspecao = 'Sim'
WHERE user_id = 'UUID'
  AND plano_de_acao IS NOT NULL
  AND TRIM(plano_de_acao) <> ''
  AND plano_de_acao NOT ILIKE '%manter em monitoramento%'
  AND plano_de_acao <> 'N/A'
  AND COALESCE(aprovado_inspecao, '') NOT ILIKE '%sim%'
  AND COALESCE(aprovado_inspecao, '') NOT ILIKE '%aprovado%';
```

Padrão análogo para `inspecoes_camaras_espuma` + `log_acoes_camaras_espuma` (campo `id_camara` no log).

**Excluir lava-olhos:** não incluir `inspecoes_chuveiros_lava_olhos` / `log_acoes_chuveiros_lava_olhos`.

---

## Troubleshooting

| Problema | Causa provável | Solução |
|----------|----------------|---------|
| HTTP 401 | Token errado no `.env` | Usar `SUPABASE_ACCESS_TOKEN=sbp_...` |
| HTTP 429 | Muitos batches seguidos | Aguardar e reexecutar só o executor; import já aplicado é idempotente |
| Aba não encontrada | Nome da aba alterado no Excel | Conferir `SheetNames` do XLSX e ajustar script |
| Equipamento ausente no inventário | Inspeção referencia ID inexistente | Linha vai para `invalid` no relatório JSON |
| Dados não aparecem no app | Usuário logado diferente | Confirmar login com o `user_id` importado |

---

## Estrutura dos scripts

```
scripts/
├── import-baeri-extintores.mjs      # Parse XLSX → SQL extintores
├── import-baeri-camaras-abrigos.mjs  # Câmaras + abrigos + inspeções
├── import-baeri-chuveiros.mjs       # Chuveiros/lava-olhos + inspeções
└── execute-baeri-batches.mjs        # Executa batches via Management API
```

Fluxo:

1. Script de import lê XLSX → valida → gera `.sql` + `batch_*.sql` + relatório JSON  
2. `execute-baeri-batches.mjs` envia cada batch para  
   `POST /v1/projects/{ref}/database/query`  
3. Ao final, exibe contagem por tabela (inclui chuveiros desde a última atualização do executor)

---

## Referências no código

- Planos de ação (UI): `src/pages/ActionPlansPage.tsx`
- Export JSON do app (não usado neste fluxo): `src/utils/dataExport.ts`, `src/utils/dataImport.ts`
- Constraints únicas: `docs/UNIQUE_CONSTRAINTS_MAINTENANCE.md`
- Config Supabase: `docs/CONFIGURAR_SUPABASE.md`
