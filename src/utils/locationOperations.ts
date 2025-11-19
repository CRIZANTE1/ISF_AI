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
    const { data, error } = await supabase
      .from('locais')
      .select('*')
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
    const { data, error } = await supabase
      .from('locais')
      .select('*')
      .eq('local_id', localId)
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
    const { error } = await supabase
      .from('locais')
      .insert(location);

    if (error) throw error;
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
    const { error } = await supabase
      .from('locais')
      .update(updates)
      .eq('local_id', localId);

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
    const { error } = await supabase
      .from('locais')
      .delete()
      .eq('local_id', localId);

    if (error) throw error;
    return true;
  } catch (error) {
    logger.error('Erro ao deletar local', 'equipment', error);
    return false;
  }
}

