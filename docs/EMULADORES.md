# Emuladores Android e iOS — ISF IA

Guia para rodar o app **ISF IA** (`com.isfia.app`) em emulador/simulador pelo terminal, **sem abrir o Android Studio** (Android) e com o mínimo de Xcode (iOS).

> **Resumo:** o app não é pesado; emuladores simulam hardware por software. Rodar o emulador Android **fora do Android Studio** costuma ser mais fluido e consome menos RAM.

---

## Quando usar cada ambiente

| Ambiente | Use para |
|----------|----------|
| **Browser** (`npm run dev`) | UI, login, Supabase, formulários — desenvolvimento diário |
| **Emulador Android** | Câmera, GPS, push, billing, deep links Android |
| **Simulador iOS** | Deep links iOS, câmera, permissões, layout em iPhone |
| **Aparelho físico** | Performance real, billing, push APNs/FCM |

---

## Pré-requisitos gerais

```bash
npm install
```

Variáveis em `.env` / `.env.local` (ver [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon
```

---

# Android (sem Android Studio)

## 1. Configurar o PATH (uma vez)

Adicione ao `~/.zshrc`:

```bash
export ANDROID_HOME="$HOME/Library/Android/sdk"
export PATH="$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$PATH"
```

Recarregue:

```bash
source ~/.zshrc
```

Verifique:

```bash
emulator -list-avds
adb version
```

O SDK costuma ficar em `~/Library/Android/sdk` (confirmado em `android/local.properties`).

## 2. Listar e iniciar o emulador

```bash
# Listar AVDs disponíveis
emulator -list-avds

# Iniciar (substitua pelo nome do seu AVD)
emulator -avd Pixel_10_Pro -no-boot-anim
```

| Flag | Efeito |
|------|--------|
| `-no-boot-anim` | Boot mais rápido |
| `-no-snapshot-load` | Cold boot — útil se o emulador estiver instável |
| `-wipe-data` | Apaga dados do AVD (último recurso) |

Aguardar boot completo:

```bash
adb wait-for-device shell 'while [[ -z $(getprop sys.boot_completed) ]]; do sleep 1; done; echo ready'
```

## 3. Build e instalar o app

Com o emulador já aberto:

```bash
npm run build
npx cap sync android
npx cap run android
```

Ou instalar o APK debug direto:

```bash
npm run build && npx cap sync android
cd android && ./gradlew installDebug
```

## 4. Fluxo recomendado (dois terminais)

**Terminal 1 — emulador**

```bash
emulator -avd Pixel_10_Pro -no-boot-anim
```

**Terminal 2 — app**

```bash
npm run build && npx cap sync android && npx cap run android
```

## 5. Testar deep links (Android)

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "com.isfia.app://google-auth" com.isfia.app
```

```bash
adb shell am start -a android.intent.action.VIEW \
  -d "com.isfia.app://reset-password" com.isfia.app
```

## 6. Logs e depuração

```bash
# Filtrar só o app
adb logcat --pid=$(adb shell pidof -s com.isfia.app)

# Limpar log e acompanhar
adb logcat -c && adb logcat | grep -E "isfia|Capacitor"
```

## 7. Android — solução de problemas

| Problema | Solução |
|----------|---------|
| `adb devices` mostra `offline` | `adb kill-server && adb start-server` |
| Emulador não encontrado | Confirme `ANDROID_HOME` e PATH |
| Mudanças web não aparecem | `npm run build && npx cap sync android` |
| App não instala | `cd android && ./gradlew clean installDebug` |
| Billing não funciona | Emulador sem Google Play — use aparelho físico ([GOOGLE_PLAY_BILLING_SETUP.md](./GOOGLE_PLAY_BILLING_SETUP.md)) |

### Logs que podem ignorar no emulador

| Log | Significado |
|-----|-------------|
| `SurfaceSyncGroup ... Failed to receive transaction ready` | Timeout gráfico WebView — comum em emulador |
| `Skipped XX frames` | Frame lento — normal sob carga do emulador |
| `NotifAttentionHelper ... Muting recently noisy` | Android silenciou muitas notificações seguidas |

Se no **aparelho físico** tudo funciona bem, esses logs no emulador são em geral ruído.

### AVD mais leve (opcional)

Crie um AVD menor no SDK Manager (só precisa do Studio uma vez para criar o AVD):

- Device: **Pixel 6** ou **Pixel 7**
- API: **34** (alinhado ao `compileSdk` do projeto)
- ABI: **arm64-v8a** em Mac Apple Silicon (M1/M2/M3/M4)
- RAM: 4–6 GB
- Graphics: **Hardware - GLES 2.0**

---

# iOS (Simulador)

> Requer **macOS** com Xcode instalado. O simulador roda pelo terminal; o Xcode só é obrigatório para compilar e para criar perfis de assinatura em device físico.

## 1. Pré-requisitos iOS

- Xcode 15+ (`xcode-select --install` se necessário)
- CocoaPods: `sudo gem install cocoapods`
- Primeira vez no projeto:

```bash
npm run ios:build
cd ios/App && pod install
```

## 2. Listar simuladores

```bash
xcrun simctl list devices available
```

Exemplo de saída: `iPhone 16 Pro (XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX) (Shutdown)`

## 3. Iniciar o simulador (sem abrir o Xcode)

```bash
# Abrir o app Simulator
open -a Simulator

# Bootar um device específico (substitua o UDID)
xcrun simctl boot "iPhone 16 Pro"

# Ou bootar o device padrão já selecionado
xcrun simctl bootstatus booted -b
```

Atalho — boot pelo nome:

```bash
xcrun simctl boot "iPhone 16 Pro" 2>/dev/null || true
open -a Simulator
```

## 4. Build e rodar o app

```bash
npm run build
npx cap sync ios
npx cap run ios
```

O Capacitor lista os simuladores disponíveis e instala o app no booted.

Para escolher um simulador específico:

```bash
npx cap run ios --target "iPhone 16 Pro"
```

## 5. Fluxo recomendado (dois terminais)

**Terminal 1 — simulador**

```bash
open -a Simulator
xcrun simctl boot "iPhone 16 Pro"
```

**Terminal 2 — app**

```bash
npm run build && npx cap sync ios && npx cap run ios --target "iPhone 16 Pro"
```

## 6. Testar deep links (iOS)

Com o simulador bootado:

```bash
xcrun simctl openurl booted "com.isfia.app://google-auth"
```

```bash
xcrun simctl openurl booted "com.isfia.app://reset-password"
```

## 7. Logs e depuração

```bash
# Logs do simulador (filtrar pelo bundle)
xcrun simctl spawn booted log stream --predicate 'subsystem contains "com.isfia.app"' --level debug
```

No Safari (Mac): **Develop → Simulator → ISF IA** para inspecionar o WebView.

## 8. iOS — solução de problemas

| Problema | Solução |
|----------|---------|
| `pod install` falha | `cd ios/App && pod install --repo-update` |
| WebView preta no launch | `npm run ios:build` antes de rodar |
| Simulador não boota | `xcrun simctl shutdown all` e tente de novo |
| Push não registra token | Push real exige device físico + APNs ([push-fcm-firebase.md](./push-fcm-firebase.md)) |
| Deep link não abre | Confirme scheme no `Info.plist` e no Supabase |

Para abrir o projeto no Xcode quando precisar (assinatura, Archive):

```bash
npm run ios:open
```

---

# Scripts npm úteis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Dev no browser (Vite) |
| `npm run build` | Build web → `dist/` |
| `npm run android:build` | Build + `cap sync` (Android) |
| `npm run ios:build` | Build + `cap sync ios` |
| `npx cap run android` | Instala e abre no emulador/device Android |
| `npx cap run ios` | Instala e abre no simulador iOS |
| `npm run cap:open:android` | Abre Android Studio (opcional) |
| `npm run ios:open` | Abre Xcode (opcional) |

---

# Referências

| Documento | Conteúdo |
|-----------|----------|
| [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md) | Estrutura Android |
| [CAPACITOR_SETUP_IOS.md](./CAPACITOR_SETUP_IOS.md) | Estrutura iOS |
| [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) | Erros de rede/Supabase |
| [GOOGLE_PLAY_BILLING_SETUP.md](./GOOGLE_PLAY_BILLING_SETUP.md) | Billing (device real) |
| [push-fcm-firebase.md](./push-fcm-firebase.md) | Push FCM/APNs |
| [GOOGLE_AUTH_IMPLEMENTATION.md](./GOOGLE_AUTH_IMPLEMENTATION.md) | OAuth e deep links |
