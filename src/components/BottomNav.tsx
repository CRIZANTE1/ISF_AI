import { NavLink } from 'react-router-dom';
import { LayoutGrid, ClipboardCheck, History, Wrench, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const allNavItems = [
  { to: '/', icon: LayoutGrid, label: 'Home' },
  { to: '/inspections', icon: ClipboardCheck, label: 'Inspections' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/utilities', icon: Wrench, label: 'Utilities', adminOnly: true },
];

const BottomNav = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const navItems = allNavItems.filter(item => {
    if (item.adminOnly) {
      return profile?.role === 'admin';
    }
    // Remover Profile da navegação inferior (mantém apenas no topo)
    if (item.to === '/profile') {
      return false;
    }
    return true;
  });

  return (
    <motion.nav 
      initial={{ y: 100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="fixed bottom-0 left-0 right-0 h-20 flex items-center justify-around px-4 z-50 border-t"
      style={{ 
        backgroundColor: '#121212', 
        borderTopColor: '#2A2A2A',
        borderTopWidth: '1px',
        boxShadow: '0 -2px 10px rgba(0, 0, 0, 0.5)'
      }}
    >
      {navItems.slice(0, 2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className="relative flex flex-col items-center justify-center h-full px-4 transition-all duration-200"
        >
          {({ isActive }) => (
            <>
              <motion.div
                initial={false}
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative mb-1"
              >
                <item.icon 
                  className="w-6 h-6"
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? '#00C8FF' : '#B0B0B0'}
                />
              </motion.div>
              <motion.span 
                animate={{ fontSize: isActive ? '0.7rem' : '0.65rem', fontWeight: isActive ? 600 : 400 }}
                className="text-xs relative z-10"
                style={{ color: isActive ? '#00C8FF' : '#B0B0B0' }}
              >
                {item.label}
              </motion.span>
            </>
          )}
        </NavLink>
      ))}
      
      {/* Botão central de adicionar */}
      <motion.button
        onClick={() => navigate('/inspections')}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-14 h-14 rounded-full shadow-card-lg transition-all"
        style={{ 
          backgroundColor: '#00C8FF',
          boxShadow: '0 4px 16px rgba(0, 200, 255, 0.4)'
        }}
      >
        <Plus className="w-6 h-6 text-white" strokeWidth={2.5} />
      </motion.button>

      {navItems.slice(2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className="relative flex flex-col items-center justify-center h-full px-4 transition-all duration-200"
        >
          {({ isActive }) => (
            <>
              <motion.div
                initial={false}
                animate={isActive ? { scale: 1.1 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative mb-1"
              >
                <item.icon 
                  className="w-6 h-6"
                  strokeWidth={isActive ? 2.5 : 2}
                  color={isActive ? '#00C8FF' : '#B0B0B0'}
                />
              </motion.div>
              <motion.span 
                animate={{ fontSize: isActive ? '0.7rem' : '0.65rem', fontWeight: isActive ? 600 : 400 }}
                className="text-xs relative z-10"
                style={{ color: isActive ? '#00C8FF' : '#B0B0B0' }}
              >
                {item.label}
              </motion.span>
            </>
          )}
        </NavLink>
      ))}
    </motion.nav>
  );
};

export default BottomNav;
