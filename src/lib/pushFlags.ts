/**
 * Push FCM/APNs: desligue com VITE_ENABLE_PUSH=false no .env (builds de diagnóstico).
 * Requer google-services.json (Android) ou GoogleService-Info.plist (iOS) no build.
 */
export function isPushEnabled(): boolean {
  if (import.meta.env.VITE_ENABLE_PUSH === 'false') return false;
  if (import.meta.env.VITE_HAS_GOOGLE_SERVICES === 'false') return false;
  return true;
}
