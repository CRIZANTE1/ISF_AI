import { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import DashboardHeader from '../components/DashboardHeader';
import MetricCard from '../components/MetricCard';
import AlertsList from '../components/AlertsList';
import Skeleton from '../components/Skeleton';
import TrialStatusBar from '../components/TrialStatusBar';
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
    <div className="flex flex-col min-h-screen bg-light-background dark:bg-dark-background">
      <DashboardHeader />
      <main className="p-4 flex-grow">
        <div className="mb-6">
          {isLoading ? (
            <Skeleton className="h-7 w-1/2" />
          ) : (
            <h2 className="text-2xl font-light text-light-text-primary dark:text-dark-text-primary">
              Olá, <span className="font-semibold">{profile?.full_name ?? 'Usuário'}</span>
            </h2>
          )}
          <TrialStatusBar profile={profile} />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg" role="alert">
            <strong className="font-bold">Erro: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <MetricCard title="Total" value={stats?.total ?? null} isLoading={isLoading} />
          <MetricCard title="OK" value={stats?.ok ?? null} isLoading={isLoading} />
          <MetricCard title="Vencido" value={stats?.vencido ?? null} isLoading={isLoading} />
          <MetricCard title="Pendente" value={stats?.pendente ?? null} isLoading={isLoading} />
        </div>
        
        <AlertsList userId={user?.id} />
      </main>
    </div>
  );
};

export default Dashboard;
