import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import BottomNav from './BottomNav';
import PageTransition from './PageTransition';
import AppOnboardingTour from './AppOnboardingTour';
import OfflineIndicator from './OfflineIndicator';

const Layout = () => {
  const location = useLocation();

  return (
    <div 
      className="min-h-screen font-sans text-white transition-colors duration-300 relative" 
      style={{ 
        position: 'relative', 
        width: '100%', 
        minHeight: '100vh', 
        backgroundColor: '#000000',
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}
    >
      <div 
        className="relative" 
        style={{ 
          zIndex: 10, 
          position: 'relative', 
          minHeight: 'calc(100vh - env(safe-area-inset-top, 0px) - env(safe-area-inset-bottom, 0px))',
          backgroundColor: '#000000',
          paddingBottom: '120px',
        }}
      >
        <AnimatePresence mode="wait">
          <PageTransition key={location.pathname}>
            <Outlet />
          </PageTransition>
        </AnimatePresence>
      </div>
      <BottomNav />
      <OfflineIndicator />
      <AppOnboardingTour />
    </div>
  );
};

export default Layout;
