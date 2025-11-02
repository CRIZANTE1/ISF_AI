import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="bg-light-background dark:bg-dark-background text-light-text-primary dark:text-dark-text-primary min-h-screen font-sans transition-colors duration-200">
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
