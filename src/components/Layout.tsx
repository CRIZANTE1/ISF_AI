import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';
import Starfield from './ui/Starfield';

const Layout = () => {
  return (
    <div className="min-h-screen font-sans text-white transition-colors duration-300 relative" style={{ position: 'relative', width: '100%', height: '100%', minHeight: '100vh', backgroundColor: 'transparent' }}>
      <Starfield 
        starColor="rgba(255,255,255,0.8)"
        bgColor="rgba(0,0,0,1)"
        mouseAdjust={false}
        speed={0.08}
        quantity={256}
        opacity={1}
      />
      <div className="pb-32 relative" style={{ zIndex: 10, position: 'relative', minHeight: '100vh', backgroundColor: 'transparent' }}>
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
