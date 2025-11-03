import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="bg-dark-primary text-text-primary min-h-screen font-sans" style={{ backgroundColor: '#121212' }}>
      <div className="pb-24">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
