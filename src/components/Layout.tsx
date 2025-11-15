import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './BottomNav';
import PageTransition from './PageTransition';
import OfflineIndicator from './OfflineIndicator';

const Layout = () => {
  const location = useLocation();

  return (
    <div className="min-h-screen font-sans text-white transition-colors duration-300 relative" style={{ position: 'relative', width: '100%', minHeight: '100vh', backgroundColor: '#000000' }}>
      <OfflineIndicator />
      <div className="pb-40 relative" style={{ zIndex: 10, position: 'relative', minHeight: '100vh', backgroundColor: '#000000' }}>
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </div>
      <BottomNav />
    </div>
  );
};

export default Layout;
