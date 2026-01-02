import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit2, User, Mail, Calendar, Settings, CreditCard, BarChart3, Save, X, Camera, Key, CheckCircle, XCircle, Clock, Infinity, MessageSquare } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import TrialStatusBar from '../components/TrialStatusBar';
import PageHeader from '../components/PageHeader';
import { useForm } from 'react-hook-form';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { compressImage } from '../utils/imageCompression';
import LazyImage from '../components/LazyImage';
import { Spinner } from '../components/ui/spinner';
import { logger } from '../utils/logger';
import { useTranslation } from '../hooks/useTranslation';
import { licenseService } from '../services/licenseService';
import { License, LicenseStatus } from '../types/license';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import FeedbackModal from '../components/FeedbackModal';

interface ProfileFormData {
  full_name: string;
}

interface UserStats {
  totalEquipment: number;
  totalInspections: number;
  activeAlerts: number;
}

const Profile = () => {
  const { profile, user, signOut, loading, refreshProfile, profileError } = useAuth();
  const { getAllEquipment } = useEquipmentCache();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const { executeWithFeedback } = useErrorHandler();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [license, setLicense] = useState<License | null>(null);
  const [licenseStatus, setLicenseStatus] = useState<LicenseStatus | null>(null);
  const [loadingLicense, setLoadingLicense] = useState(true);
  const [machineId, setMachineId] = useState<string>('');
  const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
  const { register, handleSubmit, formState: { errors }, reset } = useForm<ProfileFormData>({
    defaultValues: {
      full_name: profile?.full_name || '',
    }
  });

  // Atualiza o formulário quando o perfil muda
  useEffect(() => {
    if (profile) {
      reset({ full_name: profile.full_name || '' });
    }
  }, [profile, reset]);

  // Memoizar equipamentos filtrados para evitar recálculos desnecessários
  const filteredEquipment = useMemo(() => {
    if (!user) return [];
    return getAllEquipment().filter(
      (eq: any) => !eq.user_id || eq.user_id === user.id
    );
  }, [user, getAllEquipment]);

  // Memoizar cálculo de alertas ativos
  const activeAlertsCount = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let count = 0;
    filteredEquipment.forEach((eq: any) => {
      const nextInspection = eq.proxima_inspecao || eq.data_proxima_inspecao || eq.data_proximo_teste;
      if (nextInspection) {
        try {
          const inspectionDate = new Date(nextInspection);
          inspectionDate.setHours(0, 0, 0, 0);
          if (inspectionDate < today) {
            count++;
          }
        } catch (e) {
          // Ignorar erros de parsing de data
          logger.warn('Erro ao processar data de inspeção', 'profile', e);
        }
      }
    });
    return count;
  }, [filteredEquipment]);

  // Busca estatísticas do usuário
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoadingStats(false);
        return;
      }
      setLoadingStats(true);
      try {
        // Otimização: Usar uma única query com UNION ou contar de forma mais eficiente
        // Como o Supabase não suporta UNION diretamente, fazemos queries paralelas mas otimizadas
        // Usando apenas count sem retornar dados (head: true) já é otimizado
        const inspectionTables = [
          'inspecoes_scba',
          'inspecoes_multigas',
          'inspecoes_camaras_espuma',
          'inspecoes_canhoes_monitores',
          'inspecoes_chuveiros_lava_olhos',
          'inspecoes_alarmes',
          'inspecoes_abrigos',
        ];

        // Executar todas as queries em paralelo de forma otimizada
        const inspectionCounts = await Promise.all(
          inspectionTables.map(table =>
            supabase
              .from(table)
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
          )
        );

        // Somar todas as inspeções (ignorar erros nas consultas)
        const totalInspections = inspectionCounts.reduce((sum, result) => {
          if (result.error) {
            logger.warn('Erro ao contar inspeções', 'profile', result.error);
            return sum;
          }
          return sum + (result.count || 0);
        }, 0);

        setStats({
          totalEquipment: filteredEquipment.length,
          totalInspections,
          activeAlerts: activeAlertsCount,
        });
      } catch (err: any) {
        logger.error('Erro ao buscar estatísticas', 'profile', err);
        // Define estatísticas padrão em caso de erro para não bloquear a tela
        setStats({
          totalEquipment: 0,
          totalInspections: 0,
          activeAlerts: 0,
        });
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user, filteredEquipment.length, activeAlertsCount]);

  // Buscar licença do usuário
  useEffect(() => {
    const fetchLicense = async () => {
      if (!user) {
        setLoadingLicense(false);
        return;
      }

      setLoadingLicense(true);
      try {
        // Obter machine_id atual
        const currentMachineId = await licenseService.getMachineId();
        setMachineId(currentMachineId);

        // Tentar buscar licença pelo user_id primeiro
        let foundLicense: License | null = null;

        if (user.id) {
          const { data: licenseByUserId } = await supabase
            .from('licenses')
            .select('*')
            .eq('user_id', user.id)
            .maybeSingle();

          if (licenseByUserId) {
            foundLicense = licenseByUserId as License;
          }
        }

        // Se não encontrou pelo user_id, buscar pelo machine_id atual
        if (!foundLicense && currentMachineId) {
          const { data: licenseByMachineId } = await supabase
            .from('licenses')
            .select('*')
            .eq('machine_id', currentMachineId)
            .maybeSingle();

          if (licenseByMachineId) {
            foundLicense = licenseByMachineId as License;
          }
        }

        if (foundLicense) {
          setLicense(foundLicense);
          // Verificar status da licença
          const status = await licenseService.checkLicenseStatus(foundLicense.machine_id);
          setLicenseStatus(status);
        } else {
          // Se não encontrou licença, verificar status mesmo assim (pode criar uma nova)
          const status = await licenseService.checkLicenseStatus(currentMachineId);
          setLicenseStatus(status);
        }
      } catch (err) {
        logger.error('Erro ao buscar licença do usuário', 'profile', err);
      } finally {
        setLoadingLicense(false);
      }
    };

    fetchLicense();
  }, [user, profile?.plan]); // Recarregar quando o plan do profile mudar

  const getPlanBadge = (plan: 'trial' | 'premium' | undefined) => {
    switch (plan) {
      case 'premium':
        return {
          name: t('profile.premiumPlan'),
          textColor: 'text-rally-blue',
          bgColor: 'bg-rally-blue-translucent/30',
        };
      case 'trial':
        return {
          name: t('profile.trialPlan'),
          textColor: 'text-rally-yellow',
          bgColor: 'bg-rally-yellow-translucent/30',
        };
      default:
        return {
          name: t('profile.unknownPlan'),
          textColor: 'text-light-text-secondary dark:text-dark-text-secondary',
          bgColor: 'bg-gray-200 dark:bg-gray-700',
        };
    }
  };

  const handleUpdateProfile = async (formData: ProfileFormData) => {
    if (!user) return;

    const success = await executeWithFeedback(
      async () => {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);
      if (error) throw error;
        return true;
      },
      'profile',
      t('profile.profileUpdated'),
      t('profile.profileUpdateFailed')
    );

    if (success) {
      setIsEditing(false);
      // Atualiza o perfil no contexto sem recarregar a página
      await refreshProfile();
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);

    const success = await executeWithFeedback(
      async () => {
        // Comprime a imagem antes do upload
        const compressedBlob = await compressImage(file, {
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.85,
          format: 'webp',
          maxSizeMB: 1,
        });

        // Converte blob para File
        const compressedFile = new File(
          [compressedBlob],
          `${user.id}_${Date.now()}.webp`,
          { type: compressedBlob.type }
        );

        // Upload da imagem comprimida para storage
        const filePath = compressedFile.name;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
          .upload(filePath, compressedFile, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Obtém URL pública
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Atualiza o perfil com a URL do avatar
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: urlData.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) throw updateError;
        return true;
      },
      'profile',
      t('profile.avatarUploadSuccess'),
      t('profile.avatarUploadFailed')
    );

    if (success) {
      // Atualiza o perfil no contexto sem recarregar a página
      await refreshProfile();
    }
    
    setIsUploadingAvatar(false);
  };

  const planBadge = getPlanBadge(profile?.plan);

  // Mostra loading apenas se estiver carregando o perfil inicialmente
  // Não bloqueia se estiver apenas carregando estatísticas
  if (loading) {
    return (
      <div className="p-4 flex flex-col items-center justify-center text-center min-h-screen" style={{ backgroundColor: '#000000' }}>
        <Spinner size="lg" color="blue" />
      </div>
    );
  }

  // Se há erro ao carregar perfil, mostra mensagem de erro
  if (profileError && !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: '#000000' }}>
        <div 
          className="max-w-md w-full p-6 rounded-lg border text-center"
          style={{ backgroundColor: '#1A1A1A', borderColor: '#DC2626' }}
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
          <h2 className="text-xl font-bold mb-2" style={{ color: '#FFFFFF' }}>
            Erro ao Carregar Perfil
          </h2>
          <p className="text-sm mb-6" style={{ color: '#9CA3AF' }}>
            {profileError}
          </p>
          <div className="space-y-3">
            <button
              onClick={() => refreshProfile()}
              className="w-full px-4 py-3 bg-white text-black rounded-lg font-semibold hover:bg-gray-200 transition-colors"
            >
              Tentar Novamente
            </button>
            <button
              onClick={() => signOut()}
              className="w-full px-4 py-3 rounded-lg font-semibold transition-colors"
              style={{ backgroundColor: '#374151', color: '#FFFFFF' }}
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'profile.myProfile' }} />
      <main className="p-4 pb-32 flex flex-col items-center text-center" style={{ backgroundColor: '#000000' }}>
      {/* Avatar e Nome */}
      <div className="relative mb-4">
        {profile?.avatar_url ? (
          <LazyImage
            src={profile.avatar_url}
            alt={profile.full_name || t('profile.avatarAlt')}
            className="w-24 h-24 rounded-full object-cover border-2"
            style={{ borderColor: '#2A2A2A' }}
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-dark-surface flex items-center justify-center border-2" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
            <span className="text-4xl font-bold" style={{ color: '#72DEFF' }}>
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
        )}
        <label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 w-8 h-8 rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-colors"
          style={{ backgroundColor: '#72DEFF' }}
          title={t('profile.changeAvatar')}
        >
          <Camera size={16} className="text-white" />
          <input
            id="avatar-upload"
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            disabled={isUploadingAvatar}
            className="hidden"
          />
        </label>
        {isUploadingAvatar && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
            <Spinner size="md" color="white" />
          </div>
        )}
      </div>

      {/* Nome e Role */}
      {isEditing ? (
        <form onSubmit={handleSubmit(handleUpdateProfile)} className="w-full max-w-sm">
          <div className="mb-4">
            <label htmlFor="full_name" className="block text-sm font-medium mb-1 text-left">
              {t('profile.name')}
            </label>
            <input
              id="full_name"
              {...register('full_name', { required: t('auth.emailRequired') })}
              className="w-full p-3 apple-card border rounded-lg focus:ring-2 focus:ring-rally-blue/30 focus:outline-none" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}
            />
            {errors.full_name && (
              <p className="text-sm mt-1 text-left" style={{ color: '#FF6859' }}>{errors.full_name.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 p-3 text-white rounded-lg hover:opacity-90 transition-colors"
              style={{ backgroundColor: '#72DEFF' }}
            >
              <Save size={16} />
              {t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                reset({ full_name: profile?.full_name || '' });
              }}
              className="flex-1 flex items-center justify-center gap-2 p-3 apple-card border rounded-lg hover:bg-[var(--bg-current)] transition-colors" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}
            >
              <X size={16} />
              {t('common.cancel')}
            </button>
          </div>
        </form>
      ) : (
        <>
          <h1 className="text-2xl font-bold font-display">{profile?.full_name ?? t('profile.user')}</h1>
          {profile?.role === 'admin' && (
            <span className="mt-2 text-xs font-semibold inline-block py-1 px-2.5 uppercase rounded-full" style={{ color: '#72DEFF', backgroundColor: 'rgba(114, 222, 255, 0.2)' }}>
              {t('profile.admin')}
            </span>
          )}
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2 flex items-center justify-center gap-2">
            <Mail size={16} />
            {user?.email ?? t('profile.emailPlaceholder')}
          </p>
          {user?.created_at && (
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1 flex items-center justify-center gap-1">
              <Calendar size={12} />
              {t('profile.memberSince')} {new Date(user.created_at).toLocaleDateString(currentLanguage === 'pt-BR' ? 'pt-BR' : 'en-US', { month: 'short', year: 'numeric' })}
            </p>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="mt-3 flex items-center gap-2 text-sm hover:opacity-90 transition-colors"
            style={{ color: '#72DEFF' }}
          >
            <Edit2 size={14} />
            {t('profile.editProfile')}
          </button>
        </>
      )}


      {/* Plano */}
      <div className={`mt-8 w-full max-w-sm ${planBadge.bgColor} p-4 rounded-lg text-left`}>
        <p className={`text-sm font-bold ${planBadge.textColor}`}>{planBadge.name}</p>
        <TrialStatusBar profile={profile} />
      </div>

      {/* Informações da Licença */}
      <div className="mt-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-3 text-left flex items-center gap-2">
          <Key size={20} />
          Minha Licença
        </h3>
        {loadingLicense ? (
          <div className="p-4 apple-card rounded-lg border" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}>
            <Skeleton className="h-4 w-32 mb-2" />
            <Skeleton className="h-3 w-24" />
          </div>
        ) : license || licenseStatus ? (
          <div className="p-4 apple-card rounded-lg border space-y-3" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}>
            {/* Machine ID */}
            {machineId && (
              <div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1 uppercase tracking-wide">
                  Machine ID
                </div>
                <div className="font-mono text-sm font-semibold text-white">
                  {machineId}
                </div>
              </div>
            )}

            {/* Status da Licença */}
            {licenseStatus && (
              <div className="flex items-center gap-2">
                {licenseStatus.valid ? (
                  <CheckCircle size={16} className="text-green-400" />
                ) : (
                  <XCircle size={16} className="text-red-400" />
                )}
                <span className={`text-sm font-semibold ${licenseStatus.valid ? 'text-green-400' : 'text-red-400'}`}>
                  {licenseStatus.valid ? 'Licença Válida' : 'Licença Expirada'}
                </span>
              </div>
            )}

            {/* Tipo de Licença */}
            {license && (
              <div>
                <div className="text-xs text-light-text-secondary dark:text-dark-text-secondary mb-1">
                  Tipo
                </div>
                <div className="text-sm font-semibold text-white">
                  {license.license_type === 'premium' && 'Premium'}
                  {license.license_type === 'lifetime' && 'Vitalícia'}
                  {license.license_type === 'experimental' && 'Avaliação (Trial)'}
                </div>
              </div>
            )}

            {/* Dias Restantes */}
            {licenseStatus && (
              <div className="flex items-center gap-2">
                <Clock size={14} className="text-light-text-secondary dark:text-dark-text-secondary" />
                <span className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
                  {licenseStatus.daysRemaining === Infinity ? (
                    <span className="flex items-center gap-1">
                      <Infinity size={14} />
                      Vitalícia
                    </span>
                  ) : licenseStatus.isTrial ? (
                    `${licenseStatus.trialDaysRemaining || 0} dias restantes (trial)`
                  ) : (
                    `${licenseStatus.daysRemaining} dias restantes`
                  )}
                </span>
              </div>
            )}

            {/* Datas */}
            {license && (
              <div className="space-y-1 pt-2 border-t" style={{ borderColor: 'var(--border-current)' }}>
                <div className="flex items-center gap-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                  <Calendar size={12} />
                  Instalado: {format(new Date(license.install_date), 'dd/MM/yyyy', { locale: ptBR })}
                </div>
                {license.last_activation_date && (
                  <div className="flex items-center gap-2 text-xs text-light-text-secondary dark:text-dark-text-secondary">
                    <Clock size={12} />
                    Ativado: {format(new Date(license.last_activation_date), 'dd/MM/yyyy', { locale: ptBR })}
                  </div>
                )}
              </div>
            )}

            {/* Mensagem se não tem licença associada */}
            {!license && licenseStatus && (
              <div className="text-xs text-yellow-400 pt-2 border-t" style={{ borderColor: 'var(--border-current)' }}>
                ⚠️ Licença será associada automaticamente ao fazer login
              </div>
            )}
          </div>
        ) : (
          <div className="p-4 apple-card rounded-lg border text-center" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              Nenhuma licença encontrada
            </p>
          </div>
        )}
      </div>

      {/* Estatísticas */}
      <div className="mt-6 w-full max-w-sm">
        <h3 className="text-lg font-semibold mb-3 text-left flex items-center gap-2">
          <BarChart3 size={20} />
          {t('profile.statistics')}
        </h3>
        {loadingStats ? (
          <div className="grid grid-cols-3 gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-3 apple-card rounded-lg border" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}>
                <Skeleton className="h-8 w-12 mb-2" />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : stats ? (
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 apple-card rounded-lg border" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}>
              <p className="text-2xl font-bold" style={{ color: '#72DEFF' }}>{stats.totalEquipment}</p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                {t('profile.totalEquipment')}
              </p>
            </div>
            <div className="p-3 apple-card rounded-lg border" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}>
              <p className="text-2xl font-bold" style={{ color: '#72DEFF' }}>{stats.totalInspections}</p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                {t('profile.totalInspections')}
              </p>
            </div>
            <div className="p-3 apple-card rounded-lg border" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}>
              <p className="text-2xl font-bold" style={{ color: '#FFCF44' }}>{stats.activeAlerts}</p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                {t('profile.activeAlerts')}
              </p>
            </div>
          </div>
        ) : (
          <div className="p-3 apple-card rounded-lg border text-center" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}>
            <p className="text-sm text-light-text-secondary dark:text-dark-text-secondary">
              {t('profile.noStats')}
            </p>
          </div>
        )}
      </div>

      {/* Menu de Opções */}
      <div className="mt-8 w-full max-w-sm space-y-2">
        <button 
          onClick={() => navigate('/profile/my-data')}
          className="w-full text-left p-3 apple-card rounded-lg border hover:border-rally-blue/30 transition-colors flex items-center gap-3" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}
        >
          <User size={18} color="#72DEFF" />
          <span>{t('profile.myData')}</span>
        </button>
        <button 
          onClick={() => navigate('/profile/plan-payment')}
          className="w-full text-left p-3 apple-card rounded-lg border hover:border-rally-blue/30 transition-colors flex items-center gap-3" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}
        >
          <CreditCard size={18} color="#72DEFF" />
          <span>{t('profile.planAndPayment')}</span>
        </button>
        <button 
          onClick={() => navigate('/profile/settings')}
          className="w-full text-left p-3 apple-card rounded-lg border hover:border-rally-blue/30 transition-colors flex items-center gap-3" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}
        >
          <Settings size={18} color="#72DEFF" />
          <span>{t('settings.title')}</span>
        </button>
        <button 
          onClick={() => setIsFeedbackModalOpen(true)}
          className="w-full text-left p-3 apple-card rounded-lg border hover:border-rally-blue/30 transition-colors flex items-center gap-3" style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}
        >
          <MessageSquare size={18} color="#72DEFF" />
          <span>{t('feedback.title')}</span>
        </button>
      </div>

      {/* Botão Sair */}
      <button
        onClick={signOut}
        className="mt-8 w-full max-w-sm flex items-center justify-center gap-2 p-3 border rounded-lg transition-colors hover:opacity-80"
        style={{ borderColor: 'rgba(255, 104, 89, 0.5)', color: '#FF6859' }}
      >
        <LogOut size={16} />
        {t('profile.signOut')}
      </button>

      {/* Modal de Feedback */}
      <FeedbackModal 
        isOpen={isFeedbackModalOpen} 
        onClose={() => setIsFeedbackModalOpen(false)} 
      />
      </main>
    </div>
  );
};

export default Profile;
