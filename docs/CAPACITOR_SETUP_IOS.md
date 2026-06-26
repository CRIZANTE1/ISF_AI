# Configuração do Capacitor — iOS (ISF IA)

Documentação do projeto nativo iOS do app **ISF IA** (`com.isfia.app`), versão **1.9.3** (build **36**).

---

## Status atual

| Item | Status |
|------|--------|
| Pasta `ios/` | ✅ Versionada no repositório |
| `capacitor.config.ts` | ✅ `appId`, `ios.scheme`, `backgroundColor` |
| Versão do app | ✅ `1.9.3` / build `36` |
| `Info.plist` | ✅ Permissões, deep links, background push |
| `AppDelegate.swift` | ✅ Deep links + handlers APNs |
| `App.entitlements` | ✅ Push Notifications (`aps-environment`) |
| Plugins Capacitor (10) | ✅ Sincronizados via `cap sync ios` |
| `GoogleService-Info.plist` (FCM/APNs) | ⚠️ Pendente — ver [push-fcm-firebase.md](./push-fcm-firebase.md) |
| Assinatura / App Store Connect | ⚠️ Configurar antes de publicar |

---

## Estrutura do projeto iOS

```
ios/
├── App/
│   ├── App/
│   │   ├── AppDelegate.swift
│   │   ├── App.entitlements
│   │   ├── Info.plist
│   │   ├── Assets.xcassets/       # AppIcon + Splash
│   │   ├── Base.lproj/
│   │   ├── GoogleService-Info.plist  # ⚠️ Colocar aqui (não versionar)
│   │   └── public/                # Build web — gerado pelo cap sync
│   ├── App.xcodeproj/
│   ├── App.xcworkspace/           # Abrir este no Xcode
│   ├── Podfile
│   └── Podfile.lock
└── .gitignore
```

---

## Pré-requisitos

- macOS com **Xcode 15+**
- **CocoaPods** (`sudo gem install cocoapods`)
- Conta **Apple Developer** (para device físico e App Store)
- Node.js + dependências do projeto (`npm install`)

---

## Comandos npm

| Script | Descrição |
|--------|-----------|
| `npm run ios:build` | Build web + `cap sync ios` |
| `npm run ios:setup` | Adiciona plataforma iOS (primeira vez) |
| `npm run ios:open` | Abre `App.xcworkspace` no Xcode |
| `npm run cap:open:ios` | Alias para abrir Xcode |
| `npm run generate:ios:icons` | Gera AppIcon 1024×1024 e splash |

### Fluxo de desenvolvimento

```bash
npm install
npm run ios:build
npm run ios:open
```

No Xcode: selecione simulador ou device → **Run** (⌘R).

---

## Configuração principal

### `capacitor.config.ts`

```typescript
appId: 'com.isfia.app'
appName: 'ISF IA'
ios: {
  backgroundColor: '#000000',
  contentInset: 'automatic',
  scheme: 'com.isfia.app',
}
```

### Versões (`project.pbxproj`)

- **MARKETING_VERSION:** `1.9.3`
- **CURRENT_PROJECT_VERSION:** `36`
- **PRODUCT_BUNDLE_IDENTIFIER:** `com.isfia.app`

### Permissões (`Info.plist`)

| Chave | Uso |
|-------|-----|
| `NSCameraUsageDescription` | QR Code e fotos de inspeção |
| `NSPhotoLibraryUsageDescription` | Anexar fotos da galeria |
| `NSPhotoLibraryAddUsageDescription` | Salvar PDFs/fotos |
| `NSLocationWhenInUseUsageDescription` | GPS em inspeções |

### Deep links

Scheme customizado `com.isfia.app://` configurado no `Info.plist`:

| URL | Uso |
|-----|-----|
| `com.isfia.app://google-auth` | Login Google (Supabase OAuth) |
| `com.isfia.app://reset-password` | Reset de senha |

Registrar as mesmas URLs no **Supabase Dashboard → Authentication → URL Configuration**.

Teste no simulador:

```bash
xcrun simctl openurl booted "com.isfia.app://google-auth"
```

### Push notifications (APNs + Firebase)

1. Criar app iOS no [Firebase Console](https://console.firebase.google.com) (bundle `com.isfia.app`)
2. Baixar `GoogleService-Info.plist` → `ios/App/App/GoogleService-Info.plist`
3. No Firebase: configurar **APNs Authentication Key** (.p8) da Apple Developer
4. No Xcode: target **App** → **Signing & Capabilities** → adicionar **Push Notifications**
5. Para release/TestFlight: alterar `aps-environment` em `App.entitlements` para `production` (ou deixar o Xcode gerenciar)

Handlers APNs já estão em `AppDelegate.swift` (requeridos pelo `@capacitor/push-notifications`).

Backend Supabase: Edge Function `push-register` já aceita `platform: 'ios'`.

---

## Ícones e splash

```bash
npm run generate:ios:icons
```

Fonte: `icons/web/icon-512.png` → `Assets.xcassets/AppIcon.appiconset/`.

---

## Publicação (App Store)

1. `npm run ios:build`
2. Abrir Xcode → **Product → Archive**
3. **Distribute App** → App Store Connect
4. Configurar produtos/subscriptions no App Store Connect (quando StoreKit estiver implementado)

### Checklist antes de submeter

- [ ] Bundle ID `com.isfia.app` registrado no Apple Developer
- [ ] Provisioning profile / signing automático configurado
- [ ] `GoogleService-Info.plist` presente (se usar push)
- [ ] APNs key no Firebase
- [ ] Deep links testados no device físico
- [ ] Câmera, GPS, galeria e PDF testados
- [ ] Screenshots e metadados no App Store Connect

---

## Troubleshooting

| Problema | Solução |
|----------|---------|
| `pod install` falha | `cd ios/App && pod install --repo-update` |
| Push não registra token | Verificar APNs key, entitlements e `AppDelegate` |
| Deep link não abre app | Confirmar scheme no Supabase e no `Info.plist` |
| Permissão negada (câmera/GPS) | Verificar strings no `Info.plist` |
| WebView preta no launch | `npm run ios:build` antes de rodar no Xcode |

---

## Referências

- [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md) — Android
- [push-fcm-firebase.md](./push-fcm-firebase.md) — Push end-to-end
- [GOOGLE_AUTH_IMPLEMENTATION.md](./GOOGLE_AUTH_IMPLEMENTATION.md) — OAuth deep links
- [PERMISSIONS.md](./PERMISSIONS.md) — Permissões (Android; iOS usa Info.plist)
