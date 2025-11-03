import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen font-sans bg-[var(--bg-current)] text-[var(--text-primary-current)] transition-colors duration-300">
      <div className="pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
