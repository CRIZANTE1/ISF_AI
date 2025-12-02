/**
 * Utilitários para operações de locais
 */

import { supabase } from '../lib/supabase';
import { logger } from './logger';

export interface Location {
  id?: number;
  local_id: string;
  local_descricao: string;
  created_at?: string;
  user_id?: string;
}

/**
 * Busca todos os locais cadastrados
 */
export async function getAllLocations(): Promise<Location[]> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar locais', 'equipment');
      return [];
    }

    // Busca locais APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('locais')
      .select('*')
      .eq('user_id', user.id)
      .order('local_id');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar locais', 'equipment', error);
    return [];
  }
}

/**
 * Busca um local por ID
 */
export async function getLocationById(localId: string): Promise<Location | null> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar local', 'equipment');
      return null;
    }

    // Busca local APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('locais')
      .select('*')
      .eq('local_id', localId)
      .eq('user_id', user.id)
      .maybeSingle();

    // Se não encontrou (PGRST116), retorna null (comportamento esperado)
    if (error && error.code !== 'PGRST116') {
      throw error;
    }
    return data;
  } catch (error) {
    logger.error('Erro ao buscar local', 'equipment', error);
    return null;
  }
}

/**
 * Salva um novo local
 */
export async function saveNewLocation(location: Omit<Location, 'id' | 'created_at'>): Promise<boolean> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('locais', { ...location, user_id: user.id });
    
    if (!result.success) {
      throw new Error('Falha ao salvar local');
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar local', 'equipment', error);
    return false;
  }
}

/**
 * Atualiza um local existente
 */
export async function updateLocation(
  localId: string,
  updates: Partial<Pick<Location, 'local_descricao'>>
): Promise<boolean> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Atualiza APENAS locais do usuário autenticado
    const { error } = await supabase
      .from('locais')
      .update(updates)
      .eq('local_id', localId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Erro ao atualizar local', 'equipment', error);
    return false;
  }
}

/**
 * Deleta um local
 */
export async function deleteLocation(localId: string): Promise<boolean> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Deleta APENAS locais do usuário autenticado
    const { error } = await supabase
      .from('locais')
      .delete()
      .eq('local_id', localId)
      .eq('user_id', user.id);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Erro ao deletar local', 'equipment', error);
    return false;
  }
}

