/**
 * Hook para detectar status online/offline
 * Verifica tanto o status do navegador quanto a conexão real com Supabase
 */

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean; // Se estava offline e agora está online
}

/**
 * Verifica conexão real com Supabase
 */
async function checkSupabaseConnection(): Promise<boolean> {
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

export function useOnlineStatus(): OnlineStatus {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    let mounted = true;

    const checkConnection = async () => {
      const navigatorOnline = navigator.onLine;
      const supabaseOnline = await checkSupabaseConnection();
      const actuallyOnline = navigatorOnline && supabaseOnline;
      
      if (mounted) {
        if (!isOnline && actuallyOnline) {
          setWasOffline(true);
          // Reseta após um tempo para evitar múltiplas sincronizações
          setTimeout(() => {
            if (mounted) setWasOffline(false);
          }, 2000);
        }
        setIsOnline(actuallyOnline);
      }
    };

    const handleOnline = async () => {
      // Aguarda um pouco para garantir que a conexão está estável
      await new Promise(resolve => setTimeout(resolve, 500));
      await checkConnection();
    };

    const handleOffline = () => {
      if (mounted) {
        setIsOnline(false);
        setWasOffline(false);
      }
    };

    // Verificação inicial
    checkConnection();

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Verifica periodicamente (útil para conexões instáveis)
    const checkInterval = setInterval(() => {
      checkConnection();
    }, 10000); // Verifica a cada 10 segundos

    return () => {
      mounted = false;
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(checkInterval);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}

