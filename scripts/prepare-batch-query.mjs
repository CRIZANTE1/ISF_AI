import fs from 'fs';
import path from 'path';

const batchNum = process.argv[2]?.padStart(2, '0');
if (!batchNum) {
  console.error('Usage: node prepare-batch-query.mjs <batch_number>');
  process.exit(1);
}

const filePath = path.join('supabase/seed', `batch_${batchNum}.sql`);
let query = fs.readFileSync(filePath, 'utf8').trim();
if (query.endsWith(';;')) query = query.slice(0, -1);

const outPath = path.join('supabase/seed', '_current_batch.json');
fs.writeFileSync(outPath, JSON.stringify({ batch: batchNum, query, length: query.length }));
console.log(JSON.stringify({ batch: batchNum, length: query.length }));
