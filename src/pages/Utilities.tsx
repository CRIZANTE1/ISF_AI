import { useNavigate } from 'react-router-dom';
import { Users, Settings, Shield, Lock } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Utilities = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      <PageHeader title="Utilitários Administrativos" />
      <main className="p-4">
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={() => navigate('/utilities/users')}
            className="w-full text-left p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border hover:border-brand-green transition-colors flex items-center gap-3"
          >
            <Users size={24} className="text-brand-green" />
            <div>
              <p className="font-semibold">Gestão de Usuários</p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Ver usuários, estatísticas, logs e gerenciar acessos
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/utilities/system-settings')}
            className="w-full text-left p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border hover:border-brand-green transition-colors flex items-center gap-3"
          >
            <Settings size={24} className="text-brand-green" />
            <div>
              <p className="font-semibold">Configurações do Sistema</p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Configurações gerais e parâmetros do sistema
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/utilities/security-audit')}
            className="w-full text-left p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border hover:border-brand-green transition-colors flex items-center gap-3"
          >
            <Shield size={24} className="text-brand-green" />
            <div>
              <p className="font-semibold">Segurança e Auditoria</p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Políticas de segurança e relatórios de auditoria
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/utilities/security-policies')}
            className="w-full text-left p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border hover:border-brand-green transition-colors flex items-center gap-3"
          >
            <Lock size={24} className="text-brand-green" />
            <div>
              <p className="font-semibold">Políticas de Segurança</p>
              <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                Configurar políticas e gerenciar IPs bloqueados
              </p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};
export default Utilities;
