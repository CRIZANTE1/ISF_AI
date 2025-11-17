/**
 * Wrappers para operações que funcionam offline
 * Salva operações localmente quando offline e sincroniza quando online
 */

import { supabase } from '../lib/supabase';
import { savePendingOperation } from './offlineDB';
import { syncPendingOperations } from './offlineSync';
import { logger } from './logger';

/**
 * Verifica se está online
 */
function isOnline(): boolean {
  return navigator.onLine;
}

/**
 * Wrapper para operações de criação
 */
export async function offlineInsert(
  table: string,
  data: any
): Promise<{ success: boolean; offlineId?: string }> {
  try {
    if (isOnline()) {
      // Tenta inserir diretamente
      const { error, data: result } = await supabase.from(table).insert(data).select();

      if (error) {
        // Se falhar e estiver online, pode ser erro de validação
        throw error;
      }

      return { success: true };
    } else {
      // Salva como operação pendente
      const offlineId = await savePendingOperation('create', table, data);
      return { success: true, offlineId };
    }
  } catch (error: any) {
    // Se falhar online, tenta salvar offline como fallback
    if (isOnline()) {
      try {
        const offlineId = await savePendingOperation('create', table, data);
        return { success: true, offlineId };
      } catch (offlineError) {
        logger.error('Erro ao salvar operação offline', 'storage', offlineError);
        throw error; // Lança o erro original
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
    if (isOnline()) {
      const { error } = await supabase.from(table).update(data).eq('id', id);

      if (error) throw error;

      return { success: true };
    } else {
      // Salva como operação pendente
      const offlineId = await savePendingOperation('update', table, { id, ...data });
      return { success: true, offlineId };
    }
  } catch (error: any) {
    // Se falhar online, tenta salvar offline como fallback
    if (isOnline()) {
      try {
        const offlineId = await savePendingOperation('update', table, { id, ...data });
        return { success: true, offlineId };
      } catch (offlineError) {
        logger.error('Erro ao salvar operação offline', 'storage', offlineError);
        throw error;
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
  id: string | number
): Promise<{ success: boolean; offlineId?: string }> {
  try {
    if (isOnline()) {
      const { error } = await supabase.from(table).delete().eq('id', id);

      if (error) throw error;

      return { success: true };
    } else {
      // Salva como operação pendente
      const offlineId = await savePendingOperation('delete', table, { id });
      return { success: true, offlineId };
    }
  } catch (error: any) {
    // Se falhar online, tenta salvar offline como fallback
    if (isOnline()) {
      try {
        const offlineId = await savePendingOperation('delete', table, { id });
        return { success: true, offlineId };
      } catch (offlineError) {
        logger.error('Erro ao salvar operação offline', 'storage', offlineError);
        throw error;
      }
    }
    throw error;
  }
}

/**
 * Sincroniza operações pendentes (chamado automaticamente quando volta online)
 */
export async function syncWhenOnline(): Promise<void> {
  if (isOnline()) {
    try {
      await syncPendingOperations();
    } catch (error) {
      logger.error('Erro ao sincronizar', 'storage', error);
    }
  }
}

