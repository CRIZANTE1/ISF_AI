/**
 * Utilitários para operações de detectores multigás
 */

import { supabase } from '../lib/supabase';

export interface MultigasDetector {
  id?: number;
  id_equipamento: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  data_cadastro?: string;
  LEL_cilindro?: number;
  O2_cilindro?: number;
  H2S_cilindro?: number;
  CO_cilindro?: number;
  created_at?: string;
  user_id?: string;
}

export interface MultigasInspection {
  id?: number;
  data_teste?: string;
  id_equipamento: string;
  tipo_teste?: string;
  resultado_teste?: string;
  LEL_referencia?: number;
  O2_referencia?: number;
  H2S_referencia?: number;
  CO_referencia?: number;
  LEL_encontrado?: number;
  O2_encontrado?: number;
  H2S_encontrado?: number;
  CO_encontrado?: number;
  observacoes?: string;
  plano_de_acao?: string;
  inspetor?: string;
  data_proximo_teste?: string;
  created_at?: string;
  user_id?: string;
}

export interface CylinderValues {
  LEL: number;
  O2: number;
  H2S: number;
  CO: number;
}

/**
 * Salva um novo detector multigás
 */
export async function saveNewMultigasDetector(
  detector: Omit<MultigasDetector, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Verifica se já existe
    const { data: existing } = await supabase
      .from('inventario_multigas')
      .select('id_equipamento')
      .eq('id_equipamento', detector.id_equipamento)
      .single();

    if (existing) {
      throw new Error(`Detector com ID '${detector.id_equipamento}' já existe.`);
    }

    const { error } = await supabase
      .from('inventario_multigas')
      .insert(detector);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao salvar detector multigás:', error);
    throw error;
  }
}

/**
 * Busca todos os detectores multigás
 */
export async function getAllMultigasDetectors(): Promise<MultigasDetector[]> {
  try {
    const { data, error } = await supabase
      .from('inventario_multigas')
      .select('*')
      .order('id_equipamento');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar detectores multigás:', error);
    return [];
  }
}

/**
 * Busca um detector por ID
 */
export async function getMultigasDetectorById(idEquipamento: string): Promise<MultigasDetector | null> {
  try {
    console.log('Buscando detector multigas:', idEquipamento);
    const { data, error } = await supabase
      .from('inventario_multigas')
      .select('*')
      .eq('id_equipamento', idEquipamento)
      .maybeSingle(); // Usar maybeSingle() em vez de single() para evitar erro quando não encontra

    if (error) {
      console.error('Erro Supabase ao buscar detector multigás:', error);
      throw error;
    }
    
    if (!data) {
      console.log('Detector multigas não encontrado:', idEquipamento);
      // Fallback: tentar buscar sem .maybeSingle() para debug
      const { data: allData, error: allError } = await supabase
        .from('inventario_multigas')
        .select('*')
        .eq('id_equipamento', idEquipamento);
      
      if (allError) {
        console.error('Erro ao buscar todos os detectores:', allError);
      } else {
        console.log('Resultado sem maybeSingle:', allData);
        if (allData && allData.length > 0) {
          return allData[0];
        }
      }
      return null;
    }
    
    console.log('Detector multigas encontrado:', data);
    return data;
  } catch (error: any) {
    console.error('Erro ao buscar detector multigás:', error);
    console.error('Detalhes do erro:', {
      message: error?.message,
      code: error?.code,
      details: error?.details,
      hint: error?.hint
    });
    return null;
  }
}

/**
 * Busca os valores do cilindro para um detector
 */
export async function getDetectorCylinderValues(idEquipamento: string): Promise<CylinderValues | null> {
  try {
    const detector = await getMultigasDetectorById(idEquipamento);
    if (!detector) return null;

    return {
      LEL: detector.LEL_cilindro || 0,
      O2: detector.O2_cilindro || 0,
      H2S: detector.H2S_cilindro || 0,
      CO: detector.CO_cilindro || 0,
    };
  } catch (error) {
    console.error('Erro ao buscar valores do cilindro:', error);
    return null;
  }
}

/**
 * Atualiza os valores do cilindro
 */
export async function updateCylinderValues(
  idEquipamento: string,
  values: CylinderValues
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('inventario_multigas')
      .update({
        LEL_cilindro: values.LEL,
        O2_cilindro: values.O2,
        H2S_cilindro: values.H2S,
        CO_cilindro: values.CO,
      })
      .eq('id_equipamento', idEquipamento);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao atualizar valores do cilindro:', error);
    return false;
  }
}

/**
 * Salva uma inspeção de multigás (bump test ou calibração)
 */
export async function saveMultigasInspection(
  inspection: Omit<MultigasInspection, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('inspecoes_multigas')
      .insert(inspection);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao salvar inspeção multigás:', error);
    return false;
  }
}

/**
 * Verifica os resultados de um bump test
 */
export function verifyBumpTest(
  referenceValues: CylinderValues,
  foundValues: CylinderValues,
  tolerancePercent: number = 20
): { isApproved: boolean; observations: string[] } {
  const observations: string[] = [];
  let isApproved = true;

  const gasMap: Record<keyof CylinderValues, string> = {
    LEL: 'LEL',
    O2: 'O²',
    H2S: 'H²S',
    CO: 'CO',
  };

  for (const gas of ['LEL', 'O2', 'H2S', 'CO'] as const) {
    const refVal = referenceValues[gas];
    const foundVal = foundValues[gas];

    if (refVal === 0 || !foundVal) continue;

    const difference = foundVal - refVal;
    const variationPercent = (difference / refVal) * 100;

    if (Math.abs(variationPercent) > tolerancePercent) {
      isApproved = false;
      observations.push(
        `Sensor de ${gasMap[gas]} REPROVADO. Leitura: ${foundVal}, Referência: ${refVal} (Variação: ${variationPercent.toFixed(1)}%).`
      );
    } else if (Math.abs(variationPercent) > 10) {
      observations.push(
        `Sensor de ${gasMap[gas]} com resposta baixa/alta. Leitura: ${foundVal}, Referência: ${refVal} (Variação: ${variationPercent.toFixed(1)}%). Calibração preventiva recomendada.`
      );
    }
  }

  return {
    isApproved,
    observations: observations.length > 0 ? observations : ['Todos os sensores responderam corretamente.'],
  };
}

/**
 * Gera plano de ação para multigás
 */
export function generateMultigasActionPlan(resultadoTeste: string, tipoTeste: string): string {
  if (resultadoTeste === 'Aprovado') {
    return 'Manter em monitoramento periódico.';
  }
  if (tipoTeste === 'Calibração Anual') {
    return 'Equipamento reprovado na calibração. Enviar para manutenção especializada ou substituir.';
  }
  return 'Equipamento reprovado no teste de resposta (Bump Test). Realizar calibração completa.';
}

/**
 * Salva uma ação corretiva de multigás
 */
export async function saveMultigasActionLog(
  equipmentId: string,
  problem: string,
  action: string,
  responsible: string,
  photoLink?: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('log_acoes_multigas')
      .insert({
        id_equipamento: equipmentId,
        problema_original: problem,
        acao_realizada: action,
        responsavel_acao: responsible,
        photo_link: photoLink || null,
        data_acao: new Date().toISOString().split('T')[0],
      });

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('Erro ao salvar log de ação multigás:', error);
    return false;
  }
}

