import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { licenseService } from '../services/licenseService';
import { LicenseStatus } from '../types/license';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, profile, loading } = useAuth();
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [checkingLicense, setCheckingLicense] = useState(true);

  useEffect(() => {
    const checkLicense = async () => {
      if (!user) {
        setCheckingLicense(false);
        return;
      }

      // Se o usuário tem dev = true, bypass completo
      if (profile?.dev === true) {
        setLicenseStatus({
          valid: true,
          daysRemaining: Infinity,
          expired: false,
          isActivated: true,
          isLifetime: true,
          isRevoked: false,
        });
        setCheckingLicense(false);
        return;
      }

      // Verificar licença apenas se não for dev
      try {
        const status = await licenseService.checkLicenseStatus();
        setLicenseStatus(status);
      } catch (error) {
        console.error('Erro ao verificar licença:', error);
        // Em caso de erro, permitir acesso (fail-open para não bloquear desenvolvimento)
        setLicenseStatus({
          valid: true,
          daysRemaining: 0,
          expired: false,
          isActivated: false,
          isLifetime: false,
          isRevoked: false,
        });
      } finally {
        setCheckingLicense(false);
      }
    };

    if (!loading) {
      checkLicense();
    }
  }, [user, profile, loading]);

  if (loading || checkingLicense) {
    return (
        <div className="flex items-center justify-center h-screen bg-light-background dark:bg-dark-background transition-colors duration-200">
            <div className="w-10 h-10 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#FFFFFF', borderTopColor: 'transparent' }}></div>
        </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se é dev, sempre permitir acesso
  if (profile?.dev === true) {
    return children;
  }

  // Verificar se a licença é válida
  if (licenseStatus && !licenseStatus.valid && !licenseStatus.isTrial) {
    // Licença expirada e não está em período de avaliação - redirecionar para ativação
    return <Navigate to="/activate-license" replace />;
  }

  return children;
};

export default ProtectedRoute;
