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

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 segundo

/**
 * Executa uma operação pendente
 */
async function executeOperation(operation: any): Promise<boolean> {
  try {
    const { type, table, data } = operation;

    switch (type) {
      case 'create': {
        const { error } = await supabase.from(table).insert(data);
        if (error) throw error;
        return true;
      }
      case 'update': {
        const { id, ...updateData } = data;
        const { error } = await supabase
          .from(table)
          .update(updateData)
          .eq('id', id);
        if (error) throw error;
        return true;
      }
      case 'delete': {
        const { error } = await supabase
          .from(table)
          .delete()
          .eq('id', data.id);
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
  const operations = await getPendingOperations();
  let success = 0;
  let failed = 0;
  const errors: Array<{ id: string; error: string }> = [];

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
    } catch (error: any) {
      // Atualiza contador de tentativas
      const newRetries = operation.retries + 1;
      await updateOperationRetry(
        operation.id,
        newRetries,
        error.message || 'Erro desconhecido'
      );

      if (newRetries >= MAX_RETRIES) {
        failed++;
        errors.push({
          id: operation.id,
          error: error.message || 'Erro desconhecido',
        });
      } else {
        // Aguarda antes de tentar novamente
        await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY * newRetries));
      }
    }
  }

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

