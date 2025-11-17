import { Profile } from '../contexts/AuthContext';
import { motion } from 'framer-motion';
import { useTranslation } from '../hooks/useTranslation';

interface TrialStatusBarProps {
  profile: Profile | null;
}

const TrialStatusBar = ({ profile }: TrialStatusBarProps) => {
  const { t } = useTranslation();
  
  if (!profile) return null;

  const { plan, trial_ends_at } = profile;

  if (plan === 'premium') {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="mt-2"
      >
        <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'rgba(83, 215, 105, 0.2)' }}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: '100%' }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
            className="h-1.5 rounded-full" 
            style={{ backgroundColor: '#53D769' }}
          />
        </div>
        <p className="text-xs mt-2 text-[#8E8E93]">
          {t('profile.premiumAccess', { defaultValue: 'Acesso total ao Plano Premium.' })}
        </p>
      </motion.div>
    );
  }

  if (!trial_ends_at) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="mt-2"
      >
        <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'rgba(252, 61, 57, 0.2)' }}>
          <div className="h-1.5 rounded-full" style={{ width: '100%', backgroundColor: '#FC3D39' }} />
        </div>
        <p className="text-xs mt-2" style={{ color: '#FC3D39' }}>
          {t('profile.trialExpired', { defaultValue: 'Período de teste expirado.' })}
        </p>
      </motion.div>
    );
  }

  const endDate = new Date(trial_ends_at);
  const now = new Date();
  const diffTime = endDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays <= 0) {
    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="mt-2"
      >
        <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: 'rgba(252, 61, 57, 0.2)' }}>
          <div className="h-1.5 rounded-full" style={{ width: '100%', backgroundColor: '#FC3D39' }} />
        </div>
        <p className="text-xs mt-2" style={{ color: '#FC3D39' }}>
          {t('profile.trialExpired', { defaultValue: 'Período de teste expirado.' })}
        </p>
      </motion.div>
    );
  }

  const totalTrialDays = 14;
  const percentage = Math.max(0, (diffDays / totalTrialDays) * 100);
  
  // Define a cor baseada nos dias restantes
  // Verde quando tem mais de 7 dias, laranja quando tem 3-7 dias, vermelho quando tem menos de 3 dias
  let barColor = '#53D769'; // Verde
  let barBgColor = 'rgba(83, 215, 105, 0.2)'; // Verde claro
  let textColor = '#8E8E93'; // Cinza
  
  if (diffDays <= 3) {
    barColor = '#FC3D39'; // Vermelho
    barBgColor = 'rgba(252, 61, 57, 0.2)'; // Vermelho claro
    textColor = '#FC3D39'; // Vermelho
  } else if (diffDays <= 7) {
    barColor = '#FF9500'; // Laranja
    barBgColor = 'rgba(255, 149, 0, 0.2)'; // Laranja claro
    textColor = '#FF9500'; // Laranja
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3, ease: [0.4, 0, 0.2, 1] }}
      className="mt-2"
    >
      <div className="w-full rounded-full h-1.5 overflow-hidden" style={{ backgroundColor: barBgColor }}>
        <motion.div 
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          className="h-1.5 rounded-full" 
          style={{ backgroundColor: barColor }}
        />
      </div>
      <p className="text-xs mt-2" style={{ color: textColor }}>
        {t('profile.trialDaysRemaining', { 
          count: diffDays, 
          defaultValue: `${diffDays} dia${diffDays !== 1 ? 's' : ''} restante${diffDays !== 1 ? 's' : ''} no período de teste.` 
        })}
      </p>
    </motion.div>
  );
};

export default TrialStatusBar;
