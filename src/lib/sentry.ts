type SentryModule = typeof import('@sentry/capacitor');

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN;

let initialized = false;
let disabled = false;
let initStarted = false;
let sentryModule: SentryModule | null = null;
let pendingUser: { id: string; email?: string | null } | null | undefined;

function warnSentryFailure(action: string, error: unknown): void {
  if (import.meta.env.DEV) {
    console.warn(`[sentry] ${action} falhou; monitoramento ignorado.`, error);
  }
}

function safeRun(action: string, fn: () => void): void {
  if (disabled || !initialized || !sentryModule) return;

  try {
    fn();
  } catch (error) {
    disabled = true;
    initialized = false;
    sentryModule = null;
    warnSentryFailure(action, error);
  }
}

function applyPendingUser(): void {
  if (pendingUser === undefined) return;

  const user = pendingUser;
  pendingUser = undefined;

  safeRun('setUser', () => {
    if (!sentryModule) return;

    if (user) {
      sentryModule.setUser({ id: user.id, email: user.email ?? undefined });
    } else {
      sentryModule.setUser(null);
    }
  });
}

export function isSentryEnabled(): boolean {
  return Boolean(SENTRY_DSN && import.meta.env.PROD && initialized && !disabled);
}

/**
 * Inicializa o Sentry em builds de produção quando VITE_SENTRY_DSN está configurado.
 * Falhas são silenciosas em produção — o app continua funcionando normalmente.
 */
export function initSentry(): void {
  if (!SENTRY_DSN || !import.meta.env.PROD || initialized || disabled || initStarted) {
    return;
  }

  initStarted = true;

  void (async () => {
    try {
      const [Sentry, SentryReact] = await Promise.all([
        import('@sentry/capacitor'),
        import('@sentry/react'),
      ]);

      const environment =
        import.meta.env.VITE_SENTRY_ENVIRONMENT || import.meta.env.MODE || 'production';
      const appVersion = import.meta.env.VITE_APP_VERSION;
      const release = appVersion ? `com.isfia.app@${appVersion}` : undefined;

      Sentry.init(
        {
          dsn: SENTRY_DSN,
          environment,
          release,
        },
        SentryReact.init,
      );

      sentryModule = Sentry;
      initialized = true;
      applyPendingUser();
    } catch (error) {
      disabled = true;
      initialized = false;
      sentryModule = null;
      warnSentryFailure('init', error);
    }
  })();
}

export function setSentryUser(user: { id: string; email?: string | null } | null): void {
  pendingUser = user;

  safeRun('setUser', () => {
    if (!sentryModule) return;

    if (user) {
      sentryModule.setUser({ id: user.id, email: user.email ?? undefined });
    } else {
      sentryModule.setUser(null);
    }
  });
}

export function captureException(
  error: unknown,
  context?: Record<string, unknown>,
): void {
  safeRun('captureException', () => {
    if (!sentryModule) return;

    sentryModule.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }

      if (error instanceof Error) {
        sentryModule!.captureException(error);
        return;
      }

      sentryModule!.captureException(new Error(String(error)));
    });
  });
}

export function captureMessage(
  message: string,
  context?: Record<string, unknown>,
): void {
  safeRun('captureMessage', () => {
    if (!sentryModule) return;

    sentryModule.withScope((scope) => {
      if (context) {
        Object.entries(context).forEach(([key, value]) => {
          scope.setExtra(key, value);
        });
      }
      sentryModule!.captureMessage(message, 'error');
    });
  });
}
