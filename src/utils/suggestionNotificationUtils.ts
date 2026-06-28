import { notificationService } from '../services/notificationService';
import i18n from '../i18n/config';
import type { SuggestionType } from '../types/engagementNotifications';

const SUGGESTION_ICON_COLOR = '#72DEFF';

async function showSuggestion(
  title: string,
  body: string,
  type: SuggestionType,
  url: string,
  tag: string,
  extra?: Record<string, string>,
): Promise<void> {
  const permission = await notificationService.checkPermission();
  if (!permission.granted) return;

  await notificationService.showLocalNotification(title, body, {
    tag,
    url,
    actionTypeId: 'SIMPLE_VIEW',
    iconColor: SUGGESTION_ICON_COLOR,
    category: 'suggestion',
    type,
    ...extra,
  });
}

export async function notifyInspectionUpcoming(
  equipmentId: string,
  equipmentType: string,
  equipmentLabel: string,
  daysLeft: number,
): Promise<void> {
  const t = i18n.t.bind(i18n);
  const title = t('notifications.suggestions.inspectionUpcoming.title');
  const body = t('notifications.suggestions.inspectionUpcoming.body', {
    equipment_id: equipmentId,
    equipment_type: equipmentLabel,
    days: daysLeft,
  });

  await showSuggestion(
    title,
    body,
    'inspection_upcoming',
    `/equipment/${equipmentType}/${equipmentId}`,
    `suggestion-upcoming-${equipmentType}-${equipmentId}`,
    { equipmentId, equipmentType, route: `/equipment/${equipmentType}/${equipmentId}` },
  );
}

export async function notifyWeeklyGoalProgress(done: number, target: number): Promise<void> {
  const t = i18n.t.bind(i18n);
  const title = t('notifications.suggestions.weeklyGoal.title');
  const body = t('notifications.suggestions.weeklyGoal.body', { done, target });

  await showSuggestion(
    title,
    body,
    'weekly_goal',
    '/inspections',
    'suggestion-weekly-goal',
    { route: '/inspections', done: String(done), target: String(target) },
  );
}

export async function notifyInactivityNudge(daysSinceLast: number): Promise<void> {
  const t = i18n.t.bind(i18n);
  const title = t('notifications.suggestions.inactivityNudge.title');
  const body = t('notifications.suggestions.inactivityNudge.body', { days: daysSinceLast });

  await showSuggestion(
    title,
    body,
    'inactivity_nudge',
    '/map',
    'suggestion-inactivity-nudge',
    { route: '/map', days: String(daysSinceLast) },
  );
}

export async function notifySyncSuccessPositive(): Promise<void> {
  const t = i18n.t.bind(i18n);
  const title = t('notifications.suggestions.syncSuccess.title');
  const body = t('notifications.suggestions.syncSuccess.body');

  await showSuggestion(
    title,
    body,
    'sync_success_positive',
    '/',
    'suggestion-sync-success',
    { route: '/' },
  );
}

export async function notifyEmptyStateTip(): Promise<void> {
  const t = i18n.t.bind(i18n);
  const title = t('notifications.suggestions.emptyStateTip.title');
  const body = t('notifications.suggestions.emptyStateTip.body');

  await showSuggestion(
    title,
    body,
    'empty_state_tip',
    '/equipment/add',
    'suggestion-empty-state',
    { route: '/equipment/add' },
  );
}
