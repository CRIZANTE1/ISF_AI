/**
 * Utilitários para calcular status de equipamentos baseado em datas
 */

export type EquipmentStatus = 'ok' | 'vencido' | 'pendente';

interface EquipmentWithDates {
  data_proxima_inspecao?: string | null;
  data_proxima_manutencao_2_nivel?: string | null;
  data_proxima_manutencao_3_nivel?: string | null;
  data_validade?: string | null;
  aprovado_inspecao?: string | null; // 'Sim', 'Não', 'Pendente'
  status?: string | null; // Status geral do equipamento
  status_geral?: string | null; // Status geral alternativo
  [key: string]: any;
}

/**
 * Verifica se uma data está vencida
 */
function isDateExpired(dateStr: string | null | undefined): boolean {
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
 * Verifica se uma data está próxima de vencer (dentro de 15 dias, mas ainda não vencida)
 * Para inspeções mensais, considera pendente quando está próximo do vencimento
 */
function isDatePending(dateStr: string | null | undefined): boolean {
  if (!dateStr) return false;
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    date.setHours(0, 0, 0, 0);
    
    // Se já venceu, não é pendente (é vencido)
    if (date < today) return false;
    
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // Para inspeções mensais: pendente se está entre hoje e 15 dias no futuro
    // Isso alerta quando a inspeção está próxima de vencer
    return diffDays >= 0 && diffDays <= 15;
  } catch {
    return false;
  }
}

/**
 * Obtém todas as datas relevantes de um equipamento
 */
function getRelevantDates(equipment: EquipmentWithDates): string[] {
  const dates: string[] = [];
  
  // Datas comuns a todos os equipamentos
  if (equipment.data_proxima_inspecao) {
    dates.push(equipment.data_proxima_inspecao);
  }
  
  // Datas específicas de extintores
  if (equipment.data_proxima_manutencao_2_nivel) {
    dates.push(equipment.data_proxima_manutencao_2_nivel);
  }
  if (equipment.data_proxima_manutencao_3_nivel) {
    dates.push(equipment.data_proxima_manutencao_3_nivel);
  }
  // data_ultimo_ensaio_hidrostatico é a data em que o ensaio FOI realizado (sempre no passado),
  // não a próxima data de vencimento — o prazo do ensaio é data_proxima_manutencao_3_nivel.
  
  // Data de validade (SCBA e outros)
  if (equipment.data_validade) {
    dates.push(equipment.data_validade);
  }
  
  return dates.filter(Boolean);
}

/**
 * Calcula o status de um equipamento baseado em suas datas e status de aprovação
 */
export function calculateEquipmentStatus(equipment: EquipmentWithDates): EquipmentStatus {
  // PRIORIDADE 1: Verifica status_geral (campo principal usado no banco: 'aprovado', 'pendente', 'reprovado')
  const statusGeral = (equipment.status_geral || equipment.status || '').toLowerCase().trim();
  
  // Se status_geral está definido, usa ele como prioridade
  if (statusGeral) {
    if (statusGeral === 'aprovado' || statusGeral === 'ok') {
      // Se está aprovado, verifica apenas datas (não pode estar vencido)
      const dates = getRelevantDates(equipment);
      const hasExpired = dates.some(date => isDateExpired(date));
      if (hasExpired) {
        return 'vencido';
      }
      // Se não está vencido e está aprovado, está OK
      return 'ok';
    }
    
    if (statusGeral === 'reprovado' || statusGeral === 'não conforme' || statusGeral === 'nao conforme' || statusGeral === 'nao_conforme') {
      return 'pendente';
    }
    
    if (statusGeral === 'pendente') {
      return 'pendente';
    }
  }
  
  // PRIORIDADE 2: Verifica aprovado_inspecao (campo alternativo: 'Sim', 'Não', 'Pendente')
  const aprovado = (equipment.aprovado_inspecao || '').toLowerCase().trim();
  
  if (aprovado === 'sim') {
    // Se está aprovado, verifica apenas datas
    const dates = getRelevantDates(equipment);
    const hasExpired = dates.some(date => isDateExpired(date));
    if (hasExpired) {
      return 'vencido';
    }
    return 'ok';
  }
  
  if (aprovado === 'não' || aprovado === 'nao' || aprovado === 'pendente') {
    return 'pendente';
  }
  
  const dates = getRelevantDates(equipment);
  
  // PRIORIDADE 3: Verifica se alguma data está vencida
  const hasExpired = dates.some(date => isDateExpired(date));
  if (hasExpired) {
    return 'vencido';
  }
  
  // PRIORIDADE 4: Verifica se alguma data está pendente (próxima de vencer)
  const hasPending = dates.some(date => isDatePending(date));
  if (hasPending) {
    return 'pendente';
  }
  
  // Se não tem status definido e não tem datas, considera OK (equipamento novo ou sem inspeção)
  if (dates.length === 0 && !statusGeral && !aprovado) {
    return 'ok';
  }
  
  // Se tem datas OK mas não tem status de aprovação definido, considera OK
  // (não queremos marcar como pendente se não há informação clara de reprovação)
  return 'ok';
}

/**
 * Calcula estatísticas de uma lista de equipamentos
 */
export function calculateEquipmentStats(equipments: EquipmentWithDates[]): {
  total: number;
  ok: number;
  vencido: number;
  pendente: number;
} {
  const stats = {
    total: equipments.length,
    ok: 0,
    vencido: 0,
    pendente: 0,
  };
  
  equipments.forEach(equipment => {
    const status = calculateEquipmentStatus(equipment);
    stats[status]++;
  });
  
  return stats;
}

