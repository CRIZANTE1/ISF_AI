/**
 * Utilitários para operações de SCBA (Conjuntos Autônomos)
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';

export interface SCBA {
  id?: number;
  numero_serie_equipamento: string;
  marca?: string;
  modelo?: string;
  numero_serie_mascara?: string;
  numero_serie_segundo_estagio?: string;
  data_teste?: string;
  data_validade?: string;
  resultado_final?: string;
  vazamento_mascara_resultado?: string;
  inspetor_responsavel?: string;
  empresa_executante?: string;
  link_relatorio_pdf?: string;
  created_at?: string;
  user_id?: string;
}

export interface SCBAInspection {
  id?: number;
  data_inspecao?: string;
  numero_serie_equipamento: string;
  status_geral?: string;
  resultados_json?: Record<string, any>;
  inspetor?: string;
  data_proxima_inspecao?: string;
  created_at?: string;
  user_id?: string;
}

/**
 * Salva um novo SCBA
 */
export async function saveNewSCBA(scba: Omit<SCBA, 'id' | 'created_at'>): Promise<boolean> {
  try {
    // Verifica se já existe
    const { data: existing } = await supabase
      .from('conjuntos_autonomos')
      .select('numero_serie_equipamento')
      .eq('numero_serie_equipamento', scba.numero_serie_equipamento)
      .single();

    if (existing) {
      throw new Error(`SCBA com número de série '${scba.numero_serie_equipamento}' já existe.`);
    }

    const { error } = await supabase
      .from('conjuntos_autonomos')
      .insert(scba);

    if (error) throw error;
    
    // Log action
    try {
      await logUserAction('create', 'equipment', scba.numero_serie_equipamento, {
        type: 'scba',
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar SCBA:', error);
    throw error;
  }
}

/**
 * Busca todos os SCBAs
 */
export async function getAllSCBAs(): Promise<SCBA[]> {
  try {
    const { data, error } = await supabase
      .from('conjuntos_autonomos')
      .select('*')
      .order('numero_serie_equipamento');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar SCBAs:', error);
    return [];
  }
}

/**
 * Busca um SCBA por número de série
 */
export async function getSCBABySerial(serialNumber: string): Promise<SCBA | null> {
  try {
    const { data, error } = await supabase
      .from('conjuntos_autonomos')
      .select('*')
      .eq('numero_serie_equipamento', serialNumber)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Erro ao buscar SCBA:', error);
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
    const { error } = await supabase
      .from('inspecoes_scba')
      .insert(inspection);

    if (error) throw error;
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.numero_serie_equipamento, {
        type: 'scba',
        status: inspection.status_geral,
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar inspeção SCBA:', error);
    return false;
  }
}

/**
 * Busca todas as inspeções de um SCBA
 */
export async function getSCBAInspections(serialNumber: string): Promise<SCBAInspection[]> {
  try {
    const { data, error } = await supabase
      .from('inspecoes_scba')
      .select('*')
      .eq('numero_serie_equipamento', serialNumber)
      .order('data_inspecao', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar inspeções SCBA:', error);
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
    console.error('Erro ao salvar log de ação SCBA:', error);
    return false;
  }
}

