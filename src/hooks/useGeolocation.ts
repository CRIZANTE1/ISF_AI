import { useState, useEffect } from 'react';

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
              console.warn('Permissão de localização negada');
              return null;
            }
          }

          // Tenta obter localização com alta precisão, múltiplas tentativas
          let bestPosition: any = null;
          let bestAccuracy = Infinity;
          
          // Tenta 3 vezes e pega a mais precisa
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const position = await Geolocation.getCurrentPosition({
                enableHighAccuracy: true,
                timeout: 20000, // 20 segundos por tentativa
                maximumAge: 0, // Sempre buscar nova localização
              });

              // Se tiver informação de precisão, usa a mais precisa
              const accuracy = position.coords.accuracy || Infinity;
              if (accuracy < bestAccuracy) {
                bestPosition = position;
                bestAccuracy = accuracy;
              }

              // Se a precisão for muito boa (menos de 10 metros), aceita imediatamente
              if (accuracy < 10) {
                break;
              }

              // Aguarda um pouco antes da próxima tentativa
              if (attempt < 2) {
                await new Promise(resolve => setTimeout(resolve, 1000));
              }
            } catch (err) {
              console.warn(`Tentativa ${attempt + 1} falhou:`, err);
            }
          }

          if (bestPosition) {
            return {
              latitude: bestPosition.coords.latitude,
              longitude: bestPosition.coords.longitude,
            };
          }
        }
      } catch (error: any) {
        console.error('Erro ao obter localização via Capacitor:', error);
        // Fallback para web API se Capacitor falhar
      }
    }

    // Fallback para web API (navegador)
    if (navigator.geolocation) {
      return new Promise((resolve) => {
        let bestPosition: GeolocationPosition | null = null;
        let bestAccuracy = Infinity;
        let attempts = 0;
        const maxAttempts = 3;

        const tryGetPosition = () => {
          const options: PositionOptions = {
            enableHighAccuracy: true,
            timeout: 20000, // 20 segundos por tentativa
            maximumAge: 0, // Sempre buscar nova localização, sem cache
          };

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const accuracy = position.coords.accuracy || Infinity;
              
              // Se esta posição for mais precisa, guarda
              if (accuracy < bestAccuracy) {
                bestPosition = position;
                bestAccuracy = accuracy;
              }

              attempts++;
              
              // Se a precisão for muito boa (menos de 10 metros) ou já tentou 3 vezes, resolve
              if (accuracy < 10 || attempts >= maxAttempts) {
                if (bestPosition) {
                  resolve({
                    latitude: bestPosition.coords.latitude,
                    longitude: bestPosition.coords.longitude,
                  });
                } else {
                  resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                  });
                }
              } else {
                // Tenta novamente após 1 segundo
                setTimeout(tryGetPosition, 1000);
              }
            },
            (error) => {
              attempts++;
              if (attempts >= maxAttempts) {
                if (bestPosition) {
                  resolve({
                    latitude: bestPosition.coords.latitude,
                    longitude: bestPosition.coords.longitude,
                  });
                } else {
                  console.error('Erro ao obter localização:', error);
                  resolve(null);
                }
              } else {
                // Tenta novamente após 1 segundo
                setTimeout(tryGetPosition, 1000);
              }
            },
            options
          );
        };

        tryGetPosition();
      });
    }

    return null;
  } catch (error: any) {
    console.error('Erro geral ao obter localização:', error);
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
          error: 'Não foi possível obter a localização. Verifique as permissões do dispositivo.',
          loading: false,
        });
      }
    };

    fetchLocation();
  }, []);

  return state;
}

