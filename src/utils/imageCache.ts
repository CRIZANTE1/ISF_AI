/**
 * Cache de imagens comprimidas usando IndexedDB
 */

import { logger } from './logger';

interface CachedImage {
  key: string;
  blob: Blob;
  timestamp: number;
  originalSize: number;
  compressedSize: number;
}

const DB_NAME = 'imageCompressionCache';
const DB_VERSION = 1;
const STORE_NAME = 'compressedImages';
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 dias

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
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'key' });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
    };
  });
}

/**
 * Gera uma chave única para a imagem baseada no hash do arquivo
 */
async function generateKey(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return `${hashHex}_${file.size}_${file.lastModified}`;
}

/**
 * Obtém uma imagem comprimida do cache
 */
export async function getCachedImage(file: File): Promise<Blob | null> {
  try {
    const database = await initDB();
    const key = await generateKey(file);

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(key);

      request.onsuccess = () => {
        const cached = request.result as CachedImage | undefined;
        if (cached) {
          // Verifica se o cache ainda é válido
          const age = Date.now() - cached.timestamp;
          if (age < CACHE_DURATION) {
            resolve(cached.blob);
          } else {
            // Cache expirado, remove e retorna null
            deleteCachedImage(key);
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.warn('Erro ao acessar cache de imagens', 'storage', error);
    return null;
  }
}

/**
 * Salva uma imagem comprimida no cache
 */
export async function cacheImage(
  file: File,
  compressedBlob: Blob
): Promise<void> {
  try {
    const database = await initDB();
    const key = await generateKey(file);

    const cached: CachedImage = {
      key,
      blob: compressedBlob,
      timestamp: Date.now(),
      originalSize: file.size,
      compressedSize: compressedBlob.size,
    };

    return new Promise((resolve, reject) => {
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(cached);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.warn('Erro ao salvar no cache de imagens', 'storage', error);
    // Não falha se o cache não funcionar
  }
}

/**
 * Remove uma imagem do cache
 */
async function deleteCachedImage(key: string): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    store.delete(key);
  } catch (error) {
    logger.warn('Erro ao remover do cache', 'storage', error);
  }
}

/**
 * Limpa o cache expirado
 */
export async function cleanExpiredCache(): Promise<void> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const request = index.openCursor();
      const keysToDelete: string[] = [];

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const cached = cursor.value as CachedImage;
          if (now - cached.timestamp > CACHE_DURATION) {
            keysToDelete.push(cached.key);
          }
          cursor.continue();
        } else {
          // Remove todos os itens expirados
          keysToDelete.forEach(key => store.delete(key));
          resolve();
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.warn('Erro ao limpar cache', 'storage', error);
  }
}

/**
 * Obtém estatísticas do cache
 */
export async function getCacheStats(): Promise<{
  totalItems: number;
  totalSize: number;
  expiredItems: number;
}> {
  try {
    const database = await initDB();
    const transaction = database.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const now = Date.now();

    return new Promise((resolve, reject) => {
      const request = index.openCursor();
      let totalItems = 0;
      let totalSize = 0;
      let expiredItems = 0;

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest<IDBCursorWithValue>).result;
        if (cursor) {
          const cached = cursor.value as CachedImage;
          totalItems++;
          totalSize += cached.compressedSize;
          if (now - cached.timestamp > CACHE_DURATION) {
            expiredItems++;
          }
          cursor.continue();
        } else {
          resolve({ totalItems, totalSize, expiredItems });
        }
      };

      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    logger.warn('Erro ao obter estatísticas do cache', 'storage', error);
    return { totalItems: 0, totalSize: 0, expiredItems: 0 };
  }
}

