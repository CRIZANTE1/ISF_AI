import { supabase } from '../../lib/supabase';
import { logger } from '../logger';
import { getMonthDateRange } from '../monthlyExtinguisherReport';
import { getPdfConfig, getCustomPdfConfig } from './pdfConfigRegistry';
import type { MonthlyReportRow } from './types';

export const MONTHLY_REPORT_EMPTY_MESSAGE =
  'Nenhuma inspeção encontrada para o mês selecionado.';

function getEquipmentId(
  equipment: Record<string, unknown>,
  equipmentIdField: string
): string {
  return String(
    equipment[equipmentIdField] ||
      equipment.id ||
      equipment._reportId ||
      equipment.numero_identificacao ||
      equipment.id_equipamento ||
      equipment.id_mangueira ||
      equipment.numero_serie_equipamento ||
      equipment.id_camara ||
      equipment.id_sistema ||
      equipment.id_abrigo ||
      equipment.name
  );
}

/**
 * Monta linhas do relatório mensal para qualquer tipo configurado no registry.
 */
export async function buildMonthlyReportData(
  equipmentList: Record<string, unknown>[],
  equipmentType: string,
  userId: string,
  monthYYYYMM: string,
  profileFallbackName?: string,
  customTypeId?: string
): Promise<MonthlyReportRow[]> {
  if (!equipmentList.length) return [];

  const config = equipmentType.startsWith('custom-')
    ? getCustomPdfConfig(equipmentType)
    : getPdfConfig(equipmentType);

  if (!config) {
    logger.warn(`Tipo sem config PDF mensal: ${equipmentType}`, 'pdf');
    return [];
  }

  const { monthStart, monthEndExclusive } = getMonthDateRange(monthYYYYMM);
  const idField = config.equipmentIdField;
  const dateField = config.dateField;

  const selectFields = config.inspectionSelectFields ?? [
    idField,
    dateField,
    'status_geral',
    'inspetor',
    'inspetor_responsavel',
    'inspector_name',
    'link_foto_nao_conformidade',
    'plano_de_acao',
    'action_plan',
    'observacoes_gerais',
    'observacoes',
    'corrective_action_notes',
    'created_at',
    'latitude',
    'longitude',
  ];

  try {
    let query = supabase
      .from(config.inspectionTable as any)
      .select(selectFields.join(', '))
      .gte(dateField, monthStart)
      .lt(dateField, monthEndExclusive)
      .order(dateField, { ascending: false })
      .order('created_at', { ascending: false });

    if (equipmentType === 'reserva_tecnica') {
      query = query.in(
        'reservoir_id',
        equipmentList.map((e) => String(e.id))
      );
    } else {
      query = query.eq('user_id', userId);
    }

    if (equipmentType.startsWith('custom-') && customTypeId) {
      query = query.eq('equipment_type_id', customTypeId);
    }

    const { data: inspections, error } = await query;

    if (error) {
      logger.error(`Erro ao buscar inspeções mensais (${equipmentType})`, 'pdf', error);
      throw error;
    }

    const inspectionMap = new Map<string, Record<string, unknown>>();
    for (const insp of inspections || []) {
      const raw = insp as Record<string, unknown>;
      const key =
        equipmentType === 'reserva_tecnica'
          ? String(raw.reservoir_id)
          : String(raw[idField] ?? raw.id_equipamento ?? '');
      if (key && !inspectionMap.has(key)) {
        inspectionMap.set(key, raw);
      }
    }

    const rows: MonthlyReportRow[] = [];

    for (const equipment of equipmentList) {
      const eqId = getEquipmentId(equipment, idField);
      const inspection = inspectionMap.get(eqId);
      if (!inspection) continue;
      rows.push(config.buildMonthlyRow(equipment, inspection, profileFallbackName));
    }

    rows.sort((a, b) =>
      a.equipmentId.localeCompare(b.equipmentId, 'pt-BR', { numeric: true })
    );

    return rows;
  } catch (err) {
    logger.error('Erro ao montar relatório mensal', 'pdf', err);
    throw err;
  }
}
