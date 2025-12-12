/**
 * Serviço de gerenciamento de licenças
 * Baseado no projeto AFA--ACESS_FACE_ANDROID
 */

import { supabase } from '../lib/supabase';
import { License, LicenseStatus, LicenseType } from '../types/license';
import { logger } from '../utils/logger';

const LICENSE_SECRET = 'ISF_IA_2025_SECRET';

export class LicenseService {
  private machineId: string | null = null;

  /**
   * Gera hash SHA-256 de uma string
   */
  private async hashString(str: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Obtém o Machine ID do dispositivo
   * Tenta obter via Capacitor (Android) ou fallback (Web)
   */
  async getMachineId(): Promise<string> {
    // Se já foi obtido, retornar do cache
    if (this.machineId) {
      return this.machineId;
    }

    // Tentar obter via Capacitor Plugin (Android)
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      try {
        const { Capacitor } = await import('@capacitor/core');
        if (Capacitor.isNativePlatform()) {
          // Tentar obter device ID via plugin nativo se disponível
          // Por enquanto, usar localStorage como fallback
          const storedId = localStorage.getItem('machine_id');
          if (storedId) {
            this.machineId = storedId;
            logger.info('Machine ID obtido do localStorage', 'license');
            return storedId;
          }
        }
      } catch (error) {
        logger.warn('Erro ao obter Device ID via Capacitor', 'license', error);
      }
    }

    // Fallback: usar localStorage com fingerprint do browser
    try {
      // Verificar se localStorage está disponível
      if (typeof localStorage === 'undefined') {
        throw new Error('localStorage não disponível');
      }

      // Tentar obter do localStorage primeiro
      const storedId = localStorage.getItem('machine_id');
      if (storedId) {
        this.machineId = storedId;
        logger.info('Machine ID obtido do localStorage', 'license');
        return storedId;
      }

      // Verificar se APIs do navegador estão disponíveis
      if (typeof document === 'undefined' || typeof navigator === 'undefined' || typeof window === 'undefined') {
        throw new Error('APIs do navegador não disponíveis');
      }

      // Gerar novo ID baseado em características do navegador
      let canvasData = '';
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.textBaseline = 'top';
          ctx.font = '14px "Arial"';
          ctx.textBaseline = 'alphabetic';
          ctx.fillStyle = '#f60';
          ctx.fillRect(125, 1, 62, 20);
          ctx.fillStyle = '#069';
          ctx.fillText('ISF IA - License', 2, 15);
          ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
          ctx.fillText('ISF IA - License', 4, 17);
          canvasData = canvas.toDataURL();
        }
      } catch (canvasError) {
        logger.warn('Erro ao gerar canvas fingerprint', 'license', canvasError);
        canvasData = 'canvas-unavailable';
      }

      const fingerprint = [
        navigator.userAgent || 'unknown',
        navigator.language || 'unknown',
        (typeof screen !== 'undefined' ? screen.width + 'x' + screen.height : 'unknown'),
        new Date().getTimezoneOffset(),
        canvasData,
        navigator.hardwareConcurrency || 0,
        (navigator as any).deviceMemory || 0,
        navigator.platform || 'unknown',
        (typeof window !== 'undefined' && window.location ? window.location.hostname : 'unknown'),
      ].join('|');

      // Gerar hash SHA-256
      const hash = await this.hashString(fingerprint);
      const deviceId = hash.substring(0, 16);

      // Salvar no localStorage para persistência
      try {
        localStorage.setItem('machine_id', deviceId);
      } catch (storageError) {
        logger.warn('Erro ao salvar machine_id no localStorage', 'license', storageError);
      }
      
      this.machineId = deviceId;

      logger.info('Machine ID gerado (fallback web)', 'license', { deviceId });
      return deviceId;
    } catch (error) {
      logger.error('Erro ao gerar Machine ID (fallback)', 'license', error);
      // Último fallback: usar timestamp + random
      const fallbackId = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
      const deviceId = fallbackId.substring(0, 16).padEnd(16, '0');
      
      try {
        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('machine_id', deviceId);
        }
      } catch (storageError) {
        logger.warn('Erro ao salvar machine_id no localStorage (fallback)', 'license', storageError);
      }
      
      this.machineId = deviceId;
      return deviceId;
    }
  }

  /**
   * Busca ou cria uma licença para o Machine ID
   */
  async getOrCreateLicense(machineId?: string): Promise<License | null> {
    if (!machineId) {
      logger.warn('Machine ID não fornecido', 'license');
      return null;
    }

    try {
      // Tentar buscar licença existente
      const { data: existing, error: fetchError } = await supabase
        .from('licenses')
        .select('*')
        .eq('machine_id', machineId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        logger.error('Erro ao buscar licença', 'license', fetchError);
        return null;
      }

      if (existing) {
        return existing as License;
      }

      // Criar nova licença experimental
      const now = new Date().toISOString();
      const { data: newLicense, error: createError } = await supabase
        .from('licenses')
        .insert([
          {
            machine_id: machineId,
            install_date: now,
            activation_token: null,
            last_activation_date: null,
            is_active: true,
            is_lifetime: false,
            license_type: 'experimental',
          },
        ])
        .select()
        .single();

      if (createError) {
        // Tratar erro 409 (Conflict) ou 23505 (Unique violation)
        // Isso pode acontecer em condições de corrida onde duas requisições
        // tentam criar a mesma licença simultaneamente
        if (createError.code === '23505' || createError.status === 409 || 
            createError.message?.includes('duplicate key') ||
            createError.message?.includes('unique constraint')) {
          logger.warn('Licença já existe (condição de corrida detectada), buscando novamente...', 'license', createError);
          
          // Tentar buscar a licença novamente (pode ter sido criada por outra requisição)
          const { data: retryLicense, error: retryError } = await supabase
            .from('licenses')
            .select('*')
            .eq('machine_id', machineId)
            .maybeSingle();

          if (retryError && retryError.code !== 'PGRST116') {
            logger.error('Erro ao buscar licença após conflito', 'license', retryError);
            return null;
          }

          if (retryLicense) {
            logger.info('Licença encontrada após conflito de criação', 'license');
            return retryLicense as License;
          }
        }
        
        logger.error('Erro ao criar licença', 'license', createError);
        return null;
      }

      return newLicense as License;
    } catch (error: any) {
      logger.error('Erro ao buscar/criar licença', 'license', error);
      return null;
    }
  }

  /**
   * Verifica status da licença
   */
  async checkLicenseStatus(machineId?: string): Promise<LicenseStatus> {
    // Se não fornecido, obter automaticamente
    if (!machineId) {
      machineId = await this.getMachineId();
    }
    const license = await this.getOrCreateLicense(machineId);

    if (!license) {
      return {
        valid: false,
        daysRemaining: 0,
        expired: true,
        isActivated: false,
        isLifetime: false,
        isRevoked: false,
      };
    }

    // Verificar se licença foi revogada
    if (license.revoked_at) {
      return {
        valid: false,
        daysRemaining: 0,
        expired: true,
        isActivated: !!license.activation_token,
        isLifetime: license.is_lifetime || false,
        isRevoked: true,
      };
    }

    // Determinar tipo de licença
    const licenseType: LicenseType =
      license.license_type ||
      (license.is_lifetime
        ? 'lifetime'
        : license.activation_token && license.last_activation_date
        ? 'premium'
        : 'experimental');

    // Se é vitalícia, sempre válida
    if (license.is_lifetime || licenseType === 'lifetime') {
      return {
        valid: true,
        daysRemaining: Infinity,
        expired: false,
        isActivated: !!license.activation_token,
        isLifetime: true,
        licenseType: 'lifetime',
        isRevoked: false,
      };
    }

    const installDate = new Date(license.install_date);
    const now = new Date();
    const daysSinceInstall = Math.floor(
      (now.getTime() - installDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    // Período de avaliação: 14 dias
    const TRIAL_DAYS = 14;
    const trialDaysRemaining = Math.max(0, TRIAL_DAYS - daysSinceInstall);
    const isTrialPeriod = daysSinceInstall < TRIAL_DAYS;

    // Se é PREMIUM (tem token de ativação), verificar data da última ativação
    if (
      licenseType === 'premium' ||
      (license.activation_token && license.last_activation_date)
    ) {
      const lastActivation = new Date(license.last_activation_date!);
      const daysSinceActivation = Math.floor(
        (now.getTime() - lastActivation.getTime()) / (1000 * 60 * 60 * 24)
      );

      if (daysSinceActivation >= 365) {
        return {
          valid: false,
          daysRemaining: 0,
          expired: true,
          isActivated: true,
          isLifetime: false,
          licenseType: 'premium',
          isRevoked: false,
          isTrial: false,
          trialDaysRemaining: 0,
        };
      }

      return {
        valid: true,
        daysRemaining: 365 - daysSinceActivation,
        expired: false,
        isActivated: true,
        isLifetime: false,
        licenseType: 'premium',
        isRevoked: false,
        isTrial: false,
        trialDaysRemaining: 0,
      };
    }

    // EXPERIMENTAL: verificar período de avaliação (14 dias)
    if (licenseType === 'experimental' || isTrialPeriod) {
      return {
        valid: isTrialPeriod,
        daysRemaining: trialDaysRemaining,
        expired: !isTrialPeriod,
        isActivated: false,
        isLifetime: false,
        licenseType: 'experimental',
        isRevoked: false,
        isTrial: true,
        trialDaysRemaining: trialDaysRemaining,
      };
    }

    // Período de avaliação expirado - precisa de licença
    return {
      valid: false,
      daysRemaining: 0,
      expired: true,
      isActivated: false,
      isLifetime: false,
      licenseType: 'experimental',
      isRevoked: false,
      isTrial: false,
      trialDaysRemaining: 0,
    };
  }

  /**
   * Gera token de ativação para uma licença
   */
  async generateToken(
    machineId: string,
    installDate: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const expiration = new Date(installDate);
      expiration.setFullYear(expiration.getFullYear() + 1);

      const data = `${machineId}-${installDate}-${expiration.toISOString()}-${LICENSE_SECRET}`;

      // Gerar hash SHA256
      const hash = await this.hashString(data);
      const token =
        hash.substring(0, 32).toUpperCase().match(/.{1,4}/g)?.join('-') || '';

      // Atualizar no Supabase - definir como PREMIUM quando gerar token
      const { error } = await supabase
        .from('licenses')
        .update({
          activation_token: token,
          last_activation_date: new Date().toISOString(),
          license_type: 'premium',
        })
        .eq('machine_id', machineId);

      if (error) {
        logger.error('Erro ao gerar token', 'license', error);
        return { success: false, error: 'Erro ao gerar token' };
      }

      return { success: true, token };
    } catch (error: any) {
      logger.error('Erro ao gerar token', 'license', error);
      return { success: false, error: error.message || 'Erro ao gerar token' };
    }
  }

  /**
   * Lista todas as licenças (apenas admin)
   */
  async getAllLicenses(): Promise<License[]> {
    const { data, error } = await supabase
      .from('licenses')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      logger.error('Erro ao listar licenças', 'license', error);
      return [];
    }

    return (data || []) as License[];
  }

  /**
   * Atualiza metadados da licença (apenas admin)
   */
  async updateLicenseMetadata(
    machineId: string,
    metadata: {
      client_name?: string;
      client_email?: string;
      notes?: string;
      is_active?: boolean;
      is_lifetime?: boolean;
    }
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('licenses')
      .update(metadata)
      .eq('machine_id', machineId);

    if (error) {
      logger.error('Erro ao atualizar metadados', 'license', error);
      return { success: false, error: 'Erro ao atualizar licença' };
    }

    return { success: true };
  }

  /**
   * Revoga uma licença (apenas admin)
   */
  async revokeLicense(
    machineId: string,
    adminEmail: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('licenses')
      .update({
        revoked_at: new Date().toISOString(),
        revoked_by: adminEmail,
        is_active: false,
      })
      .eq('machine_id', machineId);

    if (error) {
      logger.error('Erro ao revogar licença', 'license', error);
      return { success: false, error: 'Erro ao revogar licença' };
    }

    return { success: true };
  }

  /**
   * Reativa uma licença revogada (apenas admin)
   */
  async reactivateLicense(
    machineId: string
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('licenses')
      .update({
        revoked_at: null,
        revoked_by: null,
        is_active: true,
      })
      .eq('machine_id', machineId);

    if (error) {
      logger.error('Erro ao reativar licença', 'license', error);
      return { success: false, error: 'Erro ao reativar licença' };
    }

    return { success: true };
  }

  /**
   * Torna uma licença vitalícia (apenas admin)
   */
  async setLifetimeLicense(
    machineId: string,
    isLifetime: boolean
  ): Promise<{ success: boolean; error?: string }> {
    const { error } = await supabase
      .from('licenses')
      .update({
        is_lifetime: isLifetime,
        license_type: isLifetime ? 'lifetime' : 'premium',
      })
      .eq('machine_id', machineId);

    if (error) {
      logger.error('Erro ao alterar status vitalício', 'license', error);
      return { success: false, error: 'Erro ao alterar licença' };
    }

    return { success: true };
  }

  /**
   * Estende licença para 365 dias a partir de hoje (apenas admin)
   */
  async extendLicenseTo365Days(
    machineId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Buscar licença atual para obter install_date
      const { data: license, error: fetchError } = await supabase
        .from('licenses')
        .select('install_date')
        .eq('machine_id', machineId)
        .maybeSingle();

      if (fetchError || !license) {
        return { success: false, error: 'Licença não encontrada' };
      }

      // Gerar token válido usando o método existente
      const tokenResult = await this.generateToken(
        machineId,
        license.install_date
      );

      if (!tokenResult.success || !tokenResult.token) {
        return { success: false, error: 'Erro ao gerar token de ativação' };
      }

      // Atualizar licença com nova data de ativação e tipo PREMIUM
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('licenses')
        .update({
          last_activation_date: now,
          activation_token: tokenResult.token,
          license_type: 'premium',
          is_active: true,
          revoked_at: null,
          revoked_by: null,
        })
        .eq('machine_id', machineId);

      if (error) {
        logger.error('Erro ao estender licença', 'license', error);
        return { success: false, error: 'Erro ao estender licença' };
      }

      return { success: true };
    } catch (error: any) {
      logger.error('Erro ao estender licença', 'license', error);
      return { success: false, error: error.message || 'Erro ao estender licença' };
    }
  }

  /**
   * Reseta período de avaliação EXPERIMENTAL (14 dias) a partir de hoje (apenas admin)
   */
  async resetTrialPeriod(
    machineId: string
  ): Promise<{ success: boolean; error?: string }> {
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('licenses')
      .update({
        install_date: now,
        license_type: 'experimental',
        activation_token: null,
        last_activation_date: null,
        is_active: true,
        revoked_at: null,
        revoked_by: null,
      })
      .eq('machine_id', machineId);

    if (error) {
      logger.error('Erro ao resetar período de avaliação', 'license', error);
      return { success: false, error: 'Erro ao resetar período de avaliação' };
    }

    return { success: true };
  }
}

export const licenseService = new LicenseService();

