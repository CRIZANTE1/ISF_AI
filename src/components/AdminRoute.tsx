import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { profile, loading, user } = useAuth();

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-light-background dark:bg-dark-background transition-colors duration-200">
            <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FFFFFF', borderTopColor: 'transparent' }}></div>
        </div>
    );
  }

  if (!user) {
    // User not logged in, redirect to auth
    return <Navigate to="/auth" replace />;
  }

  if (profile?.role !== 'admin') {
    // Redirect non-admin users to the dashboard with a message
    logger.warn('Acesso negado: Usuário não é administrador', 'permission', { role: profile?.role });
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
