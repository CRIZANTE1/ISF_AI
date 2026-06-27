import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { getAllExtinguishers } from '../utils/extinguisherOperations';
import { getAllHoses } from '../utils/hoseOperations';
import { getAllSCBAs } from '../utils/scbaOperations';
import { getAllMultigasDetectors } from '../utils/multigasOperations';
import { getAllFoamChambers } from '../utils/foamChamberOperations';
import { getAllCannonMonitors } from '../utils/cannonMonitorOperations';
import { getAllEyewashStations } from '../utils/eyewashOperations';
import { getAllAlarmSystems } from '../utils/alarmOperations';
import { getAllShelters } from '../utils/shelterOperations';
import { getAllWaterReservoirs } from '../utils/waterReservoirOperations';
import { getAllCustomEquipmentTypes, getAllCustomEquipment } from '../utils/customEquipmentOperations';
import { logger } from '../utils/logger';
import type {
  EquipmentCache,
  AnyEquipment,
  EquipmentTypeKey,
} from '../types/equipment';

// ---------------------------------------------------------------------------
// Tipos auxiliares para getEquipmentByType — retorna o tipo correto conforme
// a chave informada, sem `any`.
// ---------------------------------------------------------------------------

type EquipmentByType<T extends EquipmentTypeKey> =
  T extends 'extintor' ? EquipmentCache['extinguishers'] :
  T extends 'mangueira' ? EquipmentCache['hoses'] :
  T extends 'scba' ? EquipmentCache['scbas'] :
  T extends 'multigas' ? EquipmentCache['multigasDetectors'] :
  T extends 'camara_espuma' ? EquipmentCache['foamChambers'] :
  T extends 'canhao_monitor' ? EquipmentCache['cannonMonitors'] :
  T extends 'chuveiro_lavaolhos' ? EquipmentCache['eyewashStations'] :
  T extends 'alarme' ? EquipmentCache['alarmSystems'] :
  T extends 'abrigo' ? EquipmentCache['shelters'] :
  T extends 'reserva_tecnica' ? EquipmentCache['waterReservoirs'] :
  AnyEquipment[];

// ---------------------------------------------------------------------------
// Context type
// ---------------------------------------------------------------------------

interface EquipmentCacheContextType {
  cache: EquipmentCache;
  refreshCache: () => Promise<void>;
  /** Retorna a lista tipada de equipamentos para o tipo informado */
  getEquipmentByType: <T extends EquipmentTypeKey>(type: T) => EquipmentByType<T>;
  /** Retorna todos os equipamentos como array plano (union type) */
  getAllEquipment: () => AnyEquipment[];
  isStale: () => boolean;
}

const EquipmentCacheContext = createContext<EquipmentCacheContextType | undefined>(undefined);

// Tempo de cache: 5 minutos (otimizado para Android - reduz requisições)
const CACHE_DURATION = 5 * 60 * 1000;

export const EquipmentCacheProvider = ({ children }: { children: React.ReactNode }) => {
  const { user } = useAuth();
  const [cache, setCache] = useState<EquipmentCache>({
    extinguishers: [],
    hoses: [],
    scbas: [],
    multigasDetectors: [],
    foamChambers: [],
    cannonMonitors: [],
    eyewashStations: [],
    alarmSystems: [],
    shelters: [],
    waterReservoirs: [],
    lastFetch: null,
    isLoading: false,
  });

  const isFetchingRef = useRef(false);

  const refreshCache = useCallback(async (force: boolean = false) => {
    if (!user) return;

    // Se já está buscando e não é forçado, aguarda a atualização atual terminar
    if (isFetchingRef.current && !force) {
      logger.info('Cache já está sendo atualizado, aguardando...', 'equipment');
      // Aguarda a atualização atual terminar (máximo 5 segundos)
      let attempts = 0;
      while (isFetchingRef.current && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      // Se ainda está buscando após 5 segundos, força uma nova atualização
      if (isFetchingRef.current) {
        logger.warn('Timeout aguardando atualização do cache, forçando nova atualização', 'equipment');
        isFetchingRef.current = false;
      } else {
        // A atualização anterior terminou, não precisa fazer nada
        return;
      }
    }

    isFetchingRef.current = true;
    setCache(prev => ({ ...prev, isLoading: true }));

    try {
      const [
        extinguishers,
        hoses,
        scbas,
        multigasDetectors,
        foamChambers,
        cannonMonitors,
        eyewashStations,
        alarmSystems,
        shelters,
        waterReservoirs,
      ] = await Promise.all([
        getAllExtinguishers(),
        getAllHoses(),
        getAllSCBAs(),
        getAllMultigasDetectors(),
        getAllFoamChambers(),
        getAllCannonMonitors(),
        getAllEyewashStations(),
        getAllAlarmSystems(),
        getAllShelters(),
        getAllWaterReservoirs(),
      ]);

      setCache({
        extinguishers,
        hoses,
        scbas,
        multigasDetectors,
        foamChambers,
        cannonMonitors,
        eyewashStations,
        alarmSystems,
        shelters,
        waterReservoirs,
        lastFetch: Date.now(),
        isLoading: false,
      });
    } catch (error) {
      logger.error('Erro ao atualizar cache de equipamentos', 'equipment', error);
      setCache(prev => ({ ...prev, isLoading: false }));
    } finally {
      isFetchingRef.current = false;
    }
  }, [user]);

  const isStale = useCallback(() => {
    if (!cache.lastFetch) return true;
    return Date.now() - cache.lastFetch > CACHE_DURATION;
  }, [cache.lastFetch]);

  /**
   * Retorna a lista de equipamentos para um tipo específico.
   * O tipo de retorno é inferido a partir da chave — sem `any`.
   */
  const getEquipmentByType = useCallback(<T extends EquipmentTypeKey>(type: T): EquipmentByType<T> => {
    switch (type) {
      case 'extintor':
        return cache.extinguishers as EquipmentByType<T>;
      case 'mangueira':
        return cache.hoses as EquipmentByType<T>;
      case 'scba':
        return cache.scbas as EquipmentByType<T>;
      case 'multigas':
        return cache.multigasDetectors as EquipmentByType<T>;
      case 'camara_espuma':
        return cache.foamChambers as EquipmentByType<T>;
      case 'canhao_monitor':
        return cache.cannonMonitors as EquipmentByType<T>;
      case 'chuveiro_lavaolhos':
        return cache.eyewashStations as EquipmentByType<T>;
      case 'alarme':
        return cache.alarmSystems as EquipmentByType<T>;
      case 'abrigo':
        return cache.shelters as EquipmentByType<T>;
      case 'reserva_tecnica':
        return cache.waterReservoirs as EquipmentByType<T>;
      default:
        return [] as unknown as EquipmentByType<T>;
    }
  }, [cache]);

  const getAllEquipment = useCallback((): AnyEquipment[] => {
    return [
      ...cache.extinguishers,
      ...cache.hoses,
      ...cache.scbas,
      ...cache.multigasDetectors,
      ...cache.foamChambers,
      ...cache.cannonMonitors,
      ...cache.eyewashStations,
      ...cache.alarmSystems,
      ...cache.shelters,
      ...cache.waterReservoirs,
    ];
  }, [cache]);

  // Carregar cache quando o usuário estiver disponível (otimizado)
  useEffect(() => {
    if (user) {
      // Se o cache está vazio ou está obsoleto, buscar dados
      // Usa setTimeout para não bloquear a renderização inicial
      const isCacheStale = !cache.lastFetch || (Date.now() - cache.lastFetch > CACHE_DURATION);
      if (isCacheStale && !isFetchingRef.current) {
        // Delay pequeno para não bloquear a UI inicial
        const timer = setTimeout(() => {
          refreshCache();
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
      // Limpar cache quando o usuário sair
      setCache({
        extinguishers: [],
        hoses: [],
        scbas: [],
        multigasDetectors: [],
        foamChambers: [],
        cannonMonitors: [],
        eyewashStations: [],
        alarmSystems: [],
        shelters: [],
        waterReservoirs: [],
        lastFetch: null,
        isLoading: false,
      });
    }
  }, [user, cache.lastFetch, refreshCache]);

  const value: EquipmentCacheContextType = {
    cache,
    refreshCache,
    getEquipmentByType,
    getAllEquipment,
    isStale,
  };

  return (
    <EquipmentCacheContext.Provider value={value}>
      {children}
    </EquipmentCacheContext.Provider>
  );
};

export const useEquipmentCache = () => {
  const context = useContext(EquipmentCacheContext);
  if (context === undefined) {
    throw new Error('useEquipmentCache deve ser usado dentro de EquipmentCacheProvider');
  }
  return context;
};
