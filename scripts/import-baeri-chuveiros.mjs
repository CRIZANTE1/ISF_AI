/**
 * Importação BAERI.xlsx → chuveiros/lava-olhos (+ inspeções)
 * Uso: node scripts/import-baeri-chuveiros.mjs [--dry-run] [--xlsx path] [--user-id uuid]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_XLSX = 'C:\\Users\\ce9x\\Downloads\\BAERI.xlsx';
const DEFAULT_USER_ID = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84';
const BATCH_SIZE = 100;
const BATCH_PREFIX = 'batch_cl_';

const INVENTARIO_FIELDS = [
  'id_equipamento',
  'localizacao',
  'marca',
  'modelo',
  'data_cadastro',
];

const INSPECTION_FIELDS = [
  'data_inspecao',
  'id_equipamento',
  'status_geral',
  'plano_de_acao',
  'resultados_json',
  'link_foto_nao_conformidade',
  'inspetor',
  'data_proxima_inspecao',
];

function parseArgs(argv) {
  const args = { dryRun: false, xlsx: DEFAULT_XLSX, userId: DEFAULT_USER_ID };
  for (let i = 2; i < argv.length; i++) {
    if (argv[i] === '--dry-run') args.dryRun = true;
    else if (argv[i] === '--xlsx' && argv[i + 1]) args.xlsx = argv[++i];
    else if (argv[i] === '--user-id' && argv[i + 1]) args.userId = argv[++i];
  }
  return args;
}

function isBlank(value) {
  if (value === null || value === undefined) return true;
  const s = String(value).trim();
  return s === '' || s.toLowerCase() === 'none' || s.toLowerCase() === 'n/a';
}

function trimStr(value) {
  if (isBlank(value)) return null;
  return String(value).trim();
}

function excelSerialToIso(value) {
  if (isBlank(value)) return null;
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const d = new Date(trimmed);
    if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
    return null;
  }
  if (typeof value === 'number' && value > 30000 && value < 60000) {
    const epoch = new Date(Date.UTC(1899, 11, 30));
    epoch.setUTCDate(epoch.getUTCDate() + Math.floor(value));
    return epoch.toISOString().slice(0, 10);
  }
  return null;
}

function normalizeRow(raw) {
  const row = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('__')) continue;
    row[key.trim()] = value;
  }
  return row;
}

function parseJsonValue(value) {
  if (isBlank(value)) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch {
    return null;
  }
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function sqlJson(value) {
  const parsed = parseJsonValue(value);
  if (parsed === null) return 'NULL';
  return `'${JSON.stringify(parsed).replace(/'/g, "''")}'::jsonb`;
}

function buildInsertBatch(table, columns, rows, conflictClause, jsonColumns = []) {
  if (rows.length === 0) return '';
  const chunks = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch
      .map((row) => {
        const vals = columns.map((col) =>
          jsonColumns.includes(col) ? sqlJson(row[col]) : sqlLiteral(row[col] ?? null)
        );
        return `(${vals.join(', ')})`;
      })
      .join(',\n  ');
    chunks.push(
      `INSERT INTO ${table} (${columns.join(', ')})\nVALUES\n  ${values}\n${conflictClause};`
    );
  }
  return chunks.join('\n\n');
}

function buildInspectionInserts(table, columns, keyCols, rows, jsonColumns = []) {
  return rows
    .map((row) => {
      const insertCols = [...columns, 'user_id'];
      const selectVals = insertCols
        .map((col) =>
          jsonColumns.includes(col) ? sqlJson(row[col]) : sqlLiteral(row[col] ?? null)
        )
        .join(', ');
      const where = keyCols
        .map(
          (col) =>
            `b.${col} = ${jsonColumns.includes(col) ? sqlJson(row[col]) : sqlLiteral(row[col] ?? null)}`
        )
        .concat([`b.user_id = ${sqlLiteral(row.user_id)}`])
        .join('\n    AND ');
      return `INSERT INTO ${table} (${insertCols.join(', ')})\nSELECT ${selectVals}\nWHERE NOT EXISTS (\n  SELECT 1 FROM ${table} b\n  WHERE ${where}\n);`;
    })
    .join('\n\n');
}

function readSheet(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Aba não encontrada: ${sheetName}`);
  return XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
}

function mapInventarioRow(raw, userId) {
  const row = normalizeRow(raw);
  const id = trimStr(row.id_equipamento);
  if (!id) return { error: 'missing id_equipamento' };
  return {
    id_equipamento: id,
    localizacao: trimStr(row.localizacao),
    marca: trimStr(row.marca),
    modelo: trimStr(row.modelo),
    data_cadastro: excelSerialToIso(row.data_cadastro),
    user_id: userId,
  };
}

function mapInspectionRow(raw, userId) {
  const row = normalizeRow(raw);
  const id = trimStr(row.id_equipamento);
  const dataInspecao = excelSerialToIso(row.data_inspecao);
  if (!id || !dataInspecao) return { error: 'missing id_equipamento or data_inspecao' };
  const resultados = parseJsonValue(row.resultados_json);
  if (!resultados) return { error: 'invalid resultados_json' };
  return {
    data_inspecao: dataInspecao,
    id_equipamento: id,
    status_geral: trimStr(row.status_geral),
    plano_de_acao: trimStr(row.plano_de_acao),
    resultados_json: resultados,
    link_foto_nao_conformidade: trimStr(row.link_foto_nao_conformidade),
    inspetor: trimStr(row.inspetor),
    data_proxima_inspecao: excelSerialToIso(row.data_proxima_inspecao),
    user_id: userId,
  };
}

function splitSqlToBatches(sqlBody, seedDir) {
  const parts = sqlBody.split(/\n\n(?=INSERT)/).filter((p) => p.trim().startsWith('INSERT'));
  parts.forEach((part, index) => {
    const file = path.join(seedDir, `${BATCH_PREFIX}${String(index).padStart(2, '0')}.sql`);
    fs.writeFileSync(file, part.trim().replace(/;;+/g, ';') + (part.trim().endsWith(';') ? '' : ';'), 'utf8');
  });
  return parts.length;
}

function main() {
  const args = parseArgs(process.argv);
  const xlsxPath = path.resolve(args.xlsx);
  if (!fs.existsSync(xlsxPath)) {
    console.error(`Arquivo não encontrado: ${xlsxPath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath);
  const inventarioRows = readSheet(wb, 'chuveiros_lava_olhos');
  const inspecaoRows = readSheet(wb, 'inspecoes_chuveiros_lava_olhos');

  const report = {
    generatedAt: new Date().toISOString(),
    userId: args.userId,
    xlsxPath,
    dryRun: args.dryRun,
    chuveiros: { inventario: 0, inspecoes: 0, invalid: [] },
  };

  const equipamentos = [];
  const equipKeys = new Set();
  for (let i = 0; i < inventarioRows.length; i++) {
    const mapped = mapInventarioRow(inventarioRows[i], args.userId);
    if (mapped.error) {
      report.chuveiros.invalid.push({ row: i + 2, reason: mapped.error });
      continue;
    }
    if (!equipKeys.has(mapped.id_equipamento)) {
      equipKeys.add(mapped.id_equipamento);
      equipamentos.push(mapped);
    }
  }

  const equipIds = new Set(equipamentos.map((e) => e.id_equipamento));

  const inspecoes = [];
  const inspKeys = new Set();
  for (let i = 0; i < inspecaoRows.length; i++) {
    const mapped = mapInspectionRow(inspecaoRows[i], args.userId);
    if (mapped.error) {
      report.chuveiros.invalid.push({ row: i + 2, sheet: 'inspecoes', reason: mapped.error });
      continue;
    }
    if (!equipIds.has(mapped.id_equipamento)) {
      report.chuveiros.invalid.push({
        row: i + 2,
        reason: `equipamento ${mapped.id_equipamento} ausente no inventário`,
      });
      continue;
    }
    const key = `${mapped.id_equipamento}|${mapped.data_inspecao}`;
    if (!inspKeys.has(key)) {
      inspKeys.add(key);
      inspecoes.push(mapped);
    }
  }

  report.chuveiros.inventario = equipamentos.length;
  report.chuveiros.inspecoes = inspecoes.length;

  const seedDir = path.join(ROOT, 'supabase', 'seed');
  fs.mkdirSync(seedDir, { recursive: true });
  const reportPath = path.join(seedDir, 'baeri_chuveiros_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log('Relatório:', reportPath);
  console.log(JSON.stringify(report, null, 2));

  if (args.dryRun) {
    console.log('\n--dry-run: SQL não gerado.');
    return;
  }

  const sqlParts = [
    '-- BAERI chuveiros/lava-olhos import (idempotente)',
    `-- user_id: ${args.userId}`,
    buildInsertBatch(
      'inventario_chuveiros_lava_olhos',
      [...INVENTARIO_FIELDS, 'user_id'],
      equipamentos,
      'ON CONFLICT (id_equipamento) DO NOTHING',
      []
    ),
    buildInspectionInserts(
      'inspecoes_chuveiros_lava_olhos',
      INSPECTION_FIELDS,
      ['id_equipamento', 'data_inspecao'],
      inspecoes,
      ['resultados_json']
    ),
  ].filter(Boolean);

  const sqlPath = path.join(seedDir, 'baeri_chuveiros.sql');
  const sqlBody = sqlParts.join('\n\n');
  fs.writeFileSync(sqlPath, sqlBody, 'utf8');

  for (const file of fs.readdirSync(seedDir)) {
    if (file.startsWith(BATCH_PREFIX) && file.endsWith('.sql')) {
      fs.unlinkSync(path.join(seedDir, file));
    }
  }
  const batchCount = splitSqlToBatches(sqlBody, seedDir);

  console.log('\nSQL gerado:', sqlPath);
  console.log(`Batches: ${batchCount} (${BATCH_PREFIX}*.sql)`);
  console.log(`Chuveiros: ${equipamentos.length} | Inspeções: ${inspecoes.length}`);
}

main();
