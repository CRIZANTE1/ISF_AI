/**
 * Sistema de sincronização offline
 * Sincroniza operações pendentes quando a conexão é restaurada
 */

import { supabase } from '../lib/supabase';
import {
  getPendingOperations,
  removePendingOperation,
  updateOperationRetry,
} from './offlineDB';
import { logger } from './logger';
import { offlineOperationSchema, getSchemaForTable, safeValidateData, tableNameSchema } from './validation/schemas';

const MAX_RETRIES = 5; // Aumentado para dar mais chances
const INITIAL_RETRY_DELAY = 1000; // 1 segundo inicial
const MAX_RETRY_DELAY = 30000; // 30 segundos máximo
const BATCH_SIZE = 10; // Processa até 10 operações em paralelo por tabela
const MAX_OPERATION_AGE_DAYS = 30; // Remove operações com mais de 30 dias

/**
 * Extrai campos únicos de uma tabela baseado nos dados
 * Isso ajuda a verificar se um registro duplicado realmente existe
 */
function extractUniqueFields(table: string, data: any): Array<{ field: string; value: any }> {
  const fields: Array<{ field: string; value: any }> = [];
  
  // Campos comuns que são únicos em várias tabelas
  // NOTA: numero_identificacao NÃO é único para extintores, pois permite múltiplas inspeções (histórico)
  const commonUniqueFields = ['id', 'id_equipamento', 'id_sistema', 
    'id_camara', 'id_abrigo', 'id_mangueira', 'numero_serie_equipamento'];
  
  // Verifica campos únicos comuns
  for (const field of commonUniqueFields) {
    if (data[field] !== undefined && data[field] !== null) {
      fields.push({ field, value: data[field] });
    }
  }
  
  // Para tabelas específicas, adiciona campos únicos conhecidos
  // Extintores permitem múltiplas inspeções com o mesmo numero_identificacao
  // A unicidade deve ser baseada em (numero_identificacao + data_servico + user_id) se necessário
  // Por enquanto, não adicionamos campos únicos para extintores para permitir histórico de inspeções
  if (table.includes('extintor')) {
    // Não adiciona numero_identificacao como único, pois permite múltiplas inspeções
    // Se houver constraint única na tabela, ela deve ser composta (ex: numero_identificacao + data_servico)
  }
  
  return fields;
}

/**
 * Verifica se há conexão real com o Supabase
 */
async function checkSupabaseConnection(): Promise<boolean> {
  if (!navigator.onLine) return false;
  
  try {
    // Primeiro verifica se consegue fazer uma requisição HTTP simples
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) return false;
    
    // Tenta fazer uma requisição HEAD para verificar se o servidor está acessível
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2 segundos
    
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'HEAD',
        headers: {
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY || '',
        },
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      
      // Qualquer resposta (mesmo erro HTTP) significa que há conexão
      return true;
    } catch (fetchError: any) {
      clearTimeout(timeoutId);
      
      // Se for erro de abort (timeout) ou rede, não há conexão
      if (fetchError.name === 'AbortError' || 
          fetchError.message?.includes('fetch') ||
          fetchError.message?.includes('network') ||
          fetchError.message?.includes('Failed to fetch')) {
        return false;
      }
      
      // Outros erros podem significar que há conexão mas há outro problema
      // Nesse caso, tenta uma query simples ao Supabase
      try {
        const { error } = await supabase
          .from('profiles')
          .select('id')
          .limit(1);
        
        // Se não houver erro de rede, considera conectado
        // Erros de autenticação/permissão não significam falta de conexão
        return error === null || (!error.message?.includes('fetch') && !error.message?.includes('network'));
      } catch (queryError) {
        return false;
      }
    }
  } catch (error) {
    return false;
  }
}

/**
 * Verifica se o usuário está autenticado
 */
async function checkAuthentication(): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  } catch (error) {
    return false;
  }
}

/**
 * Obtém o ID do usuário autenticado
 * @throws {Error} Se o usuário não estiver autenticado
 */
async function getAuthenticatedUserId(): Promise<string> {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      throw new Error('Erro ao verificar autenticação');
    }
    
    if (!session || !session.user) {
      throw new Error('Usuário não autenticado');
    }
    
    return session.user.id;
  } catch (error: any) {
    logger.error('Erro ao obter ID do usuário autenticado', 'sync', error);
    throw new Error('Usuário não autenticado. Faça login novamente.');
  }
}

/**
 * Valida que o user_id nos dados corresponde ao usuário autenticado
 * @param data Dados da operação que podem conter user_id
 * @param authenticatedUserId ID do usuário autenticado
 * @throws {Error} Se o user_id não corresponder ao usuário autenticado
 */
function validateUserOwnership(data: any, authenticatedUserId: string): void {
  // Se os dados contêm user_id, deve corresponder ao usuário autenticado
  if (data.user_id !== undefined && data.user_id !== null) {
    if (data.user_id !== authenticatedUserId) {
      logger.error('Tentativa de acesso não autorizado detectada', 'security', {
        dataUserId: data.user_id,
        authenticatedUserId,
      });
      throw new Error('Acesso negado: os dados não pertencem ao usuário autenticado');
    }
  }
}

/**
 * Executa uma operação pendente
 */
async function executeOperation(operation: any): Promise<boolean> {
  try {
    // Valida estrutura da operação
    const operationValidation = safeValidateData(offlineOperationSchema, operation);
    if (!operationValidation.success) {
      logger.error('Operação offline inválida', 'sync', { error: operationValidation.error, operation });
      throw new Error(`Operação inválida: ${operationValidation.error}`);
    }

    const { type, table, data } = operation;

    // Valida nome da tabela
    const tableValidation = tableNameSchema.safeParse(table);
    if (!tableValidation.success) {
      logger.error('Nome de tabela inválido', 'sync', { table, error: tableValidation.error });
      throw new Error(`Tabela inválida: ${table}`);
    }

    // Obtém o ID do usuário autenticado (também valida autenticação)
    const authenticatedUserId = await getAuthenticatedUserId();
    
    // Valida que o user_id nos dados corresponde ao usuário autenticado
    validateUserOwnership(data, authenticatedUserId);

    // Valida dados com schema específico da tabela
    const schema = getSchemaForTable(table);
    if (schema) {
      const dataValidation = safeValidateData(schema, data);
      if (!dataValidation.success) {
        logger.error('Dados da operação inválidos', 'sync', { 
          table, 
          error: dataValidation.error,
          data: JSON.stringify(data).substring(0, 200) // Log apenas primeiros 200 chars
        });
        throw new Error(`Dados inválidos para tabela ${table}: ${dataValidation.error}`);
      }
    }

    switch (type) {
      case 'create': {
        // Garante que o user_id está definido e correto para operações create
        const dataWithUserId = {
          ...data,
          user_id: authenticatedUserId,
        };
        
        const { data: result, error } = await supabase
          .from(table)
          .insert(dataWithUserId)
          .select();
        
        if (error) {
          // Trata erros específicos
          if (error.code === '23505') { // Violação de constraint única
            // Para extintores, permite múltiplas inspeções (histórico)
            // Se houver erro 23505 para extintores sem campos únicos identificados,
            // pode ser uma constraint única no banco que precisa ser ajustada
            if (table.includes('extintor')) {
              // Para extintores, verifica se é realmente uma duplicata baseada em (numero_identificacao + data_servico + user_id)
              const uniqueFields = extractUniqueFields(table, data);
              if (uniqueFields.length === 0) {
                // Não há campos únicos identificados, mas houve erro de constraint
                // Verifica se já existe registro com mesmo numero_identificacao + data_servico + user_id
                if (data.numero_identificacao && data.data_servico) {
                  try {
                    const { data: existing, error: checkError } = await supabase
                      .from(table)
                      .select('id')
                      .eq('numero_identificacao', data.numero_identificacao)
                      .eq('data_servico', data.data_servico)
                      .eq('user_id', authenticatedUserId)
                      .limit(1);
                    
                    if (!checkError && existing && existing.length > 0) {
                      logger.warn(`Inspeção de extintor já existe para esta data, removendo da fila`, 'sync', {
                        table,
                        numero_identificacao: data.numero_identificacao,
                        data_servico: data.data_servico
                      });
                      return true; // Considera sucesso pois a inspeção já existe
                    }
                  } catch (checkErr) {
                    logger.warn('Erro ao verificar inspeção duplicada de extintor', 'sync', checkErr);
                  }
                }
                // Se não conseguiu verificar, propaga o erro para que o usuário veja a mensagem real
                logger.error(`Erro de constraint única na tabela ${table} para extintor`, 'sync', {
                  error: error.message,
                  data: { numero_identificacao: data.numero_identificacao, data_servico: data.data_servico }
                });
                throw error; // Propaga o erro para tratamento adequado
              }
            }
            
            // Para outras tabelas ou quando há campos únicos identificados
            const uniqueFields = extractUniqueFields(table, data);
            if (uniqueFields.length > 0) {
              try {
                let checkQuery = supabase.from(table).select('id').limit(1);
                uniqueFields.forEach(({ field, value }) => {
                  checkQuery = checkQuery.eq(field, value);
                });
                
                // Sempre adiciona filtro user_id para segurança
                checkQuery = checkQuery.eq('user_id', authenticatedUserId);
                
                const { data: existing, error: checkError } = await checkQuery;
                
                if (!checkError && existing && existing.length > 0) {
                  logger.warn(`Registro duplicado na tabela ${table} já existe, removendo da fila`, 'sync', {
                    table,
                    fields: uniqueFields
                  });
                  return true; // Considera sucesso pois o registro já existe
                }
              } catch (checkErr) {
                logger.warn('Erro ao verificar registro duplicado', 'sync', checkErr);
                // Continua e trata como erro de duplicata
              }
            }
            // Se não conseguiu verificar ou não encontrou, trata como erro
            // Mas ainda remove da fila para evitar loops infinitos
            logger.warn(`Registro duplicado na tabela ${table}, mas não foi possível verificar existência`, 'sync', {
              error: error.message
            });
            return true; // Remove da fila mesmo assim para evitar loops
          }
          throw error;
        }
        
        // Verifica se realmente inseriu
        if (!result || result.length === 0) {
          throw new Error('Insert não retornou dados');
        }
        
        return true;
      }
      case 'update': {
        const { id, user_id, ...updateData } = data;
        
        // Constrói query com filtros apropriados
        // Sempre adiciona filtro user_id para garantir que só atualiza dados do usuário autenticado
        let query = supabase
          .from(table)
          .update(updateData)
          .eq('id', id)
          .eq('user_id', authenticatedUserId);
        
        const { data: result, error } = await query.select();
        
        if (error) throw error;
        
        // Verifica se realmente atualizou
        if (!result || result.length === 0) {
          throw new Error('Update não afetou nenhum registro. Registro pode não existir ou não pertencer ao usuário.');
        }
        
        return true;
      }
      case 'delete': {
        const { id, user_id } = data;
        
        // Constrói query com filtros apropriados
        // Sempre adiciona filtro user_id para garantir que só deleta dados do usuário autenticado
        let query = supabase
          .from(table)
          .delete()
          .eq('id', id)
          .eq('user_id', authenticatedUserId);
        
        const { error } = await query;
        
        if (error) throw error;
        
        return true;
      }
      default:
        throw new Error(`Tipo de operação desconhecido: ${type}`);
    }
  } catch (error: any) {
    throw error;
  }
}

/**
 * Calcula delay de retry com backoff exponencial adaptativo
 * Considera o tipo de erro para ajustar o delay
 */
function calculateRetryDelay(retryCount: number, error: any): number {
  const baseDelay = INITIAL_RETRY_DELAY * Math.pow(2, retryCount - 1);
  
  // Ajusta delay baseado no tipo de erro
  let multiplier = 1;
  if (error?.message?.includes('timeout') || error?.message?.includes('network')) {
    multiplier = 1.5; // Erros de rede: delay maior
  } else if (error?.code === '23505') {
    multiplier = 0.5; // Duplicatas: delay menor (pode ser resolvido rapidamente)
  }
  
  const delay = Math.min(baseDelay * multiplier, MAX_RETRY_DELAY);
  return Math.max(delay, INITIAL_RETRY_DELAY); // Mínimo de 1 segundo
}

/**
 * Verifica se um erro é recuperável (deve tentar novamente)
 */
function isRecoverableError(error: any): boolean {
  if (!error) return false;
  
  const errorMessage = error.message || '';
  const errorCode = error.code || '';
  
  // Erros recuperáveis: rede, timeout, conexão
  const recoverablePatterns = [
    'fetch',
    'network',
    'timeout',
    'Failed to fetch',
    'connection',
    'ECONNREFUSED',
    'ETIMEDOUT',
    'PGRST301', // PostgREST connection error
  ];
  
  // Erros não recuperáveis: validação, permissão, constraint (exceto duplicatas)
  const nonRecoverablePatterns = [
    'permission denied',
    'unauthorized',
    'invalid',
    'validation',
  ];
  
  // Se for erro de duplicata, pode ser recuperável (registro pode ter sido criado)
  if (errorCode === '23505') {
    return true;
  }
  
  // Se contém padrão não recuperável, não é recuperável
  if (nonRecoverablePatterns.some(pattern => 
    errorMessage.toLowerCase().includes(pattern)
  )) {
    return false;
  }
  
  // Se contém padrão recuperável, é recuperável
  return recoverablePatterns.some(pattern => 
    errorMessage.includes(pattern) || errorCode.includes(pattern)
  );
}

/**
 * Agrupa operações por tabela e tipo para processamento em lote
 */
function groupOperationsByTable(operations: any[]): Map<string, any[]> {
  const grouped = new Map<string, any[]>();
  
  for (const op of operations) {
    const key = `${op.table}_${op.type}`;
    if (!grouped.has(key)) {
      grouped.set(key, []);
    }
    grouped.get(key)!.push(op);
  }
  
  return grouped;
}

/**
 * Processa um lote de operações em paralelo
 */
async function processBatch(
  batch: any[],
  totalOperations: number,
  offset: number,
  onProgress?: (current: number, total: number, operation: any) => void
): Promise<{ success: number; failed: number; errors: Array<{ id: string; error: string }> }> {
  let success = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];
  
  // Processa operações em paralelo (até BATCH_SIZE por vez)
  for (let i = 0; i < batch.length; i += BATCH_SIZE) {
    const chunk = batch.slice(i, i + BATCH_SIZE);
    
    // Executa chunk em paralelo
    const results = await Promise.allSettled(
      chunk.map(async (operation, chunkIndex) => {
        if (onProgress) {
          onProgress(offset + i + chunkIndex + 1, totalOperations, operation);
        }
        
        try {
          await executeOperation(operation);
          await removePendingOperation(operation.id);
          return { success: true, id: operation.id };
        } catch (error: any) {
          const errorMessage = error.message || error.code || 'Erro desconhecido';
          const newRetries = operation.retries + 1;
          
          // Verifica se é erro recuperável
          if (isRecoverableError(error) && newRetries < MAX_RETRIES) {
            await updateOperationRetry(operation.id, newRetries, errorMessage);
            return { success: false, id: operation.id, error: errorMessage, retry: true };
          } else {
            // Erro não recuperável ou excedeu tentativas
            if (newRetries >= MAX_RETRIES) {
              await removePendingOperation(operation.id); // Remove após muitas tentativas
            } else {
              await updateOperationRetry(operation.id, newRetries, errorMessage);
            }
            return { success: false, id: operation.id, error: errorMessage, retry: false };
          }
        }
      })
    );
    
    // Processa resultados
    for (const result of results) {
      if (result.status === 'fulfilled') {
        if (result.value.success) {
          success++;
        } else {
          if (!result.value.retry) {
            failed++;
            errors.push({
              id: result.value.id,
              error: result.value.error,
            });
          }
        }
      } else {
        failed++;
        errors.push({
          id: 'unknown',
          error: result.reason?.message || 'Erro desconhecido',
        });
      }
    }
  }
  
  return { success, failed, errors };
}

/**
 * Sincroniza todas as operações pendentes com suporte a progresso
 */
export async function syncPendingOperations(
  onProgress?: (current: number, total: number, operation: any) => void
): Promise<{
  success: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}> {
  // Verifica autenticação primeiro (mais rápido)
  const isAuthenticated = await checkAuthentication();
  if (!isAuthenticated) {
    throw new Error('Usuário não autenticado. Faça login para sincronizar.');
  }

  // Verifica conexão real com Supabase
  const isConnected = await checkSupabaseConnection();
  if (!isConnected) {
    throw new Error('Sem conexão com o servidor. Verifique sua internet.');
  }

  const operations = await getPendingOperations();
  let totalSuccess = 0;
  let totalFailed = 0;
  const allErrors: Array<{ id: string; error: string }> = [];

  if (operations.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }

  logger.info(`Iniciando sincronização otimizada de ${operations.length} operação(ões)`, 'sync');

  // Remove operações muito antigas antes de sincronizar
  const maxAge = Date.now() - (MAX_OPERATION_AGE_DAYS * 24 * 60 * 60 * 1000);
  const validOperations = operations.filter(op => op.timestamp > maxAge);
  const removedOld = operations.length - validOperations.length;
  
  if (removedOld > 0) {
    logger.info(`Removendo ${removedOld} operação(ões) antiga(s) (>${MAX_OPERATION_AGE_DAYS} dias)`, 'sync');
    for (const oldOp of operations.filter(op => op.timestamp <= maxAge)) {
      await removePendingOperation(oldOp.id);
    }
  }

  // Filtra operações que excederam tentativas
  const operationsToSync = validOperations.filter(op => op.retries < MAX_RETRIES);
  const skippedFailed = validOperations.length - operationsToSync.length;
  
  if (skippedFailed > 0) {
    totalFailed += skippedFailed;
    for (const failedOp of validOperations.filter(op => op.retries >= MAX_RETRIES)) {
      allErrors.push({
        id: failedOp.id,
        error: `Máximo de tentativas excedido: ${failedOp.error || 'Erro desconhecido'}`,
      });
    }
  }

  if (operationsToSync.length === 0) {
    logger.info(`Nenhuma operação válida para sincronizar`, 'sync');
    return { success: totalSuccess, failed: totalFailed, errors: allErrors };
  }

  // Agrupa operações por tabela e tipo para processamento otimizado
  const grouped = groupOperationsByTable(operationsToSync);
  const totalToSync = operationsToSync.length;
  let processedCount = 0;
  
  // Processa cada grupo (tabela+tipo) em sequência, mas operações dentro do grupo em paralelo
  for (const [key, groupOps] of grouped) {
    const [table, type] = key.split('_');
    logger.info(`Sincronizando ${groupOps.length} operação(ões) de ${type} na tabela ${table}`, 'sync');
    
    // Ordena por timestamp (mais antigas primeiro) e prioridade
    groupOps.sort((a, b) => {
      // Prioriza operações de inspeção (mais críticas)
      const aPriority = a.table.includes('inspecao') ? 0 : 1;
      const bPriority = b.table.includes('inspecao') ? 0 : 1;
      if (aPriority !== bPriority) return aPriority - bPriority;
      return a.timestamp - b.timestamp;
    });
    
    const batchResult = await processBatch(groupOps, totalToSync, processedCount, onProgress);
    processedCount += groupOps.length;
    totalSuccess += batchResult.success;
    totalFailed += batchResult.failed;
    allErrors.push(...batchResult.errors);
    
    // Pequeno delay entre grupos para não sobrecarregar o servidor
    if (grouped.size > 1) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  logger.info(`Sincronização concluída: ${totalSuccess} sucesso, ${totalFailed} falhas`, 'sync');

  return { success: totalSuccess, failed: totalFailed, errors: allErrors };
}

/**
 * Verifica se há operações pendentes
 */
export async function hasPendingOperations(): Promise<boolean> {
  const operations = await getPendingOperations();
  return operations.length > 0;
}

/**
 * Limpa operações que falharam múltiplas vezes
 */
export async function cleanFailedOperations(): Promise<number> {
  const operations = await getPendingOperations();
  const failedOperations = operations.filter((op) => op.retries >= MAX_RETRIES);
  let cleaned = 0;

  for (const operation of failedOperations) {
    await removePendingOperation(operation.id);
    cleaned++;
  }

  return cleaned;
}

