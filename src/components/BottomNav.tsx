import { NavLink } from 'react-router-dom';
import { LayoutGrid, ClipboardCheck, UserCircle, History, Wrench, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const allNavItems = [
  { to: '/', icon: LayoutGrid, label: 'Home' },
  { to: '/inspections', icon: ClipboardCheck, label: 'Inspections' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
  { to: '/utilities', icon: Wrench, label: 'Utilities', adminOnly: true },
];

const BottomNav = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const navItems = allNavItems.filter(item => {
    if (item.adminOnly) {
      return profile?.role === 'admin';
    }
    return true;
  });

  return (
    <nav className="fixed bottom-4 left-4 right-4 h-16 bg-light-surface dark:bg-dark-surface rounded-2xl shadow-card-lg border border-light-border dark:border-dark-border flex items-center justify-around px-2 z-50 transition-colors duration-200">
      {navItems.slice(0, 2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full px-3 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary' 
                : 'text-light-text-secondary dark:text-dark-text-secondary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-medium ${isActive ? 'text-light-text-primary dark:text-dark-text-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
      
      {/* Botão central de adicionar */}
      <button
        onClick={() => navigate('/inspections')}
        className="flex items-center justify-center w-14 h-14 bg-light-text-primary dark:bg-dark-text-primary rounded-full shadow-lg hover:bg-opacity-90 dark:hover:bg-opacity-90 transition-all transform hover:scale-105"
      >
        <Plus className="w-6 h-6 text-white dark:text-dark-background" strokeWidth={3} />
      </button>

      {navItems.slice(2).map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center h-full px-3 rounded-xl transition-all duration-200 ${
              isActive 
                ? 'bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary' 
                : 'text-light-text-secondary dark:text-dark-text-secondary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="w-6 h-6 mb-1" strokeWidth={isActive ? 2.5 : 2} />
              <span className={`text-xs font-medium ${isActive ? 'text-light-text-primary dark:text-dark-text-primary' : 'text-light-text-secondary dark:text-dark-text-secondary'}`}>
                {item.label}
              </span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
