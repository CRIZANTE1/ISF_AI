import { WebPlugin } from '@capacitor/core';
import type { BillingPlugin } from './definitions';

export class BillingPluginWeb extends WebPlugin implements BillingPlugin {
  async initialize(): Promise<{ success: boolean; message?: string }> {
    return {
      success: false,
      message: 'Google Play Billing não está disponível na web',
    };
  }

  async queryProducts(): Promise<{ products: any[] }> {
    return { products: [] };
  }

  async purchase(): Promise<{ purchase: any | null; result: any }> {
    return {
      purchase: null,
      result: {
        responseCode: -1,
        debugMessage: 'Google Play Billing não está disponível na web',
      },
    };
  }

  async acknowledgePurchase(): Promise<{ success: boolean }> {
    return { success: false };
  }

  async queryPurchases(): Promise<{ purchases: any[] }> {
    return { purchases: [] };
  }

  async isAvailable(): Promise<{ available: boolean }> {
    return { available: false };
  }
}

