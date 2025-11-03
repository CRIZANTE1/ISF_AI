import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { logUserAccess } from '../utils/adminOperations';

type AuthMode = 'login' | 'signup';

const AuthPage = () => {
  const [mode, setMode] = useState<AuthMode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const navigate = useNavigate();
  const { session } = useAuth();

  useEffect(() => {
    if (session) {
      navigate('/');
    }
  }, [session, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (mode === 'signup') {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'admin', // Default role for new signups
            },
          },
        });
        if (error) throw error;
        setMessage('Cadastro realizado! Verifique seu e-mail para confirmar a conta e depois faça o login.');
        setMode('login'); // Switch to login view after successful signup
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
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
      setError(err.error_description || err.message);
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setMode(mode === 'login' ? 'signup' : 'login');
    setError(null);
    setMessage(null);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--bg-current)] p-4 transition-colors duration-300">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[var(--text-primary-current)]">ISF IA</h1>
            <p className="text-[var(--text-secondary-current)] mt-1">
                {mode === 'login' ? 'Acesse sua conta' : 'Crie uma nova conta'}
            </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-4">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Nome Completo"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              className="w-full p-3 apple-card border rounded-lg focus:ring-2 focus:ring-rally-blue/30 focus:outline-none text-[var(--text-primary-current)]"
              style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}
            />
          )}
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-3 apple-card border rounded-lg focus:ring-2 focus:ring-rally-blue/30 focus:outline-none text-[var(--text-primary-current)]"
            style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}
          />
          <input
            type="password"
            placeholder="Senha"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-3 apple-card border rounded-lg focus:ring-2 focus:ring-rally-blue/30 focus:outline-none text-[var(--text-primary-current)]"
            style={{ backgroundColor: 'var(--surface-current)', borderColor: 'var(--border-current)' }}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 text-white font-bold rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ backgroundColor: loading ? '#0066CC' : '#157EFB' }}
          >
            {loading ? 'Processando...' : (mode === 'login' ? 'Entrar' : 'Cadastrar')}
          </button>
        </form>

        {error && <p className="mt-4 text-center" style={{ color: '#FC3D39' }}>{error}</p>}
        {message && <p className="mt-4 text-center" style={{ color: '#53D769' }}>{message}</p>}

        <div className="mt-6 text-center">
          <button onClick={toggleMode} className="text-sm hover:underline text-white">
            {mode === 'login' ? 'Não tem uma conta? Cadastre-se' : 'Já tem uma conta? Faça o login'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
