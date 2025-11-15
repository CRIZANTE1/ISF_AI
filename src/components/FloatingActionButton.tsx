import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  to: string;
}

const FloatingActionButton = ({ to }: FloatingActionButtonProps) => {
  return (
    <Link
      to={to}
      className="fixed bottom-32 right-4 z-[60] w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-colors"
      style={{ backgroundColor: '#6B7280' }}
      aria-label="Adicionar novo item"
    >
      <Plus size={28} />
    </Link>
  );
};

export default FloatingActionButton;
