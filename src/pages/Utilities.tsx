import { useNavigate } from 'react-router-dom';
import { Users, Settings, Shield, Lock } from 'lucide-react';
import PageHeader from '../components/PageHeader';

const Utilities = () => {
  const navigate = useNavigate();

  return (
    <div className="theme-pages dark min-h-screen relative" style={{ backgroundColor: 'transparent', color: 'var(--foreground)' }}>
      <PageHeader title="Utilitários Administrativos" />
      <main className="p-4 pb-32 relative" style={{ backgroundColor: 'transparent' }}>
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={() => navigate('/utilities/users')}
            className="w-full text-left p-4 rounded-lg border transition-all hover:shadow-md flex items-center gap-3 group"
            style={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)', 
              color: 'var(--foreground)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.borderColor = 'var(--ring)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <Users size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Gestão de Usuários</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Ver usuários, estatísticas, logs e gerenciar acessos
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/utilities/system-settings')}
            className="w-full text-left p-4 rounded-lg border transition-all hover:shadow-md flex items-center gap-3 group"
            style={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)', 
              color: 'var(--foreground)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.borderColor = 'var(--ring)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <Settings size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Configurações do Sistema</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Configurações gerais e parâmetros do sistema
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/utilities/security-audit')}
            className="w-full text-left p-4 rounded-lg border transition-all hover:shadow-md flex items-center gap-3 group"
            style={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)', 
              color: 'var(--foreground)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.borderColor = 'var(--ring)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <Shield size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Segurança e Auditoria</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Políticas de segurança e relatórios de auditoria
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/utilities/security-policies')}
            className="w-full text-left p-4 rounded-lg border transition-all hover:shadow-md flex items-center gap-3 group"
            style={{ 
              backgroundColor: 'var(--card)', 
              borderColor: 'var(--border)', 
              color: 'var(--foreground)',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-sm)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--accent)';
              e.currentTarget.style.borderColor = 'var(--ring)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--card)';
              e.currentTarget.style.borderColor = 'var(--border)';
            }}
          >
            <Lock size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Políticas de Segurança</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
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
