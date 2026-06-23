/**
 * Push FCM: desligue com VITE_ENABLE_PUSH=false no .env (builds de diagnóstico).
 * Sem `android/app/google-services.json`, o registro FCM derruba o app nativo.
 */
export function isPushEnabled(): boolean {
  if (import.meta.env.VITE_ENABLE_PUSH === 'false') return false;
  if (import.meta.env.VITE_HAS_GOOGLE_SERVICES === 'false') return false;
  return true;
}
