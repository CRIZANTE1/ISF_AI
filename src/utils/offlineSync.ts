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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

/**
 * Extrai campos únicos de uma tabela baseado nos dados
 * Isso ajuda a verificar se um registro duplicado realmente existe
 */
function extractUniqueFields(table: string, data: any): Array<{ field: string; value: any }> {
  const fields: Array<{ field: string; value: any }> = [];
  
  // Campos comuns que são únicos em várias tabelas
  const commonUniqueFields = ['id', 'numero_identificacao', 'id_equipamento', 'id_sistema', 
    'id_camara', 'id_abrigo', 'id_mangueira', 'numero_serie_equipamento'];
  
  // Verifica campos únicos comuns
  for (const field of commonUniqueFields) {
    if (data[field] !== undefined && data[field] !== null) {
      fields.push({ field, value: data[field] });
    }
  }
  
  // Para tabelas específicas, adiciona campos únicos conhecidos
  if (table.includes('extintor')) {
    if (data.numero_identificacao) {
      fields.push({ field: 'numero_identificacao', value: data.numero_identificacao });
    }
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
    const { type, table, data } = operation;

    // Obtém o ID do usuário autenticado (também valida autenticação)
    const authenticatedUserId = await getAuthenticatedUserId();
    
    // Valida que o user_id nos dados corresponde ao usuário autenticado
    validateUserOwnership(data, authenticatedUserId);

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
            // Verifica se o registro realmente existe antes de considerar sucesso
            // Tenta buscar o registro para confirmar
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
 * Sincroniza todas as operações pendentes
 */
export async function syncPendingOperations(): Promise<{
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
  let success = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

  if (operations.length === 0) {
    return { success: 0, failed: 0, errors: [] };
  }

  logger.info(`Iniciando sincronização de ${operations.length} operação(ões)`, 'sync');

  // Processa operações em sequência para evitar conflitos
  for (const operation of operations) {
    // Pula operações que excederam o limite de tentativas
    if (operation.retries >= MAX_RETRIES) {
      failed++;
      errors.push({
        id: operation.id,
        error: `Máximo de tentativas excedido: ${operation.error || 'Erro desconhecido'}`,
      });
      continue;
    }

    try {
      await executeOperation(operation);
      await removePendingOperation(operation.id);
      success++;
      logger.info(`Operação ${operation.id} sincronizada com sucesso`, 'sync', { 
        type: operation.type, 
        table: operation.table 
      });
    } catch (error: any) {
      const errorMessage = error.message || error.code || 'Erro desconhecido';
      
      // Atualiza contador de tentativas
      const newRetries = operation.retries + 1;
      await updateOperationRetry(
        operation.id,
        newRetries,
        errorMessage
      );

      logger.warn(`Erro ao sincronizar operação ${operation.id} (tentativa ${newRetries}/${MAX_RETRIES})`, 'sync', {
        error: errorMessage,
        type: operation.type,
        table: operation.table
      });

      if (newRetries >= MAX_RETRIES) {
        failed++;
        errors.push({
          id: operation.id,
          error: errorMessage,
        });
      } else {
        // Aguarda antes de tentar novamente (backoff exponencial)
        const delay = RETRY_DELAY * Math.pow(2, newRetries - 1);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  logger.info(`Sincronização concluída: ${success} sucesso, ${failed} falhas`, 'sync');

  return { success, failed, errors };
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

