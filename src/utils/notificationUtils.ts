import { notificationService } from '../services/notificationService';

/**
 * Envia notificação quando um equipamento está vencido ou próximo de vencer
 */
export async function notifyEquipmentExpiring(
  equipmentId: string,
  equipmentType: string,
  daysUntilExpiration: number
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const isExpired = daysUntilExpiration <= 0;
  const title = isExpired 
    ? `⚠️ Equipamento Vencido`
    : `⏰ Equipamento Próximo do Vencimento`;
  
  const body = isExpired
    ? `${equipmentType} (${equipmentId}) está vencido e precisa de atenção imediata.`
    : `${equipmentType} (${equipmentId}) vence em ${daysUntilExpiration} dia${daysUntilExpiration !== 1 ? 's' : ''}.`;

  await notificationService.showLocalNotification(title, body, {
    tag: `equipment-${equipmentId}`,
    url: `/equipment/${equipmentId}`,
    equipmentId,
    equipmentType,
  });
}

/**
 * Envia notificação para múltiplos equipamentos vencidos
 */
export async function notifyMultipleEquipmentExpiring(count: number): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const title = `⚠️ ${count} Equipamento${count !== 1 ? 's' : ''} Vencido${count !== 1 ? 's' : ''}`;
  const body = `Você tem ${count} equipamento${count !== 1 ? 's' : ''} que ${count !== 1 ? 'precisam' : 'precisa'} de atenção.`;

  await notificationService.showLocalNotification(title, body, {
    tag: 'multiple-equipment-expired',
    url: '/inspections',
  });
}

/**
 * Envia notificação quando uma inspeção é criada ou atualizada
 */
export async function notifyInspectionUpdate(
  inspectionType: string,
  equipmentId: string,
  status: 'created' | 'updated'
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const title = status === 'created' 
    ? `✅ Nova Inspeção Criada`
    : `📝 Inspeção Atualizada`;
  
  const body = `Inspeção de ${inspectionType} para o equipamento ${equipmentId} foi ${status === 'created' ? 'criada' : 'atualizada'}.`;

  await notificationService.showLocalNotification(title, body, {
    tag: `inspection-${equipmentId}`,
    url: `/inspections`,
  });
}

