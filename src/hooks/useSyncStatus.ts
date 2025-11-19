/**
 * Hook para gerenciar status de sincronização
 * Retorna informações sobre operações pendentes e status de sincronização
 */

import { useState, useEffect, useCallback } from 'react';
import { getOfflineStats } from '../utils/offlineDB';
import { syncPendingOperations } from '../utils/offlineSync';
import { useOnlineStatus } from './useOnlineStatus';
import { logger } from '../utils/logger';

export interface SyncStatus {
  pendingOperations: number;
  isSyncing: boolean;
  lastSyncResult: {
    success: number;
    failed: number;
  } | null;
  hasError: boolean;
  errorMessage: string | null;
}

export function useSyncStatus(): SyncStatus & {
  sync: () => Promise<void>;
  clearError: () => void;
} {
  const { isOnline } = useOnlineStatus();
  const [pendingOperations, setPendingOperations] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Atualiza estatísticas periodicamente
  useEffect(() => {
    const updateStats = async () => {
      try {
        const stats = await getOfflineStats();
        setPendingOperations(stats.pendingOperations);
      } catch (error) {
        logger.error('Erro ao obter estatísticas de sincronização', 'sync', error);
      }
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  // Sincroniza automaticamente quando volta online
  useEffect(() => {
    if (isOnline && pendingOperations > 0 && !isSyncing) {
      // Aguarda um pouco para garantir que a conexão está estável
      const timer = setTimeout(() => {
        sync();
      }, 1000);
      
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline, pendingOperations]);

  const sync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    setHasError(false);
    setErrorMessage(null);
    setLastSyncResult(null);

    try {
      const result = await syncPendingOperations((current, total, operation) => {
        // Callback de progresso pode ser usado aqui se necessário
        // Por enquanto apenas sincroniza
      });
      setLastSyncResult({
        success: result.success,
        failed: result.failed,
      });

      // Atualiza estatísticas
      const stats = await getOfflineStats();
      setPendingOperations(stats.pendingOperations);

      // Se todas falharam, mostra erro apenas se realmente houver problema de conexão
      if (result.failed > 0 && result.success === 0) {
        // Verifica se é realmente um problema de conexão ou outro erro
        const hasConnectionError = result.errors.some(
          (err) =>
            err.error?.includes('conexão') ||
            err.error?.includes('internet') ||
            err.error?.includes('network') ||
            err.error?.includes('fetch')
        );

        if (hasConnectionError) {
          setHasError(true);
          setErrorMessage('Erro de conexão ao sincronizar. Verifique sua internet.');
        } else {
          // Outros erros (validação, permissão, etc) não são problemas de conexão
          setHasError(true);
          setErrorMessage('Algumas operações falharam. Verifique os dados e tente novamente.');
        }
      } else if (result.failed > 0) {
        // Algumas falharam mas outras tiveram sucesso
        setHasError(false);
        setErrorMessage(null);
      } else {
        // Tudo OK
        setHasError(false);
        setErrorMessage(null);
      }

      // Limpa resultado após 5 segundos
      setTimeout(() => {
        setLastSyncResult(null);
      }, 5000);
    } catch (error: any) {
      logger.error('Erro ao sincronizar', 'sync', error);
      
      const errorMsg = error.message || 'Erro desconhecido ao sincronizar';
      
      // Só mostra erro se for realmente problema de conexão
      if (
        errorMsg.includes('conexão') ||
        errorMsg.includes('internet') ||
        errorMsg.includes('network') ||
        errorMsg.includes('fetch') ||
        errorMsg.includes('Sem conexão')
      ) {
        setHasError(true);
        setErrorMessage('Sem conexão com o servidor. Verifique sua internet.');
      } else {
        // Outros erros (autenticação, etc) não são mostrados como erro de conexão
        setHasError(false);
        setErrorMessage(null);
      }

      // Atualiza estatísticas mesmo em caso de erro
      const stats = await getOfflineStats();
      setPendingOperations(stats.pendingOperations);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  const clearError = useCallback(() => {
    setHasError(false);
    setErrorMessage(null);
    setLastSyncResult(null);
  }, []);

  return {
    pendingOperations,
    isSyncing,
    lastSyncResult,
    hasError,
    errorMessage,
    sync,
    clearError,
  };
}

