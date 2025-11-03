import { Bell } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale/pt-BR';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const DashboardHeader = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const today = new Date();
  const formattedDate = format(today, "EEEE, d 'de' MMMM", { locale: ptBR });
  const userInitial = profile?.full_name?.charAt(0).toUpperCase() || 'U';

  return (
    <header 
      className="sticky top-0 z-40 frosted-glass border-b border-[var(--border-current)]"
      style={{ 
        paddingLeft: '16px',
        paddingRight: '16px',
        paddingTop: '12px',
        paddingBottom: '12px'
      }}
    >
      <div className="flex justify-between items-center">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
          className="flex flex-col"
        >
          <h1 className="text-screen-title font-semibold text-[var(--text-primary-current)] mb-1" style={{ letterSpacing: '-0.5px' }}>
            {formattedDate.split(',')[0]}
          </h1>
          <p className="text-body text-[var(--text-secondary-current)]">
            {formattedDate.split(',')[1].trim()}
          </p>
        </motion.div>
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2.5 rounded-full transition-colors hover:bg-[var(--surface-current)]"
            aria-label="Notificações"
          >
            <Bell size={22} strokeWidth={2} className="text-[var(--text-secondary-current)]" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#72DEFF' }}></span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-10 h-10 rounded-full flex items-center justify-center shadow-apple-sm transition-all hover:shadow-apple-md"
            style={{ 
              backgroundColor: '#72DEFF',
              boxShadow: '0 2px 8px rgba(114, 222, 255, 0.25)'
            }}
            aria-label="Perfil"
          >
            <span className="text-sm font-semibold text-white">{userInitial}</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
