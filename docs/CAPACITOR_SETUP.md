# Configuração do Capacitor — Android (ISF IA)

Documentação do projeto nativo Android do app **ISF IA** (`com.isfia.app`), versão **1.9.3** (`versionCode` 36).

---

## Status atual

| Item | Status |
|------|--------|
| Pasta `android/` | ✅ Criada e configurada |
| `capacitor.config.ts` | ✅ `appId: com.isfia.app`, `webDir: dist` |
| Versão do app | ✅ `1.9.3` / `versionCode 36` |
| `MainActivity.java` | ✅ Com `BillingPlugin` registrado |
| Permissões no manifest | ✅ Rede, câmera, GPS, notificações, storage |
| Plugins Capacitor (10) | ✅ Sincronizados via `cap sync` |
| `google-services.json` (FCM) | ⚠️ Pendente — ver [push-fcm-firebase.md](./push-fcm-firebase.md) |
| Assinatura release (keystore) | ⚠️ Configurar antes de publicar — ver [GERAR_APK_ASSINADO.md](./GERAR_APK_ASSINADO.md) |

---

## Estrutura do projeto Android

```
android/
├── app/
│   ├── build.gradle              # versionCode 36, versionName 1.9.3, Billing 8.0.0
│   ├── capacitor.build.gradle    # Gerado pelo Capacitor (não editar manualmente)
│   ├── google-services.json      # ⚠️ Colocar aqui para FCM (não versionar)
│   └── src/main/
│       ├── AndroidManifest.xml   # Permissões e activity principal
│       ├── assets/
│       │   ├── capacitor.config.json
│       │   └── public/           # Build web (dist/) copiado pelo cap sync
│       ├── java/com/isfia/app/
│       │   ├── MainActivity.java
│       │   └── BillingPlugin.java
│       └── res/                  # Ícones, splash, strings, cores, styles
├── capacitor.settings.gradle     # Plugins Capacitor (gerado automaticamente)
├── build.gradle                  # AGP 8.2.1, google-services 4.4.0
└── variables.gradle              # compileSdk 34, minSdk 22, targetSdk 34
```

---

## Configuração principal

### `capacitor.config.ts`

```typescript
appId: 'com.isfia.app'
appName: 'ISF IA'
webDir: 'dist'
androidScheme: 'https'
backgroundColor: '#000000'
PushNotifications: { presentationOptions: ['badge', 'sound', 'alert'] }
```

### `android/app/build.gradle`

- **applicationId:** `com.isfia.app`
- **versionCode:** `36`
- **versionName:** `"1.9.3"`
- **Billing:** `com.android.billingclient:billing:8.0.0`
- **FCM:** plugin `com.google.gms.google-services` aplicado automaticamente se existir `google-services.json`

### `MainActivity.java`

Registra o plugin nativo de compras in-app:

```java
registerPlugin(BillingPlugin.class);
super.onCreate(savedInstanceState);
```

O `BillingPlugin.java` fica em `android/app/src/main/java/com/isfia/app/` (cópia de `android-plugin/BillingPlugin.java`). Detalhes em [GOOGLE_PLAY_BILLING_SETUP.md](./GOOGLE_PLAY_BILLING_SETUP.md).

### Permissões (`AndroidManifest.xml`)

| Grupo | Permissões |
|-------|------------|
| Rede | `INTERNET`, `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE` |
| Câmera / arquivos | `CAMERA`, `READ_EXTERNAL_STORAGE`, `WRITE_EXTERNAL_STORAGE`, `READ_MEDIA_IMAGES` |
| GPS | `ACCESS_COARSE_LOCATION`, `ACCESS_FINE_LOCATION` |
| Push / FCM | `POST_NOTIFICATIONS`, `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `VIBRATE` |

Câmera e GPS são `required="false"` — o app instala em dispositivos sem esses recursos.

Documentação completa: [PERMISSIONS.md](./PERMISSIONS.md)

---

## Plugins Capacitor (Android)

Sincronizados em `capacitor.settings.gradle`:

| Plugin | Versão |
|--------|--------|
| `@capacitor/app` | 6.0.3 |
| `@capacitor/browser` | 6.0.6 |
| `@capacitor/camera` | 6.1.3 |
| `@capacitor/filesystem` | 6.0.3 |
| `@capacitor/geolocation` | 6.1.0 |
| `@capacitor/haptics` | 6.0.3 |
| `@capacitor/local-notifications` | 6.1.3 |
| `@capacitor/network` | 6.0.4 |
| `@capacitor/push-notifications` | 6.0.5 |
| `@capacitor/share` | 6.0.3 |

---

## Workflow de desenvolvimento

### Desenvolvimento web (dia a dia)

```bash
npm run dev
```

Nada muda no fluxo web. O Capacitor só entra quando for testar ou publicar no Android.

### Build e sync para Android

Sempre nesta ordem:

```bash
npm run build          # Gera dist/
npm run cap:sync       # Copia dist/ → android/app/src/main/assets/public/
```

Atalho que faz os dois:

```bash
npm run android:build
```

### Abrir no Android Studio

```bash
npm run cap:open
```

No Android Studio: **File → Sync Project with Gradle Files** antes do primeiro build.

### Primeira vez (projeto novo na máquina)

```bash
npm install
npm run android:setup   # build + cap add android + sync (só se android/ não existir)
```

Se a pasta `android/` já existir (como neste repositório), use apenas `npm run android:build`.

---

## Compilar APK / AAB

### Via Android Studio (recomendado)

1. `npm run cap:open`
2. **Build → Build Bundle(s) / APK(s)**
   - Debug: `Build APK(s)` → `android/app/build/outputs/apk/debug/app-debug.apk`
   - Release: `Generate Signed Bundle / APK` → AAB ou APK assinado

### Via linha de comando

**Windows (PowerShell):**

```powershell
npm run android:build
cd android
.\gradlew.bat assembleDebug      # APK debug
.\gradlew.bat assembleRelease    # APK release (requer assinatura)
.\gradlew.bat bundleRelease      # AAB para Google Play
```

**Scripts npm (com Java/keystore configurados):**

```bash
npm run android:build:apk        # assembleRelease
npm run android:build:release    # bundleRelease
npm run android:build:apk:signed # APK assinado via variáveis de ambiente
```

Assinatura e keystore: [GERAR_APK_ASSINADO.md](./GERAR_APK_ASSINADO.md)  
Publicação na Play Store: [PUBLICAR_GOOGLE_PLAY.md](./PUBLICAR_GOOGLE_PLAY.md)

---

## Atualizar versão do app

Alterar em **dois lugares** antes de cada release:

1. `package.json` → `"version": "1.9.3"`
2. `android/app/build.gradle` → `versionCode` (inteiro, sempre maior) e `versionName`

Exemplo para a próxima release:

```gradle
versionCode 37
versionName "1.9.4"
```

Depois:

```bash
npm run android:build
```

---

## Push notifications (FCM)

1. Baixar `google-services.json` no Firebase Console (pacote `com.isfia.app`)
2. Colocar em `android/app/google-services.json`
3. Configurar secrets no Supabase (`FCM_SERVICE_ACCOUNT_JSON`, `CRON_SECRET`)
4. `npm run android:build`

Guia completo: [push-fcm-firebase.md](./push-fcm-firebase.md)

No cliente, push só ativa se `VITE_ENABLE_PUSH=true` no `.env`.

---

## Google Play Billing

Plugin nativo já integrado no `MainActivity`. Próximos passos:

1. Produtos configurados no Google Play Console
2. Testar com conta de teste
3. Backend Supabase para validação de compras

Guia: [GOOGLE_PLAY_BILLING_SETUP.md](./GOOGLE_PLAY_BILLING_SETUP.md)

---

## Scripts npm disponíveis

| Script | Descrição |
|--------|-----------|
| `npm run cap:sync` | Sincroniza `dist/` com Android |
| `npm run cap:open` | Abre `android/` no Android Studio |
| `npm run cap:add:android` | Adiciona plataforma Android (primeira vez) |
| `npm run android:build` | `build` + `cap:sync` |
| `npm run android:setup` | Setup inicial completo |
| `npm run android:build:apk` | Build release APK (script PowerShell) |
| `npm run android:build:release` | Build AAB release |
| `npm run generate:android:icons` | Regenera ícones do launcher |

---

## Checklist antes de publicar

- [ ] `npm run build` sem erros
- [ ] `npm run cap:sync` executado
- [ ] `versionCode` e `versionName` atualizados
- [ ] `google-services.json` em `android/app/` (se usar push)
- [ ] Keystore e assinatura release configurados
- [ ] Testado em dispositivo físico (câmera, GPS, notificações, billing)
- [ ] Edge Functions FCM deployadas no Supabase

---

## Troubleshooting

### `google-services.json not found`

Normal até configurar FCM. Push não funcionará até colocar o arquivo em `android/app/`.

### Aviso Gradle: `Using flatDir should be avoided`

Esperado para plugins Cordova do Capacitor. Não impede compilação.

### Mudanças web não aparecem no app

```bash
npm run build && npm run cap:sync
```

Depois rebuild no Android Studio.

### Plugin Billing não encontrado

- Verificar `BillingPlugin.java` em `android/app/src/main/java/com/isfia/app/`
- Verificar `registerPlugin(BillingPlugin.class)` no `MainActivity`
- Executar `npm run cap:sync` novamente

Mais problemas: [TROUBLESHOOTING.md](./TROUBLESHOOTING.md)

---

## Documentação relacionada

| Documento | Conteúdo |
|-----------|----------|
| [PERMISSIONS.md](./PERMISSIONS.md) | Permissões Android em detalhe |
| [push-fcm-firebase.md](./push-fcm-firebase.md) | Firebase + FCM + Edge Functions |
| [GOOGLE_PLAY_BILLING_SETUP.md](./GOOGLE_PLAY_BILLING_SETUP.md) | Compras in-app |
| [GERAR_APK_ASSINADO.md](./GERAR_APK_ASSINADO.md) | Keystore e APK assinado |
| [PUBLICAR_GOOGLE_PLAY.md](./PUBLICAR_GOOGLE_PLAY.md) | Publicação na Play Store |
| [GEOLOCALIZACAO_SETUP.md](./GEOLOCALIZACAO_SETUP.md) | GPS no app |
| [NOTIFICACOES_SETUP.md](./NOTIFICACOES_SETUP.md) | Notificações locais e push |
