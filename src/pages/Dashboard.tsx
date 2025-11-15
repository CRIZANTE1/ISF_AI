import { useEffect, useState } from 'react';
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
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      // Se o cache está obsoleto, atualizar primeiro
      if (isStale() && !cache.isLoading) {
        await refreshCache();
      }

      setLoadingStats(true);

      try {
        // Usar dados do cache em vez de fazer novas chamadas
        const allEquipment = getAllEquipment().filter(
          (eq: any) => !eq.user_id || eq.user_id === user.id
        );

        // Calcular estatísticas baseado nas datas de validade/inspeção
        const calculatedStats = calculateEquipmentStats(allEquipment);

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
  }, [user, getAllEquipment, cache.isLoading, isStale, refreshCache]);

  const isLoading = authLoading || loadingStats;

  return (
    <div className="flex flex-col min-h-screen transition-colors duration-300 relative" style={{ backgroundColor: '#000000' }}>
      <DashboardHeader />
      <main className="px-ios-4 flex-grow py-ios-4 pb-32 relative" style={{ backgroundColor: '#000000' }}>
        <motion.div 
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
              Olá, {profile?.full_name ?? 'Usuário'}
            </motion.h2>
          )}
          <TrialStatusBar profile={profile} />
        </motion.div>

        <InstructionsPanel equipmentType="dashboard" />

        {/* Apple Activity Rings */}
        {!isLoading && stats && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="mb-ios-6"
          >
            <AppleActivityCard
              title="Status dos Equipamentos"
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

export default Dashboard;
