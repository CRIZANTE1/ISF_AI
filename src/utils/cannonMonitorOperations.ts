/**
 * Utilitários para operações de canhões monitores
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';

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
  latitude?: number;
  longitude?: number;
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
    const { data: existing, error: checkError } = await supabase
      .from('inventario_canhoes_monitores')
      .select('id_equipamento')
      .eq('id_equipamento', cannon.id_equipamento)
      .maybeSingle();

    // Se houver erro diferente de "não encontrado", lança o erro
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      throw new Error(`Canhão monitor com ID '${cannon.id_equipamento}' já existe.`);
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inventario_canhoes_monitores', cannon);
    
    if (!result.success) {
      throw new Error('Falha ao salvar canhão monitor');
    }
    
    // Log action
    try {
      await logUserAction('create', 'equipment', cannon.id_equipamento, {
        type: 'canhao_monitor',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar canhão monitor', 'equipment', error);
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

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_canhoes_monitores', {
      ...inspection,
      plano_de_acao: planoDeAcao,
    });
    
    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
    }
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.id_equipamento, {
        type: 'canhao_monitor',
        tipo_inspecao: inspection.tipo_inspecao,
        status: inspection.status_geral,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção de canhão monitor', 'equipment', error);
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
    logger.error('Erro ao buscar canhões monitores', 'equipment', error);
    return [];
  }
}

