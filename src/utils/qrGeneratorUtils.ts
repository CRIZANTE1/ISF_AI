/**
 * Utilitários para geração de QR Codes para qualquer tipo de equipamento
 */

import { buildIndustrialQrString, ExtinguisherQrData } from './qrInspectionUtils';
import type { EquipmentCache, AnyEquipment, EquipmentTypeKey } from '../types/equipment';

// ---------------------------------------------------------------------------
// Extrai o identificador único de qualquer equipamento com base no tipo.
// ---------------------------------------------------------------------------

/** Tipo auxiliar: interseção de todos os possíveis campos de ID */
type HasId = {
  numero_identificacao?: string | null;
  id_mangueira?: string | null;
  numero_serie_equipamento?: string | null;
  id_equipamento?: string | null;
  id_camara?: string | null;
  id_sistema?: string | null;
  id_abrigo?: string | null;
  equipment_id?: string | null;
  id?: string | number | null;
};

/**
 * Obtém o ID ou número de série de um equipamento baseado no tipo.
 */
export function getEquipmentIdentifier(equipment: AnyEquipment | Record<string, unknown>, type: string): string | null {
  const eq = equipment as HasId;

  // Para tipos customizados, sempre usa id_equipamento
  if (type.startsWith('custom-')) {
    return eq.id_equipamento || eq.equipment_id || null;
  }

  switch (type) {
    case 'extintor':
      return eq.numero_identificacao || null;
    case 'mangueira':
      return eq.id_mangueira || null;
    case 'scba':
      return eq.numero_serie_equipamento || null;
    case 'multigas':
      return eq.id_equipamento || null;
    case 'camara_espuma':
      return eq.id_camara || null;
    case 'canhao_monitor':
      return eq.id_equipamento || null;
    case 'chuveiro_lavaolhos':
      return eq.id_equipamento || null;
    case 'alarme':
      return eq.id_sistema || null;
    case 'abrigo':
      return eq.id_abrigo || null;
    default:
      return eq.equipment_id || String(eq.id ?? '') || null;
  }
}

// ---------------------------------------------------------------------------
// Busca linear por ID em todos os tipos de equipamento do cache.
// ---------------------------------------------------------------------------

/** Todas as listas do cache (exclui metadados como lastFetch/isLoading) */
type CacheListEntries = Pick<
  EquipmentCache,
  | 'extinguishers'
  | 'hoses'
  | 'scbas'
  | 'multigasDetectors'
  | 'foamChambers'
  | 'cannonMonitors'
  | 'eyewashStations'
  | 'alarmSystems'
  | 'shelters'
  | 'waterReservoirs'
>;

/**
 * Busca um equipamento por ID ou número de série em todos os tipos.
 * `allEquipment` pode ser o cache completo (que inclui lastFetch/isLoading,
 * mas as chaves extras são ignoradas) ou um objeto com as listas de equipamentos.
 */
export function findEquipmentByIdentifier(
  allEquipment: CacheListEntries | EquipmentCache,
  identifier: string
): { equipment: AnyEquipment; type: EquipmentTypeKey } | null {
  const searchInList = <T extends AnyEquipment>(
    list: T[],
    type: EquipmentTypeKey
  ): { equipment: T; type: EquipmentTypeKey } | null => {
    for (const item of list) {
      const id = getEquipmentIdentifier(item, type);
      if (id && String(id).toLowerCase() === identifier.toLowerCase()) {
        return { equipment: item, type };
      }
    }
    return null;
  };

  const cache = allEquipment as CacheListEntries;

  // Procura em cada lista, respeitando a ordem de prioridade
  let result: { equipment: AnyEquipment; type: EquipmentTypeKey } | null = null;

  result = searchInList(cache.extinguishers, 'extintor');
  if (result) return result;
  result = searchInList(cache.hoses, 'mangueira');
  if (result) return result;
  result = searchInList(cache.scbas, 'scba');
  if (result) return result;
  result = searchInList(cache.multigasDetectors, 'multigas');
  if (result) return result;
  result = searchInList(cache.foamChambers, 'camara_espuma');
  if (result) return result;
  result = searchInList(cache.cannonMonitors, 'canhao_monitor');
  if (result) return result;
  result = searchInList(cache.eyewashStations, 'chuveiro_lavaolhos');
  if (result) return result;
  result = searchInList(cache.alarmSystems, 'alarme');
  if (result) return result;
  result = searchInList(cache.shelters, 'abrigo');
  if (result) return result;
  result = searchInList(cache.waterReservoirs, 'reserva_tecnica');
  if (result) return result;

  return null;
}

// ---------------------------------------------------------------------------
// Geração de conteúdo QR
// ---------------------------------------------------------------------------

/**
 * Gera o conteúdo do QR code para qualquer tipo de equipamento.
 */
export function generateQRContentForEquipment(
  equipment: AnyEquipment,
  type: EquipmentTypeKey | string
): string | null {
  const identifier = getEquipmentIdentifier(equipment, type);
  if (!identifier) return null;

  if (type === 'extintor') {
    const extData: ExtinguisherQrData = {
      numero_identificacao: identifier,
    };
    return buildIndustrialQrString(extData);
  }

  // Para outros equipamentos, gera um QR com prefixo e identificador
  return `ISFIA|${type}|${identifier}|${new Date().toISOString()}`;
}

// ---------------------------------------------------------------------------
// Funções auxiliares (mantidas para compatibilidade com consumidores legados)
// ---------------------------------------------------------------------------

/**
 * Gera string de QR Code para qualquer equipamento.
 * Para extintores, SEMPRE usa formato industrial (padrão).
 * Para outros tipos, usa apenas o ID/série.
 */
export function generateQrString(
  equipment: AnyEquipment | Record<string, unknown>,
  type: string,
  locationCode?: string,
  useIndustrialFormat: boolean = true
): string {
  const identifier = getEquipmentIdentifier(equipment, type);

  if (!identifier) {
    return '';
  }

  // Para extintores, SEMPRE usa formato industrial (padrão)
  if (type === 'extintor' && useIndustrialFormat) {
    const eq = equipment as Record<string, unknown>;
    const qrData: ExtinguisherQrData = {
      numero_identificacao: identifier,
      tipo_agente: eq.tipo_agente as string | undefined,
      capacidade: eq.capacidade as number | undefined,
      localizacao: eq.localizacao as string | undefined,
    };
    // Usa locationCode se fornecido, senão usa padrão "7036"
    return buildIndustrialQrString(qrData, locationCode || '7036');
  }

  // Para outros tipos, retorna apenas o ID/série
  return identifier;
}

/**
 * Obtém o nome do tipo de equipamento para exibição.
 */
export function getEquipmentTypeName(type: string, t: (key: string) => string): string {
  const typeMap: Record<string, string> = {
    extintor: t('equipment.extinguisher'),
    mangueira: t('equipment.hose'),
    scba: t('equipment.scba'),
    multigas: t('equipment.multigas'),
    camara_espuma: t('equipment.foamChamber'),
    canhao_monitor: t('equipment.cannonMonitor'),
    chuveiro_lavaolhos: t('equipment.eyewash'),
    alarme: t('equipment.alarm'),
    abrigo: t('equipment.shelter'),
  };
  return typeMap[type] || type;
}

/**
 * Obtém o nome do campo de identificação para um tipo de equipamento.
 */
export function getIdentifierFieldName(type: string): string {
  const fieldMap: Record<string, string> = {
    extintor: 'Nº Identificação',
    mangueira: 'ID Mangueira',
    scba: 'Nº Série',
    multigas: 'ID Equipamento',
    camara_espuma: 'ID Câmara',
    canhao_monitor: 'ID Equipamento',
    chuveiro_lavaolhos: 'ID Equipamento',
    alarme: 'ID Sistema',
    abrigo: 'ID Abrigo',
  };
  return fieldMap[type] || 'ID';
}
