import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SEED = path.join(ROOT, 'supabase', 'seed');
const PROJECT_ID = 'flqbsqleqdierrqhlirw';

function loadQuery(batchNum) {
  const filePath = path.join(SEED, `batch_${batchNum}.sql`);
  let query = fs.readFileSync(filePath, 'utf8').trim();
  if (query.endsWith(';;')) query = query.slice(0, -1);
  return query;
}

const start = Number(process.argv[2] ?? 1);
const end = Number(process.argv[3] ?? 15);

const results = [];
for (let i = start; i <= end; i++) {
  const batch = String(i).padStart(2, '0');
  try {
    const query = loadQuery(batch);
    const outPath = path.join(SEED, `_batch_${batch}_payload.json`);
    fs.writeFileSync(outPath, JSON.stringify({ batch, project_id: PROJECT_ID, query, length: query.length }));
    results.push({ batch, status: 'prepared', length: query.length, payload: outPath });
  } catch (err) {
    results.push({ batch, status: 'error', error: String(err?.message || err) });
  }
}

const reportPath = path.join(SEED, 'batch_mcp_prepare_report.json');
fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));
console.log(JSON.stringify({ reportPath, results }, null, 2));
