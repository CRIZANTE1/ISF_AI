/**
 * Importação BAERI.xlsx → SQL idempotente (extintores + inspeções + baixas)
 * Uso: node scripts/import-baeri-extintores.mjs [--dry-run] [--xlsx path] [--user-id uuid]
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import XLSX from 'xlsx';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const DEFAULT_XLSX = 'C:\\Users\\ce9x\\Downloads\\BAERI.xlsx';
const DEFAULT_USER_ID = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84';
const BATCH_SIZE = 150;

const CADASTRO_FIELDS = [
  'numero_identificacao',
  'tipo_agente',
  'capacidade',
  'marca_fabricante',
  'ano_fabricacao',
  'numero_serie',
  'peso_cheio_placa_kg',
  'peso_vazio_conjunto_kg',
];

const INSPECTION_FIELDS = [
  'numero_identificacao',
  'data_servico',
  'tipo_servico',
  'inspetor_responsavel',
  'empresa_executante',
  'data_proxima_manutencao_2_nivel',
  'data_proxima_manutencao_3_nivel',
  'data_ultimo_ensaio_hidrostatico',
  'data_proxima_inspecao',
  'data_proxima_pesagem_co2',
  'aprovado_inspecao',
  'observacoes_gerais',
  'link_relatorio_pdf',
  'link_foto_nao_conformidade',
  'numero_selo_inmetro',
  'latitude',
  'longitude',
  'peso_cheio_placa_snapshot_kg',
  'peso_medido_conjunto_kg',
  'perda_kg',
  'carga_nominal_kg',
  'status_geral',
  'plano_de_acao',
];

const BAIXA_FIELDS = [
  'data_baixa',
  'numero_identificacao',
  'motivo_condenacao',
  'responsavel_baixa',
  'numero_identificacao_substituto',
  'observacoes',
  'link_foto_evidencia',
];

/** @param {string[]} argv */
function parseArgs(argv) {
  const args = {
    dryRun: false,
    xlsx: DEFAULT_XLSX,
    userId: DEFAULT_USER_ID,
  };
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

function parseBrazilianNumber(value) {
  if (isBlank(value)) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  let s = String(value).trim().replace(/\s+/g, '');
  s = s.replace(/kg|Kg|KG|l|L|bar|mbar|%$/gi, '').trim();
  if (s.includes(',') && s.includes('.')) {
    s = s.replace(/\./g, '').replace(',', '.');
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function parseCapacidade(value) {
  if (isBlank(value)) return null;
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const n = parseBrazilianNumber(value);
  return n;
}

function excelSerialToIso(value) {
  if (isBlank(value)) return null;
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(trimmed)) return trimmed.slice(0, 10);
    const asNum = parseBrazilianNumber(trimmed);
    if (asNum !== null && asNum > 30000 && asNum < 60000) {
      return excelSerialToIso(asNum);
    }
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

function parseGpsCombined(text) {
  if (isBlank(text)) return { latitude: null, longitude: null };
  const s = String(text);
  const latMatch = s.match(/Lat(?:itude)?:?\s*(-?\d+[.,]?\d*)/i);
  const lngMatch = s.match(/Long(?:itude)?:?\s*(-?\d+[.,]?\d*)/i);
  return {
    latitude: latMatch ? parseBrazilianNumber(latMatch[1]) : null,
    longitude: lngMatch ? parseBrazilianNumber(lngMatch[1]) : null,
  };
}

function normalizeRow(raw) {
  const row = {};
  for (const [key, value] of Object.entries(raw)) {
    if (key.startsWith('__')) continue;
    row[key.trim()] = value;
  }
  return row;
}

function mapExtintorRow(raw, userId) {
  const row = normalizeRow(raw);
  const numero = trimStr(row.numero_identificacao);
  if (!numero) return { error: 'missing numero_identificacao', raw: row };

  const gpsFromLocal = parseGpsCombined(row.localizacao);
  let latitude = parseBrazilianNumber(row.latitude) ?? gpsFromLocal.latitude;
  let longitude = parseBrazilianNumber(row.longitude) ?? gpsFromLocal.longitude;

  const cadastro = {
    numero_identificacao: numero,
    tipo_agente: trimStr(row.tipo_agente),
    capacidade: parseCapacidade(row.capacidade),
    marca_fabricante: trimStr(row.marca_fabricante),
    ano_fabricacao: parseCapacidade(row.ano_fabricacao),
    numero_serie: trimStr(row.numero_serie),
    peso_cheio_placa_kg:
      parseBrazilianNumber(row.peso_cheio_placa_kg) ??
      parseBrazilianNumber(row.peso_cheio_referencia_pc),
    peso_vazio_conjunto_kg:
      parseBrazilianNumber(row.peso_vazio_conjunto_kg) ??
      parseBrazilianNumber(row.peso_vazio_referencia_pv),
    user_id: userId,
  };

  const dataServico = excelSerialToIso(row.data_servico);
  let inspection = null;
  if (dataServico) {
    inspection = {
      numero_identificacao: numero,
      data_servico: dataServico,
      tipo_servico: trimStr(row.tipo_servico),
      inspetor_responsavel: trimStr(row.inspetor_responsavel),
      empresa_executante: trimStr(row.empresa_executante),
      data_proxima_manutencao_2_nivel: excelSerialToIso(row.data_proxima_manutencao_2_nivel),
      data_proxima_manutencao_3_nivel: excelSerialToIso(row.data_proxima_manutencao_3_nivel),
      data_ultimo_ensaio_hidrostatico: excelSerialToIso(row.data_ultimo_ensaio_hidrostatico),
      data_proxima_inspecao: excelSerialToIso(row.data_proxima_inspecao),
      data_proxima_pesagem_co2: excelSerialToIso(row.data_proxima_pesagem_co2),
      aprovado_inspecao: trimStr(row.aprovado_inspecao),
      observacoes_gerais: trimStr(row.observacoes_gerais),
      link_relatorio_pdf: trimStr(row.link_relatorio_pdf),
      link_foto_nao_conformidade: trimStr(row.link_foto_nao_conformidade),
      numero_selo_inmetro: trimStr(row.numero_selo_inmetro),
      latitude,
      longitude,
      peso_cheio_placa_snapshot_kg:
        parseBrazilianNumber(row.peso_cheio_placa_snapshot_kg) ??
        parseBrazilianNumber(row.peso_cheio_referencia_pc),
      peso_medido_conjunto_kg:
        parseBrazilianNumber(row.peso_medido_conjunto_kg) ??
        parseBrazilianNumber(row.ultimo_peso_medido_kg),
      perda_kg: parseBrazilianNumber(row.perda_kg),
      carga_nominal_kg: parseBrazilianNumber(row.carga_nominal_kg),
      status_geral: trimStr(row.status_geral),
      plano_de_acao: trimStr(row.plano_de_acao),
      user_id: userId,
    };
  }

  return { cadastro, inspection };
}

function mapBaixaRow(raw, userId) {
  const row = normalizeRow(raw);
  const numero = trimStr(row.numero_identificacao);
  const dataBaixa = excelSerialToIso(row.data_baixa);
  if (!numero || !dataBaixa) {
    return { error: 'missing numero_identificacao or data_baixa', raw: row };
  }
  return {
    data_baixa: dataBaixa,
    numero_identificacao: numero,
    motivo_condenacao: trimStr(row.motivo_condenacao),
    responsavel_baixa: trimStr(row.responsavel_baixa),
    numero_identificacao_substituto: trimStr(row.numero_identificacao_substituto),
    observacoes: trimStr(row.observacoes),
    link_foto_evidencia: trimStr(row.link_foto_evidencia),
    user_id: userId,
  };
}

function mergeCadastro(existing, incoming) {
  const merged = { ...existing };
  for (const field of CADASTRO_FIELDS) {
    if (field === 'numero_identificacao') continue;
    const cur = merged[field];
    const next = incoming[field];
    if (cur === null || cur === undefined || cur === '') {
      if (next !== null && next !== undefined && next !== '') merged[field] = next;
    }
  }
  return merged;
}

function sqlLiteral(value) {
  if (value === null || value === undefined) return 'NULL';
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value === 'boolean') return value ? 'TRUE' : 'FALSE';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function buildInsertBatch(table, columns, rows, conflictClause) {
  if (rows.length === 0) return '';
  const chunks = [];
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const values = batch
      .map((row) => {
        const vals = columns.map((col) => sqlLiteral(row[col] ?? null));
        return `(${vals.join(', ')})`;
      })
      .join(',\n  ');
    chunks.push(
      `INSERT INTO ${table} (${columns.join(', ')})\nVALUES\n  ${values}\n${conflictClause};`
    );
  }
  return chunks.join('\n\n');
}

function buildBaixaInserts(rows) {
  return rows
    .map((row) => {
      const cols = BAIXA_FIELDS.concat(['user_id']);
      const vals = cols.map((c) => sqlLiteral(row[c] ?? null)).join(', ');
      return `INSERT INTO log_baixa_extintores (${cols.join(', ')})\nSELECT ${vals}\nWHERE NOT EXISTS (\n  SELECT 1 FROM log_baixa_extintores b\n  WHERE b.numero_identificacao = ${sqlLiteral(row.numero_identificacao)}\n    AND b.data_baixa = ${sqlLiteral(row.data_baixa)}\n    AND b.user_id = ${sqlLiteral(row.user_id)}\n);`;
    })
    .join('\n\n');
}

function readSheet(wb, sheetName) {
  const ws = wb.Sheets[sheetName];
  if (!ws) throw new Error(`Aba não encontrada: ${sheetName}`);
  return XLSX.utils.sheet_to_json(ws, { defval: '', raw: true });
}

function main() {
  const args = parseArgs(process.argv);
  const xlsxPath = path.resolve(args.xlsx);

  if (!fs.existsSync(xlsxPath)) {
    console.error(`Arquivo não encontrado: ${xlsxPath}`);
    process.exit(1);
  }

  const wb = XLSX.readFile(xlsxPath);
  const extintorRows = readSheet(wb, 'extintores');
  const baixaRowsRaw = readSheet(wb, 'log_baixas_extintores');

  const report = {
    generatedAt: new Date().toISOString(),
    userId: args.userId,
    xlsxPath,
    dryRun: args.dryRun,
    extintores: {
      sourceRows: extintorRows.length,
      uniqueCadastro: 0,
      inspections: 0,
      invalid: [],
      duplicateCadastroInExcel: 0,
    },
    baixas: {
      sourceRows: baixaRowsRaw.length,
      prepared: 0,
      invalid: [],
      skippedMissingCadastro: 0,
    },
  };

  const cadastroMap = new Map();
  const inspections = [];
  const inspectionKeys = new Set();

  for (let i = 0; i < extintorRows.length; i++) {
    const mapped = mapExtintorRow(extintorRows[i], args.userId);
    if (mapped.error) {
      report.extintores.invalid.push({ row: i + 2, reason: mapped.error });
      continue;
    }

    const id = mapped.cadastro.numero_identificacao;
    if (cadastroMap.has(id)) {
      report.extintores.duplicateCadastroInExcel++;
      cadastroMap.set(id, mergeCadastro(cadastroMap.get(id), mapped.cadastro));
    } else {
      cadastroMap.set(id, mapped.cadastro);
    }

    if (mapped.inspection) {
      const key = `${id}|${mapped.inspection.data_servico}`;
      if (!inspectionKeys.has(key)) {
        inspectionKeys.add(key);
        inspections.push(mapped.inspection);
      }
    }
  }

  const cadastroList = [...cadastroMap.values()];
  report.extintores.uniqueCadastro = cadastroList.length;
  report.extintores.inspections = inspections.length;

  const cadastroIds = new Set(cadastroList.map((c) => c.numero_identificacao));
  const baixas = [];

  for (let i = 0; i < baixaRowsRaw.length; i++) {
    const mapped = mapBaixaRow(baixaRowsRaw[i], args.userId);
    if (mapped.error) {
      report.baixas.invalid.push({ row: i + 2, reason: mapped.error });
      continue;
    }
    if (!cadastroIds.has(mapped.numero_identificacao)) {
      report.baixas.skippedMissingCadastro++;
      report.baixas.invalid.push({
        row: i + 2,
        reason: `extintor ${mapped.numero_identificacao} não encontrado no cadastro do Excel`,
      });
      continue;
    }
    baixas.push(mapped);
  }
  report.baixas.prepared = baixas.length;

  const seedDir = path.join(ROOT, 'supabase', 'seed');
  fs.mkdirSync(seedDir, { recursive: true });
  const reportPath = path.join(seedDir, 'baeri_import_report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');

  console.log('Relatório:', reportPath);
  console.log(JSON.stringify(report, null, 2));

  if (args.dryRun) {
    console.log('\n--dry-run: SQL não gerado.');
    return;
  }

  const cadastroCols = [...CADASTRO_FIELDS, 'user_id'];
  const inspectionCols = [...INSPECTION_FIELDS, 'user_id'];

  const sqlParts = [
    '-- BAERI extintores import (idempotente)',
    `-- user_id: ${args.userId}`,
    `-- generated: ${report.generatedAt}`,
    'BEGIN;',
    buildInsertBatch(
      'extintores',
      cadastroCols,
      cadastroList,
      'ON CONFLICT (numero_identificacao, user_id) DO NOTHING'
    ),
    buildInsertBatch(
      'inspecoes_extintores',
      inspectionCols,
      inspections,
      'ON CONFLICT (numero_identificacao, data_servico, user_id) DO NOTHING'
    ),
    buildBaixaInserts(baixas),
    'COMMIT;',
  ].filter(Boolean);

  const sqlPath = path.join(seedDir, 'baeri_extintores.sql');
  fs.writeFileSync(sqlPath, sqlParts.join('\n\n'), 'utf8');
  console.log('\nSQL gerado:', sqlPath);
  console.log(`Cadastro: ${cadastroList.length} | Inspeções: ${inspections.length} | Baixas: ${baixas.length}`);
}

main();
