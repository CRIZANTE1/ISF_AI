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
 * Formato: PREFIXO-YYYYMMDD-HHMMSS-XXX (onde XXX é um número aleatório)
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

    // Gera um ID baseado em timestamp e número aleatório
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');
    const timeStr = now.toTimeString().slice(0, 8).replace(/:/g, '');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    const baseId = `${prefix}-${dateStr}-${timeStr}-${random}`;
    let generatedId = baseId;
    let attempts = 0;
    const maxAttempts = 10;

    // Verifica se o ID já existe e gera um novo se necessário
    while (attempts < maxAttempts) {
      const { data: existing, error: checkError } = await supabase
        .from(table)
        .select(idField)
        .eq(idField, generatedId)
        .eq('user_id', userId)
        .maybeSingle();

      // Se houver erro diferente de "não encontrado", lança o erro
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }

      // Se não existe, retorna o ID gerado
      if (!existing) {
        return generatedId;
      }

      // Se existe, gera um novo ID com número aleatório diferente
      attempts++;
      const newRandom = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
      generatedId = `${prefix}-${dateStr}-${timeStr}-${newRandom}`;
    }

    // Se após várias tentativas ainda não encontrou um ID único, usa timestamp completo
    const timestamp = Date.now();
    const finalRandom = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}-${timestamp}-${finalRandom}`;
  } catch (error) {
    logger.error('Erro ao gerar ID automático de equipamento', 'equipment', error);
    // Fallback: retorna um ID baseado apenas em timestamp e random
    const prefix = getEquipmentPrefix(equipmentType);
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 100000).toString().padStart(5, '0');
    return `${prefix}-${timestamp}-${random}`;
  }
}

