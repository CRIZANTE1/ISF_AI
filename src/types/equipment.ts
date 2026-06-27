/**
 * Tipos compartilhados para todos os equipamentos do sistema ISFIA.
 *
 * Cada tipo de equipamento tem:
 *   - uma interface "base" derivada da tabela de inventário (Row do Supabase)
 *   - uma interface "enriquecida" que inclui campos mesclados da última inspeção
 *   - uma interface de inspeção
 *
 * Isso elimina o uso extensivo de `any` no EquipmentCacheContext e em dezenas
 * de arquivos utils/, expondo bugs em tempo de compilação.
 */

import type { Database } from './supabase';

// ---------------------------------------------------------------------------
// Aliases para as linhas do banco (tabelas de inventário)
// ---------------------------------------------------------------------------

/** Extintor — linha da tabela `extintores` */
export type ExtinguisherRow = Database['public']['Tables']['extintores']['Row'];

/** Extintor enriquecido com campos da última inspeção */
export interface Extinguisher extends ExtinguisherRow {
  /** ID interno (opcional, pode vir de join) */
  id?: number;
  /** Status mesclado da última inspeção (aprovado / pendente / reprovado) */
  status_geral?: string | null;
  /** Campo legado — mapeado para status_geral */
  status?: string | null;
  /** Se possui inspeção aprovada */
  aprovado_inspecao?: string | null;
  /** Próximas datas — podem vir da inspeção */
  data_proxima_inspecao?: string | null;
  data_proxima_manutencao_2_nivel?: string | null;
  data_proxima_manutencao_3_nivel?: string | null;
  data_ultimo_ensaio_hidrostatico?: string | null;
  /** Foto de não conformidade (inspeção) */
  link_foto_nao_conformidade?: string | null;
  /** PDF do relatório (inspeção) */
  link_relatorio_pdf?: string | null;
  /** Selo Inmetro (inspeção/manutenção) */
  numero_selo_inmetro?: string | null;
}

// ---------------------------------------------------------------------------

/** Mangueira — linha da tabela `mangueiras` */
export type HoseRow = Database['public']['Tables']['mangueiras']['Row'];

export interface Hose extends HoseRow {
  id?: number;
  status_geral?: string | null;
  status?: string | null;
  resultado?: string | null;
  data_proxima_inspecao?: string | null;
  data_proximo_teste?: string | null;
}

export interface HoseInspection {
  id?: number;
  id_mangueira: string;
  data_inspecao: string;
  resultado: string;
  status_geral?: string | null;
  plano_de_acao?: string | null;
  resultados_json?: Record<string, unknown> | null;
  observacoes?: string | null;
  link_foto_nao_conformidade?: string | null;
  inspetor?: string | null;
  data_proxima_inspecao?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  created_at?: string;
  user_id?: string | null;
}

// ---------------------------------------------------------------------------

/** SCBA (Conjunto Autônomo) — linha da tabela `conjuntos_autonomos` */
export type SCBARow = Database['public']['Tables']['conjuntos_autonomos']['Row'];

export interface SCBA extends SCBARow {
  id?: number;
  status_geral?: string | null;
  status?: string | null;
  data_proxima_inspecao?: string | null;
}

export interface SCBAInspection {
  id?: number;
  data_inspecao?: string | null;
  numero_serie_equipamento: string;
  status_geral?: string | null;
  resultados_json?: Record<string, unknown> | null;
  plano_de_acao?: string | null;
  inspetor?: string | null;
  data_proxima_inspecao?: string | null;
  link_foto_nao_conformidade?: string | null;
  created_at?: string;
  user_id?: string | null;
}

// ---------------------------------------------------------------------------

/** Detector Multigás — linha da tabela `inventario_multigas` */
export type MultigasRow = Database['public']['Tables']['inventario_multigas']['Row'];

export interface MultigasDetector extends MultigasRow {
  id?: number;
  status_geral?: string | null;
  status?: string | null;
  data_proximo_teste?: string | null;
  data_proxima_inspecao?: string | null;
  resultado_teste?: string | null;
}

export interface MultigasInspection {
  id?: number;
  data_teste?: string | null;
  id_equipamento: string;
  tipo_teste?: string | null;
  resultado_teste?: string | null;
  // Colunas do banco (minúsculas)
  co_encontrado?: number | null;
  co_referencia?: number | null;
  h2s_encontrado?: number | null;
  h2s_referencia?: number | null;
  lel_encontrado?: number | null;
  lel_referencia?: number | null;
  o2_encontrado?: number | null;
  o2_referencia?: number | null;
  // Aliases legacy (maiúsculos) — compatibilidade com formulários
  LEL_referencia?: number | null;
  O2_referencia?: number | null;
  H2S_referencia?: number | null;
  CO_referencia?: number | null;
  LEL_encontrado?: number | null;
  O2_encontrado?: number | null;
  H2S_encontrado?: number | null;
  CO_encontrado?: number | null;
  observacoes?: string | null;
  plano_de_acao?: string | null;
  data_proximo_teste?: string | null;
  inspetor?: string | null;
  user_id?: string | null;
}

// ---------------------------------------------------------------------------

/** Câmara de Espuma — linha da tabela `inventario_camaras_espuma` */
export type FoamChamberRow = Database['public']['Tables']['inventario_camaras_espuma']['Row'];

export interface FoamChamber extends FoamChamberRow {
  id?: number;
  status_geral?: string | null;
  status?: string | null;
  data_proxima_inspecao?: string | null;
}

export interface FoamChamberInspection {
  id?: number;
  data_inspecao?: string | null;
  id_camara: string;
  tipo_inspecao?: string | null;
  status_geral?: string | null;
  plano_de_acao?: string | null;
  resultados_json?: Record<string, unknown> | null;
  link_foto_nao_conformidade?: string | null;
  inspetor?: string | null;
  data_proxima_inspecao?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  user_id?: string | null;
}

// ---------------------------------------------------------------------------

/** Canhão Monitor — linha da tabela `inventario_canhoes_monitores` */
export type CannonMonitorRow = Database['public']['Tables']['inventario_canhoes_monitores']['Row'];

export interface CannonMonitor extends CannonMonitorRow {
  id?: number;
  status_geral?: string | null;
  status?: string | null;
  data_proxima_inspecao?: string | null;
}

export interface CannonMonitorInspection {
  id?: number;
  data_inspecao?: string | null;
  id_equipamento: string;
  tipo_inspecao?: string | null;
  status_geral?: string | null;
  plano_de_acao?: string | null;
  resultados_json?: Record<string, unknown> | null;
  link_foto_nao_conformidade?: string | null;
  inspetor?: string | null;
  data_proxima_inspecao?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  user_id?: string | null;
}

// ---------------------------------------------------------------------------

/** Chuveiro / Lava-olhos — linha da tabela `inventario_chuveiros_lava_olhos` */
export type EyewashStationRow = Database['public']['Tables']['inventario_chuveiros_lava_olhos']['Row'];

export interface EyewashStation extends EyewashStationRow {
  id?: number;
  status_geral?: string | null;
  status?: string | null;
  data_proxima_inspecao?: string | null;
}

export interface EyewashInspection {
  id?: number;
  data_inspecao?: string | null;
  id_equipamento: string;
  status_geral?: string | null;
  plano_de_acao?: string | null;
  resultados_json?: Record<string, unknown> | null;
  link_foto_nao_conformidade?: string | null;
  inspetor?: string | null;
  data_proxima_inspecao?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  user_id?: string | null;
}

// ---------------------------------------------------------------------------

/** Sistema de Alarme — linha da tabela `inventario_alarmes` */
export type AlarmSystemRow = Database['public']['Tables']['inventario_alarmes']['Row'];

export interface AlarmSystem extends AlarmSystemRow {
  id?: number;
  status_geral?: string | null;
  status?: string | null;
  data_proxima_inspecao?: string | null;
}

export interface AlarmInspection {
  id?: number;
  data_inspecao?: string | null;
  id_sistema: string;
  status_geral?: string | null;
  plano_de_acao?: string | null;
  resultados_json?: Record<string, unknown> | null;
  link_foto_nao_conformidade?: string | null;
  inspetor?: string | null;
  data_proxima_inspecao?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  user_id?: string | null;
}

// ---------------------------------------------------------------------------

/** Abrigo — linha da tabela `abrigos` */
export type ShelterRow = Database['public']['Tables']['abrigos']['Row'];

export interface Shelter extends ShelterRow {
  id?: number;
  status_geral?: string | null;
  status?: string | null;
  data_proxima_inspecao?: string | null;
}

export interface ShelterInspection {
  id?: number;
  data_inspecao?: string | null;
  id_abrigo: string;
  status_geral?: string | null;
  resultados_json?: Record<string, unknown> | null;
  plano_de_acao?: string | null;
  inspetor?: string | null;
  data_proxima_inspecao?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  user_id?: string | null;
}

// ---------------------------------------------------------------------------

/** Reservatório de Água — linha da tabela `water_reservoirs` */
export type WaterReservoirRow = Database['public']['Tables']['water_reservoirs']['Row'];

export interface WaterReservoir extends WaterReservoirRow {
  next_inspection_at?: string | null;
  overall_status?: string | null;
  status?: string | null;
  data_proxima_inspecao?: string | null;
}

export interface WaterReservoirInspection {
  id?: string;
  reservoir_id: string;
  inspected_at: string;
  inspected_at_ts?: string | null;
  inspection_type?: string | null;
  inspector_name?: string | null;
  inspector_user_id?: string | null;
  condition: string;
  level_reading?: string | null;
  overflow_clear: boolean;
  suction_clean: boolean;
  corrective_action_needed: boolean;
  corrective_action_notes?: string | null;
  action_plan?: string | null;
  checklist_json?: Record<string, unknown> | null;
  next_inspection_at?: string | null;
  overall_status?: string | null;
  normalized_at?: string | null;
  created_at?: string;
}

// ---------------------------------------------------------------------------
// EquipmentCache tipado
// ---------------------------------------------------------------------------

/**
 * Cache fortemente tipado de equipamentos.
 * Substitui o uso de `any[]` que existia anteriormente.
 */
export interface EquipmentCache {
  extinguishers: Extinguisher[];
  hoses: Hose[];
  scbas: SCBA[];
  multigasDetectors: MultigasDetector[];
  foamChambers: FoamChamber[];
  cannonMonitors: CannonMonitor[];
  eyewashStations: EyewashStation[];
  alarmSystems: AlarmSystem[];
  shelters: Shelter[];
  waterReservoirs: WaterReservoir[];
  lastFetch: number | null;
  isLoading: boolean;
}

// ---------------------------------------------------------------------------
// Union type — todos os equipamentos
// ---------------------------------------------------------------------------

export type AnyEquipment =
  | Extinguisher
  | Hose
  | SCBA
  | MultigasDetector
  | FoamChamber
  | CannonMonitor
  | EyewashStation
  | AlarmSystem
  | Shelter
  | WaterReservoir;

// ---------------------------------------------------------------------------
// Mapa de tipo de equipamento → nome da tabela
// ---------------------------------------------------------------------------

export const EQUIPMENT_TABLE_MAP = {
  extintor: 'extintores',
  mangueira: 'mangueiras',
  scba: 'conjuntos_autonomos',
  multigas: 'inventario_multigas',
  camara_espuma: 'inventario_camaras_espuma',
  canhao_monitor: 'inventario_canhoes_monitores',
  chuveiro_lavaolhos: 'inventario_chuveiros_lava_olhos',
  alarme: 'inventario_alarmes',
  abrigo: 'abrigos',
  reserva_tecnica: 'water_reservoirs',
} as const;

export type EquipmentTypeKey = keyof typeof EQUIPMENT_TABLE_MAP;
