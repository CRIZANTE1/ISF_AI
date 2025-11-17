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
import { logger } from '../utils/logger';

interface EquipmentCache {
  extinguishers: any[];
  hoses: any[];
  scbas: any[];
  multigasDetectors: any[];
  foamChambers: any[];
  cannonMonitors: any[];
  eyewashStations: any[];
  alarmSystems: any[];
  shelters: any[];
  lastFetch: number | null;
  isLoading: boolean;
}

interface EquipmentCacheContextType {
  cache: EquipmentCache;
  refreshCache: () => Promise<void>;
  getEquipmentByType: (type: string) => any[];
  getAllEquipment: () => any[];
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
    lastFetch: null,
    isLoading: false,
  });

  const isFetchingRef = useRef(false);

  const refreshCache = useCallback(async () => {
    if (!user || isFetchingRef.current) return;

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

  const getEquipmentByType = useCallback((type: string): any[] => {
    switch (type) {
      case 'extintor':
        return cache.extinguishers;
      case 'mangueira':
        return cache.hoses;
      case 'scba':
        return cache.scbas;
      case 'multigas':
        return cache.multigasDetectors;
      case 'camara_espuma':
        return cache.foamChambers;
      case 'canhao_monitor':
        return cache.cannonMonitors;
      case 'chuveiro_lavaolhos':
        return cache.eyewashStations;
      case 'alarme':
        return cache.alarmSystems;
      case 'abrigo':
        return cache.shelters;
      default:
        return [];
    }
  }, [cache]);

  const getAllEquipment = useCallback((): any[] => {
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


