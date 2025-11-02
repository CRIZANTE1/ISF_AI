/*
# [Create System Settings and Security Policies Tables]
This migration creates tables for system settings, security policies, and blocked IPs.

## Metadata:
- Schema-Category: "Administrative"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `system_settings` - System-wide configuration
- Table: `security_policies` - Configurable security policies
- Table: `blocked_ips` - IP addresses blocked by security policies
- Table: `security_alerts` - Security alerts and notifications
*/

-- Create system_settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  description TEXT,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for system_settings
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(setting_key);

-- Insert default system settings
INSERT INTO public.system_settings (setting_key, setting_value, description) VALUES
  ('maintenance_mode', '{"value": false}'::jsonb, 'Modo de manutenção do sistema'),
  ('max_equipment_per_user', '{"value": 100}'::jsonb, 'Máximo de equipamentos por usuário'),
  ('max_inspections_per_day', '{"value": 50}'::jsonb, 'Máximo de inspeções por dia'),
  ('trial_duration_days', '{"value": 14}'::jsonb, 'Duração do trial em dias'),
  ('premium_price', '{"value": 24.90}'::jsonb, 'Preço do plano premium em R$'),
  ('email_notifications_enabled', '{"value": true}'::jsonb, 'Notificações por email habilitadas'),
  ('backup_enabled', '{"value": true}'::jsonb, 'Backup automático habilitado'),
  ('backup_frequency_days', '{"value": 7}'::jsonb, 'Frequência de backup em dias'),
  ('session_timeout_minutes', '{"value": 60}'::jsonb, 'Timeout de sessão em minutos'),
  ('require_email_verification', '{"value": true}'::jsonb, 'Requer verificação de email'),
  ('allow_new_registrations', '{"value": true}'::jsonb, 'Permitir novos cadastros')
ON CONFLICT (setting_key) DO NOTHING;

-- Create security_policies table
CREATE TABLE IF NOT EXISTS public.security_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_name TEXT NOT NULL UNIQUE,
  policy_type TEXT NOT NULL, -- 'ip_block', 'rate_limit', 'password_policy', etc.
  enabled BOOLEAN DEFAULT true,
  config JSONB NOT NULL, -- Policy-specific configuration
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for security_policies
CREATE INDEX IF NOT EXISTS idx_security_policies_type ON public.security_policies(policy_type);
CREATE INDEX IF NOT EXISTS idx_security_policies_enabled ON public.security_policies(enabled);

-- Insert default security policies
INSERT INTO public.security_policies (policy_name, policy_type, enabled, config, description) VALUES
  ('ip_block_after_failed_logins', 'ip_block', true, '{"max_failed_attempts": 5, "block_duration_hours": 24}'::jsonb, 'Bloquear IP após múltiplas tentativas de login falhadas'),
  ('rate_limit_login_attempts', 'rate_limit', true, '{"max_attempts": 10, "time_window_minutes": 15}'::jsonb, 'Limitar tentativas de login por período'),
  ('password_policy', 'password_policy', true, '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_special": true}'::jsonb, 'Política de senha'),
  ('session_security', 'session_security', true, '{"max_concurrent_sessions": 3, "inactive_timeout_minutes": 30}'::jsonb, 'Política de segurança de sessão'),
  ('email_verification_required', 'email_verification', true, '{"required": true, "grace_period_hours": 24}'::jsonb, 'Verificação de email obrigatória')
ON CONFLICT (policy_name) DO NOTHING;

-- Create blocked_ips table
CREATE TABLE IF NOT EXISTS public.blocked_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip_address INET NOT NULL UNIQUE,
  reason TEXT NOT NULL,
  blocked_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  blocked_until TIMESTAMPTZ,
  blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  policy_id UUID REFERENCES public.security_policies(id) ON DELETE SET NULL,
  metadata JSONB, -- Additional information about the block
  is_active BOOLEAN DEFAULT true
);

-- Create indexes for blocked_ips
CREATE INDEX IF NOT EXISTS idx_blocked_ips_ip ON public.blocked_ips(ip_address);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_active ON public.blocked_ips(is_active);
CREATE INDEX IF NOT EXISTS idx_blocked_ips_until ON public.blocked_ips(blocked_until);

-- Create security_alerts table
CREATE TABLE IF NOT EXISTS public.security_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  severity TEXT NOT NULL, -- 'critical', 'high', 'medium', 'low'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_address INET,
  resource_type TEXT,
  resource_id TEXT,
  metadata JSONB,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for security_alerts
CREATE INDEX IF NOT EXISTS idx_security_alerts_type ON public.security_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_security_alerts_severity ON public.security_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_security_alerts_resolved ON public.security_alerts(resolved);
CREATE INDEX IF NOT EXISTS idx_security_alerts_created ON public.security_alerts(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.security_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for system_settings (only admins)
CREATE POLICY "Admins can view system settings"
  ON public.system_settings FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update system settings"
  ON public.system_settings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for security_policies (only admins)
CREATE POLICY "Admins can manage security policies"
  ON public.security_policies FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for blocked_ips (only admins)
CREATE POLICY "Admins can manage blocked IPs"
  ON public.blocked_ips FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS Policies for security_alerts (only admins)
CREATE POLICY "Admins can view all security alerts"
  ON public.security_alerts FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert security alerts"
  ON public.security_alerts FOR INSERT
  WITH CHECK (true);

-- Function to check if IP is blocked
CREATE OR REPLACE FUNCTION public.is_ip_blocked(p_ip INET)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.blocked_ips
    WHERE ip_address = p_ip
      AND is_active = true
      AND (blocked_until IS NULL OR blocked_until > NOW())
  );
END;
$$;

-- Function to block IP address
CREATE OR REPLACE FUNCTION public.block_ip(
  p_ip INET,
  p_reason TEXT,
  p_blocked_until TIMESTAMPTZ DEFAULT NULL,
  p_policy_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_block_id UUID;
BEGIN
  INSERT INTO public.blocked_ips (
    ip_address,
    reason,
    blocked_until,
    policy_id,
    metadata,
    blocked_by
  )
  VALUES (
    p_ip,
    p_reason,
    p_blocked_until,
    p_policy_id,
    p_metadata,
    auth.uid()
  )
  ON CONFLICT (ip_address) DO UPDATE SET
    reason = EXCLUDED.reason,
    blocked_until = EXCLUDED.blocked_until,
    policy_id = EXCLUDED.policy_id,
    metadata = EXCLUDED.metadata,
    is_active = true,
    blocked_at = NOW()
  RETURNING id INTO v_block_id;

  RETURN v_block_id;
END;
$$;

-- Function to create security alert
CREATE OR REPLACE FUNCTION public.create_security_alert(
  p_alert_type TEXT,
  p_severity TEXT,
  p_title TEXT,
  p_description TEXT,
  p_user_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_alert_id UUID;
BEGIN
  INSERT INTO public.security_alerts (
    alert_type,
    severity,
    title,
    description,
    user_id,
    ip_address,
    resource_type,
    resource_id,
    metadata
  )
  VALUES (
    p_alert_type,
    p_severity,
    p_title,
    p_description,
    p_user_id,
    p_ip_address,
    p_resource_type,
    p_resource_id,
    p_metadata
  )
  RETURNING id INTO v_alert_id;

  RETURN v_alert_id;
END;
$$;

-- Trigger to automatically check and block IPs after failed logins
CREATE OR REPLACE FUNCTION public.check_failed_logins_and_block()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_policy_config JSONB;
  v_max_attempts INTEGER;
  v_block_duration_hours INTEGER;
  v_failed_count INTEGER;
  v_blocked_until TIMESTAMPTZ;
BEGIN
  -- Only process failed login attempts
  IF NEW.action != 'login' OR NEW.success = true THEN
    RETURN NEW;
  END IF;

  -- Check if IP blocking policy is enabled
  SELECT config INTO v_policy_config
  FROM public.security_policies
  WHERE policy_name = 'ip_block_after_failed_logins'
    AND enabled = true
    AND policy_type = 'ip_block';

  IF v_policy_config IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get policy configuration
  v_max_attempts := (v_policy_config->>'max_failed_attempts')::INTEGER;
  v_block_duration_hours := (v_policy_config->>'block_duration_hours')::INTEGER;

  -- Count failed login attempts from this IP in the last hour
  SELECT COUNT(*) INTO v_failed_count
  FROM public.user_access_logs
  WHERE ip_address = NEW.ip_address
    AND action = 'login'
    AND success = false
    AND created_at > NOW() - INTERVAL '1 hour';

  -- If threshold exceeded, block the IP
  IF v_failed_count >= v_max_attempts THEN
    v_blocked_until := NOW() + (v_block_duration_hours || ' hours')::INTERVAL;
    
    -- Block the IP
    PERFORM public.block_ip(
      NEW.ip_address,
      'Multiple failed login attempts',
      v_blocked_until,
      (SELECT id FROM public.security_policies WHERE policy_name = 'ip_block_after_failed_logins'),
      jsonb_build_object('failed_attempts', v_failed_count, 'triggered_at', NOW())
    );

    -- Create security alert
    PERFORM public.create_security_alert(
      'failed_login',
      'high',
      'IP Blocked: Multiple Failed Login Attempts',
      format('IP address %s has been blocked due to %s failed login attempts', NEW.ip_address, v_failed_count),
      NEW.user_id,
      NEW.ip_address,
      'security_policy',
      (SELECT id::TEXT FROM public.security_policies WHERE policy_name = 'ip_block_after_failed_logins'),
      jsonb_build_object('failed_attempts', v_failed_count, 'block_duration_hours', v_block_duration_hours)
    );
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for failed logins
DROP TRIGGER IF EXISTS trigger_check_failed_logins ON public.user_access_logs;
CREATE TRIGGER trigger_check_failed_logins
  AFTER INSERT ON public.user_access_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.check_failed_logins_and_block();

