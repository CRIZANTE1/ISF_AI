/**
 * Hook para detectar status online/offline.
 * Consome o serviço global de rede (listener único no app).
 */

import { useState, useEffect } from 'react';
import { networkStatusService, type OnlineStatus } from '../services/networkStatusService';

export type { OnlineStatus };
export { checkSupabaseConnection } from '../services/networkStatusService';

export function useOnlineStatus(): OnlineStatus {
  const [status, setStatus] = useState<OnlineStatus>(() => networkStatusService.getState());

  useEffect(() => networkStatusService.subscribe(setStatus), []);

  return status;
}
