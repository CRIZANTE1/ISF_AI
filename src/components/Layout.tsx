import { Outlet } from 'react-router-dom';
import BottomNav from './BottomNav';

const Layout = () => {
  return (
    <div className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/20 dark:from-dark-background dark:via-dark-background dark:to-dark-background text-light-text-primary dark:text-dark-text-primary min-h-screen font-sans transition-colors duration-200">
      <div className="pb-20">
        <Outlet />
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
