import { useEffect } from 'react';
import { Capacitor } from '@capacitor/core';
import { useAuth } from '../contexts/AuthContext';
import { requestLocationPermission } from '../hooks/useGeolocation';
import { logger } from '../utils/logger';

/**
 * Solicita permissão de localização após login no app nativo.
 */
export function GeolocationEffects() {
  const { session } = useAuth();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;
    if (!session?.access_token) return;

    void (async () => {
      try {
        await requestLocationPermission();
      } catch (error) {
        logger.warn('Falha ao solicitar permissão de localização', 'geolocation', error);
      }
    })();
  }, [session?.access_token]);

  return null;
}
