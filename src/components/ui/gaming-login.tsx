import React, { useState, useRef, useEffect } from 'react';
import { Eye, EyeOff, Mail, Lock } from 'lucide-react';
import { logger } from '../../utils/logger';
import { ButtonSkeleton } from '../skeletons';
import { useTranslation } from '../../hooks/useTranslation';

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
  // Para Google Sign In
  onGoogleSignIn?: () => void;
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
  onGoogleSignIn,
}) => {
  const { t } = useTranslation();
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
        return t('auth.createAccount');
      case 'forgot-password':
        return t('auth.recoverPassword');
      case 'reset-password':
        return t('auth.resetPasswordTitle');
      default:
        return 'ISF IA';
    }
  };

  const getSubtitle = () => {
    switch (mode) {
      case 'signup':
        return t('auth.createAccountSubtitle');
      case 'forgot-password':
        return t('auth.recoverPasswordSubtitle');
      case 'reset-password':
        return t('auth.resetPasswordSubtitle');
      default:
        return t('auth.accessAccount');
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
            placeholder={t('auth.email')}
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-white/20 hover:shadow-white/40"
          >
            {loading ? <ButtonSkeleton width="w-32" className="mx-auto" /> : t('auth.sendRecoveryLink')}
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('login')}
            className="w-full text-sm text-white/80 hover:text-white transition-colors"
          >
            {t('auth.backToLogin')}
          </button>
        </form>
      ) : mode === 'reset-password' ? (
        <form onSubmit={handleResetPasswordSubmit} className="space-y-6">
          <FormInput
            icon={<Lock className="text-white/60" size={18} />}
            type="password"
            placeholder={t('auth.newPassword')}
            value={newPassword || ''}
            onChange={(e) => onNewPasswordChange?.(e.target.value)}
            required
          />
          <FormInput
            icon={<Lock className="text-white/60" size={18} />}
            type="password"
            placeholder={t('auth.confirmPassword')}
            value={confirmPassword || ''}
            onChange={(e) => onConfirmPasswordChange?.(e.target.value)}
            required
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-white/20 hover:shadow-white/40"
          >
            {loading ? <ButtonSkeleton width="w-32" className="mx-auto" /> : t('auth.resetPasswordButton')}
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('login')}
            className="w-full text-sm text-white/80 hover:text-white transition-colors"
          >
            {t('auth.backToLogin')}
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
              placeholder={t('auth.fullName')}
              value={fullName}
              onChange={(e) => onFullNameChange(e.target.value)}
              required
            />
          )}
          <FormInput
            icon={<Mail className="text-white/60" size={18} />}
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <div className="relative">
            <FormInput
              icon={<Lock className="text-white/60" size={18} />}
              type={showPassword ? "text" : "password"}
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-white/20 hover:shadow-white/40"
          >
            {loading ? <ButtonSkeleton width="w-32" className="mx-auto" /> : t('auth.createAccountButton')}
          </button>
          <button
            type="button"
            onClick={() => onModeChange?.('login')}
            className="w-full text-sm text-white/80 hover:text-white transition-colors"
          >
            {t('auth.alreadyHaveAccount')}
          </button>
        </form>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <FormInput
            icon={<Mail className="text-white/60" size={18} />}
            type="email"
            placeholder={t('auth.email')}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <div className="relative">
            <FormInput
              icon={<Lock className="text-white/60" size={18} />}
              type={showPassword ? "text" : "password"}
              placeholder={t('auth.password')}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/60 hover:text-white focus:outline-none transition-colors"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
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
                {t('auth.rememberMe')}
              </label>
            </div>
            <button
              type="button"
              onClick={() => onModeChange?.('forgot-password')}
              className="text-sm text-white/80 hover:text-white transition-colors"
            >
              {t('auth.forgotPasswordButton')}
            </button>
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg bg-white hover:bg-white/90 text-black font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none shadow-lg shadow-white/20 hover:shadow-white/40`}
          >
            {loading ? <ButtonSkeleton width="w-24" className="mx-auto" /> : t('auth.login')}
          </button>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-black/50 text-white/60">{t('auth.orContinueWith')}</span>
            </div>
          </div>

          {onGoogleSignIn && (
            <button
              type="button"
              onClick={onGoogleSignIn}
              disabled={loading}
              className="w-full py-3 rounded-lg bg-white/10 hover:bg-white/20 border border-white/20 text-white font-medium transition-all duration-200 ease-in-out transform hover:-translate-y-1 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 disabled:opacity-70 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {loading ? <ButtonSkeleton width="w-36" className="mx-auto" /> : t('auth.signInWithGoogle')}
            </button>
          )}
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

