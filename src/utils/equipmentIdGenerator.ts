/**
 * Utilitário para geração automática de IDs de equipamentos
 */

import { supabase } from '../lib/supabase';
import { logger } from './logger';

/**
 * Mapeia o tipo de equipamento para o nome da tabela e campo de ID
 */
function getTableAndIdField(equipmentType: string): { table: string; idField: string } {
  const mapping: Record<string, { table: string; idField: string }> = {
    extintor: { table: 'extintores', idField: 'numero_identificacao' },
    mangueira: { table: 'mangueiras', idField: 'id_mangueira' },
    scba: { table: 'conjuntos_autonomos', idField: 'numero_serie_equipamento' },
    multigas: { table: 'inventario_multigas', idField: 'id_equipamento' },
    camara_espuma: { table: 'inventario_camaras_espuma', idField: 'id_camara' },
    canhao_monitor: { table: 'inventario_canhoes_monitores', idField: 'id_equipamento' },
    chuveiro_lavaolhos: { table: 'inventario_chuveiros_lava_olhos', idField: 'id_equipamento' },
    alarme: { table: 'inventario_alarmes', idField: 'id_sistema' },
    abrigo: { table: 'abrigos', idField: 'id_abrigo' },
  };

  return mapping[equipmentType] || { table: '', idField: 'equipment_id' };
}

/**
 * Gera um prefixo baseado no tipo de equipamento
 */
function getEquipmentPrefix(equipmentType: string): string {
  const prefixMap: Record<string, string> = {
    extintor: 'EXT',
    mangueira: 'MANG',
    scba: 'SCBA',
    multigas: 'MULT',
    camara_espuma: 'CAM',
    canhao_monitor: 'CAN',
    chuveiro_lavaolhos: 'CHU',
    alarme: 'ALM',
    abrigo: 'ABR',
  };

  return prefixMap[equipmentType] || 'EQP';
}

/**
 * Gera um ID automático único para um equipamento
 * Usa função atômica do banco de dados (generate_unique_equipment_id)
 * que garante atomicidade e evita race conditions.
 * 
 * Formato gerado: PREFIXO-TIMESTAMP_MS-RANDOM
 * Exemplo: EXT-1734729600000-786989
 */
export async function generateAutoEquipmentId(
  equipmentType: string,
  userId: string
): Promise<string> {
  try {
    const { table, idField } = getTableAndIdField(equipmentType);
    const prefix = getEquipmentPrefix(equipmentType);

    if (!table || !idField) {
      throw new Error(`Tipo de equipamento '${equipmentType}' não suportado para geração automática de ID`);
    }

    // Usar função do banco de dados para geração atômica (evita race conditions)
    const { data, error } = await supabase.rpc('generate_unique_equipment_id', {
      p_table_name: table,
      p_id_field_name: idField,
      p_prefix: prefix,
      p_user_id: userId,
    });

    if (error) {
      logger.error('Erro ao gerar ID via função do banco', 'equipment', error);
      throw error;
    }

    if (data && typeof data === 'string') {
      logger.debug('ID gerado com sucesso via função do banco', 'equipment', { id: data });
      return data as string;
    }

    // Se chegou aqui, algo está muito errado
    throw new Error('Função do banco retornou resultado vazio ou inválido');
  } catch (error) {
    logger.error('Erro crítico ao gerar ID automático de equipamento', 'equipment', error);
    
    // Fallback melhorado: usa timestamp em MS + random maior + UUID parcial
    const prefix = getEquipmentPrefix(equipmentType);
    const timestampMs = Date.now();
    const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
    const uuidPart = Math.random().toString(36).substring(2, 8).toUpperCase();
    const fallbackId = `${prefix}-${timestampMs}-${random}-${uuidPart}`;
    
    logger.warn('Usando ID gerado por fallback client-side (risco de race condition)', 'equipment', { 
      fallbackId,
      error: error instanceof Error ? error.message : String(error)
    });
    
    return fallbackId;
  }
}

