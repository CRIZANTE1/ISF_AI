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
