# Configuração de Sincronização em Background

## Dependências Necessárias

Para que a sincronização em background funcione corretamente no Android, você precisa instalar o plugin `@capacitor/network`:

```bash
npm install @capacitor/network
```

### Dependências Já Instaladas

As seguintes dependências já estão instaladas e não precisam de instalação adicional:

- `@capacitor/core` (v6.0.0)
- `@capacitor/app` (v6.0.3) - usado para detectar quando o app volta ao foreground

## Instalação

### 1. Instalar o Plugin de Rede

```bash
npm install @capacitor/network
```

### 2. Sincronizar com Capacitor

Após instalar, sincronize com o projeto Android:

```bash
npx cap sync
```

### 3. Permissões Android

O plugin `@capacitor/network` requer a permissão `ACCESS_NETWORK_STATE` no Android. Esta permissão geralmente já está incluída automaticamente pelo plugin, mas você pode verificar no arquivo:

**`android/app/src/main/AndroidManifest.xml`**

Deve conter:

```xml
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

## Como Funciona

### Detecção de Conexão

O sistema usa uma abordagem em camadas:

1. **Android/iOS Nativo**: Usa o plugin `@capacitor/network` para detectar mudanças de conexão de forma confiável
2. **Web (Fallback)**: Usa `navigator.onLine` e eventos `online`/`offline` do navegador
3. **Verificação Real**: Sempre verifica a conexão real com o Supabase, não apenas o status do dispositivo

### Funcionalidades

- ✅ **Ativação Inteligente**: O serviço só inicia quando há operações pendentes
- ✅ **Desativação Automática**: Para automaticamente quando todas as operações são sincronizadas
- ✅ **Monitoramento Automático**: Verifica conexão a cada 30 segundos (apenas quando ativo)
- ✅ **Detecção de Mudanças**: Detecta quando a conexão é restaurada
- ✅ **Sincronização Automática**: Sincroniza operações pendentes quando detecta conexão
- ✅ **Notificações**: Notifica o usuário sobre o progresso da sincronização
- ✅ **App State**: Detecta quando o app volta ao foreground e verifica se precisa sincronizar

### Fluxo de Ativação

1. **Quando uma operação é salva offline**: O serviço verifica se há pendências e inicia automaticamente
2. **Quando o app é aberto**: Verifica se há pendências e inicia o serviço se necessário
3. **Após sincronização completa**: O serviço para automaticamente quando não há mais pendências
4. **Economia de recursos**: O serviço não consome recursos quando não há nada para sincronizar

## Comportamento no Android

### Com Plugin Instalado

Quando o plugin `@capacitor/network` está instalado:

- ✅ Detecta mudanças de conexão de forma confiável
- ✅ Funciona mesmo quando o app está em background
- ✅ Detecta mudanças de WiFi para dados móveis e vice-versa
- ✅ Não depende de APIs do navegador que podem não funcionar no WebView

### Sem Plugin (Fallback)

Se o plugin não estiver instalado, o sistema usa:

- ⚠️ `navigator.onLine` (pode não ser confiável no Android)
- ⚠️ Eventos `online`/`offline` do navegador
- ✅ Verificação periódica a cada 30 segundos
- ✅ Verificação quando o app volta ao foreground

**Recomendação**: Instale o plugin para melhor experiência no Android.

## Testando

### 1. Teste de Conexão

1. Abra o app
2. Desative o WiFi e dados móveis
3. Tente criar uma inspeção (deve salvar offline)
4. Ative a conexão novamente
5. O sistema deve detectar e sincronizar automaticamente

### 2. Teste de Notificações

1. Certifique-se de que as notificações estão habilitadas
2. Crie algumas inspeções offline
3. Ative a conexão
4. Você deve receber notificações sobre:
   - Início da sincronização
   - Progresso (a cada 25% ou 5 operações)
   - Conclusão (sucesso/parcial/falha)

### 3. Teste de App State

1. Crie inspeções offline
2. Feche o app completamente
3. Ative a conexão
4. Abra o app novamente
5. O sistema deve verificar e sincronizar automaticamente

## Troubleshooting

### Plugin não detecta conexão

1. Verifique se o plugin está instalado: `npm list @capacitor/network`
2. Execute `npx cap sync` novamente
3. Verifique as permissões no `AndroidManifest.xml`
4. Recompile o app Android

### Sincronização não acontece

1. Verifique se há operações pendentes (use o indicador offline)
2. Verifique os logs no console/Logcat
3. Certifique-se de que a conexão com Supabase está funcionando
4. Verifique se as notificações estão habilitadas

### Notificações não aparecem

1. Verifique as permissões de notificação do app
2. Verifique se o serviço de notificações está funcionando
3. Verifique os logs para erros relacionados a notificações

## Logs

O sistema registra logs importantes:

- `background_sync` - Logs do serviço de sincronização
- `online_status` - Logs de detecção de conexão

Para ver os logs no Android:

```bash
adb logcat | grep -E "background_sync|online_status"
```

## Arquitetura

```
backgroundSyncService
├── Monitora conexão (plugin ou fallback)
├── Verifica operações pendentes
├── Sincroniza automaticamente
└── Notifica usuário sobre progresso

useOnlineStatus
├── Detecta status de rede (plugin ou fallback)
├── Verifica conexão real com Supabase
└── Fornece status para componentes React
```

## Próximos Passos

Após instalar o plugin:

1. Execute `npx cap sync`
2. Recompile o app Android
3. Teste a funcionalidade
4. Verifique os logs se houver problemas

