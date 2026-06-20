/**
 * Executa os batches SQL gerados em supabase/seed/batch_*.sql
 * via Supabase Management API (requer SUPABASE_ACCESS_TOKEN no ambiente).
 *
 * Uso:
 *   set SUPABASE_ACCESS_TOKEN=seu_token
 *   node scripts/execute-baeri-batches.mjs
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SEED_DIR = path.join(__dirname, '..', 'supabase', 'seed');
const PROJECT_REF = 'flqbsqleqdierrqhlirw';

function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env');
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

function getAccessToken() {
  loadEnvFile();
  const token = process.env.SUPABASE_ACCESS_TOKEN || process.env.SUPABASE_TOKEN || '';
  if (!token) {
    throw new Error(
      'Defina SUPABASE_ACCESS_TOKEN no .env (Personal Access Token em supabase.com/dashboard/account/tokens).'
    );
  }
  return token;
}

async function executeSql(query) {
  const token = getAccessToken();
  if (!token) {
    throw new Error(
      'Defina SUPABASE_ACCESS_TOKEN ou SUPABASE_TOKEN no ambiente antes de executar.'
    );
  }

  const response = await fetch(
    `https://api.supabase.com/v1/projects/${PROJECT_REF}/database/query`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    }
  );

  const text = await response.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  if (!response.ok) {
    throw new Error(
      `HTTP ${response.status}: ${typeof payload === 'string' ? payload : JSON.stringify(payload)}`
    );
  }

  return payload;
}

async function main() {
  const prefix = process.argv[2] || 'batch_';
  const batchPattern =
    prefix === 'batch_'
      ? /^batch_\d+\.sql$/
      : new RegExp(`^${prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\d+\\.sql$`);

  const batches = fs
    .readdirSync(SEED_DIR)
    .filter((name) => batchPattern.test(name))
    .sort();

  if (batches.length === 0) {
    throw new Error(
      `Nenhum batch com prefixo "${prefix}" em ${SEED_DIR}. Gere o SQL de importação primeiro.`
    );
  }

  console.log(`Executando ${batches.length} batches (${prefix}*)...`);

  for (const file of batches) {
    const sql = fs.readFileSync(path.join(SEED_DIR, file), 'utf8').replace(/;;+/g, ';').trim();
    process.stdout.write(`→ ${file} ... `);
    await executeSql(sql);
    console.log('ok');
  }

  const userId = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84';
  const summary = await executeSql(`
    SELECT
      (SELECT COUNT(*) FROM extintores WHERE user_id = '${userId}') AS extintores,
      (SELECT COUNT(*) FROM inventario_camaras_espuma WHERE user_id = '${userId}') AS camaras,
      (SELECT COUNT(*) FROM abrigos WHERE user_id = '${userId}') AS abrigos,
      (SELECT COUNT(*) FROM inspecoes_camaras_espuma WHERE user_id = '${userId}') AS inspecoes_camaras,
      (SELECT COUNT(*) FROM inspecoes_abrigos WHERE user_id = '${userId}') AS inspecoes_abrigos,
      (SELECT COUNT(*) FROM inventario_chuveiros_lava_olhos WHERE user_id = '${userId}') AS chuveiros,
      (SELECT COUNT(*) FROM inspecoes_chuveiros_lava_olhos WHERE user_id = '${userId}') AS inspecoes_chuveiros;
  `);

  console.log('\nResumo pós-importação:');
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error.message || error);
  process.exit(1);
});
