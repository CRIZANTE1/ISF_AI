import { Profile } from '../contexts/AuthContext';

interface TrialStatusBarProps {
  profile: Profile | null;
}

const TrialStatusBar = ({ profile }: TrialStatusBarProps) => {
  if (!profile) return null;

  const { plan, trial_ends_at } = profile;

  if (plan === 'premium') {
    return (
      <div className="mt-2">
        <div className="w-full bg-brand-green/30 rounded-full h-1.5">
          <div className="bg-brand-green h-1.5 rounded-full" style={{ width: '100%' }}></div>
        </div>
        <p className="text-xs text-brand-green mt-1">Acesso total ao Plano Premium.</p>
      </div>
    );
  }

  if (!trial_ends_at) {
    return (
      <div className="mt-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div className="bg-status-error h-1.5 rounded-full" style={{ width: '100%' }}></div>
        </div>
        <p className="text-xs text-status-error mt-1">Período de teste expirado.</p>
      </div>
    );
  }

  const endDate = new Date(trial_ends_at);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return (
      <div className="mt-2">
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
          <div className="bg-status-error h-1.5 rounded-full" style={{ width: '100%' }}></div>
        </div>
        <p className="text-xs text-status-error mt-1">Período de teste expirado.</p>
      </div>
    );
  }

  const totalTrialDays = 14;
  const percentage = Math.max(0, (diffDays / totalTrialDays) * 100);

  return (
    <div className="mt-2">
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
        <div className="bg-status-warning h-1.5 rounded-full" style={{ width: `${percentage}%` }}></div>
      </div>
      <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
        {diffDays} dia{diffDays !== 1 ? 's' : ''} restante{diffDays !== 1 ? 's' : ''} no período de teste.
      </p>
    </div>
  );
};

export default TrialStatusBar;
