/**
 * Utilitários para operações de reservas técnicas de água (NFPA 25)
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { getCurrentLocalISOWithTimezone } from './dateUtils';
import { logger } from './logger';
import type { WaterReservoir, WaterReservoirInspection } from '../types/equipment';

// Re-exporta para manter compatibilidade com imports existentes
export type { WaterReservoir, WaterReservoirInspection } from '../types/equipment';

export interface WaterReservoirActionLog {
  id?: string;
  reservoir_id: string;
  inspection_id?: string | null;
  action_type: string;
  description: string;
  created_by?: string | null;
  created_at?: string;
}

/**
 * Calcula a próxima data de inspeção com base na periodicidade
 */
export function getNextInspectionDate(periodicity: string, fromDate: Date | string): string {
  const base = typeof fromDate === 'string' ? new Date(fromDate) : new Date(fromDate);
  const result = new Date(base);
  const key = periodicity
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  switch (key) {
    case 'diaria':
      result.setDate(result.getDate() + 1);
      break;
    case 'semanal':
      result.setDate(result.getDate() + 7);
      break;
    case 'quinzenal':
      result.setDate(result.getDate() + 15);
      break;
    case 'mensal':
      result.setMonth(result.getMonth() + 1);
      break;
    case 'bimestral':
      result.setMonth(result.getMonth() + 2);
      break;
    case 'trimestral':
      result.setMonth(result.getMonth() + 3);
      break;
    case 'semestral':
      result.setMonth(result.getMonth() + 6);
      break;
    case 'anual':
      result.setFullYear(result.getFullYear() + 1);
      break;
    default:
      result.setDate(result.getDate() + 7);
  }

  return result.toISOString().split('T')[0];
}

function generateActionPlan(inspection: Partial<WaterReservoirInspection>): string {
  const issues: string[] = [];

  if (inspection.condition === 'B') {
    issues.push('Avaliar e corrigir a condição geral da reserva conforme NFPA 25.');
  }
  if (inspection.suction_clean === false) {
    issues.push('Limpar e desobstruir a sucção/entrada de água.');
  }
  if (inspection.overflow_clear === false) {
    issues.push('Desobstruir e verificar o extravasor.');
  }
  if (inspection.corrective_action_needed) {
    if (inspection.corrective_action_notes?.trim()) {
      return `Ação corretiva necessária: ${inspection.corrective_action_notes.trim()}`;
    }
    return 'Executar ação corretiva conforme não conformidades identificadas.';
  }

  if (issues.length === 0) {
    return 'Manter em monitoramento periódico conforme NFPA 25.';
  }

  return issues[0];
}

function computeOverallStatus(inspection: Partial<WaterReservoirInspection>): string {
  if (
    inspection.condition === 'B' ||
    inspection.suction_clean === false ||
    inspection.overflow_clear === false ||
    inspection.corrective_action_needed === true
  ) {
    return 'Não Conforme';
  }
  return 'OK';
}

/**
 * Busca todas as reservas técnicas do usuário
 */
export async function getAllWaterReservoirs(): Promise<WaterReservoir[]> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar reservas técnicas', 'equipment');
      return [];
    }

    const { data: reservoirs, error } = await supabase
      .from('water_reservoirs')
      .select('*')
      .eq('user_id', user.id)
      .order('name');

    if (error) throw error;
    if (!reservoirs || reservoirs.length === 0) return [];

    try {
      const { data: inspections, error: inspError } = await supabase
        .from('water_reservoir_inspections')
        .select('reservoir_id, next_inspection_at, overall_status, inspected_at, created_at')
        .order('inspected_at', { ascending: false })
        .order('created_at', { ascending: false });

      if (inspError) {
        logger.warn('Erro ao buscar últimas inspeções de reservas', 'equipment', inspError);
        return reservoirs as WaterReservoir[];
      }

      const inspectionMap = new Map<string, WaterReservoirInspection>();
      inspections?.forEach((insp) => {
        if (!inspectionMap.has(insp.reservoir_id)) {
          inspectionMap.set(insp.reservoir_id, insp as WaterReservoirInspection);
        }
      });

      return reservoirs.map((reservoir) => {
        const lastInspection = inspectionMap.get(reservoir.id);
        if (!lastInspection) return reservoir as WaterReservoir;

        return {
          ...reservoir,
          next_inspection_at: lastInspection.next_inspection_at || reservoir.next_inspection_at || null,
          overall_status: lastInspection.overall_status || null,
        } as WaterReservoir;
      });
    } catch (inspectionError) {
      logger.warn('Erro ao processar inspeções de reservas, retornando apenas cadastros', 'equipment', inspectionError);
      return reservoirs as WaterReservoir[];
    }
  } catch (error) {
    logger.error('Erro ao buscar reservas técnicas', 'equipment', error);
    return [];
  }
}

/**
 * Busca uma reserva técnica por ID
 */
export async function getWaterReservoirById(id: string): Promise<WaterReservoir | null> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar reserva técnica', 'equipment');
      return null;
    }

    const { data, error } = await supabase
      .from('water_reservoirs')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;
    return data as WaterReservoir | null;
  } catch (error) {
    logger.error('Erro ao buscar reserva técnica', 'equipment', error);
    return null;
  }
}

/**
 * Salva uma nova reserva técnica
 */
export async function saveNewWaterReservoir(
  reservoir: Omit<WaterReservoir, 'id' | 'created_at' | 'updated_at'>
): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    if (reservoir.code?.trim()) {
      const { data: existing, error: checkError } = await supabase
        .from('water_reservoirs')
        .select('id')
        .eq('code', reservoir.code.trim())
        .eq('user_id', user.id)
        .maybeSingle();

      if (checkError && checkError.code !== 'PGRST116') throw checkError;
      if (existing) {
        throw new Error(`Reserva com código '${reservoir.code}' já existe.`);
      }
    }

    const { error } = await supabase
      .from('water_reservoirs')
      .insert({
        ...reservoir,
        user_id: user.id,
        created_by: user.id,
      });

    if (error) throw error;

    try {
      await logUserAction('create', 'equipment', reservoir.code || reservoir.name, {
        type: 'reserva_tecnica',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }

    return true;
  } catch (error) {
    logger.error('Erro ao salvar reserva técnica', 'equipment', error);
    throw error;
  }
}

/**
 * Atualiza uma reserva técnica
 */
export async function updateWaterReservoir(
  id: string,
  updates: Partial<Omit<WaterReservoir, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'created_by'>>
): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('water_reservoirs')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Erro ao atualizar reserva técnica', 'equipment', error);
    return false;
  }
}

/**
 * Exclui uma reserva técnica
 */
export async function deleteWaterReservoir(id: string): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('water_reservoirs')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id);

    if (error) throw error;

    try {
      await logUserAction('delete', 'equipment', id, {
        type: 'reserva_tecnica',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }

    return true;
  } catch (error) {
    logger.error('Erro ao excluir reserva técnica', 'equipment', error);
    return false;
  }
}

/**
 * Busca inspeções de uma reserva técnica
 */
export async function getWaterReservoirInspections(reservoirId: string): Promise<WaterReservoirInspection[]> {
  try {
    const { data, error } = await supabase
      .from('water_reservoir_inspections')
      .select('*')
      .eq('reservoir_id', reservoirId)
      .order('inspected_at', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as WaterReservoirInspection[]) || [];
  } catch (error) {
    logger.error('Erro ao buscar inspeções de reserva técnica', 'equipment', error);
    return [];
  }
}

/**
 * Salva uma inspeção de reserva técnica
 */
export async function saveWaterReservoirInspection(
  inspection: Omit<WaterReservoirInspection, 'id' | 'created_at' | 'action_plan' | 'overall_status' | 'next_inspection_at'>,
  periodicity?: string
): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    let resolvedPeriodicity = periodicity;
    if (!resolvedPeriodicity) {
      const reservoir = await getWaterReservoirById(inspection.reservoir_id);
      resolvedPeriodicity = reservoir?.inspection_periodicity || 'Semanal';
    }

    const overallStatus = computeOverallStatus(inspection);
    const actionPlan = generateActionPlan(inspection);
    const nextInspectionAt = getNextInspectionDate(resolvedPeriodicity, inspection.inspected_at);

    const { error } = await supabase
      .from('water_reservoir_inspections')
      .insert({
        ...inspection,
        inspected_at_ts: inspection.inspected_at_ts || getCurrentLocalISOWithTimezone(),
        overall_status: overallStatus,
        action_plan: actionPlan,
        next_inspection_at: nextInspectionAt,
        inspector_user_id: user.id,
        checklist_json: inspection.checklist_json || {
          level_reading: inspection.level_reading,
          condition: inspection.condition,
          suction_clean: inspection.suction_clean,
          overflow_clear: inspection.overflow_clear,
          corrective_action_needed: inspection.corrective_action_needed,
          corrective_action_notes: inspection.corrective_action_notes,
        },
      });

    if (error) throw error;

    if (inspection.corrective_action_needed) {
      await insertWaterReservoirActionLog({
        reservoir_id: inspection.reservoir_id,
        action_type: 'corrective',
        description: inspection.corrective_action_notes?.trim() || actionPlan,
        created_by: user.id,
      });
    }

    try {
      await logUserAction('create', 'inspection', inspection.reservoir_id, {
        type: 'reserva_tecnica',
        status: overallStatus,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }

    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção de reserva técnica', 'equipment', error);
    return false;
  }
}

/**
 * Insere um log de ação de reserva técnica
 */
export async function insertWaterReservoirActionLog(
  log: Omit<WaterReservoirActionLog, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();

    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { error } = await supabase
      .from('water_reservoir_action_logs')
      .insert({
        ...log,
        created_by: log.created_by || user.id,
      });

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Erro ao inserir log de ação de reserva técnica', 'equipment', error);
    return false;
  }
}

/**
 * Busca logs de ação de uma reserva técnica
 */
export async function getWaterReservoirActionLogs(reservoirId: string): Promise<WaterReservoirActionLog[]> {
  try {
    const { data, error } = await supabase
      .from('water_reservoir_action_logs')
      .select('*')
      .eq('reservoir_id', reservoirId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return (data as WaterReservoirActionLog[]) || [];
  } catch (error) {
    logger.error('Erro ao buscar logs de ação de reserva técnica', 'equipment', error);
    return [];
  }
}
