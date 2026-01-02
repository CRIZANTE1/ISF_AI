import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logUserAccess } from '../utils/adminOperations';
import LoginPage from '../components/ui/gaming-login';
import { DottedSurface } from '../components/ui/DottedSurface';
import { useErrorHandler } from '../hooks/useErrorHandler';
import { logger } from '../utils/logger';
import { useTranslation } from '../hooks/useTranslation';
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

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
  const { t } = useTranslation();

  // Listener para detectar quando a sessão é estabelecida após OAuth
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      logger.info(`[Auth] Auth state changed: ${event}`, 'auth', { hasSession: !!session });
      
      if (event === 'SIGNED_IN' && session) {
        // Sessão estabelecida - redirecionar
        logger.info('[Auth] Sessão estabelecida após OAuth, redirecionando...', 'auth');
        // Limpar URL antes de redirecionar
        window.history.replaceState({}, '', '/auth');
        navigate('/');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  // Listener do Capacitor App para detectar quando o app volta do navegador (Android/iOS)
  useEffect(() => {
    const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || false;
    
    if (!isCapacitor) {
      return; // Só funciona no Capacitor
    }

    const handleAppUrl = async (data: { url: string }) => {
      logger.info('[Auth] App recebeu URL após retornar do navegador', 'auth', { url: data.url });
      
      // Verificar se é um callback OAuth (deep link com tokens ou code)
      // Suporta tanto fluxo implícito (access_token) quanto PKCE (code)
      const isOAuthCallback = data.url.includes('access_token') || 
                               data.url.includes('refresh_token') ||
                               data.url.includes('code=') ||
                               data.url.includes('google-auth');
      
      if (isOAuthCallback) {
        logger.info('[Auth] Callback OAuth detectado via deep link', 'auth', { 
          url: data.url.substring(0, 100)
        });

        // Tentar extrair o código PKCE se existir
        let code: string | null = null;
        
        try {
          // O deep link pode ser: com.isfia.app://google-auth?code=... ou com.isfia.app://google-auth#code=...
          // Tentar criar URL substituindo o custom scheme por https temporariamente
          const urlForParsing = data.url.replace('com.isfia.app://', 'https://com.isfia.app/');
          const urlObj = new URL(urlForParsing);
          code = urlObj.searchParams.get('code') || urlObj.hash.split('code=')[1]?.split('&')[0];
        } catch (urlError) {
          // Se falhar, tentar parsing manual com regex
          const codeMatch = data.url.match(/[?&#]code=([^&]+)/);
          if (codeMatch) {
            code = decodeURIComponent(codeMatch[1]);
          }
        }
        
        logger.info('[Auth] Código PKCE extraído', 'auth', { 
          hasCode: !!code,
          codeLength: code?.length || 0
        });

        if (code) {
          logger.info('[Auth] Código PKCE detectado, trocando por sessão...', 'auth');
          try {
            const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
            if (sessionData.session && !error) {
              logger.info('[Auth] ✅ Sessão estabelecida via troca de código PKCE!', 'auth', {
                userId: sessionData.session.user.id
              });
              window.history.replaceState({}, '', '/auth');
              navigate('/');
              setLoading(false);
              return;
            } else {
              logger.error('[Auth] Falha na troca de código PKCE', 'auth', error);
            }
          } catch (err) {
            logger.error('[Auth] Erro ao trocar código PKCE', 'auth', err);
          }
        }
        
        // Se falhar a troca de código ou não houver código, tentar o polling (fallback)
        // O Supabase pode ter detectado via detectSessionInUrl se houver tokens hash
        const maxAttempts = 10;
        let attempts = 0;
        
        const checkSession = async (): Promise<boolean> => {
          attempts++;
          logger.info(`[Auth] Tentativa ${attempts}/${maxAttempts} de verificar sessão após deep link...`, 'auth');
          
          try {
            const { data: { session: newSession }, error } = await supabase.auth.getSession();
            
            if (newSession && !error) {
              logger.info('[Auth] ✅ Sessão encontrada após deep link!', 'auth', {
                userId: newSession.user?.id,
                email: newSession.user?.email
              });
              // Limpar a URL
              window.history.replaceState({}, '', '/auth');
              return true;
            } else {
              logger.warn(`[Auth] Sessão não encontrada (tentativa ${attempts})`, 'auth', {
                error: error?.message
              });
              return false;
            }
          } catch (err) {
            logger.error(`[Auth] Erro ao verificar sessão (tentativa ${attempts})`, 'auth', err);
            return false;
          }
        };
        
        // Primeira tentativa imediatamente
        if (await checkSession()) {
          navigate('/');
          setLoading(false);
          return;
        }
        
        // Tentativas adicionais a cada 500ms
        for (let i = 0; i < maxAttempts - 1; i++) {
          await new Promise(resolve => setTimeout(resolve, 500));
          if (await checkSession()) {
            navigate('/');
            setLoading(false);
            return;
          }
        }
        
        // Se chegou aqui, não conseguiu estabelecer sessão
        logger.error('[Auth] ❌ Timeout: sessão não foi estabelecida após deep link', 'auth');
        setError('Erro ao processar login com Google. Tente novamente.');
        setLoading(false);
      }
    };

    // Registrar listener para quando o app recebe uma URL (deep link)
    App.addListener('appUrlOpen', handleAppUrl);

    return () => {
      App.removeAllListeners();
    };
  }, [navigate]);

  // Listener para quando o Browser fecha (usuário retorna ao app após OAuth)
  useEffect(() => {
    const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || false;
    
    if (!isCapacitor) {
      return;
    }

    // Listener para quando o Browser fecha (usuário retorna ao app)
    const handleBrowserClose = async () => {
      logger.info('[Auth] Browser fechado, verificando sessão...', 'auth');
      
      // Aguardar um momento para o Supabase processar
      setTimeout(async () => {
        try {
          const { data: { session: newSession }, error } = await supabase.auth.getSession();
          if (newSession && !error) {
            logger.info('[Auth] Sessão encontrada após Browser fechar, redirecionando...', 'auth', {
              userId: newSession.user?.id,
              email: newSession.user?.email
            });
            navigate('/');
            setLoading(false);
          } else {
            logger.warn('[Auth] Sessão não encontrada após Browser fechar', 'auth', { error: error?.message });
            setLoading(false);
          }
        } catch (err) {
          logger.error('[Auth] Erro ao verificar sessão após Browser fechar', 'auth', err);
          setLoading(false);
        }
      }, 1500);
    };

    Browser.addListener('browserFinished', handleBrowserClose);

    return () => {
      Browser.removeAllListeners();
    };
  }, [navigate]);

  useEffect(() => {
    // Se já tem sessão, redirecionar imediatamente
    if (session) {
      logger.info('[Auth] Sessão encontrada, redirecionando...', 'auth');
      navigate('/');
      return;
    }

    // Polling para verificar sessão a cada 500ms (útil para OAuth callbacks que podem ter delay)
    // Isso garante que detectamos a sessão mesmo se o onAuthStateChange não disparar imediatamente
    const interval = setInterval(async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (currentSession) {
          logger.info('[Auth] Sessão detectada via polling, redirecionando...', 'auth');
          clearInterval(interval);
          window.history.replaceState({}, '', '/auth');
          navigate('/');
        }
      } catch (err) {
        // Ignorar erros no polling
      }
    }, 500);

    return () => clearInterval(interval);
  }, [session, navigate]);

  useEffect(() => {
    // Verificar se há um hash de recuperação de senha na URL
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');

    if (type === 'recovery' && accessToken) {
      setMode('reset-password');
      return;
    }

    // Verificar se há um callback OAuth (Google login)
    if (accessToken && type !== 'recovery') {
      // OAuth callback - aguardar o Supabase processar a sessão
      setLoading(true);
      logger.info('[Auth] Callback OAuth detectado, aguardando processamento...', 'auth', { 
        accessToken: accessToken.substring(0, 20) + '...',
        type 
      });
      
      // Limpar a URL imediatamente para evitar problemas
      window.history.replaceState({}, '', '/auth');
      
      // Forçar verificação da sessão após callback com múltiplas tentativas
      const checkSessionAfterOAuth = async () => {
        const maxAttempts = 5;
        let attempts = 0;
        
        const checkSession = async (): Promise<boolean> => {
          attempts++;
          logger.info(`[Auth] Tentativa ${attempts}/${maxAttempts} de verificar sessão...`, 'auth');
          
          try {
            const { data: { session: newSession }, error } = await supabase.auth.getSession();
            
            if (newSession && !error) {
              logger.info('[Auth] ✅ Sessão encontrada!', 'auth', { 
                userId: newSession.user?.id,
                email: newSession.user?.email 
              });
              return true;
            } else {
              logger.warn(`[Auth] Sessão não encontrada (tentativa ${attempts})`, 'auth', { 
                error: error?.message 
              });
              return false;
            }
          } catch (err) {
            logger.error(`[Auth] Erro ao verificar sessão (tentativa ${attempts})`, 'auth', err);
            return false;
          }
        };
        
        // Primeira tentativa após 1 segundo
        await new Promise(resolve => setTimeout(resolve, 1000));
        if (await checkSession()) {
          logger.info('[Auth] Redirecionando após primeira verificação...', 'auth');
          navigate('/');
          setLoading(false);
          return;
        }
        
        // Tentativas adicionais a cada 1 segundo
        for (let i = 0; i < maxAttempts - 1; i++) {
          await new Promise(resolve => setTimeout(resolve, 1000));
          if (await checkSession()) {
            logger.info(`[Auth] Redirecionando após tentativa ${attempts}...`, 'auth');
            navigate('/');
            setLoading(false);
            return;
          }
        }
        
        // Se chegou aqui, não conseguiu estabelecer sessão
        logger.error('[Auth] ❌ Timeout: sessão não foi estabelecida após todas as tentativas', 'auth');
        setError('Erro ao processar login com Google. Tente novamente.');
        setLoading(false);
      };

      checkSessionAfterOAuth();
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
            logger.error('Failed to log login error', 'auth', logError);
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
      logger.error('Erro ao solicitar recuperação de senha', 'auth', err);
      
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
      logger.error('Erro ao redefinir senha', 'auth', err);
      
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

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      // Detectar se está rodando no Capacitor (Android/iOS)
      const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || false;
      
      // Definir o Deep Link para mobile (deve corresponder ao AndroidManifest)
      // Usando custom scheme que é mais simples e não requer verificação de servidor
      const mobileRedirectUrl = 'com.isfia.app://google-auth';
      
      let redirectUrl: string;
      
      if (isCapacitor) {
        // Para Capacitor, usar o custom scheme deep link
        redirectUrl = mobileRedirectUrl;
        logger.info('[Auth] Usando Browser plugin para OAuth no Capacitor com deep link', 'auth', { redirectUrl });
      } else {
        // No navegador, usar a origem normal
        redirectUrl = `${window.location.origin}/auth`;
        logger.info('[Auth] Usando URL do navegador para OAuth', 'auth', { redirectUrl });
      }

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          // Sempre enviar redirectTo, mesmo no Capacitor (usa deep link)
          redirectTo: redirectUrl,
          // Para Capacitor, não redirecionar automaticamente - vamos usar o Browser plugin
          ...(isCapacitor && {
            skipBrowserRedirect: true, // Não redirecionar automaticamente
          }),
        },
      });

      logger.info('[Auth] OAuth iniciado', 'auth', { 
        hasUrl: !!data?.url, 
        redirectUrl,
        isCapacitor 
      });

      if (error) {
        logger.error('Erro ao iniciar login com Google', 'auth', error);
        throw error;
      }

      // Se estiver no Capacitor e tiver URL, abrir no Browser plugin
      if (isCapacitor && data?.url) {
        logger.info('[Auth] Abrindo URL OAuth no Browser plugin', 'auth', { url: data.url });
        
        // Abrir no Browser plugin
        await Browser.open({ 
          url: data.url,
          windowName: '_self',
        });

        // O Browser plugin vai fechar automaticamente quando o usuário retornar
        // O listener browserFinished vai capturar o callback
      }
    } catch (err: any) {
      logger.error('Erro ao fazer login com Google', 'auth', err);
      
      const appError = handleError(err, 'auth', 'Erro ao fazer login com Google');
      setError(appError.userMessage || t('auth.googleSignInError'));
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
          onGoogleSignIn={handleGoogleSignIn}
        />
      </div>

      <footer className="absolute bottom-4 left-0 right-0 text-center text-white/60 text-sm z-20">
        © 2025 ISF IA. {t('common.allRightsReserved', { defaultValue: 'All rights reserved.' })}
      </footer>
    </div>
  );
};

export default AuthPage;
