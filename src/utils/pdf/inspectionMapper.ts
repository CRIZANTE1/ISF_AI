import type { InspectionData } from './types';

/**
 * Mapeia registro de inspeção do Supabase para o formato usado no PDF.
 */
export function mapInspectionForPdf(
  inspectionData: Record<string, unknown>,
  equipmentType?: string
): InspectionData {
  const data = inspectionData as Record<string, any>;
  const mapped: InspectionData & Record<string, unknown> = {
    id: data.id,
    data_inspecao:
      data.data_inspecao || data.data_servico || data.data_teste || data.inspected_at || '',
    status_geral:
      data.status_geral ||
      data.resultado_teste ||
      data.aprovado_inspecao ||
      data.overall_status ||
      data.resultado,
    tipo_servico: data.tipo_servico || data.tipo_inspecao || data.tipo_teste || data.inspection_type,
    tipo_inspecao: data.tipo_inspecao || data.tipo_teste || data.inspection_type,
    inspetor: data.inspetor || data.inspetor_responsavel || data.inspector_name,
    observacoes_gerais:
      data.observacoes_gerais || data.observacoes || data.corrective_action_notes,
    plano_de_acao: data.plano_de_acao || data.action_plan,
    link_foto_nao_conformidade: data.link_foto_nao_conformidade,
    resultados_json: data.resultados_json || data.checklist_json,
    latitude: data.latitude,
    longitude: data.longitude,
    data_proxima_inspecao: data.data_proxima_inspecao || data.data_proximo_teste || data.next_inspection_at,
    resultado: data.resultado,
  };

  if (equipmentType === 'extintor') {
    mapped.aprovado_inspecao = data.aprovado_inspecao;
    mapped.peso_medido_conjunto_kg = data.peso_medido_conjunto_kg;
    mapped.peso_cheio_placa_snapshot_kg = data.peso_cheio_placa_snapshot_kg;
    mapped.peso_cheio_placa_kg = data.peso_cheio_placa_kg;
    mapped.carga_nominal_kg = data.carga_nominal_kg;
    mapped.perda_kg = data.perda_kg;
    mapped.data_proxima_pesagem_co2 = data.data_proxima_pesagem_co2;
    mapped.data_proxima_manutencao_2_nivel = data.data_proxima_manutencao_2_nivel;
    mapped.data_proxima_manutencao_3_nivel = data.data_proxima_manutencao_3_nivel;
    mapped.data_ultimo_ensaio_hidrostatico = data.data_ultimo_ensaio_hidrostatico;
    if (!mapped.status_geral && data.aprovado_inspecao) {
      mapped.status_geral = data.aprovado_inspecao;
    }
  }

  if (equipmentType === 'multigas') {
    mapped.tipo_teste = data.tipo_teste;
    mapped.resultado_teste = data.resultado_teste;
    mapped.lel_referencia = data.lel_referencia ?? data.LEL_referencia;
    mapped.o2_referencia = data.o2_referencia ?? data.O2_referencia;
    mapped.h2s_referencia = data.h2s_referencia ?? data.H2S_referencia;
    mapped.co_referencia = data.co_referencia ?? data.CO_referencia;
    mapped.lel_encontrado = data.lel_encontrado ?? data.LEL_encontrado;
    mapped.o2_encontrado = data.o2_encontrado ?? data.O2_encontrado;
    mapped.h2s_encontrado = data.h2s_encontrado ?? data.H2S_encontrado;
    mapped.co_encontrado = data.co_encontrado ?? data.CO_encontrado;
  }

  if (equipmentType === 'mangueira') {
    mapped.resultado = data.resultado;
    if (!mapped.status_geral && data.resultado) {
      mapped.status_geral = data.resultado;
    }
  }

  if (equipmentType === 'reserva_tecnica') {
    mapped.level_reading = data.level_reading;
    mapped.condition = data.condition;
    mapped.suction_clean = data.suction_clean;
    mapped.overflow_clear = data.overflow_clear;
    mapped.corrective_action_needed = data.corrective_action_needed;
    mapped.inspection_type = data.inspection_type;
  }

  if (equipmentType === 'camara_espuma') {
    mapped.tipo_inspecao = data.tipo_inspecao;
    if (!mapped.status_geral && data.status_geral) {
      mapped.status_geral = data.status_geral;
    }
  }

  return mapped;
}

export function mapWaterReservoirInspectionForPdf(
  inspectionData: Record<string, unknown>
): InspectionData {
  return mapInspectionForPdf(inspectionData, 'reserva_tecnica');
}
