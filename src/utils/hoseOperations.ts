/**
 * Utilitários para operações de mangueiras
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';

export interface Hose {
  id?: number;
  id_mangueira: string;
  marca?: string;
  diametro?: number;
  tipo?: string;
  comprimento?: number;
  ano_fabricacao?: number;
  data_inspecao?: string;
  data_proximo_teste?: string;
  resultado?: string;
  link_certificado_pdf?: string;
  registrado_por?: string;
  empresa_executante?: string;
  resp_tecnico_certificado?: string;
  created_at?: string;
  user_id?: string;
}

/**
 * Salva uma nova mangueira
 */
export async function saveNewHose(hose: Omit<Hose, 'id' | 'created_at'>): Promise<boolean> {
  try {
    // Verifica se já existe
    const { data: existing } = await supabase
      .from('mangueiras')
      .select('id_mangueira')
      .eq('id_mangueira', hose.id_mangueira)
      .single();

    if (existing) {
      throw new Error(`Mangueira com ID '${hose.id_mangueira}' já existe.`);
    }

    const { error } = await supabase
      .from('mangueiras')
      .insert(hose);

    if (error) throw error;
    
    // Log action
    try {
      await logUserAction('create', 'equipment', hose.id_mangueira, {
        type: 'mangueira',
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar mangueira:', error);
    throw error;
  }
}

/**
 * Busca todas as mangueiras
 */
export async function getAllHoses(): Promise<Hose[]> {
  try {
    const { data, error } = await supabase
      .from('mangueiras')
      .select('*')
      .order('id_mangueira');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar mangueiras:', error);
    return [];
  }
}

/**
 * Busca uma mangueira por ID
 */
export async function getHoseById(idMangueira: string): Promise<Hose | null> {
  try {
    const { data, error } = await supabase
      .from('mangueiras')
      .select('*')
      .eq('id_mangueira', idMangueira)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar mangueira:', error);
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
    const { error } = await supabase
      .from('mangueiras')
      .update(updates)
      .eq('id_mangueira', idMangueira);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar mangueira:', error);
    return false;
  }
}

