/**
 * Utilitários para geração de QR Codes para qualquer tipo de equipamento
 */

import { buildIndustrialQrString, ExtinguisherQrData } from './qrInspectionUtils';

/**
 * Obtém o ID ou número de série de um equipamento baseado no tipo
 */
export function getEquipmentIdentifier(equipment: any, type: string): string | null {
  switch (type) {
    case 'extintor':
      return equipment.numero_identificacao || null;
    case 'mangueira':
      return equipment.id_mangueira || null;
    case 'scba':
      return equipment.numero_serie_equipamento || null;
    case 'multigas':
      return equipment.id_equipamento || null;
    case 'camara_espuma':
      return equipment.id_camara || null;
    case 'canhao_monitor':
      return equipment.id_equipamento || null;
    case 'chuveiro_lavaolhos':
      return equipment.id_equipamento || null;
    case 'alarme':
      return equipment.id_sistema || null;
    case 'abrigo':
      return equipment.id_abrigo || null;
    default:
      return equipment.equipment_id || equipment.id || null;
  }
}

/**
 * Busca um equipamento por ID ou número de série em todos os tipos
 */
export function findEquipmentByIdentifier(
  allEquipment: {
    extinguishers: any[];
    hoses: any[];
    scbas: any[];
    multigasDetectors: any[];
    foamChambers: any[];
    cannonMonitors: any[];
    eyewashStations: any[];
    alarmSystems: any[];
    shelters: any[];
  },
  identifier: string
): { equipment: any; type: string } | null {
  const searchInList = (list: any[], type: string): { equipment: any; type: string } | null => {
    for (const item of list) {
      const id = getEquipmentIdentifier(item, type);
      if (id && (id === identifier || id.toString() === identifier)) {
        return { equipment: item, type };
      }
    }
    return null;
  };

  // Busca em todos os tipos de equipamentos
  const types = [
    { list: allEquipment.extinguishers, type: 'extintor' },
    { list: allEquipment.hoses, type: 'mangueira' },
    { list: allEquipment.scbas, type: 'scba' },
    { list: allEquipment.multigasDetectors, type: 'multigas' },
    { list: allEquipment.foamChambers, type: 'camara_espuma' },
    { list: allEquipment.cannonMonitors, type: 'canhao_monitor' },
    { list: allEquipment.eyewashStations, type: 'chuveiro_lavaolhos' },
    { list: allEquipment.alarmSystems, type: 'alarme' },
    { list: allEquipment.shelters, type: 'abrigo' },
  ];

  for (const { list, type } of types) {
    const result = searchInList(list, type);
    if (result) return result;
  }

  return null;
}

/**
 * Gera string de QR Code para qualquer equipamento
 * Para extintores, SEMPRE usa formato industrial (padrão)
 * Para outros tipos, usa apenas o ID/série
 */
export function generateQrString(
  equipment: any,
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
    const qrData: ExtinguisherQrData = {
      numero_identificacao: identifier,
      tipo_agente: equipment.tipo_agente,
      capacidade: equipment.capacidade,
      localizacao: equipment.localizacao,
    };
    // Usa locationCode se fornecido, senão usa padrão "7036"
    return buildIndustrialQrString(qrData, locationCode || '7036');
  }

  // Para outros tipos, retorna apenas o ID/série
  return identifier;
}

/**
 * Obtém o nome do tipo de equipamento para exibição
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
 * Obtém o nome do campo de identificação para um tipo de equipamento
 */
export function getIdentifierFieldName(type: string, t: (key: string) => string): string {
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

