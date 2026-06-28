import { formatCapacityDisplay, formatCo2WeightDisplay } from '../monthlyExtinguisherReport';
import { mapInspectionForPdf } from './inspectionMapper';
import type { EquipmentPdfConfig, MonthlyReportRow } from './types';

function formatLocation(
  equipment: Record<string, unknown>,
  inspection: Record<string, unknown>
): string {
  const lat = inspection.latitude ?? equipment.latitude ?? equipment.gps_latitude;
  const lng = inspection.longitude ?? equipment.longitude ?? equipment.gps_longitude;
  if (lat != null && lng != null) {
    return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
  }
  return String(
    equipment.localizacao ||
      equipment.local ||
      equipment.location ||
      equipment.name ||
      '—'
  );
}

function baseMonthlyRow(
  equipmentId: string,
  cells: string[],
  inspection: Record<string, unknown>
): MonthlyReportRow {
  return {
    equipmentId,
    cells,
    link_foto_nao_conformidade: (inspection.link_foto_nao_conformidade as string) ?? null,
    observacoes:
      (inspection.observacoes_gerais as string) ??
      (inspection.observacoes as string) ??
      (inspection.corrective_action_notes as string) ??
      null,
    plano_de_acao:
      (inspection.plano_de_acao as string) ?? (inspection.action_plan as string) ?? null,
  };
}

function inspectorName(
  inspection: Record<string, unknown>,
  profileFallbackName?: string
): string {
  return String(
    inspection.inspetor_responsavel ||
      inspection.inspetor ||
      inspection.inspector_name ||
      profileFallbackName ||
      '—'
  );
}

function inspectionStatus(inspection: Record<string, unknown>): string {
  return String(
    inspection.status_geral ||
      inspection.aprovado_inspecao ||
      inspection.resultado_teste ||
      inspection.overall_status ||
      inspection.resultado ||
      '—'
  );
}

function inspectionDate(inspection: Record<string, unknown>, dateField: string): string {
  const raw = inspection[dateField];
  if (!raw) return '—';
  try {
    const d = new Date(String(raw));
    if (Number.isNaN(d.getTime())) return String(raw);
    return d.toLocaleDateString('pt-BR');
  } catch {
    return String(raw);
  }
}

function defaultInventoryExtra(item: Record<string, unknown>): string {
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

const COMMON_INSPECTION_FIELDS = [
  'latitude',
  'longitude',
  'link_foto_nao_conformidade',
  'plano_de_acao',
  'created_at',
];

export const PDF_CONFIGS: Record<string, EquipmentPdfConfig> = {
  extintor: {
    typeKey: 'extintor',
    typeLabel: 'Extintor de Incêndio',
    inspectionTable: 'inspecoes_extintores',
    dateField: 'data_servico',
    equipmentIdField: 'numero_identificacao',
    observacoesField: 'observacoes_gerais',
    inspectionSelectFields: [
      'numero_identificacao',
      'data_servico',
      'status_geral',
      'aprovado_inspecao',
      'tipo_agente',
      'peso_medido_conjunto_kg',
      'perda_kg',
      'inspetor_responsavel',
      ...COMMON_INSPECTION_FIELDS,
      'observacoes_gerais',
    ],
    mapInspection: (raw) => mapInspectionForPdf(raw, 'extintor'),
    inventoryExtraInfo: (item) => {
      const parts: string[] = [];
      if (item.tipo_agente) parts.push(String(item.tipo_agente));
      if (item.capacidade != null) {
        parts.push(formatCapacityDisplay(item.tipo_agente as string, item.capacidade as number));
      }
      if (item.marca_fabricante) parts.push(String(item.marca_fabricante));
      return parts.length > 0 ? parts.join(' | ') : defaultInventoryExtra(item);
    },
    monthlyColumns: [
      { key: 'id', header: 'ID', width: 22 },
      { key: 'agente', header: 'Agente', width: 22 },
      { key: 'cap', header: 'Cap.', width: 14 },
      { key: 'local', header: 'Localização', width: 38 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'status', header: 'Status', width: 22 },
      { key: 'peso', header: 'Peso CO₂', width: 28 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const agent = (equipment.tipo_agente ?? inspection.tipo_agente) as string;
      const id = String(equipment.numero_identificacao || inspection.numero_identificacao);
      return baseMonthlyRow(
        id,
        [
          id,
          agent || '—',
          formatCapacityDisplay(agent, equipment.capacidade as number),
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'data_servico'),
          inspectionStatus(inspection),
          formatCo2WeightDisplay(
            agent,
            inspection.peso_medido_conjunto_kg as number,
            inspection.perda_kg as number
          ),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  },

  mangueira: {
    typeKey: 'mangueira',
    typeLabel: 'Mangueira de Incêndio',
    inspectionTable: 'inspecoes_mangueiras',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_mangueira',
    observacoesField: 'observacoes',
    inspectionSelectFields: [
      'id_mangueira',
      'data_inspecao',
      'status_geral',
      'resultado',
      'inspetor',
      ...COMMON_INSPECTION_FIELDS,
      'observacoes',
    ],
    mapInspection: (raw) => mapInspectionForPdf(raw, 'mangueira'),
    inventoryExtraInfo: (item) => {
      const parts: string[] = [];
      if (item.diametro) parts.push(`${item.diametro} mm`);
      if (item.comprimento) parts.push(`${item.comprimento} m`);
      if (item.ano_fabricacao) parts.push(`Ano: ${item.ano_fabricacao}`);
      if (item.marca) parts.push(String(item.marca));
      return parts.length > 0 ? parts.join(' | ') : defaultInventoryExtra(item);
    },
    monthlyColumns: [
      { key: 'id', header: 'ID', width: 22 },
      { key: 'diam', header: 'Diâm.', width: 16 },
      { key: 'comp', header: 'Comp.', width: 16 },
      { key: 'local', header: 'Localização', width: 34 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'status', header: 'Status', width: 22 },
      { key: 'resultado', header: 'Resultado', width: 22 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const id = String(equipment.id_mangueira || inspection.id_mangueira);
      return baseMonthlyRow(
        id,
        [
          id,
          equipment.diametro != null ? `${equipment.diametro} mm` : '—',
          equipment.comprimento != null ? `${equipment.comprimento} m` : '—',
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'data_inspecao'),
          inspectionStatus(inspection),
          String(inspection.resultado || '—'),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  },

  scba: {
    typeKey: 'scba',
    typeLabel: 'Conjunto Autônomo de Respiração (SCBA)',
    inspectionTable: 'inspecoes_scba',
    dateField: 'data_inspecao',
    equipmentIdField: 'numero_serie_equipamento',
    inspectionSelectFields: [
      'numero_serie_equipamento',
      'data_inspecao',
      'status_geral',
      'inspetor',
      ...COMMON_INSPECTION_FIELDS,
      'observacoes_gerais',
      'observacoes',
    ],
    mapInspection: (raw) => mapInspectionForPdf(raw, 'scba'),
    sectionedChecklist: true,
    inventoryExtraInfo: (item) => {
      const parts: string[] = [];
      if (item.marca) parts.push(String(item.marca));
      if (item.modelo) parts.push(String(item.modelo));
      return parts.length > 0 ? parts.join(' | ') : defaultInventoryExtra(item);
    },
    monthlyColumns: [
      { key: 'id', header: 'Nº Série', width: 28 },
      { key: 'marca', header: 'Marca', width: 24 },
      { key: 'local', header: 'Localização', width: 38 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'status', header: 'Status', width: 24 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const id = String(equipment.numero_serie_equipamento || inspection.numero_serie_equipamento);
      return baseMonthlyRow(
        id,
        [
          id,
          String(equipment.marca || '—'),
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'data_inspecao'),
          inspectionStatus(inspection),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  },

  multigas: {
    typeKey: 'multigas',
    typeLabel: 'Medidor Multigás',
    inspectionTable: 'inspecoes_multigas',
    dateField: 'data_teste',
    equipmentIdField: 'id_equipamento',
    observacoesField: 'observacoes',
    inspectionSelectFields: [
      'id_equipamento',
      'data_teste',
      'resultado_teste',
      'tipo_teste',
      ...COMMON_INSPECTION_FIELDS,
      'observacoes',
    ],
    mapInspection: (raw) => mapInspectionForPdf(raw, 'multigas'),
    inventoryExtraInfo: (item) => {
      const parts: string[] = [];
      if (item.marca) parts.push(String(item.marca));
      if (item.modelo) parts.push(String(item.modelo));
      if (item.numero_serie) parts.push(`S/N: ${item.numero_serie}`);
      return parts.length > 0 ? parts.join(' | ') : defaultInventoryExtra(item);
    },
    monthlyColumns: [
      { key: 'id', header: 'ID', width: 22 },
      { key: 'modelo', header: 'Marca/Modelo', width: 32 },
      { key: 'local', header: 'Localização', width: 34 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'resultado', header: 'Resultado', width: 22 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const id = String(equipment.id_equipamento || inspection.id_equipamento);
      const modelo = [equipment.marca, equipment.modelo].filter(Boolean).join(' ') || '—';
      return baseMonthlyRow(
        id,
        [
          id,
          modelo,
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'data_teste'),
          String(inspection.resultado_teste || '—'),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  },

  camara_espuma: {
    typeKey: 'camara_espuma',
    typeLabel: 'Câmara de Espuma',
    inspectionTable: 'inspecoes_camaras_espuma',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_camara',
    mapInspection: (raw) => mapInspectionForPdf(raw, 'camara_espuma'),
    inventoryExtraInfo: defaultInventoryExtra,
    monthlyColumns: [
      { key: 'id', header: 'ID', width: 24 },
      { key: 'local', header: 'Localização', width: 40 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'status', header: 'Status', width: 22 },
      { key: 'tipo', header: 'Tipo Inspeção', width: 28 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const id = String(equipment.id_camara || inspection.id_camara);
      return baseMonthlyRow(
        id,
        [
          id,
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'data_inspecao'),
          inspectionStatus(inspection),
          String(inspection.tipo_inspecao || '—'),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  },

  canhao_monitor: {
    typeKey: 'canhao_monitor',
    typeLabel: 'Canhão Monitor',
    inspectionTable: 'inspecoes_canhoes_monitores',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_equipamento',
    mapInspection: (raw) => mapInspectionForPdf(raw, 'canhao_monitor'),
    inventoryExtraInfo: defaultInventoryExtra,
    monthlyColumns: [
      { key: 'id', header: 'ID', width: 24 },
      { key: 'local', header: 'Localização', width: 40 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'status', header: 'Status', width: 22 },
      { key: 'tipo', header: 'Tipo Inspeção', width: 28 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const id = String(equipment.id_equipamento || inspection.id_equipamento);
      return baseMonthlyRow(
        id,
        [
          id,
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'data_inspecao'),
          inspectionStatus(inspection),
          String(inspection.tipo_inspecao || '—'),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  },

  chuveiro_lavaolhos: {
    typeKey: 'chuveiro_lavaolhos',
    typeLabel: 'Chuveiro/Lava-olhos',
    inspectionTable: 'inspecoes_chuveiros_lava_olhos',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_equipamento',
    mapInspection: (raw) => mapInspectionForPdf(raw, 'chuveiro_lavaolhos'),
    inventoryExtraInfo: defaultInventoryExtra,
    monthlyColumns: [
      { key: 'id', header: 'ID', width: 24 },
      { key: 'local', header: 'Localização', width: 40 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'status', header: 'Status', width: 22 },
      { key: 'tipo', header: 'Tipo Inspeção', width: 28 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const id = String(equipment.id_equipamento || inspection.id_equipamento);
      return baseMonthlyRow(
        id,
        [
          id,
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'data_inspecao'),
          inspectionStatus(inspection),
          String(inspection.tipo_inspecao || '—'),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  },

  alarme: {
    typeKey: 'alarme',
    typeLabel: 'Sistema de Alarme',
    inspectionTable: 'inspecoes_alarmes',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_sistema',
    mapInspection: (raw) => mapInspectionForPdf(raw, 'alarme'),
    inventoryExtraInfo: defaultInventoryExtra,
    monthlyColumns: [
      { key: 'id', header: 'ID', width: 24 },
      { key: 'local', header: 'Localização', width: 40 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'status', header: 'Status', width: 22 },
      { key: 'tipo', header: 'Tipo Inspeção', width: 28 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const id = String(equipment.id_sistema || inspection.id_sistema);
      return baseMonthlyRow(
        id,
        [
          id,
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'data_inspecao'),
          inspectionStatus(inspection),
          String(inspection.tipo_inspecao || '—'),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  },

  abrigo: {
    typeKey: 'abrigo',
    typeLabel: 'Abrigo de Emergência',
    inspectionTable: 'inspecoes_abrigos',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_abrigo',
    mapInspection: (raw) => mapInspectionForPdf(raw, 'abrigo'),
    inventoryExtraInfo: defaultInventoryExtra,
    monthlyColumns: [
      { key: 'id', header: 'ID', width: 24 },
      { key: 'local', header: 'Localização', width: 40 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'status', header: 'Status', width: 22 },
      { key: 'tipo', header: 'Tipo Inspeção', width: 28 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const id = String(equipment.id_abrigo || inspection.id_abrigo);
      return baseMonthlyRow(
        id,
        [
          id,
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'data_inspecao'),
          inspectionStatus(inspection),
          String(inspection.tipo_inspecao || '—'),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  },

  reserva_tecnica: {
    typeKey: 'reserva_tecnica',
    typeLabel: 'Reserva Técnica de Água',
    inspectionTable: 'water_reservoir_inspections',
    dateField: 'inspected_at',
    equipmentIdField: 'id',
    observacoesField: 'corrective_action_notes',
    inspectionSelectFields: [
      'reservoir_id',
      'inspected_at',
      'overall_status',
      'level_reading',
      'condition',
      'inspector_name',
      'action_plan',
      'corrective_action_notes',
      'created_at',
    ],
    mapInspection: (raw) => mapInspectionForPdf(raw, 'reserva_tecnica'),
    inventoryExtraInfo: (item) => {
      const parts: string[] = [];
      if (item.capacity_m3 != null) parts.push(`${item.capacity_m3} m³`);
      if (item.reservoir_type) parts.push(String(item.reservoir_type));
      if (item.product_type) parts.push(String(item.product_type));
      return parts.length > 0 ? parts.join(' | ') : defaultInventoryExtra(item);
    },
    monthlyColumns: [
      { key: 'nome', header: 'Nome', width: 28 },
      { key: 'cap', header: 'Capacidade', width: 20 },
      { key: 'local', header: 'Localização', width: 34 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'status', header: 'Status', width: 18 },
      { key: 'nivel', header: 'Nível', width: 20 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const id = String(equipment.id || equipment.name || inspection.reservoir_id);
      const name = String(equipment.name || equipment.code || id);
      return baseMonthlyRow(
        id,
        [
          name,
          equipment.capacity_m3 != null ? `${equipment.capacity_m3} m³` : '—',
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'inspected_at'),
          inspectionStatus(inspection),
          String(inspection.level_reading || '—'),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  },
};

export function getPdfConfig(equipmentType: string): EquipmentPdfConfig | null {
  if (equipmentType.startsWith('custom-')) {
    return getCustomPdfConfig(equipmentType);
  }
  return PDF_CONFIGS[equipmentType] ?? null;
}

export function getCustomPdfConfig(
  equipmentType: string,
  typeLabel?: string
): EquipmentPdfConfig {
  return {
    typeKey: equipmentType,
    typeLabel: typeLabel || equipmentType.replace('custom-', '').replace(/-/g, ' '),
    inspectionTable: 'custom_equipment_inspections',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_equipamento',
    mapInspection: (raw) => mapInspectionForPdf(raw),
    inventoryExtraInfo: defaultInventoryExtra,
    monthlyColumns: [
      { key: 'id', header: 'ID', width: 24 },
      { key: 'local', header: 'Localização', width: 40 },
      { key: 'data', header: 'Data', width: 18 },
      { key: 'status', header: 'Status', width: 22 },
      { key: 'tipo', header: 'Tipo Inspeção', width: 28 },
      { key: 'inspetor', header: 'Inspetor', width: 'auto' },
    ],
    buildMonthlyRow: (equipment, inspection, profileFallbackName) => {
      const id = String(equipment.id_equipamento || inspection.id_equipamento);
      return baseMonthlyRow(
        id,
        [
          id,
          formatLocation(equipment, inspection),
          inspectionDate(inspection, 'data_inspecao'),
          inspectionStatus(inspection),
          String(inspection.tipo_inspecao || '—'),
          inspectorName(inspection, profileFallbackName),
        ],
        inspection
      );
    },
  };
}

export function getEquipmentTypeName(type: string, customLabel?: string): string {
  if (type.startsWith('custom-')) {
    return customLabel || getCustomPdfConfig(type).typeLabel;
  }
  return PDF_CONFIGS[type]?.typeLabel || type;
}
