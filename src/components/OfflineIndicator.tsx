/**
 * Componente indicador de status offline
 */

import { useEffect, useState, useCallback } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { getOfflineStats, cleanExpiredCache } from '../utils/offlineDB';
import { syncPendingOperations } from '../utils/offlineSync';
import { WifiOff, Wifi, RefreshCw, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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

    try {
      const result = await syncPendingOperations();
      setSyncResult(result);

      // Atualiza estatísticas
      const newStats = await getOfflineStats();
      setStats(newStats);

      // Limpa resultado após 3 segundos
      setTimeout(() => setSyncResult(null), 3000);
    } catch (error) {
      console.error('Erro ao sincronizar:', error);
    } finally {
      setIsSyncing(false);
    }
  }, [isOnline, isSyncing]);

  // Sincroniza automaticamente quando volta online
  useEffect(() => {
    if (wasOffline && isOnline && stats.pendingOperations > 0) {
      handleSync();
    }
  }, [wasOffline, isOnline, stats.pendingOperations, handleSync]);

  // Limpa cache expirado periodicamente
  useEffect(() => {
    const cleanCache = async () => {
      await cleanExpiredCache();
    };

    cleanCache();
    const interval = setInterval(cleanCache, 60 * 60 * 1000); // A cada hora

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
            <div>
              <p className="text-sm font-semibold text-white">
                {isOnline
                  ? `Sincronizando ${stats.pendingOperations} operação(ões) pendente(s)`
                  : 'Modo Offline'}
              </p>
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
                  <RefreshCw size={16} className="text-white animate-spin" />
                  <span className="text-xs text-white">Sincronizando...</span>
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
                <Wifi size={16} className="text-white" />
              )}
              <p className="text-xs text-white">
                {syncResult.success > 0 && `${syncResult.success} sincronizada(s)`}
                {syncResult.success > 0 && syncResult.failed > 0 && ' • '}
                {syncResult.failed > 0 && `${syncResult.failed} falharam`}
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};

export default OfflineIndicator;

