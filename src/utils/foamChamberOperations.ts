/**
 * Utilitários para operações de câmaras de espuma
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';
import type { FoamChamber, FoamChamberInspection } from '../types/equipment';

// Re-exporta para manter compatibilidade com imports existentes
export type { FoamChamber, FoamChamberInspection } from '../types/equipment';

const ACTION_PLAN_MAP: Record<string, string> = {
  "Pintura e estrutura sem corrosão ou amassados": "Programar serviço de tratamento de corrosão, reparo e repintura.",
  "Sem vazamentos visíveis no tanque e conexões": "Identificar ponto de vazamento, substituir juntas/vedações ou reparar a conexão.",
  "Válvulas em bom estado e lubrificadas": "Realizar a limpeza, lubrificação ou substituição da válvula defeituosa.",
  "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)": "Avaliar a integridade estrutural. Se comprometida, programar a substituição da câmara.",
  "Selo de vidro limpo, íntegro e bem fixado": "Realizar a limpeza ou substituição do selo de vidro caso esteja sujo ou trincado.",
  "Junta de vedação em boas condições": "Substituir a junta de vedação ressecada ou danificada.",
  "Defletor e barragem de espuma íntegros": "Reparar ou substituir o defletor/barragem de espuma danificado.",
  "Tomadas de solução e linhas sem obstrução": "Realizar a desobstrução e limpeza completa das linhas de solução.",
  "Drenos livres e estanques": "Desobstruir e verificar a estanqueidade dos drenos.",
  "Ejetores e orifícios desobstruídos": "Realizar a limpeza e desobstrução dos ejetores e orifícios.",
  "Placa de orifício íntegra e sem obstruções": "Inspecionar, limpar ou substituir a placa de orifício conforme necessário.",
  "Placa de orifício compatível com o modelo da câmara": "CRÍTICO: Substituir a placa de orifício por uma compatível com o modelo da câmara.",
};

/**
 * Gera plano de ação para câmaras de espuma
 */
export function generateFoamChamberActionPlan(nonConformities: string[]): string {
  if (nonConformities.length === 0) {
    return "Manter em monitoramento periódico.";
  }
  const firstIssue = nonConformities[0];
  return ACTION_PLAN_MAP[firstIssue] || "Corrigir a não conformidade reportada.";
}

/**
 * Salva uma nova câmara de espuma
 */
export async function saveNewFoamChamber(
  chamber: Omit<FoamChamber, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { data: existing, error: checkError } = await supabase
      .from('inventario_camaras_espuma')
      .select('id_camara')
      .eq('id_camara', chamber.id_camara)
      .eq('user_id', user.id)
      .maybeSingle();

    // Se houver erro diferente de "não encontrado", lança o erro
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      throw new Error(`Câmara com ID '${chamber.id_camara}' já existe.`);
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inventario_camaras_espuma', { ...chamber, user_id: user.id });
    
    if (!result.success) {
      throw new Error('Falha ao salvar câmara de espuma');
    }
    
    // Log action
    try {
      await logUserAction('create', 'equipment', chamber.id_camara, {
        type: 'camara_espuma',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar câmara de espuma', 'equipment', error);
    throw error;
  }
}

/**
 * Salva uma inspeção de câmara de espuma
 */
export async function saveFoamChamberInspection(
  inspection: Omit<FoamChamberInspection, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Extrai não conformidades dos resultados
    const nonConformities: string[] = [];
    if (inspection.resultados_json) {
      for (const [question, status] of Object.entries(inspection.resultados_json)) {
        if (status === "Não Conforme") {
          nonConformities.push(question);
        }
      }
    }

    const planoDeAcao = generateFoamChamberActionPlan(nonConformities);

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_camaras_espuma', {
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
            .from('inventario_camaras_espuma')
            .update({
              latitude: inspection.latitude,
              longitude: inspection.longitude,
            })
            .eq('id_camara', inspection.id_camara)
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
      await logUserAction('create', 'inspection', inspection.id_camara, {
        type: 'camara_espuma',
        tipo_inspecao: inspection.tipo_inspecao,
        status: inspection.status_geral,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção de câmara de espuma', 'equipment', error);
    throw error;
  }
}

/**
 * Busca todas as câmaras de espuma
 */
export async function getAllFoamChambers(): Promise<FoamChamber[]> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar câmaras de espuma', 'equipment');
      return [];
    }

    // Busca câmaras de espuma APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('inventario_camaras_espuma')
      .select('*')
      .eq('user_id', user.id)
      .order('id_camara');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar câmaras de espuma', 'equipment', error);
    return [];
  }
}

