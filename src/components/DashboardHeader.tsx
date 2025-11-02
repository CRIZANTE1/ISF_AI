import { Bell, UserCircle, ChevronDown, Calendar } from 'lucide-react';
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
    <header className="flex flex-col px-4 pt-3 pb-4 bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-dark-surface dark:via-dark-surface dark:to-dark-surface border-b border-light-border dark:border-dark-border transition-colors duration-200">
      <div className="flex justify-between items-center h-14">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center gap-3"
        >
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-brand-blue to-brand-purple flex items-center justify-center shadow-lg ring-2 ring-white dark:ring-dark-border">
            <span className="text-white text-sm font-bold">{userInitial}</span>
          </div>
        </motion.div>
        <div className="flex items-center gap-3">
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-blue dark:hover:text-brand-blue transition-colors rounded-lg hover:bg-blue-50 dark:hover:bg-dark-background"
          >
            <Bell size={22} />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="p-2 text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-purple dark:hover:text-brand-purple transition-colors rounded-lg hover:bg-purple-50 dark:hover:bg-dark-background"
          >
            <UserCircle size={22} />
          </motion.button>
        </div>
      </div>
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className="mb-2"
      >
        <div className="flex items-center gap-2">
          <Calendar className="text-brand-blue dark:text-brand-blue" size={20} />
          <h1 className="text-2xl font-bold bg-gradient-to-r from-light-text-primary to-brand-blue dark:from-dark-text-primary dark:to-brand-blue bg-clip-text text-transparent capitalize">
            {formattedDate}
          </h1>
          <ChevronDown size={18} className="text-light-text-secondary dark:text-dark-text-secondary" />
        </div>
      </motion.div>
    </header>
  );
};

export default DashboardHeader;
