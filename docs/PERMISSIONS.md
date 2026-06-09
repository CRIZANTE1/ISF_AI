# Documentação: Permissões do Aplicativo

> Configuração geral do projeto Android: [CAPACITOR_SETUP.md](./CAPACITOR_SETUP.md)  
> Arquivo fonte: `android/app/src/main/AndroidManifest.xml`

## Visão Geral

Este documento descreve todas as permissões necessárias para o funcionamento do aplicativo ISF IA Android (`com.isfia.app`), incluindo rede, câmera, localização, armazenamento e notificações push.

## Permissões Configuradas

### 1. Internet
**Permissão:** `android.permission.INTERNET`

**Uso:**
- Comunicação com o Supabase (backend)
- Download/upload de imagens
- Sincronização de dados

**Status:** ✅ Configurada

### 2. Localização (Geolocalização)

#### 2.1. Localização Fina (GPS)
**Permissão:** `android.permission.ACCESS_FINE_LOCATION`

**Uso:**
- Captura de coordenadas GPS de alta precisão durante inspeções
- Usado em: `AddInspectionPage`, `useGeolocation` hook

**Status:** ✅ Configurada

#### 2.2. Localização Aproximada (Rede)
**Permissão:** `android.permission.ACCESS_COARSE_LOCATION`

**Uso:**
- Fallback para localização via rede (WiFi, celular)
- Usado quando GPS não está disponível

**Status:** ✅ Configurada

#### 2.3. Localização em Background (Opcional)
**Permissão:** `android.permission.ACCESS_BACKGROUND_LOCATION`

**Uso:**
- Atualmente não utilizado
- Comentada no AndroidManifest.xml
- Pode ser habilitada se necessário para funcionalidades futuras

**Status:** ⚠️ Comentada (não necessária atualmente)

### 3. Câmera

#### 3.1. Permissão de Câmera
**Permissão:** `android.permission.CAMERA`

**Uso:**
- Scanner de QR Code (`QrInspectionPage`)
- Captura de fotos de evidência (`PhotoUpload` component)
- Usa `html5-qrcode` para leitura de QR Codes
- Usa API web `getUserMedia` para acesso à câmera

**Status:** ✅ Configurada

#### 3.2. Features de Hardware
**Features Declaradas:**
- `android.hardware.camera` (não obrigatória)
- `android.hardware.camera.autofocus` (não obrigatória)

**Uso:**
- Indica ao Google Play Store que o app pode usar câmera
- `required="false"` permite instalação em dispositivos sem câmera
- App verifica disponibilidade em runtime

**Status:** ✅ Configurada

### 4. Rede

| Permissão | Uso |
|-----------|-----|
| `ACCESS_NETWORK_STATE` | Detectar conectividade (`@capacitor/network`) |
| `ACCESS_WIFI_STATE` | Estado da rede Wi-Fi |

**Status:** ✅ Configuradas

### 5. Armazenamento / mídia

| Permissão | Uso |
|-----------|-----|
| `READ_EXTERNAL_STORAGE` | Leitura de arquivos (API ≤ 32) |
| `WRITE_EXTERNAL_STORAGE` | Gravação de PDFs e fotos (API ≤ 29) |
| `READ_MEDIA_IMAGES` | Galeria no Android 13+ |

**Status:** ✅ Configuradas

### 6. Notificações push (FCM)

| Permissão | Uso |
|-----------|-----|
| `POST_NOTIFICATIONS` | Exibir notificações (Android 13+) |
| `RECEIVE_BOOT_COMPLETED` | Reagendar notificações após reinício |
| `WAKE_LOCK` | Entrega de push em background |
| `VIBRATE` | Feedback tátil em notificações |

**Status:** ✅ Configuradas — requer `google-services.json` para FCM. Ver [push-fcm-firebase.md](./push-fcm-firebase.md).

## Solicitação de Permissões em Runtime

### Android 6.0+ (API 23+)

A partir do Android 6.0, permissões perigosas devem ser solicitadas em runtime. O app implementa isso automaticamente:

#### Localização

**Implementação:** `src/hooks/useGeolocation.ts`

```typescript
// Verifica permissões primeiro
const permissions = await Geolocation.checkPermissions();

if (permissions.location !== 'granted') {
  // Solicita permissão
  const requestResult = await Geolocation.requestPermissions();
  
  if (requestResult.location !== 'granted') {
    // Permissão negada
    return null;
  }
}
```

**Plugin:** `@capacitor/geolocation` gerencia automaticamente a solicitação de permissões nativas.

#### Câmera

**Implementação:** `src/pages/QrInspectionPage.tsx`

```typescript
// html5-qrcode solicita permissão automaticamente via getUserMedia
const scanner = new Html5Qrcode('qr-reader');
await scanner.start(
  { facingMode: 'environment' }, // Câmera traseira
  config,
  onSuccess,
  onError
);
```

**Tratamento de Erros:**
- `NotAllowedError`: Permissão negada pelo usuário
- `NotFoundError`: Câmera não encontrada
- Mensagens de erro são exibidas ao usuário

## Verificação de Permissões

### Localização

O hook `useGeolocation` verifica permissões antes de obter localização:

1. **Ambiente Nativo (Android/iOS):**
   - Usa `Geolocation.checkPermissions()` do Capacitor
   - Solicita via `Geolocation.requestPermissions()` se necessário
   - Obtém localização via `Geolocation.getCurrentPosition()`

2. **Ambiente Web:**
   - Usa `navigator.geolocation` do navegador
   - Solicita permissão automaticamente quando necessário
   - Requer HTTPS ou localhost

### Câmera

O scanner de QR Code (`html5-qrcode`) gerencia permissões automaticamente:

1. Ao iniciar o scanner, solicita permissão via `getUserMedia`
2. Se negada, exibe mensagem de erro
3. Usuário pode permitir nas configurações do dispositivo

## Arquivo AndroidManifest.xml

Localização: `android/app/src/main/AndroidManifest.xml`

```xml
<!-- Rede -->
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.ACCESS_WIFI_STATE" />

<!-- Câmera e armazenamento -->
<uses-permission android:name="android.permission.CAMERA" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" android:maxSdkVersion="32" />
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" android:maxSdkVersion="29" />
<uses-permission android:name="android.permission.READ_MEDIA_IMAGES" />

<!-- GPS -->
<uses-permission android:name="android.permission.ACCESS_COARSE_LOCATION" />
<uses-permission android:name="android.permission.ACCESS_FINE_LOCATION" />

<!-- Push / FCM -->
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
<uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.VIBRATE" />

<!-- Hardware opcional -->
<uses-feature android:name="android.hardware.camera" android:required="false" />
<uses-feature android:name="android.hardware.location.gps" android:required="false" />
```

## Versões do Android Suportadas

Definidas em `android/variables.gradle`:

- **MinSdkVersion:** 22 (Android 5.1 Lollipop)
- **TargetSdkVersion:** 34 (Android 14)
- **CompileSdkVersion:** 34

## Permissões por Funcionalidade

### Scanner de QR Code
- ✅ `CAMERA` (obrigatória)

### Captura de Fotos de Evidência
- ✅ `CAMERA` (obrigatória)
- Usa input file com `accept="image/*"`
- Funciona via navegador ou app nativo

### Geolocalização em Inspeções
- ✅ `ACCESS_FINE_LOCATION` (obrigatória)
- ✅ `ACCESS_COARSE_LOCATION` (obrigatória)
- Usado em: Extintores, Abrigos, Canhões Monitor, Câmaras de Espuma, Chuveiros/Lava-olhos, Alarmes

### Sincronização de Dados
- ✅ `INTERNET` (obrigatória)
- ✅ `ACCESS_NETWORK_STATE` (offline/online)

### Notificações push (FCM)
- ✅ `POST_NOTIFICATIONS` (Android 13+)
- ✅ `RECEIVE_BOOT_COMPLETED`, `WAKE_LOCK`, `VIBRATE`

### Exportação de PDF / fotos
- ✅ `READ_MEDIA_IMAGES` / `WRITE_EXTERNAL_STORAGE` (conforme versão do Android)

## Tratamento de Permissões Negadas

### Localização

Se a permissão for negada:
1. App continua funcionando normalmente
2. Inspeções podem ser criadas sem coordenadas GPS
3. Mensagem de erro é exibida: "Erro ao obter localização"
4. Usuário pode tentar novamente ou continuar sem localização

### Câmera

Se a permissão for negada:
1. Scanner de QR Code não funciona
2. Mensagem: "Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do dispositivo."
3. Usuário pode digitar código manualmente
4. Upload de fotos via galeria ainda funciona (não requer permissão de câmera)

## Boas Práticas Implementadas

1. **Solicitação Just-in-Time**
   - Permissões são solicitadas apenas quando necessárias
   - Não solicita todas as permissões na inicialização

2. **Fallback Graceful**
   - App continua funcionando mesmo sem permissões
   - Funcionalidades alternativas são oferecidas

3. **Mensagens Claras**
   - Erros explicam o problema
   - Instruções sobre como permitir permissões

4. **Verificação de Disponibilidade**
   - Verifica se hardware está disponível antes de usar
   - Features marcadas como `required="false"`

## Testes de Permissões

### Como Testar Localização

1. Instale o app
2. Vá para "Adicionar Inspeção"
3. App solicita permissão de localização
4. Permita ou negue
5. Verifique se coordenadas são capturadas (se permitido)

### Como Testar Câmera

1. Instale o app
2. Vá para "Inspeção por QR Code"
3. App solicita permissão de câmera
4. Permita ou negue
5. Verifique se scanner funciona (se permitido)

## Troubleshooting

### Permissão de Localização Não Funciona

**Possíveis causas:**
- GPS desabilitado no dispositivo
- Modo avião ativado
- Permissão negada nas configurações

**Solução:**
1. Verifique configurações do dispositivo
2. Ative GPS
3. Vá em Configurações > Apps > ISFIA > Permissões
4. Permita "Localização"

### Permissão de Câmera Não Funciona

**Possíveis causas:**
- Câmera em uso por outro app
- Permissão negada nas configurações
- Dispositivo sem câmera

**Solução:**
1. Feche outros apps que usam câmera
2. Vá em Configurações > Apps > ISFIA > Permissões
3. Permita "Câmera"
4. Reinicie o app

## Referências

- [Android Permissions Guide](https://developer.android.com/guide/topics/permissions/overview)
- [Capacitor Geolocation Plugin](https://capacitorjs.com/docs/apis/geolocation)
- [html5-qrcode Documentation](https://github.com/mebjas/html5-qrcode)

