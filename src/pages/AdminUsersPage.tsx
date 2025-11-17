import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { useTranslation } from '../hooks/useTranslation';
import {
  getAllUsers,
  getUserStats,
  updateUserPlan,
  updateUserRole,
  disableUser,
  enableUser,
  deleteUser,
  getActionLogs,
  getAccessLogs,
  UserWithProfile,
  UserStats,
  ActionLog,
  AccessLog,
} from '../utils/adminOperations';
import {
  Users,
  UserCheck,
  UserX,
  Crown,
  Calendar,
  Shield,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Filter,
  RefreshCw,
  Download,
  AlertCircle,
  CheckCircle,
  XCircle,
  Clock,
  Activity,
  FileText,
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR, enUS } from 'date-fns/locale';

type TabType = 'users' | 'action-logs' | 'access-logs';

const AdminUsersPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { handleError, executeWithFeedback, showSuccess } = useErrorHandler();
  const { t, currentLanguage } = useTranslation();
  const [activeTab, setActiveTab] = useState<TabType>('users');
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithProfile[]>([]);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [actionLogs, setActionLogs] = useState<ActionLog[]>([]);
  const [accessLogs, setAccessLogs] = useState<AccessLog[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserWithProfile | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [actionLogsPage, setActionLogsPage] = useState(0);
  const [accessLogsPage, setAccessLogsPage] = useState(0);
  const [actionLogsTotal, setActionLogsTotal] = useState(0);
  const [accessLogsTotal, setAccessLogsTotal] = useState(0);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const [usersData, statsData] = await Promise.all([
        getAllUsers(),
        getUserStats(),
      ]);
      setUsers(usersData);
      setStats(statsData);
    } catch (error) {
      handleError(error, 'equipment', 'Erro ao carregar usuários');
    } finally {
      setLoading(false);
    }
  };

  const loadActionLogs = async (page: number = 0) => {
    try {
      setLoading(true);
      const { logs, total } = await getActionLogs(50, page * 50);
      setActionLogs(logs);
      setActionLogsTotal(total);
    } catch (error) {
      handleError(error, 'equipment', 'Erro ao carregar logs de ação');
    } finally {
      setLoading(false);
    }
  };

  const loadAccessLogs = async (page: number = 0) => {
    try {
      setLoading(true);
      const { logs, total } = await getAccessLogs(50, page * 50);
      setAccessLogs(logs);
      setAccessLogsTotal(total);
    } catch (error) {
      handleError(error, 'equipment', 'Erro ao carregar logs de acesso');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    if (activeTab === 'action-logs') {
      loadActionLogs(actionLogsPage);
    } else if (activeTab === 'access-logs') {
      loadAccessLogs(accessLogsPage);
    }
  }, [activeTab, actionLogsPage, accessLogsPage]);

  const handleUpdatePlan = async (userId: string, plan: 'trial' | 'premium') => {
    if (!confirm(t('admin.changePlanConfirm', { plan: plan === 'premium' ? t('profile.premium') : t('profile.trial'), defaultValue: `Tem certeza que deseja alterar o plano do usuário para ${plan === 'premium' ? 'Premium' : 'Trial'}?` }))) {
      return;
    }

    try {
      await updateUserPlan(userId, plan);
      
      // Atualizar o usuário na lista local
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === userId 
            ? { ...user, profile: { ...user.profile, plan } as any }
            : user
        )
      );
      
      // Atualizar o usuário selecionado no modal
      if (selectedUser && selectedUser.id === userId) {
        setSelectedUser({
          ...selectedUser,
          profile: { ...selectedUser.profile, plan } as any
        });
      }
      
      // Recarregar estatísticas
      const statsData = await getUserStats();
      setStats(statsData);
      
      showSuccess('Plano atualizado com sucesso!');
    } catch (error: any) {
      handleError(error, 'equipment', 'Erro ao atualizar plano do usuário');
    }
  };

  const handleUpdateRole = async (userId: string, role: 'admin' | 'user') => {
    if (!confirm(`Tem certeza que deseja alterar a role do usuário para ${role === 'admin' ? 'Administrador' : 'Usuário'}?`)) {
      return;
    }

    try {
      await executeWithFeedback(
        async () => {
          await updateUserRole(userId, role);
          await loadUsers();
          return true;
        },
        'equipment',
        'Role atualizada com sucesso!',
        'Erro ao atualizar role'
      );
      setShowUserModal(false);
    } catch (error: any) {
      handleError(error, 'equipment', 'Erro ao atualizar role');
    }
  };

  const handleDisableUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desabilitar este usuário? Ele não poderá mais fazer login.')) {
      return;
    }

    try {
      await executeWithFeedback(
        async () => {
          await disableUser(userId);
          await loadUsers();
          return true;
        },
        'equipment',
        'Usuário desabilitado com sucesso!',
        'Erro ao desabilitar usuário'
      );
      setShowUserModal(false);
    } catch (error: any) {
      handleError(error, 'equipment', 'Erro ao desabilitar usuário');
    }
  };

  const handleEnableUser = async (userId: string) => {
    try {
      await executeWithFeedback(
        async () => {
          await enableUser(userId);
          await loadUsers();
          return true;
        },
        'equipment',
        'Usuário habilitado com sucesso!',
        'Erro ao habilitar usuário'
      );
      setShowUserModal(false);
    } catch (error: any) {
      handleError(error, 'equipment', 'Erro ao habilitar usuário');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação é irreversível e todos os dados do usuário serão perdidos.')) {
      return;
    }

    if (!confirm('Esta é sua confirmação final. Todos os dados do usuário serão permanentemente excluídos.')) {
      return;
    }

    try {
      await executeWithFeedback(
        async () => {
          await deleteUser(userId);
          await loadUsers();
          return true;
        },
        'equipment',
        'Usuário excluído com sucesso!',
        'Erro ao excluir usuário'
      );
      setShowUserModal(false);
    } catch (error: any) {
      handleError(error, 'equipment', 'Erro ao excluir usuário');
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'admin.users', defaultValue: 'Gestão de Usuários' }} />
      <main className="p-4" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-6xl mx-auto">
          {/* {t('profile.statistics')} */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className="text-white" />
                  <span className="text-sm font-medium">{t('common.total', { defaultValue: 'Total' })}</span>
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={20} color="#FFFFFF" />
                  <span className="text-sm font-medium">{t('profile.premium')}</span>
                </div>
                <p className="text-2xl font-bold">{stats.premium}</p>
              </div>
              <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} className="text-status-warning" />
                  <span className="text-sm font-medium">{t('profile.trial')}</span>
                </div>
                <p className="text-2xl font-bold">{stats.trial}</p>
              </div>
              <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={20} className="text-status-info" />
                  <span className="text-sm font-medium">{t('profile.admin')}</span>
                </div>
                <p className="text-2xl font-bold">{stats.admin}</p>
              </div>
              <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={20} className="text-status-success" />
                  <span className="text-sm font-medium">{t('admin.activeUsers', { defaultValue: 'Ativos' })}</span>
                </div>
                <p className="text-2xl font-bold">{stats.active}</p>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="mb-6">
            <div className="flex gap-2 border-b" style={{ borderColor: '#2A2A2A', borderWidth: '1px' }}>
              <button
                onClick={() => setActiveTab('users')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'users'
                    ? 'text-white border-b border-white/30'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                }`}
              >
                <Users size={18} className="inline mr-2" />
                {t('admin.users')}
              </button>
              <button
                onClick={() => setActiveTab('action-logs')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'action-logs'
                    ? 'text-white border-b border-white/30'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                }`}
              >
                <FileText size={18} className="inline mr-2" />
                {t('admin.actionLogs', { defaultValue: 'Logs de Ações' })}
              </button>
              <button
                onClick={() => setActiveTab('access-logs')}
                className={`px-4 py-2 font-medium transition-colors ${
                  activeTab === 'access-logs'
                    ? 'text-white border-b border-white/30'
                    : 'text-light-text-secondary dark:text-dark-text-secondary hover:text-light-text-primary dark:hover:text-dark-text-primary'
                }`}
              >
                <Activity size={18} className="inline mr-2" />
                {t('admin.accessLogs')}
              </button>
            </div>
          </div>

          {/* Conteúdo das Tabs */}
          {activeTab === 'users' && (
            <div>
              {/* Barra de Pesquisa */}
              <div className="mb-4 flex gap-2">
                <div className="flex-1 relative">
                  <Search size={18} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-light-text-secondary dark:text-dark-text-secondary" />
                  <input
                    type="text"
                    placeholder={t('admin.searchUsers', { defaultValue: 'Pesquisar por email ou nome...' })}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  />
                </div>
                <button
                  onClick={loadUsers}
                  className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  <RefreshCw size={18} />
                </button>
              </div>

              {/* {t('admin.users')} */}
              <div className="space-y-2">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border hover:border-white/30 transition-colors cursor-pointer" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                    onClick={() => {
                      setSelectedUser(user);
                      setShowUserModal(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                          <Users size={20} color="#FFFFFF" />
                        </div>
                        <div>
                          <p className="font-medium">{user.profile?.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.profile?.role === 'admin' && (
                          <span className="px-2 py-1 bg-status-info/20 text-status-info rounded-full text-xs font-semibold">
                            {t('profile.admin')}
                          </span>
                        )}
                        {user.profile?.plan === 'premium' ? (
                          <span className="px-2 py-1 bg-white/20 text-white rounded-full text-xs font-semibold">
                            {t('profile.premium')}
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-status-warning/20 text-status-warning rounded-full text-xs font-semibold">
                            {t('profile.trial')}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'action-logs' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {t('common.total')}: {actionLogsTotal} {t('admin.logs', { defaultValue: 'logs' })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadActionLogs(actionLogsPage)}
                    className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {actionLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">
                          {log.user?.full_name || log.user?.email || 'Sistema'}
                        </p>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {log.action_type} {log.resource_type && `em ${log.resource_type}`}
                        </p>
                      </div>
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                      </span>
                    </div>
                    {log.details && (
                      <pre className="text-xs bg-light-background dark:bg-dark-background p-2 rounded mt-2 overflow-auto">
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    )}
                  </div>
                ))}
              </div>

              {/* Paginação */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setActionLogsPage(Math.max(0, actionLogsPage - 1))}
                  disabled={actionLogsPage === 0}
                  className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  {t('common.previous')}
                </button>
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {t('common.page', { defaultValue: 'Página' })} {actionLogsPage + 1}
                </span>
                <button
                  onClick={() => setActionLogsPage(actionLogsPage + 1)}
                  disabled={(actionLogsPage + 1) * 50 >= actionLogsTotal}
                  className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'access-logs' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {t('common.total')}: {accessLogsTotal} {t('admin.logs', { defaultValue: 'logs' })}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => loadAccessLogs(accessLogsPage)}
                    className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  >
                    <RefreshCw size={18} />
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {accessLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium">
                            {log.user?.full_name || log.user?.email || 'Sistema'}
                          </p>
                          {log.success ? (
                            <CheckCircle size={16} className="text-status-success" />
                          ) : (
                            <XCircle size={16} className="text-status-error" />
                          )}
                        </div>
                        <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                          {log.action} {log.ip_address && `• ${log.ip_address}`}
                        </p>
                        {log.error_message && (
                          <p className="text-xs text-status-error mt-1">{log.error_message}</p>
                        )}
                      </div>
                      <span className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Paginação */}
              <div className="mt-4 flex justify-between items-center">
                <button
                  onClick={() => setAccessLogsPage(Math.max(0, accessLogsPage - 1))}
                  disabled={accessLogsPage === 0}
                  className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  {t('common.previous')}
                </button>
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {t('common.page', { defaultValue: 'Página' })} {accessLogsPage + 1}
                </span>
                <button
                  onClick={() => setAccessLogsPage(accessLogsPage + 1)}
                  disabled={(accessLogsPage + 1) * 50 >= accessLogsTotal}
                  className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  {t('common.next')}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Detalhes do Usuário */}
        <AnimatePresence>
          {showUserModal && selectedUser && (
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 10 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              transition={{ 
                type: 'tween', 
                ease: [0.4, 0, 0.2, 1], 
                duration: 0.25 
              }}
              className="bg-light-background dark:bg-dark-background rounded-lg border max-w-md w-full max-h-[90vh] overflow-y-auto" 
              style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-bold">Detalhes do Usuário</h2>
                  <button
                    onClick={() => setShowUserModal(false)}
                    className="p-2 hover:bg-light-surface dark:hover:bg-dark-surface rounded-lg transition-colors"
                  >
                    <XCircle size={20} />
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Nome</label>
                    <p className="text-lg">{selectedUser.profile?.full_name || 'Sem nome'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Email</label>
                    <p className="text-lg">{selectedUser.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Plano</label>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleUpdatePlan(selectedUser.id, 'trial')}
                        disabled={selectedUser.profile?.plan === 'trial'}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedUser.profile?.plan === 'trial'
                            ? 'bg-status-warning/20 border-status-warning text-status-warning'
                            : 'bg-light-surface dark:bg-dark-surface hover:bg-light-background dark:hover:bg-dark-background'
                        }`}
                      >
                        {t('profile.trial')}
                      </button>
                      <button
                        onClick={() => handleUpdatePlan(selectedUser.id, 'premium')}
                        disabled={selectedUser.profile?.plan === 'premium'}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedUser.profile?.plan === 'premium'
                            ? 'bg-white/20 border-white/30 text-white'
                            : 'bg-light-surface dark:bg-dark-surface hover:bg-light-background dark:hover:bg-dark-background'
                        }`}
                      >
                        {t('profile.premium')}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('profile.role')}</label>
                    <div className="flex gap-2 mt-2">
                      <button
                        onClick={() => handleUpdateRole(selectedUser.id, 'user')}
                        disabled={selectedUser.profile?.role === 'user'}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedUser.profile?.role === 'user'
                            ? 'bg-status-info/20 border-status-info text-status-info'
                            : 'bg-light-surface dark:bg-dark-surface hover:bg-light-background dark:hover:bg-dark-background'
                        }`}
                      >
                        {t('profile.user')}
                      </button>
                      <button
                        onClick={() => handleUpdateRole(selectedUser.id, 'admin')}
                        disabled={selectedUser.profile?.role === 'admin'}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          selectedUser.profile?.role === 'admin'
                            ? 'bg-status-info/20 border-status-info text-status-info'
                            : 'bg-light-surface dark:bg-dark-surface hover:bg-light-background dark:hover:bg-dark-background'
                        }`}
                      >
                        {t('profile.admin')}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">{t('admin.createdAt', { defaultValue: 'Criado em' })}</label>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {format(new Date(selectedUser.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                    </p>
                  </div>
                  {selectedUser.last_sign_in_at && (
                    <div>
                      <label className="text-sm font-medium">{t('admin.lastAccess', { defaultValue: 'Último acesso' })}</label>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {format(new Date(selectedUser.last_sign_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: currentLanguage === 'pt-BR' ? ptBR : enUS })}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t" style={{ borderColor: '#2A2A2A', borderWidth: '1px' }}>
                    <label className="text-sm font-medium text-status-error mb-2 block">{t('admin.dangerousActions', { defaultValue: 'Ações Perigosas' })}</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDisableUser(selectedUser.id)}
                        className="px-4 py-2 bg-status-error/20 text-status-error rounded-lg hover:bg-status-error/30 transition-colors text-sm"
                      >
                        {t('admin.disable', { defaultValue: 'Desabilitar' })}
                      </button>
                      <button
                        onClick={() => handleEnableUser(selectedUser.id)}
                        className="px-4 py-2 bg-status-success/20 text-status-success rounded-lg hover:bg-status-success/30 transition-colors text-sm"
                      >
                        {t('admin.enable', { defaultValue: 'Habilitar' })}
                      </button>
                      <button
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        className="px-4 py-2 bg-status-error text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        <Trash2 size={16} className="inline mr-1" />
                        {t('common.delete')}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminUsersPage;

