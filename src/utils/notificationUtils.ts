import { notificationService } from '../services/notificationService';
import i18n from '../i18n/config';

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
  const t = i18n.t.bind(i18n);
  
  let title: string;
  let body: string;
  
  if (isExpired) {
    title = t('notifications.equipment.expired.title');
    body = t('notifications.equipment.expired.body', {
      equipment_type: equipmentType,
      equipment_id: equipmentId,
    });
  } else {
    title = t('notifications.equipment.expiringSoon.title');
    
    if (daysUntilExpiration === 1) {
      body = t('notifications.equipment.expiringSoon.bodyTomorrow', {
        equipment_type: equipmentType,
        equipment_id: equipmentId,
      });
    } else if (daysUntilExpiration === 7) {
      body = t('notifications.equipment.expiringSoon.bodyWeek', {
        equipment_type: equipmentType,
        equipment_id: equipmentId,
      });
    } else {
      body = t('notifications.equipment.expiringSoon.bodyDays', {
        equipment_type: equipmentType,
        equipment_id: equipmentId,
        days: daysUntilExpiration,
      });
    }
  }

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

  const t = i18n.t.bind(i18n);
  const title = count === 1
    ? t('notifications.equipment.multipleExpired.titleSingular')
    : t('notifications.equipment.multipleExpired.titlePlural', { count });
  
  const body = count === 1
    ? t('notifications.equipment.multipleExpired.bodySingular')
    : t('notifications.equipment.multipleExpired.bodyPlural', { count });

  await notificationService.showLocalNotification(title, body, {
    tag: 'multiple-equipment-expired',
    url: '/inspections',
  });
}

/**
 * Agenda lembretes de inspeção para o futuro (Offline First)
 */
export async function scheduleInspectionReminders(
  equipmentId: string,
  equipmentType: string,
  nextInspectionDate: string | Date,
  equipmentPath: string
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) return;

  const t = i18n.t.bind(i18n);
  const inspectionDate = new Date(nextInspectionDate);
  inspectionDate.setHours(9, 0, 0, 0); // Notificar às 9 da manhã

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // 1. Notificação para o dia do vencimento
  if (inspectionDate > today) {
    await notificationService.scheduleNotification(
      t('notifications.equipment.expired.title'),
      t('notifications.equipment.expired.body', {
        equipment_type: equipmentType,
        equipment_id: equipmentId,
      }),
      inspectionDate,
      {
        url: equipmentPath,
        equipmentId,
        actionTypeId: 'EQUIPMENT_EXPIRATION',
        id: Math.floor(Math.random() * 1000000)
      }
    );
  }

  // 2. Lembrete de antecedência (7 dias antes)
  const sevenDaysBefore = new Date(inspectionDate);
  sevenDaysBefore.setDate(sevenDaysBefore.getDate() - 7);
  
  if (sevenDaysBefore > today) {
    await notificationService.scheduleNotification(
      t('notifications.equipment.expiringSoon.title'),
      t('notifications.equipment.expiringSoon.bodyWeek', {
        equipment_type: equipmentType,
        equipment_id: equipmentId,
      }),
      sevenDaysBefore,
      {
        url: equipmentPath,
        equipmentId,
        actionTypeId: 'EQUIPMENT_EXPIRATION',
        id: Math.floor(Math.random() * 1000000)
      }
    );
  }
}

/**
 * Envia notificação quando um equipamento é cadastrado com sucesso
 */
export async function notifyEquipmentRegistered(
  equipmentId: string,
  equipmentType: string
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const t = i18n.t.bind(i18n);
  const title = t('notifications.equipment.registered.title');
  const body = t('notifications.equipment.registered.body', {
    equipment_type: equipmentType,
    equipment_id: equipmentId,
  });

  await notificationService.showLocalNotification(title, body, {
    tag: `equipment-registered-${equipmentId}`,
    url: `/equipment/${equipmentId}`,
    equipmentId,
    equipmentType,
  });
}

/**
 * Envia notificação quando há erro ao cadastrar equipamento
 */
export async function notifyEquipmentRegistrationError(): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const t = i18n.t.bind(i18n);
  const title = t('notifications.equipment.registrationError.title');
  const body = t('notifications.equipment.registrationError.body');

  await notificationService.showLocalNotification(title, body, {
    tag: 'equipment-registration-error',
    url: '/equipment/add',
  });
}

/**
 * Envia notificação quando uma inspeção é criada
 */
export async function notifyInspectionCreated(
  inspectionType: string,
  equipmentId: string,
  equipmentType: string
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const t = i18n.t.bind(i18n);
  const title = t('notifications.inspection.created.title');
  const body = t('notifications.inspection.created.body', {
    inspection_type: inspectionType,
    equipment_type: equipmentType,
    equipment_id: equipmentId,
  });

  await notificationService.showLocalNotification(title, body, {
    tag: `inspection-created-${equipmentId}`,
    url: `/inspections`,
    equipmentId,
    equipmentType,
  });
}

/**
 * Envia notificação quando uma inspeção é atualizada
 */
export async function notifyInspectionUpdated(
  inspectionType: string,
  equipmentId: string,
  equipmentType: string
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const t = i18n.t.bind(i18n);
  const title = t('notifications.inspection.updated.title');
  const body = t('notifications.inspection.updated.body', {
    inspection_type: inspectionType,
    equipment_type: equipmentType,
    equipment_id: equipmentId,
  });

  await notificationService.showLocalNotification(title, body, {
    tag: `inspection-updated-${equipmentId}`,
    url: `/inspections`,
    equipmentId,
    equipmentType,
  });
}

/**
 * Envia notificação quando uma inspeção está vencida
 */
export async function notifyInspectionExpired(
  equipmentId: string,
  equipmentType: string,
  expirationDate: string
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const t = i18n.t.bind(i18n);
  const title = t('notifications.inspection.expired.title');
  const body = t('notifications.inspection.expired.body', {
    equipment_type: equipmentType,
    equipment_id: equipmentId,
    expiration_date: expirationDate,
  });

  await notificationService.showLocalNotification(title, body, {
    tag: `inspection-expired-${equipmentId}`,
    url: `/equipment/${equipmentId}`,
    equipmentId,
    equipmentType,
  });
}

/**
 * Envia notificação quando uma inspeção está próxima do vencimento
 */
export async function notifyInspectionExpiringSoon(
  equipmentId: string,
  equipmentType: string,
  daysUntilExpiration: number
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const t = i18n.t.bind(i18n);
  const title = t('notifications.inspection.expiringSoon.title');
  const body = t('notifications.inspection.expiringSoon.body', {
    equipment_type: equipmentType,
    equipment_id: equipmentId,
    days: daysUntilExpiration,
  });

  await notificationService.showLocalNotification(title, body, {
    tag: `inspection-expiring-${equipmentId}`,
    url: `/equipment/${equipmentId}`,
    equipmentId,
    equipmentType,
  });
}

/**
 * Envia notificação quando um equipamento não está conforme
 */
export async function notifyEquipmentNonCompliant(
  equipmentId: string,
  equipmentType: string
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const t = i18n.t.bind(i18n);
  const title = t('notifications.inspection.nonCompliant.title');
  const body = t('notifications.inspection.nonCompliant.body', {
    equipment_type: equipmentType,
    equipment_id: equipmentId,
  });

  await notificationService.showLocalNotification(title, body, {
    tag: `equipment-non-compliant-${equipmentId}`,
    url: `/equipment/${equipmentId}`,
    equipmentId,
    equipmentType,
  });
}

/**
 * Envia notificação para múltiplos alertas
 */
export async function notifyMultipleAlerts(count: number): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const t = i18n.t.bind(i18n);
  const title = t('notifications.alerts.multipleAlerts.title');
  const body = t('notifications.alerts.multipleAlerts.body', { count });

  await notificationService.showLocalNotification(title, body, {
    tag: 'multiple-alerts',
    url: '/dashboard',
  });
}

/**
 * Envia notificação quando pendências são detectadas
 */
export async function notifyPendingIssues(
  equipmentId: string,
  equipmentType: string
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const t = i18n.t.bind(i18n);
  const title = t('notifications.alerts.pendingIssues.title');
  const body = t('notifications.alerts.pendingIssues.body', {
    equipment_type: equipmentType,
    equipment_id: equipmentId,
  });

  await notificationService.showLocalNotification(title, body, {
    tag: `pending-issues-${equipmentId}`,
    url: `/equipment/${equipmentId}`,
    equipmentId,
    equipmentType,
  });
}

/**
 * Envia notificação quando manutenção é necessária
 */
export async function notifyMaintenanceRequired(
  equipmentId: string,
  equipmentType: string,
  maintenanceLevel: number
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) {
    return;
  }

  const t = i18n.t.bind(i18n);
  const title = t('notifications.alerts.maintenanceRequired.title');
  const body = t('notifications.alerts.maintenanceRequired.body', {
    equipment_type: equipmentType,
    equipment_id: equipmentId,
    level: maintenanceLevel,
  });

  await notificationService.showLocalNotification(title, body, {
    tag: `maintenance-required-${equipmentId}`,
    url: `/equipment/${equipmentId}`,
    equipmentId,
    equipmentType,
  });
}

