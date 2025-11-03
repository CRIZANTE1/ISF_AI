/**
 * Utilitários para operações de chuveiros/lava-olhos
 */

import { supabase } from '../lib/supabase';

export interface EyewashStation {
  id?: number;
  id_equipamento: string;
  localizacao?: string;
  marca?: string;
  modelo?: string;
  data_cadastro?: string;
  created_at?: string;
  user_id?: string;
}

export interface EyewashInspection {
  id?: number;
  data_inspecao?: string;
  id_equipamento: string;
  status_geral?: string;
  plano_de_acao?: string;
  resultados_json?: Record<string, any>;
  link_foto_nao_conformidade?: string;
  inspetor?: string;
  data_proxima_inspecao?: string;
  created_at?: string;
  user_id?: string;
}

const ACTION_PLAN_MAP: Record<string, string> = {
  "A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?": "Verificar e desobstruir a linha de suprimento ou ajustar a válvula de vazão.",
  "A PRESSÃO ESTÁ ADEQUADA?": "Verificar a pressão na linha de entrada e ajustar o regulador de pressão, se aplicável.",
  "A PINTURA ESTA ÍNTEGRA?": "Programar serviço de lixamento e repintura do equipamento.",
  "OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?": "Substituir as gaxetas ou o reparo da válvula com vazamento.",
  "O ACESSO ESTÁ LIVRE?": "Remover obstruções e garantir corredor de acesso livre conforme norma.",
  "NIVELAMENTO POSSUI DESNÍVEL?": "Realinhar e fixar a base do equipamento para garantir o nivelamento correto.",
  "A DRENAGEM DE ÁGUA FUNCIONA?": "Desobstruir o ralo ou a tubulação de drenagem.",
  "O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?": "Realizar a limpeza do crivo e reapertar suas fixações.",
  "O FILTRO ESTÁ LIMPO?": "Remover, limpar e reinstalar o filtro da linha de água.",
  "O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?": "Testar e, se necessário, substituir o regulador de pressão.",
  "O PISO POSSUI ADERÊNCIA?": "Aplicar tratamento antiderrapante ou substituir o revestimento do piso.",
  "OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?": "Incluir treinamento sobre o uso do equipamento no próximo DDS ou treinamento da CIPA.",
  "O EQUIPAMENTO POSSUI CORROSÃO?": "Avaliar a extensão da corrosão. Programar serviço de tratamento e repintura.",
  "EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?": "Programar a pintura de demarcação do piso conforme norma.",
  "OS ESGUICHOS POSSUEM DEFEITOS?": "Limpar ou substituir os esguichos/bocais do lava-olhos.",
  "O PISO ESTÁ DANIFICADO?": "Programar o reparo ou a substituição da área danificada do piso.",
};

/**
 * Gera plano de ação para chuveiros/lava-olhos
 */
export function generateEyewashActionPlan(nonConformities: string[]): string {
  if (nonConformities.length === 0) {
    return "Manter em monitoramento periódico.";
  }
  const firstIssue = nonConformities[0];
  return ACTION_PLAN_MAP[firstIssue] || "Corrigir a não conformidade reportada.";
}

/**
 * Salva um novo chuveiro/lava-olhos
 */
export async function saveNewEyewashStation(
  station: Omit<EyewashStation, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from('inventario_chuveiros_lava_olhos')
      .select('id_equipamento')
      .eq('id_equipamento', station.id_equipamento)
      .single();

    if (existing) {
      throw new Error(`Chuveiro/lava-olhos com ID '${station.id_equipamento}' já existe.`);
    }

    const { error } = await supabase
      .from('inventario_chuveiros_lava_olhos')
      .insert(station);

    if (error) throw error;
    
    // Log action
    try {
      const { logUserAction } = await import('./adminOperations');
      await logUserAction('create', 'equipment', station.id_equipamento, {
        type: 'chuveiro_lavaolhos',
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar chuveiro/lava-olhos:', error);
    throw error;
  }
}

/**
 * Salva uma inspeção de chuveiro/lava-olhos
 */
export async function saveEyewashInspection(
  inspection: Omit<EyewashInspection, 'id' | 'created_at'>
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

    const planoDeAcao = generateEyewashActionPlan(nonConformities);

    const { error } = await supabase
      .from('inspecoes_chuveiros_lava_olhos')
      .insert({
        ...inspection,
        plano_de_acao: planoDeAcao,
      });

    if (error) throw error;
    
    // Log action
    try {
      const { logUserAction } = await import('./adminOperations');
      await logUserAction('create', 'inspection', inspection.id_equipamento, {
        type: 'chuveiro_lavaolhos',
        status: inspection.status_geral,
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar inspeção de chuveiro/lava-olhos:', error);
    return false;
  }
}

/**
 * Busca todos os chuveiros/lava-olhos
 */
export async function getAllEyewashStations(): Promise<EyewashStation[]> {
  try {
    const { data, error } = await supabase
      .from('inventario_chuveiros_lava_olhos')
      .select('*')
      .order('id_equipamento');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar chuveiros/lava-olhos:', error);
    return [];
  }
}

