import { useEffect, useRef } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { isPushEnabled } from '../lib/pushFlags';
import { registerToken } from '../lib/pushBackend';
import {
  appendInAppNotificationFromPush,
  routeFromPushPayload,
} from '../lib/inAppNotificationStore';
import { logger } from '../utils/logger';

/**
 * Efeitos globais: permissão, registro FCM, listeners e re-registro após login.
 * Deve estar dentro de AuthProvider + Router.
 */
export function PushNotificationsEffects() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const listenersReady = useRef(false);

  useEffect(() => {
    if (!isPushEnabled()) return;
    if (!Capacitor.isNativePlatform()) return;

    let cancelled = false;

    const setup = async () => {
      try {
        const perm = await PushNotifications.requestPermissions();
        if (perm.receive !== 'granted') {
          logger.info('Push: permissão não concedida', 'push', perm);
          return;
        }

        if (!listenersReady.current) {
          listenersReady.current = true;

          await PushNotifications.addListener('registration', async (token) => {
            if (cancelled || !token.value) return;
            const platform =
              Capacitor.getPlatform() === 'ios'
                ? 'ios'
                : Capacitor.getPlatform() === 'web'
                  ? 'web'
                  : 'android';
            try {
              await registerToken(token.value, platform);
            } catch (e) {
              logger.warn('Erro ao registrar token push', 'push', e);
            }
          });

          await PushNotifications.addListener('registrationError', (err) => {
            logger.warn('Push registrationError', 'push', err);
          });

          await PushNotifications.addListener(
            'pushNotificationActionPerformed',
            (action) => {
              const data = (action.notification?.data || {}) as Record<string, string>;
              const route = routeFromPushPayload(data);
              if (route) {
                navigate(route);
              }
            },
          );

          await PushNotifications.addListener('pushNotificationReceived', (event) => {
            const n = event.notification;
            appendInAppNotificationFromPush({
              title: n.title,
              body: n.body,
              data: (n.data || {}) as Record<string, string>,
            });
          });
        }

        await PushNotifications.register();
      } catch (e) {
        logger.warn('Push: falha na configuração', 'push', e);
      }
    };

    void setup();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  useEffect(() => {
    if (!isPushEnabled()) return;
    if (!Capacitor.isNativePlatform()) return;
    if (!session?.access_token) return;

    void (async () => {
      try {
        const perm = await PushNotifications.checkPermissions();
        if (perm.receive !== 'granted') return;
        await PushNotifications.register();
      } catch (e) {
        logger.debug('Push: re-registro após login ignorado', 'push', e);
      }
    })();
  }, [session?.access_token]);

  return null;
}
