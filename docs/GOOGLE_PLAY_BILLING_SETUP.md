# Configuração do Google Play Billing Library

Este documento descreve como configurar e usar a integração do Google Play Billing Library no aplicativo ISF IA.

## 📋 Pré-requisitos

1. Projeto Android configurado com Capacitor
2. Conta de desenvolvedor Google Play ativa
3. App publicado no Google Play Console (pelo menos em teste interno)

## 🔧 Configuração

### 1. Adicionar Dependência no Android

No arquivo `android/app/build.gradle`, adicione a dependência da Google Play Billing Library:

```gradle
dependencies {
    // ... outras dependências ...
    
    // Google Play Billing Library
    def billing_version = "8.0.0"
    implementation "com.android.billingclient:billing:$billing_version"
    
    // Opcional: Para suporte a Kotlin Coroutines
    implementation "com.android.billingclient:billing-ktx:$billing_version"
}
```

### 2. Adicionar o Plugin Java ao Projeto Android

1. Copie o arquivo `android-plugin/BillingPlugin.java` para:
   ```
   android/app/src/main/java/com/isfia/app/BillingPlugin.java
   ```

2. Certifique-se de que o package name está correto (deve corresponder ao `appId` no `capacitor.config.ts`)

### 3. Registrar o Plugin no MainActivity

No arquivo `android/app/src/main/java/com/isfia/app/MainActivity.java` (ou `.kt`), adicione o plugin:

```java
import com.isfia.app.BillingPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Registrar o plugin
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            add(BillingPlugin.class);
        }});
    }
}
```

### 4. Configurar Produtos no Google Play Console

1. Acesse o [Google Play Console](https://play.google.com/console)
2. Selecione seu app
3. Vá em **Monetização > Produtos e assinaturas**
4. Crie os seguintes produtos de assinatura:

   - **ID do Produto**: `premium_monthly`
     - Tipo: Assinatura
     - Período: Mensal
     - Preço: Configure conforme necessário
   
   - **ID do Produto**: `premium_yearly`
     - Tipo: Assinatura
     - Período: Anual
     - Preço: Configure conforme necessário

5. **Importante**: Os IDs dos produtos devem corresponder aos definidos em `src/hooks/useBilling.ts`:

```typescript
export const PRODUCT_IDS = {
  PREMIUM_MONTHLY: 'premium_monthly',
  PREMIUM_YEARLY: 'premium_yearly',
} as const;
```

### 5. Configurar Testes

Para testar as compras, você precisa:

1. Adicionar contas de teste no Google Play Console:
   - Vá em **Configurações > Contas de teste**
   - Adicione os emails das contas que irão testar

2. Publicar o app em pelo menos **Teste interno** ou **Teste fechado**

3. Instalar o app em um dispositivo Android real (não funciona em emulador sem Google Play Services)

## 📱 Uso no Aplicativo

A integração já está configurada na página de planos (`src/pages/PlanPaymentPage.tsx`). O fluxo funciona assim:

1. **Inicialização automática**: O hook `useBilling` inicializa automaticamente quando o app é aberto no Android
2. **Carregamento de produtos**: Os produtos são carregados do Google Play
3. **Compra**: Quando o usuário clica em "Fazer Upgrade", o fluxo de compra do Google Play é iniciado
4. **Sincronização**: Após a compra, o plano do usuário é atualizado automaticamente no Supabase

## 🔄 Sincronização com Backend

Quando uma compra é realizada:

1. A compra é reconhecida automaticamente pelo Google Play
2. O serviço `billingService` sincroniza com o Supabase:
   - Atualiza o plano do usuário na tabela `profiles`
   - Registra a compra (se a tabela `purchases` existir)

### Tabela de Compras

✅ **A tabela de compras já foi criada automaticamente!**

A migration `20250120000000_create_purchases_table.sql` foi aplicada ao banco de dados e cria a tabela `purchases` com:

- **Registro completo**: Todas as compras são automaticamente registradas
- **Prevenção de duplicatas**: O sistema verifica se a compra já existe antes de inserir
- **Atualização automática**: Compras existentes são atualizadas se houver mudanças
- **Auditoria**: Dados originais da compra são armazenados em `original_json`
- **RLS habilitado**: Usuários só podem ver suas próprias compras (admins podem ver todas)

A tabela inclui:
- `purchase_token` (único) - Token único da compra do Google Play
- `purchase_state` - Estado da compra (0=PURCHASED, 1=CANCELED, 2=PENDING)
- `acknowledged` - Se a compra foi reconhecida
- `original_json` - Dados completos da compra para auditoria

**Todas as compras são registradas automaticamente** quando:
1. Uma nova compra é realizada
2. O app é iniciado (sincroniza compras existentes)
3. Uma compra é atualizada (cancelada, renovada, etc)

## 🐛 Troubleshooting

### Erro: "Billing não está conectado"

- Verifique se o Google Play Services está instalado e atualizado
- Certifique-se de que o app está publicado no Google Play Console (pelo menos em teste)
- Verifique se os produtos foram criados no Google Play Console

### Erro: "Produto não encontrado"

- Verifique se os IDs dos produtos no código correspondem aos do Google Play Console
- Certifique-se de que os produtos estão ativos no Google Play Console
- Aguarde alguns minutos após criar os produtos (pode levar tempo para propagar)

### Compras não funcionam no emulador

- Use um dispositivo Android real
- Ou configure o emulador com Google Play Services instalado

### Plugin não encontrado

- Verifique se o arquivo `BillingPlugin.java` está no local correto
- Verifique se o plugin foi registrado no `MainActivity`
- Execute `npm run cap:sync` para sincronizar

## 📚 Recursos Adicionais

- [Documentação oficial do Google Play Billing](https://developer.android.com/google/play/billing)
- [Guia de integração do Capacitor](https://capacitorjs.com/docs/plugins/creating-plugins)
- [Google Play Console](https://play.google.com/console)

## ⚠️ Importante

- **Nunca** faça commit de chaves de API ou credenciais
- Sempre teste em ambiente de teste antes de publicar em produção
- Monitore as compras no Google Play Console regularmente
- Implemente validação de compras no backend para segurança adicional

