import { supabase } from './supabase';
import { logger } from '../utils/logger';

export type PushPlatform = 'android' | 'ios' | 'web';

/**
 * Registra o token FCM na Edge Function push-register (JWT do usuário).
 */
export async function registerToken(
  token: string,
  platform: PushPlatform,
): Promise<void> {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !anonKey) {
    logger.warn('push-register: Supabase URL/anon key ausentes', 'push');
    return;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();
  if (!session?.access_token) {
    logger.debug('push-register: sem sessão, token não enviado', 'push');
    return;
  }

  const url = `${supabaseUrl.replace(/\/$/, '')}/functions/v1/push-register`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${session.access_token}`,
      apikey: anonKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fcm_token: token, platform }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    logger.warn(`push-register falhou: ${res.status}`, 'push', { body: text });
    return;
  }

  logger.info('Token FCM registrado no Supabase', 'push');
}
