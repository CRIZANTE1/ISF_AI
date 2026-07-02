/**
 * Utilitários para operações de mangueiras
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';
import { parseInspectionDate } from './dateUtils';
import type { Hose, HoseInspection } from '../types/equipment';

// Re-exporta para manter compatibilidade com imports existentes
export type { Hose, HoseInspection } from '../types/equipment';

/**
 * Salva uma nova mangueira
 */
export async function saveNewHose(hose: Omit<Hose, 'id' | 'created_at'>): Promise<boolean> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verifica se já existe APENAS para este usuário
    const { data: existing, error: checkError } = await supabase
      .from('mangueiras')
      .select('id_mangueira')
      .eq('id_mangueira', hose.id_mangueira)
      .eq('user_id', user.id)
      .maybeSingle();

    // Se houver erro diferente de "não encontrado", lança o erro
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      throw new Error(`Mangueira com ID '${hose.id_mangueira}' já existe.`);
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('mangueiras', hose);
    
    if (!result.success) {
      throw new Error('Falha ao salvar mangueira');
    }
    
    // Log action
    try {
      await logUserAction('create', 'equipment', hose.id_mangueira, {
        type: 'mangueira',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar mangueira', 'equipment', error);
    throw error;
  }
}

/**
 * Busca todas as mangueiras com dados da última inspeção
 */
export async function getAllHoses(): Promise<Hose[]> {
  try {
    // Obtém o ID do usuário autenticado primeiro
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar mangueiras', 'equipment');
      return [];
    }

    // Busca cadastros de mangueiras APENAS do usuário autenticado
    const { data: hoses, error: hoseError } = await supabase
      .from('mangueiras')
      .select('*')
      .eq('user_id', user.id)
      .order('id_mangueira');

    if (hoseError) throw hoseError;
    if (!hoses || hoses.length === 0) return [];

    // Busca última inspeção de cada mangueira
    try {

      const { data: allInspections, error: inspError } = await supabase
        .from('inspecoes_mangueiras' as any)
        .select('id_mangueira, data_proxima_inspecao, resultado, status_geral, data_inspecao, created_at')
        .eq('user_id', user.id)
        .order('data_inspecao', { ascending: false })
        .order('created_at', { ascending: false });

      if (inspError) {
        logger.warn('Erro ao buscar últimas inspeções de mangueiras', 'equipment', inspError);
        return hoses as Hose[];
      }

      // Cria mapa das últimas inspeções
      type InspectionInfo = {
        id_mangueira: string;
        data_proxima_inspecao?: string | null;
        resultado?: string | null;
        status_geral?: string | null;
        data_inspecao?: string | null;
        created_at?: string | null;
      };
      const inspectionMap = new Map<string, InspectionInfo>();
      if (allInspections && Array.isArray(allInspections)) {
        allInspections.forEach((insp: InspectionInfo) => {
          if (insp && insp.id_mangueira) {
            const id = insp.id_mangueira;
            if (!inspectionMap.has(id)) {
              inspectionMap.set(id, insp);
            }
          }
        });
      }

      // Mescla dados de cadastro com dados da última inspeção
      const hosesWithInspections = hoses.map((hose: Hose) => {
        if (!hose || !hose.id_mangueira) return hose;

        const lastInspection = inspectionMap.get(hose.id_mangueira);
        if (lastInspection) {
          return {
            ...hose,
            data_proximo_teste: lastInspection.data_proxima_inspecao || null,
            data_proxima_inspecao: lastInspection.data_proxima_inspecao || null,
            resultado: lastInspection.resultado || null,
            status_geral: lastInspection.status_geral || null,
            status: lastInspection.status_geral || lastInspection.resultado || null,
          } satisfies Hose;
        }
        return hose;
      });

      return hosesWithInspections;
    } catch (inspectionError) {
      logger.warn('Erro ao processar inspeções de mangueiras, retornando apenas cadastros', 'equipment', inspectionError);
      return hoses as Hose[];
    }
  } catch (error) {
    logger.error('Erro ao buscar mangueiras', 'equipment', error);
    return [];
  }
}

/**
 * Busca uma mangueira por ID
 */
export async function getHoseById(idMangueira: string): Promise<Hose | null> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar mangueira', 'equipment');
      return null;
    }

    // Busca mangueira APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('mangueiras')
      .select('*')
      .eq('id_mangueira', idMangueira)
      .eq('user_id', user.id)
      .maybeSingle();

    // Se não encontrou (PGRST116), retorna null (comportamento esperado)
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data;
  } catch (error) {
    logger.error('Erro ao buscar mangueira', 'equipment', error);
    return null;
  }
}

/**
 * Atualiza uma mangueira
 */
export async function updateHose(
  idMangueira: string,
  updates: Partial<Omit<Hose, 'id' | 'id_mangueira' | 'created_at' | 'user_id'>>
): Promise<boolean> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Atualiza APENAS mangueiras do usuário autenticado
    const { error } = await supabase
      .from('mangueiras')
      .update(updates)
      .eq('id_mangueira', idMangueira)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Erro ao atualizar mangueira', 'equipment', error);
    return false;
  }
}

/**
 * Salva uma inspeção/teste de mangueira
 */

export async function saveHoseInspection(inspection: Omit<HoseInspection, 'id' | 'created_at'>): Promise<boolean> {
  try {
    // Calcula próxima data de teste (anual - 1 ano após a inspeção atual)
    const inspectionDate = parseInspectionDate(inspection.data_inspecao);
    const nextTestDate = new Date(inspectionDate);
    nextTestDate.setFullYear(nextTestDate.getFullYear() + 1);

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_mangueiras', {
      id_mangueira: inspection.id_mangueira,
      data_inspecao: inspection.data_inspecao,
      resultado: inspection.resultado,
      status_geral: inspection.status_geral || inspection.resultado,
      plano_de_acao: inspection.plano_de_acao,
      resultados_json: inspection.resultados_json || null,
      observacoes: inspection.observacoes || null,
      link_foto_nao_conformidade: inspection.link_foto_nao_conformidade || null,
      inspetor: inspection.inspetor || null,
      data_proxima_inspecao: inspection.data_proxima_inspecao || nextTestDate.toISOString().split('T')[0],
      latitude: inspection.latitude || null,
      longitude: inspection.longitude || null,
      user_id: inspection.user_id || null,
    });
    
    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
    }

    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.id_mangueira, {
        type: 'mangueira',
        resultado: inspection.resultado,
        data_inspecao: inspection.data_inspecao,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }

    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção de mangueira', 'equipment', error);
    throw error;
  }
}

/**
 * Busca todas as inspeções de uma mangueira
 */
export async function getHoseInspections(idMangueira: string): Promise<HoseInspection[]> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar inspeções de mangueira', 'equipment');
      return [];
    }

    // Busca inspeções APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('inspecoes_mangueiras' as any)
      .select('*')
      .eq('id_mangueira', idMangueira)
      .eq('user_id', user.id)
      .order('data_inspecao', { ascending: false });

    if (error) throw error;
    return (data as HoseInspection[]) || [];
  } catch (error) {
    logger.error('Erro ao buscar inspeções de mangueira', 'equipment', error);
    return [];
  }
}

