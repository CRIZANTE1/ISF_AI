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
        <div className="w-full rounded-full h-1.5" style={{ backgroundColor: 'rgba(0, 217, 126, 0.2)' }}>
          <div className="h-1.5 rounded-full" style={{ width: '100%', backgroundColor: '#00D97E' }}></div>
        </div>
        <p className="text-xs mt-1" style={{ color: '#FFFFFF' }}>Acesso total ao Plano Premium.</p>
      </div>
    );
  }

  if (!trial_ends_at) {
    return (
      <div className="mt-2">
        <div className="w-full rounded-full h-1.5" style={{ backgroundColor: '#2A2A2A' }}>
          <div className="h-1.5 rounded-full" style={{ width: '100%', backgroundColor: '#FF3B30' }}></div>
        </div>
        <p className="text-xs mt-1" style={{ color: '#FF3B30' }}>Período de teste expirado.</p>
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
        <div className="w-full rounded-full h-1.5" style={{ backgroundColor: '#2A2A2A' }}>
          <div className="h-1.5 rounded-full" style={{ width: '100%', backgroundColor: '#FF3B30' }}></div>
        </div>
        <p className="text-xs mt-1" style={{ color: '#FF3B30' }}>Período de teste expirado.</p>
      </div>
    );
  }

  const totalTrialDays = 14;
  const percentage = Math.max(0, (diffDays / totalTrialDays) * 100);

  return (
    <div className="mt-2">
      <div className="w-full rounded-full h-1.5" style={{ backgroundColor: '#2A2A2A' }}>
        <div className="h-1.5 rounded-full" style={{ width: `${percentage}%`, backgroundColor: '#FFA800' }}></div>
      </div>
      <p className="text-xs mt-1" style={{ color: '#B0B0B0' }}>
        {diffDays} dia{diffDays !== 1 ? 's' : ''} restante{diffDays !== 1 ? 's' : ''} no período de teste.
      </p>
    </div>
  );
};

export default TrialStatusBar;
