import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Skeleton from './Skeleton';
import { getAllExtinguishers } from '../utils/extinguisherOperations';
import { getAllHoses } from '../utils/hoseOperations';
import { getAllSCBAs } from '../utils/scbaOperations';
import { getAllMultigasDetectors } from '../utils/multigasOperations';
import { getAllFoamChambers } from '../utils/foamChamberOperations';
import { getAllCannonMonitors } from '../utils/cannonMonitorOperations';
import { getAllEyewashStations } from '../utils/eyewashOperations';
import { getAllAlarmSystems } from '../utils/alarmOperations';
import { getAllShelters } from '../utils/shelterOperations';

interface Alert {
  id: string;
  equipment_id: string;
  equipment_type: string;
  status: string;
  proxima_inspecao?: string;
  message: string;
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

      try {
        const allAlerts: Alert[] = [];

        // Buscar equipamentos de todas as tabelas especializadas
        const [
          extinguishers,
          hoses,
          scbas,
          multigasDetectors,
          foamChambers,
          cannonMonitors,
          eyewashStations,
          alarmSystems,
          shelters,
        ] = await Promise.all([
          getAllExtinguishers(),
          getAllHoses(),
          getAllSCBAs(),
          getAllMultigasDetectors(),
          getAllFoamChambers(),
          getAllCannonMonitors(),
          getAllEyewashStations(),
          getAllAlarmSystems(),
          getAllShelters(),
        ]);

        // Filtrar por user_id e identificar alertas
        const checkEquipment = (
          equipmentList: any[],
          type: string,
          idField: string,
          statusField?: string,
          nextInspectionField?: string
        ) => {
          equipmentList
            .filter((eq: any) => !eq.user_id || eq.user_id === userId)
            .forEach((eq: any) => {
              const id = eq[idField] || eq.id || String(eq.id);
              const status = eq[statusField || 'status'] || 'ok';
              const nextInspection = eq[nextInspectionField || 'proxima_inspecao'] || eq.data_proxima_inspecao;

              // Verificar se está vencido (próxima inspeção no passado)
              if (nextInspection) {
                const inspectionDate = new Date(nextInspection);
                const today = new Date();
                today.setHours(0, 0, 0, 0);

                if (inspectionDate < today) {
                  allAlerts.push({
                    id: `${type}_${id}`,
                    equipment_id: id,
                    equipment_type: type,
                    status: 'vencido',
                    proxima_inspecao: nextInspection,
                    message: `${id} está com inspeção vencida.`,
                  });
                } else if (status === 'pendente' || status === 'nao_conforme') {
                  allAlerts.push({
                    id: `${type}_${id}`,
                    equipment_id: id,
                    equipment_type: type,
                    status: 'pendente',
                    proxima_inspecao: nextInspection,
                    message: `${id} possui pendências.`,
                  });
                }
              }
            });
        };

        // Verificar cada tipo de equipamento
        checkEquipment(extinguishers, 'extintor', 'numero_identificacao', 'status', 'proxima_inspecao');
        checkEquipment(hoses, 'mangueira', 'id_mangueira', 'resultado', 'data_proximo_teste');
        checkEquipment(scbas, 'scba', 'numero_serie_equipamento', 'status', 'data_proxima_inspecao');
        checkEquipment(multigasDetectors, 'multigas', 'id_equipamento', 'status', 'data_proximo_teste');
        checkEquipment(foamChambers, 'camara_espuma', 'id_camara', 'status', 'data_proxima_inspecao');
        checkEquipment(cannonMonitors, 'canhao_monitor', 'id_equipamento', 'status', 'data_proxima_inspecao');
        checkEquipment(eyewashStations, 'chuveiro_lavaolhos', 'id_equipamento', 'status_geral', 'data_proxima_inspecao');
        checkEquipment(alarmSystems, 'alarme', 'id_sistema', 'status', 'data_proxima_inspecao');
        checkEquipment(shelters, 'abrigo', 'id_abrigo', 'status', 'data_proxima_inspecao');

        // Ordenar por data de próxima inspeção (mais antigas primeiro)
        allAlerts.sort((a, b) => {
          if (!a.proxima_inspecao) return 1;
          if (!b.proxima_inspecao) return -1;
          return new Date(a.proxima_inspecao).getTime() - new Date(b.proxima_inspecao).getTime();
        });

        // Limitar a 5 alertas mais urgentes
        setAlerts(allAlerts.slice(0, 5));
      } catch (error) {
        console.error('Erro ao buscar alertas:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAlerts();
  }, [userId]);

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
                <span className="font-medium text-status-warning">•</span> {alert.message}
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
