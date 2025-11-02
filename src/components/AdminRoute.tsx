import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const AdminRoute = ({ children }: { children: JSX.Element }) => {
  const { profile, loading } = useAuth();

  if (loading) {
    return (
        <div className="flex items-center justify-center h-screen bg-light-background dark:bg-dark-background">
            <div className="w-10 h-10 border-4 border-brand-green border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
  }

  if (profile?.role !== 'admin') {
    // Redirect non-admin users to the dashboard
    return <Navigate to="/" replace />;
  }

  return children;
};

export default AdminRoute;
