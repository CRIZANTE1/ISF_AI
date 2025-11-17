import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

/**
 * Verifica se está rodando em ambiente Capacitor (Android/iOS)
 */
function isCapacitorEnvironment(): boolean {
  try {
    // Tenta importar Capacitor dinamicamente
    const Capacitor = (window as any).Capacitor;
    return Capacitor && Capacitor.isNativePlatform && Capacitor.isNativePlatform();
  } catch {
    return false;
  }
}

/**
 * Obtém o plugin de Geolocalização do Capacitor se disponível
 */
async function getCapacitorGeolocation() {
  try {
    // Tenta acessar o plugin do Capacitor via window (disponível em runtime)
    const Capacitor = (window as any).Capacitor;
    if (Capacitor && Capacitor.Plugins && Capacitor.Plugins.Geolocation) {
      return Capacitor.Plugins.Geolocation;
    }
    // Se não estiver disponível via window, retorna null
    // O Capacitor injeta os plugins em window.Capacitor.Plugins em runtime
    return null;
  } catch {
    return null;
  }
}

/**
 * Função auxiliar para obter localização uma única vez com alta precisão
 * Funciona tanto no navegador quanto no Android/iOS usando Capacitor
 * Tenta múltiplas vezes para obter a melhor precisão possível
 */
export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Se estiver em ambiente nativo (Android/iOS), usa Capacitor
    if (isCapacitorEnvironment()) {
      try {
        const Geolocation = await getCapacitorGeolocation();
        if (Geolocation) {
          // Verifica permissões primeiro
          const permissions = await Geolocation.checkPermissions();
          
          if (permissions.location !== 'granted') {
            // Solicita permissão
            const requestResult = await Geolocation.requestPermissions();
            if (requestResult.location !== 'granted') {
              logger.warn('Permissão de localização negada', 'permission');
              return null;
            }
          }

          // Obtém localização com alta precisão (otimizado para Android)
          const position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 15000, // 15 segundos (reduzido para não bloquear)
            maximumAge: 5000, // Aceita localização com até 5 segundos (melhora performance)
          });

          return {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          };
        }
      } catch (error: any) {
        logger.error('Erro ao obter localização via Capacitor', 'permission', error);
        // Fallback para web API se Capacitor falhar
      }
    }

    // Fallback para web API (navegador) - otimizado
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 15000, // 15 segundos (reduzido)
          maximumAge: 5000, // Aceita localização com até 5 segundos (melhora performance)
        };

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            logger.error('Erro ao obter localização', 'permission', error);
            resolve(null);
          },
          options
        );
      });
    }

    return null;
  } catch (error: any) {
    logger.error('Erro geral ao obter localização', 'permission', error);
    return null;
  }
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    const fetchLocation = async () => {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const location = await getCurrentLocation();
      
      if (location) {
        setState({
          latitude: location.latitude,
          longitude: location.longitude,
          error: null,
          loading: false,
        });
      } else {
        setState({
          latitude: null,
          longitude: null,
          // Retorna uma chave de tradução que será traduzida pelo componente que usa o hook
          error: 'common.locationError',
          loading: false,
        });
      }
    };

    fetchLocation();
  }, []);

  return state;
}

