/**
 * Wrappers para operações que funcionam offline
 * Salva operações localmente quando offline e sincroniza quando online
 */

import { supabase } from '../lib/supabase';
import { savePendingOperation } from './offlineDB';
import { syncPendingOperations } from './offlineSync';
import { logger } from './logger';

/**
 * Verifica se está online (navegador)
 */
function isNavigatorOnline(): boolean {
  return navigator.onLine;
}

/**
 * Verifica conexão real com Supabase
 */
async function isSupabaseOnline(): Promise<boolean> {
  if (!navigator.onLine) return false;
  
  try {
    // Tenta fazer uma query simples para verificar conexão real
    const { error } = await supabase.from('profiles').select('id').limit(1);
    // Se não houver erro de rede, considera conectado
    return error === null || (!error.message?.includes('fetch') && !error.message?.includes('network'));
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
    logger.error('Erro ao obter ID do usuário autenticado', 'storage', error);
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
 * Wrapper para operações de criação
 */
export async function offlineInsert(
  table: string,
  data: any
): Promise<{ success: boolean; offlineId?: string }> {
  try {
    // Obtém o ID do usuário autenticado e valida
    const authenticatedUserId = await getAuthenticatedUserId();
    validateUserOwnership(data, authenticatedUserId);
    
    // Garante que o user_id está definido e correto
    const dataWithUserId = {
      ...data,
      user_id: authenticatedUserId,
    };
    
    const isOnline = await isSupabaseOnline();
    
    if (isOnline) {
      // Tenta inserir diretamente
      const { error, data: result } = await supabase.from(table).insert(dataWithUserId).select();

      if (error) {
        // Erros que devem ser salvos offline:
        // - Erros de rede (fetch, network)
        // - Timeout
        // - Erros de conexão
        const shouldSaveOffline = 
          error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          error.message?.includes('Failed to fetch') ||
          error.code === 'PGRST301'; // PostgREST connection error
        
        if (shouldSaveOffline) {
          logger.warn('Erro de conexão ao inserir, salvando offline', 'storage', error);
          const offlineId = await savePendingOperation('create', table, dataWithUserId);
          return { success: true, offlineId };
        }
        
        // Outros erros (validação, constraint, etc) devem ser lançados
        throw error;
      }

      // Verifica se realmente inseriu
      if (!result || result.length === 0) {
        throw new Error('Insert não retornou dados');
      }

      return { success: true };
    } else {
      // Salva como operação pendente (com user_id garantido)
      const offlineId = await savePendingOperation('create', table, dataWithUserId);
      logger.info('Operação salva offline (sem conexão)', 'storage', { table, offlineId });
      return { success: true, offlineId };
    }
  } catch (error: any) {
    // Se falhar online com erro de rede, tenta salvar offline como fallback
    const isOnline = await isSupabaseOnline();
    if (isOnline) {
      const isNetworkError = 
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Failed to fetch');
      
      if (isNetworkError) {
        try {
          // Garante que o user_id está definido antes de salvar offline
          const dataWithUserId = {
            ...data,
            user_id: await getAuthenticatedUserId(),
          };
          const offlineId = await savePendingOperation('create', table, dataWithUserId);
          logger.warn('Erro de rede ao inserir, salvando offline', 'storage', error);
          return { success: true, offlineId };
        } catch (offlineError) {
          logger.error('Erro ao salvar operação offline', 'storage', offlineError);
          throw error; // Lança o erro original
        }
      }
    }
    throw error;
  }
}

/**
 * Wrapper para operações de atualização
 */
export async function offlineUpdate(
  table: string,
  id: string | number,
  data: any
): Promise<{ success: boolean; offlineId?: string }> {
  try {
    // Obtém o ID do usuário autenticado e valida
    const authenticatedUserId = await getAuthenticatedUserId();
    validateUserOwnership(data, authenticatedUserId);
    
    const isOnline = await isSupabaseOnline();
    
    if (isOnline) {
      // Remove user_id dos dados de atualização (não deve ser atualizado)
      const { user_id, ...updateData } = data;
      
      // Sempre adiciona filtro user_id para garantir que só atualiza dados do usuário autenticado
      let query = supabase
        .from(table)
        .update(updateData)
        .eq('id', id)
        .eq('user_id', authenticatedUserId);
      
      const { error, data: result } = await query.select();

      if (error) {
        const shouldSaveOffline = 
          error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          error.message?.includes('Failed to fetch') ||
          error.code === 'PGRST301';
        
        if (shouldSaveOffline) {
          logger.warn('Erro de conexão ao atualizar, salvando offline', 'storage', error);
          // Garante que o user_id está presente nos dados salvos
          const operationData = {
            id,
            ...data,
            user_id: authenticatedUserId,
          };
          const offlineId = await savePendingOperation('update', table, operationData);
          return { success: true, offlineId };
        }
        
        throw error;
      }

      // Verifica se realmente atualizou
      if (!result || result.length === 0) {
        throw new Error('Update não afetou nenhum registro');
      }

      return { success: true };
    } else {
      // Salva como operação pendente (garante que user_id está presente)
      const operationData = {
        id,
        ...data,
        user_id: authenticatedUserId,
      };
      const offlineId = await savePendingOperation('update', table, operationData);
      logger.info('Operação de update salva offline', 'storage', { table, offlineId });
      return { success: true, offlineId };
    }
  } catch (error: any) {
    const isOnline = await isSupabaseOnline();
    if (isOnline) {
      const isNetworkError = 
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Failed to fetch');
      
      if (isNetworkError) {
        try {
          // Garante que o user_id está presente antes de salvar offline
          const authenticatedUserId = await getAuthenticatedUserId();
          const operationData = {
            id,
            ...data,
            user_id: authenticatedUserId,
          };
          const offlineId = await savePendingOperation('update', table, operationData);
          logger.warn('Erro de rede ao atualizar, salvando offline', 'storage', error);
          return { success: true, offlineId };
        } catch (offlineError) {
          logger.error('Erro ao salvar operação offline', 'storage', offlineError);
          throw error;
        }
      }
    }
    throw error;
  }
}

/**
 * Wrapper para operações de exclusão
 */
export async function offlineDelete(
  table: string,
  id: string | number,
  user_id?: string
): Promise<{ success: boolean; offlineId?: string }> {
  try {
    // Obtém o ID do usuário autenticado
    const authenticatedUserId = await getAuthenticatedUserId();
    
    // Valida que o user_id fornecido corresponde ao usuário autenticado
    if (user_id && user_id !== authenticatedUserId) {
      logger.error('Tentativa de acesso não autorizado detectada', 'security', {
        providedUserId: user_id,
        authenticatedUserId,
      });
      throw new Error('Acesso negado: os dados não pertencem ao usuário autenticado');
    }
    
    const isOnline = await isSupabaseOnline();
    
    if (isOnline) {
      // Sempre adiciona filtro user_id para garantir que só deleta dados do usuário autenticado
      let query = supabase
        .from(table)
        .delete()
        .eq('id', id)
        .eq('user_id', authenticatedUserId);
      
      const { error } = await query;

      if (error) {
        const shouldSaveOffline = 
          error.message?.includes('fetch') ||
          error.message?.includes('network') ||
          error.message?.includes('timeout') ||
          error.message?.includes('Failed to fetch') ||
          error.code === 'PGRST301';
        
        if (shouldSaveOffline) {
          logger.warn('Erro de conexão ao deletar, salvando offline', 'storage', error);
          const offlineId = await savePendingOperation('delete', table, { id, user_id: authenticatedUserId });
          return { success: true, offlineId };
        }
        
        throw error;
      }

      return { success: true };
    } else {
      // Salva como operação pendente (garante que user_id está presente)
      const offlineId = await savePendingOperation('delete', table, { id, user_id: authenticatedUserId });
      logger.info('Operação de delete salva offline', 'storage', { table, offlineId });
      return { success: true, offlineId };
    }
  } catch (error: any) {
    const isOnline = await isSupabaseOnline();
    if (isOnline) {
      const isNetworkError = 
        error.message?.includes('fetch') ||
        error.message?.includes('network') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Failed to fetch');
      
      if (isNetworkError) {
        try {
          // Garante que o user_id está presente antes de salvar offline
          const authenticatedUserId = await getAuthenticatedUserId();
          const offlineId = await savePendingOperation('delete', table, { id, user_id: authenticatedUserId });
          logger.warn('Erro de rede ao deletar, salvando offline', 'storage', error);
          return { success: true, offlineId };
        } catch (offlineError) {
          logger.error('Erro ao salvar operação offline', 'storage', offlineError);
          throw error;
        }
      }
    }
    throw error;
  }
}

/**
 * Sincroniza operações pendentes (chamado automaticamente quando volta online)
 */
export async function syncWhenOnline(): Promise<void> {
  const isOnline = await isSupabaseOnline();
  if (isOnline) {
    try {
      await syncPendingOperations();
    } catch (error) {
      logger.error('Erro ao sincronizar', 'storage', error);
      throw error;
    }
  }
}

