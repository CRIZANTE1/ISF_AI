/**
 * Sistema de cache offline usando IndexedDB
 * Armazena operações pendentes para sincronização quando online
 */

import { logger } from './logger';

const DB_NAME = 'isfiaOfflineDB';
const DB_VERSION = 1;
const STORE_OPERATIONS = 'pendingOperations';
const STORE_CACHE = 'dataCache';

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
}

interface CacheEntry {
  key: string;
  data: any;
  timestamp: number;
  expiresAt: number;
}

let db: IDBDatabase | null = null;

/**
 * Inicializa o banco de dados IndexedDB
 */
async function initDB(): Promise<IDBDatabase> {
  if (db) return db;

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result;

      // Store para operações pendentes
      if (!database.objectStoreNames.contains(STORE_OPERATIONS)) {
        const operationsStore = database.createObjectStore(STORE_OPERATIONS, {
          keyPath: 'id',
        });
        operationsStore.createIndex('timestamp', 'timestamp', { unique: false });
        operationsStore.createIndex('table', 'table', { unique: false });
      }

      // Store para cache de dados
      if (!database.objectStoreNames.contains(STORE_CACHE)) {
        const cacheStore = database.createObjectStore(STORE_CACHE, {
          keyPath: 'key',
        });
        cacheStore.createIndex('expiresAt', 'expiresAt', { unique: false });
      }
    };
  });
}

/**
 * Gera ID único para operação
 */
function generateOperationId(): string {
  // Usa substring ao invés de substr (deprecated)
  return `op_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
}

/**
 * Salva uma operação pendente
 */
export async function savePendingOperation(
  type: 'create' | 'update' | 'delete',
  table: string,
  data: any
): Promise<string> {
  try {
    const database = await initDB();
    const operation: PendingOperation = {
      id: generateOperationId(),
      type,
      table,
      data,
      timestamp: Date.now(),
      retries: 0,
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_OPERATIONS], 'readwrite');
      const store = transaction.objectStore(STORE_OPERATIONS);
      const request = store.add(operation);

      request.onsuccess = async () => {
        // Inicia o serviço de sincronização se não estiver rodando
        try {
          const { backgroundSyncService } = await import('../services/backgroundSyncService');
          await backgroundSyncService.checkAndStartIfNeeded();
        } catch (error) {
          // Ignora erros ao iniciar serviço (pode não estar disponível ainda)
          logger.debug('Não foi possível iniciar serviço de sincronização', 'storage');
        }
        resolve(operation.id);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Erro ao salvar operação pendente', 'storage', error);
    throw error;
  }
}

/**
 * Obtém todas as operações pendentes
 */
export async function getPendingOperations(): Promise<PendingOperation[]> {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_OPERATIONS], 'readonly');
      const store = transaction.objectStore(STORE_OPERATIONS);
      const request = store.getAll();

      request.onsuccess = () => {
        const operations = request.result as PendingOperation[];
        // Ordena por timestamp (mais antigas primeiro)
        operations.sort((a, b) => a.timestamp - b.timestamp);
        resolve(operations);
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Erro ao obter operações pendentes', 'storage', error);
    return [];
  }
}

/**
 * Remove uma operação pendente (após sincronização bem-sucedida)
 */
export async function removePendingOperation(id: string): Promise<void> {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_OPERATIONS], 'readwrite');
      const store = transaction.objectStore(STORE_OPERATIONS);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Erro ao remover operação pendente', 'storage', error);
  }
}

/**
 * Atualiza contador de tentativas de uma operação
 */
export async function updateOperationRetry(
  id: string,
  retries: number,
  error?: string
): Promise<void> {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_OPERATIONS], 'readwrite');
      const store = transaction.objectStore(STORE_OPERATIONS);
      const request = store.get(id);

      request.onsuccess = () => {
        const operation = request.result as PendingOperation;
        if (operation) {
          operation.retries = retries;
          if (error) {
            operation.error = error;
          }
          store.put(operation);
        }
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Erro ao atualizar tentativa', 'storage', error);
  }
}

/**
 * Salva dados no cache
 */
export async function saveToCache(
  key: string,
  data: any,
  ttl: number = 24 * 60 * 60 * 1000 // 24 horas padrão
): Promise<void> {
  try {
    const database = await initDB();
    const entry: CacheEntry = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: Date.now() + ttl,
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_CACHE], 'readwrite');
      const store = transaction.objectStore(STORE_CACHE);
      const request = store.put(entry);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Erro ao salvar no cache', 'storage', error);
  }
}

/**
 * Obtém dados do cache
 */
export async function getFromCache<T>(key: string): Promise<T | null> {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_CACHE], 'readonly');
      const store = transaction.objectStore(STORE_CACHE);
      const request = store.get(key);

      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        if (entry) {
          // Verifica se expirou
          if (Date.now() > entry.expiresAt) {
            // Remove entrada expirada
            store.delete(key);
            resolve(null);
          } else {
            resolve(entry.data as T);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Erro ao obter do cache', 'storage', error);
    return null;
  }
}

/**
 * Limpa cache expirado
 */
export async function cleanExpiredCache(): Promise<void> {
  try {
    const database = await initDB();

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_CACHE], 'readwrite');
      const store = transaction.objectStore(STORE_CACHE);
      const index = store.index('expiresAt');
      const now = Date.now();

      const request = index.openCursor(IDBKeyRange.upperBound(now));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Erro ao limpar cache', 'storage', error);
  }
}

/**
 * Obtém estatísticas do cache offline
 */
export async function getOfflineStats(): Promise<{
  pendingOperations: number;
  cacheEntries: number;
}> {
  try {
    const operations = await getPendingOperations();

    const database = await initDB();
    let cacheEntries = 0;

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_CACHE], 'readonly');
      const store = transaction.objectStore(STORE_CACHE);
      const request = store.count();

      request.onsuccess = () => {
        cacheEntries = request.result;
        resolve({
          pendingOperations: operations.length,
          cacheEntries,
        });
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Erro ao obter estatísticas', 'storage', error);
    return { pendingOperations: 0, cacheEntries: 0 };
  }
}

/**
 * Limpa operações antigas automaticamente
 * Remove operações com mais de X dias
 */
export async function cleanOldOperations(maxAgeDays: number = 30): Promise<number> {
  try {
    const database = await initDB();
    const maxAge = Date.now() - (maxAgeDays * 24 * 60 * 60 * 1000);
    let cleaned = 0;

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_OPERATIONS], 'readwrite');
      const store = transaction.objectStore(STORE_OPERATIONS);
      const index = store.index('timestamp');
      const request = index.openCursor(IDBKeyRange.upperBound(maxAge));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          cursor.delete();
          cleaned++;
          cursor.continue();
        } else {
          logger.info(`Limpeza automática: ${cleaned} operação(ões) antiga(s) removida(s)`, 'storage');
          resolve(cleaned);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.error('Erro ao limpar operações antigas', 'storage', error);
    return 0;
  }
}

/**
 * Limpa operações que falharam múltiplas vezes
 */
export async function cleanFailedOperations(maxRetries: number = 5): Promise<number> {
  try {
    const operations = await getPendingOperations();
    const failedOperations = operations.filter((op) => op.retries >= maxRetries);
    let cleaned = 0;

    for (const operation of failedOperations) {
      await removePendingOperation(operation.id);
      cleaned++;
    }

    if (cleaned > 0) {
      logger.info(`Limpeza automática: ${cleaned} operação(ões) falhada(s) removida(s)`, 'storage');
    }

    return cleaned;
  } catch (error) {
    logger.error('Erro ao limpar operações falhadas', 'storage', error);
    return 0;
  }
}

