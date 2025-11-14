# Configuração de Geolocalização - Android

## ✅ O que foi implementado:

1. **Plugin do Capacitor instalado:**
   - `@capacitor/geolocation` adicionado ao `package.json`

2. **Hook atualizado:**
   - `src/hooks/useGeolocation.ts` agora usa o Capacitor quando disponível
   - Funciona tanto no navegador quanto no Android/iOS
   - Fallback automático para API web se Capacitor não estiver disponível

3. **Permissões Android configuradas:**
   - `ACCESS_FINE_LOCATION` (GPS de alta precisão)
   - `ACCESS_COARSE_LOCATION` (localização aproximada via rede)
   - Adicionadas no `android/app/src/main/AndroidManifest.xml`

## 📋 Como funciona:

### No Navegador (Web):
- Usa a API `navigator.geolocation` do navegador
- Solicita permissão automaticamente quando necessário
- Funciona em navegadores modernos com suporte a geolocalização

### No Android:
- Usa o plugin `@capacitor/geolocation`
- Solicita permissões nativas do Android automaticamente
- Acessa GPS e localização via rede do dispositivo
- Mais preciso e confiável que a versão web

## 🔧 Instalação:

### 1. Instalar dependências:
```bash
npm install
```

Isso instalará o `@capacitor/geolocation` automaticamente.

### 2. Sincronizar com Android:
```bash
npm run build
npm run cap:sync
```

### 3. Compilar e testar:
```bash
npm run cap:open
```

No Android Studio, compile e execute o app.

## 📱 Permissões no Android:

As permissões já foram adicionadas no `AndroidManifest.xml`:
- `ACCESS_FINE_LOCATION` - Para GPS de alta precisão
- `ACCESS_COARSE_LOCATION` - Para localização via rede

**Importante:** No Android 6.0+ (API 23+), as permissões de localização são solicitadas em tempo de execução. O plugin do Capacitor gerencia isso automaticamente.

## 🎯 Uso no código:

O hook `useGeolocation` e a função `getCurrentLocation` já estão configurados para funcionar automaticamente:

```typescript
import { getCurrentLocation } from '@/hooks/useGeolocation';

// Obter localização uma vez
const location = await getCurrentLocation();
if (location) {
  console.log('Latitude:', location.latitude);
  console.log('Longitude:', location.longitude);
}
```

## ⚠️ Notas Importantes:

1. **Permissões em tempo de execução:**
   - No Android 6.0+, as permissões são solicitadas quando o app tenta acessar a localização
   - O usuário pode negar a permissão - o app tratará isso graciosamente

2. **Precisão:**
   - `ACCESS_FINE_LOCATION` usa GPS (mais preciso, consome mais bateria)
   - `ACCESS_COARSE_LOCATION` usa rede/WiFi (menos preciso, mais rápido)

3. **Testando:**
   - **Web:** Abra o app no navegador e permita a localização quando solicitado
   - **Android:** Instale o app e permita a localização quando solicitado nas configurações do dispositivo

4. **Fallback:**
   - Se o Capacitor não estiver disponível, o código usa automaticamente a API web
   - Isso garante que funcione mesmo em desenvolvimento web

## 🐛 Troubleshooting:

**"Permissão negada" no Android:**
- Vá em Configurações > Apps > ISF IA > Permissões
- Ative "Localização"
- Ou reinstale o app e permita quando solicitado

**Localização não funciona no navegador:**
- Verifique se o navegador suporta geolocalização
- Certifique-se de que está usando HTTPS (ou localhost)
- Verifique as configurações de privacidade do navegador

**Erro ao instalar o plugin:**
```bash
npm install @capacitor/geolocation
npm run cap:sync
```

## ✅ Status:

- ✅ Plugin instalado
- ✅ Hook atualizado
- ✅ Permissões Android configuradas
- ✅ Fallback para web implementado
- ✅ Tratamento de erros implementado

Tudo pronto! A geolocalização funcionará automaticamente no Android e no navegador.

