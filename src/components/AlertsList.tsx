import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Skeleton from './Skeleton';

interface Alert {
  id: number;
  equipment_id: string;
  status: string;
  proxima_inspecao: string;
}

interface AlertsListProps {
    userId?: string;
}

const AlertsList = ({ userId }: AlertsListProps) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!userId) return;
      setLoading(true);
      const { data, error } = await supabase
        .from('equipment')
        .select('id, equipment_id, status, proxima_inspecao')
        .in('status', ['vencido', 'pendente'])
        .eq('user_id', userId)
        .order('proxima_inspecao', { ascending: true })
        .limit(5);

      if (!error && data) {
        setAlerts(data);
      }
      setLoading(false);
    };

    fetchAlerts();
  }, [userId]);

  const getAlertMessage = (alert: Alert) => {
    if (alert.status === 'vencido') {
      return `${alert.equipment_id} está com inspeção vencida.`;
    }
    if (alert.status === 'pendente') {
        return `${alert.equipment_id} possui pendências.`;
    }
    return `${alert.equipment_id} requer atenção.`;
  }

  return (
    <div className="mt-6">
      <h3 className="text-lg font-semibold text-light-text-primary dark:text-dark-text-primary">Alertas Críticos</h3>
      <div className="mt-3 space-y-2">
        {loading ? (
            Array.from({ length: 2 }).map((_, index) => (
                <Skeleton key={index} className="h-12 w-full rounded-lg" />
            ))
        ) : alerts.length > 0 ? (
          alerts.map((alert) => (
            <div key={alert.id} className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-3">
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                <span className="font-medium text-status-warning">•</span> {getAlertMessage(alert)}
              </p>
            </div>
          ))
        ) : (
          <div className="bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg p-4 text-center">
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">Nenhum alerta crítico no momento.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AlertsList;
