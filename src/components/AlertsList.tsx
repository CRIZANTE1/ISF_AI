import { useEffect, useState, useMemo, memo, useCallback } from 'react';
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
  const { cache } = useEquipmentCache();
  const { t } = useTranslation();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);

  // Memoizar função de verificação de equipamento
  const checkEquipment = useCallback((
    equipmentList: any[],
    type: string,
    idField: string,
    statusField?: string,
    nextInspectionField?: string
  ) => {
    const allAlerts: Alert[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    equipmentList
      .filter((eq: any) => !eq.user_id || eq.user_id === userId)
      .forEach((eq: any) => {
        const id = eq[idField] || eq.id || String(eq.id);
        const status = eq[statusField || 'status'] || 'ok';
        const nextInspection = eq[nextInspectionField || 'proxima_inspecao'] || eq.data_proxima_inspecao;

        // Verificar se está vencido (próxima inspeção no passado)
        if (nextInspection) {
          const inspectionDate = new Date(nextInspection);
          inspectionDate.setHours(0, 0, 0, 0);

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

    return allAlerts;
  }, [userId, t]);

  // Memoizar cálculo de alertas
  const calculatedAlerts = useMemo(() => {
    if (!userId) return [];

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

    // Verificar cada tipo de equipamento
    // Para extintores, verifica data_proxima_inspecao, data_proxima_manutencao_2_nivel e data_proxima_manutencao_3_nivel
    extinguishers.forEach((eq: any) => {
      if (!eq.user_id || eq.user_id === userId) {
        const id = eq.numero_identificacao;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Verifica todas as datas relevantes de extintores
        const datesToCheck = [
          { date: eq.data_proxima_inspecao, label: 'inspeção' },
          { date: eq.data_proxima_manutencao_2_nivel, label: 'manutenção nível 2' },
          { date: eq.data_proxima_manutencao_3_nivel, label: 'manutenção nível 3' },
        ].filter(d => d.date);

        datesToCheck.forEach(({ date, label }) => {
          const inspectionDate = new Date(date);
          inspectionDate.setHours(0, 0, 0, 0);

          if (inspectionDate < today) {
            allAlerts.push({
              id: `extintor_${id}_${label}`,
              equipment_id: id,
              equipment_type: 'extintor',
              status: 'vencido',
              proxima_inspecao: date,
              message: t('alerts.inspectionExpired', { id, defaultValue: `${id} está com ${label} vencida.` }),
            });
          }
        });

        // Verifica status pendente/reprovado (não aprovado)
        // Prioriza status_geral (campo principal do banco: 'aprovado', 'pendente', 'reprovado')
        const statusGeral = (eq.status_geral || '').toLowerCase().trim();
        const aprovado = (eq.aprovado_inspecao || '').toLowerCase().trim();
        
        const isPending = statusGeral === 'pendente' || statusGeral === 'reprovado' || 
                         aprovado === 'não' || aprovado === 'nao' || aprovado === 'pendente';
        
        if (isPending) {
          allAlerts.push({
            id: `extintor_${id}_pendente`,
            equipment_id: id,
            equipment_type: 'extintor',
            status: 'pendente',
            proxima_inspecao: eq.data_proxima_inspecao,
            message: t('alerts.hasPending', { id, defaultValue: `${id} possui pendências (${eq.status_geral || eq.aprovado_inspecao || 'Não aprovado'}).` }),
          });
        }
      }
    });
    allAlerts.push(...checkEquipment(hoses, 'mangueira', 'id_mangueira', 'status_geral', 'data_proximo_teste'));
    allAlerts.push(...checkEquipment(scbas, 'scba', 'numero_serie_equipamento', 'status_geral', 'data_proxima_inspecao'));
    allAlerts.push(...checkEquipment(multigasDetectors, 'multigas', 'id_equipamento', 'resultado_teste', 'data_proximo_teste'));
    allAlerts.push(...checkEquipment(foamChambers, 'camara_espuma', 'id_camara', 'status', 'data_proxima_inspecao'));
    allAlerts.push(...checkEquipment(cannonMonitors, 'canhao_monitor', 'id_equipamento', 'status', 'data_proxima_inspecao'));
    allAlerts.push(...checkEquipment(eyewashStations, 'chuveiro_lavaolhos', 'id_equipamento', 'status_geral', 'data_proxima_inspecao'));
    allAlerts.push(...checkEquipment(alarmSystems, 'alarme', 'id_sistema', 'status', 'data_proxima_inspecao'));
    allAlerts.push(...checkEquipment(shelters, 'abrigo', 'id_abrigo', 'status', 'data_proxima_inspecao'));

    // Ordenar por data de próxima inspeção (mais antigas primeiro)
    allAlerts.sort((a, b) => {
      if (!a.proxima_inspecao) return 1;
      if (!b.proxima_inspecao) return -1;
      return new Date(a.proxima_inspecao).getTime() - new Date(b.proxima_inspecao).getTime();
    });

    // Limitar a 5 alertas mais urgentes
    return allAlerts.slice(0, 5);
  }, [cache, checkEquipment]);

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setAlerts(calculatedAlerts);
    } catch (error) {
      logger.error('Erro ao buscar alertas', 'equipment', error);
    } finally {
      setLoading(false);
    }
  }, [userId, calculatedAlerts]);

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
              <AlertItem key={alert.id} alert={alert} index={index} />
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

// Componente memoizado para item de alerta
const AlertItem = memo(({ alert, index }: { alert: Alert; index: number }) => (
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
));

AlertItem.displayName = 'AlertItem';

export default memo(AlertsList);
