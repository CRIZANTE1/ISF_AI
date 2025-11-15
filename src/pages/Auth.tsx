import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logUserAccess } from '../utils/adminOperations';
import LoginPage from '../components/ui/gaming-login';
import { DottedSurface } from '../components/ui/DottedSurface';
import { useErrorHandler } from '../hooks/useErrorHandler';

type AuthMode = 'login' | 'signup' | 'forgot-password' | 'reset-password';

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session } = useAuth();
  const { handleError, showSuccess } = useErrorHandler();

  useEffect(() => {
    if (session) {
      navigate('/');
    }

    // Verificar se há um hash de recuperação de senha na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (type === 'recovery' && accessToken) {
      setMode('reset-password');
    }
  }, [session, navigate]);

  const handleAuth = async (emailValue: string, passwordValue: string, remember: boolean) => {
    setLoading(true);
    setError(null);
    setMessage(null);
    setEmail(emailValue);
    setPassword(passwordValue);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email: emailValue,
          password: passwordValue,
          options: {
            data: {
              full_name: fullName,
              role: 'admin', // Default role for new signups
            },
          },
        });
        if (error) throw error;
        const successMsg = 'Cadastro realizado! Verifique seu e-mail para confirmar a conta e depois faça o login.';
        setMessage(successMsg);
        showSuccess(successMsg);
        setMode('login'); // Switch to login view after successful signup
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email: emailValue,
          password: passwordValue,
        });
        if (error) {
          // Log failed login (non-blocking)
          logUserAccess('login', false, error.message).catch((logError) => {
            console.error('Failed to log login error:', logError);
          });
          throw error;
        }
        // Successful login will be logged in AuthContext onAuthStateChange
        navigate('/');
      }
    } catch (err: any) {
      // Usar o sistema centralizado de tratamento de erros
      const appError = handleError(err, mode === 'signup' ? 'auth' : 'auth', 
        mode === 'signup' ? 'Erro ao criar conta' : 'Erro ao fazer login'
      );
      setError(appError.userMessage || appError.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    if (mode === 'forgot-password' || mode === 'reset-password') {
      setMode('login');
      window.history.replaceState({}, '', '/auth');
    } else {
      setMode(mode === 'login' ? 'signup' : 'login');
    }
    setError(null);
    setMessage(null);
  };

  const handleForgotPassword = async (emailValue: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!emailValue) {
      setError('Por favor, informe seu e-mail.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
        redirectTo: `${window.location.origin}/auth?mode=reset-password`,
      });

      if (error) throw error;

      setMessage('E-mail de recuperação enviado! Verifique sua caixa de entrada e siga as instruções para redefinir sua senha.');
      setEmail('');
    } catch (err: any) {
      console.error('Erro ao solicitar recuperação de senha:', err);
      
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (err?.message?.includes('rate limit')) {
        setError('Muitas tentativas. Aguarde alguns minutos antes de tentar novamente.');
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Erro ao enviar e-mail de recuperação. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (newPasswordValue: string, confirmPasswordValue: string) => {
    setLoading(true);
    setError(null);
    setMessage(null);

    if (!newPasswordValue || !confirmPasswordValue) {
      setError('Por favor, preencha todos os campos.');
      setLoading(false);
      return;
    }

    if (newPasswordValue.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    if (newPasswordValue !== confirmPasswordValue) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPasswordValue,
      });

      if (error) throw error;

      setMessage('Senha redefinida com sucesso! Você pode fazer login agora.');
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirecionar para login após 2 segundos
      setTimeout(() => {
        setMode('login');
        window.history.replaceState({}, '', '/auth');
      }, 2000);
    } catch (err: any) {
      console.error('Erro ao redefinir senha:', err);
      
      if (err?.message?.includes('Failed to fetch') || err?.message?.includes('NetworkError')) {
        setError('Erro de conexão. Verifique sua internet e tente novamente.');
      } else if (err?.message?.includes('expired') || err?.message?.includes('invalid')) {
        setError('Link de recuperação inválido ou expirado. Solicite um novo link.');
        setTimeout(() => {
          setMode('forgot-password');
          window.history.replaceState({}, '', '/auth');
        }, 3000);
      } else if (err?.message) {
        setError(err.message);
      } else {
        setError('Erro ao redefinir senha. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center px-4 py-12 overflow-hidden">
      <DottedSurface />

      <div className="relative z-20 w-full max-w-md animate-fadeIn">
        <LoginPage.LoginForm
          onSubmit={handleAuth}
          onForgotPassword={() => setMode('forgot-password')}
          onSignup={() => setMode('signup')}
          mode={mode}
          error={error}
          message={message}
          loading={loading}
          onModeChange={(newMode) => {
            setMode(newMode);
            setError(null);
            setMessage(null);
            if (newMode === 'login') {
              window.history.replaceState({}, '', '/auth');
            }
          }}
          fullName={fullName}
          onFullNameChange={setFullName}
          newPassword={newPassword}
          onNewPasswordChange={setNewPassword}
          confirmPassword={confirmPassword}
          onConfirmPasswordChange={setConfirmPassword}
          onResetPassword={handleResetPassword}
          onForgotPasswordSubmit={handleForgotPassword}
        />
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm z-20">
        © 2025 ISF IA. All rights reserved.
      </footer>
    </div>
  );
};

export default AuthPage;
