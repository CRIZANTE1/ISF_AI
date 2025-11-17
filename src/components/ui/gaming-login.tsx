import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { logger } from '../../utils/logger';

interface LoginFormProps {
  onSubmit: (email: string, password: string, remember: boolean) => void;
  onForgotPassword?: () => void;
  onSignup?: () => void;
  mode?: 'login' | 'signup' | 'forgot-password' | 'reset-password';
  error?: string | null;
  message?: string | null;
  loading?: boolean;
  onModeChange?: (mode: 'login' | 'signup' | 'forgot-password' | 'reset-password') => void;
  // Para signup
  fullName?: string;
  onFullNameChange?: (value: string) => void;
  // Para reset password
  newPassword?: string;
  onNewPasswordChange?: (value: string) => void;
  confirmPassword?: string;
  onConfirmPasswordChange?: (value: string) => void;
  onResetPassword?: (newPassword: string, confirmPassword: string) => void;
  // Para forgot password
  onForgotPasswordSubmit?: (email: string) => void;
}

interface VideoBackgroundProps {
  videoUrl?: string;
}

interface FormInputProps {
  icon: React.ReactNode;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  required?: boolean;
}

interface ToggleSwitchProps {
  checked: boolean;
  onChange: () => void;
  id: string;
}

// FormInput Component
const FormInput: React.FC<FormInputProps> = ({ icon, type, placeholder, value, onChange, required }) => {
  return (
    <div className="relative">
      <div className="absolute left-3 top-1/2 -translate-y-1/2">
        {icon}
      </div>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="w-full pl-10 pr-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white placeholder-white/60 focus:outline-none focus:border-white/50 transition-colors"
      />
    </div>
  );
};

// ToggleSwitch Component
const ToggleSwitch: React.FC<ToggleSwitchProps> = ({ checked, onChange, id }) => {
  return (
    <div className="relative inline-block w-10 h-5 cursor-pointer">
      <input
        type="checkbox"
        id={id}
        className="sr-only"
        checked={checked}
        onChange={onChange}
      />
      <div className={`absolute inset-0 rounded-full transition-colors duration-200 ease-in-out ${checked ? 'bg-white' : 'bg-white/20'}`}>
        <div className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white transition-transform duration-200 ease-in-out ${checked ? 'transform translate-x-5' : ''}`} />
      </div>
    </div>
  );
};

// VideoBackground Component
const VideoBackground: React.FC<VideoBackgroundProps> = ({ videoUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && videoUrl) {
      videoRef.current.play().catch(error => {
        logger.warn('Video autoplay failed', 'app', error);
      });
    }
  }, [videoUrl]);

  if (!videoUrl) {
    return (
      <div className="absolute inset-0 w-full h-full overflow-hidden bg-black">
        <div className="absolute inset-0 bg-black/50 z-10" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden">
      <div className="absolute inset-0 bg-black/50 z-10" />
      <video
        ref={videoRef}
        className="absolute inset-0 min-w-full min-h-full object-cover w-auto h-auto"
        autoPlay
        loop
        muted
        playsInline
      >
        <source src={videoUrl} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

// Main LoginForm Component
const LoginForm: React.FC<LoginFormProps> = ({ 
  onSubmit, 
  onForgotPassword,
  onSignup,
  mode = 'login',
  error,
  message,
  loading = false,
  onModeChange,
  fullName = '',
  onFullNameChange,
  newPassword = '',
  onNewPasswordChange,
  confirmPassword = '',
  onConfirmPasswordChange,
  onResetPassword,
  onForgotPasswordSubmit,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'login') {
      onSubmit(email, password, remember);
    }
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onForgotPasswordSubmit && forgotEmail) {
      onForgotPasswordSubmit(forgotEmail);
    }
  };

  const handleResetPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onResetPassword && newPassword && confirmPassword) {
      onResetPassword(newPassword, confirmPassword);
    }
  };

  const getTitle = () => {
    switch (mode) {
      case 'signup':
        return 'Criar Conta';
      case 'forgot-password':
        return 'Recuperar Senha';
      case 'reset-password':
        return 'Redefinir Senha';
      default:
        return 'ISF IA';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup':
        return 'Crie sua conta para começar';
      case 'forgot-password':
        return 'Digite seu e-mail para receber o link de recuperação';
      case 'reset-password':
        return 'Digite sua nova senha';
      default:
        return 'Acesse sua conta';
    }
  };

  return (
    <div className="p-8 rounded-2xl backdrop-blur-sm bg-black/50 border border-white/10">
      <div className="mb-8 text-center">
        <h2 className="text-3xl font-bold mb-2 relative group">
          <span className="absolute -inset-1 bg-white/10 blur-xl opacity-75 group-hover:opacity-100 transition-all duration-500 animate-pulse"></span>
          <span className="relative inline-block text-3xl font-bold mb-2 text-white">
            {getTitle()}
          </span>
          <span className="absolute -inset-0.5 bg-white/10 blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300"></span>
        </h2>
        <p className="text-white/80 flex flex-col items-center space-y-1">
          <span className="relative group cursor-default">
            <span className="absolute -inset-1 bg-white/10 blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500"></span>
            <span className="relative inline-block">{getSubtitle()}</span>
          </span>
        </p>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-white/10 border border-white/30 rounded-lg text-white text-sm">
          {error}
        </div>
      )}

      {message && (
        <div className="mb-4 p-3 bg-white/10 border border-white/30 rounded-lg text-white text-sm">
          {message}
        </div>
      )}

      {mode === 'forgot-password' ? (
        <form onSubmit={handleForgotPasswordSubmit} className="space-y-6">
          <FormInput
            icon={<Mail className="text-white/60" size={18} />}
            type="email"
            placeholder="E-mail"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-white/20 hover:shadow-white/40"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('login')}
            className="w-full text-sm text-white/80 hover:text-white transition-colors"
          >
            Voltar para o login
          </button>
        </form>
      ) : mode === 'reset-password' ? (
        <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
          <FormInput
            icon={<Lock className="text-white/60" size={18} />}
            type="password"
            placeholder="Nova senha"
            value={newPassword || ''}
            onChange={(e) => onNewPasswordChange?.(e.target.value)}
            required
          />
          <FormInput
            icon={<Lock className="text-white/60" size={18} />}
            type="password"
            placeholder="Confirmar nova senha"
            value={confirmPassword || ''}
            onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-white/20 hover:shadow-white/40"
          >
            {loading ? 'Redefinindo...' : 'Redefinir senha'}
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('login')}
            className="w-full text-sm text-white/80 hover:text-white transition-colors"
          >
            Voltar para o login
          </button>
        </form>
      ) : mode === 'signup' ? (
        <form onSubmit={(e) => {
          e.preventDefault();
          onSubmit(email, password, remember);
        }} className="space-y-6">
          {onFullNameChange && (
            <FormInput
              icon={<Mail className="text-white/60" size={18} />}
              type="text"
              placeholder="Nome completo"
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              required
            />
          )}
          <FormInput
            icon={<Mail className="text-white/60" size={18} />}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <FormInput
              icon={<Lock className="text-white/60" size={18} />}
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-white/20 hover:shadow-white/40"
          >
            {loading ? 'Criando conta...' : 'Criar conta'}
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('login')}
            className="w-full text-sm text-white/80 hover:text-white transition-colors"
          >
            Já tem uma conta? Fazer login
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            icon={<Mail className="text-white/60" size={18} />}
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <FormInput
              icon={<Lock className="text-white/60" size={18} />}
              type={showPassword ? "text" : "password"}
              placeholder="Senha"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div onClick={() => setRemember(!remember)} className="cursor-pointer">
                <ToggleSwitch
                  checked={remember}
                  onChange={() => setRemember(!remember)}
                  id="remember-me"
                />
              </div>
              <label
                htmlFor="remember-me"
                className="text-sm text-white/80 cursor-pointer hover:text-white transition-colors"
                onClick={() => setRemember(!remember)}
              >
                Lembrar-me
              </label>
            </div>
            <button
              type="button"
              onClick={() => onModeChange?.('forgot-password')}
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              Esqueci minha senha
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-white/20 hover:shadow-white/40`}
          >
            {loading ? 'Entrando...' : 'Login'}
          </button>
        </form>
      )}

      {mode === 'login' && (
        <p className="mt-8 text-center text-sm text-white/60">
          Não tem uma conta?{' '}
          <button
            type="button"
            onClick={() => onModeChange?.('signup')}
            className="font-medium text-white hover:text-white/80 transition-colors"
          >
            Criar Conta
          </button>
        </p>
      )}
    </div>
  );
};

// Export as default components
const LoginPage = {
  LoginForm,
  VideoBackground
};

export default LoginPage;

