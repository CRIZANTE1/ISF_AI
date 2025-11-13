import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../components/PageHeader';
import { useNotifications } from '../hooks/useNotifications';
import { 
  Settings, 
  Moon, 
  Sun, 
  Bell, 
  Shield, 
  Database, 
  Trash2,
  Download,
  Upload,
  Lock,
  Eye,
  EyeOff
} from 'lucide-react';

const SettingsPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { 
    permissionStatus, 
    isSupported, 
    isLoading: notificationsLoading,
    requestPermission,
    checkPermission 
  } = useNotifications();
  
  // Inicializar estado do tema baseado na classe atual do documento
  const getInitialTheme = () => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return document.documentElement.classList.contains('dark');
    }
    return false;
  };

  const [darkMode, setDarkMode] = useState(getInitialTheme);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  
  // Estado de notificações baseado na permissão
  const notifications = permissionStatus.granted;

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const toggleNotifications = async () => {
    if (permissionStatus.granted) {
      // Se já tem permissão, apenas atualiza o estado local
      // (não podemos desabilitar permissões programaticamente)
      alert('Para desativar notificações, acesse as configurações do navegador/dispositivo.');
      return;
    }

    if (permissionStatus.denied) {
      alert('As notificações foram bloqueadas. Para ativá-las, acesse as configurações do navegador/dispositivo e permita notificações para este site/app.');
      return;
    }

    // Solicita permissão
    const granted = await requestPermission();
    if (granted) {
      // Salva preferência no localStorage
      localStorage.setItem('notifications_enabled', 'true');
      alert('Notificações ativadas com sucesso!');
    } else {
      alert('Permissão de notificações negada. Você pode ativá-las nas configurações do navegador/dispositivo.');
    }
    
    // Atualiza o status da permissão
    await checkPermission();
  };

  const handleExportData = async () => {
    try {
      // TODO: Implementar exportação de dados
      alert('Funcionalidade de exportação de dados em desenvolvimento.');
    } catch (error) {
      console.error('Erro ao exportar dados:', error);
      alert('Falha ao exportar dados. Tente novamente.');
    }
  };

  const handleImportData = async () => {
    try {
      // TODO: Implementar importação de dados
      alert('Funcionalidade de importação de dados em desenvolvimento.');
    } catch (error) {
      console.error('Erro ao importar dados:', error);
      alert('Falha ao importar dados. Tente novamente.');
    }
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== 'DELETAR') {
      alert('Digite "DELETAR" para confirmar a exclusão da conta.');
      return;
    }

    if (!confirm('Tem certeza que deseja excluir sua conta? Esta ação é irreversível e todos os seus dados serão perdidos.')) {
      return;
    }

    try {
      // TODO: Implementar exclusão de conta
      // 1. Deletar todos os dados do usuário
      // 2. Deletar perfil
      // 3. Deletar conta de autenticação
      alert('Funcionalidade de exclusão de conta em desenvolvimento. Entre em contato com o suporte.');
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      alert('Falha ao excluir conta. Entre em contato com o suporte.');
    }
  };

  return (
    <div className="min-h-screen">
      <PageHeader title="Configurações" />
      <main className="p-4">
        <div className="max-w-md mx-auto space-y-6">
          {/* Preferências de Aparência */}
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Settings size={20} />
              Preferências
            </h3>
            
            <div className="space-y-4">
              {/* Dark Mode */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {darkMode ? (
                    <Moon size={20} color="#00C8FF" />
                  ) : (
                    <Sun size={20} color="#00C8FF" />
                  )}
                  <div>
                    <p className="font-medium">Modo Escuro</p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      Alternar entre tema claro e escuro
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleDarkMode}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    darkMode ? 'bg-accent-cyan' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      darkMode ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {/* Notificações */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell size={20} color="#00C8FF" />
                  <div>
                    <p className="font-medium">Notificações</p>
                    <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary">
                      {!isSupported 
                        ? 'Notificações não suportadas neste dispositivo'
                        : permissionStatus.granted
                        ? 'Recebendo alertas e notificações'
                        : permissionStatus.denied
                        ? 'Notificações bloqueadas - ative nas configurações'
                        : 'Receber alertas e notificações'
                      }
                    </p>
                  </div>
                </div>
                <button
                  onClick={toggleNotifications}
                  disabled={!isSupported || notificationsLoading}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    notifications ? 'bg-accent-cyan' : 'bg-gray-300'
                  } ${(!isSupported || notificationsLoading) ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      notifications ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>

          {/* Segurança */}
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Shield size={20} />
              Segurança
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={() => alert('Funcionalidade em desenvolvimento')}
                className="w-full text-left p-3 bg-light-background dark:bg-dark-background rounded-lg hover:bg-opacity-50 transition-colors flex items-center gap-3"
              >
                <Lock size={18} />
                <span>Alterar Senha</span>
              </button>
              <button
                onClick={() => alert('Funcionalidade em desenvolvimento')}
                className="w-full text-left p-3 bg-light-background dark:bg-dark-background rounded-lg hover:bg-opacity-50 transition-colors flex items-center gap-3"
              >
                <Eye size={18} />
                <span>Histórico de Sessões</span>
              </button>
            </div>
          </div>

          {/* Dados */}
          <div className="p-4 bg-light-surface dark:bg-dark-surface rounded-lg border border-light-border dark:border-dark-border">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Database size={20} />
              Dados
            </h3>
            
            <div className="space-y-3">
              <button
                onClick={handleExportData}
                className="w-full text-left p-3 bg-light-background dark:bg-dark-background rounded-lg hover:bg-opacity-50 transition-colors flex items-center gap-3"
              >
                <Download size={18} />
                <span>Exportar Meus Dados</span>
              </button>
              <button
                onClick={handleImportData}
                className="w-full text-left p-3 bg-light-background dark:bg-dark-background rounded-lg hover:bg-opacity-50 transition-colors flex items-center gap-3"
              >
                <Upload size={18} />
                <span>Importar Dados</span>
              </button>
            </div>
          </div>

          {/* Zona Perigosa */}
          <div className="p-4 bg-status-error/10 border-2 border-status-error rounded-lg">
            <h3 className="text-lg font-semibold mb-4 text-status-error flex items-center gap-2">
              <Trash2 size={20} />
              Zona Perigosa
            </h3>
            
            {!showDeleteAccount ? (
              <button
                onClick={() => setShowDeleteAccount(true)}
                className="w-full p-3 bg-status-error text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
              >
                Excluir Minha Conta
              </button>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-status-error">
                  ⚠️ Esta ação é irreversível. Todos os seus dados serão permanentemente excluídos.
                </p>
                <input
                  type="text"
                  placeholder='Digite "DELETAR" para confirmar'
                  value={deleteConfirmation}
                  onChange={(e) => setDeleteConfirmation(e.target.value)}
                  className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-status-error rounded-lg focus:ring-2 focus:ring-status-error focus:outline-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleDeleteAccount}
                    disabled={deleteConfirmation !== 'DELETAR'}
                    className="flex-1 p-3 bg-status-error text-white rounded-lg hover:bg-red-600 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                  >
                    Confirmar Exclusão
                  </button>
                  <button
                    onClick={() => {
                      setShowDeleteAccount(false);
                      setDeleteConfirmation('');
                    }}
                    className="flex-1 p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Botão Voltar */}
          <button
            onClick={() => navigate('/profile')}
            className="w-full p-3 bg-light-surface dark:bg-dark-surface border border-light-border dark:border-dark-border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors"
          >
            Voltar ao Perfil
          </button>
        </div>
      </main>
    </div>
  );
};

export default SettingsPage;

