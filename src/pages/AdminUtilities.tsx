import { useNavigate } from 'react-router-dom';
import { Users, Settings, Shield, Lock, Key } from 'lucide-react';
import PageHeader from '../components/PageHeader';
import { useTranslation } from '../hooks/useTranslation';

const AdminUtilities = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <div className="theme-pages dark min-h-screen relative" style={{ backgroundColor: '#000000', color: '#FFFFFF' }}>
      <PageHeader title={{ key: 'admin.utilities', defaultValue: 'Utilitários Administrativos' }} />
      <main className="p-4 pb-32 relative" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-md mx-auto space-y-4">
          <button
            onClick={() => navigate('/admin/utilities/users')}
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
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{t('admin.users')}</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('admin.users')}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/utilities/system-settings')}
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
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{t('admin.systemSettings')}</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('admin.systemSettings')}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/utilities/security-audit')}
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
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{t('admin.audit')}</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('admin.audit')}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/utilities/security-policies')}
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
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>{t('admin.policies')}</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                {t('admin.policies')}
              </p>
            </div>
          </button>

          <button
            onClick={() => navigate('/admin/utilities/licenses')}
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
            <Key size={24} style={{ color: 'var(--primary)' }} />
            <div>
              <p className="font-semibold" style={{ color: 'var(--foreground)' }}>Gerenciamento de Licenças</p>
              <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                Gerenciar licenças do sistema
              </p>
            </div>
          </button>
        </div>
      </main>
    </div>
  );
};

export default AdminUtilities;

