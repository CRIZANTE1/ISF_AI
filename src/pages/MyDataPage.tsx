import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import PageHeader from '../components/PageHeader';
import { Mail, User, Save, X } from 'lucide-react';

interface MyDataFormData {
  full_name: string;
  email: string;
}

const MyDataPage = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
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
    setError(null);
    setSuccess(null);

    try {
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
        const { error: emailError } = await supabase.auth.updateUser({
          email: formData.email,
        });

        if (emailError) {
          // Se o email já está em uso ou há outro erro, apenas avisa
          setError('Não foi possível atualizar o email. Verifique se o email já está em uso ou se você precisa confirmar o novo email.');
          setLoading(false);
          return;
        }
      }

      setSuccess('Dados atualizados com sucesso!');
      setTimeout(() => {
        navigate('/profile');
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Falha ao atualizar dados.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#000000' }}>
      <PageHeader title="Meus Dados" />
      <main className="p-4 pb-32" style={{ backgroundColor: '#000000' }}>
        <form onSubmit={handleSubmit(handleUpdateProfile)} className="max-w-md mx-auto">
          <div className="mb-6">
            <label htmlFor="full_name" className="block text-sm font-medium mb-2 flex items-center gap-2">
              <User size={18} />
              Nome Completo *
            </label>
            <input
              id="full_name"
              {...register('full_name', { required: 'Nome é obrigatório' })}
              className="w-full p-3 bg-light-surface dark:bg-dark-surface border rounded-lg focus:ring-2 focus:ring-white/30 focus:outline-none" style={{ backgroundColor: '#1A1A1A', borderColor: '#2A2A2A', borderWidth: '1px' }}
            />
            {errors.full_name && (
              <p className="text-sm text-status-error mt-1">{errors.full_name.message}</p>
            )}
          </div>

          <div className="mb-6">
            <label htmlFor="email" className="block text-sm font-medium mb-2 flex items-center gap-2">
              <Mail size={18} />
              Email *
            </label>
            <div className="flex gap-2">
              <input
                id="email"
                type="email"
                {...register('email', {
                  required: 'Email é obrigatório',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Email inválido',
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
                  Editar
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

          {error && (
            <div className="mb-4 p-3 bg-status-error/20 text-status-error rounded-lg text-sm">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-status-success/20 text-status-success rounded-lg text-sm">
              {success}
            </div>
          )}

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-white text-black font-bold rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Save size={18} />
              {loading ? 'Salvando...' : 'Salvar Alterações'}
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

