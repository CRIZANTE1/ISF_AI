/**
 * Utilitários para operações de detectores multigás
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';

export interface MultigasDetector {
  id?: number;
  id_equipamento: string;
  marca?: string | null;
  modelo?: string | null;
  numero_serie?: string | null;
  data_cadastro?: string | null;
  LEL_cilindro?: number | null;
  O2_cilindro?: number | null;
  H2S_cilindro?: number | null;
  CO_cilindro?: number | null;
  margem_erro_cilindro?: number | null; // Margem de erro em percentual (padrão: 20%)
  created_at?: string;
  user_id?: string | null;
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
 * Mapeia dados do Supabase (minúsculas) para a interface (maiúsculas)
 */
function mapSupabaseToDetector(data: any): MultigasDetector {
  return {
    id: data.id,
    id_equipamento: data.id_equipamento,
    marca: data.marca,
    modelo: data.modelo,
    numero_serie: data.numero_serie,
    data_cadastro: data.data_cadastro,
    LEL_cilindro: data.lel_cilindro ?? data.LEL_cilindro,
    O2_cilindro: data.o2_cilindro ?? data.O2_cilindro,
    H2S_cilindro: data.h2s_cilindro ?? data.H2S_cilindro,
    CO_cilindro: data.co_cilindro ?? data.CO_cilindro,
    margem_erro_cilindro: data.margem_erro_cilindro ?? 20.00, // Valor padrão: 20%
    created_at: data.created_at,
    user_id: data.user_id,
  };
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

    // Mapeia campos da interface (maiúsculas) para o schema do Supabase (minúsculas)
    const detectorData: any = {
      id_equipamento: detector.id_equipamento,
      marca: detector.marca || null,
      modelo: detector.modelo || null,
      numero_serie: detector.numero_serie || null,
      data_cadastro: detector.data_cadastro || null,
      lel_cilindro: detector.LEL_cilindro ?? null,
      o2_cilindro: detector.O2_cilindro ?? null,
      h2s_cilindro: detector.H2S_cilindro ?? null,
      co_cilindro: detector.CO_cilindro ?? null,
      margem_erro_cilindro: detector.margem_erro_cilindro ?? 20.00, // Valor padrão: 20%
      user_id: detector.user_id || null,
    };

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inventario_multigas', detectorData);
    
    if (!result.success) {
      throw new Error('Falha ao salvar detector multigás');
    }
    
    // Log action
    try {
      await logUserAction('create', 'equipment', detector.id_equipamento, {
        type: 'multigas',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar detector multigás', 'equipment', error);
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
    // Mapeia dados do Supabase para a interface
    return (data || []).map(mapSupabaseToDetector);
  } catch (error) {
    logger.error('Erro ao buscar detectores multigás', 'equipment', error);
    return [];
  }
}

/**
 * Busca um detector por ID
 */
export async function getMultigasDetectorById(idEquipamento: string): Promise<MultigasDetector | null> {
  try {
    // Verificar autenticação primeiro
    const { data: { session } } = await supabase.auth.getSession();
    logger.debug('Buscando detector multigas', 'equipment', { idEquipamento, userId: session?.user?.id });
    
    if (!session?.user) {
      logger.warn('Usuário não autenticado ao buscar detector multigas', 'equipment');
      throw new Error('Você precisa estar autenticado para acessar este equipamento.');
    }
    
    const { data, error } = await supabase
      .from('inventario_multigas')
      .select('*')
      .eq('id_equipamento', idEquipamento)
      .maybeSingle();

    if (error) {
      logger.error('Erro Supabase ao buscar detector multigás', 'equipment', {
        error,
        idEquipamento,
        rlsDetails: {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        }
      });
      
      // Se for erro de RLS (permissão negada), explicar melhor
      if (error.code === 'PGRST301' || error.message?.includes('permission') || error.message?.includes('RLS')) {
        throw new Error(`Você não tem permissão para acessar o equipamento '${idEquipamento}'. Verifique se este equipamento pertence à sua conta.`);
      }
      throw error;
    }
    
    if (!data) {
      logger.warn('Detector multigas não encontrado ou sem permissão RLS', 'equipment', {
        idEquipamento,
        userId: session.user.id
      });
      
      // Verificar se o equipamento existe mas pertence a outro usuário
      // IMPORTANTE: Esta query pode falhar também por RLS, mas vamos tentar
      try {
        const { data: allData, error: allError } = await supabase
          .from('inventario_multigas')
          .select('id_equipamento, user_id')
          .eq('id_equipamento', idEquipamento);
        
        if (allError) {
          logger.error('Erro ao verificar equipamento (provavelmente RLS bloqueando)', 'equipment', {
            error: allError,
            idEquipamento
          });
          throw new Error(`O equipamento '${idEquipamento}' existe no banco, mas você não tem permissão para acessá-lo. Este equipamento pertence a outra conta (user_id diferente).`);
        } else if (allData && allData.length === 0) {
          logger.info('Equipamento realmente não existe no banco de dados', 'equipment', { idEquipamento });
          return null;
        } else {
          logger.warn('Equipamento existe mas user_id não corresponde', 'equipment', {
            equipamento_user_id: allData[0]?.user_id,
            usuario_atual: session.user.id,
            corresponde: allData[0]?.user_id === session.user.id
          });
          
          if (allData[0]?.user_id !== session.user.id) {
            throw new Error(`O equipamento '${idEquipamento}' existe, mas pertence a outra conta. Seu user_id: ${session.user.id}, Equipamento user_id: ${allData[0]?.user_id}`);
          }
        }
      } catch (checkError: any) {
        // Se já é um erro customizado, relançá-lo
        if (checkError instanceof Error && checkError.message.includes('permissão')) {
          throw checkError;
        }
        // Se for erro de RLS na verificação, significa que não temos acesso
        logger.error('Erro ao verificar permissão', 'equipment', { error: checkError, idEquipamento });
        throw new Error(`Você não tem permissão para acessar o equipamento '${idEquipamento}'. Verifique se está autenticado com a conta correta.`);
      }
      
      return null;
    }
    
    // Verificar se o user_id corresponde
    if (data.user_id && data.user_id !== session.user.id) {
      logger.error('User ID não corresponde', 'equipment', { 
        equipamento_user_id: data.user_id, 
        usuario_atual: session.user.id 
      });
      throw new Error(`Você não tem permissão para acessar o equipamento '${idEquipamento}'. Este equipamento pertence a outra conta.`);
    }
    
    logger.debug('Detector multigas encontrado', 'equipment', { idEquipamento });
    // Mapeia dados do Supabase para a interface
    return mapSupabaseToDetector(data);
  } catch (error: any) {
    logger.error('Erro ao buscar detector multigás', 'equipment', error);
    // Se já for um Error customizado, relançá-lo
    if (error instanceof Error && (error.message.includes('permissão') || error.message.includes('autenticado'))) {
      throw error;
    }
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
    logger.error('Erro ao buscar valores do cilindro', 'equipment', error);
    return null;
  }
}

/**
 * Atualiza os valores do cilindro
 */
export async function updateCylinderValues(
  idEquipamento: string,
  values: CylinderValues,
  user_id?: string
): Promise<boolean> {
  try {
    // Usa wrapper offline para suportar modo offline
    const { offlineUpdate } = await import('./offlineOperations');
    
    // Primeiro, busca o detector completo para obter o ID e verificar se existe
    const detector = await getMultigasDetectorById(idEquipamento);
    
    if (!detector || !detector.id) {
      logger.warn('Detector não encontrado para atualizar valores do cilindro', 'equipment', { idEquipamento });
      return false;
    }

    // Usa nomes de colunas corretos (minúsculas conforme schema do Supabase)
    const updateData: any = {
      lel_cilindro: values.LEL || null,
      o2_cilindro: values.O2 || null,
      h2s_cilindro: values.H2S || null,
      co_cilindro: values.CO || null,
    };

    // Adiciona user_id se fornecido (para segurança no wrapper offline)
    if (user_id) {
      updateData.user_id = user_id;
    } else if (detector.user_id) {
      // Usa o user_id do detector se não foi fornecido
      updateData.user_id = detector.user_id;
    }

    const result = await offlineUpdate('inventario_multigas', detector.id, updateData);
    
    if (!result.success) {
      logger.error('Falha ao atualizar valores do cilindro via wrapper offline', 'equipment', {
        idEquipamento,
        detectorId: detector.id,
        values
      });
      return false;
    }

    logger.info('Valores do cilindro atualizados com sucesso', 'equipment', { 
      idEquipamento, 
      detectorId: detector.id,
      values 
    });
    return true;
  } catch (error: any) {
    logger.error('Erro ao atualizar valores do cilindro', 'equipment', {
      error: error.message || error,
      errorCode: error.code,
      idEquipamento,
      values
    });
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
    // Mapeia campos da interface (maiúsculas) para o schema do Supabase (minúsculas)
    const inspectionData = {
      id_equipamento: inspection.id_equipamento,
      data_teste: inspection.data_teste || null,
      tipo_teste: inspection.tipo_teste || null,
      resultado_teste: inspection.resultado_teste || null,
      // Mapeia valores de referência (maiúsculas -> minúsculas)
      lel_referencia: inspection.LEL_referencia ?? null,
      o2_referencia: inspection.O2_referencia ?? null,
      h2s_referencia: inspection.H2S_referencia ?? null,
      co_referencia: inspection.CO_referencia ?? null,
      // Mapeia valores encontrados (maiúsculas -> minúsculas)
      lel_encontrado: inspection.LEL_encontrado ?? null,
      o2_encontrado: inspection.O2_encontrado ?? null,
      h2s_encontrado: inspection.H2S_encontrado ?? null,
      co_encontrado: inspection.CO_encontrado ?? null,
      observacoes: inspection.observacoes || null,
      plano_de_acao: inspection.plano_de_acao || null,
      inspetor: inspection.inspetor || null,
      data_proximo_teste: inspection.data_proximo_teste || null,
      user_id: inspection.user_id || null,
    };

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('inspecoes_multigas', inspectionData);
    
    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
    }
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.id_equipamento, {
        type: 'multigas',
        tipo_teste: inspection.tipo_teste,
        resultado: inspection.resultado_teste,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error: any) {
    logger.error('Erro ao salvar inspeção multigás', 'equipment', {
      error: error.message || error,
      errorCode: error.code,
      inspection: {
        id_equipamento: inspection.id_equipamento,
        tipo_teste: inspection.tipo_teste,
      }
    });
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
    logger.error('Erro ao salvar log de ação multigás', 'equipment', error);
    return false;
  }
}

