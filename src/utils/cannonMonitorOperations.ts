/**
 * Utilitários para operações de canhões monitores
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';

export interface CannonMonitor {
  id?: number;
  id_equipamento: string;
  localizacao?: string;
  marca?: string;
  modelo?: string;
  data_cadastro?: string;
  created_at?: string;
  user_id?: string;
}

export interface CannonMonitorInspection {
  id?: number;
  data_inspecao?: string;
  id_equipamento: string;
  tipo_inspecao?: string;
  status_geral?: string;
  plano_de_acao?: string;
  resultados_json?: Record<string, any>;
  link_foto_nao_conformidade?: string;
  inspetor?: string;
  data_proxima_inspecao?: string;
  created_at?: string;
  user_id?: string;
}

/**
 * Salva um novo canhão monitor
 */
export async function saveNewCannonMonitor(
  cannon: Omit<CannonMonitor, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from('inventario_canhoes_monitores')
      .select('id_equipamento')
      .eq('id_equipamento', cannon.id_equipamento)
      .single();

    if (existing) {
      throw new Error(`Canhão monitor com ID '${cannon.id_equipamento}' já existe.`);
    }

    const { error } = await supabase
      .from('inventario_canhoes_monitores')
      .insert(cannon);

    if (error) throw error;
    
    // Log action
    try {
      await logUserAction('create', 'equipment', cannon.id_equipamento, {
        type: 'canhao_monitor',
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar canhão monitor:', error);
    throw error;
  }
}

/**
 * Salva uma inspeção de canhão monitor
 */
export async function saveCannonMonitorInspection(
  inspection: Omit<CannonMonitorInspection, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Extrai não conformidades
    const nonConformities: string[] = [];
    if (inspection.resultados_json) {
      for (const [question, status] of Object.entries(inspection.resultados_json)) {
        if (status === "Não Conforme") {
          nonConformities.push(question);
        }
      }
    }

    const planoDeAcao = nonConformities.length > 0
      ? "Corrigir itens não conformes."
      : "Manter monitoramento periódico.";

    const { error } = await supabase
      .from('inspecoes_canhoes_monitores')
      .insert({
        ...inspection,
        plano_de_acao: planoDeAcao,
      });

    if (error) throw error;
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.id_equipamento, {
        type: 'canhao_monitor',
        tipo_inspecao: inspection.tipo_inspecao,
        status: inspection.status_geral,
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar inspeção de canhão monitor:', error);
    return false;
  }
}

/**
 * Busca todos os canhões monitores
 */
export async function getAllCannonMonitors(): Promise<CannonMonitor[]> {
  try {
    const { data, error } = await supabase
      .from('inventario_canhoes_monitores')
      .select('*')
      .order('id_equipamento');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar canhões monitores:', error);
    return [];
  }
}

