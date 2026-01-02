# 🔐 Implementação Técnica: Autenticação Google com Supabase (Android)

Este documento explica **como implementar corretamente** a autenticação do Google em um app Android usando Supabase Auth com Capacitor, incluindo o fluxo PKCE e deep links.

## 📋 Índice

1. [Visão Geral do Fluxo](#visão-geral-do-fluxo)
2. [Configuração do Supabase Client](#configuração-do-supabase-client)
3. [Implementação do Código](#implementação-do-código)
4. [Configuração do Android](#configuração-do-android)
5. [Configuração do Supabase Dashboard](#configuração-do-supabase-dashboard)
6. [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral do Fluxo

### Fluxo PKCE (Proof Key for Code Exchange)

O fluxo PKCE é o padrão moderno e seguro para autenticação OAuth em apps móveis:

```
1. App inicia login → Supabase gera code_verifier e code_challenge
2. App abre navegador → Usuário autentica no Google
3. Google redireciona → Supabase processa e retorna código PKCE
4. Supabase redireciona → Deep link: com.isfia.app://google-auth?code=...
5. Android intercepta → App recebe deep link via appUrlOpen
6. App extrai código → Troca código por sessão via exchangeCodeForSession()
7. Sessão estabelecida → Usuário logado e redirecionado para home
```

### Por que PKCE?

- ✅ **Mais seguro**: Não expõe tokens na URL
- ✅ **Melhor para mobile**: Funciona melhor com deep links
- ✅ **Padrão moderno**: Recomendado pelo OAuth 2.1
- ✅ **Suportado nativamente**: Supabase suporta PKCE

---

## ⚙️ Configuração do Supabase Client

### 1. Configurar `flowType: 'pkce'`

No arquivo `src/lib/supabase.ts`, configure o cliente Supabase com PKCE:

```typescript
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey,
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      flowType: 'pkce', // ✅ IMPORTANTE: Usar PKCE para mobile
    },
  }
)
```

**⚠️ CRÍTICO**: O `flowType: 'pkce'` é essencial para apps móveis. O fluxo implícito (`'implicit'`) não funciona bem com deep links no Capacitor.

---

## 💻 Implementação do Código

### 1. Função de Início do Login (`handleGoogleSignIn`)

```typescript
import { App } from '@capacitor/app';
import { Browser } from '@capacitor/browser';

const handleGoogleSignIn = async () => {
  setLoading(true);
  setError(null);

  try {
    // Detectar se está rodando no Capacitor (Android/iOS)
    const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || false;
    
    // Deep link para mobile (deve corresponder ao AndroidManifest)
    const mobileRedirectUrl = 'com.isfia.app://google-auth';
    
    let redirectUrl: string;
    
    if (isCapacitor) {
      // Para Capacitor, usar custom scheme deep link
      redirectUrl = mobileRedirectUrl;
    } else {
      // No navegador, usar a origem normal
      redirectUrl = `${window.location.origin}/auth`;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: redirectUrl,
        // Para Capacitor, não redirecionar automaticamente
        ...(isCapacitor && {
          skipBrowserRedirect: true,
        }),
      },
    });

    if (error) {
      throw error;
    }

    // Se estiver no Capacitor e tiver URL, abrir no Browser plugin
    if (isCapacitor && data?.url) {
      await Browser.open({ 
        url: data.url,
        windowName: '_self',
      });
    }
  } catch (err: any) {
    setError('Erro ao fazer login com Google');
    setLoading(false);
  }
};
```

**Pontos importantes:**
- ✅ Detecta automaticamente se está no Capacitor
- ✅ Usa custom scheme (`com.isfia.app://google-auth`) para mobile
- ✅ Usa `skipBrowserRedirect: true` no Capacitor para controlar o navegador
- ✅ Abre o OAuth URL no plugin `Browser` do Capacitor

### 2. Listener para Deep Links (`appUrlOpen`)

```typescript
import { App } from '@capacitor/app';

useEffect(() => {
  const isCapacitor = (window as any).Capacitor?.isNativePlatform?.() || false;
  
  if (!isCapacitor) {
    return; // Só funciona no Capacitor
  }

  const handleAppUrl = async (data: { url: string }) => {
    logger.info('[Auth] App recebeu URL após retornar do navegador', 'auth', { url: data.url });
    
    // Verificar se é um callback OAuth
    const isOAuthCallback = data.url.includes('code=') || 
                           data.url.includes('google-auth');
    
    if (isOAuthCallback) {
      // Extrair o código PKCE da URL
      let code: string | null = null;
      
      try {
        // O deep link pode ser: com.isfia.app://google-auth?code=...
        // Substituir custom scheme por https temporariamente para parsing
        const urlForParsing = data.url.replace('com.isfia.app://', 'https://com.isfia.app/');
        const urlObj = new URL(urlForParsing);
        code = urlObj.searchParams.get('code') || urlObj.hash.split('code=')[1]?.split('&')[0];
      } catch (urlError) {
        // Fallback: parsing manual com regex
        const codeMatch = data.url.match(/[?&#]code=([^&]+)/);
        if (codeMatch) {
          code = decodeURIComponent(codeMatch[1]);
        }
      }
      
      if (code) {
        // Trocar código PKCE por sessão
        try {
          const { data: sessionData, error } = await supabase.auth.exchangeCodeForSession(code);
          
          if (sessionData.session && !error) {
            logger.info('[Auth] ✅ Sessão estabelecida via PKCE!', 'auth');
            window.history.replaceState({}, '', '/auth');
            navigate('/');
            setLoading(false);
            return;
          } else {
            logger.error('[Auth] Falha na troca de código PKCE', 'auth', error);
          }
        } catch (err) {
          logger.error('[Auth] Erro ao trocar código PKCE', 'auth', err);
        }
      }
      
      // Fallback: polling para verificar sessão
      // (caso o Supabase tenha processado automaticamente)
      const maxAttempts = 10;
      let attempts = 0;
      
      const checkSession = async (): Promise<boolean> => {
        attempts++;
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (session && !error) {
          logger.info('[Auth] Sessão detectada via polling', 'auth');
          navigate('/');
          setLoading(false);
          return true;
        }
        return false;
      };
      
      // Tentar imediatamente
      if (await checkSession()) return;
      
      // Tentar novamente a cada 500ms
      for (let i = 0; i < maxAttempts - 1; i++) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (await checkSession()) return;
      }
      
      logger.error('[Auth] ❌ Timeout: sessão não estabelecida', 'auth');
      setError('Erro ao processar login. Tente novamente.');
      setLoading(false);
    }
  };

  // Registrar listener
  App.addListener('appUrlOpen', handleAppUrl);

  return () => {
    App.removeAllListeners();
  };
}, [navigate]);
```

**Pontos importantes:**
- ✅ Extrai o código PKCE do deep link (suporta `?code=` e `#code=`)
- ✅ Usa `exchangeCodeForSession()` para trocar código por sessão
- ✅ Tem fallback com polling caso o Supabase processe automaticamente
- ✅ Limpa a URL após sucesso

### 3. Listener para Mudanças de Estado (`onAuthStateChange`)

```typescript
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
    logger.info(`[Auth] Auth state changed: ${event}`, 'auth', { hasSession: !!session });
    
    if (event === 'SIGNED_IN' && session) {
      logger.info('[Auth] Sessão estabelecida após OAuth, redirecionando...', 'auth');
      window.history.replaceState({}, '', '/auth');
      navigate('/');
    }
  });

  return () => {
    subscription.unsubscribe();
  };
}, [navigate]);
```

**Pontos importantes:**
- ✅ Detecta quando a sessão é estabelecida
- ✅ Redireciona automaticamente para a home
- ✅ Limpa a URL antes de redirecionar

### 4. Polling de Sessão (Fallback)

```typescript
useEffect(() => {
  if (session) {
    navigate('/');
    return;
  }

  // Polling para verificar sessão a cada 500ms
  // Útil para OAuth callbacks que podem ter delay
  const interval = setInterval(async () => {
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      if (currentSession) {
        logger.info('[Auth] Sessão detectada via polling, redirecionando...', 'auth');
        clearInterval(interval);
        window.history.replaceState({}, '', '/auth');
        navigate('/');
      }
    } catch (err) {
      // Ignorar erros no polling
    }
  }, 500);

  return () => clearInterval(interval);
}, [session, navigate]);
```

**Pontos importantes:**
- ✅ Polling como fallback caso outros listeners não funcionem
- ✅ Verifica sessão a cada 500ms
- ✅ Para automaticamente quando sessão é detectada

---

## 🤖 Configuração do Android

### 1. AndroidManifest.xml

Adicione um `intent-filter` na `MainActivity` para capturar deep links:

```xml
<activity
    android:name=".MainActivity"
    android:exported="true"
    android:launchMode="singleTask">
    
    <!-- Intent filter padrão -->
    <intent-filter>
        <action android:name="android.intent.action.MAIN" />
        <category android:name="android.intent.category.LAUNCHER" />
    </intent-filter>

    <!-- Deep Link para OAuth Google Login -->
    <intent-filter>
        <action android:name="android.intent.action.VIEW" />
        <category android:name="android.intent.category.DEFAULT" />
        <category android:name="android.intent.category.BROWSABLE" />
        <!-- Aceita: com.isfia.app://google-auth -->
        <data android:scheme="com.isfia.app" android:host="google-auth" />
    </intent-filter>
</activity>
```

**Pontos importantes:**
- ✅ `android:launchMode="singleTask"` garante que o app não crie múltiplas instâncias
- ✅ `android:exported="true"` permite que o app receba intents externos
- ✅ O `scheme` (`com.isfia.app`) deve corresponder ao `appId` no `capacitor.config.ts`
- ✅ O `host` (`google-auth`) deve corresponder ao deep link usado no código

### 2. capacitor.config.ts

```typescript
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.isfia.app', // ✅ Deve corresponder ao scheme no AndroidManifest
  appName: 'ISF IA',
  webDir: 'dist',
  server: {
    androidScheme: 'https' // Permite deep links HTTPS
  },
};
```

**Pontos importantes:**
- ✅ O `appId` deve corresponder ao `scheme` no AndroidManifest
- ✅ `androidScheme: 'https'` permite deep links HTTPS (opcional, mas recomendado)

---

## 🔧 Configuração do Supabase Dashboard

### 1. Adicionar Redirect URL

No Supabase Dashboard:

1. Acesse: https://app.supabase.com
2. Vá em **Authentication** > **URL Configuration**
3. Em **Redirect URLs**, adicione:
   ```
   com.isfia.app://google-auth
   ```
4. Clique em **Save**

**⚠️ IMPORTANTE**: 
- O Supabase pode não aceitar custom schemes em alguns casos
- Se der erro, use App Links: `https://com.isfia.app/auth`
- Se usar App Links, atualize o `AndroidManifest.xml` para usar `https` scheme

### 2. Verificar Configuração do Google Provider

1. Vá em **Authentication** > **Providers** > **Google**
2. Verifique se está habilitado
3. Verifique se Client ID e Secret estão configurados
4. A **Callback URL** deve ser: `https://<projeto-ref>.supabase.co/auth/v1/callback`

---

## 🐛 Troubleshooting

### Problema: Deep link não é recebido

**Sintomas:**
- Login abre o navegador
- Após autenticar, o app não retorna
- Logs não mostram `[Auth] App recebeu URL após retornar do navegador`

**Soluções:**

1. **Verificar AndroidManifest.xml:**
   ```xml
   <!-- Verificar se o intent-filter está correto -->
   <data android:scheme="com.isfia.app" android:host="google-auth" />
   ```

2. **Verificar se o appId corresponde:**
   ```typescript
   // capacitor.config.ts
   appId: 'com.isfia.app' // Deve ser igual ao scheme
   ```

3. **Testar deep link manualmente:**
   ```bash
   adb shell am start -a android.intent.action.VIEW -d "com.isfia.app://google-auth"
   ```
   Se o app não abrir, o problema está no AndroidManifest.

### Problema: Código PKCE não é extraído

**Sintomas:**
- Deep link é recebido
- Logs mostram `[Auth] App recebeu URL após retornar do navegador`
- Mas não mostra `[Auth] Código PKCE extraído`

**Soluções:**

1. **Verificar formato da URL:**
   ```typescript
   // A URL deve ser: com.isfia.app://google-auth?code=...
   // Ou: com.isfia.app://google-auth#code=...
   ```

2. **Adicionar logs de debug:**
   ```typescript
   logger.info('[Auth] URL recebida', 'auth', { 
     url: data.url,
     hasCode: data.url.includes('code='),
     urlLength: data.url.length
   });
   ```

3. **Verificar parsing:**
   - O código tenta primeiro com `new URL()` (substituindo scheme)
   - Se falhar, usa regex como fallback
   - Verifique se ambos os métodos estão funcionando

### Problema: `exchangeCodeForSession` falha

**Sintomas:**
- Código é extraído
- Mas `exchangeCodeForSession()` retorna erro

**Soluções:**

1. **Verificar se o código não está expirado:**
   - Códigos PKCE expiram rapidamente
   - O código deve ser usado imediatamente após receber

2. **Verificar se o `flowType` está como `pkce`:**
   ```typescript
   // src/lib/supabase.ts
   flowType: 'pkce' // ✅ Deve ser 'pkce', não 'implicit'
   ```

3. **Verificar Redirect URL no Supabase:**
   - Deve estar exatamente: `com.isfia.app://google-auth`
   - Sem espaços, sem barra no final

### Problema: Sessão não é estabelecida

**Sintomas:**
- `exchangeCodeForSession()` retorna sucesso
- Mas `getSession()` retorna `null`

**Soluções:**

1. **Aguardar um momento:**
   ```typescript
   // Após exchangeCodeForSession, aguardar antes de verificar
   await new Promise(resolve => setTimeout(resolve, 500));
   const { data: { session } } = await supabase.auth.getSession();
   ```

2. **Usar polling:**
   - O código já tem polling implementado
   - Verifique se está funcionando corretamente

3. **Verificar `persistSession`:**
   ```typescript
   // src/lib/supabase.ts
   persistSession: true // ✅ Deve estar true
   ```

### Problema: Múltiplos redirecionamentos

**Sintomas:**
- App redireciona múltiplas vezes
- Logs mostram múltiplos `[Auth] Sessão estabelecida`

**Soluções:**

1. **Adicionar flag para evitar múltiplos redirecionamentos:**
   ```typescript
   const [isRedirecting, setIsRedirecting] = useState(false);
   
   if (isRedirecting) return; // Evitar múltiplos redirecionamentos
   setIsRedirecting(true);
   navigate('/');
   ```

2. **Limpar listeners:**
   ```typescript
   return () => {
     App.removeAllListeners();
     Browser.removeAllListeners();
   };
   ```

---

## ✅ Checklist de Implementação

Use este checklist para garantir que tudo está implementado corretamente:

### Configuração
- [ ] `flowType: 'pkce'` no `supabase.ts`
- [ ] `persistSession: true` no `supabase.ts`
- [ ] `appId` no `capacitor.config.ts` corresponde ao scheme
- [ ] Intent filter no `AndroidManifest.xml`
- [ ] Redirect URL adicionada no Supabase Dashboard

### Código
- [ ] `handleGoogleSignIn` detecta Capacitor
- [ ] `handleGoogleSignIn` usa `skipBrowserRedirect: true` no Capacitor
- [ ] `handleGoogleSignIn` abre URL no plugin `Browser`
- [ ] Listener `appUrlOpen` registrado
- [ ] Código PKCE extraído corretamente
- [ ] `exchangeCodeForSession()` chamado
- [ ] Polling de sessão implementado
- [ ] `onAuthStateChange` listener configurado

### Testes
- [ ] Login funciona no navegador (desenvolvimento)
- [ ] Login funciona no app Android
- [ ] Deep link é recebido após autenticação
- [ ] Código PKCE é extraído
- [ ] Sessão é estabelecida
- [ ] Usuário é redirecionado para home
- [ ] Sessão persiste após fechar app

---

## 📚 Recursos Adicionais

- [Documentação Supabase - PKCE Flow](https://supabase.com/docs/guides/auth/auth-helpers/pkce-flow)
- [Documentação Capacitor - Deep Links](https://capacitorjs.com/docs/guides/deep-links)
- [OAuth 2.1 - PKCE](https://oauth.net/2/pkce/)
- [Documentação Android - App Links](https://developer.android.com/training/app-links)

---

**Última atualização**: Janeiro 2025

