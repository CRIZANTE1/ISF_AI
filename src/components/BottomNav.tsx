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
      className="fixed bottom-4 left-4 right-4 h-16 bg-white dark:bg-dark-surface rounded-3xl shadow-2xl border border-light-border dark:border-dark-border flex items-center justify-around px-2 z-50 backdrop-blur-xl bg-opacity-95 dark:bg-opacity-95"
    >
      {navItems.slice(0, 2).map((item, index) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center h-full px-3 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'text-brand-blue dark:text-brand-blue' 
                : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-blue dark:hover:text-brand-blue'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <motion.div
                initial={false}
                animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative"
              >
                <item.icon 
                  className={`w-6 h-6 mb-1 ${isActive ? 'text-brand-blue dark:text-brand-blue' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </motion.div>
              <motion.span 
                animate={{ fontSize: isActive ? '0.75rem' : '0.7rem', fontWeight: isActive ? 700 : 500 }}
                className={`text-xs relative z-10 ${isActive ? 'text-brand-blue dark:text-brand-blue' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
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
        whileHover={{ scale: 1.1, rotate: 90 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-14 h-14 bg-gradient-to-br from-brand-blue via-brand-purple to-brand-blue rounded-full shadow-2xl transition-all relative overflow-hidden group"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 bg-gradient-to-br from-brand-blue via-brand-purple to-brand-blue opacity-0 group-hover:opacity-100 transition-opacity"
        />
        <Plus className="w-6 h-6 text-white relative z-10" strokeWidth={3} />
      </motion.button>

      {navItems.slice(2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `relative flex flex-col items-center justify-center h-full px-3 rounded-xl transition-all duration-300 ${
              isActive 
                ? 'text-brand-purple dark:text-brand-purple' 
                : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-brand-purple dark:hover:text-brand-purple'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <motion.div
                initial={false}
                animate={isActive ? { scale: 1.2 } : { scale: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
                className="relative"
              >
                <item.icon 
                  className={`w-6 h-6 mb-1 ${isActive ? 'text-brand-purple dark:text-brand-purple' : ''}`}
                  strokeWidth={isActive ? 2.5 : 2} 
                />
              </motion.div>
              <motion.span 
                animate={{ fontSize: isActive ? '0.75rem' : '0.7rem', fontWeight: isActive ? 700 : 500 }}
                className={`text-xs relative z-10 ${isActive ? 'text-brand-purple dark:text-brand-purple' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}
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
