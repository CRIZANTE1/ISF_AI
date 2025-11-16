package com.isfia.app;

import android.app.Activity;
import android.content.Context;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.android.billingclient.api.*;
import java.util.ArrayList;
import java.util.List;

@CapacitorPlugin(name = "Billing")
public class BillingPlugin extends Plugin {
    private BillingClient billingClient;
    private PurchasesUpdatedListener purchasesUpdatedListener;
    private boolean isServiceConnected = false;

    @Override
    public void load() {
        super.load();
        initializeBillingClient();
    }

    private void initializeBillingClient() {
        purchasesUpdatedListener = (billingResult, purchases) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && purchases != null) {
                for (Purchase purchase : purchases) {
                    handlePurchase(purchase);
                }
            } else if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.USER_CANCELED) {
                // Usuário cancelou a compra
            } else {
                // Erro ao processar compra
            }
        };

        billingClient = BillingClient.newBuilder(getContext())
                .setListener(purchasesUpdatedListener)
                .enablePendingPurchases()
                .build();
    }

    @PluginMethod
    public void initialize(PluginCall call) {
        if (billingClient == null) {
            initializeBillingClient();
        }

        billingClient.startConnection(new BillingClientStateListener() {
            @Override
            public void onBillingSetupFinished(BillingResult billingResult) {
                if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
                    isServiceConnected = true;
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                } else {
                    isServiceConnected = false;
                    JSObject result = new JSObject();
                    result.put("success", false);
                    result.put("message", "Erro ao conectar com Google Play Billing: " + billingResult.getDebugMessage());
                    call.resolve(result);
                }
            }

            @Override
            public void onBillingServiceDisconnected() {
                isServiceConnected = false;
            }
        });
    }

    @PluginMethod
    public void isAvailable(PluginCall call) {
        JSObject result = new JSObject();
        result.put("available", billingClient != null);
        call.resolve(result);
    }

    @PluginMethod
    public void queryProducts(PluginCall call) {
        if (!isServiceConnected) {
            call.reject("Billing não está conectado. Chame initialize() primeiro.");
            return;
        }

        JSObject data = call.getData();
        if (data == null || !data.has("productIds")) {
            call.reject("productIds é obrigatório");
            return;
        }

        List<String> skuList = new ArrayList<>();
        try {
            org.json.JSONArray productIdsArray = data.getJSONArray("productIds");
            for (int i = 0; i < productIdsArray.length(); i++) {
                skuList.add(productIdsArray.getString(i));
            }
        } catch (org.json.JSONException e) {
            call.reject("Erro ao processar productIds: " + e.getMessage());
            return;
        }

        SkuDetailsParams.Builder params = SkuDetailsParams.newBuilder();
        params.setSkusList(skuList).setType(BillingClient.SkuType.SUBS);

        billingClient.querySkuDetailsAsync(params.build(), (billingResult, skuDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && skuDetailsList != null) {
                List<JSObject> products = new ArrayList<>();
                for (SkuDetails details : skuDetailsList) {
                    JSObject product = new JSObject();
                    product.put("productId", details.getSku());
                    product.put("type", "subs");
                    product.put("title", details.getTitle());
                    product.put("description", details.getDescription());
                    product.put("price", details.getPrice());
                    product.put("priceAmountMicros", details.getPriceAmountMicros());
                    product.put("priceCurrencyCode", details.getPriceCurrencyCode());
                    products.add(product);
                }
                JSObject result = new JSObject();
                result.put("products", products);
                call.resolve(result);
            } else {
                call.reject("Erro ao buscar produtos: " + billingResult.getDebugMessage());
            }
        });
    }

    @PluginMethod
    public void purchase(PluginCall call) {
        if (!isServiceConnected) {
            call.reject("Billing não está conectado. Chame initialize() primeiro.");
            return;
        }

        JSObject data = call.getData();
        if (data == null || !data.has("productId")) {
            call.reject("productId é obrigatório");
            return;
        }

        String productId = data.getString("productId");
        if (productId == null || productId.isEmpty()) {
            call.reject("productId não pode ser vazio");
            return;
        }

        SkuDetailsParams.Builder params = SkuDetailsParams.newBuilder();
        params.setSkusList(java.util.Arrays.asList(productId)).setType(BillingClient.SkuType.SUBS);

        billingClient.querySkuDetailsAsync(params.build(), (billingResult, skuDetailsList) -> {
            if (billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK && skuDetailsList != null && !skuDetailsList.isEmpty()) {
                SkuDetails skuDetails = skuDetailsList.get(0);
                BillingFlowParams flowParams = BillingFlowParams.newBuilder()
                        .setSkuDetails(skuDetails)
                        .build();

                Activity activity = getActivity();
                if (activity != null) {
                    BillingResult result = billingClient.launchBillingFlow(activity, flowParams);
                    if (result.getResponseCode() != BillingClient.BillingResponseCode.OK) {
                        JSObject response = new JSObject();
                        response.put("purchase", null);
                        JSObject billingResultObj = new JSObject();
                        billingResultObj.put("responseCode", result.getResponseCode());
                        billingResultObj.put("debugMessage", result.getDebugMessage());
                        response.put("result", billingResultObj);
                        call.resolve(response);
                    } else {
                        // A compra será processada no listener
                        // Armazenar o call para retornar o resultado depois
                        call.save();
                    }
                } else {
                    call.reject("Activity não disponível");
                }
            } else {
                call.reject("Produto não encontrado: " + productId);
            }
        });
    }

    @PluginMethod
    public void acknowledgePurchase(PluginCall call) {
        if (!isServiceConnected) {
            call.reject("Billing não está conectado");
            return;
        }

        JSObject data = call.getData();
        if (data == null || !data.has("purchaseToken")) {
            call.reject("purchaseToken é obrigatório");
            return;
        }

        String purchaseToken = data.getString("purchaseToken");
        if (purchaseToken == null || purchaseToken.isEmpty()) {
            call.reject("purchaseToken não pode ser vazio");
            return;
        }

        AcknowledgePurchaseParams acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                .setPurchaseToken(purchaseToken)
                .build();

        billingClient.acknowledgePurchase(acknowledgePurchaseParams, billingResult -> {
            JSObject result = new JSObject();
            result.put("success", billingResult.getResponseCode() == BillingClient.BillingResponseCode.OK);
            call.resolve(result);
        });
    }

    @PluginMethod
    public void queryPurchases(PluginCall call) {
        if (!isServiceConnected) {
            call.reject("Billing não está conectado");
            return;
        }

        Purchase.PurchasesResult purchasesResult = billingClient.queryPurchases(BillingClient.SkuType.SUBS);
        List<JSObject> purchases = new ArrayList<>();
        
        if (purchasesResult.getResponseCode() == BillingClient.BillingResponseCode.OK) {
            for (Purchase purchase : purchasesResult.getPurchasesList()) {
                JSObject purchaseObj = new JSObject();
                purchaseObj.put("purchaseToken", purchase.getPurchaseToken());
                purchaseObj.put("productId", purchase.getSkus().get(0));
                purchaseObj.put("orderId", purchase.getOrderId());
                purchaseObj.put("purchaseTime", purchase.getPurchaseTime());
                purchaseObj.put("purchaseState", purchase.getPurchaseState());
                purchaseObj.put("acknowledged", purchase.isAcknowledged());
                purchases.add(purchaseObj);
            }
        }

        JSObject result = new JSObject();
        result.put("purchases", purchases);
        call.resolve(result);
    }

    private void handlePurchase(Purchase purchase) {
        if (purchase.getPurchaseState() == Purchase.PurchaseState.PURCHASED) {
            if (!purchase.isAcknowledged()) {
                AcknowledgePurchaseParams acknowledgePurchaseParams = AcknowledgePurchaseParams.newBuilder()
                        .setPurchaseToken(purchase.getPurchaseToken())
                        .build();
                billingClient.acknowledgePurchase(acknowledgePurchaseParams, billingResult -> {
                    // Compra reconhecida
                });
            }
        }
    }
}

