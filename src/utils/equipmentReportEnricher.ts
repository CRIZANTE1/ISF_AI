import { supabase } from '../lib/supabase';
import { logger } from './logger';

export interface EnrichedEquipmentForReport {
  _reportId: string;
  _has_last_inspection?: boolean;
  _last_inspection_date?: string | null;
  _last_inspection_status?: string | null;
  _last_inspection_type?: string | null;
  _last_inspector?: string | null;
  _equipmentType?: string;
  resultados_json?: Record<string, unknown> | null;
  latitude?: number | null;
  longitude?: number | null;
  link_foto_nao_conformidade?: string | null;
  observacoes?: string | null;
  plano_de_acao?: string | null;
  [key: string]: any;
}

interface InspectionConfig {
  table: string;
  idField: string;
  dateField: string;
  equipmentIdField: string;
  observacoesField?: string;
  extraFilter?: Record<string, string>;
}

const INSPECTION_CONFIGS: Record<string, InspectionConfig> = {
  extintor: {
    table: 'inspecoes_extintores',
    idField: 'numero_identificacao',
    dateField: 'data_servico',
    equipmentIdField: 'numero_identificacao',
    observacoesField: 'observacoes_gerais',
  },
  mangueira: {
    table: 'inspecoes_mangueiras',
    idField: 'id_mangueira',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_mangueira',
    observacoesField: 'observacoes',
  },
  scba: {
    table: 'inspecoes_scba',
    idField: 'numero_serie_equipamento',
    dateField: 'data_inspecao',
    equipmentIdField: 'numero_serie_equipamento',
  },
  multigas: {
    table: 'inspecoes_multigas',
    idField: 'id_equipamento',
    dateField: 'data_teste',
    equipmentIdField: 'id_equipamento',
    observacoesField: 'observacoes',
  },
  camara_espuma: {
    table: 'inspecoes_camaras_espuma',
    idField: 'id_camara',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_camara',
    observacoesField: 'observacoes_gerais',
  },
  canhao_monitor: {
    table: 'inspecoes_canhoes_monitores',
    idField: 'id_equipamento',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_equipamento',
  },
  chuveiro_lavaolhos: {
    table: 'inspecoes_chuveiros_lava_olhos',
    idField: 'id_equipamento',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_equipamento',
  },
  alarme: {
    table: 'inspecoes_alarmes',
    idField: 'id_sistema',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_sistema',
  },
  abrigo: {
    table: 'inspecoes_abrigos',
    idField: 'id_abrigo',
    dateField: 'data_inspecao',
    equipmentIdField: 'id_abrigo',
  },
  reserva_tecnica: {
    table: 'water_reservoir_inspections',
    idField: 'reservoir_id',
    dateField: 'inspected_at',
    equipmentIdField: 'id',
    observacoesField: 'corrective_action_notes',
  },
};

function getInspectionConfig(equipmentType: string, customTypeId?: string): InspectionConfig | null {
  if (equipmentType.startsWith('custom-')) {
    return {
      table: 'custom_equipment_inspections',
      idField: 'id_equipamento',
      dateField: 'data_inspecao',
      equipmentIdField: 'id_equipamento',
      extraFilter: customTypeId ? { equipment_type_id: customTypeId } : undefined,
    };
  }
  return INSPECTION_CONFIGS[equipmentType] || null;
}

function getEquipmentReportId(item: Record<string, any>, equipmentIdField: string): string {
  return String(
    item[equipmentIdField] ||
      item.equipment_id ||
      item.id_mangueira ||
      item.numero_serie_equipamento ||
      item.id_equipamento ||
      item.id_camara ||
      item.id_sistema ||
      item.id_abrigo ||
      item.numero_identificacao ||
      item.id
  );
}

function extractObservacoes(insp: Record<string, any>, observacoesField?: string): string | null {
  if (observacoesField && insp[observacoesField]) {
    return insp[observacoesField];
  }
  return insp.observacoes_gerais || insp.observacoes || null;
}

function mapWithoutInspection(
  equipmentList: any[],
  equipmentIdField: string,
  equipmentType?: string
): EnrichedEquipmentForReport[] {
  return equipmentList.map((item) => ({
    ...item,
    _reportId: getEquipmentReportId(item, equipmentIdField),
    _equipmentType: equipmentType,
    latitude: item.latitude ?? null,
    longitude: item.longitude ?? null,
  }));
}

/**
 * Enriquece a lista de equipamentos com dados da última inspeção para o relatório de inventário.
 */
export async function enrichEquipmentForReport(
  equipmentList: any[],
  equipmentType: string,
  userId: string
): Promise<EnrichedEquipmentForReport[]> {
  if (!equipmentList.length) return [];

  let customTypeId: string | undefined;
  if (equipmentType.startsWith('custom-')) {
    const slug = equipmentType.replace('custom-', '');
    const { getAllCustomEquipmentTypes } = await import('./customEquipmentOperations');
    const types = await getAllCustomEquipmentTypes();
    customTypeId = types.find((t) => t.slug === slug)?.id;
  }

  const config = getInspectionConfig(equipmentType, customTypeId);
  if (!config) {
    return mapWithoutInspection(equipmentList, 'id_equipamento', equipmentType);
  }

  const selectFields = [
    config.idField,
    config.dateField,
    'latitude',
    'longitude',
    'link_foto_nao_conformidade',
    'plano_de_acao',
    'created_at',
    'status_geral',
    'tipo_inspecao',
    'tipo_servico',
    'inspetor',
    'inspetor_responsavel',
    'resultados_json',
  ];

  if (config.observacoesField) {
    selectFields.push(config.observacoesField);
  } else {
    selectFields.push('observacoes_gerais', 'observacoes');
  }

  if (equipmentType === 'reserva_tecnica') {
    selectFields.length = 0;
    selectFields.push(
      'reservoir_id',
      'inspected_at',
      'overall_status',
      'level_reading',
      'condition',
      'action_plan',
      'corrective_action_notes',
      'created_at'
    );
  }

  if (equipmentType.startsWith('custom-')) {
    selectFields.push('equipment_type_id', 'id_equipamento');
  }

  try {
    let query = supabase
      .from(config.table as any)
      .select(selectFields.join(', '))
      .order(config.dateField, { ascending: false })
      .order('created_at', { ascending: false });

    if (equipmentType === 'reserva_tecnica') {
      const reservoirIds = equipmentList.map((item) => String(item.id)).filter(Boolean);
      if (reservoirIds.length === 0) {
        return mapWithoutInspection(equipmentList, config.equipmentIdField, equipmentType);
      }
      query = query.in('reservoir_id', reservoirIds);
    } else {
      query = query.eq('user_id', userId);
    }

    if (config.extraFilter) {
      for (const [key, value] of Object.entries(config.extraFilter)) {
        query = query.eq(key, value);
      }
    }

    const { data: allInspections, error } = await query;

    if (error) {
      logger.warn(`Erro ao buscar inspeções para relatório (${equipmentType})`, 'pdf', error);
      return mapWithoutInspection(equipmentList, config.equipmentIdField, equipmentType);
    }

    const inspectionMap = new Map<string, Record<string, any>>();
    if (allInspections && Array.isArray(allInspections)) {
      for (const insp of allInspections) {
        const key = String(insp[config.idField]);
        if (key && !inspectionMap.has(key)) {
          inspectionMap.set(key, insp);
        }
      }
    }

    return equipmentList.map((item) => {
      const reportId = getEquipmentReportId(item, config.equipmentIdField);
      const lastInspection = inspectionMap.get(reportId);

      if (!lastInspection) {
        return {
          ...item,
          _reportId: reportId,
          _equipmentType: equipmentType,
          latitude: item.latitude ?? null,
          longitude: item.longitude ?? null,
        };
      }

      return {
        ...item,
        _reportId: reportId,
        _equipmentType: equipmentType,
        _has_last_inspection: true,
        _last_inspection_date: lastInspection[config.dateField] ?? null,
        _last_inspection_status:
          lastInspection.status_geral ||
          lastInspection.aprovado_inspecao ||
          lastInspection.resultado_teste ||
          lastInspection.overall_status ||
          null,
        _last_inspection_type:
          lastInspection.tipo_inspecao ||
          lastInspection.tipo_servico ||
          lastInspection.tipo_teste ||
          null,
        _last_inspector:
          lastInspection.inspetor ||
          lastInspection.inspetor_responsavel ||
          lastInspection.inspector_name ||
          null,
        resultados_json: lastInspection.resultados_json ?? null,
        latitude: lastInspection.latitude ?? item.latitude ?? null,
        longitude: lastInspection.longitude ?? item.longitude ?? null,
        link_foto_nao_conformidade: lastInspection.link_foto_nao_conformidade ?? null,
        observacoes: extractObservacoes(lastInspection, config.observacoesField),
        plano_de_acao:
          lastInspection.plano_de_acao ??
          lastInspection.action_plan ??
          null,
      };
    });
  } catch (err) {
    logger.error('Erro ao enriquecer equipamentos para relatório', 'pdf', err);
    return mapWithoutInspection(equipmentList, config.equipmentIdField, equipmentType);
  }
}
