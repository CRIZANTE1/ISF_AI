/**
 * Tipos relacionados a gestão de licenças
 */

export type LicenseType = 'experimental' | 'premium' | 'lifetime';

export interface License {
  id: string;
  machine_id: string;
  install_date: string;
  activation_token: string | null;
  last_activation_date: string | null;
  is_active: boolean;
  is_lifetime: boolean;
  license_type: LicenseType;
  revoked_at: string | null;
  revoked_by: string | null;
  created_at: string;
  updated_at: string;
  client_name?: string | null;
  client_email?: string | null;
  notes?: string | null;
  user_id?: string | null; // ID do usuário relacionado à licença
  user?: {
    id: string;
    email?: string;
    full_name: string | null;
  } | null; // Informações do usuário (populado via join)
}

export interface LicenseStatus {
  valid: boolean;
  daysRemaining: number;
  expired: boolean;
  isActivated: boolean;
  isLifetime: boolean;
  licenseType?: LicenseType;
  isRevoked: boolean;
  isTrial?: boolean;
  trialDaysRemaining?: number;
}

