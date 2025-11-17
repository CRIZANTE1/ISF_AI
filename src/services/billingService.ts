import { Capacitor } from '@capacitor/core';
import { supabase } from '../lib/supabase';
import { updateUserPlan } from '../utils/adminOperations';
import { Billing } from '../plugins/BillingPlugin';
import type { BillingProduct, Purchase, BillingResult } from '../plugins/BillingPlugin';
import { logger } from '../utils/logger';

class BillingService {
  private initialized = false;

  constructor() {
    // O plugin será inicializado quando necessário
  }

  /**
   * Verifica se o billing está disponível
   */
  async isAvailable(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      return false;
    }

    try {
      const result = await Billing.isAvailable();
      return result.available;
    } catch (error) {
      logger.error('Erro ao verificar disponibilidade do billing', 'billing', error);
      return false;
    }
  }

  /**
   * Inicializa o cliente de billing
   */
  async initialize(): Promise<boolean> {
    if (!Capacitor.isNativePlatform() || Capacitor.getPlatform() !== 'android') {
      logger.warn('Google Play Billing só está disponível no Android', 'billing');
      return false;
    }

    try {
      const result = await Billing.initialize();
      this.initialized = result.success;
      return result.success;
    } catch (error) {
      logger.error('Erro ao inicializar billing', 'billing', error);
      this.initialized = false;
      return false;
    }
  }

  /**
   * Busca informações dos produtos
   */
  async queryProducts(productIds: string[]): Promise<BillingProduct[]> {
    if (!this.initialized) {
      throw new Error('Billing não está inicializado. Chame initialize() primeiro.');
    }

    try {
      const result = await Billing.queryProducts(productIds);
      return result.products || [];
    } catch (error) {
      logger.error('Erro ao buscar produtos', 'billing', error);
      throw error;
    }
  }

  /**
   * Inicia o fluxo de compra
   */
  async purchase(productId: string): Promise<Purchase | null> {
    if (!this.initialized) {
      throw new Error('Billing não está inicializado. Chame initialize() primeiro.');
    }

    try {
      const result = await Billing.purchase(productId);
      
      if (result.result.responseCode !== 0) {
        // ResponseCode 0 = OK
        throw new Error(result.result.debugMessage || 'Erro ao processar compra');
      }

      if (result.purchase) {
        // Reconhecer a compra automaticamente
        await this.acknowledgePurchase(result.purchase.purchaseToken);
        
        // Sincronizar com o backend
        await this.syncPurchaseWithBackend(result.purchase);
      }

      return result.purchase;
    } catch (error) {
      logger.error('Erro ao processar compra', 'billing', error);
      throw error;
    }
  }

  /**
   * Reconhece uma compra (necessário para assinaturas)
   */
  async acknowledgePurchase(purchaseToken: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Billing não está inicializado');
    }

    try {
      const result = await Billing.acknowledgePurchase(purchaseToken);
      return result.success;
    } catch (error) {
      logger.error('Erro ao reconhecer compra', 'billing', error);
      return false;
    }
  }

  /**
   * Busca compras ativas do usuário
   */
  async queryPurchases(): Promise<Purchase[]> {
    if (!this.initialized) {
      throw new Error('Billing não está inicializado');
    }

    try {
      const result = await Billing.queryPurchases();
      return result.purchases || [];
    } catch (error) {
      logger.error('Erro ao buscar compras', 'billing', error);
      throw error;
    }
  }

  /**
   * Sincroniza a compra com o backend (Supabase)
   */
  private async syncPurchaseWithBackend(purchase: Purchase): Promise<void> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        throw new Error('Usuário não autenticado');
      }

      // Verificar se a compra já foi registrada (evitar duplicatas)
      const { data: existingPurchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('purchase_token', purchase.purchaseToken)
        .single();

      if (existingPurchase) {
        logger.info('Compra já registrada, atualizando', 'billing', { purchaseToken: purchase.purchaseToken });
        
        // Atualizar compra existente
        const { error: updateError } = await supabase
          .from('purchases')
          .update({
            purchase_state: purchase.purchaseState,
            acknowledged: purchase.acknowledged,
            updated_at: new Date().toISOString(),
          })
          .eq('purchase_token', purchase.purchaseToken);

        if (updateError) {
          logger.error('Erro ao atualizar compra', 'billing', updateError);
          throw updateError;
        }
      } else {
        // Registrar nova compra
        const purchaseData = {
          user_id: user.id,
          product_id: purchase.productId,
          purchase_token: purchase.purchaseToken,
          order_id: purchase.orderId || null,
          purchase_time: new Date(purchase.purchaseTime).toISOString(),
          purchase_state: purchase.purchaseState,
          acknowledged: purchase.acknowledged,
          original_json: {
            productId: purchase.productId,
            orderId: purchase.orderId,
            purchaseTime: purchase.purchaseTime,
            purchaseState: purchase.purchaseState,
            acknowledged: purchase.acknowledged,
          } as any,
        };

        const { error: insertError } = await supabase
          .from('purchases')
          .insert(purchaseData);

        if (insertError) {
          logger.error('Erro ao registrar compra', 'billing', insertError);
          throw insertError;
        }

        logger.info('Compra registrada com sucesso', 'billing', { productId: purchase.productId });
      }

      // Determinar o plano baseado no productId
      let plan: 'trial' | 'premium' = 'premium';
      
      // Mapear productIds para planos
      // Você deve configurar esses IDs no Google Play Console
      if (purchase.productId.includes('premium')) {
        plan = 'premium';
      }

      // Atualizar o plano do usuário apenas se a compra foi bem-sucedida
      // PurchaseState 0 = PURCHASED
      if (purchase.purchaseState === 0) {
        await updateUserPlan(user.id, plan);
        logger.info('Plano do usuário atualizado', 'billing', { userId: user.id, plan });
      }

      logger.info('Compra sincronizada com sucesso', 'billing', { productId: purchase.productId });
    } catch (error) {
      logger.error('Erro ao sincronizar compra com backend', 'billing', error);
      throw error;
    }
  }

  /**
   * Verifica e sincroniza compras existentes ao iniciar o app
   */
  async syncExistingPurchases(): Promise<void> {
    try {
      const purchases = await this.queryPurchases();
      
      if (purchases.length === 0) {
        logger.info('Nenhuma compra encontrada para sincronizar', 'billing');
        return;
      }

      logger.info('Sincronizando compras existentes', 'billing', { count: purchases.length });

      for (const purchase of purchases) {
        try {
          // Sincronizar todas as compras, não apenas as não processadas
          // Isso garante que compras canceladas ou atualizadas também sejam registradas
          await this.syncPurchaseWithBackend(purchase);
        } catch (error) {
          logger.error('Erro ao sincronizar compra', 'billing', { error, productId: purchase.productId });
          // Continua com as próximas compras mesmo se uma falhar
        }
      }

      logger.info('Sincronização de compras concluída', 'billing');
    } catch (error) {
      logger.error('Erro ao sincronizar compras existentes', 'billing', error);
      // Não lança erro para não bloquear a inicialização do app
    }
  }

  /**
   * Busca todas as compras registradas do usuário atual
   */
  async getUserPurchases(): Promise<any[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return [];
      }

      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .order('purchase_time', { ascending: false });

      if (error) {
        logger.error('Erro ao buscar compras do usuário', 'billing', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Erro ao buscar compras do usuário', 'billing', error);
      return [];
    }
  }

  /**
   * Verifica se o usuário tem uma compra ativa para um produto específico
   */
  async hasActivePurchase(productId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return false;
      }

      const { data, error } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('purchase_state', 0) // 0 = PURCHASED
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
        logger.error('Erro ao verificar compra ativa', 'billing', error);
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('Erro ao verificar compra ativa', 'billing', error);
      return false;
    }
  }
}

// Exportar instância singleton
export const billingService = new BillingService();

// Re-exportar tipos para conveniência
export type { BillingProduct, Purchase, BillingResult };

// Exportar funções auxiliares
export { billingService as default };

