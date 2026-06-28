import { getPdfConfig, getCustomPdfConfig } from './pdfConfigRegistry';
import type { InventoryColumnDef } from './types';

function formatShortDate(value: unknown): string {
  if (!value) return '—';
  try {
    const d = new Date(String(value));
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return String(value);
  }
}

function formatLocation(item: Record<string, unknown>): string {
  if (item.latitude != null && item.longitude != null) {
    return `${Number(item.latitude).toFixed(6)}, ${Number(item.longitude).toFixed(6)}`;
  }
  return String(item.localizacao || item.local || item.location || '—');
}

const DEFAULT_INVENTORY_COLUMNS: InventoryColumnDef[] = [
  { header: 'ID', width: 35, getValue: (item) => String(item._reportId || '—') },
  { header: 'Localização', width: 50, getValue: formatLocation },
  {
    header: 'Info extras',
    width: 'auto',
    getValue: (item) => formatInventoryExtraInfo(item, String(item._equipmentType || '')),
  },
];

export function formatInventoryExtraInfo(
  item: Record<string, unknown>,
  equipmentType: string
): string {
  const config = equipmentType.startsWith('custom-')
    ? getCustomPdfConfig(equipmentType)
    : getPdfConfig(equipmentType);

  if (config) {
    return config.inventoryExtraInfo(item);
  }

  const parts: string[] = [];
  const status =
    item._last_inspection_status ||
    item.status_geral ||
    item.aprovado_inspecao ||
    item.resultado ||
    item.overall_status;
  if (status) parts.push(`Status: ${status}`);
  if (item.tipo_agente) parts.push(String(item.tipo_agente));
  if (item.marca_fabricante) parts.push(String(item.marca_fabricante));
  else if (item.marca) parts.push(String(item.marca));
  if (item.modelo) parts.push(String(item.modelo));
  return parts.length > 0 ? parts.join(' | ') : '—';
}

export function getInventoryTableColumns(equipmentType: string): InventoryColumnDef[] {
  const config = equipmentType.startsWith('custom-')
    ? getCustomPdfConfig(equipmentType)
    : getPdfConfig(equipmentType);
  return config?.inventoryTableColumns ?? DEFAULT_INVENTORY_COLUMNS;
}

export function buildInventoryTableRow(
  item: Record<string, unknown>,
  index: number,
  equipmentType: string
): string[] {
  const columns = getInventoryTableColumns(equipmentType);
  return [String(index + 1), ...columns.map((col) => col.getValue(item))];
}

export function getInventoryTableHead(equipmentType: string): string[] {
  const columns = getInventoryTableColumns(equipmentType);
  return ['#', ...columns.map((c) => c.header)];
}

export function getInventoryColumnStyles(
  equipmentType: string
): Record<number, { cellWidth: number | 'auto' }> {
  const columns = getInventoryTableColumns(equipmentType);
  const styles: Record<number, { cellWidth: number | 'auto' }> = {
    0: { cellWidth: 10 },
  };
  columns.forEach((col, i) => {
    styles[i + 1] = { cellWidth: col.width ?? 'auto' };
  });
  return styles;
}

export function shouldShowInventoryDetails(item: Record<string, unknown>): boolean {
  return Boolean(
    item._has_last_inspection ||
      item.link_foto_nao_conformidade ||
      item.observacoes ||
      item.plano_de_acao ||
      (item.resultados_json &&
        typeof item.resultados_json === 'object' &&
        Object.keys(item.resultados_json as object).length > 0)
  );
}

export function formatInventoryInspectionSummary(item: Record<string, unknown>): string[] {
  const lines: string[] = [];
  if (item._last_inspection_date) {
    lines.push(`Data da inspeção: ${formatShortDate(item._last_inspection_date)}`);
  }
  if (item._last_inspection_status) {
    lines.push(`Status: ${item._last_inspection_status}`);
  }
  if (item._last_inspection_type) {
    lines.push(`Tipo: ${item._last_inspection_type}`);
  }
  if (item._last_inspector) {
    lines.push(`Inspetor: ${item._last_inspector}`);
  }
  return lines;
}
