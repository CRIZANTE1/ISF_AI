import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Skeleton from './Skeleton';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.7 }}
      className="mt-6"
    >
      <motion.h3 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8 }}
        className="text-lg font-bold text-light-text-primary dark:text-dark-text-primary mb-4 flex items-center gap-2 transition-colors duration-200"
      >
        <AlertTriangle className="text-status-warning" size={20} />
        Alertas Críticos
      </motion.h3>
      <div className="mt-3 space-y-3">
        {loading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-12 w-full rounded-xl" />
          ))
        ) : alerts.length > 0 ? (
          <AnimatePresence>
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ scale: 1.02, x: 5 }}
                className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 border border-red-200 dark:border-red-800 rounded-2xl p-4 shadow-lg transition-all duration-200 cursor-pointer group"
              >
                <p className="text-sm font-medium text-red-700 dark:text-red-400 flex items-center gap-2 transition-colors duration-200">
                  <motion.span
                    animate={{ rotate: [0, 10, -10, 0] }}
                    transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 2 }}
                    className="text-status-warning text-xl"
                  >
                    ⚠️
                  </motion.span>
                  {alert.message}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9 }}
            className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-2xl p-6 text-center shadow-lg transition-colors duration-200"
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-sm font-medium text-green-700 dark:text-green-400 flex items-center justify-center gap-2 transition-colors duration-200"
            >
              <span className="text-xl">✓</span>
              Nenhum alerta crítico no momento.
            </motion.p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AlertsList;
