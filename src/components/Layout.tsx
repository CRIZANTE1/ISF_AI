import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen font-sans bg-black text-white transition-colors duration-300">
      <div className="pb-32">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
