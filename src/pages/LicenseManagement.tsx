import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { licenseService } from '../services/licenseService';
import { License } from '../types/license';
import PageHeader from '../components/PageHeader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import {
  Key,
  Search,
  Edit,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
  Calendar,
  Shield,
  XCircle,
  CheckCircle,
  Clock,
  Infinity,
  Trash2,
  RotateCcw,
  Plus,
} from 'lucide-react';
import { Spinner } from '../components/ui/spinner';
import { logger } from '../utils/logger';

const LicenseManagement = () => {
  const { user, profile } = useAuth();
  const { handleError, showInfo } = useErrorHandler();
  const { t } = useTranslation();
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showToken, setShowToken] = useState<Record<string, boolean>>({});
  const [editingMetadata, setEditingMetadata] = useState<Record<string, boolean>>({});
  const [metadataForm, setMetadataForm] = useState<{
    client_name?: string;
    client_email?: string;
    notes?: string;
  }>({});

  // Estatísticas
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    lifetime: 0,
    trial: 0,
    expired: 0,
    revoked: 0,
  });

  useEffect(() => {
    if (profile?.dev === true || profile?.role === 'admin') {
      loadLicenses();
    }
  }, [profile]);

  useEffect(() => {
    filterLicenses();
  }, [licenses, searchTerm, statusFilter]);

  const loadLicenses = async () => {
    setLoading(true);
    try {
      const data = await licenseService.getAllLicenses();
      setLicenses(data);
      calculateStats(data);
    } catch (error) {
      logger.error('Erro ao carregar licenças', 'license', error);
      handleError(error, 'license', 'Erro ao carregar licenças');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data: License[]) => {
    const now = new Date();
    const stats = {
      total: data.length,
      active: 0,
      lifetime: 0,
      trial: 0,
      expired: 0,
      revoked: 0,
    };

    data.forEach((license) => {
      if (license.revoked_at) {
        stats.revoked++;
        return;
      }

      if (license.is_lifetime || license.license_type === 'lifetime') {
        stats.lifetime++;
        stats.active++;
        return;
      }

      if (license.license_type === 'experimental' || !license.activation_token) {
        const installDate = new Date(license.install_date);
        const daysSinceInstall = Math.floor(
          (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceInstall < 14) {
          stats.trial++;
          stats.active++;
        } else {
          stats.expired++;
        }
        return;
      }

      if (license.license_type === 'premium' && license.last_activation_date) {
        const lastActivation = new Date(license.last_activation_date);
        const daysSinceActivation = Math.floor(
          (now.getTime() - lastActivation.getTime()) / (1000 * 60 * 60 * 24)
        );
        if (daysSinceActivation < 365) {
          stats.active++;
        } else {
          stats.expired++;
        }
        return;
      }

      stats.expired++;
    });

    setStats(stats);
  };

  const filterLicenses = () => {
    let filtered = [...licenses];

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (license) =>
          license.machine_id.toLowerCase().includes(term) ||
          license.client_name?.toLowerCase().includes(term) ||
          license.client_email?.toLowerCase().includes(term)
      );
    }

    // Filtro de status
    if (statusFilter !== 'all') {
      const now = new Date();
      filtered = filtered.filter((license) => {
        if (statusFilter === 'revoked') {
          return !!license.revoked_at;
        }
        if (statusFilter === 'lifetime') {
          return license.is_lifetime || license.license_type === 'lifetime';
        }
        if (statusFilter === 'trial') {
          return license.license_type === 'experimental' || !license.activation_token;
        }
        if (statusFilter === 'premium') {
          return license.license_type === 'premium' && !!license.activation_token;
        }
        if (statusFilter === 'expired') {
          if (license.revoked_at) return false;
          if (license.is_lifetime) return false;
          if (license.license_type === 'experimental') {
            const installDate = new Date(license.install_date);
            const daysSinceInstall = Math.floor(
              (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysSinceInstall >= 14;
          }
          if (license.license_type === 'premium' && license.last_activation_date) {
            const lastActivation = new Date(license.last_activation_date);
            const daysSinceActivation = Math.floor(
              (now.getTime() - lastActivation.getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysSinceActivation >= 365;
          }
          return true;
        }
        if (statusFilter === 'active') {
          if (license.revoked_at) return false;
          if (license.is_lifetime) return true;
          if (license.license_type === 'experimental') {
            const installDate = new Date(license.install_date);
            const daysSinceInstall = Math.floor(
              (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysSinceInstall < 14;
          }
          if (license.license_type === 'premium' && license.last_activation_date) {
            const lastActivation = new Date(license.last_activation_date);
            const daysSinceActivation = Math.floor(
              (now.getTime() - lastActivation.getTime()) / (1000 * 60 * 60 * 24)
            );
            return daysSinceActivation < 365;
          }
          return false;
        }
        return true;
      });
    }

    setFilteredLicenses(filtered);
  };

  const getLicenseStatus = (license: License): { label: string; color: string } => {
    if (license.revoked_at) {
      return { label: 'REVOGADA', color: 'bg-status-error/20 text-status-error' };
    }

    if (license.is_lifetime || license.license_type === 'lifetime') {
      return { label: 'VITALÍCIA', color: 'bg-purple-500/20 text-purple-400' };
    }

    const now = new Date();

    if (license.license_type === 'experimental' || !license.activation_token) {
      const installDate = new Date(license.install_date);
      const daysSinceInstall = Math.floor(
        (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceInstall < 14) {
        return { label: 'AVALIAÇÃO', color: 'bg-status-warning/20 text-status-warning' };
      }
      return { label: 'EXPIRADA', color: 'bg-status-error/20 text-status-error' };
    }

    if (license.license_type === 'premium' && license.last_activation_date) {
      const lastActivation = new Date(license.last_activation_date);
      const daysSinceActivation = Math.floor(
        (now.getTime() - lastActivation.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceActivation < 365) {
        return { label: 'PREMIUM', color: 'bg-status-success/20 text-status-success' };
      }
      return { label: 'EXPIRADA', color: 'bg-status-error/20 text-status-error' };
    }

    return { label: 'DESCONHECIDO', color: 'bg-gray-500/20 text-gray-400' };
  };

  const getDaysRemaining = (license: License): number | string => {
    if (license.revoked_at) return 0;
    if (license.is_lifetime || license.license_type === 'lifetime') return '∞';

    const now = new Date();

    if (license.license_type === 'experimental' || !license.activation_token) {
      const installDate = new Date(license.install_date);
      const daysSinceInstall = Math.floor(
        (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(0, 14 - daysSinceInstall);
    }

    if (license.license_type === 'premium' && license.last_activation_date) {
      const lastActivation = new Date(license.last_activation_date);
      const daysSinceActivation = Math.floor(
        (now.getTime() - lastActivation.getTime()) / (1000 * 60 * 60 * 24)
      );
      return Math.max(0, 365 - daysSinceActivation);
    }

    return 0;
  };

  const handleGenerateToken = async (machineId: string, installDate: string) => {
    setLoading(true);
    try {
      const result = await licenseService.generateToken(machineId, installDate);
      if (result.success) {
        showInfo(`Token gerado com sucesso!\n\n${result.token}`);
        await loadLicenses();
      } else {
        handleError(new Error(result.error || 'Erro ao gerar token'), 'license', 'Erro ao gerar token');
      }
    } catch (error: any) {
      handleError(error, 'license', 'Erro ao gerar token');
    } finally {
      setLoading(false);
    }
  };

  const handleExtendLicense = async (machineId: string) => {
    if (!confirm('Deseja estender esta licença para 365 dias a partir de hoje?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await licenseService.extendLicenseTo365Days(machineId);
      if (result.success) {
        showInfo('Licença estendida com sucesso!');
        await loadLicenses();
      } else {
        handleError(new Error(result.error || 'Erro ao estender licença'), 'license', 'Erro ao estender licença');
      }
    } catch (error: any) {
      handleError(error, 'license', 'Erro ao estender licença');
    } finally {
      setLoading(false);
    }
  };

  const handleResetTrial = async (machineId: string) => {
    if (!confirm('Deseja resetar o período de avaliação para 14 dias a partir de hoje?')) {
      return;
    }

    setLoading(true);
    try {
      const result = await licenseService.resetTrialPeriod(machineId);
      if (result.success) {
        showInfo('Período de avaliação resetado com sucesso!');
        await loadLicenses();
      } else {
        handleError(new Error(result.error || 'Erro ao resetar trial'), 'license', 'Erro ao resetar período de avaliação');
      }
    } catch (error: any) {
      handleError(error, 'license', 'Erro ao resetar período de avaliação');
    } finally {
      setLoading(false);
    }
  };

  const handleSetLifetime = async (machineId: string, isLifetime: boolean) => {
    const action = isLifetime ? 'tornar vitalícia' : 'remover vitalícia';
    if (!confirm(`Deseja ${action} esta licença?`)) {
      return;
    }

    setLoading(true);
    try {
      const result = await licenseService.setLifetimeLicense(machineId, isLifetime);
      if (result.success) {
        showInfo(`Licença ${isLifetime ? 'tornada vitalícia' : 'removida de vitalícia'} com sucesso!`);
        await loadLicenses();
      } else {
        handleError(new Error(result.error || 'Erro ao alterar licença'), 'license', 'Erro ao alterar licença');
      }
    } catch (error: any) {
      handleError(error, 'license', 'Erro ao alterar licença');
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeLicense = async (machineId: string) => {
    if (!confirm('Deseja revogar esta licença? Ela será desativada imediatamente.')) {
      return;
    }

    if (!user?.email) {
      handleError(new Error('Email do administrador não encontrado'), 'license', 'Erro ao revogar licença');
      return;
    }

    setLoading(true);
    try {
      const result = await licenseService.revokeLicense(machineId, user.email);
      if (result.success) {
        showInfo('Licença revogada com sucesso!');
        await loadLicenses();
      } else {
        handleError(new Error(result.error || 'Erro ao revogar licença'), 'license', 'Erro ao revogar licença');
      }
    } catch (error: any) {
      handleError(error, 'license', 'Erro ao revogar licença');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateLicense = async (machineId: string) => {
    setLoading(true);
    try {
      const result = await licenseService.reactivateLicense(machineId);
      if (result.success) {
        showInfo('Licença reativada com sucesso!');
        await loadLicenses();
      } else {
        handleError(new Error(result.error || 'Erro ao reativar licença'), 'license', 'Erro ao reativar licença');
      }
    } catch (error: any) {
      handleError(error, 'license', 'Erro ao reativar licença');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateMetadata = async (machineId: string) => {
    setLoading(true);
    try {
      const result = await licenseService.updateLicenseMetadata(machineId, metadataForm);
      if (result.success) {
        showInfo('Metadados atualizados com sucesso!');
        setEditingMetadata({ ...editingMetadata, [machineId]: false });
        setMetadataForm({});
        await loadLicenses();
      } else {
        handleError(new Error(result.error || 'Erro ao atualizar metadados'), 'license', 'Erro ao atualizar metadados');
      }
    } catch (error: any) {
      handleError(error, 'license', 'Erro ao atualizar metadados');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showInfo('Copiado para a área de transferência!');
  };

  // Verificar permissão
  if (profile?.dev !== true && profile?.role !== 'admin') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
        <PageHeader title="Acesso Negado" />
        <main className="p-4">
          <div className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border text-center" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
            <p className="text-white">Você não tem permissão para acessar esta página.</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title="Gerenciamento de Licenças">
        <button
          onClick={loadLicenses}
          disabled={loading}
          className="p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
        >
          {loading ? <Spinner size="sm" color="white" /> : <RefreshCw size={20} />}
        </button>
      </PageHeader>
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        {/* Estatísticas */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border text-center" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
            <Key size={24} className="text-white mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">{stats.total}</div>
            <div className="text-xs text-gray-400 uppercase">Total</div>
          </div>
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border text-center" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
            <CheckCircle size={24} className="text-status-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-white mb-1">{stats.active}</div>
            <div className="text-xs text-gray-400 uppercase">Ativas</div>
          </div>
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border text-center" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
            <Infinity size={24} className="text-purple-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-purple-400 mb-1">{stats.lifetime}</div>
            <div className="text-xs text-gray-400 uppercase">Vitalícias</div>
          </div>
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border text-center" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
            <Clock size={24} className="text-status-warning mx-auto mb-2" />
            <div className="text-2xl font-bold text-status-warning mb-1">{stats.trial}</div>
            <div className="text-xs text-gray-400 uppercase">Avaliação</div>
          </div>
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border text-center" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
            <XCircle size={24} className="text-status-error mx-auto mb-2" />
            <div className="text-2xl font-bold text-status-error mb-1">{stats.expired}</div>
            <div className="text-xs text-gray-400 uppercase">Expiradas</div>
          </div>
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border text-center" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
            <Shield size={24} className="text-status-error mx-auto mb-2" />
            <div className="text-2xl font-bold text-status-error mb-1">{stats.revoked}</div>
            <div className="text-xs text-gray-400 uppercase">Revogadas</div>
          </div>
        </div>

        {/* Filtros */}
        <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border mb-6" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por Machine ID, cliente ou email..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-light-background dark:bg-dark-background border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
                style={{ backgroundColor: '#121212', borderColor: '#2A2A2A' }}
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 bg-light-background dark:bg-dark-background border rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/20"
              style={{ backgroundColor: '#121212', borderColor: '#2A2A2A' }}
            >
              <option value="all">Todos os Status</option>
              <option value="active">Ativas</option>
              <option value="lifetime">Vitalícias</option>
              <option value="trial">Avaliação</option>
              <option value="premium">Premium</option>
              <option value="expired">Expiradas</option>
              <option value="revoked">Revogadas</option>
            </select>
          </div>
        </div>

        {/* Lista de Licenças */}
        <div className="space-y-4">
          {loading && filteredLicenses.length === 0 ? (
            <div className="text-center py-12">
              <Spinner size="lg" color="white" />
              <p className="text-gray-400 mt-4">Carregando licenças...</p>
            </div>
          ) : filteredLicenses.length === 0 ? (
            <div className="text-center py-12 p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
              <Key size={48} className="text-gray-400 mx-auto mb-4 opacity-50" />
              <p className="text-gray-400">Nenhuma licença encontrada</p>
            </div>
          ) : (
            filteredLicenses.map((license) => {
              const status = getLicenseStatus(license);
              const daysRemaining = getDaysRemaining(license);
              const isEditing = editingMetadata[license.machine_id];

              return (
                <div
                  key={license.id}
                  className="p-6 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}
                >
                  {/* Header do Card */}
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Key size={20} className="text-white" />
                        <span className="font-mono text-sm text-white font-semibold">
                          {license.machine_id}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status.color}`}>
                          {status.label}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-400">
                        <span className="flex items-center gap-1">
                          <Calendar size={14} />
                          Instalado: {format(new Date(license.install_date), 'dd/MM/yyyy', { locale: ptBR })}
                        </span>
                        {license.last_activation_date && (
                          <span className="flex items-center gap-1">
                            <Clock size={14} />
                            Ativado: {format(new Date(license.last_activation_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        )}
                        <span>
                          {daysRemaining === '∞' ? (
                            <span className="flex items-center gap-1">
                              <Infinity size={14} />
                              Vitalícia
                            </span>
                          ) : (
                            `${daysRemaining} dia${daysRemaining !== 1 ? 's' : ''} restante${daysRemaining !== 1 ? 's' : ''}`
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Metadados */}
                  {(license.client_name || license.client_email || license.notes) && (
                    <div className="mb-4 p-4 bg-light-background dark:bg-dark-background rounded-lg" style={{ backgroundColor: '#121212' }}>
                      {license.client_name && (
                        <div className="text-sm text-white mb-1">
                          <strong>Cliente:</strong> {license.client_name}
                        </div>
                      )}
                      {license.client_email && (
                        <div className="text-sm text-gray-400 mb-1">
                          <strong>Email:</strong> {license.client_email}
                        </div>
                      )}
                      {license.notes && (
                        <div className="text-sm text-gray-400">
                          <strong>Notas:</strong> {license.notes}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Token de Ativação */}
                  {license.activation_token && (
                    <div className="mb-4 p-4 bg-light-background dark:bg-dark-background rounded-lg" style={{ backgroundColor: '#121212' }}>
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="text-xs text-gray-400 mb-2 uppercase tracking-wide">Token de Ativação</div>
                          <div className="font-mono text-sm text-white">
                            {showToken[license.machine_id] ? (
                              license.activation_token
                            ) : (
                              '•'.repeat(license.activation_token.length)
                            )}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() =>
                              setShowToken({
                                ...showToken,
                                [license.machine_id]: !showToken[license.machine_id],
                              })
                            }
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                          >
                            {showToken[license.machine_id] ? <EyeOff size={16} /> : <Eye size={16} />}
                          </button>
                          <button
                            onClick={() => copyToClipboard(license.activation_token!)}
                            className="p-2 text-gray-400 hover:text-white transition-colors"
                          >
                            <Copy size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Formulário de Edição de Metadados */}
                  {isEditing && (
                    <div className="mb-4 p-4 bg-light-background dark:bg-dark-background rounded-lg space-y-3" style={{ backgroundColor: '#121212' }}>
                      <input
                        type="text"
                        placeholder="Nome do cliente"
                        value={metadataForm.client_name || license.client_name || ''}
                        onChange={(e) =>
                          setMetadataForm({ ...metadataForm, client_name: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-black border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
                        style={{ borderColor: '#2A2A2A' }}
                      />
                      <input
                        type="email"
                        placeholder="email@exemplo.com"
                        value={metadataForm.client_email || license.client_email || ''}
                        onChange={(e) =>
                          setMetadataForm({ ...metadataForm, client_email: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-black border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
                        style={{ borderColor: '#2A2A2A' }}
                      />
                      <textarea
                        placeholder="Notas administrativas..."
                        value={metadataForm.notes || license.notes || ''}
                        onChange={(e) =>
                          setMetadataForm({ ...metadataForm, notes: e.target.value })
                        }
                        className="w-full px-4 py-2 bg-black border rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/20"
                        style={{ borderColor: '#2A2A2A' }}
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdateMetadata(license.machine_id)}
                          disabled={loading}
                          className="px-4 py-2 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                          Salvar
                        </button>
                        <button
                          onClick={() => {
                            setEditingMetadata({ ...editingMetadata, [license.machine_id]: false });
                            setMetadataForm({});
                          }}
                          className="px-4 py-2 bg-gray-600 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Ações */}
                  <div className="flex flex-wrap gap-2">
                    {!isEditing && (
                      <button
                        onClick={() => {
                          setEditingMetadata({ ...editingMetadata, [license.machine_id]: true });
                          setMetadataForm({
                            client_name: license.client_name || '',
                            client_email: license.client_email || '',
                            notes: license.notes || '',
                          });
                        }}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors flex items-center gap-2"
                      >
                        <Edit size={16} />
                        Editar Metadados
                      </button>
                    )}

                    {!license.activation_token && (
                      <button
                        onClick={() => handleGenerateToken(license.machine_id, license.install_date)}
                        disabled={loading}
                        className="px-4 py-2 bg-white text-black rounded-lg text-sm font-semibold hover:bg-gray-200 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Key size={16} />
                        Gerar Token
                      </button>
                    )}

                    {license.license_type !== 'lifetime' && !license.is_lifetime && (
                      <>
                        <button
                          onClick={() => handleExtendLicense(license.machine_id)}
                          disabled={loading}
                          className="px-4 py-2 bg-status-success text-white rounded-lg text-sm font-semibold hover:bg-status-success/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <Calendar size={16} />
                          Estender 365 dias
                        </button>
                        <button
                          onClick={() => handleResetTrial(license.machine_id)}
                          disabled={loading}
                          className="px-4 py-2 bg-status-warning text-white rounded-lg text-sm font-semibold hover:bg-status-warning/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                          <RotateCcw size={16} />
                          Resetar Trial
                        </button>
                      </>
                    )}

                    {!license.is_lifetime && license.license_type !== 'lifetime' && (
                      <button
                        onClick={() => handleSetLifetime(license.machine_id, true)}
                        disabled={loading}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <Infinity size={16} />
                        Tornar Vitalícia
                      </button>
                    )}

                    {license.is_lifetime && (
                      <button
                        onClick={() => handleSetLifetime(license.machine_id, false)}
                        disabled={loading}
                        className="px-4 py-2 bg-gray-600 text-white rounded-lg text-sm font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Remover Vitalícia
                      </button>
                    )}

                    {!license.revoked_at ? (
                      <button
                        onClick={() => handleRevokeLicense(license.machine_id)}
                        disabled={loading}
                        className="px-4 py-2 bg-status-error text-white rounded-lg text-sm font-semibold hover:bg-status-error/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <XCircle size={16} />
                        Revogar
                      </button>
                    ) : (
                      <button
                        onClick={() => handleReactivateLicense(license.machine_id)}
                        disabled={loading}
                        className="px-4 py-2 bg-status-success text-white rounded-lg text-sm font-semibold hover:bg-status-success/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                      >
                        <CheckCircle size={16} />
                        Reativar
                      </button>
                    )}
                  </div>

                  {/* Informações de Revogação */}
                  {license.revoked_at && (
                    <div className="mt-4 p-3 bg-status-error/10 border border-status-error/20 rounded-lg">
                      <div className="text-sm text-status-error">
                        <strong>Revogada em:</strong>{' '}
                        {format(new Date(license.revoked_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                        {license.revoked_by && (
                          <>
                            <br />
                            <strong>Por:</strong> {license.revoked_by}
                          </>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </main>
    </div>
  );
};

export default LicenseManagement;

