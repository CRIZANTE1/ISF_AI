import { supabase } from '../lib/supabase';

export interface SystemSetting {
  id: string;
  setting_key: string;
  setting_value: any;
  description: string | null;
  updated_at: string;
  updated_by: string | null;
}

export interface SecurityPolicy {
  id: string;
  policy_name: string;
  policy_type: string;
  enabled: boolean;
  config: any;
  description: string | null;
  created_at: string;
  updated_at: string;
  updated_by: string | null;
}

export interface BlockedIP {
  id: string;
  ip_address: string;
  reason: string;
  blocked_at: string;
  blocked_until: string | null;
  blocked_by: string | null;
  policy_id: string | null;
  metadata: any;
  is_active: boolean;
}

export interface SecurityAlert {
  id: string;
  alert_type: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  user_id: string | null;
  ip_address: string | null;
  resource_type: string | null;
  resource_id: string | null;
  metadata: any;
  resolved: boolean;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
}

// Get all system settings
export async function getAllSystemSettings(): Promise<Record<string, any>> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .order('setting_key');

  if (error) throw error;

  const settings: Record<string, any> = {};
  (data || []).forEach(setting => {
    settings[setting.setting_key] = setting.setting_value.value;
  });

  return settings;
}

// Get a single system setting
export async function getSystemSetting(key: string): Promise<any> {
  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('setting_key', key)
    .single();

  if (error) throw error;
  return data?.setting_value?.value;
}

// Update a system setting
export async function updateSystemSetting(key: string, value: any): Promise<void> {
  const { error } = await supabase
    .from('system_settings')
    .upsert({
      setting_key: key,
      setting_value: { value },
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'setting_key',
    });

  if (error) throw error;
}

// Get all security policies
export async function getAllSecurityPolicies(): Promise<SecurityPolicy[]> {
  const { data, error } = await supabase
    .from('security_policies')
    .select('*')
    .order('policy_name');

  if (error) throw error;
  return data || [];
}

// Update a security policy
export async function updateSecurityPolicy(
  id: string,
  updates: Partial<SecurityPolicy>
): Promise<void> {
  const { error } = await supabase
    .from('security_policies')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

// Get all blocked IPs
export async function getBlockedIPs(): Promise<BlockedIP[]> {
  const { data, error } = await supabase
    .from('blocked_ips')
    .select('*')
    .order('blocked_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

// Block an IP address
export async function blockIP(
  ip: string,
  reason: string,
  blockedUntil?: string,
  policyId?: string,
  metadata?: any
): Promise<string> {
  const { data, error } = await supabase.rpc('block_ip', {
    p_ip: ip,
    p_reason: reason,
    p_blocked_until: blockedUntil || null,
    p_policy_id: policyId || null,
    p_metadata: metadata || null,
  });

  if (error) throw error;
  return data;
}

// Unblock an IP address
export async function unblockIP(id: string): Promise<void> {
  const { error } = await supabase
    .from('blocked_ips')
    .update({ is_active: false })
    .eq('id', id);

  if (error) throw error;
}

// Get security alerts
export async function getSecurityAlerts(
  limit: number = 100,
  offset: number = 0,
  resolved?: boolean,
  severity?: string
): Promise<{ alerts: SecurityAlert[]; total: number }> {
  let query = supabase
    .from('security_alerts')
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (resolved !== undefined) {
    query = query.eq('resolved', resolved);
  }

  if (severity) {
    query = query.eq('severity', severity);
  }

  const { data, error, count } = await query;

  if (error) throw error;
  return { alerts: data || [], total: count || 0 };
}

// Resolve a security alert
export async function resolveSecurityAlert(id: string): Promise<void> {
  const { error } = await supabase
    .from('security_alerts')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) throw error;
}

// Create a security alert
export async function createSecurityAlert(
  alertType: string,
  severity: 'critical' | 'high' | 'medium' | 'low',
  title: string,
  description: string,
  userId?: string,
  ipAddress?: string,
  resourceType?: string,
  resourceId?: string,
  metadata?: any
): Promise<string> {
  const { data, error } = await supabase.rpc('create_security_alert', {
    p_alert_type: alertType,
    p_severity: severity,
    p_title: title,
    p_description: description,
    p_user_id: userId || null,
    p_ip_address: ipAddress || null,
    p_resource_type: resourceType || null,
    p_resource_id: resourceId || null,
    p_metadata: metadata || null,
  });

  if (error) throw error;
  return data;
}

