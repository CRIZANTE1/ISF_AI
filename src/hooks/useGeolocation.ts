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
 * Função auxiliar para obter localização uma única vez com alta precisão
 * Funciona tanto no navegador quanto no Android/iOS usando Capacitor
 * Tenta múltiplas vezes para obter a melhor precisão possível
 */
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
        
        // Verifica permissões primeiro
        let permissions;
        try {
          permissions = await Geolocation.checkPermissions();
          logger.info(`Status da permissão: ${JSON.stringify(permissions)}`, 'geolocation');
        } catch (permError: any) {
          logger.error(`Erro ao verificar permissões: ${permError.message}`, 'geolocation');
          throw permError;
        }
        
        if (permissions.location !== 'granted') {
          // Solicita permissão
          logger.info('Permissão não concedida, solicitando...', 'geolocation');
          let requestResult;
          try {
            requestResult = await Geolocation.requestPermissions();
            logger.info(`Resultado da solicitação: ${JSON.stringify(requestResult)}`, 'geolocation');
          } catch (reqError: any) {
            logger.error(`Erro ao solicitar permissões: ${reqError.message}`, 'geolocation');
            throw reqError;
          }
          
          if (requestResult.location !== 'granted') {
            logger.warn(`Permissão negada. Status: ${requestResult.location}`, 'permission');
            return null;
          }
        }

        // Obtém localização com alta precisão (otimizado para Android)
        logger.info('Permissão concedida, obtendo posição atual...', 'geolocation');
        logger.info('Configurações: enableHighAccuracy=true, timeout=30000, maximumAge=10000', 'geolocation');
        
        let position;
        try {
          position = await Geolocation.getCurrentPosition({
            enableHighAccuracy: true,
            timeout: 30000, // 30 segundos (aumentado para dar mais tempo)
            maximumAge: 10000, // Aceita localização com até 10 segundos
          });
          logger.info(`✅ Localização obtida com sucesso!`, 'geolocation');
          logger.info(`Coordenadas: lat=${position.coords.latitude}, lng=${position.coords.longitude}`, 'geolocation');
          logger.info(`Precisão: ${position.coords.accuracy}m`, 'geolocation');
        } catch (posError: any) {
          logger.error(`❌ Erro ao obter posição: ${posError.message}`, 'geolocation');
          logger.error(`Código do erro: ${posError.code || 'N/A'}`, 'geolocation');
          logger.error(`Stack trace: ${posError.stack || 'N/A'}`, 'geolocation');
          throw posError;
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
            
            resolve(null);
          },
          options
        );
      });
    } else {
      logger.warn('❌ Geolocalização não suportada: navigator.geolocation não está disponível', 'geolocation');
      logger.warn(`navigator disponível: ${typeof navigator !== 'undefined'}`, 'geolocation');
      logger.warn(`navigator.geolocation disponível: ${typeof navigator !== 'undefined' && !!navigator.geolocation}`, 'geolocation');
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

