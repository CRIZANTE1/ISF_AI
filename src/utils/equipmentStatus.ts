/**
 * Utilitários para calcular status de equipamentos baseado em datas
 */

export type EquipmentStatus = 'ok' | 'vencido' | 'pendente';

interface EquipmentWithDates {
  data_proxima_inspecao?: string | null;
  data_proxima_manutencao_2_nivel?: string | null;
  data_proxima_manutencao_3_nivel?: string | null;
  data_ultimo_ensaio_hidrostatico?: string | null;
  data_validade?: string | null;
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
 * Verifica se uma data está próxima de vencer (dentro de 30 dias, mas ainda não vencida)
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
    
    // Pendente se está entre hoje e 30 dias no futuro (mas não vencida)
    return diffDays >= 0 && diffDays <= 30;
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
  if (equipment.data_ultimo_ensaio_hidrostatico) {
    dates.push(equipment.data_ultimo_ensaio_hidrostatico);
  }
  
  // Data de validade (SCBA e outros)
  if (equipment.data_validade) {
    dates.push(equipment.data_validade);
  }
  
  return dates.filter(Boolean);
}

/**
 * Calcula o status de um equipamento baseado em suas datas
 */
export function calculateEquipmentStatus(equipment: EquipmentWithDates): EquipmentStatus {
  const dates = getRelevantDates(equipment);
  
  // Se não tem datas, considera como OK (sem informações)
  if (dates.length === 0) {
    return 'ok';
  }
  
  // Verifica se alguma data está vencida
  const hasExpired = dates.some(date => isDateExpired(date));
  if (hasExpired) {
    return 'vencido';
  }
  
  // Verifica se alguma data está pendente (próxima de vencer)
  const hasPending = dates.some(date => isDatePending(date));
  if (hasPending) {
    return 'pendente';
  }
  
  // Se todas as datas estão OK (não vencidas e não pendentes)
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

