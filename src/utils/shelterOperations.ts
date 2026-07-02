/**
 * Utilitários para operações de abrigos de emergência
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';
import type { Shelter, ShelterInspection } from '../types/equipment';

// Re-exporta para manter compatibilidade com imports existentes
export type { Shelter, ShelterInspection } from '../types/equipment';

/**
 * Salva um novo abrigo
 */
export async function saveNewShelter(
  shelter: Omit<Shelter, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verifica se já existe APENAS para este usuário
    const { data: existing, error: checkError } = await supabase
      .from('abrigos')
      .select('id_abrigo')
      .eq('id_abrigo', shelter.id_abrigo)
      .eq('user_id', user.id)
      .maybeSingle();

    // Se houver erro diferente de "não encontrado", lança o erro
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      throw new Error(`Abrigo com ID '${shelter.id_abrigo}' já existe.`);
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('abrigos', { ...shelter, user_id: user.id });
    
    if (!result.success) {
      throw new Error('Falha ao salvar abrigo');
    }
    
    // Log action
    try {
      await logUserAction('create', 'equipment', shelter.id_abrigo, {
        type: 'abrigo',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar abrigo', 'equipment', error);
    throw error;
  }
}

/**
 * Salva uma inspeção de abrigo
 */
export async function saveShelterInspection(
  inspection: Omit<ShelterInspection, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_abrigos', {
      ...inspection,
      user_id: user.id,
    });
    
    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
    }
    
    // Atualiza latitude/longitude no cadastro do equipamento se fornecidas na inspeção
    // NOTA: Isso sobrescreve coordenadas editadas manualmente no cadastro, pois a última inspeção tem prioridade
    // Se a inspeção não tiver GPS (null/undefined), as coordenadas do cadastro permanecem inalteradas
    if (inspection.latitude != null && inspection.longitude != null) {
      try {
        const { error: updateError } = await supabase
          .from('abrigos')
          .update({
            latitude: inspection.latitude,
            longitude: inspection.longitude,
          })
          .eq('id_abrigo', inspection.id_abrigo)
          .eq('user_id', user.id);

        if (updateError) {
          logger.warn('Erro ao atualizar coordenadas no cadastro do equipamento', 'equipment', updateError);
        }
      } catch (updateError) {
        logger.warn('Erro ao atualizar coordenadas no cadastro do equipamento', 'equipment', updateError);
      }
    }
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.id_abrigo, {
        type: 'abrigo',
        status: inspection.status_geral,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção de abrigo', 'equipment', error);
    throw error;
  }
}

/**
 * Busca todos os abrigos
 */
export async function getAllShelters(): Promise<Shelter[]> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar abrigos', 'equipment');
      return [];
    }

    // Busca abrigos APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('abrigos')
      .select('*')
      .eq('user_id', user.id)
      .order('id_abrigo');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar abrigos', 'equipment', error);
    return [];
  }
}

