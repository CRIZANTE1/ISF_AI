import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { licenseService } from '../services/licenseService';
import { LicenseStatus } from '../types/license';
import { logger } from '../utils/logger';
import SplashScreen from './SplashScreen'; // Importe o SplashScreen

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, profile, loading } = useAuth();
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [checkingLicense, setCheckingLicense] = useState(true);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    // Prevenir múltiplas verificações
    if (hasCheckedRef.current) {
      return;
    }

    const checkLicense = async () => {
      try {
        // Se não há usuário, não precisa verificar licença
        if (!user) {
          setCheckingLicense(false);
          hasCheckedRef.current = true;
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
          hasCheckedRef.current = true;
          return;
        }

        // Verificar licença apenas se não for dev
        try {
          const status = await licenseService.checkLicenseStatus();
          setLicenseStatus(status);
        } catch (error) {
          logger.error('Erro ao verificar licença', 'license', error);
          // Em caso de erro, permitir acesso (fail-open para não bloquear desenvolvimento)
          // Isso evita que erros de rede ou configuração bloqueiem o app
          setLicenseStatus({
            valid: true,
            daysRemaining: 0,
            expired: false,
            isActivated: false,
            isLifetime: false,
            isRevoked: false,
            isTrial: true,
            trialDaysRemaining: 14,
          });
        }
      } catch (error) {
        // Erro crítico - permitir acesso para não bloquear o app
        logger.error('Erro crítico ao verificar licença', 'license', error);
        setLicenseStatus({
          valid: true,
          daysRemaining: 0,
          expired: false,
          isActivated: false,
          isLifetime: false,
          isRevoked: false,
          isTrial: true,
          trialDaysRemaining: 14,
        });
      } finally {
        setCheckingLicense(false);
        hasCheckedRef.current = true;
      }
    };

    // Aguardar o loading terminar antes de verificar
    if (!loading) {
      checkLicense();
    }
  }, [user, profile, loading]);

  // Mostrar loading enquanto verifica autenticação ou licença
  if (loading || checkingLicense) {
    return <SplashScreen />;
  }

  // Se não há usuário, redirecionar para login
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se é dev, sempre permitir acesso
  if (profile?.dev === true) {
    return children;
  }

  // Se não há status de licença ainda, permitir acesso (fail-open)
  if (!licenseStatus) {
    return children;
  }

  // Verificar se a licença é válida
  // Permitir acesso se: válida, em trial, ou se houver erro (fail-open)
  if (!licenseStatus.valid && !licenseStatus.isTrial && licenseStatus.expired) {
    // Licença expirada e não está em período de avaliação - redirecionar para ativação
    return <Navigate to="/activate-license" replace />;
  }

  return children;
};

export default ProtectedRoute;
