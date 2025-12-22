import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { useTranslation } from '../hooks/useTranslation';
import { useHaptics } from '../hooks/useHaptics';

interface FloatingActionButtonProps {
  to: string;
}

const FloatingActionButton = ({ to }: FloatingActionButtonProps) => {
  const { t } = useTranslation();
  const haptics = useHaptics();
  
  return (
    <Link
      to={to}
      onClick={() => haptics.light()}
      className="fixed bottom-32 right-4 z-[60] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
      style={{ backgroundColor: '#6B7280' }}
      aria-label={t('equipment.add', { defaultValue: 'Adicionar novo item' })}
    >
      <Plus size={28} />
    </Link>
  );
};

export default FloatingActionButton;
