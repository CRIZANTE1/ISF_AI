import { useState, useEffect } from 'react';
import { logger } from '../utils/logger';
import { Geolocation } from '@capacitor/geolocation';
import { Capacitor } from '@capacitor/core';

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
    // Verifica se Capacitor está disponível
    if (!Capacitor) {
      logger.info('Capacitor não disponível, usando ambiente web', 'geolocation');
      return false;
    }
    
    const isNative = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    
    logger.info(`Verificando ambiente Capacitor: isNativePlatform=${isNative}, platform=${platform}`, 'geolocation');
    
    // Se não for nativo ou for 'web', não é ambiente Capacitor
    if (!isNative || platform === 'web') {
      logger.info('Ambiente web detectado (não nativo)', 'geolocation');
      return false;
    }
    
    return true;
  } catch (error: any) {
    logger.error(`Erro ao verificar ambiente Capacitor: ${error.message}`, 'geolocation');
    // Em caso de erro, assume ambiente web
    return false;
  }
}

/**
 * Solicita permissão de localização no dispositivo nativo (Android/iOS).
 */
export async function requestLocationPermission(): Promise<boolean> {
  if (!isCapacitorEnvironment()) {
    return true;
  }

  try {
    const permissions = await Geolocation.checkPermissions();
    const platform = Capacitor.getPlatform();

    const isGranted =
      permissions.location === 'granted' ||
      (platform === 'android' && permissions.coarseLocation === 'granted');

    if (isGranted) {
      return true;
    }

    logger.info('Solicitando permissão de localização...', 'geolocation');
    const requestResult = await Geolocation.requestPermissions();
    logger.info(`Resultado da solicitação: ${JSON.stringify(requestResult)}`, 'geolocation');

    return (
      requestResult.location === 'granted' ||
      (platform === 'android' && requestResult.coarseLocation === 'granted')
    );
  } catch (error: any) {
    logger.error(`Erro ao solicitar permissão de localização: ${error.message}`, 'geolocation');
    return false;
  }
}

export async function getCurrentLocation(): Promise<{ latitude: number; longitude: number } | null> {
  try {
    logger.info('=== INICIANDO getCurrentLocation ===', 'geolocation');
    
    // Se estiver em ambiente nativo (Android/iOS), usa Capacitor
    if (isCapacitorEnvironment()) {
      try {
        logger.info('Ambiente nativo detectado, usando Capacitor Geolocation', 'geolocation');
        
        // Verifica se o plugin está disponível
        if (!Geolocation) {
          logger.error('Plugin Geolocation não está disponível!', 'geolocation');
          throw new Error('Plugin Geolocation não disponível');
        }
        
        logger.info('Plugin Geolocation disponível, verificando permissões...', 'geolocation');

        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          logger.warn('Permissão de localização negada', 'permission');
          return null;
        }

        // Verifica se apenas localização aproximada (coarse) foi concedida
        const permissions = await Geolocation.checkPermissions();
        const onlyCoarse =
          permissions.location !== 'granted' &&
          Capacitor.getPlatform() === 'android' &&
          permissions.coarseLocation === 'granted';

        logger.info('Permissão concedida, obtendo posição atual...', 'geolocation');

        let position;
        try {
          position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: !onlyCoarse,
            timeout: 30000,
            maximumAge: 10000,
          });
          logger.info(`✅ Localização obtida com sucesso! (highAccuracy=${!onlyCoarse})`, 'geolocation');
          logger.info(`Coordenadas: lat=${position.coords.latitude}, lng=${position.coords.longitude}`, 'geolocation');
          logger.info(`Precisão: ${position.coords.accuracy}m`, 'geolocation');
        } catch (posError: any) {
          logger.error(`❌ Erro ao obter posição (highAccuracy=${!onlyCoarse}): ${posError.message}`, 'geolocation');
          // Tenta novamente com baixa precisão se a tentativa de alta precisão falhou
          if (!onlyCoarse) {
            logger.info('Tentando novamente com enableHighAccuracy=false...', 'geolocation');
            position = await Geolocation.getCurrentPosition({
              enableHighAccuracy: false,
              timeout: 15000,
              maximumAge: 30000,
            });
            logger.info(`✅ Localização obtida com baixa precisão!`, 'geolocation');
          } else {
            throw posError;
          }
        }

        return {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
      } catch (error: any) {
        logger.error('❌ Erro ao obter localização via Capacitor', 'permission', error);
        logger.error(`Tipo do erro: ${error.constructor.name}`, 'permission');
        logger.error(`Mensagem: ${error.message || 'Sem mensagem'}`, 'permission');
        logger.error(`Stack: ${error.stack || 'Sem stack'}`, 'permission');
        logger.error(`Erro completo: ${JSON.stringify(error, Object.getOwnPropertyNames(error))}`, 'permission');
        // Fallback para web API se Capacitor falhar
        logger.info('Tentando fallback para API web...', 'geolocation');
      }
    } else {
      logger.info('Ambiente web detectado, usando API web', 'geolocation');
    }

    // Fallback para web API (navegador) - otimizado
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      logger.info('Usando API web de geolocalização (fallback ou ambiente web)', 'geolocation');
      
      // Verifica se está em HTTPS ou localhost (requisito para geolocalização)
      const isSecure = window.location.protocol === 'https:' || 
                       window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1';
      
      if (!isSecure) {
        logger.warn('⚠️ Geolocalização requer HTTPS ou localhost. Protocolo atual: ' + window.location.protocol, 'geolocation');
        // Ainda tenta, mas pode falhar
      }
      
      return new Promise((resolve) => {
        const options: PositionOptions = {
          enableHighAccuracy: true,
          timeout: 30000, // 30 segundos (aumentado)
          maximumAge: 10000, // Aceita localização com até 10 segundos
        };

        logger.info('Chamando navigator.geolocation.getCurrentPosition...', 'geolocation');
        
        navigator.geolocation.getCurrentPosition(
          (position) => {
            logger.info(`✅ Localização obtida via web: ${position.coords.latitude}, ${position.coords.longitude}`, 'geolocation');
            logger.info(`Precisão: ${position.coords.accuracy}m`, 'geolocation');
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            logger.error('❌ Erro ao obter localização via web API', 'permission', error);
            logger.error(`Código do erro: ${error.code}`, 'permission');
            logger.error(`Mensagem: ${error.message}`, 'permission');
            
            // Mapear códigos de erro
            const errorMessages: Record<number, string> = {
              1: 'PERMISSION_DENIED - Usuário negou a solicitação de geolocalização',
              2: 'POSITION_UNAVAILABLE - Informações de localização não disponíveis',
              3: 'TIMEOUT - Tempo limite da solicitação de geolocalização expirado'
            };
            logger.error(`Descrição: ${errorMessages[error.code] || 'Erro desconhecido'}`, 'permission');
            
            // Dicas adicionais baseadas no erro
            if (error.code === 1) {
              logger.warn('💡 Dica: Verifique as configurações de permissão de localização do navegador', 'geolocation');
            } else if (error.code === 2) {
              logger.warn('💡 Dica: Verifique se o GPS está ativo ou se há conexão com internet', 'geolocation');
            } else if (error.code === 3) {
              logger.warn('💡 Dica: O tempo limite expirou. Tente novamente em um local com melhor sinal', 'geolocation');
            }
            
            resolve(null);
          },
          options
        );
      });
    } else {
      logger.warn('❌ Geolocalização não suportada: navigator.geolocation não está disponível', 'geolocation');
      logger.warn(`navigator disponível: ${typeof navigator !== 'undefined'}`, 'geolocation');
      logger.warn(`navigator.geolocation disponível: ${typeof navigator !== 'undefined' && !!navigator.geolocation}`, 'geolocation');
      
      // Verifica se está em HTTPS
      if (typeof window !== 'undefined') {
        logger.warn(`Protocolo: ${window.location.protocol}`, 'geolocation');
        logger.warn(`Hostname: ${window.location.hostname}`, 'geolocation');
        if (window.location.protocol !== 'https:' && 
            window.location.hostname !== 'localhost' && 
            window.location.hostname !== '127.0.0.1') {
          logger.warn('⚠️ Geolocalização requer HTTPS ou localhost', 'geolocation');
        }
      }
    }

    logger.warn('❌ Não foi possível obter localização por nenhum método', 'geolocation');
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

