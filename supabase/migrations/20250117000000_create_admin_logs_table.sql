/*
# [Create Admin Logs Table]
This migration creates a table for logging user actions and access for administrative purposes.

## Metadata:
- Schema-Category: "Administrative"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `user_action_logs` - Logs user actions (login, logout, create, update, delete)
- Table: `user_access_logs` - Logs user access and session information

## Security Implications:
- RLS enabled for both tables
- Only admins can view logs
- System can insert logs for all actions
*/

-- Create action logs table
CREATE TABLE IF NOT EXISTS public.user_action_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action_type TEXT NOT NULL, -- 'login', 'logout', 'create', 'update', 'delete', 'view', etc.
  resource_type TEXT, -- 'equipment', 'inspection', 'profile', etc.
  resource_id TEXT, -- ID of the resource affected
  details JSONB, -- Additional details about the action
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create access logs table
CREATE TABLE IF NOT EXISTS public.user_access_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- 'login', 'logout', 'session_start', 'session_end'
  ip_address INET,
  user_agent TEXT,
  session_id TEXT,
  success BOOLEAN DEFAULT true,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_user_action_logs_user_id ON public.user_action_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_created_at ON public.user_action_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_action_logs_action_type ON public.user_action_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_user_id ON public.user_access_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_created_at ON public.user_access_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_access_logs_action ON public.user_access_logs(action);

-- Enable RLS
ALTER TABLE public.user_action_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_access_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can view logs
CREATE POLICY "Admins can view all action logs"
  ON public.user_action_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert action logs"
  ON public.user_action_logs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all access logs"
  ON public.user_access_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "System can insert access logs"
  ON public.user_access_logs FOR INSERT
  WITH CHECK (true);

-- Function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(
  p_action_type TEXT,
  p_resource_type TEXT DEFAULT NULL,
  p_resource_id TEXT DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_action_logs (
    user_id,
    action_type,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    auth.uid(),
    p_action_type,
    p_resource_type,
    p_resource_id,
    p_details,
    p_ip_address,
    p_user_agent
  );
END;
$$;

-- Function to log user access
CREATE OR REPLACE FUNCTION public.log_user_access(
  p_action TEXT,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_session_id TEXT DEFAULT NULL,
  p_success BOOLEAN DEFAULT true,
  p_error_message TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.user_access_logs (
    user_id,
    action,
    ip_address,
    user_agent,
    session_id,
    success,
    error_message
  )
  VALUES (
    auth.uid(),
    p_action,
    p_ip_address,
    p_user_agent,
    p_session_id,
    p_success,
    p_error_message
  );
END;
$$;

-- Add trial_ends_at column to profiles if it doesn't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- Set trial_ends_at for existing trial users (14 days from now)
UPDATE public.profiles
SET trial_ends_at = NOW() + INTERVAL '14 days'
WHERE plan = 'trial' AND trial_ends_at IS NULL;

