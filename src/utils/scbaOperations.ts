/**
 * Utilitários para operações de SCBA (Conjuntos Autônomos)
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';
import type { SCBA, SCBAInspection } from '../types/equipment';

// Re-exporta para manter compatibilidade com imports existentes
export type { SCBA, SCBAInspection } from '../types/equipment';

/**
 * Salva um novo SCBA
 */
export async function saveNewSCBA(scba: Omit<SCBA, 'id' | 'created_at'>): Promise<boolean> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verifica se já existe APENAS para este usuário
    const { data: existing, error: checkError } = await supabase
      .from('conjuntos_autonomos')
      .select('numero_serie_equipamento')
      .eq('numero_serie_equipamento', scba.numero_serie_equipamento)
      .eq('user_id', user.id)
      .maybeSingle();

    // Se houver erro diferente de "não encontrado", lança o erro
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      throw new Error(`SCBA com número de série '${scba.numero_serie_equipamento}' já existe.`);
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('conjuntos_autonomos', {
      ...scba,
      user_id: user.id,
    });
    
    if (!result.success) {
      throw new Error('Falha ao salvar SCBA');
    }
    
    // Log action
    try {
      await logUserAction('create', 'equipment', scba.numero_serie_equipamento, {
        type: 'scba',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar SCBA', 'equipment', error);
    throw error;
  }
}

/**
 * Busca todos os SCBAs com dados da última inspeção
 */
export async function getAllSCBAs(): Promise<SCBA[]> {
  try {
    // Obtém o ID do usuário autenticado primeiro
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar SCBAs', 'equipment');
      return [];
    }

    // Busca cadastros de SCBAs APENAS do usuário autenticado
    const { data: scbas, error: scbaError } = await supabase
      .from('conjuntos_autonomos')
      .select('*')
      .eq('user_id', user.id)
      .order('numero_serie_equipamento');

    if (scbaError) throw scbaError;
    if (!scbas || scbas.length === 0) return [];

    // Busca última inspeção de cada SCBA
    try {

      const { data: allInspections, error: inspError } = await supabase
        .from('inspecoes_scba' as any)
        .select('numero_serie_equipamento, data_proxima_inspecao, status_geral, data_inspecao, created_at')
        .eq('user_id', user.id)
        .order('data_inspecao', { ascending: false })
        .order('created_at', { ascending: false });

      if (inspError) {
        logger.warn('Erro ao buscar últimas inspeções de SCBAs', 'equipment', inspError);
        return scbas as SCBA[];
      }

      // Cria mapa das últimas inspeções
      // Define a minimal type for inspection records fetched from the DB
      type InspectionInfo = {
        numero_serie_equipamento: string;
        data_proxima_inspecao?: string | null;
        status_geral?: string | null;
        data_inspecao?: string | null;
        created_at?: string | null;
      };
      const inspectionMap = new Map<string, InspectionInfo>();
      if (allInspections && Array.isArray(allInspections)) {
        allInspections.forEach((insp: InspectionInfo) => {
          if (insp && insp.numero_serie_equipamento) {
            const serial = insp.numero_serie_equipamento;
            if (!inspectionMap.has(serial)) {
              inspectionMap.set(serial, insp);
            }
          }
        });
      }

      // Mescla dados de cadastro com dados da última inspeção
      const scbasWithInspections = scbas.map((scba: SCBA) => {
        if (!scba || !scba.numero_serie_equipamento) return scba;

        const lastInspection = inspectionMap.get(scba.numero_serie_equipamento);
        if (lastInspection) {
          return {
            ...scba,
            data_proxima_inspecao: lastInspection.data_proxima_inspecao || null,
            status_geral: lastInspection.status_geral || null,
            status: lastInspection.status_geral || null,
          } satisfies SCBA;
        }
        return scba;
      });

      return scbasWithInspections;
    } catch (inspectionError) {
      logger.warn('Erro ao processar inspeções de SCBAs, retornando apenas cadastros', 'equipment', inspectionError);
      return scbas as SCBA[];
    }
  } catch (error) {
    logger.error('Erro ao buscar SCBAs', 'equipment', error);
    return [];
  }
}

/**
 * Busca um SCBA por número de série
 */
export async function getSCBABySerial(serialNumber: string): Promise<SCBA | null> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar SCBA', 'equipment');
      return null;
    }

    // Busca SCBA APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('conjuntos_autonomos')
      .select('*')
      .eq('numero_serie_equipamento', serialNumber)
      .eq('user_id', user.id)
      .maybeSingle();

    // Se não encontrou (PGRST116), retorna null (comportamento esperado)
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data;
  } catch (error) {
    logger.error('Erro ao buscar SCBA', 'equipment', error);
    return null;
  }
}

/**
 * Salva uma inspeção visual de SCBA
 */
export async function saveSCBAVisualInspection(
  inspection: Omit<SCBAInspection, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_scba', inspection);
    
    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
    }
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.numero_serie_equipamento, {
        type: 'scba',
        status: inspection.status_geral,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção SCBA', 'equipment', error);
    throw error;
  }
}

/**
 * Busca todas as inspeções de um SCBA
 */
export async function getSCBAInspections(serialNumber: string): Promise<SCBAInspection[]> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar inspeções SCBA', 'equipment');
      return [];
    }

    // Busca inspeções APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('inspecoes_scba')
      .select('*')
      .eq('numero_serie_equipamento', serialNumber)
      .eq('user_id', user.id)
      .order('data_inspecao', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar inspeções SCBA', 'equipment', error);
    return [];
  }
}

/**
 * Salva uma ação corretiva de SCBA
 */
export async function saveSCBAActionLog(
  equipmentId: string,
  problem: string,
  action: string,
  responsible: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('log_acoes_scba')
      .insert({
        id_equipamento: equipmentId,
        problema_original: problem,
        acao_realizada: action,
        responsavel_acao: responsible,
        data_acao: new Date().toISOString().split('T')[0],
      });

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Erro ao salvar log de ação SCBA', 'equipment', error);
    return false;
  }
}

