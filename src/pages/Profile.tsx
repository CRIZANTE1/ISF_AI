import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { LogOut, Edit2, User, Mail, Calendar, Settings, CreditCard, BarChart3, Save, X, Camera } from 'lucide-react';
import Skeleton from '../components/Skeleton';
import TrialStatusBar from '../components/TrialStatusBar';
import PageHeader from '../components/PageHeader';
import { useForm } from 'react-hook-form';
import { getAllExtinguishers } from '../utils/extinguisherOperations';
import { getAllHoses } from '../utils/hoseOperations';
import { getAllSCBAs } from '../utils/scbaOperations';
import { getAllMultigasDetectors } from '../utils/multigasOperations';
import { getAllFoamChambers } from '../utils/foamChamberOperations';
import { getAllCannonMonitors } from '../utils/cannonMonitorOperations';
import { getAllEyewashStations } from '../utils/eyewashOperations';
import { getAllAlarmSystems } from '../utils/alarmOperations';
import { getAllShelters } from '../utils/shelterOperations';

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
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [error, setError] = useState<string | null>(null);
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
      if (!user) return;
      setLoadingStats(true);
      try {
        const [
          extinguishers,
          hoses,
          scbas,
          multigasDetectors,
          foamChambers,
          cannonMonitors,
          eyewashStations,
          alarmSystems,
          shelters,
        ] = await Promise.all([
          getAllExtinguishers(),
          getAllHoses(),
          getAllSCBAs(),
          getAllMultigasDetectors(),
          getAllFoamChambers(),
          getAllCannonMonitors(),
          getAllEyewashStations(),
          getAllAlarmSystems(),
          getAllShelters(),
        ]);

        const allEquipment = [
          ...extinguishers,
          ...hoses,
          ...scbas,
          ...multigasDetectors,
          ...foamChambers,
          ...cannonMonitors,
          ...eyewashStations,
          ...alarmSystems,
          ...shelters,
        ].filter((eq: any) => !eq.user_id || eq.user_id === user.id);

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

        // Somar todas as inspeções
        const totalInspections = inspectionCounts.reduce((sum, result) => sum + (result.count || 0), 0);

        // Contar alertas (equipamentos com próxima inspeção vencida)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        let activeAlerts = 0;
        allEquipment.forEach((eq: any) => {
          const nextInspection = eq.proxima_inspecao || eq.data_proxima_inspecao || eq.data_proximo_teste;
          if (nextInspection) {
            const inspectionDate = new Date(nextInspection);
            inspectionDate.setHours(0, 0, 0, 0);
            if (inspectionDate < today) {
              activeAlerts++;
            }
          }
        });

        setStats({
          totalEquipment: allEquipment.length,
          totalInspections,
          activeAlerts,
        });
      } catch (err: any) {
        console.error('Erro ao buscar estatísticas:', err);
      } finally {
        setLoadingStats(false);
      }
    };

    fetchStats();
  }, [user]);

  const getPlanBadge = (plan: 'trial' | 'premium' | undefined) => {
    switch (plan) {
      case 'premium':
        return {
          name: '✨ Plano Premium',
          textColor: 'text-accent-cyan',
          bgColor: 'bg-accent-cyan/10 dark:bg-accent-cyan/20',
        };
      case 'trial':
        return {
          name: '⏳ Plano Trial',
          textColor: 'text-status-warning',
          bgColor: 'bg-status-warning/10 dark:bg-status-warning/20',
        };
      default:
        return {
          name: 'Plano Desconhecido',
          textColor: 'text-light-text-secondary dark:text-dark-text-secondary',
          bgColor: 'bg-gray-200 dark:bg-gray-700',
        };
    }
  };

  const handleUpdateProfile = async (formData: ProfileFormData) => {
    if (!user) return;
    setError(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (error) throw error;
      setIsEditing(false);
      // Força atualização do perfil no contexto
      window.location.reload();
    } catch (err: any) {
      setError('Falha ao atualizar perfil.');
      console.error(err);
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setIsUploadingAvatar(true);
    setError(null);

    try {
      // Upload da imagem para storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}_${Date.now()}.${fileExt}`;
      const filePath = fileName;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
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
      // Força atualização do perfil no contexto
      window.location.reload();
    } catch (err: any) {
      setError('Falha ao fazer upload do avatar.');
      console.error(err);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const planBadge = getPlanBadge(profile?.plan);

  if (loading || loadingStats) {
    return (
      <div className="p-4 flex flex-col items-center text-center min-h-screen">
        <Skeleton className="w-24 h-24 rounded-full mb-4" />
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-5 w-56 mb-8" />
        <Skeleton className="h-24 w-full max-w-sm" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <PageHeader title="Meu Perfil" />
      <main className="p-4 flex flex-col items-center text-center">
      {/* Avatar e Nome */}
      <div className="relative mb-4">
        {profile?.avatar_url ? (
          <img
            src={profile.avatar_url}
            alt={profile.full_name || 'Avatar'}
            className="w-24 h-24 rounded-full object-cover border-2"
            style={{ borderColor: '#2A2A2A' }}
          />
        ) : (
          <div className="w-24 h-24 rounded-full bg-dark-surface flex items-center justify-center border-2" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A' }}>
            <span className="text-4xl font-bold text-accent-cyan">
              {profile?.full_name?.charAt(0)?.toUpperCase() ?? 'U'}
            </span>
          </div>
        )}
        <label
          htmlFor="avatar-upload"
          className="absolute bottom-0 right-0 w-8 h-8 bg-accent-cyan rounded-full flex items-center justify-center cursor-pointer hover:opacity-90 transition-colors"
          title="Alterar foto"
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: '#2A2A2A' }}></div>
          </div>
        )}
      </div>

      {/* Nome e Role */}
      {isEditing ? (
        <form onSubmit={handleSubmit(handleUpdateProfile)} className="w-full max-w-sm">
          <div className="mb-4">
            <label htmlFor="full_name" className="block text-sm font-medium mb-1 text-left">
              Nome Completo
            </label>
            <input
              id="full_name"
              {...register('full_name', { required: 'Nome é obrigatório' })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-accent-cyan/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            />
            {errors.full_name && (
              <p className="text-sm text-status-error mt-1 text-left">{errors.full_name.message}</p>
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-accent-cyan text-white rounded-lg hover:opacity-90 transition-colors"
            >
              <Save size={16} />
              Salvar
            </button>
            <button
              type="button"
              onClick={() => {
                setIsEditing(false);
                reset({ full_name: profile?.full_name || '' });
              }}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            >
              <X size={16} />
              Cancelar
            </button>
          </div>
        </form>
      ) : (
        <>
          <h1 className="text-2xl font-bold font-display">{profile?.full_name ?? 'Nome do Usuário'}</h1>
          {profile?.role === 'admin' && (
            <span className="mt-2 text-xs font-semibold inline-block py-1 px-2.5 uppercase rounded-full text-status-info bg-status-info/20">
              Administrador
            </span>
          )}
          <p className="text-light-text-secondary dark:text-dark-text-secondary mt-2 flex items-center justify-center gap-2">
            <Mail size={16} />
            {user?.email ?? 'email@exemplo.com'}
          </p>
          {user?.created_at && (
            <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1 flex items-center justify-center gap-1">
              <Calendar size={12} />
              Membro desde {new Date(user.created_at).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })}
            </p>
          )}
          <button
            onClick={() => setIsEditing(true)}
            className="mt-3 flex items-center gap-2 text-sm text-accent-cyan hover:opacity-90 transition-colors"
          >
            <Edit2 size={14} />
            Editar Perfil
          </button>
        </>
      )}

      {error && (
        <div className="mt-4 w-full max-w-sm p-3 bg-status-error/20 text-status-error rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Plano */}
      <div className={`mt-8 w-full max-w-sm ${planBadge.bgColor} p-4 rounded-lg text-left`}>
        <p className={`text-sm font-bold ${planBadge.textColor}`}>{planBadge.name}</p>
        <TrialStatusBar profile={profile} />
      </div>

      {/* Estatísticas */}
      {stats && (
        <div className="mt-6 w-full max-w-sm">
          <h3 className="text-lg font-semibold mb-3 text-left flex items-center gap-2">
            <BarChart3 size={20} />
            Estatísticas
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
              <p className="text-2xl font-bold text-accent-cyan">{stats.totalEquipment}</p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                Equipamentos
              </p>
            </div>
            <div className="p-3 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
              <p className="text-2xl font-bold text-accent-cyan">{stats.totalInspections}</p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                Inspeções
              </p>
            </div>
            <div className="p-3 bg-light-surface dark:bg-dark-surface rounded-lg border" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}>
              <p className="text-2xl font-bold text-status-warning">{stats.activeAlerts}</p>
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                Alertas
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Menu de Opções */}
      <div className="mt-8 w-full max-w-sm space-y-2">
        <button 
          onClick={() => navigate('/profile/my-data')}
          className="w-full text-left p-3 bg-light-surface dark:bg-dark-surface rounded-lg border hover:border-accent-cyan/30 transition-colors flex items-center gap-3" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        >
          <User size={18} color="#00C8FF" />
          <span>Meus Dados</span>
        </button>
        <button 
          onClick={() => navigate('/profile/plan-payment')}
          className="w-full text-left p-3 bg-light-surface dark:bg-dark-surface rounded-lg border hover:border-accent-cyan/30 transition-colors flex items-center gap-3" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        >
          <CreditCard size={18} color="#00C8FF" />
          <span>Plano e Pagamento</span>
        </button>
        <button 
          onClick={() => navigate('/profile/settings')}
          className="w-full text-left p-3 bg-light-surface dark:bg-dark-surface rounded-lg border hover:border-accent-cyan/30 transition-colors flex items-center gap-3" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
        >
          <Settings size={18} color="#00C8FF" />
          <span>Configurações</span>
        </button>
      </div>

      {/* Botão Sair */}
      <button
        onClick={signOut}
        className="mt-8 w-full max-w-sm flex items-center justify-center gap-2 p-3 border border-status-error/50 text-status-error rounded-lg hover:bg-status-error/10 transition-colors"
      >
        <LogOut size={16} />
        Sair da Conta
      </button>
      </main>
    </div>
  );
};

export default Profile;
