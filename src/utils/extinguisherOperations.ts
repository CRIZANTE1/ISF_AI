/**
 * Utilitários para operações de extintores
 * Baseado nas funcionalidades do projeto Python ISF_IA_SUP
 */

import { supabase } from '../lib/supabase';
import { logUserAction } from './adminOperations';
import { logger } from './logger';

// Mapeamento de ações para plano de ação baseado em não conformidades
const ACTION_MAP: Record<string, string> = {
  PINTURA: "Programar a repintura corretiva do extintor.",
  MANÔMETRO: "Realizar a substituição imediata do manômetro.",
  MANOMETRO: "Realizar a substituição imediata do manômetro.",
  GATILHO: "Realizar a substituição do conjunto de gatilho.",
  VÁLVULA: "Verificar e/ou substituir o conjunto da válvula.",
  VALVULA: "Verificar e/ou substituir o conjunto da válvula.",
  MANGOTE: "Realizar a substituição da mangueira/mangote.",
  MANGUEIRA: "Realizar a substituição da mangueira/mangote.",
  RECARGA: "Enviar o extintor para o processo de recarga.",
  RECARREGANDO: "Enviar o extintor para o processo de recarga.",
  LACRE: "Substituir lacre e verificar motivo da violação.",
  SINALIZAÇÃO: "Corrigir a sinalização de piso e/ou parede do equipamento.",
  SINALIZACAO: "Corrigir a sinalização de piso e/ou parede do equipamento.",
  SUPORTE: "Verificar e/ou substituir o suporte de parede/piso.",
  OBSTRUÇÃO: "Desobstruir o acesso ao equipamento e garantir visibilidade.",
  OBSTRUCAO: "Desobstruir o acesso ao equipamento e garantir visibilidade.",
  "DANO VISÍVEL": "Realizar inspeção detalhada para avaliar a integridade do casco. Se necessário, enviar para teste hidrostático.",
  "DANO VISIVEL": "Realizar inspeção detalhada para avaliar a integridade do casco. Se necessário, enviar para teste hidrostático.",
  VENCIDO: "Retirar de uso e enviar para manutenção (Nível 2 ou 3) imediatamente.",
  CORROSÃO: "Avaliar extensão da corrosão. Se superficial, limpar e pintar. Se profunda, reprovar equipamento.",
  CORROSAO: "Avaliar extensão da corrosão. Se superficial, limpar e pintar. Se profunda, reprovar equipamento.",
};

export interface EquipmentDates {
  data_proxima_inspecao?: string | null;
  data_proxima_manutencao_2_nivel?: string | null;
  data_proxima_manutencao_3_nivel?: string | null;
  data_ultimo_ensaio_hidrostatico?: string | null;
}

export interface InspectionRecord {
  aprovado_inspecao?: string;
  observacoes_gerais?: string;
}

export interface Extinguisher {
  id?: number;
  numero_identificacao: string;
  numero_selo_inmetro?: string;
  tipo_agente?: string;
  capacidade?: number;
  marca_fabricante?: string;
  ano_fabricacao?: number;
  tipo_servico?: string;
  data_servico?: string;
  inspetor_responsavel?: string;
  empresa_executante?: string;
  data_proxima_inspecao?: string;
  data_proxima_manutencao_2_nivel?: string;
  data_proxima_manutencao_3_nivel?: string;
  data_ultimo_ensaio_hidrostatico?: string;
  aprovado_inspecao?: string;
  observacoes_gerais?: string;
  plano_de_acao?: string;
  link_relatorio_pdf?: string;
  latitude?: number;
  longitude?: number;
  link_foto_nao_conformidade?: string;
  local_id?: string;
  created_at?: string;
  user_id?: string;
}

/**
 * Gera plano de ação baseado na aprovação e observações
 */
export function generateActionPlan(record: InspectionRecord): string {
  const aprovado = record.aprovado_inspecao?.trim() || '';
  const observacoes = (record.observacoes_gerais || '').toUpperCase().trim();

  // Caso 1: Equipamento aprovado
  if (aprovado === "Sim") {
    return "Manter em monitoramento periódico.";
  }

  // Caso 2: Equipamento não aprovado
  if (aprovado === "Não") {
    // Busca ação específica no mapa
    for (const [keyword, plan] of Object.entries(ACTION_MAP)) {
      if (observacoes.includes(keyword)) {
        return plan;
      }
    }

    // Se nenhuma palavra-chave for encontrada, retorna ação genérica
    if (observacoes) {
      return `Analisar e corrigir a não conformidade reportada: '${record.observacoes_gerais || 'Não especificado'}'`;
    } else {
      return "Equipamento reprovado. Avaliar não conformidade e tomar ação corretiva apropriada.";
    }
  }

  // Caso 3: Status indefinido
  return "N/A";
}

/**
 * Calcula as próximas datas de manutenção baseado no tipo de serviço
 */
export function calculateNextDates(
  serviceDateStr: string,
  serviceLevel: string,
  existingDates?: EquipmentDates
): EquipmentDates {
  if (!serviceDateStr) {
    return {};
  }

  try {
    const serviceDate = new Date(serviceDateStr);
    if (isNaN(serviceDate.getTime())) {
      logger.warn('Data de serviço inválida', 'equipment', { serviceDateStr });
      return {};
    }

    // Inicializa com datas existentes ou dicionário vazio
    const dates: EquipmentDates = existingDates ? { ...existingDates } : {};

    // Aplica regras de cálculo baseado no tipo de serviço
    if (serviceLevel === "Manutenção Nível 3") {
      // Renova todas as datas
      dates.data_proxima_inspecao = addMonths(serviceDate, 1).toISOString().split('T')[0];
      dates.data_proxima_manutencao_2_nivel = addMonths(serviceDate, 12).toISOString().split('T')[0];
      dates.data_proxima_manutencao_3_nivel = addYears(serviceDate, 5).toISOString().split('T')[0];
      dates.data_ultimo_ensaio_hidrostatico = serviceDate.toISOString().split('T')[0];
    } else if (serviceLevel === "Manutenção Nível 2") {
      // Renova inspeção mensal e N2, preserva N3 se existir
      dates.data_proxima_inspecao = addMonths(serviceDate, 1).toISOString().split('T')[0];
      dates.data_proxima_manutencao_2_nivel = addMonths(serviceDate, 12).toISOString().split('T')[0];
      // Não altera data_proxima_manutencao_3_nivel nem data_ultimo_ensaio_hidrostatico
    } else if (serviceLevel === "Inspeção" || serviceLevel === "Substituição") {
      // Renova apenas a inspeção mensal
      dates.data_proxima_inspecao = addMonths(serviceDate, 1).toISOString().split('T')[0];
      // Preserva todas as outras datas
    }

    // Normaliza todas as datas
    const normalizedDates: EquipmentDates = {};
    for (const [key, value] of Object.entries(dates)) {
      if (value === null || value === undefined || value === '') {
        normalizedDates[key as keyof EquipmentDates] = null;
      } else if (typeof value === 'string') {
        // Valida e formata string de data
        try {
          const parsedDate = new Date(value);
          if (!isNaN(parsedDate.getTime())) {
            normalizedDates[key as keyof EquipmentDates] = parsedDate.toISOString().split('T')[0];
          } else {
            normalizedDates[key as keyof EquipmentDates] = null;
          }
        } catch {
          normalizedDates[key as keyof EquipmentDates] = null;
        }
      } else {
        normalizedDates[key as keyof EquipmentDates] = null;
      }
    }

    return normalizedDates;
  } catch (error) {
    logger.error('Erro ao calcular datas', 'equipment', error);
    return {};
  }
}

/**
 * Adiciona meses a uma data
 */
function addMonths(date: Date, months: number): Date {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
}

/**
 * Adiciona anos a uma data
 */
function addYears(date: Date, years: number): Date {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
}

/**
 * Formata datas para exibição
 */
export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'N/A';
    return date.toLocaleDateString('pt-BR');
  } catch {
    return 'N/A';
  }
}

/**
 * Verifica se uma data está vencida
 */
export function isDateExpired(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    return date < today;
  } catch {
    return false;
  }
}

/**
 * Calcula dias até vencimento
 */
export function daysUntilExpiration(dateStr: string | null | undefined): number | null {
  if (!dateStr) return null;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  } catch {
    return null;
  }
}

/**
 * Busca todos os extintores
 */
export async function getAllExtinguishers(): Promise<Extinguisher[]> {
  try {
    const { data, error } = await supabase
      .from('extintores')
      .select('*')
      .order('numero_identificacao');

    if (error) throw error;
    return data || [];
  } catch (error) {
    logger.error('Erro ao buscar extintores', 'equipment', error);
    return [];
  }
}

/**
 * Busca um extintor por ID
 */
export async function getExtinguisherById(numeroIdentificacao: string): Promise<Extinguisher | null> {
  try {
    const { data, error } = await supabase
      .from('extintores')
      .select('*')
      .eq('numero_identificacao', numeroIdentificacao)
      .order('data_servico', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Erro ao buscar extintor', 'equipment', error);
    return null;
  }
}

/**
 * Salva um novo extintor
 */
export async function saveNewExtinguisher(
  extinguisher: Omit<Extinguisher, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Verifica se já existe
    const { data: existing } = await supabase
      .from('extintores')
      .select('numero_identificacao')
      .eq('numero_identificacao', extinguisher.numero_identificacao)
      .limit(1)
      .single();

    if (existing) {
      throw new Error(`Extintor com ID '${extinguisher.numero_identificacao}' já existe.`);
    }

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('extintores', extinguisher);
    
    if (!result.success) {
      throw new Error('Falha ao salvar extintor');
    }
    
    // Log action
    try {
      await logUserAction('create', 'equipment', extinguisher.numero_identificacao, {
        type: 'extintor',
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar extintor', 'equipment', error);
    throw error;
  }
}

/**
 * Salva uma inspeção de extintor
 */
export async function saveExtinguisherInspection(
  inspection: Omit<Extinguisher, 'id' | 'created_at'>
): Promise<boolean> {
  try {
    // Gera plano de ação
    const planoDeAcao = generateActionPlan({
      aprovado_inspecao: inspection.aprovado_inspecao,
      observacoes_gerais: inspection.observacoes_gerais,
    });

    // Calcula próximas datas
    const existingDates: EquipmentDates = {
      data_proxima_manutencao_2_nivel: inspection.data_proxima_manutencao_2_nivel || null,
      data_proxima_manutencao_3_nivel: inspection.data_proxima_manutencao_3_nivel || null,
      data_ultimo_ensaio_hidrostatico: inspection.data_ultimo_ensaio_hidrostatico || null,
    };

    const nextDates = calculateNextDates(
      inspection.data_servico || new Date().toISOString().split('T')[0],
      inspection.tipo_servico || 'Inspeção',
      existingDates
    );

    const inspectionData: Omit<Extinguisher, 'id' | 'created_at'> = {
      ...inspection,
      plano_de_acao: planoDeAcao,
      ...nextDates,
    };

    // Usa wrapper offline para suportar modo offline
    const { offlineInsert } = await import('./offlineOperations');
    const result = await offlineInsert('extintores', inspectionData);
    
    if (!result.success) {
      throw new Error('Falha ao salvar inspeção');
    }
    
    // Log action
    try {
      await logUserAction('create', 'inspection', inspection.numero_identificacao, {
        type: 'extintor',
        tipo_servico: inspection.tipo_servico,
        aprovado: inspection.aprovado_inspecao,
      });
    } catch (logError) {
      logger.error('Failed to log action', 'equipment', logError);
    }
    
    return true;
  } catch (error) {
    logger.error('Erro ao salvar inspeção de extintor', 'equipment', error);
    throw error;
  }
}

/**
 * Registra baixa de extintor
 */
export async function registerExtinguisherDisposal(
  numeroIdentificacao: string,
  motivoCondenacao: string,
  responsavelBaixa: string,
  numeroSubstituto?: string,
  observacoes?: string,
  linkFoto?: string
): Promise<boolean> {
  try {
    // Salva no log de baixa
    const { error: logError } = await supabase
      .from('log_baixa_extintores')
      .insert({
        numero_identificacao: numeroIdentificacao,
        motivo_condenacao: motivoCondenacao,
        responsavel_baixa: responsavelBaixa,
        numero_identificacao_substituto: numeroSubstituto || null,
        observacoes: observacoes || null,
        link_foto_evidencia: linkFoto || null,
        data_baixa: new Date().toISOString().split('T')[0],
      });

    if (logError) throw logError;

    // Marca o equipamento como baixado
    const { error: updateError } = await supabase
      .from('extintores')
      .insert({
        numero_identificacao: numeroIdentificacao,
        tipo_servico: 'Baixa Definitiva',
        data_servico: new Date().toISOString().split('T')[0],
        aprovado_inspecao: 'N/A',
        observacoes_gerais: `EQUIPAMENTO BAIXADO - ${motivoCondenacao}`,
        plano_de_acao: `BAIXADO DEFINITIVAMENTE - SUBSTITUTO: ${numeroSubstituto || 'AGUARDANDO'}`,
      });

    if (updateError) throw updateError;
    return true;
  } catch (error) {
    logger.error('Erro ao registrar baixa de extintor', 'equipment', error);
    return false;
  }
}
