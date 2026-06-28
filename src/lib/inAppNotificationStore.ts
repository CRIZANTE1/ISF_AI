import { logger } from '../utils/logger';

const STORAGE_KEY = 'isfia-inapp-push-notifications';
const MAX_ITEMS = 40;
export const IN_APP_NOTIFY_EVENT = 'isfia-inapp-notify';

export interface InAppPushItem {
  id: string;
  title: string;
  body: string;
  data: Record<string, string>;
  receivedAt: string;
}

function readStore(): InAppPushItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as InAppPushItem[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStore(items: InAppPushItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch (e) {
    logger.warn('inAppNotificationStore: falha ao gravar', 'push', e);
  }
}

function dispatchNotify() {
  try {
    window.dispatchEvent(new CustomEvent(IN_APP_NOTIFY_EVENT));
  } catch {
    /* ignore */
  }
}

export function routeFromPushPayload(data: Record<string, string>): string | null {
  if (data.route && data.route.startsWith('/')) {
    return data.route;
  }
  const type = (data.type || '').toLowerCase();
  switch (type) {
    case 'inspection_due':
    case 'inspecao_pendente':
    case 'equipment':
      return '/inspections';
    case 'inspection_upcoming':
    case 'weekly_goal':
      return data.route?.startsWith('/') ? data.route : '/inspections';
    case 'inactivity_nudge':
    case 'inactivity_push':
      return data.route?.startsWith('/') ? data.route : '/map';
    case 'empty_state_tip':
      return data.route?.startsWith('/') ? data.route : '/equipment/add';
    case 'weekly_summary':
      return data.route?.startsWith('/') ? data.route : '/inspections';
    case 'streak':
      return data.route?.startsWith('/') ? data.route : '/history';
    case 'sync_success_positive':
      return data.route?.startsWith('/') ? data.route : '/';
    case 'app_update':
    case 'update':
      return '/profile/settings';
    case 'action_plan':
    case 'plano_acao':
      return '/action-plans';
    case 'history':
    case 'historico':
      return '/history';
    case 'profile':
    case 'perfil':
      return '/profile';
    case 'map':
    case 'mapa':
      return '/map';
    case 'utilities':
    case 'utilidades':
      return '/utilities';
    default:
      return null;
  }
}

export function appendInAppNotificationFromPush(payload: {
  title?: string;
  body?: string;
  data: Record<string, string>;
}): void {
  const title = payload.title || 'ISF IA';
  const body = payload.body || '';
  const item: InAppPushItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    title,
    body,
    data: { ...payload.data },
    receivedAt: new Date().toISOString(),
  };
  const next = [item, ...readStore()].slice(0, MAX_ITEMS);
  writeStore(next);
  dispatchNotify();
}

export function getInAppPushNotifications(): InAppPushItem[] {
  return readStore();
}

export function clearInAppPushNotifications(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
  dispatchNotify();
}
