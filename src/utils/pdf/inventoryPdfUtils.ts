import { getPdfConfig, getCustomPdfConfig } from './pdfConfigRegistry';

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
    item.status_geral || item.aprovado_inspecao || item.resultado || item.overall_status;
  if (status) parts.push(`Status: ${status}`);
  if (item.tipo_agente) parts.push(String(item.tipo_agente));
  if (item.marca_fabricante) parts.push(String(item.marca_fabricante));
  else if (item.marca) parts.push(String(item.marca));
  if (item.modelo) parts.push(String(item.modelo));
  return parts.length > 0 ? parts.join(' | ') : '—';
}
