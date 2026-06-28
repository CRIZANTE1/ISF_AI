export interface InspectionData {
  id: number | string;
  data_inspecao: string;
  status_geral?: string;
  tipo_servico?: string;
  tipo_inspecao?: string;
  inspetor?: string;
  observacoes_gerais?: string;
  plano_de_acao?: string;
  link_foto_nao_conformidade?: string;
  resultados_json?: Record<string, unknown>;
  latitude?: number;
  longitude?: number;
  data_proxima_inspecao?: string;
  [key: string]: unknown;
}

export interface EquipmentData {
  id: string;
  name: string;
  type: string;
  location?: string;
  [key: string]: unknown;
}

export interface ChecklistRow {
  section?: string;
  item: string;
  status: string;
  isNonConforme: boolean;
}

export interface ChecklistSection {
  title: string;
  rows: ChecklistRow[];
}

export interface MonthlyColumnDef {
  key: string;
  header: string;
  width?: number | 'auto';
}

export interface MonthlyReportRow {
  equipmentId: string;
  cells: string[];
  link_foto_nao_conformidade?: string | null;
  observacoes?: string | null;
  plano_de_acao?: string | null;
}

export interface InventoryColumnDef {
  header: string;
  width?: number | 'auto';
  getValue: (item: Record<string, unknown>) => string;
}

export interface EquipmentPdfConfig {
  typeKey: string;
  typeLabel: string;
  inspectionTable: string;
  dateField: string;
  equipmentIdField: string;
  observacoesField?: string;
  /** Campos extras a selecionar na query mensual */
  inspectionSelectFields?: string[];
  /** Colunas da tabela resumo do inventário (além de #). Se omitido, usa ID + Local + Info extras */
  inventoryTableColumns?: InventoryColumnDef[];
  mapInspection: (raw: Record<string, unknown>) => InspectionData;
  inventoryExtraInfo: (item: Record<string, unknown>) => string;
  monthlyColumns: MonthlyColumnDef[];
  buildMonthlyRow: (
    equipment: Record<string, unknown>,
    inspection: Record<string, unknown>,
    profileFallbackName?: string
  ) => MonthlyReportRow;
  /** Se true, usa renderização seccionada (SCBA) */
  sectionedChecklist?: boolean;
}
