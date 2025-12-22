import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';

/**
 * Hook centralizado para feedback tátil (haptics)
 * Funciona apenas em dispositivos móveis (Android/iOS)
 */
export const useHaptics = () => {
  const isSupported = Capacitor.isNativePlatform();

  /**
   * Feedback leve - Para ações normais e sucessos
   * Ex: navegação, checklist conforme, toasts de sucesso
   */
  const light = async () => {
    if (!isSupported) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Light });
    } catch (error) {
      logger.debug('Haptics não disponível', 'haptics', error);
    }
  };

  /**
   * Feedback médio - Para ações importantes e avisos
   * Ex: salvar, QR detectado, não conforme, modais
   */
  const medium = async () => {
    if (!isSupported) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (error) {
      logger.debug('Haptics não disponível', 'haptics', error);
    }
  };

  /**
   * Feedback pesado - Para ações críticas e erros
   * Ex: deletar, erros, confirmações perigosas
   */
  const heavy = async () => {
    if (!isSupported) return;
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (error) {
      logger.debug('Haptics não disponível', 'haptics', error);
    }
  };

  /**
   * Feedback de sucesso - Notificação de sucesso
   */
  const success = async () => {
    if (!isSupported) return;
    try {
      await Haptics.notification({ type: NotificationType.Success });
    } catch (error) {
      logger.debug('Haptics não disponível', 'haptics', error);
    }
  };

  /**
   * Feedback de aviso - Notificação de aviso
   */
  const warning = async () => {
    if (!isSupported) return;
    try {
      await Haptics.notification({ type: NotificationType.Warning });
    } catch (error) {
      logger.debug('Haptics não disponível', 'haptics', error);
    }
  };

  /**
   * Feedback de erro - Notificação de erro
   */
  const error = async () => {
    if (!isSupported) return;
    try {
      await Haptics.notification({ type: NotificationType.Error });
    } catch (error) {
      logger.debug('Haptics não disponível', 'haptics', error);
    }
  };

  /**
   * Feedback duplo - Duas vibrações rápidas
   * Ex: QR Code detectado
   */
  const double = async (style: ImpactStyle = ImpactStyle.Medium) => {
    if (!isSupported) return;
    try {
      await Haptics.impact({ style });
      setTimeout(async () => {
        try {
          await Haptics.impact({ style });
        } catch (e) {
          logger.debug('Haptics não disponível', 'haptics', e);
        }
      }, 100);
    } catch (error) {
      logger.debug('Haptics não disponível', 'haptics', error);
    }
  };

  /**
   * Seleção - Para itens de lista, botões, etc
   */
  const selection = async () => {
    if (!isSupported) return;
    try {
      await Haptics.selectionStart();
      setTimeout(async () => {
        try {
          await Haptics.selectionEnd();
        } catch (e) {
          logger.debug('Haptics não disponível', 'haptics', e);
        }
      }, 50);
    } catch (error) {
      logger.debug('Haptics não disponível', 'haptics', error);
    }
  };

  return {
    light,
    medium,
    heavy,
    success,
    warning,
    error,
    double,
    selection,
    isSupported,
  };
};

