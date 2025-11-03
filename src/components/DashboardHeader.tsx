import { Bell, User } from 'lucide-react';
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
      className="flex flex-col pt-12 pb-6 border-b" 
      style={{ 
        backgroundColor: '#121212', 
        borderColor: '#2A2A2A',
        borderBottomWidth: '1px',
        paddingLeft: '16px',
        paddingRight: '16px'
      }}
    >
      <div className="flex justify-between items-center mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col"
        >
          <h1 className="mb-2" style={{ fontSize: '28px', fontWeight: 600, color: '#FFFFFF', fontFamily: 'Poppins, Inter, sans-serif' }}>
            {formattedDate.split(',')[0]}
          </h1>
          <p style={{ fontSize: '16px', color: '#B0B0B0', fontFamily: 'Inter, sans-serif' }}>
            {formattedDate.split(',')[1].trim()}
          </p>
        </motion.div>
        <div className="flex items-center gap-4">
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative p-3 rounded-full transition-colors"
            style={{ backgroundColor: 'transparent', color: '#B0B0B0' }}
          >
            <Bell size={22} strokeWidth={2} color="#B0B0B0" />
            <span className="absolute top-2.5 right-2.5 w-2 h-2 rounded-full" style={{ backgroundColor: '#00C8FF' }}></span>
          </motion.button>
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/profile')}
            className="w-11 h-11 rounded-full flex items-center justify-center shadow-lg transition-opacity"
            style={{ backgroundColor: '#00C8FF' }}
          >
            <span className="text-sm font-semibold text-white">{userInitial}</span>
          </motion.button>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
