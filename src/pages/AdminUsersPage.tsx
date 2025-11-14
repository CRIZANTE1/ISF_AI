import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
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
import { ptBR } from 'date-fns/locale';

type TabType = 'users' | 'action-logs' | 'access-logs';

const AdminUsersPage = () => {
  const { profile } = useAuth();
  const navigate = useNavigate();
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
      console.error('Erro ao carregar usuários:', error);
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
      console.error('Erro ao carregar logs de ação:', error);
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
      console.error('Erro ao carregar logs de acesso:', error);
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
    if (!confirm(`Tem certeza que deseja alterar o plano do usuário para ${plan === 'premium' ? 'Premium' : 'Trial'}?`)) {
      return;
    }

    try {
      await updateUserPlan(userId, plan);
      await loadUsers();
      setShowUserModal(false);
      alert('Plano atualizado com sucesso!');
    } catch (error: any) {
      alert(`Erro ao atualizar plano: ${error.message}`);
    }
  };

  const handleUpdateRole = async (userId: string, role: 'admin' | 'user') => {
    if (!confirm(`Tem certeza que deseja alterar a role do usuário para ${role === 'admin' ? 'Administrador' : 'Usuário'}?`)) {
      return;
    }

    try {
      await updateUserRole(userId, role);
      await loadUsers();
      setShowUserModal(false);
      alert('Role atualizada com sucesso!');
    } catch (error: any) {
      alert(`Erro ao atualizar role: ${error.message}`);
    }
  };

  const handleDisableUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja desabilitar este usuário? Ele não poderá mais fazer login.')) {
      return;
    }

    try {
      await disableUser(userId);
      await loadUsers();
      setShowUserModal(false);
      alert('Usuário desabilitado com sucesso!');
    } catch (error: any) {
      alert(`Erro ao desabilitar usuário: ${error.message}`);
    }
  };

  const handleEnableUser = async (userId: string) => {
    try {
      await enableUser(userId);
      await loadUsers();
      setShowUserModal(false);
      alert('Usuário habilitado com sucesso!');
    } catch (error: any) {
      alert(`Erro ao habilitar usuário: ${error.message}`);
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
      await deleteUser(userId);
      await loadUsers();
      setShowUserModal(false);
      alert('Usuário excluído com sucesso!');
    } catch (error: any) {
      alert(`Erro ao excluir usuário: ${error.message}`);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.profile?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title="Gestão de Usuários" />
      <main className="p-4" style={{ backgroundColor: '#000000' }}>
        <div className="max-w-6xl mx-auto">
          {/* Estatísticas */}
          {stats && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
              <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Users size={20} className="text-white" />
                  <span className="text-sm font-medium">Total</span>
                </div>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Crown size={20} color="#00C8FF" />
                  <span className="text-sm font-medium">Premium</span>
                </div>
                <p className="text-2xl font-bold">{stats.premium}</p>
              </div>
              <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={20} className="text-status-warning" />
                  <span className="text-sm font-medium">Trial</span>
                </div>
                <p className="text-2xl font-bold">{stats.trial}</p>
              </div>
              <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Shield size={20} className="text-status-info" />
                  <span className="text-sm font-medium">Admin</span>
                </div>
                <p className="text-2xl font-bold">{stats.admin}</p>
              </div>
              <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
                <div className="flex items-center gap-2 mb-2">
                  <Activity size={20} className="text-status-success" />
                  <span className="text-sm font-medium">Ativos</span>
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
                Usuários
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
                Logs de Ações
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
                Logs de Acesso
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
                    placeholder="Pesquisar por email ou nome..."
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

              {/* Lista de Usuários */}
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
                          <Users size={20} color="#00C8FF" />
                        </div>
                        <div>
                          <p className="font-medium">{user.profile?.full_name || 'Sem nome'}</p>
                          <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {user.profile?.role === 'admin' && (
                          <span className="px-2 py-1 bg-status-info/20 text-status-info rounded-full text-xs font-semibold">
                            Admin
                          </span>
                        )}
                        {user.profile?.plan === 'premium' ? (
                          <span className="px-2 py-1 bg-white/20 text-white rounded-full text-xs font-semibold">
                            Premium
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-status-warning/20 text-status-warning rounded-full text-xs font-semibold">
                            Trial
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
                  Total: {actionLogsTotal} logs
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
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
                  Anterior
                </button>
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Página {actionLogsPage + 1}
                </span>
                <button
                  onClick={() => setActionLogsPage(actionLogsPage + 1)}
                  disabled={(actionLogsPage + 1) * 50 >= actionLogsTotal}
                  className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}

          {activeTab === 'access-logs' && (
            <div>
              <div className="mb-4 flex justify-between items-center">
                <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Total: {accessLogsTotal} logs
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
                        {format(new Date(log.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
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
                  Anterior
                </button>
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  Página {accessLogsPage + 1}
                </span>
                <button
                  onClick={() => setAccessLogsPage(accessLogsPage + 1)}
                  disabled={(accessLogsPage + 1) * 50 >= accessLogsTotal}
                  className="px-4 py-2 bg-light-surface dark:bg-dark-surface border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal de Detalhes do Usuário */}
        {showUserModal && selectedUser && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-light-background dark:bg-dark-background rounded-lg border max-w-md w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: '#121212', borderColor: '#2A2A2A', borderWidth: '1px' }}>
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
                        Trial
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
                        Premium
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Role</label>
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
                        Usuário
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
                        Admin
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Criado em</label>
                    <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                      {format(new Date(selectedUser.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  {selectedUser.last_sign_in_at && (
                    <div>
                      <label className="text-sm font-medium">Último acesso</label>
                      <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                        {format(new Date(selectedUser.last_sign_in_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  )}

                  <div className="pt-4 border-t" style={{ borderColor: '#2A2A2A', borderWidth: '1px' }}>
                    <label className="text-sm font-medium text-status-error mb-2 block">Ações Perigosas</label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleDisableUser(selectedUser.id)}
                        className="px-4 py-2 bg-status-error/20 text-status-error rounded-lg hover:bg-status-error/30 transition-colors text-sm"
                      >
                        Desabilitar
                      </button>
                      <button
                        onClick={() => handleEnableUser(selectedUser.id)}
                        className="px-4 py-2 bg-status-success/20 text-status-success rounded-lg hover:bg-status-success/30 transition-colors text-sm"
                      >
                        Habilitar
                      </button>
                      <button
                        onClick={() => handleDeleteUser(selectedUser.id)}
                        className="px-4 py-2 bg-status-error text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
                      >
                        <Trash2 size={16} className="inline mr-1" />
                        Excluir
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminUsersPage;

