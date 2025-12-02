import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import LoadingScreen from './LoadingScreen';

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { profile, loading, user } = useAuth();

  if (loading) {
    return <LoadingScreen fullScreen={true} size="lg" color="white" />;
  }

  if (!user) {
    // User not logged in, redirect to auth
    return <Navigate to="/auth" replace />;
  }

  // Permitir acesso para admins OU usuários com dev = true
  if (profile?.role !== 'admin' && profile?.dev !== true) {
    // Redirect non-admin users to the dashboard with a message
    logger.warn('Acesso negado: Usuário não é administrador nem desenvolvedor', 'permission', { 
      role: profile?.role, 
      dev: profile?.dev 
    });
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
