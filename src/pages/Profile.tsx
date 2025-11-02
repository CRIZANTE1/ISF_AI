import { useAuth } from '../contexts/AuthContext';
import { LogOut } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import TrialStatusBar from '../components/TrialStatusBar';

const Profile = () => {
  const { profile, user, signOut, loading } = useAuth();

  const getPlanBadge = (plan: 'trial' | 'premium' | undefined) => {
    switch (plan) {
        case 'premium':
            return {
                name: '✨ Plano Premium',
                textColor: 'text-brand-green',
                bgColor: 'bg-brand-green/10 dark:bg-brand-green/20',
            };
        case 'trial':
            return {
                name: '⏳ Plano Trial',
                textColor: 'text-status-warning',
                bgColor: 'bg-status-warning/10 dark:bg-status-warning/20',
            };
        default:
            return {
                name: 'Plano Desconhecido',
                textColor: 'text-light-text-secondary dark:text-dark-text-secondary',
                bgColor: 'bg-gray-200 dark:bg-gray-700',
            };
    }
  };

  const planBadge = getPlanBadge(profile?.plan);

  if (loading) {
    return (
      <div className="p-4 flex flex-col items-center text-center">
        <Skeleton className="w-24 h-24 rounded-full mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-56 mb-8" />
        <Skeleton className="h-24 w-full max-w-sm" />
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col items-center text-center">
      <div className="w-24 h-24 rounded-full bg-brand-green/20 flex items-center justify-center mb-4">
        <span className="text-4xl font-bold text-brand-green">
          {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
        </span>
      </div>
      <h1 className="text-2xl font-bold font-display">{profile?.full_name ?? 'Nome do Usuário'}</h1>
      {profile?.role === 'admin' && (
        <span className="mt-2 text-xs font-semibold inline-block py-1 px-2.5 uppercase rounded-full text-status-info bg-status-info/20">
            Administrador
        </span>
      )}
      <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2">{user?.email ?? 'email@exemplo.com'}</p>
      
      <div className={`mt-8 w-full max-w-sm ${planBadge.bgColor} p-4 rounded-lg text-left`}>
          <p className={`text-sm font-bold ${planBadge.textColor}`}>{planBadge.name}</p>
          <TrialStatusBar profile={profile} />
      </div>

      <div className="mt-8 w-full max-w-sm space-y-2">
        <button className="w-full text-left p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">Meus Dados</button>
        <button className="w-full text-left p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">Plano e Pagamento</button>
        <button className="w-full text-left p-3 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">Configurações</button>
      </div>

      <button 
        onClick={signOut}
        className="mt-8 w-full max-w-sm flex items-center justify-center gap-2 p-3 border border-status-error/50 text-status-error rounded-lg hover:bg-status-error/10 transition-colors"
      >
        <LogOut size={16} />
        Sair da Conta
      </button>
    </div>
  );
};
export default Profile;
