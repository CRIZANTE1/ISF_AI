/**
 * Utilitários para classificação e verificação de prazos de planos de ação
 */

export type ActionPlanPriority = 'critical' | 'important' | 'normal';

export interface ActionPlanStatus {
  priority: ActionPlanPriority;
  daysRemaining: number;
  isOverdue: boolean;
  deadline: Date;
}

/**
 * Palavras-chave que indicam planos críticos
 */
const CRITICAL_KEYWORDS = [
  'crítico',
  'critico',
  'imediata',
  'imediato',
  'urgente',
  'comprometido',
  'substituição imediata',
  'retirar de uso',
  'baixado',
  'vencido',
  'ação imediata necessária',
  'sistema pode estar comprometido',
  'placa de orifício compatível',
];

/**
 * Palavras-chave que indicam planos importantes
 */
const IMPORTANT_KEYWORDS = [
  'importante',
  'manutenção',
  'substituição',
  'reparo',
  'corrigir',
  'avaliar',
  'programar',
  'agendar',
  'manutenção preventiva',
  'realizar',
];

/**
 * Classifica a prioridade de um plano de ação baseado em palavras-chave
 */
export function classifyActionPlanPriority(actionPlan: string): ActionPlanPriority {
  if (!actionPlan || actionPlan.trim() === '') {
    return 'normal';
  }

  const planLower = actionPlan.toLowerCase();

  // Verifica se é crítico
  const isCritical = CRITICAL_KEYWORDS.some(keyword => planLower.includes(keyword));
  if (isCritical) {
    return 'critical';
  }

  // Verifica se é importante
  const isImportant = IMPORTANT_KEYWORDS.some(keyword => planLower.includes(keyword));
  if (isImportant) {
    return 'important';
  }

  return 'normal';
}

/**
 * Calcula o prazo em dias baseado na prioridade
 */
export function getActionPlanDeadlineDays(priority: ActionPlanPriority): number {
  switch (priority) {
    case 'critical':
      return 30;
    case 'important':
      return 60;
    case 'normal':
      return 90;
    default:
      return 90;
  }
}

/**
 * Verifica o status de um plano de ação baseado na data de criação
 */
export function getActionPlanStatus(
  actionPlan: string,
  createdAt: string | Date
): ActionPlanStatus {
  const priority = classifyActionPlanPriority(actionPlan);
  const deadlineDays = getActionPlanDeadlineDays(priority);
  
  const createdDate = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const deadline = new Date(createdDate);
  deadline.setDate(deadline.getDate() + deadlineDays);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  deadline.setHours(23, 59, 59, 999);
  
  const diffTime = deadline.getTime() - today.getTime();
  const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  const isOverdue = daysRemaining < 0;

  return {
    priority,
    daysRemaining: isOverdue ? Math.abs(daysRemaining) : daysRemaining,
    isOverdue,
    deadline,
  };
}

/**
 * Verifica se um plano de ação está vencido
 */
export function isActionPlanOverdue(
  actionPlan: string,
  createdAt: string | Date
): boolean {
  const status = getActionPlanStatus(actionPlan, createdAt);
  return status.isOverdue;
}

/**
 * Obtém a mensagem de status do plano de ação
 */
export function getActionPlanStatusMessage(status: ActionPlanStatus): string {
  if (status.isOverdue) {
    return `Vencido há ${status.daysRemaining} dia(s)`;
  }
  
  if (status.daysRemaining === 0) {
    return 'Vence hoje';
  }
  
  if (status.daysRemaining <= 7) {
    return `Vence em ${status.daysRemaining} dia(s)`;
  }
  
  return `${status.daysRemaining} dias restantes`;
}

