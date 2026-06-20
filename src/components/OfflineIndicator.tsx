/**
 * Componente indicador de status offline
 */

import { useEffect, useState, useCallback } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getOfflineStats, cleanExpiredCache, cleanOldOperations, cleanFailedOperations } from '../utils/offlineDB';
import { syncPendingOperations } from '../utils/offlineSync';
import { WifiOff, Wifi, RefreshCw, AlertCircle, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { IconSkeleton, ButtonSkeleton } from './skeletons';
import { logger } from '../utils/logger';

interface OfflineStats {
  pendingOperations: number;
  cacheEntries: number;
}

const OfflineIndicator = () => {
  const { isOnline, wasOffline } = useOnlineStatus();
  const [stats, setStats] = useState<OfflineStats>({
    pendingOperations: 0,
    cacheEntries: 0,
  });
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState<{
    current: number;
    total: number;
    currentOperation: string | null;
  } | null>(null);
  const [syncResult, setSyncResult] = useState<{
    success: number;
    failed: number;
  } | null>(null);

  // Atualiza estatísticas periodicamente
  useEffect(() => {
    const updateStats = async () => {
      const currentStats = await getOfflineStats();
      setStats(currentStats);
    };

    updateStats();
    const interval = setInterval(updateStats, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleSync = useCallback(async () => {
    if (!isOnline || isSyncing) return;

    setIsSyncing(true);
    setSyncResult(null);
    setSyncProgress(null);

    try {
      const result = await syncPendingOperations((current, total, operation) => {
        // Atualiza progresso em tempo real
        setSyncProgress({
          current,
          total,
          currentOperation: `${operation.type} em ${operation.table}`,
        });
      });

      setSyncResult(result);
      setSyncProgress(null);

      // Atualiza estatísticas
      const newStats = await getOfflineStats();
      setStats(newStats);

      // Limpa resultado após 5 segundos (mais tempo para ler)
      setTimeout(() => setSyncResult(null), 5000);
    } catch (error: any) {
      logger.error('Erro ao sincronizar', 'storage', error);
      setSyncProgress(null);
      // Mostra erro ao usuário
      setSyncResult({
        success: 0,
        failed: stats.pendingOperations,
      });
      setTimeout(() => setSyncResult(null), 5000);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing, stats.pendingOperations]);

  // Sincroniza automaticamente quando volta online
  useEffect(() => {
    if (wasOffline && isOnline && stats.pendingOperations > 0) {
      handleSync();
    }
  }, [wasOffline, isOnline, stats.pendingOperations, handleSync]);

  // Limpa cache expirado e operações antigas periodicamente
  useEffect(() => {
    const performCleanup = async () => {
      await cleanExpiredCache();
      await cleanOldOperations(30); // Remove operações com mais de 30 dias
      await cleanFailedOperations(5); // Remove operações que falharam 5+ vezes
      
      // Atualiza estatísticas após limpeza
      const newStats = await getOfflineStats();
      setStats(newStats);
    };

    performCleanup();
    const interval = setInterval(performCleanup, 60 * 60 * 1000); // A cada hora

    return () => clearInterval(interval);
  }, []);

  // Não mostra nada se estiver online e não houver operações pendentes
  if (isOnline && stats.pendingOperations === 0) {
    return null;
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: -100, opacity: 0 }}
        className="fixed top-0 left-0 right-0 z-50"
        style={{ zIndex: 9999 }}
      >
        <div
          className={`px-4 py-3 flex items-center justify-between ${
            isOnline
              ? 'bg-yellow-500/90 dark:bg-yellow-600/90'
              : 'bg-red-500/90 dark:bg-red-600/90'
          } backdrop-blur-sm border-b`}
          style={{
            backgroundColor: isOnline
              ? 'rgba(234, 179, 8, 0.95)'
              : 'rgba(239, 68, 68, 0.95)',
          }}
        >
          <div className="flex items-center gap-3">
            {isOnline ? (
              <Wifi size={20} className="text-white" />
            ) : (
              <WifiOff size={20} className="text-white" />
            )}
            <div className="flex-1">
              <p className="text-sm font-semibold text-white">
                {isOnline
                  ? isSyncing && syncProgress
                    ? `Sincronizando ${syncProgress.current}/${syncProgress.total}...`
                    : `Sincronizando ${stats.pendingOperations} operação(ões) pendente(s)`
                  : 'Modo Offline'}
              </p>
              {isSyncing && syncProgress && (
                <div className="mt-1">
                  <div className="w-full bg-white/20 rounded-full h-1.5 mb-1">
                    <motion.div
                      className="bg-white h-1.5 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${(syncProgress.current / syncProgress.total) * 100}%` }}
                      transition={{ duration: 0.3 }}
                    />
                  </div>
                  {syncProgress.currentOperation && (
                    <p className="text-xs text-white/80 truncate">
                      {syncProgress.currentOperation}
                    </p>
                  )}
                </div>
              )}
              {!isOnline && stats.pendingOperations > 0 && (
                <p className="text-xs text-white/80">
                  {stats.pendingOperations} operação(ões) aguardando sincronização
                </p>
              )}
            </div>
          </div>

          {isOnline && stats.pendingOperations > 0 && (
            <button
              onClick={handleSync}
              disabled={isSyncing}
              className="flex items-center gap-2 px-3 py-1.5 bg-white/20 hover:bg-white/30 rounded-lg transition-colors disabled:opacity-50"
            >
              {isSyncing ? (
                <>
                  <IconSkeleton className="h-4 w-4 rounded-full" />
                  <ButtonSkeleton width="w-24" className="bg-white/20" />
                </>
              ) : (
                <>
                  <RefreshCw size={16} className="text-white" />
                  <span className="text-xs text-white">Sincronizar</span>
                </>
              )}
            </button>
          )}
        </div>

        {/* Resultado da sincronização */}
        {syncResult && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`px-4 py-2 ${
              syncResult.failed > 0
                ? 'bg-red-500/90'
                : 'bg-green-500/90'
            }`}
          >
            <div className="flex items-center gap-2">
              {syncResult.failed > 0 ? (
                <AlertCircle size={16} className="text-white" />
              ) : (
                <CheckCircle2 size={16} className="text-white" />
              )}
              <p className="text-xs text-white">
                {syncResult.success > 0 && `${syncResult.success} sincronizada(s) com sucesso`}
                {syncResult.success > 0 && syncResult.failed > 0 && ' • '}
                {syncResult.failed > 0 && `${syncResult.failed} falharam`}
                {syncResult.success === 0 && syncResult.failed > 0 && 'Todas as operações falharam. Verifique sua conexão e tente novamente.'}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineIndicator;

