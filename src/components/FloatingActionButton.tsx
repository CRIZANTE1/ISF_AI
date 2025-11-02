import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';

interface FloatingActionButtonProps {
  to: string;
}

const FloatingActionButton = ({ to }: FloatingActionButtonProps) => {
  return (
    <Link
      to={to}
      className="fixed bottom-20 right-4 z-20 w-14 h-14 bg-brand-green rounded-full flex items-center justify-center text-white shadow-lg hover:bg-green-600 transition-colors"
      aria-label="Adicionar novo item"
    >
      <Plus size={28} />
    </Link>
  );
};

export default FloatingActionButton;
