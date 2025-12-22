import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { billingService, type BillingProduct } from '../services/billingService';
import { useToast } from '../contexts/ToastContext';
import { useTranslation } from './useTranslation';
import { logger } from '../utils/logger';

// IDs dos produtos no Google Play Console
// Você deve configurar esses IDs no Google Play Console
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
} as const;

export function useBilling() {
  const { showToast } = useToast();
  const { isEnglish } = useTranslation();
  const [isAvailable, setIsAvailable] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [products, setProducts] = useState<BillingProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Carregar produtos - removido isInitialized das dependências
  const loadProducts = useCallback(async (force = false) => {
    setLoading(true);
    setError(null);

    try {
      const productIds = [PRODUCT_IDS.PREMIUM_MONTHLY, PRODUCT_IDS.PREMIUM_YEARLY];
      const loadedProducts = await billingService.queryProducts(productIds);
      setProducts(loadedProducts);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar produtos';
      setError(errorMessage);
      logger.error('Erro ao carregar produtos', 'billing', err);
    } finally {
      setLoading(false);
    }
  }, []); // Sem dependências - função estável

  // Inicializar o billing - sem loadProducts nas dependências
  const initialize = useCallback(async () => {
    if (isInitializing || isInitialized) return;

    setIsInitializing(true);
    setError(null);

    try {
      const success = await billingService.initialize();
      setIsInitialized(success);
      
      if (success) {
        // Sincronizar compras existentes
        await billingService.syncExistingPurchases();
        
        // Carregar produtos inline - sem chamar loadProducts
        try {
          const productIds = [PRODUCT_IDS.PREMIUM_MONTHLY, PRODUCT_IDS.PREMIUM_YEARLY];
          const loadedProducts = await billingService.queryProducts(productIds);
          setProducts(loadedProducts);
        } catch (err) {
          logger.error('Erro ao carregar produtos após inicialização', 'billing', err);
        }
      } else {
        setError('Não foi possível inicializar o Google Play Billing');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao inicializar billing';
      setError(errorMessage);
      showToast(errorMessage, 'error');
    } finally {
      setIsInitializing(false);
    }
  }, [isInitializing, isInitialized, showToast]); // Removido loadProducts

  // Verificar disponibilidade ao montar - sem initialize nas dependências
  useEffect(() => {
    const checkAvailability = async () => {
      if (Capacitor.isNativePlatform() && Capacitor.getPlatform() === 'android') {
        const available = await billingService.isAvailable();
        setIsAvailable(available);
        
        if (available) {
          // Chama initialize diretamente - effect roda apenas uma vez
          await initialize();
        }
      }
    };

    checkAvailability();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Array vazio - roda apenas na montagem

  // Efeito separado para carregar produtos quando inicializado
  useEffect(() => {
    if (isInitialized && products.length === 0) {
      loadProducts(false);
    }
  }, [isInitialized, products.length, loadProducts]);

  // Realizar compra
  const purchase = useCallback(async (productId: string) => {
    if (!isInitialized) {
      showToast('Billing não está inicializado', 'error');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const purchase = await billingService.purchase(productId);
      
      if (purchase) {
        showToast('Compra realizada com sucesso!', 'success');
        return purchase;
      } else {
        showToast('Compra cancelada', 'info');
        return null;
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao processar compra';
      setError(errorMessage);
      showToast(errorMessage, 'error');
      return null;
    } finally {
      setLoading(false);
    }
  }, [isInitialized, showToast]);

  // Buscar preço formatado de um produto
  const getProductPrice = useCallback((productId: string, frequency: 'monthly' | 'yearly') => {
    // Todos os preços devem ser "a combinar"
    return 'a combinar';
  }, []);

  return {
    isAvailable,
    isInitialized,
    isInitializing,
    products,
    loading,
    error,
    initialize,
    loadProducts,
    purchase,
    getProductPrice,
  };
}

