/**
 * Hook para detectar status online/offline
 * Verifica tanto o status do navegador quanto a conexão real com Supabase
 * Usa @capacitor/network quando disponível no Android/iOS
 */

import { useState, useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean; // Se estava offline e agora está online
}

/**
 * Verifica se o plugin de rede está disponível
 */
async function getNetworkStatus(): Promise<boolean> {
  // No Android/iOS, tenta usar o plugin do Capacitor
  if (Capacitor.isNativePlatform()) {
    try {
      const Capacitor = (window as any).Capacitor;
      if (Capacitor && Capacitor.Plugins && Capacitor.Plugins.Network) {
        const Network = Capacitor.Plugins.Network;
        const status = await Network.getStatus();
        return status.connected;
      }
    } catch (error) {
      logger.debug('Plugin de rede não disponível, usando fallback', 'online_status');
    }
  }

  // Fallback para web ou quando plugin não disponível
  return typeof navigator !== 'undefined' ? navigator.onLine : false;
}

/**
 * Verifica conexão real com Supabase
 */
export async function checkSupabaseConnection(): Promise<boolean> {
  // Verifica primeiro o status básico de rede
  const networkOnline = await getNetworkStatus();
  if (!networkOnline) return false;
  
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
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    let mounted = true;
    let networkListener: any = null;

    const checkConnection = async () => {
      const networkOnline = await getNetworkStatus();
      const supabaseOnline = await checkSupabaseConnection();
      const actuallyOnline = networkOnline && supabaseOnline;
      
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

    // Configura listener de rede (nativo ou web)
    if (Capacitor.isNativePlatform()) {
      // Tenta usar plugin do Capacitor no Android/iOS
      try {
        const Capacitor = (window as any).Capacitor;
        if (Capacitor && Capacitor.Plugins && Capacitor.Plugins.Network) {
          const Network = Capacitor.Plugins.Network;
          networkListener = Network.addListener('networkStatusChange', async (status: any) => {
            if (status.connected) {
              await handleOnline();
            } else {
              handleOffline();
            }
          });
        }
      } catch (error) {
        logger.debug('Erro ao configurar listener de rede nativo', 'online_status');
      }
    }

    // Fallback para web usando eventos nativos
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);
    }

    // Verifica periodicamente (útil para conexões instáveis)
    const checkInterval = setInterval(() => {
      checkConnection();
    }, 10000); // Verifica a cada 10 segundos

    return () => {
      mounted = false;
      if (networkListener) {
        networkListener.remove();
      }
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      }
      clearInterval(checkInterval);
    };
  }, [isOnline]);

  return { isOnline, wasOffline };
}

