import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="min-h-screen font-sans text-white transition-colors duration-300 relative" style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: '#000000' }}>
      <div className="pb-40 relative" style={{ zIndex: 10, position: 'relative', minHeight: '100vh', backgroundColor: '#000000' }}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
