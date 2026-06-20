import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect, useRef } from 'react';
import { licenseService } from '../services/licenseService';
import { LicenseStatus } from '../types/license';
import { logger } from '../utils/logger';
import { FullScreenSkeleton } from './skeletons';

const ProtectedRoute = ({ children }: { children: JSX.Element }) => {
  const { user, profile, profileError, loading, refreshProfile } = useAuth();
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [checkingLicense, setCheckingLicense] = useState(true);
  const hasCheckedRef = useRef(false);

  useEffect(() => {
    if (hasCheckedRef.current) {
      return;
    }

    const checkLicense = async () => {
      try {
        if (!user) {
          setCheckingLicense(false);
          hasCheckedRef.current = true;
          return;
        }

        // Secure Developer Bypass: Check profile flag AND trusted email list
        const devEmails = import.meta.env.VITE_DEV_EMAILS?.split(',').map((e: string) => e.trim()) || [];
        const isVerifiedDev = profile?.dev === true && user.email && devEmails.includes(user.email);

        if (isVerifiedDev) {
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

        try {
          if (user.id) {
            await licenseService.associateUserToLicense(user.id);
          }
          
          const status = await licenseService.checkLicenseStatus();
          setLicenseStatus(status);
        } catch (error) {
          logger.error('Erro ao verificar licença', 'license', error);
          // Fail-Safe: Em caso de erro, NÃO liberar acesso total.
          // Definir como inválido para forçar verificação ou mostrar erro.
          setLicenseStatus({
            valid: false,
            daysRemaining: 0,
            expired: false, // Não necessariamente expirado, mas inválido
            isActivated: false,
            isLifetime: false,
            isRevoked: false,
            isTrial: false,
          });
        }
      } catch (error) {
        logger.error('Erro crítico ao verificar licença', 'license', error);
        setLicenseStatus({
          valid: false,
          daysRemaining: 0,
          expired: false,
          isActivated: false,
          isLifetime: false,
          isRevoked: false,
          isTrial: false,
        });
      } finally {
        setCheckingLicense(false);
        hasCheckedRef.current = true;
      }
    };

    if (!loading) {
      checkLicense();
    }
  }, [user, profile, loading]);

  if (loading || checkingLicense) {
    return <FullScreenSkeleton />;
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Se há erro ao carregar perfil, mostra tela de erro com retry
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

  // Secure Developer Bypass Check (Double check for rendering)
  const devEmails = import.meta.env.VITE_DEV_EMAILS?.split(',').map((e: string) => e.trim()) || [];
  const isVerifiedDev = profile?.dev === true && user.email && devEmails.includes(user.email);

  if (isVerifiedDev) {
    return children;
  }

  // Fail-Closed: Se não há status ou inválido, bloquear
  if (!licenseStatus || !licenseStatus.valid) {
    // Se for trial, verificar validade do trial
    if (licenseStatus?.isTrial && (licenseStatus.trialDaysRemaining ?? 0) > 0) {
       return children;
    }
    
    return <Navigate to="/activate-license" replace />;
  }

  return children;
};

export default ProtectedRoute;
