import { useEffect } from 'react';
import { networkStatusService } from '../services/networkStatusService';

/**
 * Inicia o listener global de rede uma única vez para todo o app.
 */
export function NetworkEffects() {
  useEffect(() => {
    void networkStatusService.start();
    return () => networkStatusService.stop();
  }, []);

  return null;
}
