import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useTranslation } from '../hooks/useTranslation';
import {
  getAllSecurityPolicies,
  updateSecurityPolicy,
  getBlockedIPs,
  blockIP,
  unblockIP,
  SecurityPolicy,
  BlockedIP,
} from '../utils/systemSettingsOperations';
import {
  Shield,
  Lock,
  Save,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  XCircle,
  Ban,
  Unlock,
  Settings,
  Activity,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';
import { logger } from '../utils/logger';

const AdminSecurityPoliciesPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [policies, setPolicies] = useState<SecurityPolicy[]>([]);
  const [blockedIPs, setBlockedIPs] = useState<BlockedIP[]>([]);
  const [activeTab, setActiveTab] = useState<'policies' | 'blocked'>('policies');
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [newIP, setNewIP] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [editingPolicy, setEditingPolicy] = useState<SecurityPolicy | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [policiesData, blockedIPsData] = await Promise.all([
        getAllSecurityPolicies(),
        getBlockedIPs(),
      ]);
      setPolicies(policiesData);
      setBlockedIPs(blockedIPsData);
    } catch (err: any) {
      logger.error('Erro ao carregar dados', 'admin', err);
      if (err.code === '42P01' || err.message?.includes('does not exist')) {
        setError('Tabelas de segurança não encontradas no banco de dados. Execute a migração 20250118000000_create_system_settings_and_security_policies.sql no Supabase SQL Editor.');
      } else {
        setError('Falha ao carregar políticas de segurança.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleTogglePolicy = async (policy: SecurityPolicy) => {
    try {
      await updateSecurityPolicy(policy.id, { enabled: !policy.enabled });
      await loadData();
      setSuccess(`Política ${!policy.enabled ? 'habilitada' : 'desabilitada'} com sucesso!`);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar política.');
      logger.error('Erro ao atualizar política', 'admin', err);
    }
  };

  const handleUpdatePolicyConfig = async (policyId: string, config: any) => {
    try {
      setSaving(true);
      await updateSecurityPolicy(policyId, { config });
      await loadData();
      setEditingPolicy(null);
      setSuccess('Configuração da política atualizada com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar configuração.');
      logger.error('Erro ao atualizar configuração', 'admin', err);
    } finally {
      setSaving(false);
    }
  };

  const handleBlockIP = async () => {
    if (!newIP || !blockReason) {
      setError('IP e motivo são obrigatórios.');
      return;
    }

    try {
      await blockIP(newIP, blockReason);
      setNewIP('');
      setBlockReason('');
      await loadData();
      setSuccess('IP bloqueado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao bloquear IP.');
      logger.error('Erro ao bloquear IP', 'admin', err);
    }
  };

  const handleUnblockIP = async (id: string) => {
    if (!confirm('Tem certeza que deseja desbloquear este IP?')) {
      return;
    }

    try {
      await unblockIP(id);
      await loadData();
      setSuccess('IP desbloqueado com sucesso!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message || 'Falha ao desbloquear IP.');
      logger.error('Erro ao desbloquear IP', 'admin', err);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'admin.policies', defaultValue: 'Políticas de Segurança' }} />
      <main className="p-4" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Alerts */}
          {error && (
            <div className="p-4 bg-status-error/20 text-status-error rounded-lg flex items-center gap-2">
              <XCircle size={20} />
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-status-success/20 text-status-success rounded-lg flex items-center gap-2">
              <CheckCircle size={20} />
              {success}
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-2 border-b" style={{ borderColor: '#2A2A2A', borderWidth: '1px' }}>
            <button
              onClick={() => setActiveTab('policies')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'policies'
                  ? 'text-white border-b border-white/30'
                  : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
              }`}
            >
              <Settings size={18} className="inline mr-2" />
              Políticas
            </button>
            <button
              onClick={() => setActiveTab('blocked')}
              className={`px-4 py-2 font-medium transition-colors ${
                activeTab === 'blocked'
                  ? 'text-white border-b border-white/30'
                  : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
              }`}
            >
              <Ban size={18} className="inline mr-2" />
              IPs Bloqueados
            </button>
          </div>

          {/* Políticas de Segurança */}
          {activeTab === 'policies' && (
            <div className="space-y-4">
              {policies.map((policy) => (
                <div
                  key={policy.id}
                  className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Shield size={24} className="text-white" />
                        <h3 className="text-xl font-bold">{policy.policy_name}</h3>
                        {policy.enabled ? (
                          <span className="px-2 py-1 bg-status-success/20 text-status-success rounded-full text-xs font-semibold">
                            {t('admin.active')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-status-error/20 text-status-error rounded-full text-xs font-semibold">
                            {t('admin.inactive')}
                          </span>
                        )}
                      </div>
                      {policy.description && (
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary mb-4">
                          {policy.description}
                        </p>
                      )}
                      <div className="bg-light-background dark:bg-dark-background p-4 rounded-lg">
                        <pre className="text-xs overflow-auto">
                          {JSON.stringify(policy.config, null, 2)}
                        </pre>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <button
                        onClick={() => setEditingPolicy(editingPolicy?.id === policy.id ? null : policy)}
                        className="px-4 py-2 bg-light-background dark:bg-dark-background border rounded-lg hover:bg-opacity-50 transition-colors" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
                      >
                        {editingPolicy?.id === policy.id ? t('common.cancel') : t('common.edit')}
                      </button>
                      <label className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer">
                        <input
                          type="checkbox"
                          checked={policy.enabled}
                          onChange={() => handleTogglePolicy(policy)}
                          className="sr-only peer"
                        />
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          policy.enabled ? 'translate-x-6' : 'translate-x-1'
                        }`} />
                        <span className={`absolute inset-0 rounded-full transition-colors ${
                          policy.enabled ? 'bg-white' : 'bg-gray-300'
                        }`} />
                      </label>
                    </div>
                  </div>

                  {/* Editor de Configuração */}
                  {editingPolicy?.id === policy.id && (
                    <div className="mt-4 p-4 bg-light-background dark:bg-dark-background rounded-lg border" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                      <label className="block text-sm font-medium mb-2">Configuração (JSON)</label>
                      <textarea
                        value={JSON.stringify(editingPolicy.config, null, 2)}
                        onChange={(e) => {
                          try {
                            const parsed = JSON.parse(e.target.value);
                            setEditingPolicy({ ...editingPolicy, config: parsed });
                          } catch {
                            // Invalid JSON, don't update
                          }
                        }}
                        className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none font-mono text-xs" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                        rows={8}
                      />
                      <button
                        onClick={() => handleUpdatePolicyConfig(policy.id, editingPolicy.config)}
                        disabled={saving}
                        className="mt-2 px-4 py-2 bg-white text-black rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Save size={16} className="inline mr-2" />
                        Salvar Configuração
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* IPs Bloqueados */}
          {activeTab === 'blocked' && (
            <div className="space-y-4">
              {/* Formulário para bloquear novo IP */}
              <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <Ban size={20} className="text-white" />
                  Bloquear Novo IP
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Endereço IP</label>
                    <input
                      type="text"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                      placeholder="192.168.1.1"
                      className="w-full p-3 bg-light-background dark:bg-dark-background border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Motivo</label>
                    <input
                      type="text"
                      value={blockReason}
                      onChange={(e) => setBlockReason(e.target.value)}
                      placeholder="Tentativas de login suspeitas"
                      className="w-full p-3 bg-light-background dark:bg-dark-background border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
                    />
                  </div>
                </div>
                <button
                  onClick={handleBlockIP}
                  className="mt-4 px-6 py-3 bg-status-error text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  <Ban size={18} className="inline mr-2" />
                  Bloquear IP
                </button>
              </div>

              {/* Lista de IPs Bloqueados */}
              <div className="space-y-2">
                {blockedIPs.filter(ip => ip.is_active).map((ip) => (
                  <div
                    key={ip.id}
                    className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <AlertCircle size={20} className="text-status-error" />
                          <span className="font-mono font-bold">{ip.ip_address}</span>
                          <span className="px-2 py-1 bg-status-error/20 text-status-error rounded-full text-xs font-semibold">
                            Bloqueado
                          </span>
                        </div>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {ip.reason}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                          <span>{t('admin.blockedAt')} {format(new Date(ip.blocked_at), "dd/MM/yyyy HH:mm", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</span>
                          {ip.blocked_until && (
                            <span>{t('admin.blockedUntil')} {format(new Date(ip.blocked_until), "dd/MM/yyyy HH:mm", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleUnblockIP(ip.id)}
                        className="px-4 py-2 bg-status-success/20 text-status-success rounded-lg hover:bg-status-success/30 transition-colors"
                      >
                        <Unlock size={18} className="inline mr-2" />
                        Desbloquear
                      </button>
                    </div>
                  </div>
                ))}
                {blockedIPs.filter(ip => ip.is_active).length === 0 && (
                  <div className="p-8 text-center text-light-text-secondary dark:text-dark-text-secondary">
                    Nenhum IP bloqueado no momento.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminSecurityPoliciesPage;

