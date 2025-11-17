import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useEquipmentCache } from '../contexts/EquipmentCacheContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit2, User, Mail, Calendar, Settings, CreditCard, BarChart3, Save, X, Camera } from 'lucide-react';
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

interface ProfileFormData {
  full_name: string;
}

interface UserStats {
  totalEquipment: number;
  totalInspections: number;
  activeAlerts: number;
}

const Profile = () => {
  const { profile, user, signOut, loading } = useAuth();
  const { getAllEquipment } = useEquipmentCache();
  const navigate = useNavigate();
  const { t, currentLanguage } = useTranslation();
  const { executeWithFeedback } = useErrorHandler();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
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

  // Busca estatísticas do usuário
  useEffect(() => {
    const fetchStats = async () => {
      if (!user) {
        setLoadingStats(false);
        return;
      }
      setLoadingStats(true);
      try {
        // Usar dados do cache em vez de fazer novas chamadas
        const allEquipment = getAllEquipment().filter(
          (eq: any) => !eq.user_id || eq.user_id === user.id
        );

        // Contar inspeções de todas as tabelas especializadas
        const inspectionCounts = await Promise.all([
          supabase.from('inspecoes_scba').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('inspecoes_multigas').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('inspecoes_camaras_espuma').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('inspecoes_canhoes_monitores').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('inspecoes_chuveiros_lava_olhos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('inspecoes_alarmes').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
          supabase.from('inspecoes_abrigos').select('id', { count: 'exact', head: true }).eq('user_id', user.id),
        ]);

        // Somar todas as inspeções (ignorar erros nas consultas)
        const totalInspections = inspectionCounts.reduce((sum, result) => {
          if (result.error) {
            logger.warn('Erro ao contar inspeções', 'profile', result.error);
            return sum;
          }
          return sum + (result.count || 0);
        }, 0);

        // Contar alertas (equipamentos com próxima inspeção vencida)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let activeAlerts = 0;
        allEquipment.forEach((eq: any) => {
          const nextInspection = eq.proxima_inspecao || eq.data_proxima_inspecao || eq.data_proximo_teste;
          if (nextInspection) {
            try {
              const inspectionDate = new Date(nextInspection);
              inspectionDate.setHours(0, 0, 0, 0);
              if (inspectionDate < today) {
                activeAlerts++;
              }
            } catch (e) {
              // Ignorar erros de parsing de data
              logger.warn('Erro ao processar data de inspeção', 'profile', e);
            }
          }
        });

        setStats({
          totalEquipment: allEquipment.length,
          totalInspections,
          activeAlerts,
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
  }, [user, getAllEquipment]);

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
      'Perfil atualizado com sucesso!',
      'Falha ao atualizar perfil'
    );

    if (success) {
      setIsEditing(false);
      // Força atualização do perfil no contexto
      window.location.reload();
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
      'Avatar atualizado com sucesso!',
      'Falha ao fazer upload do avatar'
    );

    if (success) {
      // Força atualização do perfil no contexto
      window.location.reload();
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'profile.myProfile' }} />
      <main className="p-4 pb-32 flex flex-col items-center text-center" style={{ backgroundColor: '#000000' }}>
      {/* Avatar e Nome */}
      <div className="relative mb-4">
        {profile?.avatar_url ? (
          <LazyImage
            src={profile.avatar_url}
            alt={profile.full_name || 'Avatar'}
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
            {user?.email ?? 'email@exemplo.com'}
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
              Não foi possível carregar as estatísticas
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
          <span>Meus Dados</span>
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
          <span>Configurações</span>
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
      </main>
    </div>
  );
};

export default Profile;
