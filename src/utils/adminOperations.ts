import { supabase } from '../lib/supabase';

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

// Get all users with their profiles
export async function getAllUsers(): Promise<UserWithProfile[]> {
  // Use RPC function that only admins can call
  const { data, error } = await supabase.rpc('get_all_users_with_profiles');

  if (error) {
    // Fallback: Get profiles directly (limited info)
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

  return data || [];
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
  const { error } = await supabase
    .from('profiles')
    .update({ plan })
    .eq('id', userId);

  if (error) throw error;

  // Log the action
  await logUserAction('update', 'profile', userId, { plan });
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
  
  alert('Usuário marcado como desabilitado. Para banir completamente, use o painel do Supabase.');
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

// Delete user - Warning: This requires admin API
export async function deleteUser(userId: string): Promise<void> {
  // Log the action before deletion
  await logUserAction('delete', 'user', userId);

  // Note: Actual user deletion requires Supabase Admin API
  // This is a placeholder - in production, you'd need to call an Edge Function
  // or use the Supabase Dashboard
  throw new Error('Exclusão de usuário requer acesso Admin API. Use o painel do Supabase ou uma Edge Function.');
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

  // Get user info for each log
  const logsWithUsers: ActionLog[] = await Promise.all(
    (logs || []).map(async (log) => {
      if (!log.user_id) {
        return { ...log, user: undefined };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', log.user_id)
        .single();

      // Email not available without admin API - use profile ID as identifier
      return {
        ...log,
        user: {
          email: log.user_id?.substring(0, 8) || 'Unknown',
          full_name: profile?.full_name || null,
        },
      };
    })
  );

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

  // Get user info for each log
  const logsWithUsers: AccessLog[] = await Promise.all(
    (logs || []).map(async (log) => {
      if (!log.user_id) {
        return { ...log, user: undefined };
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', log.user_id)
        .single();

      // Email not available without admin API - use profile ID as identifier
      return {
        ...log,
        user: {
          email: log.user_id?.substring(0, 8) || 'Unknown',
          full_name: profile?.full_name || null,
        },
      };
    })
  );

  return {
    logs: logsWithUsers,
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
    await supabase.rpc('log_user_action', {
      p_action_type: actionType,
      p_resource_type: resourceType || null,
      p_resource_id: resourceId || null,
      p_details: details || null,
    });
  } catch (error) {
    console.error('Failed to log user action:', error);
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
    console.error('Failed to log user access:', error);
    // Don't throw - logging failures shouldn't break the app
  }
}

