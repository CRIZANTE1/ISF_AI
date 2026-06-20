import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logger } from '../utils/logger';
import { FullScreenSkeleton } from './skeletons';

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { profile, loading, user, profileError, refreshProfile } = useAuth();

  if (loading) {
    return <FullScreenSkeleton />;
  }

  if (!user) {
    // User not logged in, redirect to auth
    return <Navigate to="/auth" replace />;
  }

  // Se há erro ao carregar perfil, mostra tela de erro
  if (profileError && !profile) {
    return (
      <div 
        className="min-h-screen flex items-center justify-center p-4"
        style={{ backgroundColor: '#000000' }}
      >
        <div 
          className="max-w-md w-full p-6 rounded-lg border text-center"
          style={{ 
            backgroundColor: '#1A1A1A', 
            borderColor: '#DC2626' 
          }}
        >
          <div className="mb-4">
            <svg 
              className="mx-auto h-12 w-12" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="#DC2626"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
          <h2 
            className="text-xl font-bold mb-2" 
            style={{ color: '#FFFFFF' }}
          >
            Erro ao Carregar Perfil
          </h2>
          <p 
            className="text-sm mb-6" 
            style={{ color: '#9CA3AF' }}
          >
            {profileError}
          </p>
          <button
            onClick={() => refreshProfile()}
            className="w-full px-4 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
          >
            Tentar Novamente
          </button>
        </div>
      </div>
    );
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
