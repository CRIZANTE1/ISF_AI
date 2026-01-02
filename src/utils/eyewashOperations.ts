/**
 * Utilitários para operações de chuveiros/lava-olhos
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';

export interface EyewashStation {
  id?: number;
  id_equipamento: string;
  localizacao?: string;
  marca?: string;
  modelo?: string;
  numero_serie?: string;
  latitude?: number;
  longitude?: number;
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
  latitude?: number;
  longitude?: number;
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
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { data: existing, error: checkError } = await supabase
      .from('inventario_chuveiros_lava_olhos')
      .select('id_equipamento')
      .eq('id_equipamento', station.id_equipamento)
      .eq('user_id', user.id)
      .maybeSingle();

    // Se houver erro diferente de "não encontrado", lança o erro
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      throw new Error(`Chuveiro/lava-olhos com ID '${station.id_equipamento}' já existe.`);
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inventario_chuveiros_lava_olhos', { ...station, user_id: user.id });
    
    if (!result.success) {
      throw new Error('Falha ao salvar chuveiro/lava-olhos');
    }
    
    // Log action
    try {
      await logUserAction('create', 'equipment', station.id_equipamento, {
        type: 'chuveiro_lavaolhos',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar chuveiro/lava-olhos', 'equipment', error);
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

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_chuveiros_lava_olhos', {
      ...inspection,
      plano_de_acao: planoDeAcao,
    });
    
    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
    }
    
    // Atualiza latitude/longitude no cadastro do equipamento se fornecidas na inspeção
    // NOTA: Isso sobrescreve coordenadas editadas manualmente no cadastro, pois a última inspeção tem prioridade
    // Se a inspeção não tiver GPS (null/undefined), as coordenadas do cadastro permanecem inalteradas
    if (inspection.latitude != null && inspection.longitude != null) {
      try {
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (!userError && user?.id) {
          const { error: updateError } = await supabase
            .from('inventario_chuveiros_lava_olhos')
            .update({
              latitude: inspection.latitude,
              longitude: inspection.longitude,
            })
            .eq('id_equipamento', inspection.id_equipamento)
            .eq('user_id', user.id);
          
          if (updateError) {
            logger.warn('Erro ao atualizar coordenadas no cadastro do equipamento', 'equipment', updateError);
          }
        }
      } catch (updateError) {
        logger.warn('Erro ao atualizar coordenadas no cadastro do equipamento', 'equipment', updateError);
      }
    }
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.id_equipamento, {
        type: 'chuveiro_lavaolhos',
        status: inspection.status_geral,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção de chuveiro/lava-olhos', 'equipment', error);
    return false;
  }
}

/**
 * Busca todos os chuveiros/lava-olhos
 */
export async function getAllEyewashStations(): Promise<EyewashStation[]> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar chuveiros/lava-olhos', 'equipment');
      return [];
    }

    // Busca chuveiros/lava-olhos APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('inventario_chuveiros_lava_olhos')
      .select('*')
      .eq('user_id', user.id)
      .order('id_equipamento');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar chuveiros/lava-olhos', 'equipment', error);
    return [];
  }
}

