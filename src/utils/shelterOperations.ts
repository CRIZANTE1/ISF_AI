/**
 * Utilitários para operações de abrigos de emergência
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';

export interface Shelter {
  id?: number;
  id_abrigo: string;
  cliente?: string;
  local?: string;
  itens_json?: Record<string, any>;
  created_at?: string;
  user_id?: string;
}

export interface ShelterInspection {
  id?: number;
  data_inspecao?: string;
  id_abrigo: string;
  status_geral?: string;
  resultados_json?: Record<string, any>;
  plano_de_acao?: string;
  inspetor?: string;
  data_proxima_inspecao?: string;
  latitude?: number;
  longitude?: number;
  link_foto_nao_conformidade?: string;
  created_at?: string;
  user_id?: string;
}

/**
 * Salva um novo abrigo
 */
export async function saveNewShelter(
  shelter: Omit<Shelter, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { data: existing, error: checkError } = await supabase
      .from('abrigos')
      .select('id_abrigo')
      .eq('id_abrigo', shelter.id_abrigo)
      .maybeSingle();

    // Se houver erro diferente de "não encontrado", lança o erro
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      throw new Error(`Abrigo com ID '${shelter.id_abrigo}' já existe.`);
    }

    const { error } = await supabase
      .from('abrigos')
      .insert(shelter);

    if (error) throw error;
    
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
    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_abrigos', inspection);
    
    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
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
    return false;
  }
}

/**
 * Busca todos os abrigos
 */
export async function getAllShelters(): Promise<Shelter[]> {
  try {
    const { data, error } = await supabase
      .from('abrigos')
      .select('*')
      .order('id_abrigo');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar abrigos', 'equipment', error);
    return [];
  }
}

