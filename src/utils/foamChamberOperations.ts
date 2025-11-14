/**
 * Utilitários para operações de câmaras de espuma
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';

export interface FoamChamber {
  id?: number;
  id_camara: string;
  localizacao?: string;
  marca?: string;
  modelo?: string;
  tamanho_especifico?: string;
  data_cadastro?: string;
  created_at?: string;
  user_id?: string;
}

export interface FoamChamberInspection {
  id?: number;
  data_inspecao?: string;
  id_camara: string;
  tipo_inspecao?: string;
  status_geral?: string;
  plano_de_acao?: string;
  resultados_json?: Record<string, any>;
  link_foto_nao_conformidade?: string;
  inspetor?: string;
  data_proxima_inspecao?: string;
  latitude?: number;
  longitude?: number;
  created_at?: string;
  user_id?: string;
}

const ACTION_PLAN_MAP: Record<string, string> = {
  "Pintura e estrutura sem corrosão ou amassados": "Programar serviço de tratamento de corrosão, reparo e repintura.",
  "Sem vazamentos visíveis no tanque e conexões": "Identificar ponto de vazamento, substituir juntas/vedações ou reparar a conexão.",
  "Válvulas em bom estado e lubrificadas": "Realizar a limpeza, lubrificação ou substituição da válvula defeituosa.",
  "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)": "Avaliar a integridade estrutural. Se comprometida, programar a substituição da câmara.",
  "Selo de vidro limpo, íntegro e bem fixado": "Realizar a limpeza ou substituição do selo de vidro caso esteja sujo ou trincado.",
  "Junta de vedação em boas condições": "Substituir a junta de vedação ressecada ou danificada.",
  "Defletor e barragem de espuma íntegros": "Reparar ou substituir o defletor/barragem de espuma danificado.",
  "Tomadas de solução e linhas sem obstrução": "Realizar a desobstrução e limpeza completa das linhas de solução.",
  "Drenos livres e estanques": "Desobstruir e verificar a estanqueidade dos drenos.",
  "Ejetores e orifícios desobstruídos": "Realizar a limpeza e desobstrução dos ejetores e orifícios.",
  "Placa de orifício íntegra e sem obstruções": "Inspecionar, limpar ou substituir a placa de orifício conforme necessário.",
  "Placa de orifício compatível com o modelo da câmara": "CRÍTICO: Substituir a placa de orifício por uma compatível com o modelo da câmara.",
};

/**
 * Gera plano de ação para câmaras de espuma
 */
export function generateFoamChamberActionPlan(nonConformities: string[]): string {
  if (nonConformities.length === 0) {
    return "Manter em monitoramento periódico.";
  }
  const firstIssue = nonConformities[0];
  return ACTION_PLAN_MAP[firstIssue] || "Corrigir a não conformidade reportada.";
}

/**
 * Salva uma nova câmara de espuma
 */
export async function saveNewFoamChamber(
  chamber: Omit<FoamChamber, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    const { data: existing } = await supabase
      .from('inventario_camaras_espuma')
      .select('id_camara')
      .eq('id_camara', chamber.id_camara)
      .single();

    if (existing) {
      throw new Error(`Câmara com ID '${chamber.id_camara}' já existe.`);
    }

    const { error } = await supabase
      .from('inventario_camaras_espuma')
      .insert(chamber);

    if (error) throw error;
    
    // Log action
    try {
      await logUserAction('create', 'equipment', chamber.id_camara, {
        type: 'camara_espuma',
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar câmara de espuma:', error);
    throw error;
  }
}

/**
 * Salva uma inspeção de câmara de espuma
 */
export async function saveFoamChamberInspection(
  inspection: Omit<FoamChamberInspection, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Extrai não conformidades dos resultados
    const nonConformities: string[] = [];
    if (inspection.resultados_json) {
      for (const [question, status] of Object.entries(inspection.resultados_json)) {
        if (status === "Não Conforme") {
          nonConformities.push(question);
        }
      }
    }

    const planoDeAcao = generateFoamChamberActionPlan(nonConformities);

    const { error } = await supabase
      .from('inspecoes_camaras_espuma')
      .insert({
        ...inspection,
        plano_de_acao: planoDeAcao,
      });

    if (error) throw error;
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.id_camara, {
        type: 'camara_espuma',
        tipo_inspecao: inspection.tipo_inspecao,
        status: inspection.status_geral,
      });
    } catch (logError) {
      console.error('Failed to log action:', logError);
    }
    
    return true;
  } catch (error) {
    console.error('Erro ao salvar inspeção de câmara de espuma:', error);
    return false;
  }
}

/**
 * Busca todas as câmaras de espuma
 */
export async function getAllFoamChambers(): Promise<FoamChamber[]> {
  try {
    const { data, error } = await supabase
      .from('inventario_camaras_espuma')
      .select('*')
      .order('id_camara');

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Erro ao buscar câmaras de espuma:', error);
    return [];
  }
}

