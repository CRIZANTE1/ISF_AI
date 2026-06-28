import type { ChecklistRow, ChecklistSection } from './types';
import {
  FOAM_CHAMBER_CHECKLIST,
  CANNON_MONITOR_CHECKLIST_VISUAL,
  CANNON_MONITOR_CHECKLIST_FUNCIONAL,
} from '../../constants/checklists';

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

/**
 * Agrupa checklist plano de câmara de espuma pelas seções do modelo (FOAM_CHAMBER_CHECKLIST).
 */
export function groupFoamChamberChecklist(
  model: string | undefined,
  inspectionType: string | undefined,
  results: Record<string, unknown> | null | undefined
): ChecklistSection[] {
  if (!results || !model) {
    return [{ title: '', rows: flattenChecklistResults(results) }];
  }

  // Import dinâmico evitado — checklist importado pelo chamador ou via require inline
  return groupTemplateChecklist(results, getFoamChamberSections(model, inspectionType));
}

/**
 * Agrupa checklist plano de canhão monitor pelas seções do template.
 */
export function groupCannonMonitorChecklist(
  inspectionType: string | undefined,
  results: Record<string, unknown> | null | undefined
): ChecklistSection[] {
  if (!results) return [];
  return groupTemplateChecklist(results, getCannonMonitorSections(inspectionType));
}

function getFoamChamberSections(
  model: string,
  inspectionType?: string
): Array<{ title: string; questions: string[] }> {
  const checklist = FOAM_CHAMBER_CHECKLIST[model];
  if (!checklist) return [];

  const isVisual = inspectionType === 'Visual Semestral';
  return Object.entries(checklist)
    .filter(([section]) => !(isVisual && section === 'Teste Funcional'))
    .map(([title, questions]) => ({ title, questions }));
}

function getCannonMonitorSections(
  inspectionType?: string
): Array<{ title: string; questions: string[] }> {
  const checklist =
    inspectionType === 'Funcional'
      ? CANNON_MONITOR_CHECKLIST_FUNCIONAL
      : CANNON_MONITOR_CHECKLIST_VISUAL;
  return Object.entries(checklist).map(([title, questions]) => ({ title, questions }));
}

function groupTemplateChecklist(
  results: Record<string, unknown>,
  sections: Array<{ title: string; questions: string[] }>
): ChecklistSection[] {
  if (sections.length === 0) {
    return [{ title: '', rows: flattenChecklistResults(results) }];
  }

  const usedKeys = new Set<string>();
  const grouped: ChecklistSection[] = [];

  for (const section of sections) {
    const rows: ChecklistRow[] = [];
    for (const question of section.questions) {
      if (question in results) {
        usedKeys.add(question);
        const formatted = formatChecklistStatus(results[question]);
        rows.push({
          section: section.title,
          item: question,
          status: formatted.display,
          isNonConforme: formatted.isNonConforme,
        });
      }
    }
    if (rows.length > 0) {
      grouped.push({ title: section.title, rows });
    }
  }

  const orphanRows: ChecklistRow[] = [];
  for (const [key, value] of Object.entries(results)) {
    if (!usedKeys.has(key)) {
      const formatted = formatChecklistStatus(value);
      orphanRows.push({
        item: key,
        status: formatted.display,
        isNonConforme: formatted.isNonConforme,
      });
    }
  }
  if (orphanRows.length > 0) {
    grouped.push({ title: 'Outros Itens', rows: orphanRows });
  }

  return grouped;
}

export function resolveChecklistSections(
  equipmentType: string,
  results: Record<string, unknown> | null | undefined,
  equipment?: Record<string, unknown>,
  inspection?: Record<string, unknown>
): ChecklistSection[] {
  if (!results) return [];

  if (equipmentType === 'camara_espuma') {
    const model = String(equipment?.modelo || equipment?.model || '');
    const inspectionType = String(inspection?.tipo_inspecao || '');
    return groupFoamChamberChecklist(model, inspectionType, results);
  }

  if (equipmentType === 'canhao_monitor') {
    const inspectionType = String(inspection?.tipo_inspecao || '');
    return groupCannonMonitorChecklist(inspectionType, results);
  }

  if (hasSectionedChecklist(results)) {
    return groupChecklistBySection(flattenChecklistResults(results));
  }

  return [{ title: '', rows: flattenChecklistResults(results) }];
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
