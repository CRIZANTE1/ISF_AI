import type { ChecklistRow, ChecklistSection } from './types';

const OBSERVACOES_KEY = 'Observações';

export function formatChecklistStatus(value: unknown): {
  display: string;
  isConforme: boolean;
  isNonConforme: boolean;
} {
  if (value === true || value === 'sim' || value === 'Sim') {
    return { display: '✓ Conforme', isConforme: true, isNonConforme: false };
  }
  if (value === false || value === 'não' || value === 'Não') {
    return { display: '✗ Não Conforme', isConforme: false, isNonConforme: true };
  }
  if (typeof value === 'string') {
    const normalized = value.trim();
    const lower = normalized.toLowerCase();
    if (
      lower === 'conforme' ||
      lower === 'c' ||
      lower === 'aprovado' ||
      lower === 'ok' ||
      lower === 'sim'
    ) {
      return { display: `✓ ${normalized}`, isConforme: true, isNonConforme: false };
    }
    if (
      lower === 'não conforme' ||
      lower === 'nao conforme' ||
      lower === 'n/c' ||
      lower === 'reprovado' ||
      lower === 'não' ||
      lower === 'nao'
    ) {
      return { display: `✗ ${normalized}`, isConforme: false, isNonConforme: true };
    }
    return { display: normalized, isConforme: false, isNonConforme: false };
  }
  if (value === null || value === undefined) {
    return { display: '—', isConforme: false, isNonConforme: false };
  }
  return { display: String(value), isConforme: false, isNonConforme: false };
}

function isNestedChecklist(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Achata resultados_json plano ou aninhado (ex.: SCBA) em linhas de checklist.
 */
export function flattenChecklistResults(
  resultados: Record<string, unknown> | null | undefined,
  sectionPrefix?: string
): ChecklistRow[] {
  if (!resultados || typeof resultados !== 'object') return [];

  const rows: ChecklistRow[] = [];

  for (const [key, value] of Object.entries(resultados)) {
    if (isNestedChecklist(value) && !Array.isArray(value)) {
      const hasPrimitiveChild = Object.values(value).some(
        (v) => typeof v !== 'object' || v === null
      );
      if (hasPrimitiveChild) {
        rows.push(...flattenChecklistResults(value as Record<string, unknown>, key));
        continue;
      }
    }

    if (key === OBSERVACOES_KEY) {
      const text = String(value ?? '').trim();
      if (text) {
        rows.push({
          section: sectionPrefix,
          item: OBSERVACOES_KEY,
          status: text,
          isNonConforme: false,
        });
      }
      continue;
    }

    const formatted = formatChecklistStatus(value);
    rows.push({
      section: sectionPrefix,
      item: key,
      status: formatted.display,
      isNonConforme: formatted.isNonConforme,
    });
  }

  return rows;
}

/**
 * Agrupa linhas achatadas em seções (para SCBA e similares).
 */
export function groupChecklistBySection(rows: ChecklistRow[]): ChecklistSection[] {
  const sectionMap = new Map<string, ChecklistRow[]>();
  const flatRows: ChecklistRow[] = [];

  for (const row of rows) {
    if (row.section) {
      const list = sectionMap.get(row.section) ?? [];
      list.push(row);
      sectionMap.set(row.section, list);
    } else {
      flatRows.push(row);
    }
  }

  const sections: ChecklistSection[] = [];

  if (flatRows.length > 0) {
    sections.push({ title: '', rows: flatRows });
  }

  for (const [title, sectionRows] of sectionMap) {
    sections.push({ title, rows: sectionRows });
  }

  return sections;
}

export function extractNonConformities(resultados: Record<string, unknown> | null | undefined): string[] {
  return flattenChecklistResults(resultados)
    .filter((row) => row.isNonConforme && row.item !== OBSERVACOES_KEY)
    .map((row) => (row.section ? `${row.section} — ${row.item}` : row.item));
}

export function hasSectionedChecklist(resultados: Record<string, unknown> | null | undefined): boolean {
  if (!resultados) return false;
  return Object.values(resultados).some(
    (v) => typeof v === 'object' && v !== null && !Array.isArray(v)
  );
}
