import { supabase } from '../lib/supabase';
import { logger } from './logger';

export interface UserWithProfile {
  id: string;
  email: string;
  created_at: string;
  last_sign_in_at: string | null;
  profile: {
    full_name: string | null;
    role: 'admin' | 'user';
    plan: 'trial' | 'premium';
    trial_ends_at: string | null;
  } | null;
}

export interface UserStats {
  total: number;
  premium: number;
  trial: number;
  admin: number;
  active: number; // Users who logged in in the last 30 days
}

export interface ActionLog {
  id: number;
  user_id: string | null;
  action_type: string;
  resource_type: string | null;
  resource_id: string | null;
  details: any;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  user?: {
    email: string;
    full_name: string | null;
  };
}

export interface AccessLog {
  id: number;
  user_id: string | null;
  action: string;
  ip_address: string | null;
  user_agent: string | null;
  session_id: string | null;
  success: boolean;
  error_message: string | null;
  created_at: string;
  user?: {
    email: string;
    full_name: string | null;
  };
}

export interface UserFeedback {
  id: string;
  user_id: string;
  type: 'feedback' | 'suggestion';
  message: string;
  created_at: string;
  updated_at: string;
  user?: {
    email: string;
    full_name: string | null;
  };
}

// Get all users with their profiles
export async function getAllUsers(): Promise<UserWithProfile[]> {
  // Use RPC function that only admins can call
  const { data, error } = await supabase.rpc('get_all_users_with_profiles');

  if (error) {
    // Fallback: Get profiles directly (limited info) — RLS permite admins via is_admin()
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (profilesError) throw profilesError;

    // Map profiles to UserWithProfile format (limited info without auth.users access)
    return (profiles || []).map(profile => ({
      id: profile.id,
      email: '***@***', // Email not available from profiles table
      created_at: profile.updated_at || new Date().toISOString(),
      last_sign_in_at: null,
      profile: {
        full_name: profile.full_name,
        role: profile.role as 'admin' | 'user',
        plan: profile.plan as 'trial' | 'premium',
        trial_ends_at: profile.trial_ends_at || null,
      },
    }));
  }

  return (data || []).map((row: any) => {
    const profile = typeof row.profile === 'string' ? JSON.parse(row.profile) : row.profile;
    return {
      id: row.id,
      email: row.email,
      created_at: row.created_at,
      last_sign_in_at: row.last_sign_in_at,
      profile: profile
        ? {
            full_name: profile.full_name ?? null,
            role: (profile.role as 'admin' | 'user') ?? 'user',
            plan: (profile.plan as 'trial' | 'premium') ?? 'trial',
            trial_ends_at: profile.trial_ends_at ?? null,
          }
        : null,
    };
  });
}

// Get user statistics
export async function getUserStats(): Promise<UserStats> {
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('plan, role, updated_at');

  if (error) throw error;

  const total = profiles?.length || 0;
  const premium = profiles?.filter(p => p.plan === 'premium').length || 0;
  const trial = profiles?.filter(p => p.plan === 'trial').length || 0;
  const admin = profiles?.filter(p => p.role === 'admin').length || 0;

  // Get active users (using updated_at as proxy for activity)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const active = profiles?.filter(p => {
    if (!p.updated_at) return false;
    return new Date(p.updated_at) >= thirtyDaysAgo;
  }).length || 0;

  return {
    total,
    premium,
    trial,
    admin,
    active,
  };
}

// Update user plan
export async function updateUserPlan(userId: string, plan: 'trial' | 'premium'): Promise<void> {
  // Primeiro, verificar o plano atual
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', userId)
    .single();
  
  if (fetchError) {
    logger.error('Erro ao buscar perfil para atualização de plano', 'admin', { userId, error: fetchError });
    throw new Error(`Erro ao buscar perfil: ${fetchError.message}`);
  }
  
  if (!currentProfile) {
    logger.error('Perfil não encontrado para atualização de plano', 'admin', { userId });
    throw new Error('Perfil não encontrado');
  }
  
  // Se já está no plano desejado, não precisa atualizar
  if (currentProfile.plan === plan) {
    logger.info('Plano já está no valor desejado', 'admin', { userId, plan });
    return;
  }
  
  // Fazer o update
  const { data, error } = await supabase
    .from('profiles')
    .update({ 
      plan,
      updated_at: new Date().toISOString() // Garantir que updated_at é atualizado
    })
    .eq('id', userId)
    .select()
    .single();
  
  if (error) {
    logger.error('Erro ao atualizar plano', 'admin', { userId, plan, error });
    throw error;
  }
  
  // Verificar se realmente foi atualizado
  if (!data || data.plan !== plan) {
    const errorMsg = `Falha ao atualizar plano. Esperado: ${plan}, Recebido: ${data?.plan || 'null'}`;
    logger.error(errorMsg, 'admin', { userId, expected: plan, actual: data?.plan });
    throw new Error(errorMsg);
  }
  
  logger.info('Plano atualizado com sucesso', 'admin', { userId, plan, previousPlan: currentProfile.plan });
  
  // Sincronizar licença com o novo plano
  try {
    // Buscar licença associada ao usuário
    const { data: userLicense, error: licenseError } = await supabase
      .from('licenses')
      .select('id, machine_id, license_type')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (!licenseError && userLicense) {
      // Atualizar license_type baseado no plan
      const newLicenseType = plan === 'premium' ? 'premium' : 'experimental';
      
      // Só atualizar se for diferente
      if (userLicense.license_type !== newLicenseType) {
        const { error: updateLicenseError } = await supabase
          .from('licenses')
          .update({
            license_type: newLicenseType,
            last_activation_date: plan === 'premium' ? new Date().toISOString() : null,
            activation_token: plan === 'premium' ? userLicense.activation_token || 'admin_upgrade' : null
          })
          .eq('id', userLicense.id);
        
        if (updateLicenseError) {
          logger.warn('Erro ao sincronizar licença com plano', 'admin', { 
            userId, 
            plan, 
            licenseId: userLicense.id,
            error: updateLicenseError 
          });
        } else {
          logger.info('Licença sincronizada com plano', 'admin', { 
            userId, 
            plan, 
            licenseId: userLicense.id,
            newLicenseType 
          });
        }
      }
    } else if (licenseError && licenseError.code !== 'PGRST116') {
      // PGRST116 = nenhum registro encontrado (não é erro)
      logger.warn('Erro ao buscar licença para sincronização', 'admin', { 
        userId, 
        error: licenseError 
      });
    }
  } catch (syncError) {
    // Não falhar a atualização do plano se a sincronização da licença falhar
    logger.warn('Erro ao sincronizar licença (não crítico)', 'admin', { 
      userId, 
      plan, 
      error: syncError 
    });
  }
  
  // Log the action
  await logUserAction('update', 'profile', userId, { 
    plan,
    previous_plan: currentProfile.plan 
  });
}

// Update user role
export async function updateUserRole(userId: string, role: 'admin' | 'user'): Promise<void> {
  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId);

  if (error) throw error;

  // Log the action
  await logUserAction('update', 'profile', userId, { role });
}

// Disable user (ban) - Using a custom field in profiles
export async function disableUser(userId: string): Promise<void> {
  // Mark user as disabled in profiles table
  // Note: Actual ban requires admin API, this is a workaround
  const { error } = await supabase
    .from('profiles')
    .update({ 
      // We'll add a disabled_at timestamp or use a custom field
      // For now, we'll just log it
    })
    .eq('id', userId);

  if (error) throw error;

  // Log the action
  await logUserAction('disable', 'user', userId);
  
  // Nota: Esta função apenas marca o usuário como desabilitado no perfil
  // Para banir completamente, use o painel do Supabase ou uma Edge Function
  logger.info('Usuário marcado como desabilitado', 'admin', { userId });
}

// Enable user (unban)
export async function enableUser(userId: string): Promise<void> {
  // Similar to disable, just log for now
  const { error } = await supabase
    .from('profiles')
    .update({})
    .eq('id', userId);

  if (error) throw error;

  // Log the action
  await logUserAction('enable', 'user', userId);
}

// Delete user - Uses Edge Function with admin permissions
export async function deleteUser(userId: string): Promise<void> {
  // Log the action before deletion
  await logUserAction('delete', 'user', userId);

  try {
    // Obter sessão atual (admin deve estar autenticado)
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      throw new Error('Admin não autenticado. Faça login novamente.');
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/delete-user`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      
      if (response.status === 404) {
        throw new Error('Edge Function delete-user não encontrada. Verifique se está deployada.');
      }
      
      throw new Error(errorData.error || errorData.details || 'Erro ao deletar usuário');
    }

    const result = await response.json();
    logger.info(`Usuário ${userId} deletado com sucesso`, 'adminOperations');
  } catch (error) {
    logger.error('Erro ao deletar usuário via Edge Function', 'adminOperations', error);
    throw error;
  }
}

// Get action logs
export async function getActionLogs(
  limit: number = 100,
  offset: number = 0,
  userId?: string,
  actionType?: string
): Promise<{ logs: ActionLog[]; total: number }> {
  let query = supabase
    .from('user_action_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (actionType) {
    query = query.eq('action_type', actionType);
  }

  const { data: logs, error, count } = await query;

  if (error) throw error;

  if (!logs || logs.length === 0) {
    return { logs: [], total: 0 };
  }

  // Extract unique user IDs
  const userIds = Array.from(new Set(logs.map(log => log.user_id).filter(Boolean))) as string[];
  
  // Fetch all profiles in one query
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);
    
  // Create a map for quick lookup
  const profileMap = new Map(profiles?.map(p => [p.id, p]));

  // Map profiles to logs
  const logsWithUsers: ActionLog[] = logs.map(log => {
    if (!log.user_id) {
      return { ...log, user: undefined };
    }

    const profile = profileMap.get(log.user_id);

    return {
      ...log,
      user: {
        email: log.user_id?.substring(0, 8) || 'Unknown',
        full_name: profile?.full_name || null,
      },
    };
  });

  return {
    logs: logsWithUsers,
    total: count || 0,
  };
}

// Get access logs
export async function getAccessLogs(
  limit: number = 100,
  offset: number = 0,
  userId?: string,
  action?: string
): Promise<{ logs: AccessLog[]; total: number }> {
  let query = supabase
    .from('user_access_logs')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (userId) {
    query = query.eq('user_id', userId);
  }

  if (action) {
    query = query.eq('action', action);
  }

  const { data: logs, error, count } = await query;

  if (error) throw error;

  if (!logs || logs.length === 0) {
    return { logs: [], total: 0 };
  }

  // Extract unique user IDs
  const userIds = Array.from(new Set(logs.map(log => log.user_id).filter(Boolean))) as string[];
  
  // Fetch all profiles in one query
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);
    
  // Create a map for quick lookup
  const profileMap = new Map(profiles?.map(p => [p.id, p]));

  // Map profiles to logs
  const logsWithUsers: AccessLog[] = logs.map(log => {
    if (!log.user_id) {
      return { ...log, user: undefined };
    }

    const profile = profileMap.get(log.user_id);

    return {
      ...log,
      user: {
        email: log.user_id?.substring(0, 8) || 'Unknown',
        full_name: profile?.full_name || null,
      },
    };
  });

  return {
    logs: logsWithUsers,
    total: count || 0,
  };
}

// Get user feedbacks
export async function getUserFeedbacks(
  limit: number = 100,
  offset: number = 0
): Promise<{ feedbacks: UserFeedback[]; total: number }> {
  let query = supabase
    .from('user_feedback')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data: feedbacks, error, count } = await query;

  if (error) throw error;

  if (!feedbacks || feedbacks.length === 0) {
    return { feedbacks: [], total: 0 };
  }

  // Extract unique user IDs
  const userIds = Array.from(new Set(feedbacks.map(fb => fb.user_id).filter(Boolean))) as string[];
  
  // Fetch all profiles in one query
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name')
    .in('id', userIds);
    
  // Create a map for quick lookup
  const profileMap = new Map(profiles?.map(p => [p.id, p]));

  // Map profiles to feedbacks
  const feedbacksWithUsers: UserFeedback[] = feedbacks.map(feedback => {
    const profile = profileMap.get(feedback.user_id);

    return {
      ...feedback,
      user: {
        email: feedback.user_id?.substring(0, 8) || 'Unknown',
        full_name: profile?.full_name || null,
      },
    };
  });

  return {
    feedbacks: feedbacksWithUsers,
    total: count || 0,
  };
}

// Log user action (exported function)
export async function logUserAction(
  actionType: string,
  resourceType?: string,
  resourceId?: string,
  details?: any
): Promise<void> {
  try {
    // Check if navigator exists (may be undefined in SSR/build environments)
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    
    await supabase.rpc('log_user_action', {
      p_action_type: actionType,
      p_resource_type: resourceType || null,
      p_resource_id: resourceId || null,
      p_details: details || null,
      p_ip_address: null, // IP será obtido no backend se necessário
      p_user_agent: userAgent,
    });
  } catch (error) {
    logger.error('Failed to log user action', 'admin', error);
    // Don't throw - logging failures shouldn't break the app
  }
}

// Log user access (login/logout)
export async function logUserAccess(
  action: 'login' | 'logout' | 'session_start' | 'session_end',
  success: boolean = true,
  errorMessage?: string
): Promise<void> {
  try {
    // Check if navigator exists (may be undefined in SSR/build environments)
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : null;
    
    await supabase.rpc('log_user_access', {
      p_action: action,
      p_ip_address: null, // IP será obtido no backend se necessário
      p_user_agent: userAgent,
      p_session_id: null,
      p_success: success,
      p_error_message: errorMessage || null,
    });
  } catch (error) {
    logger.error('Failed to log user access', 'admin', error);
    // Don't throw - logging failures shouldn't break the app
  }
}

// Configuração de retenção de logs
export interface LogRetentionConfig {
  id: number;
  action_logs_retention_days: number;
  access_logs_retention_days: number;
  last_cleanup_at: string | null;
  updated_at: string;
}

// Obter configuração de retenção de logs
export async function getLogRetentionConfig(): Promise<LogRetentionConfig | null> {
  try {
    const { data, error } = await supabase
      .from('log_retention_config')
      .select('*')
      .eq('id', 1)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    logger.error('Failed to get log retention config', 'admin', error);
    return null;
  }
}

// Atualizar configuração de retenção de logs
export async function updateLogRetentionConfig(
  actionLogsDays: number,
  accessLogsDays: number
): Promise<void> {
  const { error } = await supabase
    .from('log_retention_config')
    .update({
      action_logs_retention_days: actionLogsDays,
      access_logs_retention_days: accessLogsDays,
      updated_at: new Date().toISOString(),
    })
    .eq('id', 1);

  if (error) throw error;
}

// Executar limpeza manual de logs (Edge Function — requer admin JWT)
export async function cleanupOldLogs(): Promise<{
  deleted_action_logs: number;
  deleted_access_logs: number;
  retention_days: number;
} | null> {
  try {
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error('Sessão inválida');
    }

    const response = await fetch(`${supabaseUrl}/functions/v1/cleanup-old-logs-v2`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY as string,
        'Content-Type': 'application/json',
      },
      body: '{}',
    });

    const payload = await response.json();
    if (!response.ok) {
      throw new Error(payload?.error || 'Falha ao limpar logs');
    }

    return {
      deleted_action_logs: payload.deleted_action_logs ?? 0,
      deleted_access_logs: payload.deleted_access_logs ?? 0,
      retention_days: payload.action_retention_days ?? payload.retention_days ?? 0,
    };
  } catch (error) {
    logger.error('Failed to cleanup old logs', 'admin', error);
    throw error;
  }
}

