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
import { logger } from '../utils/logger';
import type {
  EquipmentCache,
  AnyEquipment,
  EquipmentTypeKey,
} from '../types/equipment';

// ---------------------------------------------------------------------------
// Mapa interno: tipo de equipamento → fetcher + chave do cache
// ---------------------------------------------------------------------------

type TypeFetcher = () => Promise<AnyEquipment[]>;

const TYPE_FETCHERS: Record<EquipmentTypeKey, TypeFetcher> = {
  extintor: getAllExtinguishers,
  mangueira: getAllHoses,
  scba: getAllSCBAs,
  multigas: getAllMultigasDetectors,
  camara_espuma: getAllFoamChambers,
  canhao_monitor: getAllCannonMonitors,
  chuveiro_lavaolhos: getAllEyewashStations,
  alarme: getAllAlarmSystems,
  abrigo: getAllShelters,
  reserva_tecnica: getAllWaterReservoirs,
};

/**
 * Mapeia EquipmentTypeKey → chave do cache onde a lista é armazenada.
 */
const CACHE_KEY_MAP: Record<EquipmentTypeKey, keyof EquipmentCache> = {
  extintor: 'extinguishers',
  mangueira: 'hoses',
  scba: 'scbas',
  multigas: 'multigasDetectors',
  camara_espuma: 'foamChambers',
  canhao_monitor: 'cannonMonitors',
  chuveiro_lavaolhos: 'eyewashStations',
  alarme: 'alarmSystems',
  abrigo: 'shelters',
  reserva_tecnica: 'waterReservoirs',
};

/** Lista de todos os tipos de equipamento (reutilizada em refreshCache completo) */
const ALL_EQUIPMENT_TYPES = Object.keys(TYPE_FETCHERS) as EquipmentTypeKey[];

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
  /** Atualiza todos os tipos de equipamento (fallback para compatibilidade) */
  refreshCache: (force?: boolean) => Promise<void>;
  /** Atualiza apenas os tipos de equipamento informados (invalidação seletiva) */
  refreshTypes: (types: EquipmentTypeKey[], force?: boolean) => Promise<void>;
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

  /**
   * Atualiza apenas os tipos de equipamento especificados.
   * Usa Promise.allSettled para que a falha de UM tipo não impeça os outros
   * de serem atualizados. Tipos que falharem mantêm os dados anteriores e
   * o erro é logado individualmente.
   */
  const refreshTypes = useCallback(async (types: EquipmentTypeKey[], force: boolean = false) => {
    if (!user) return;
    if (types.length === 0) return;

    // Se já está buscando e não é forçado, aguarda a atualização atual terminar
    if (isFetchingRef.current && !force) {
      logger.info('Cache já está sendo atualizado, aguardando...', 'equipment');
      let attempts = 0;
      while (isFetchingRef.current && attempts < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        attempts++;
      }
      if (isFetchingRef.current) {
        logger.warn('Timeout aguardando atualização do cache, forçando nova atualização', 'equipment');
        isFetchingRef.current = false;
      } else {
        return; // a atualização anterior terminou
      }
    }

    isFetchingRef.current = true;
    setCache(prev => ({ ...prev, isLoading: true }));

    // Dispara todas as queries em paralelo, mas cada uma é independente
    const results = await Promise.allSettled(
      types.map(async (type) => {
        const fetcher = TYPE_FETCHERS[type];
        const data = await fetcher();
        return { type, data };
      })
    );

    // Constrói o patch de cache apenas com os tipos que tiveram sucesso
    const patch: Partial<EquipmentCache> = {};
    let hasAnySuccess = false;

    results.forEach((result) => {
      if (result.status === 'fulfilled') {
        const { type, data } = result.value;
        const cacheKey = CACHE_KEY_MAP[type];
        (patch as Record<string, unknown>)[cacheKey] = data;
        hasAnySuccess = true;
      } else {
        // Extrai o tipo do erro quando possível
        logger.error(
          `Falha ao atualizar equipamentos do tipo — dados anteriores mantidos no cache`,
          'equipment',
          result.reason
        );
      }
    });

    if (hasAnySuccess) {
      setCache(prev => ({
        ...prev,
        ...patch,
        lastFetch: Date.now(),
        isLoading: false,
      }));
    } else {
      // Nenhum tipo foi atualizado com sucesso
      logger.error(
        'Nenhum tipo de equipamento pôde ser atualizado — cache mantido com dados anteriores',
        'equipment'
      );
      setCache(prev => ({ ...prev, isLoading: false }));
    }

    isFetchingRef.current = false;
  }, [user]);

  /**
   * Atualiza TODOS os tipos de equipamento.
   * Mantido para compatibilidade com chamadores legados.
   * Internamente delega para refreshTypes com a lista completa.
   */
  const refreshCache = useCallback(async (force: boolean = false) => {
    await refreshTypes(ALL_EQUIPMENT_TYPES, force);
  }, [refreshTypes]);

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
      const isCacheStale = !cache.lastFetch || (Date.now() - cache.lastFetch > CACHE_DURATION);
      if (isCacheStale && !isFetchingRef.current) {
        const timer = setTimeout(() => {
          refreshCache();
        }, 100);
        return () => clearTimeout(timer);
      }
    } else {
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
    refreshTypes,
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
