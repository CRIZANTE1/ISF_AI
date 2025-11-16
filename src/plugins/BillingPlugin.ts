import { registerPlugin } from '@capacitor/core';

export interface BillingProduct {
  productId: string;
  type: 'inapp' | 'subs';
  title: string;
  description: string;
  price: string;
  priceAmountMicros: number;
  priceCurrencyCode: string;
}

export interface Purchase {
  purchaseToken: string;
  productId: string;
  orderId: string;
  purchaseTime: number;
  purchaseState: number;
  acknowledged: boolean;
}

export interface BillingResult {
  responseCode: number;
  debugMessage?: string;
}

export interface InitializeResult {
  success: boolean;
  message?: string;
}

export interface QueryProductsResult {
  products: BillingProduct[];
}

export interface PurchaseResult {
  purchase: Purchase | null;
  result: BillingResult;
}

export interface AcknowledgePurchaseResult {
  success: boolean;
}

export interface QueryPurchasesResult {
  purchases: Purchase[];
}

export interface IsAvailableResult {
  available: boolean;
}

export interface BillingPlugin {
  initialize(): Promise<InitializeResult>;
  queryProducts(productIds: string[]): Promise<QueryProductsResult>;
  purchase(productId: string): Promise<PurchaseResult>;
  acknowledgePurchase(purchaseToken: string): Promise<AcknowledgePurchaseResult>;
  queryPurchases(): Promise<QueryPurchasesResult>;
  isAvailable(): Promise<IsAvailableResult>;
}

const Billing = registerPlugin<BillingPlugin>('Billing', {
  web: () => import('./BillingPlugin.web').then(m => new m.BillingPluginWeb()),
});

export { Billing };

