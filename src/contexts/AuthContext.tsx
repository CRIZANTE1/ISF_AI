import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import { logUserAccess } from '../utils/adminOperations';
import { logger } from '../utils/logger';

export interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string | null;
  role: 'admin' | 'user';
  plan: 'trial' | 'premium';
  trial_ends_at: string | null;
}

interface AuthContextType {
  session: Session | null;
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signOut: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          logger.error('Erro ao obter sessão', 'auth', error);
          // Não bloqueia a aplicação se houver erro de rede
          if (error.message?.includes('Failed to fetch')) {
            logger.warn('⚠️ Erro de conexão ao verificar sessão. Verifique sua internet e configurações do Supabase.', 'auth');
          }
        }
        setSession(session);
        setUser(session?.user ?? null);
      } catch (err: any) {
        logger.error('Erro inesperado ao obter sessão', 'auth', err);
        // Continua mesmo com erro para não bloquear a aplicação
        setSession(null);
        setUser(null);
      }
      // We will set loading to false after the profile is also fetched.
    };

    getSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Log access events (non-blocking)
        if (event === 'SIGNED_IN' && session) {
          // Use setTimeout to avoid blocking the auth flow
          setTimeout(() => {
            logUserAccess('login', true).catch((error) => {
              logger.error('Failed to log login', 'auth', error);
            });
          }, 0);
        } else if (event === 'SIGNED_OUT') {
          setTimeout(() => {
            logUserAccess('logout', true).catch((error) => {
              logger.error('Failed to log logout', 'auth', error);
            });
          }, 0);
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const fetchProfile = async () => {
      if (user) {
        setLoading(true);
        try {
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();
          
          if (error) {
            // Log error but don't crash the app
            if (error.code !== 'PGRST116') { // PGRST116 means no rows found
              logger.error('Error fetching profile', 'auth', {
                message: error.message,
                details: error.details,
                hint: error.hint,
                code: error.code
              });
            }
            setProfile(null);
          } else {
            setProfile(data as Profile);
          }
        } catch (err: any) {
          // Handle network errors or other unexpected errors
          logger.error('Error fetching profile', 'auth', {
            message: err?.message || 'Unknown error',
            details: err?.toString() || '',
            hint: '',
            code: ''
          });
          setProfile(null);
        } finally {
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const refreshProfile = async () => {
    if (!user) {
      setProfile(null);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (error) {
        if (error.code !== 'PGRST116') {
          logger.error('Error refreshing profile', 'auth', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
        }
        setProfile(null);
      } else {
        setProfile(data as Profile);
      }
    } catch (err: any) {
      logger.error('Error refreshing profile', 'auth', {
        message: err?.message || 'Unknown error',
        details: err?.toString() || '',
      });
      setProfile(null);
    }
  };

  const signOut = async () => {
    // Log before sign out (non-blocking)
    logUserAccess('logout', true).catch((error) => {
      logger.error('Failed to log logout', 'auth', error);
    });
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    loading,
    signOut,
    refreshProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
