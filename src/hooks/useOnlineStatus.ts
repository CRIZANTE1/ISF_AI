/**
 * Hook para detectar status online/offline
 */

import { useState, useEffect } from 'react';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean; // Se estava offline e agora está online
}

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      if (!isOnline) {
        setWasOffline(true);
        // Reseta após um tempo para evitar múltiplas sincronizações
        setTimeout(() => setWasOffline(false), 1000);
      }
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setWasOffline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verifica periodicamente (útil para conexões instáveis)
    const checkInterval = setInterval(() => {
      const currentStatus = navigator.onLine;
      if (currentStatus !== isOnline) {
        if (currentStatus) {
          handleOnline();
        } else {
          handleOffline();
        }
      }
    }, 5000); // Verifica a cada 5 segundos

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}

