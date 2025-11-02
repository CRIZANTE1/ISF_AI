import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardHeader from '../components/DashboardHeader';
import MetricCard from '../components/MetricCard';
import AlertsList from '../components/AlertsList';
import Skeleton from '../components/Skeleton';
import TrialStatusBar from '../components/TrialStatusBar';
import { motion } from 'framer-motion';
import { getAllExtinguishers } from '../utils/extinguisherOperations';
import { getAllHoses } from '../utils/hoseOperations';
import { getAllSCBAs } from '../utils/scbaOperations';
import { getAllMultigasDetectors } from '../utils/multigasOperations';
import { getAllFoamChambers } from '../utils/foamChamberOperations';
import { getAllCannonMonitors } from '../utils/cannonMonitorOperations';
import { getAllEyewashStations } from '../utils/eyewashOperations';
import { getAllAlarmSystems } from '../utils/alarmOperations';
import { getAllShelters } from '../utils/shelterOperations';

interface Stats {
  total: number;
  ok: number;
  vencido: number;
  pendente: number;
}

const Dashboard = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!user) return;

      setLoadingStats(true);
      setError(null);

      try {
        // Buscar todos os equipamentos de todas as tabelas especializadas
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

        // Filtrar apenas equipamentos do usuário atual (se aplicável)
        // Nota: As tabelas especializadas já filtram por user_id nas funções getAll*
        const allEquipment = [
          ...extinguishers,
          ...hoses,
          ...scbas,
          ...multigasDetectors,
          ...foamChambers,
          ...cannonMonitors,
          ...eyewashStations,
          ...alarmSystems,
          ...shelters,
        ].filter((eq: any) => !eq.user_id || eq.user_id === user.id);

        // Calcular estatísticas
        const total = allEquipment.length;
        
        // Para equipamentos, vamos considerar "ok" como padrão se não houver status específico
        // Isso é uma simplificação - em produção, você pode querer verificar status específicos
        const ok = allEquipment.length; // Simplificado - todos são considerados ok por padrão
        const vencido = 0; // Pode ser calculado baseado em datas de validade
        const pendente = 0; // Pode ser calculado baseado em próximas inspeções

        setStats({
          total,
          ok,
          vencido,
          pendente,
        });
      } catch (err: any) {
        setError(err.message || 'Erro ao buscar estatísticas de equipamentos.');
      } finally {
        setLoadingStats(false);
      }
    };

    if (user) {
      fetchStats();
    }
  }, [user]);

  const isLoading = authLoading || loadingStats;

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-dark-background dark:via-dark-background dark:to-dark-background transition-colors duration-200">
      <DashboardHeader />
      <main className="p-4 flex-grow">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          {isLoading ? (
            <Skeleton className="h-7 w-1/2 mb-2" />
          ) : (
            <motion.h2 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="text-2xl font-bold text-light-text-primary dark:text-dark-text-primary mb-2 transition-colors duration-200"
            >
              Olá, <span className="bg-gradient-to-r from-brand-blue to-brand-purple bg-clip-text text-transparent font-bold">{profile?.full_name ?? 'Usuário'}</span>
            </motion.h2>
          )}
          <TrialStatusBar profile={profile} />
        </motion.div>

        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl mb-4 transition-colors duration-200" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, staggerChildren: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4 }}
          >
            <MetricCard 
              title="Total" 
              value={stats?.total ?? null} 
              isLoading={isLoading} 
              percentage={stats?.total ? (stats.total / (stats.total || 1)) * 100 : 0}
              color="orange"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
          >
            <MetricCard 
              title="OK" 
              value={stats?.ok ?? null} 
              isLoading={isLoading}
              percentage={stats?.ok && stats?.total ? (stats.ok / stats.total) * 100 : 0}
              color="green"
            />
          </motion.div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6 }}
          >
            <MetricCard 
              title="Pendente" 
              value={stats?.pendente ?? null} 
              isLoading={isLoading}
              percentage={stats?.pendente && stats?.total ? (stats.pendente / stats.total) * 100 : 0}
              color="blue"
            />
          </motion.div>
        </motion.div>
        
        <AlertsList userId={user?.id} />
      </main>
    </div>
  );
};

export default Dashboard;
