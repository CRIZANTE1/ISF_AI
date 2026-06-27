/**
 * Serviço de gerenciamento de licenças
 * Baseado no projeto AFA--ACESS_FACE_ANDROID
 */

import { supabase } from '../lib/supabase';
import { License, LicenseStatus, LicenseType } from '../types/license';
import { logger } from '../utils/logger';

// A geração de tokens é realizada server-side pela Edge Function 'generate-license-token'.
// O LICENSE_SECRET vive exclusivamente no servidor (Deno.env) e nunca é exposto no bundle.

export class LicenseService {
  private machineId: string | null = null;

  /**
   * Obtém o Machine ID do dispositivo.
   * Prioridade: cache → localStorage → Device.getId() (nativo) → fingerprint → timestamp.
   */
  async getMachineId(): Promise<string> {
    if (this.machineId) {
      return this.machineId;
    }

    const storedId = this.getStoredMachineId();
    if (storedId) {
      this.machineId = storedId;
      logger.info('Machine ID obtido do localStorage', 'license');
      return storedId;
    }

    const nativeId = await this.tryGetNativeDeviceId();
    if (nativeId) {
      this.persistMachineId(nativeId);
      logger.info('Machine ID obtido via Device.getId()', 'license', { deviceId: nativeId });
      return nativeId;
    }

    try {
      const fingerprintId = await this.generateFingerprintMachineId();
      this.persistMachineId(fingerprintId);
      logger.info('Machine ID gerado via fingerprint', 'license', { deviceId: fingerprintId });
      return fingerprintId;
    } catch (error) {
      logger.error('Erro ao gerar Machine ID (fallback)', 'license', error);
      const fallbackId = Date.now().toString(36) + Math.random().toString(36).substring(2, 10);
      const deviceId = fallbackId.substring(0, 16).padEnd(16, '0');
      this.persistMachineId(deviceId);
      return deviceId;
    }
  }

  private getStoredMachineId(): string | null {
    try {
      if (typeof localStorage === 'undefined') {
        return null;
      }
      return localStorage.getItem('machine_id');
    } catch {
      return null;
    }
  }

  private persistMachineId(deviceId: string): void {
    this.machineId = deviceId;
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('machine_id', deviceId);
      }
    } catch (storageError) {
      logger.warn('Erro ao salvar machine_id no localStorage', 'license', storageError);
    }
  }

  private async tryGetNativeDeviceId(): Promise<string | null> {
    if (typeof window === 'undefined') {
      return null;
    }

    try {
      const { Capacitor } = await import('@capacitor/core');
      if (!Capacitor.isNativePlatform()) {
        return null;
      }

      const { Device } = await import('@capacitor/device');
      const { identifier } = await Device.getId();
      if (!identifier) {
        return null;
      }

      const hash = await this.hashString(identifier);
      return hash.substring(0, 16);
    } catch (error) {
      logger.warn('Device.getId() falhou, usando fingerprint (método anterior)', 'license', error);
      return null;
    }
  }

  private async generateFingerprintMachineId(): Promise<string> {
    if (typeof localStorage === 'undefined') {
      throw new Error('localStorage não disponível');
    }

    if (typeof document === 'undefined' || typeof navigator === 'undefined' || typeof window === 'undefined') {
      throw new Error('APIs do navegador não disponíveis');
    }

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

    const hash = await this.hashString(fingerprint);
    return hash.substring(0, 16);
  }

  private async hashString(str: string): Promise<string> {
    const data = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('');
  }

  /**
   * Associa um usuário à licença do machine_id atual
   * Se o usuário já tiver uma licença premium/lifetime, vincula ao novo machine_id
   * Se a licença já tiver um user_id diferente, apenas atualiza se estiver vazio ou for o mesmo usuário
   */
  async associateUserToLicense(userId: string, machineId?: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!machineId) {
        machineId = await this.getMachineId();
      }

      // NOVA LÓGICA: Primeiro verificar se o usuário JÁ tem uma licença premium/lifetime
      const { data: userLicenses, error: userLicensesError } = await supabase
        .from('licenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }); // Ordenar pela mais antiga (primeira licença)

      if (userLicensesError && userLicensesError.code !== 'PGRST116') {
        logger.error('Erro ao buscar licenças do usuário', 'license', userLicensesError);
        return { success: false, error: 'Erro ao buscar licenças do usuário' };
      }

      // Se o usuário já tem licenças, verificar se alguma é premium/lifetime
      if (userLicenses && userLicenses.length > 0) {
        // Priorizar licença lifetime, depois premium, depois a mais recente
        const premiumLicense = userLicenses.find(l => l.is_lifetime || l.license_type === 'lifetime');
        const activePremium = userLicenses.find(l => l.license_type === 'premium' && l.last_activation_date);
        const existingPremiumLicense = premiumLicense || activePremium;

        if (existingPremiumLicense) {
          // Usuário JÁ tem licença premium/lifetime em outro device
          // Verificar se o machine_id já está associado a essa licença
          if (existingPremiumLicense.machine_id === machineId) {
            logger.debug('Licença premium já está associada a este machine_id', 'license', { machineId, userId });
            return { success: true };
          }

          // IMPORTANTE: Atualizar o machine_id da licença premium para o novo device
          logger.info('Usuário premium reinstalou o app - vinculando licença ao novo machine_id', 'license', {
            userId,
            oldMachineId: existingPremiumLicense.machine_id,
            newMachineId: machineId,
            licenseType: existingPremiumLicense.license_type
          });

          // VERIFICAR PRIMEIRO: Se já existe uma licença com o novo machine_id
          const { data: conflictingLicense, error: checkError } = await supabase
            .from('licenses')
            .select('id, user_id, license_type')
            .eq('machine_id', machineId)
            .maybeSingle();

          if (checkError && checkError.code !== 'PGRST116') {
            logger.error('Erro ao verificar conflito de machine_id', 'license', checkError);
            return { success: false, error: 'Erro ao verificar machine_id' };
          }

          if (conflictingLicense) {
            // Se a licença conflitante é experimental e pertence ao mesmo usuário, deletá-la
            if (conflictingLicense.license_type === 'experimental' && 
                conflictingLicense.user_id === userId) {
              logger.info('Removendo licença experimental conflitante para atualizar licença premium', 'license', {
                conflictingLicenseId: conflictingLicense.id,
                machineId
              });
              
              const { error: deleteError } = await supabase
                .from('licenses')
                .delete()
                .eq('id', conflictingLicense.id);
              
              if (deleteError) {
                logger.error('Erro ao remover licença experimental conflitante', 'license', deleteError);
                // Continuar mesmo assim - tentar atualizar
              }
            } else if (conflictingLicense.user_id !== userId && conflictingLicense.user_id !== null) {
              // Licença de outro usuário - não podemos sobrescrever
              logger.warn('Machine ID já está em uso por outra licença de outro usuário', 'license', {
                machineId,
                conflictingUserId: conflictingLicense.user_id,
                currentUserId: userId,
                conflictingLicenseId: conflictingLicense.id
              });
              return { 
                success: false, 
                error: 'Este dispositivo já está associado a outra conta. Faça logout da outra conta primeiro.' 
              };
            } else if (conflictingLicense.id === existingPremiumLicense.id) {
              // É a própria licença - já está atualizada (não deveria acontecer, mas check de segurança)
              logger.debug('Licença já está associada a este machine_id', 'license', { machineId, userId });
              return { success: true };
            }
          }

          // Agora podemos atualizar com segurança
          const { error: updateError } = await supabase
            .from('licenses')
            .update({ machine_id: machineId })
            .eq('id', existingPremiumLicense.id);

          if (updateError) {
            logger.error('Erro ao atualizar machine_id da licença premium', 'license', updateError);
            
            // Se ainda assim der erro de duplicata (race condition), verificar novamente
            if (updateError.code === '23505') {
              const { data: retryCheck } = await supabase
                .from('licenses')
                .select('id, user_id')
                .eq('machine_id', machineId)
                .maybeSingle();
              
              if (retryCheck?.user_id === userId) {
                logger.info('Machine ID já atualizado por outra operação (race condition)', 'license', { machineId, userId });
                return { success: true };
              }
            }
            
            return { success: false, error: 'Erro ao atualizar machine_id da licença' };
          }

          logger.info('Licença premium vinculada com sucesso ao novo device', 'license', { userId, machineId });
          return { success: true };
        }
      }

      // Verificar se já existe uma licença para este machine_id
      const { data: existingLicense, error: fetchError } = await supabase
        .from('licenses')
        .select('user_id')
        .eq('machine_id', machineId)
        .maybeSingle();

      if (fetchError && fetchError.code !== 'PGRST116') {
        logger.error('Erro ao buscar licença', 'license', fetchError);
        return { success: false, error: 'Erro ao buscar licença' };
      }

      // Se a licença não existe para este machine_id, criar uma nova experimental
      if (!existingLicense) {
        const now = new Date().toISOString();
        const { error: createError } = await supabase
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
              user_id: userId,
            },
          ]);

        if (createError) {
          logger.error('Erro ao criar licença', 'license', createError);
          return { success: false, error: 'Erro ao criar licença' };
        }

        logger.info('Nova licença experimental criada e associada ao usuário', 'license', { machineId, userId });
        return { success: true };
      }

      // Se a licença já existe para este machine_id
      const currentUserId = existingLicense.user_id;

      // Se já tem o mesmo user_id, não precisa atualizar
      if (currentUserId === userId) {
        logger.debug('Licença já está associada a este usuário', 'license', { machineId, userId });
        return { success: true };
      }

      // Se tem um user_id diferente, apenas atualizar se estiver NULL
      // (caso de licenças antigas que não tinham user_id)
      if (currentUserId === null) {
        const { error } = await supabase
          .from('licenses')
          .update({ user_id: userId })
          .eq('machine_id', machineId);

        if (error) {
          logger.error('Erro ao associar usuário à licença', 'license', error);
          return { success: false, error: 'Erro ao associar usuário à licença' };
        }

        logger.info('Licença associada ao usuário', 'license', { machineId, userId });
        return { success: true };
      }

      // Se já tem um user_id diferente, logar aviso mas não sobrescrever
      // (evita que um usuário "roube" a licença de outro)
      logger.warn(
        'Tentativa de associar licença a usuário diferente ignorada',
        'license',
        {
          machineId,
          currentUserId,
          attemptedUserId: userId,
        }
      );
      return { success: true }; // Retorna success mas não altera nada
    } catch (error: any) {
      logger.error('Erro ao associar usuário à licença', 'license', error);
      return { success: false, error: error.message || 'Erro ao associar usuário à licença' };
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
   * Gera token de ativação para uma licença via Edge Function server-side.
   * O LICENSE_SECRET nunca trafega pelo cliente — a geração acontece no servidor.
   * Interface pública idêntica à versão anterior: sem quebra para LicenseManagement.tsx.
   */
  async generateToken(
    machineId: string,
    installDate: string
  ): Promise<{ success: boolean; token?: string; error?: string }> {
    try {
      const { data, error } = await supabase.functions.invoke('generate-license-token', {
        body: { machineId, installDate },
      });

      if (error) {
        logger.error('Erro ao chamar Edge Function generate-license-token', 'license', error);
        return { success: false, error: error.message || 'Erro ao gerar token' };
      }

      if (!data?.success || !data?.token) {
        logger.error('Resposta inesperada da Edge Function', 'license', data);
        return { success: false, error: data?.error || 'Erro ao gerar token' };
      }

      logger.info('Token gerado com sucesso via Edge Function', 'license', { machineId });
      return { success: true, token: data.token };
    } catch (error: any) {
      logger.error('Erro ao gerar token', 'license', error);
      return { success: false, error: error.message || 'Erro ao gerar token' };
    }
  }

  /**
   * Lista todas as licenças (apenas admin)
   * Inclui informações do usuário relacionado quando disponível através do client_email
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

