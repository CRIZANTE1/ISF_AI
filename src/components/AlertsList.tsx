import { useEffect, useState } from 'react';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import Skeleton from './Skeleton';
import { AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '../utils/logger';
import { useTranslation } from '../hooks/useTranslation';

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
  const { getAllEquipment, cache } = useEquipmentCache();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAlerts = async () => {
      if (!userId) return;
      setLoading(true);

      try {
        const allAlerts: Alert[] = [];

        // Usar dados do cache em vez de fazer novas chamadas
        const extinguishers = cache.extinguishers;
        const hoses = cache.hoses;
        const scbas = cache.scbas;
        const multigasDetectors = cache.multigasDetectors;
        const foamChambers = cache.foamChambers;
        const cannonMonitors = cache.cannonMonitors;
        const eyewashStations = cache.eyewashStations;
        const alarmSystems = cache.alarmSystems;
        const shelters = cache.shelters;

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
                    message: t('alerts.inspectionExpired', { id, defaultValue: `${id} está com inspeção vencida.` }),
                  });
                } else if (status === 'pendente' || status === 'nao_conforme') {
                  allAlerts.push({
                    id: `${type}_${id}`,
                    equipment_id: id,
                    equipment_type: type,
                    status: 'pendente',
                    proxima_inspecao: nextInspection,
                    message: t('alerts.hasPending', { id, defaultValue: `${id} possui pendências.` }),
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
        logger.error('Erro ao buscar alertas', 'equipment', error);
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
      transition={{ delay: 0.7, ease: [0.4, 0, 0.2, 1] }}
      className="mt-ios-6"
    >
      <motion.h3 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.8, ease: [0.4, 0, 0.2, 1] }}
        className="text-section-title font-semibold text-[var(--text-primary-current)] mb-ios-4"
        style={{ letterSpacing: '-0.3px' }}
      >
        {t('alerts.critical', { defaultValue: 'Alertas Críticos' })}
      </motion.h3>
      <div className="space-y-ios-3 flex flex-col">
        {loading ? (
          Array.from({ length: 2 }).map((_, index) => (
            <Skeleton key={index} className="h-16 w-full rounded-ios-lg" />
          ))
        ) : alerts.length > 0 ? (
          <AnimatePresence>
            {alerts.map((alert, index) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: index * 0.05, ease: [0.4, 0, 0.2, 1] }}
                whileHover={{ scale: 1.01, y: -2 }}
                className="fitness-card-translucent cursor-pointer group"
                style={{ 
                  backgroundColor: 'rgba(252, 61, 57, 0.4)', 
                  borderColor: 'rgba(252, 61, 57, 0.3)',
                  padding: '16px',
                  boxShadow: '0 2px 8px rgba(252, 61, 57, 0.3)',
                  backdropFilter: 'blur(20px) saturate(180%)',
                  WebkitBackdropFilter: 'blur(20px) saturate(180%)',
                }}
              >
                <p className="text-body font-medium flex items-center gap-3" style={{ color: '#FC3D39' }}>
                  <AlertTriangle size={18} strokeWidth={2} style={{ color: '#FC3D39' }} />
                  {alert.message}
                </p>
              </motion.div>
            ))}
          </AnimatePresence>
        ) : (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.9, ease: [0.4, 0, 0.2, 1] }}
            className="apple-card text-center"
            style={{ padding: '20px' }}
          >
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="text-body font-medium flex items-center justify-center gap-2 text-[var(--text-primary-current)]"
            >
              <span className="text-xl">✓</span>
              {t('alerts.noAlerts', { defaultValue: 'Nenhum alerta crítico no momento.' })}
            </motion.p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default AlertsList;
