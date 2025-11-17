# 🔧 Configuração do Sentry para Monitoramento de Erros

## 📋 Sobre

O sistema de logging já está preparado para integração com Sentry. Esta documentação explica como configurar o Sentry no projeto.

## 🚀 Instalação

### 1. Instalar Dependências

```bash
npm install @sentry/react @sentry/tracing
```

### 2. Ativar Sentry no Código

Após instalar o Sentry, atualize `src/lib/sentry.ts`:

Substitua a função `initSentry()` por:

```typescript
export function initSentry() {
  if (!import.meta.env.PROD || !import.meta.env.VITE_SENTRY_DSN) {
    return;
  }

  if (typeof window === 'undefined') {
    return;
  }

  // Carregar Sentry dinamicamente
  import('@sentry/react').then((Sentry) => {
    try {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        integrations: [],
        tracesSampleRate: 0.1,
        release: import.meta.env.VITE_APP_VERSION || 'unknown',
        environment: import.meta.env.MODE || 'production',
        beforeSend(event: any, hint: any) {
          if (event.exception) {
            const error = hint.originalException;
            if (error instanceof Error) {
              if (error.message.includes('Failed to fetch') || 
                  error.message.includes('NetworkError') ||
                  error.message.includes('CORS')) {
                return null;
              }
            }
          }
          
          if (event.request) {
            if (event.request.headers) {
              delete event.request.headers.Authorization;
              delete event.request.headers['x-api-key'];
            }
            delete event.request.cookies;
          }
          
          return event;
        },
      });
    } catch (error) {
      // Falha silenciosa
    }
  }).catch(() => {
    // Sentry não instalado
  });
}
```

### 3. Inicializar no main.tsx

```typescript
import { initSentry } from './lib/sentry';

// Inicializar Sentry antes de tudo
initSentry();

// ... resto do código
```

### 4. Adicionar Variáveis de Ambiente

No arquivo `.env`:

```env
VITE_SENTRY_DSN=https://seu-dsn@sentry.io/projeto-id
VITE_APP_VERSION=1.0.0
```

## 📊 Funcionalidades

### Monitoramento Automático

O sistema já está configurado para enviar automaticamente:

- ✅ Erros capturados pelo ErrorBoundary
- ✅ Erros processados pelo errorHandler
- ✅ Logs de erro do sistema de logging
- ✅ Performance de transações (10% das requisições)

### Contexto Adicional

Cada erro enviado inclui:

- **Contexto**: Onde o erro ocorreu (auth, equipment, etc.)
- **Dados extras**: Informações relevantes do erro
- **Timestamp**: Quando o erro ocorreu
- **User Agent**: Informações do navegador
- **URL**: Página onde o erro ocorreu

## 🔒 Privacidade

### Dados Sensíveis

O Sentry não captura automaticamente:

- ❌ Senhas
- ❌ Tokens de autenticação
- ❌ Dados pessoais sensíveis

### Filtros Recomendados

Adicione filtros no `beforeSend` para remover dados sensíveis:

```typescript
beforeSend(event, hint) {
  // Remover dados sensíveis
  if (event.request) {
    delete event.request.headers?.Authorization;
    delete event.request.cookies;
  }
  
  // Filtrar erros conhecidos
  if (event.exception) {
    const error = hint.originalException;
    if (error instanceof Error) {
      // Não enviar erros de rede offline
      if (error.message.includes('Failed to fetch')) {
        return null;
      }
    }
  }
  
  return event;
}
```

## 📈 Dashboard

Após configurar, você terá acesso a:

- **Issues**: Lista de erros agrupados
- **Performance**: Métricas de performance
- **Releases**: Rastreamento de versões
- **Users**: Impacto nos usuários
- **Alerts**: Notificações de erros críticos

## 🧪 Testando

### Teste Manual

```typescript
// Em desenvolvimento, você pode testar:
if (import.meta.env.DEV) {
  // Forçar um erro para testar
  throw new Error('Teste de erro do Sentry');
}
```

### Verificar Configuração

```typescript
// Verificar se Sentry está inicializado
if (typeof window !== 'undefined' && (window as any).Sentry) {
  console.log('Sentry configurado:', (window as any).Sentry.getCurrentHub());
}
```

## 📚 Documentação

- [Sentry React](https://docs.sentry.io/platforms/javascript/guides/react/)
- [Sentry Performance](https://docs.sentry.io/product/performance/)
- [Sentry Filtering](https://docs.sentry.io/platforms/javascript/configuration/filtering/)

## ⚠️ Importante

- O Sentry só funciona em **produção** (quando `VITE_SENTRY_DSN` está configurado)
- Em desenvolvimento, os erros continuam sendo logados no console
- O sistema funciona mesmo sem Sentry configurado (fail-safe)

## 🔄 Integração Automática

O sistema de logging (`src/utils/logger.ts`) e o error handler (`src/utils/errorHandler.ts`) já estão integrados e enviarão erros automaticamente para o Sentry quando configurado.

