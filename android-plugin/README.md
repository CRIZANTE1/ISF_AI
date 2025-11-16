# Plugin Google Play Billing para Capacitor

Este diretório contém os arquivos necessários para integrar o Google Play Billing Library ao projeto Android.

## 📁 Estrutura de Arquivos

```
android-plugin/
├── BillingPlugin.java    # Plugin nativo Android
└── README.md             # Este arquivo
```

## 🚀 Instalação

### Passo 1: Copiar o Plugin

Copie o arquivo `BillingPlugin.java` para o projeto Android:

```bash
# No Windows (PowerShell)
Copy-Item android-plugin/BillingPlugin.java android/app/src/main/java/com/isfia/app/BillingPlugin.java

# No Linux/Mac
cp android-plugin/BillingPlugin.java android/app/src/main/java/com/isfia/app/BillingPlugin.java
```

**Importante**: Certifique-se de que o caminho corresponde ao package name do seu app:
- Package name no `capacitor.config.ts`: `com.isfia.app`
- Caminho do arquivo: `android/app/src/main/java/com/isfia/app/BillingPlugin.java`

### Passo 2: Adicionar Dependência

No arquivo `android/app/build.gradle`, adicione:

```gradle
dependencies {
    // ... outras dependências existentes ...
    
    // Google Play Billing Library
    def billing_version = "8.0.0"
    implementation "com.android.billingclient:billing:$billing_version"
}
```

### Passo 3: Registrar o Plugin

No arquivo `android/app/src/main/java/com/isfia/app/MainActivity.java` (ou `.kt`):

**Se for Java:**
```java
package com.isfia.app;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.Plugin;
import com.isfia.app.BillingPlugin;
import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        
        // Registrar plugins
        this.init(savedInstanceState, new ArrayList<Class<? extends Plugin>>() {{
            add(BillingPlugin.class);
        }});
    }
}
```

**Se for Kotlin:**
```kotlin
package com.isfia.app

import android.os.Bundle
import com.getcapacitor.BridgeActivity
import com.getcapacitor.Plugin
import com.isfia.app.BillingPlugin

class MainActivity : BridgeActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        
        // Registrar plugins
        this.init(savedInstanceState, arrayListOf<Class<out Plugin>>(
            BillingPlugin::class.java
        ))
    }
}
```

### Passo 4: Sincronizar

Execute os seguintes comandos:

```bash
npm run build
npm run cap:sync
```

### Passo 5: Abrir no Android Studio

```bash
npm run cap:open
```

No Android Studio, sincronize o projeto (Sync Project with Gradle Files) para baixar as dependências.

## ✅ Verificação

Após seguir os passos acima:

1. O projeto deve compilar sem erros
2. O plugin deve estar disponível no código TypeScript
3. Você pode testar chamando `billingService.isAvailable()` no app

## 🔍 Troubleshooting

### Erro: "Cannot resolve symbol 'BillingClient'"

- Certifique-se de que adicionou a dependência no `build.gradle`
- Sincronize o projeto no Android Studio (File > Sync Project with Gradle Files)

### Erro: "Plugin not found"

- Verifique se o arquivo está no caminho correto
- Verifique se o package name está correto
- Certifique-se de que registrou o plugin no `MainActivity`
- Execute `npm run cap:sync` novamente

### Erro de compilação

- Verifique se a versão do Billing Library é compatível com sua versão do Android SDK
- Verifique se todas as importações estão corretas no arquivo Java

## 📚 Próximos Passos

Após instalar o plugin, siga as instruções em `docs/GOOGLE_PLAY_BILLING_SETUP.md` para:
- Configurar produtos no Google Play Console
- Testar as compras
- Configurar a sincronização com o backend

