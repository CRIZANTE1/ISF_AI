/**
 * Sistema centralizado de logging
 * Substitui console.log/error/warn por sistema estruturado
 * 
 * Em produção, pode ser integrado com serviços como Sentry
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

class Logger {
  private isDev = (import.meta as any).env?.DEV ?? true;
  private enabled = true;

  /**
   * Desabilita logging (útil para testes)
   */
  disable() {
    this.enabled = false;
  }

  /**
   * Habilita logging
   */
  enable() {
    this.enabled = true;
  }

  private log(level: LogLevel, message: string, context?: string, data?: any) {
    if (!this.enabled) return;

    // Em desenvolvimento ou Android (sempre logar no console para debug)
    // No Android/Capacitor, console.log aparece no Logcat
    if (this.isDev || this.isAndroidNative()) {
      const prefix = context ? `[${context}]` : '';
      const logMessage = `${prefix} ${message}`;

      // Usar console.log como fallback se métodos específicos não estiverem disponíveis
      try {
        switch (level) {
          case 'debug':
            if (typeof console.debug === 'function') {
              console.debug(logMessage, data || '');
            } else {
              console.log(`[DEBUG] ${logMessage}`, data || '');
            }
            break;
          case 'info':
            if (typeof console.info === 'function') {
              console.info(logMessage, data || '');
            } else {
              console.log(`[INFO] ${logMessage}`, data || '');
            }
            break;
          case 'warn':
            if (typeof console.warn === 'function') {
              console.warn(logMessage, data || '');
            } else {
              console.log(`[WARN] ${logMessage}`, data || '');
            }
            break;
          case 'error':
            if (typeof console.error === 'function') {
              console.error(logMessage, data || '');
            } else {
              console.log(`[ERROR] ${logMessage}`, data || '');
            }
            break;
        }
      } catch (e) {
        // Fallback absoluto - sempre funciona
        console.log(`[${level.toUpperCase()}] ${logMessage}`, data || '');
      }
    }

    // Em produção, pode integrar com serviço de monitoramento externo
    // TODO: Se necessário, integrar com serviço de monitoramento (ex: Sentry, LogRocket, etc.)
    // if (this.isProd && level === 'error') {
    //   // Enviar para serviço de monitoramento
    // }
  }

  /**
   * Verifica se está rodando em Android nativo (Capacitor)
   */
  private isAndroidNative(): boolean {
    try {
      if (typeof window !== 'undefined' && (window as any).Capacitor) {
        const Capacitor = (window as any).Capacitor;
        return Capacitor.isNativePlatform && Capacitor.isNativePlatform();
      }
    } catch {
      // Ignorar erros
    }
    return false;
  }

  /**
   * Log de debug (apenas em desenvolvimento)
   */
  debug(message: string, context?: string, data?: any) {
    if (this.isDev) {
      this.log('debug', message, context, data);
    }
  }

  /**
   * Log de informação
   */
  info(message: string, context?: string, data?: any) {
    this.log('info', message, context, data);
  }

  /**
   * Log de aviso
   */
  warn(message: string, context?: string, data?: any) {
    this.log('warn', message, context, data);
  }

  /**
   * Log de erro
   */
  error(message: string, context?: string, data?: any) {
    this.log('error', message, context, data);
  }
}

// Instância singleton
export const logger = new Logger();

// Exportar funções de conveniência
export const logDebug = (message: string, context?: string, data?: any) => {
  logger.debug(message, context, data);
};

export const logInfo = (message: string, context?: string, data?: any) => {
  logger.info(message, context, data);
};

export const logWarn = (message: string, context?: string, data?: any) => {
  logger.warn(message, context, data);
};

export const logError = (message: string, context?: string, data?: any) => {
  logger.error(message, context, data);
};

