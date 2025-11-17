// Verifica se está em ambiente Capacitor sem importar o módulo
function isCapacitorEnvironment(): boolean {
  // Verifica se está rodando em um app Capacitor
  // Capacitor injeta variáveis globais no window
  return typeof window !== 'undefined' && 
         ((window as any).Capacitor !== undefined ||
          (window as any).CapacitorWeb !== undefined);
}

// Para evitar erros de import, vamos usar apenas a API web de notificações
// Quando o Capacitor estiver instalado, ele será carregado via script tag no HTML
// e estará disponível globalmente

import { logger } from '../utils/logger';

export interface NotificationPermissionStatus {
  granted: boolean;
  denied: boolean;
  prompt: boolean;
}

class NotificationService {
  private _isNative: boolean | null = null;

  /**
   * Verifica se está rodando em plataforma nativa
   */
  private async isNative(): Promise<boolean> {
    if (this._isNative !== null) return this._isNative;
    
    // Verifica se Capacitor está disponível globalmente (carregado via script)
    if (isCapacitorEnvironment() && typeof (window as any).Capacitor !== 'undefined') {
      const Capacitor = (window as any).Capacitor;
      this._isNative = Capacitor.isNativePlatform();
    } else {
      this._isNative = false;
    }
    return this._isNative;
  }

  /**
   * Verifica se as notificações são suportadas
   */
  isSupported(): boolean {
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
    if (native && isCapacitorEnvironment()) {
      // Para plataformas nativas (Android/iOS) - tenta usar Capacitor se disponível
      try {
        // Tenta acessar PushNotifications do Capacitor global
        const Capacitor = (window as any).Capacitor;
        if (Capacitor && Capacitor.Plugins && Capacitor.Plugins.PushNotifications) {
          const result = await Capacitor.Plugins.PushNotifications.requestPermissions();
          return {
            granted: result.receive === 'granted',
            denied: result.receive === 'denied',
            prompt: result.receive === 'prompt',
          };
        }
      } catch (error) {
        logger.error('Erro ao solicitar permissão de notificações', 'notifications', error);
        // Fallback para web
      }
    }
    
    // Para web (ou fallback se plugin não instalado)
    try {
      const permission = await Notification.requestPermission();
      return {
        granted: permission === 'granted',
        denied: permission === 'denied',
        prompt: permission === 'default',
      };
    } catch (error) {
      logger.error('Erro ao solicitar permissão de notificações', 'notifications', error);
      return { granted: false, denied: false, prompt: false };
    }
  }

  /**
   * Verifica o status atual da permissão
   */
  async checkPermission(): Promise<NotificationPermissionStatus> {
    if (!this.isSupported()) {
      return { granted: false, denied: false, prompt: false };
    }

    const native = await this.isNative();
    if (native && isCapacitorEnvironment()) {
      // Para plataformas nativas (Android/iOS) - tenta usar Capacitor se disponível
      try {
        const Capacitor = (window as any).Capacitor;
        if (Capacitor && Capacitor.Plugins && Capacitor.Plugins.PushNotifications) {
          const result = await Capacitor.Plugins.PushNotifications.checkPermissions();
          return {
            granted: result.receive === 'granted',
            denied: result.receive === 'denied',
            prompt: result.receive === 'prompt',
          };
        }
      } catch (error) {
        logger.error('Erro ao verificar permissão de notificações', 'notifications', error);
        // Fallback para web
      }
    }
    
    // Para web (ou fallback se plugin não instalado)
    if (Notification.permission === 'granted') {
      return { granted: true, denied: false, prompt: false };
    } else if (Notification.permission === 'denied') {
      return { granted: false, denied: true, prompt: false };
    } else {
      return { granted: false, denied: false, prompt: true };
    }
  }

  /**
   * Registra o dispositivo para receber notificações push
   */
  async register(): Promise<void> {
    const native = await this.isNative();
    if (!native || !this.isSupported() || !isCapacitorEnvironment()) {
      return;
    }

    try {
      const Capacitor = (window as any).Capacitor;
      if (Capacitor && Capacitor.Plugins && Capacitor.Plugins.PushNotifications) {
        await Capacitor.Plugins.PushNotifications.register();
      }
    } catch (error) {
      logger.error('Erro ao registrar notificações', 'notifications', error);
    }
  }

  /**
   * Envia uma notificação local
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
      // Para plataformas nativas, use notificações locais do Capacitor
      // Nota: Para notificações locais no Capacitor, você precisaria do plugin @capacitor/local-notifications
      // Por enquanto, vamos usar a API de notificações do navegador como fallback
      this.showWebNotification(title, body, data);
    } else {
      this.showWebNotification(title, body, data);
    }
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
          window.location.href = data.url;
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
    if (!native || !isCapacitorEnvironment()) {
      return;
    }

    try {
      const Capacitor = (window as any).Capacitor;
      if (!Capacitor || !Capacitor.Plugins || !Capacitor.Plugins.PushNotifications) {
        return;
      }

      const PushNotifications = Capacitor.Plugins.PushNotifications;

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
          window.location.href = action.notification.data.url;
        }
      });
    } catch (error) {
      logger.error('Erro ao configurar listeners de notificações', 'notifications', error);
    }
  }
}

export const notificationService = new NotificationService();

