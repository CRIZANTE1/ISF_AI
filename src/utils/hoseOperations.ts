/**
 * Utilitários para operações de mangueiras
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';

export interface Hose {
  id?: number;
  id_mangueira: string;
  marca?: string | null;
  diametro?: number | null;
  tipo?: string | null;
  comprimento?: number | null;
  ano_fabricacao?: number | null;
  created_at?: string;
  user_id?: string | null;
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
    logger.error('Erro ao buscar mangueiras', 'equipment', error);
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
    const { error } = await supabase
      .from('mangueiras')
      .update(updates)
      .eq('id_mangueira', idMangueira);

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
export interface HoseInspection {
  id?: number;
  id_mangueira: string;
  data_inspecao: string;
  resultado: string;
  status_geral?: string;
  plano_de_acao?: string;
  resultados_json?: Record<string, any>;
  observacoes?: string;
  link_foto_nao_conformidade?: string;
  inspetor?: string;
  data_proxima_inspecao?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  user_id?: string;
}

export async function saveHoseInspection(inspection: Omit<HoseInspection, 'id' | 'created_at'>): Promise<boolean> {
  try {
    // Calcula próxima data de teste (1 ano após a inspeção atual)
    const inspectionDate = new Date(inspection.data_inspecao);
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
    return false;
  }
}

/**
 * Busca todas as inspeções de uma mangueira
 */
export async function getHoseInspections(idMangueira: string): Promise<HoseInspection[]> {
  try {
    // Usar query direta já que a tabela ainda não está nos tipos gerados
    const { data, error } = await supabase
      .from('inspecoes_mangueiras' as any)
      .select('*')
      .eq('id_mangueira', idMangueira)
      .order('data_inspecao', { ascending: false });

    if (error) throw error;
    return (data as any) || [];
  } catch (error) {
    logger.error('Erro ao buscar inspeções de mangueira', 'equipment', error);
    return [];
  }
}

