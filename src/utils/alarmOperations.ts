/**
 * Utilitários para operações de sistemas de alarme
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';

export interface AlarmSystem {
  id?: number;
  id_sistema: string;
  localizacao: string;
  marca?: string;
  modelo?: string;
  data_cadastro?: string;
  created_at?: string;
  user_id?: string;
}

export interface AlarmInspection {
  id?: number;
  data_inspecao?: string;
  id_sistema: string;
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
 * Gera plano de ação para alarmes
 */
export function generateAlarmActionPlan(nonConformities: string[]): string {
  if (nonConformities.length === 0) {
    return "Manter em monitoramento periódico conforme cronograma estabelecido.";
  }

  const actionPriorities = {
    critical: [
      "Sistema comunica com central de monitoramento",
      "Sirenes funcionam corretamente durante teste",
      "Detectores de fumaça respondem ao teste",
      "Acionadores manuais respondem quando ativados",
    ],
    maintenance: [
      "Painel de controle sem danos físicos",
      "Fiação e conexões em bom estado",
      "Baterias de backup em bom estado",
      "Detectores de fumaça/calor limpos e sem danos",
    ],
    documentation: [
      "Instruções de operação visíveis e legíveis",
      "Plano de evacuação atualizado e visível",
      "Contatos de emergência atualizados",
      "Sinalização de rotas de fuga adequada",
    ],
  };

  const criticalIssues = nonConformities.filter(issue =>
    actionPriorities.critical.some(critical => issue.includes(critical))
  );
  const maintenanceIssues = nonConformities.filter(issue =>
    actionPriorities.maintenance.some(maint => issue.includes(maint))
  );
  const documentationIssues = nonConformities.filter(issue =>
    actionPriorities.documentation.some(doc => issue.includes(doc))
  );

  if (criticalIssues.length > 0) {
    return `AÇÃO IMEDIATA NECESSÁRIA: Corrigir problemas críticos de segurança (${criticalIssues.length} item(s)). Sistema pode estar comprometido.`;
  }
  if (maintenanceIssues.length > 0) {
    return `MANUTENÇÃO PREVENTIVA: Realizar manutenção em ${maintenanceIssues.length} componente(s). Agendar serviço técnico.`;
  }
  if (documentationIssues.length > 0) {
    return `ATUALIZAÇÃO DE DOCUMENTAÇÃO: Revisar e atualizar ${documentationIssues.length} item(s) de documentação/sinalização.`;
  }

  return "Corrigir as não conformidades identificadas.";
}

/**
 * Salva um novo sistema de alarme
 */
export async function saveNewAlarmSystem(
  alarm: Omit<AlarmSystem, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      throw new Error('Usuário não autenticado');
    }

    // Verifica se já existe APENAS para este usuário
    const { data: existing, error: checkError } = await supabase
      .from('inventario_alarmes')
      .select('id_sistema')
      .eq('id_sistema', alarm.id_sistema)
      .eq('user_id', user.id)
      .maybeSingle();

    // Se houver erro diferente de "não encontrado", lança o erro
    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existing) {
      throw new Error(`Sistema de alarme com ID '${alarm.id_sistema}' já existe.`);
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inventario_alarmes', { ...alarm, user_id: user.id });
    
    if (!result.success) {
      throw new Error('Falha ao salvar sistema de alarme');
    }
    
    // Log action
    try {
      await logUserAction('create', 'equipment', alarm.id_sistema, {
        type: 'alarme',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar sistema de alarme', 'equipment', error);
    throw error;
  }
}

/**
 * Salva uma inspeção de alarme
 */
export async function saveAlarmInspection(
  inspection: Omit<AlarmInspection, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Extrai não conformidades
    const nonConformities: string[] = [];
    if (inspection.resultados_json) {
      for (const [category, questions] of Object.entries(inspection.resultados_json)) {
        if (typeof questions === 'object') {
          for (const [question, status] of Object.entries(questions)) {
            if (status === "Não Conforme") {
              nonConformities.push(question);
            }
          }
        } else if (questions === "Não Conforme") {
          nonConformities.push(category);
        }
      }
    }

    const planoDeAcao = generateAlarmActionPlan(nonConformities);

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_alarmes', {
      ...inspection,
      plano_de_acao: planoDeAcao,
    });
    
    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
    }
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.id_sistema, {
        type: 'alarme',
        status: inspection.status_geral,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção de alarme', 'equipment', error);
    return false;
  }
}

/**
 * Busca todos os sistemas de alarme
 */
export async function getAllAlarmSystems(): Promise<AlarmSystem[]> {
  try {
    // Obtém o ID do usuário autenticado
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user?.id) {
      logger.warn('Usuário não autenticado ao buscar sistemas de alarme', 'equipment');
      return [];
    }

    // Busca sistemas de alarme APENAS do usuário autenticado
    const { data, error } = await supabase
      .from('inventario_alarmes')
      .select('*')
      .eq('user_id', user.id)
      .order('id_sistema');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar sistemas de alarme', 'equipment', error);
    return [];
  }
}

