import { Camera } from '@capacitor/camera';
import { Capacitor } from '@capacitor/core';
import { logger } from '../utils/logger';

/**
 * Solicita permissão de câmera no dispositivo nativo (Android/iOS).
 * No navegador, a permissão é solicitada via getUserMedia.
 */
export async function requestCameraPermission(): Promise<boolean> {
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    const current = await Camera.checkPermissions();

    if (current.camera === 'granted') {
      return true;
    }

    logger.info('Solicitando permissão de câmera...', 'camera');
    const result = await Camera.requestPermissions({ permissions: ['camera'] });

    return result.camera === 'granted';
  } catch (error) {
    logger.error('Erro ao solicitar permissão de câmera', 'camera', error);
    return false;
  }
}
