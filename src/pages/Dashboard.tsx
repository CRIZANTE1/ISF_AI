import { useEffect, useState, useMemo, memo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import DashboardHeader from '../components/DashboardHeader';
import AlertsList from '../components/AlertsList';
import Skeleton from '../components/Skeleton';
import TrialStatusBar from '../components/TrialStatusBar';
import InstructionsPanel from '../components/InstructionsPanel';
import { AppleActivityCard } from '../components/ui/apple-activity-ring';
import { calculateEquipmentStats } from '../utils/equipmentStatus';
import { motion } from 'framer-motion';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';

interface Stats {
  total: number;
  ok: number;
  vencido: number;
  pendente: number;
}

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const { getAllEquipment, cache, isStale, refreshCache } = useEquipmentCache();
  const { handleError } = useErrorHandler();
  const { t } = useTranslation();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Memoizar equipamentos filtrados
  const filteredEquipment = useMemo(() => {
    if (!user) return [];
    return getAllEquipment().filter(
      (eq: any) => !eq.user_id || eq.user_id === user.id
    );
  }, [user, getAllEquipment]);

  // Memoizar cálculo de estatísticas
  const calculatedStats = useMemo(() => {
    if (!filteredEquipment.length) {
      return { total: 0, ok: 0, vencido: 0, pendente: 0 };
    }
    return calculateEquipmentStats(filteredEquipment);
  }, [filteredEquipment]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      // Se o cache está obsoleto, atualizar primeiro
      if (isStale() && !cache.isLoading) {
        await refreshCache();
      }

      setLoadingStats(true);

      try {
        setStats(calculatedStats);
      } catch (err: any) {
        handleError(err, 'equipment', 'Erro ao buscar estatísticas de equipamentos');
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user, calculatedStats, cache.isLoading, isStale, refreshCache, handleError]);

  const isLoading = authLoading || loadingStats;

  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300 relative" style={{ backgroundColor: '#000000' }}>
      <DashboardHeader />
      <main className="px-ios-4 flex-grow py-ios-4 pb-32 relative" style={{ backgroundColor: '#000000', paddingTop: 'calc(80px + env(safe-area-inset-top, 0px))' }}>
        <motion.div 
          data-tour="dashboard-welcome"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="mb-ios-6"
        >
          {isLoading ? (
            <Skeleton className="h-9 w-2/3 mb-4" />
          ) : (
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, ease: [0.4, 0, 0.2, 1] }}
              className="text-section-title font-semibold text-white mb-2"
              style={{ letterSpacing: '-0.3px' }}
            >
              {t('dashboard.hello')}, {profile?.full_name ?? t('dashboard.user')}
            </motion.h2>
          )}
          <TrialStatusBar profile={profile} />
        </motion.div>

        <InstructionsPanel equipmentType="dashboard" />

        {/* Apple Activity Rings */}
        {isLoading ? (
          <div className="mb-ios-6">
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="mb-ios-6"
          >
            <AppleActivityCard
              title={t('dashboard.equipmentStatus')}
              data={{
                total: stats.total,
                ok: stats.ok,
                vencido: stats.vencido,
                pendente: stats.pendente,
              }}
            />
          </motion.div>
        )}
        
        <AlertsList userId={user?.id} />
      </main>
    </div>
  );
};

export default memo(Dashboard);
