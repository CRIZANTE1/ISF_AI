import { supabase } from '../lib/supabase';
import { logger } from './logger';

export interface MonthlyExtinguisherReportRow {
  numero_identificacao: string;
  tipo_agente?: string | null;
  capacidade?: number | null;
  localizacao: string;
  data_servico: string;
  status: string;
  pesoCo2Display: string;
  inspetor: string;
  link_foto_nao_conformidade?: string | null;
  observacoes?: string | null;
  plano_de_acao?: string | null;
}

export function getMonthDateRange(monthYYYYMM: string): {
  monthStart: string;
  monthEndExclusive: string;
} {
  const [yearStr, monthStr] = monthYYYYMM.split('-');
  const year = Number(yearStr);
  const month = Number(monthStr);
  const monthStart = `${monthYYYYMM}-01`;
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const monthEndExclusive = `${nextYear}-${String(nextMonth).padStart(2, '0')}-01`;
  return { monthStart, monthEndExclusive };
}

function formatBrazilianDecimal(value: number, decimals = 1): string {
  return value.toFixed(decimals).replace('.', ',');
}

export function isCo2Agent(agent?: string | null): boolean {
  const normalized = (agent || '').toUpperCase();
  return (
    normalized.includes('CO2') ||
    normalized.includes('CO²') ||
    normalized.includes('DIOXIDO') ||
    normalized.includes('DIOXIDO DE CARBONO')
  );
}

export function isKgCapacityAgent(agent?: string | null): boolean {
  const normalized = (agent || '').toUpperCase();
  return (
    isCo2Agent(agent) ||
    normalized.includes('PQS') ||
    normalized.includes('PÓ') ||
    normalized.includes('PO ') ||
    normalized.includes('PO QUIMICO') ||
    normalized.includes('PÓ QUÍMICO')
  );
}

export function formatCapacityDisplay(
  agent?: string | null,
  capacidade?: number | null
): string {
  if (capacidade == null || Number.isNaN(Number(capacidade))) return '—';
  const unit = isKgCapacityAgent(agent) ? 'kg' : 'L';
  return `${formatBrazilianDecimal(Number(capacidade), Number.isInteger(Number(capacidade)) ? 0 : 1)} ${unit}`;
}

export function formatCo2WeightDisplay(
  agent?: string | null,
  pesoMedido?: number | null,
  perdaKg?: number | null
): string {
  if (!isCo2Agent(agent)) return '—';
  if (pesoMedido == null || Number.isNaN(Number(pesoMedido))) return '—';

  const pesoText = `${formatBrazilianDecimal(Number(pesoMedido))} kg`;
  if (perdaKg != null && !Number.isNaN(Number(perdaKg)) && Number(perdaKg) > 0) {
    return `${pesoText} (−${formatBrazilianDecimal(Number(perdaKg))} kg)`;
  }
  return pesoText;
}

export function formatMonthlyLocation(
  equipment: Record<string, any>,
  inspection: Record<string, any>
): string {
  const lat = inspection.latitude ?? equipment.latitude;
  const lng = inspection.longitude ?? equipment.longitude;
  if (lat != null && lng != null) {
    return `${Number(lat).toFixed(6)}, ${Number(lng).toFixed(6)}`;
  }
  return equipment.localizacao || equipment.local || equipment.location || '—';
}

function buildReportRow(
  equipment: Record<string, any>,
  inspection: Record<string, any>,
  profileFallbackName?: string
): MonthlyExtinguisherReportRow {
  const agent = equipment.tipo_agente ?? inspection.tipo_agente;
  return {
    numero_identificacao: equipment.numero_identificacao || inspection.numero_identificacao,
    tipo_agente: agent,
    capacidade: equipment.capacidade ?? null,
    localizacao: formatMonthlyLocation(equipment, inspection),
    data_servico: inspection.data_servico,
    status: inspection.status_geral || inspection.aprovado_inspecao || '—',
    pesoCo2Display: formatCo2WeightDisplay(
      agent,
      inspection.peso_medido_conjunto_kg,
      inspection.perda_kg
    ),
    inspetor:
      inspection.inspetor_responsavel ||
      profileFallbackName ||
      '—',
    link_foto_nao_conformidade: inspection.link_foto_nao_conformidade ?? null,
    observacoes: inspection.observacoes_gerais ?? null,
    plano_de_acao: inspection.plano_de_acao ?? null,
  };
}

/**
 * Monta linhas do relatório mensal: uma inspeção por extintor ativo no mês selecionado.
 */
export async function buildMonthlyExtinguisherReportData(
  equipmentList: Record<string, any>[],
  userId: string,
  monthYYYYMM: string,
  profileFallbackName?: string
): Promise<MonthlyExtinguisherReportRow[]> {
  if (!equipmentList.length) return [];

  const { monthStart, monthEndExclusive } = getMonthDateRange(monthYYYYMM);

  const { data: inspections, error } = await supabase
    .from('inspecoes_extintores' as any)
    .select(
      'numero_identificacao, data_servico, created_at, status_geral, aprovado_inspecao, peso_medido_conjunto_kg, perda_kg, inspetor_responsavel, latitude, longitude, link_foto_nao_conformidade, observacoes_gerais, plano_de_acao'
    )
    .eq('user_id', userId)
    .gte('data_servico', monthStart)
    .lt('data_servico', monthEndExclusive)
    .order('data_servico', { ascending: false })
    .order('created_at', { ascending: false });

  if (error) {
    logger.error('Erro ao buscar inspeções mensais de extintores', 'pdf', error);
    throw error;
  }

  const inspectionMap = new Map<string, Record<string, any>>();
  for (const insp of inspections || []) {
    const key = String(insp.numero_identificacao);
    if (key && !inspectionMap.has(key)) {
      inspectionMap.set(key, insp);
    }
  }

  const rows: MonthlyExtinguisherReportRow[] = [];

  for (const equipment of equipmentList) {
    const id = String(equipment.numero_identificacao || equipment._reportId || equipment.id);
    const inspection = inspectionMap.get(id);
    if (!inspection) continue;
    rows.push(buildReportRow(equipment, inspection, profileFallbackName));
  }

  rows.sort((a, b) =>
    a.numero_identificacao.localeCompare(b.numero_identificacao, 'pt-BR', { numeric: true })
  );

  return rows;
}

export const MONTHLY_EXTINGUISHER_EMPTY_MESSAGE =
  'Nenhuma inspeção encontrada para o mês selecionado.';
