import { useState, useEffect } from 'react';
import { notificationService, NotificationPermissionStatus } from '../services/notificationService';
import { logger } from '../utils/logger';

export function useNotifications() {
  const [permissionStatus, setPermissionStatus] = useState<NotificationPermissionStatus>({
    granted: false,
    denied: false,
    prompt: false,
  });
  const [isSupported, setIsSupported] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkSupportAndPermission();
    
    // Configura listeners para notificações push se for nativo
    if (notificationService.isSupported()) {
      notificationService.setupPushListeners().catch((error) => {
        logger.error('Erro ao configurar listeners de notificações', 'notifications', error);
      });
    }
  }, []);

  const checkSupportAndPermission = async () => {
    setIsLoading(true);
    const supported = notificationService.isSupported();
    setIsSupported(supported);

    if (supported) {
      const status = await notificationService.checkPermission();
      setPermissionStatus(status);
    }
    setIsLoading(false);
  };

  const requestPermission = async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const status = await notificationService.requestPermission();
      setPermissionStatus(status);
      
      if (status.granted) {
        // Registra o dispositivo para receber notificações push (se nativo)
        await notificationService.register();
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Erro ao solicitar permissão', 'notifications', error);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = async (title: string, body: string, data?: any) => {
    await notificationService.showLocalNotification(title, body, data);
  };

  return {
    permissionStatus,
    isSupported,
    isLoading,
    requestPermission,
    showNotification,
    checkPermission: checkSupportAndPermission,
  };
}

