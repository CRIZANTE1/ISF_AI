# Configuração do Capacitor - Android

## ✅ O que foi configurado:

1. **Dependências adicionadas ao package.json:**
   - `@capacitor/core`
   - `@capacitor/android`
   - `@capacitor/cli` (dev)

2. **Arquivo de configuração criado:**
   - `capacitor.config.ts`

3. **Scripts adicionados:**
   - `npm run cap:sync` - Sincroniza o build web com o projeto Android
   - `npm run cap:open` - Abre o projeto no Android Studio

## 📋 Próximos passos (execute quando quiser compilar):

### 1. Instalar as dependências:
```bash
npm install
```

### 2. Fazer build da aplicação web:
```bash
npm run build
```

### 3. Adicionar a plataforma Android:
```bash
npx cap add android
```

Isso vai criar a pasta `android/` com o projeto nativo.

### 4. Sincronizar o build:
```bash
npm run cap:sync
```

Este comando copia o build da pasta `dist/` para o projeto Android.

### 5. Abrir no Android Studio:
```bash
npm run cap:open
```

Ou abra manualmente a pasta `android/` no Android Studio.

## 🔄 Workflow de desenvolvimento:

### Para testar na web (como você está fazendo agora):
```bash
npm run dev
```
**Nada muda!** Continue usando normalmente.

### Quando quiser compilar para Android:

1. **Desenvolva e teste na web** (`npm run dev`)
2. **Quando estiver pronto para testar no Android:**
   ```bash
   npm run build        # Compila a web app
   npm run cap:sync     # Sincroniza com Android
   npm run cap:open     # Abre no Android Studio
   ```
3. **No Android Studio:**
   - Clique em "Run" ou pressione Shift+F10
   - Escolha um emulador ou dispositivo conectado
   - O app será instalado e executado

## ⚠️ Importante:

- **A pasta `android/` será criada apenas quando você executar `npx cap add android`**
- **Você pode continuar desenvolvendo normalmente com `npm run dev`**
- **O build Android usa os arquivos da pasta `dist/` (gerada pelo `npm run build`)**
- **Sempre execute `npm run build` antes de `npm run cap:sync` para ter as últimas mudanças**

## 🎯 Quando estiver pronto:

Execute estes comandos na ordem:
```bash
npm install              # Instala as dependências do Capacitor
npm run build            # Compila a aplicação
npx cap add android      # Cria o projeto Android (só precisa fazer uma vez)
npm run cap:sync         # Sincroniza o build
npm run cap:open         # Abre no Android Studio
```

Depois disso, você pode compilar o APK/AAB normalmente no Android Studio! 🚀

## 🔨 Compilando o APK/AAB

### Opção 1: Via Android Studio (Recomendado)

1. Abra o projeto no Android Studio:
   ```bash
   npm run cap:open
   ```

2. No Android Studio:
   - Para **APK de debug**: `Build > Build Bundle(s) / APK(s) > Build APK(s)`
   - Para **AAB (Google Play)**: `Build > Generate Signed Bundle / APK > Android App Bundle`
   - Para **APK assinado**: `Build > Generate Signed Bundle / APK > APK`

3. O arquivo será gerado em:
   - **APK Debug**: `android/app/build/outputs/apk/debug/app-debug.apk`
   - **APK Release**: `android/app/build/outputs/apk/release/app-release.apk`
   - **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

### Opção 2: Via Linha de Comando (Gradle)

**Pré-requisitos:**
- Java JDK instalado
- Android SDK configurado
- Variável de ambiente `ANDROID_HOME` configurada

**Comandos:**

```bash
# Navegar para a pasta android
cd android

# Compilar APK de debug
./gradlew assembleDebug
# O APK estará em: app/build/outputs/apk/debug/app-debug.apk

# Compilar APK de release (requer assinatura)
./gradlew assembleRelease
# O APK estará em: app/build/outputs/apk/release/app-release.apk

# Compilar AAB para Google Play
./gradlew bundleRelease
# O AAB estará em: app/build/outputs/bundle/release/app-release.aab
```

**No Windows (PowerShell):**
```powershell
cd android
.\gradlew.bat assembleDebug
.\gradlew.bat assembleRelease
.\gradlew.bat bundleRelease
```

### ⚠️ Assinatura do APK/AAB (Release)

Para publicar na Google Play, você precisa assinar o app:

1. **Gerar uma keystore** (se ainda não tiver):
   ```bash
   keytool -genkey -v -keystore isfia-release-key.jks -keyalg RSA -keysize 2048 -validity 10000 -alias isfia
   ```

2. **Configurar no `android/app/build.gradle`**:
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file('../../isfia-release-key.jks')
               storePassword 'sua_senha'
               keyAlias 'isfia'
               keyPassword 'sua_senha'
           }
       }
       buildTypes {
           release {
               signingConfig signingConfigs.release
           }
       }
   }
   ```

3. **Ou usar variáveis de ambiente** (mais seguro):
   ```gradle
   android {
       signingConfigs {
           release {
               storeFile file(System.getenv("KEYSTORE_FILE") ?: "../../isfia-release-key.jks")
               storePassword System.getenv("KEYSTORE_PASSWORD") ?: ""
               keyAlias System.getenv("KEY_ALIAS") ?: "isfia"
               keyPassword System.getenv("KEY_PASSWORD") ?: ""
           }
       }
   }
   ```

## 📝 Scripts NPM Disponíveis

- `npm run android:setup` - Faz build, adiciona plataforma Android e sincroniza (primeira vez)
- `npm run android:build` - Faz build e sincroniza com Android (após setup inicial)
- `npm run cap:sync` - Sincroniza apenas o build
- `npm run cap:open` - Abre o projeto no Android Studio
- `npm run cap:add:android` - Adiciona a plataforma Android

## ⚠️ Avisos Comuns do Gradle

### Aviso sobre `flatDir`

Se você ver o aviso:
```
Using flatDir should be avoided because it doesn't support any meta-data formats.
Affected Modules: app, capacitor-cordova-android-plugins
```

**Isso é normal e esperado!** O `flatDir` é necessário para plugins Cordova que podem ter bibliotecas JAR locais. Este aviso:
- ✅ **NÃO impede a compilação**
- ✅ **NÃO afeta a funcionalidade do app**
- ✅ É apenas informativo do Gradle

O aviso pode ser ignorado com segurança. A configuração foi otimizada para reduzir o impacto, mas o `flatDir` é necessário para a compatibilidade com plugins Cordova do Capacitor.

