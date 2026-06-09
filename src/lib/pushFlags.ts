/**
 * Push FCM: desligue com VITE_ENABLE_PUSH=false no .env (builds de diagnóstico).
 */
export function isPushEnabled(): boolean {
  return import.meta.env.VITE_ENABLE_PUSH !== 'false';
}
