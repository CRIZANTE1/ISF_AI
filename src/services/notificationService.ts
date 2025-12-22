import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';

// Importação dinâmica dos plugins para evitar erros se não estiverem instalados
let LocalNotifications: any = null;
let PushNotifications: any = null;

// Carrega os plugins dinamicamente
async function loadNotificationPlugins() {
  if (LocalNotifications !== null) return; // Já carregado
  
  try {
    if (Capacitor.isNativePlatform()) {
      const localNotificationsModule = await import('@capacitor/local-notifications').catch(() => null);
      if (localNotificationsModule) {
        LocalNotifications = localNotificationsModule.LocalNotifications;
      }
      
      const pushNotificationsModule = await import('@capacitor/push-notifications').catch(() => null);
      if (pushNotificationsModule) {
        PushNotifications = pushNotificationsModule.PushNotifications;
      }
    }
  } catch (error) {
    logger.warn('Plugins de notificação não disponíveis', 'notifications', error);
  }
}

// Callback para navegação - será definido pela aplicação
let navigationCallback: ((url: string) => void) | null = null;

/**
 * Define o callback de navegação para ser usado nas notificações
 * Deve ser chamado no ponto de entrada da aplicação com o navigate do React Router
 */
export function setNotificationNavigationCallback(callback: (url: string) => void) {
  navigationCallback = callback;
}

/**
 * Navega para uma URL usando o callback definido ou fallback para window.location
 */
function navigateToUrl(url: string) {
  if (navigationCallback) {
    try {
      navigationCallback(url);
      return;
    } catch (error) {
      logger.error('Erro ao navegar via callback', 'notifications', error);
    }
  }
  
  // Fallback: usar window.location apenas se callback não estiver disponível
  logger.warn('Navegação via window.location (callback não configurado)', 'notifications');
  window.location.href = url;
}

export interface NotificationPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

class NotificationService {
  private _isNative: boolean | null = null;
  private _actionTypesRegistered: boolean = false;

  constructor() {
    // Carrega os plugins automaticamente quando o serviço é criado
    if (Capacitor.isNativePlatform()) {
      loadNotificationPlugins().catch((error) => {
        logger.warn('Erro ao carregar plugins de notificação na inicialização', 'notifications', error);
      });
    }
  }

  /**
   * Verifica se está rodando em plataforma nativa
   */
  private async isNative(): Promise<boolean> {
    if (this._isNative !== null) return this._isNative;
    this._isNative = Capacitor.isNativePlatform();
    return this._isNative;
  }

  /**
   * Verifica se as notificações são suportadas
   */
  isSupported(): boolean {
    // No Android/iOS nativo, sempre suportado se o plugin estiver instalado
    if (Capacitor.isNativePlatform()) {
      return true;
    }
    // Para web, verifica se a API de notificações está disponível
    return 'Notification' in window;
  }

  /**
   * Solicita permissão para notificações
   */
  async requestPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return { granted: false, denied: false, prompt: false };
    }

    const native = await this.isNative();
    if (native) {
      // Carrega os plugins se ainda não foram carregados
      await loadNotificationPlugins();
      
      // Para plataformas nativas (Android/iOS) - tenta usar LocalNotifications primeiro
      try {
        if (LocalNotifications) {
          const result = await LocalNotifications.requestPermissions();
          logger.info('Permissão solicitada via LocalNotifications', 'notifications', result);
          return {
            granted: result.display === 'granted',
            denied: result.display === 'denied',
            prompt: result.display === 'prompt',
          };
        }
        // Fallback para PushNotifications se LocalNotifications não estiver disponível
        if (PushNotifications) {
          const result = await PushNotifications.requestPermissions();
          logger.info('Permissão solicitada via PushNotifications', 'notifications', result);
          return {
            granted: result.receive === 'granted',
            denied: result.receive === 'denied',
            prompt: result.receive === 'prompt',
          };
        }
      } catch (error) {
        logger.error('Erro ao solicitar permissão de notificações nativas', 'notifications', error);
        // Fallback para web
      }
    }
    
    // Para web (ou fallback se plugin não instalado)
    try {
      if ('Notification' in window && typeof Notification !== 'undefined') {
        const permission = await Notification.requestPermission();
        logger.info('Permissão solicitada via API web', 'notifications', { permission });
        return {
          granted: permission === 'granted',
          denied: permission === 'denied',
          prompt: permission === 'default',
        };
      }
    } catch (error) {
      logger.error('Erro ao solicitar permissão de notificações', 'notifications', error);
    }
    return { granted: false, denied: false, prompt: false };
  }

  /**
   * Verifica o status atual da permissão
   */
  async checkPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return { granted: false, denied: false, prompt: false };
    }

    const native = await this.isNative();
    if (native) {
      // Carrega os plugins se ainda não foram carregados
      await loadNotificationPlugins();
      
      // Para plataformas nativas (Android/iOS) - tenta usar LocalNotifications primeiro
      try {
        if (LocalNotifications) {
          const result = await LocalNotifications.checkPermissions();
          logger.debug('Permissão verificada via LocalNotifications', 'notifications', result);
          return {
            granted: result.display === 'granted',
            denied: result.display === 'denied',
            prompt: result.display === 'prompt',
          };
        }
        // Fallback para PushNotifications se LocalNotifications não estiver disponível
        if (PushNotifications) {
          const result = await PushNotifications.checkPermissions();
          logger.debug('Permissão verificada via PushNotifications', 'notifications', result);
          return {
            granted: result.receive === 'granted',
            denied: result.receive === 'denied',
            prompt: result.receive === 'prompt',
          };
        }
      } catch (error) {
        logger.error('Erro ao verificar permissão de notificações nativas', 'notifications', error);
        // Fallback para web
      }
    }
    
    // Para web (ou fallback se plugin não instalado)
    if ('Notification' in window && typeof Notification !== 'undefined') {
      if (Notification.permission === 'granted') {
        return { granted: true, denied: false, prompt: false };
      } else if (Notification.permission === 'denied') {
        return { granted: false, denied: true, prompt: false };
      } else {
        return { granted: false, denied: false, prompt: true };
      }
    }
    return { granted: false, denied: false, prompt: false };
  }

  /**
   * Registra o dispositivo para receber notificações push
   */
  async register(): Promise<void> {
    const native = await this.isNative();
    if (!native || !this.isSupported()) {
      return;
    }

    try {
      await loadNotificationPlugins();
      if (PushNotifications) {
        await PushNotifications.register();
        logger.info('Dispositivo registrado para notificações push', 'notifications');
      }
    } catch (error) {
      logger.error('Erro ao registrar notificações', 'notifications', error);
    }
  }

  /**
   * Registra os tipos de ação (botões) para notificações no Android/iOS
   */
  async registerActionTypes(): Promise<void> {
    const native = await this.isNative();
    if (!native) return;

    // Evita registrar múltiplas vezes
    if (this._actionTypesRegistered) {
      logger.info('Tipos de ação já registrados', 'notifications');
      return;
    }

    try {
      await loadNotificationPlugins();
      if (LocalNotifications) {
        
        await LocalNotifications.registerActionTypes({
          types: [
            {
              id: 'EQUIPMENT_EXPIRATION',
              actions: [
                {
                  id: 'view',
                  title: 'Ver Equipamento',
                  foreground: true
                },
                {
                  id: 'remind_tomorrow',
                  title: 'Lembrar Amanhã',
                  foreground: false
                }
              ]
            },
            {
              id: 'SIMPLE_VIEW',
              actions: [
                {
                  id: 'view',
                  title: 'Visualizar',
                  foreground: true
                }
              ]
            }
          ]
        });
        
        // Captura referência ao this para usar no listener
        const self = this;
        
        // Configura listener para cliques em botões de ação
        LocalNotifications.addListener('localNotificationActionPerformed', (action: any) => {
          logger.info('Ação de notificação local detectada', 'notifications', { action });
          
          if (action.actionId === 'view') {
            const url = action.notification.extra?.url;
            if (url) navigateToUrl(url);
          } else if (action.actionId === 'remind_tomorrow') {
            // Reagenda para amanhã
            const { title, body, extra } = action.notification;
            self.scheduleNotification(
              title, 
              body, 
              new Date(Date.now() + 24 * 60 * 60 * 1000), 
              extra
            );
          } else {
            // Clique padrão na notificação (não em botão específico)
            const url = action.notification.extra?.url;
            if (url) navigateToUrl(url);
          }
        });

        this._actionTypesRegistered = true;
        logger.info('Tipos de ação registrados com sucesso', 'notifications');
      }
    } catch (error) {
      logger.error('Erro ao registrar tipos de ação', 'notifications', error);
    }
  }

  /**
   * Agenda uma notificação para uma data específica
   */
  async scheduleNotification(title: string, body: string, date: Date, data?: any): Promise<void> {
    if (!this.isSupported()) return;

    const native = await this.isNative();
    if (native) {
      try {
        await loadNotificationPlugins();
        if (LocalNotifications) {
          await LocalNotifications.schedule({
            notifications: [{
              title,
              body,
              id: (data?.id || Date.now()) % 2147483647,
              schedule: { at: date },
              sound: 'default',
              actionTypeId: data?.actionTypeId || 'EQUIPMENT_EXPIRATION',
              extra: data || {},
              iconColor: '#FC3D39',
            }]
          });
          return;
        }
      } catch (error) {
        logger.error('Erro ao agendar notificação', 'notifications', error);
      }
    }
    
    // Fallback web (não suporta agendamento futuro offline de forma nativa, apenas via Timeout se o app estiver aberto)
    const delay = date.getTime() - Date.now();
    if (delay > 0 && delay < 2147483647) {
      setTimeout(() => this.showWebNotification(title, body, data), delay);
    }
  }

  /**
   * Envia uma notificação local (funciona em background)
   */
  async showLocalNotification(title: string, body: string, data?: any): Promise<void> {
    if (!this.isSupported()) {
      logger.warn('Notificações não são suportadas neste dispositivo', 'notifications');
      return;
    }

    const permission = await this.checkPermission();
    if (!permission.granted) {
      logger.warn('Permissão de notificações não concedida', 'notifications');
      return;
    }

    const native = await this.isNative();
    if (native) {
      // Para plataformas nativas, use notificações locais do Capacitor (funciona em background)
      try {
        await loadNotificationPlugins();
        if (LocalNotifications) {
          // Agenda notificação imediata
          await LocalNotifications.schedule({
            notifications: [{
              title,
              body,
              id: Date.now() % 2147483647,
              schedule: { at: new Date(Date.now() + 100) },
              sound: 'default',
              actionTypeId: data?.actionTypeId || 'SIMPLE_VIEW',
              extra: data || {},
              iconColor: '#FC3D39',
            }]
          });
          
          logger.info('Notificação local disparada', 'notifications', { title, body });
          return;
        }
      } catch (error) {
        logger.error('Erro ao enviar notificação local', 'notifications', error);
      }
    }
    
    // Fallback para web
    this.showWebNotification(title, body, data);
  }

  /**
   * Mostra notificação usando a API do navegador
   */
  private showWebNotification(title: string, body: string, data?: any): void {
    if ('Notification' in window && Notification.permission === 'granted') {
      const notification = new Notification(title, {
        body,
        icon: '/icon-192x192.png', // Ajuste o caminho do ícone conforme necessário
        badge: '/icon-192x192.png',
        tag: data?.tag || 'isfia-notification',
        data: data,
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
        if (data?.url) {
          navigateToUrl(data.url);
        }
      };

      // Fecha automaticamente após 5 segundos
      setTimeout(() => {
        notification.close();
      }, 5000);
    }
  }

  /**
   * Configura listeners para notificações push (apenas nativo)
   */
  async setupPushListeners(): Promise<void> {
    const native = await this.isNative();
    if (!native) {
      return;
    }

    try {
      await loadNotificationPlugins();
      if (PushNotifications) {
        // Quando o dispositivo recebe uma notificação
        PushNotifications.addListener('pushNotificationReceived', (notification: any) => {
          logger.info('Notificação recebida', 'notifications', { notification });
          // Você pode adicionar lógica aqui para mostrar a notificação na UI
        });

        // Quando o usuário toca na notificação
        PushNotifications.addListener('pushNotificationActionPerformed', (action: any) => {
          logger.info('Ação da notificação', 'notifications', { action });
          // Navegar para uma página específica se necessário
          if (action.notification.data?.url) {
            navigateToUrl(action.notification.data.url);
          }
        });
      }
    } catch (error) {
      logger.error('Erro ao configurar listeners de notificações', 'notifications', error);
    }
  }
}

export const notificationService = new NotificationService();

