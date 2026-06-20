import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Key, AlertTriangle, CheckCircle, XCircle, RefreshCw, LogIn } from 'lucide-react';
import { licenseService } from '../services/licenseService';
import { LicenseStatus } from '../types/license';
import { useAuth } from '../contexts/AuthContext';
import PageHeader from '../components/PageHeader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import Skeleton from '../components/Skeleton';
import { FormSkeleton, ButtonSkeleton } from '../components/skeletons';
import { logger } from '../utils/logger';

const ActivateLicense = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { handleError, showInfo } = useErrorHandler();
  const { t } = useTranslation();
  const [token, setToken] = useState('');
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<LicenseStatus | null>(null);
  const [machineId, setMachineId] = useState<string>('');
  const [checkingStatus, setCheckingStatus] = useState(true);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const machineIdValue = await licenseService.getMachineId();
        setMachineId(machineIdValue);
        try {
          const licenseStatus = await licenseService.checkLicenseStatus(machineIdValue);
          setStatus(licenseStatus);
          
          // Se a licença já está válida e ativada (ex: foi estendida pelo admin),
          // redirecionar automaticamente para a home
          if (licenseStatus.valid && licenseStatus.isActivated) {
            logger.info('Licença já está ativada, redirecionando para home', 'license');
            showInfo('Licença já está ativada! Redirecionando...');
            setTimeout(() => {
              navigate('/');
            }, 1500);
            return;
          }
        } catch (statusError) {
          logger.error('Erro ao verificar status da licença', 'license', statusError);
          // Em caso de erro, definir status padrão para não travar a página
          setStatus({
            valid: false,
            daysRemaining: 0,
            expired: true,
            isActivated: false,
            isLifetime: false,
            isRevoked: false,
          });
        }
      } catch (err) {
        logger.error('Erro ao obter Machine ID', 'license', err);
        // Em caso de erro crítico, definir valores padrão
        setMachineId('erro-ao-obter-id');
        setStatus({
          valid: false,
          daysRemaining: 0,
          expired: true,
          isActivated: false,
          isLifetime: false,
          isRevoked: false,
        });
      } finally {
        setCheckingStatus(false);
      }
    };
    checkStatus();
  }, [navigate]);

  const handleActivate = async () => {
    if (!token.trim()) {
      handleError(new Error('Token não fornecido'), 'license', 'Por favor, insira um token de ativação');
      return;
    }

    setLoading(true);
    try {
      // Verificar o status novamente após ativação
      const newStatus = await licenseService.checkLicenseStatus(machineId);
      setStatus(newStatus);
      
      if (newStatus.valid) {
        showInfo('Licença ativada com sucesso!');
        // Redirecionar após ativação bem-sucedida
        setTimeout(() => {
          navigate('/');
        }, 2000);
      } else {
        handleError(new Error('Token inválido'), 'license', 'Token inválido ou licença expirada');
      }
    } catch (err: any) {
      handleError(err, 'license', 'Erro ao ativar licença');
    } finally {
      setLoading(false);
    }
  };

  // Se é dev, sempre permitir acesso
  if (profile?.dev === true) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
        <PageHeader title="Modo Desenvolvedor" />
        <main className="p-4 pb-32 flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
          <div className="max-w-md w-full p-6 bg-light-surface dark:bg-dark-surface rounded-lg border text-center" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
            <CheckCircle size={48} className="text-status-success mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white mb-2">Modo Desenvolvedor Ativo</h2>
            <p className="text-gray-400 mb-4">
              Você está em modo desenvolvedor e tem bypass em todas as verificações de licença.
            </p>
            <button
              onClick={() => navigate('/')}
              className="px-6 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Voltar ao Dashboard
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title="Ativação de Licença" />
      <main className="p-4 pb-32 flex items-center justify-center" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-2xl w-full p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
          <div className="text-center mb-8">
            <div className="w-20 h-20 bg-status-success/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Key className="text-status-success" size={40} />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">Ativação de Licença</h1>
            {!user ? (
              <div className="mt-4 p-4 bg-status-warning/20 border border-status-warning/50 rounded-xl">
                <p className="text-status-warning text-sm font-semibold mb-2">
                  ⚠️ Você precisa fazer login primeiro
                </p>
                <p className="text-gray-400 text-sm">
                  Faça login como administrador para ativar a licença do sistema
                </p>
              </div>
            ) : (
              <p className="text-gray-400">Insira seu token de ativação para continuar usando o sistema</p>
            )}
          </div>

          {checkingStatus ? (
            <FormSkeleton fields={2} showSubmit={false} />
          ) : status && (
            <div className={`mb-6 p-4 rounded-2xl border ${
              status.valid 
                ? 'bg-status-success/20 border-status-success/50' 
                : 'bg-status-error/20 border-status-error/50'
            }`}>
              <div className="flex items-center gap-3">
                {status.valid ? (
                  <CheckCircle className="text-status-success" size={24} />
                ) : (
                  <XCircle className="text-status-error" size={24} />
                )}
                <div className="flex-1">
                  <p className={`font-semibold ${status.valid ? 'text-status-success' : 'text-status-error'}`}>
                    {status.valid ? 'Licença Válida' : 'Licença Expirada ou Inválida'}
                  </p>
                  {status.isTrial && (
                    <p className="text-gray-400 text-sm mt-1">
                      Período de avaliação: {status.trialDaysRemaining} dias restantes
                    </p>
                  )}
                  {status.daysRemaining > 0 && status.daysRemaining !== Infinity && (
                    <p className="text-gray-400 text-sm mt-1">
                      {status.daysRemaining} dias restantes
                    </p>
                  )}
                  {status.isLifetime && (
                    <p className="text-gray-400 text-sm mt-1">
                      Licença Vitalícia
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Token de Ativação
              </label>
              <input
                type="text"
                placeholder="XXXX-XXXX-XXXX-XXXX"
                value={token}
                onChange={(e) => setToken(e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, ''))}
                className="w-full px-4 py-3 bg-light-background dark:bg-dark-background border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20 font-mono text-lg tracking-wider"
                style={{ backgroundColor: '#121212', borderColor: '#2A2A2A' }}
              />
            </div>

            <div className="bg-light-background dark:bg-dark-background p-4 rounded-xl" style={{ backgroundColor: '#121212' }}>
              <p className="text-xs text-gray-400 mb-2">Machine ID:</p>
              <p className="text-sm font-mono text-white break-all">{machineId || <Skeleton className="h-4 w-48 inline-block" />}</p>
            </div>
          </div>

          <div className="flex gap-4">
            {user ? (
              <>
                <button
                  onClick={handleActivate}
                  disabled={loading || !token.trim() || checkingStatus}
                  className="flex-1 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <ButtonSkeleton width="w-28" />
                  ) : (
                    'Ativar Licença'
                  )}
                </button>
                <button
                  onClick={() => navigate('/')}
                  disabled={loading}
                  className="px-6 py-3 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  Voltar
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => navigate('/auth')}
                  className="flex-1 px-6 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors flex items-center justify-center gap-2"
                >
                  <LogIn size={18} />
                  Ir para Login
                </button>
              </>
            )}
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <p className="text-xs text-gray-400 text-center">
              Não possui um token? Entre em contato com o administrador do sistema.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ActivateLicense;

