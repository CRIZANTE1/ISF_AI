import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import DashboardHeader from '../components/DashboardHeader';
import MetricCard from '../components/MetricCard';
import AlertsList from '../components/AlertsList';
import Skeleton from '../components/Skeleton';
import TrialStatusBar from '../components/TrialStatusBar';

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
        const [
          { count: total, error: totalError },
          { count: ok, error: okError },
          { count: vencido, error: vencidoError },
          { count: pendente, error: pendenteError }
        ] = await Promise.all([
          supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'ok'),
          supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'vencido'),
          supabase.from('equipment').select('*', { count: 'exact', head: true }).eq('user_id', user.id).eq('status', 'pendente')
        ]);
        
        if (totalError || okError || vencidoError || pendenteError) {
            throw new Error('Erro ao buscar estatísticas de equipamentos.');
        }

        setStats({
          total: total ?? 0,
          ok: ok ?? 0,
          vencido: vencido ?? 0,
          pendente: pendente ?? 0,
        });

      } catch (err: any) {
        setError(err.message);
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
