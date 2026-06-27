/**
 * Serviço global de status de rede.
 * Registra um único listener nativo (@capacitor/network) e compartilha
 * o estado entre todos os consumidores (hooks, componentes, sync).
 */

import { Capacitor } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';
import { Network } from '@capacitor/network';
import { supabase } from '../lib/supabase';
import { logger } from '../utils/logger';

export interface OnlineStatus {
  isOnline: boolean;
  wasOffline: boolean;
}

type StatusListener = (status: OnlineStatus) => void;

async function getNetworkStatus(): Promise<boolean> {
  if (Capacitor.isNativePlatform()) {
    try {
      const status = await Network.getStatus();
      return status.connected;
    } catch {
      logger.debug('Plugin de rede não disponível, usando fallback', 'online_status');
    }
  }

  return typeof navigator !== 'undefined' ? navigator.onLine : false;
}

export async function checkSupabaseConnection(): Promise<boolean> {
  const networkOnline = await getNetworkStatus();
  if (!networkOnline) return false;

  try {
    const { error } = await supabase.from('profiles').select('id').limit(1);
    return error === null || (!error.message?.includes('fetch') && !error.message?.includes('network'));
  } catch {
    return false;
  }
}

class NetworkStatusService {
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : false;
  private wasOffline = false;
  private subscribers = new Set<StatusListener>();
  private started = false;
  private networkListener: PluginListenerHandle | null = null;
  private checkInterval: ReturnType<typeof setInterval> | null = null;
  private wasOfflineTimer: ReturnType<typeof setTimeout> | null = null;
  private handleOnlineBound: (() => void) | null = null;
  private handleOfflineBound: (() => void) | null = null;

  getState(): OnlineStatus {
    return { isOnline: this.isOnline, wasOffline: this.wasOffline };
  }

  subscribe(listener: StatusListener): () => void {
    this.subscribers.add(listener);
    listener(this.getState());
    return () => this.subscribers.delete(listener);
  }

  private notify(): void {
    const state = this.getState();
    this.subscribers.forEach((listener) => listener(state));
  }

  private setOnlineStatus(actuallyOnline: boolean): void {
    const previousOnline = this.isOnline;

    if (!previousOnline && actuallyOnline) {
      this.wasOffline = true;
      if (this.wasOfflineTimer) clearTimeout(this.wasOfflineTimer);
      this.wasOfflineTimer = setTimeout(() => {
        this.wasOffline = false;
        this.notify();
      }, 2000);
    }

    if (!actuallyOnline) {
      this.wasOffline = false;
      if (this.wasOfflineTimer) {
        clearTimeout(this.wasOfflineTimer);
        this.wasOfflineTimer = null;
      }
    }

    this.isOnline = actuallyOnline;
    this.notify();
  }

  private async checkConnection(): Promise<void> {
    const networkOnline = await getNetworkStatus();
    if (!networkOnline) {
      this.setOnlineStatus(false);
      return;
    }

    const supabaseOnline = await checkSupabaseConnection();
    this.setOnlineStatus(supabaseOnline);
  }

  async start(): Promise<void> {
    if (this.started) return;
    this.started = true;

    const handleOnline = async () => {
      await new Promise((resolve) => setTimeout(resolve, 500));
      await this.checkConnection();
    };

    const handleOffline = () => {
      this.setOnlineStatus(false);
    };

    this.handleOnlineBound = () => void handleOnline();
    this.handleOfflineBound = handleOffline;

    await this.checkConnection();

    if (Capacitor.isNativePlatform()) {
      try {
        this.networkListener = await Network.addListener('networkStatusChange', (status) => {
          if (status.connected) {
            void handleOnline();
          } else {
            handleOffline();
          }
        });
      } catch (error) {
        logger.debug('Erro ao configurar listener de rede nativo', 'online_status', error);
      }
    }

    if (typeof window !== 'undefined' && this.handleOnlineBound && this.handleOfflineBound) {
      window.addEventListener('online', this.handleOnlineBound);
      window.addEventListener('offline', this.handleOfflineBound);
    }

    this.checkInterval = setInterval(() => {
      void this.checkConnection();
    }, 10000);
  }

  stop(): void {
    if (!this.started) return;
    this.started = false;

    if (this.networkListener) {
      void this.networkListener.remove();
      this.networkListener = null;
    }

    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }

    if (typeof window !== 'undefined' && this.handleOnlineBound && this.handleOfflineBound) {
      window.removeEventListener('online', this.handleOnlineBound);
      window.removeEventListener('offline', this.handleOfflineBound);
    }

    if (this.wasOfflineTimer) {
      clearTimeout(this.wasOfflineTimer);
      this.wasOfflineTimer = null;
    }

    this.handleOnlineBound = null;
    this.handleOfflineBound = null;
  }
}

export const networkStatusService = new NetworkStatusService();
