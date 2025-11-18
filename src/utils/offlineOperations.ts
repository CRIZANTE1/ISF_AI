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
 * Wrapper para operações de criação
 */
export async function offlineInsert(
  table: string,
  data: any
): Promise<{ success: boolean; offlineId?: string }> {
  try {
    const isOnline = await isSupabaseOnline();
    
    if (isOnline) {
      // Tenta inserir diretamente
      const { error, data: result } = await supabase.from(table).insert(data).select();

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
          const offlineId = await savePendingOperation('create', table, data);
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
      // Salva como operação pendente
      const offlineId = await savePendingOperation('create', table, data);
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
          const offlineId = await savePendingOperation('create', table, data);
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
    const isOnline = await isSupabaseOnline();
    
    if (isOnline) {
      // Preserva user_id se existir nos dados para segurança
      const { user_id, ...updateData } = data;
      let query = supabase.from(table).update(updateData).eq('id', id);
      
      // Adiciona filtro user_id se existir
      if (user_id) {
        query = query.eq('user_id', user_id);
      }
      
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
          const offlineId = await savePendingOperation('update', table, { id, ...data });
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
      // Salva como operação pendente (preserva user_id)
      const offlineId = await savePendingOperation('update', table, { id, ...data });
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
          const offlineId = await savePendingOperation('update', table, { id, ...data });
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
    const isOnline = await isSupabaseOnline();
    
    if (isOnline) {
      let query = supabase.from(table).delete().eq('id', id);
      
      // Adiciona filtro user_id se fornecido (segurança)
      if (user_id) {
        query = query.eq('user_id', user_id);
      }
      
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
          const offlineId = await savePendingOperation('delete', table, { id, user_id });
          return { success: true, offlineId };
        }
        
        throw error;
      }

      return { success: true };
    } else {
      // Salva como operação pendente (preserva user_id se fornecido)
      const offlineId = await savePendingOperation('delete', table, { id, user_id });
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
          const offlineId = await savePendingOperation('delete', table, { id, user_id });
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

