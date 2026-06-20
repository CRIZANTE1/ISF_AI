import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import { Mail, User, Save, X } from 'lucide-react';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { ButtonSkeleton } from '../components/skeletons';

interface MyDataFormData {
  full_name: string;
  email: string;
}

const MyDataPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { executeWithFeedback } = useErrorHandler();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [isEditingEmail, setIsEditingEmail] = useState(false);

  const { register, handleSubmit, formState: { errors }, reset } = useForm<MyDataFormData>({
    defaultValues: {
      full_name: profile?.full_name || '',
      email: user?.email || '',
    }
  });

  const handleUpdateProfile = async (formData: MyDataFormData) => {
    if (!user) return;
    setLoading(true);

    const success = await executeWithFeedback(
      async () => {
        // Atualiza nome no perfil
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            full_name: formData.full_name,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (profileError) throw profileError;

        // Atualiza email no auth (se foi alterado)
        if (formData.email !== user.email) {
          // CRÍTICO: Verificar sessão antes de updateUser
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError || !session) {
            throw new Error('Sessão expirada. Faça login novamente.');
          }

          const { error: emailError } = await supabase.auth.updateUser({
            email: formData.email,
          });

          if (emailError) {
            // Verificar se é erro de sessão
            if (emailError.message?.includes('session') || emailError.message?.includes('jwt')) {
              throw new Error('Sessão expirada. Faça login novamente.');
            }
            throw new Error('Não foi possível atualizar o email. Verifique se o email já está em uso ou se você precisa confirmar o novo email.');
          }
          
          // Pequeno delay para garantir persistência
          await new Promise(resolve => setTimeout(resolve, 300));
        }

        return true;
      },
      'profile',
      'Dados atualizados com sucesso!',
      'Falha ao atualizar dados'
    );

    if (success) {
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    }
    
    setLoading(false);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title={{ key: 'myData.title' }} />
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        <form onSubmit={handleSubmit(handleUpdateProfile)} className="max-w-md mx-auto">
          <div className="mb-6">
            <label htmlFor="full_name" className="block text-sm font-medium mb-2 flex items-center gap-2">
              <User size={18} />
              {t('profile.name')} *
            </label>
            <input
              id="full_name"
              {...register('full_name', { required: t('auth.emailRequired') })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            />
            {errors.full_name && (
              <p className="text-sm text-status-error mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Mail size={18} />
              {t('auth.email')} *
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: t('auth.emailRequired'),
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: t('errors.validation'),
                  },
                })}
                disabled={!isEditingEmail}
                className="flex-1 p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none disabled:opacity-50" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
              />
              {!isEditingEmail && (
                <button
                  type="button"
                  onClick={() => setIsEditingEmail(true)}
                  className="px-4 py-3 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  {t('common.edit')}
                </button>
              )}
              {isEditingEmail && (
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingEmail(false);
                    reset({ email: user?.email || '' });
                  }}
                  className="px-4 py-3 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
            {errors.email && (
              <p className="text-sm text-status-error mt-1">{errors.email.message}</p>
            )}
            {isEditingEmail && (
              <p className="text-xs text-light-text-secondary dark:text-dark-text-secondary mt-1">
                ⚠️ Ao alterar o email, você receberá um link de confirmação no novo endereço.
              </p>
            )}
          </div>


          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {loading ? <ButtonSkeleton width="w-16" /> : t('common.save')}
            </button>
            <button
              type="button"
              onClick={() => navigate('/profile')}
              className="px-6 p-3 bg-light-surface dark:bg-dark-surface border rounded-lg hover:bg-light-background dark:hover:bg-dark-background transition-colors" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            >
              <X size={18} />
            </button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default MyDataPage;

