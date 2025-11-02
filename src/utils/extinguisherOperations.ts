/**
 * Utilitários para operações de extintores
 * Baseado nas funcionalidades do projeto Python ISF_IA_SUP
 */

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
      console.warn(`Data de serviço inválida: ${serviceDateStr}`);
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
    console.error(`Erro ao calcular datas: ${error}`);
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

