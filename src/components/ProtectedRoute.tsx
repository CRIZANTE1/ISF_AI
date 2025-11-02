import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Skeleton from './Skeleton';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-light-background dark:bg-dark-background">
            <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
};

export default ProtectedRoute;
