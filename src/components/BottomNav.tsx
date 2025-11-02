import { NavLink } from 'react-router-dom';
import { LayoutGrid, ClipboardCheck, UserCircle, History, Wrench } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const allNavItems = [
  { to: '/', icon: LayoutGrid, label: 'Dashboard' },
  { to: '/inspections', icon: ClipboardCheck, label: 'Inspections' },
  { to: '/profile', icon: UserCircle, label: 'Profile' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/utilities', icon: Wrench, label: 'Utilities', adminOnly: true },
];

const BottomNav = () => {
  const { profile } = useAuth();

  const navItems = allNavItems.filter(item => {
    if (item.adminOnly) {
      return profile?.role === 'admin';
    }
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-16 bg-light-surface dark:bg-dark-surface border-t border-light-border dark:border-dark-border flex justify-around items-center">
      {navItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center w-full h-full relative transition-colors duration-200 ${
              isActive ? 'text-brand-green' : 'text-dark-text-secondary'
            }`
          }
        >
          {({ isActive }) => (
            <>
              <div className={`absolute top-0 h-0.5 w-10 bg-brand-green transition-opacity duration-200 ${isActive ? 'opacity-100' : 'opacity-0'}`}></div>
              <item.icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
};

export default BottomNav;
