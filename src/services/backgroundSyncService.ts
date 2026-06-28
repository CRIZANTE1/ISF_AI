/**
 * Serviço de Sincronização em Background
 * 
 * Monitora a conexão de rede e sincroniza automaticamente operações pendentes,
 * notificando o usuário sobre o progresso.
 */

import { Capacitor } from '@capacitor/core';
import { App } from '@capacitor/app';
import { logger } from '../utils/logger';
import { syncPendingOperations } from '../utils/offlineSync';
import { getOfflineStats } from '../utils/offlineDB';
import { notificationService } from './notificationService';
import { notifySyncSuccessPositive } from '../utils/suggestionNotificationUtils';
import { checkSupabaseConnection, networkStatusService } from './networkStatusService';

interface PendingOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  table: string;
  data: any;
  timestamp: number;
  retries: number;
  error?: string;
}

interface SyncStatus {
  isRunning: boolean;
  lastSyncTime: number | null;
  lastSyncResult: {
    success: number;
    failed: number;
  } | null;
}

class BackgroundSyncService {
  private isSyncing: boolean = false;
  private status: SyncStatus = {
    isRunning: false,
    lastSyncTime: null,
    lastSyncResult: null,
  };
  private syncCheckInterval: NodeJS.Timeout | null = null;
  private appStateListeners: Array<() => void> = [];

  /**
   * Verifica se há operações pendentes e inicia o serviço se necessário
   */
  async checkAndStartIfNeeded(): Promise<void> {
    // Se já está rodando, não precisa fazer nada
    if (this.status.isRunning) {
      return;
    }

    // Verifica se há operações pendentes
    try {
      const stats = await getOfflineStats();
      if (stats.pendingOperations === 0) {
        logger.debug('Nenhuma operação pendente, serviço não será iniciado', 'background_sync');
        return;
      }

      // Há operações pendentes, inicia o serviço
      logger.info(`Encontradas ${stats.pendingOperations} operação(ões) pendente(s), iniciando serviço`, 'background_sync');
      await this.start();
    } catch (error) {
      logger.error('Erro ao verificar operações pendentes', 'background_sync', error);
    }
  }

  /**
   * Inicia o serviço de sincronização em background
   * Só deve ser chamado quando há operações pendentes
   */
  private async start(): Promise<void> {
    if (this.status.isRunning) {
      logger.warn('Serviço de sincronização já está em execução', 'background_sync');
      return;
    }

    this.status.isRunning = true;
    logger.info('Iniciando serviço de sincronização em background', 'background_sync');

    // Verifica conexão periodicamente (a cada 30 segundos)
    this.syncCheckInterval = setInterval(() => {
      this.checkAndSync();
    }, 30000); // 30 segundos

    // Verifica quando o app volta ao foreground (nativo)
    if (Capacitor.isNativePlatform()) {
      const appStateListener = await App.addListener('appStateChange', async (state) => {
        if (state.isActive) {
          logger.info('App voltou ao foreground, verificando sincronização', 'background_sync');
          await this.checkAndSync();
        }
      });
      this.appStateListeners.push(() => appStateListener.remove());
    }

    // Reage quando a conexão volta (via serviço global de rede)
    let wasOnline = networkStatusService.getState().isOnline;
    const unsubscribeNetwork = networkStatusService.subscribe(({ isOnline }) => {
      if (!wasOnline && isOnline) {
        logger.info('Conexão detectada, verificando sincronização', 'background_sync');
        setTimeout(() => {
          void this.checkAndSync();
        }, 2000);
      }
      wasOnline = isOnline;
    });
    this.appStateListeners.push(unsubscribeNetwork);

    // Verificação inicial
    await this.checkAndSync();
  }

  /**
   * Para o serviço de sincronização
   */
  stop(): void {
    if (!this.status.isRunning) {
      return;
    }

    this.status.isRunning = false;
    logger.info('Parando serviço de sincronização em background', 'background_sync');

    if (this.syncCheckInterval) {
      clearInterval(this.syncCheckInterval);
      this.syncCheckInterval = null;
    }

    // Remove todos os listeners
    this.appStateListeners.forEach(remove => remove());
    this.appStateListeners = [];
  }

  /**
   * Verifica se há operações pendentes e sincroniza se necessário
   * Para o serviço automaticamente quando não há mais pendências
   */
  private async checkAndSync(): Promise<void> {
    // Evita múltiplas sincronizações simultâneas
    if (this.isSyncing) {
      logger.debug('Sincronização já em andamento, ignorando nova verificação', 'background_sync');
      return;
    }

    // Verifica conexão
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      logger.debug('Sem conexão, aguardando...', 'background_sync');
      return;
    }

    // Verifica se há operações pendentes
    try {
      const stats = await getOfflineStats();
      if (stats.pendingOperations === 0) {
        logger.info('Nenhuma operação pendente, parando serviço de sincronização', 'background_sync');
        // Para o serviço quando não há mais pendências
        this.stop();
        return;
      }

      // Inicia sincronização
      await this.performSync(stats.pendingOperations);

      // Após sincronizar, verifica novamente se ainda há pendências
      const statsAfter = await getOfflineStats();
      if (statsAfter.pendingOperations === 0) {
        logger.info('Todas as operações sincronizadas, parando serviço', 'background_sync');
        this.stop();
      }
    } catch (error) {
      logger.error('Erro ao verificar operações pendentes', 'background_sync', error);
    }
  }

  /**
   * Executa a sincronização e notifica o usuário
   */
  private async performSync(pendingCount: number): Promise<{
    success: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    this.isSyncing = true;

    try {
      // Notifica início da sincronização
      await this.notifySyncStart(pendingCount);

      let currentProgress = 0;
      let totalOperations = pendingCount;

      // Executa sincronização com callback de progresso
      const result = await syncPendingOperations((current, total, operation) => {
        currentProgress = current;
        totalOperations = total;

        // Notifica progresso a cada 25% ou a cada 5 operações
        if (current % 5 === 0 || current === Math.floor(total * 0.25) || 
            current === Math.floor(total * 0.5) || current === Math.floor(total * 0.75)) {
          this.notifySyncProgress(current, total, operation).catch(err => {
            logger.error('Erro ao notificar progresso', 'background_sync', err);
          });
        }
      });

      this.status.lastSyncTime = Date.now();
      this.status.lastSyncResult = {
        success: result.success,
        failed: result.failed,
      };

      // Notifica conclusão
      await this.notifySyncComplete(result);

      logger.info(
        `Sincronização concluída: ${result.success} sucesso, ${result.failed} falhas`,
        'background_sync'
      );

      return result;
    } catch (error) {
      logger.error('Erro durante sincronização', 'background_sync', error);
      await this.notifySyncError(error as Error);
      
      // Retorna resultado vazio em caso de erro
      return {
        success: 0,
        failed: pendingCount,
        errors: [{ id: 'sync-error', error: (error as Error).message || 'Erro desconhecido' }]
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Notifica o usuário sobre o início da sincronização
   */
  private async notifySyncStart(pendingCount: number): Promise<void> {
    const permission = await notificationService.checkPermission();
    if (!permission.granted) {
      return; // Sem permissão, não notifica
    }

    await notificationService.showLocalNotification(
      'Sincronização Iniciada',
      `${pendingCount} operação(ões) pendente(s) serão sincronizadas em segundo plano.`,
      {
        tag: 'sync-start',
        actionTypeId: 'SIMPLE_VIEW',
      }
    );
  }

  /**
   * Notifica o usuário sobre o progresso da sincronização
   */
  private async notifySyncProgress(
    current: number,
    total: number,
    operation: PendingOperation
  ): Promise<void> {
    const permission = await notificationService.checkPermission();
    if (!permission.granted) {
      return;
    }

    const percentage = Math.round((current / total) * 100);
    const operationType = operation.type === 'create' ? 'Criando' : 
                         operation.type === 'update' ? 'Atualizando' : 'Removendo';

    await notificationService.showLocalNotification(
      `Sincronizando... ${percentage}%`,
      `${operationType} ${operation.table} (${current}/${total})`,
      {
        tag: 'sync-progress',
        actionTypeId: 'SIMPLE_VIEW',
      }
    );
  }

  /**
   * Notifica o usuário sobre a conclusão da sincronização
   */
  private async notifySyncComplete(result: {
    success: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
  }): Promise<void> {
    const permission = await notificationService.checkPermission();
    if (!permission.granted) {
      return;
    }

    if (result.failed === 0) {
      await notifySyncSuccessPositive();
    } else if (result.success > 0) {
      // Sucesso parcial
      await notificationService.showLocalNotification(
        'Sincronização Parcial',
        `${result.success} sucesso, ${result.failed} falha(s). Toque para ver detalhes.`,
        {
          tag: 'sync-partial',
          actionTypeId: 'SIMPLE_VIEW',
          url: '/inspections',
        }
      );
    } else {
      // Falha total
      await notificationService.showLocalNotification(
        'Sincronização Falhou',
        `${result.failed} operação(ões) falharam. Verifique sua conexão.`,
        {
          tag: 'sync-failed',
          actionTypeId: 'SIMPLE_VIEW',
          url: '/inspections',
        }
      );
    }
  }

  /**
   * Notifica o usuário sobre erro na sincronização
   */
  private async notifySyncError(error: Error): Promise<void> {
    const permission = await notificationService.checkPermission();
    if (!permission.granted) {
      return;
    }

    await notificationService.showLocalNotification(
      'Erro na Sincronização',
      error.message || 'Ocorreu um erro durante a sincronização. Tente novamente mais tarde.',
      {
        tag: 'sync-error',
        actionTypeId: 'SIMPLE_VIEW',
        url: '/inspections',
      }
    );
  }

  /**
   * Força uma sincronização manual
   */
  async forceSync(): Promise<{
    success: number;
    failed: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    if (this.isSyncing) {
      throw new Error('Sincronização já está em andamento');
    }

    const stats = await getOfflineStats();
    if (stats.pendingOperations === 0) {
      return { success: 0, failed: 0, errors: [] };
    }

    return await this.performSync(stats.pendingOperations);
  }

  /**
   * Retorna o status atual da sincronização
   */
  getStatus(): SyncStatus {
    return { ...this.status };
  }

  /**
   * Verifica se está sincronizando
   */
  isSyncingNow(): boolean {
    return this.isSyncing;
  }
}

export const backgroundSyncService = new BackgroundSyncService();

