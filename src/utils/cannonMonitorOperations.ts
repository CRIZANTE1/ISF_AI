/**
 * Utilitários para operações de canhões monitores
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';
import type { CannonMonitor, CannonMonitorInspection } from '../types/equipment';

// Re-exporta para manter compatibilidade com imports existentes
export type { CannonMonitor, CannonMonitorInspection } from '../types/equipment';

// Mapeamento de ações para plano de ação baseado em não conformidades
const ACTION_PLAN_MAP: Record<string, string> = {
  "Base e suporte íntegros": "Verificar e reparar ou substituir a base e suporte danificados.",
  "Sem corrosão ou amassados": "Programar serviço de tratamento de corrosão, reparo e repintura.",
  "Fixação adequada": "Verificar e corrigir a fixação do equipamento, garantindo estabilidade e segurança.",
  "Canhão monitor íntegro": "Avaliar a integridade estrutural do canhão monitor. Se comprometida, programar a substituição.",
  "Válvulas funcionando": "Realizar a limpeza, lubrificação ou substituição da válvula defeituosa.",
  "Mangueiras sem vazamentos": "Identificar ponto de vazamento e substituir mangueira ou reparar conexão.",
  "Fluxo de água adequado": "Verificar pressão e vazão do sistema. Desobstruir linhas ou substituir componentes se necessário.",
  "Controle de direção funcionando": "Verificar e reparar mecanismo de controle de direção. Lubrificar ou substituir componentes danificados.",
};

/**
 * Salva um novo canhão monitor
 */
export async function saveNewCannonMonitor(
  cannon: Omit<CannonMonitor, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    const { data: existing, error: checkError } = await supabase
      .from('inventario_canhoes_monitores')
      .select('id_equipamento')
      .eq('id_equipamento', cannon.id_equipamento)
      .eq('user_id', user.id)
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
    const result = await offlineInsert('inventario_canhoes_monitores', { ...cannon, user_id: user.id });
    
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
 * Gera plano de ação para canhões monitores
 */
export function generateCannonMonitorActionPlan(nonConformities: string[]): string {
  if (nonConformities.length === 0) {
    return "Manter em monitoramento periódico.";
  }
  
  // Tenta encontrar correspondência exata primeiro
  const firstIssue = nonConformities[0];
  if (ACTION_PLAN_MAP[firstIssue]) {
    return ACTION_PLAN_MAP[firstIssue];
  }
  
  // Se não encontrar correspondência exata, tenta busca por substring
  // Ordena as palavras-chave por tamanho (mais longas primeiro) para melhor matching
  const sortedKeywords = Object.keys(ACTION_PLAN_MAP).sort((a, b) => b.length - a.length);
  
  for (const nonConformity of nonConformities) {
    for (const keyword of sortedKeywords) {
      if (nonConformity.trim() === keyword.trim() || 
          nonConformity.includes(keyword) || 
          keyword.includes(nonConformity)) {
        return ACTION_PLAN_MAP[keyword];
      }
    }
  }
  
  // Se nenhuma correspondência for encontrada, retorna mensagem genérica
  return "Corrigir a não conformidade reportada.";
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

    const planoDeAcao = generateCannonMonitorActionPlan(nonConformities);

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_canhoes_monitores', {
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
            .from('inventario_canhoes_monitores')
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
    throw error;
  }
}

/**
 * Busca todos os canhões monitores
 */
export async function getAllCannonMonitors(): Promise<CannonMonitor[]> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar canhões monitores', 'equipment');
      return [];
    }

    // Busca canhões monitores APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('inventario_canhoes_monitores')
      .select('*')
      .eq('user_id', user.id)
      .order('id_equipamento');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar canhões monitores', 'equipment', error);
    return [];
  }
}

