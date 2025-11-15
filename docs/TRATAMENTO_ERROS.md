# Sistema de Tratamento de Erros

Este documento descreve o sistema centralizado de tratamento de erros implementado no ISF IA App.

## 📋 Visão Geral

O sistema de tratamento de erros fornece:
- ✅ Tratamento centralizado de erros
- ✅ Toast notifications para feedback visual
- ✅ Mensagens amigáveis ao usuário
- ✅ Logging estruturado (preparado para Sentry)
- ✅ Mapeamento de erros do Supabase para mensagens legíveis

## 🚀 Uso Básico

### Hook `useErrorHandler`

O hook mais simples para usar em componentes React:

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

const MyComponent = () => {
  const { handleError, handleAsync, executeWithFeedback, showSuccess } = useErrorHandler();

  // Tratamento simples de erro
  const handleClick = async () => {
    try {
      await someOperation();
      showSuccess('Operação realizada com sucesso!');
    } catch (error) {
      handleError(error, 'equipment');
    }
  };

  // Tratamento assíncrono com retorno
  const loadData = async () => {
    const { data, error } = await handleAsync(
      () => fetchEquipment(),
      'equipment'
    );

    if (error) {
      // Erro já foi mostrado no toast
      return;
    }

    // Usar data...
  };

  // Executar com feedback automático
  const saveData = async () => {
    const result = await executeWithFeedback(
      () => saveEquipment(data),
      'equipment',
      'Equipamento salvo com sucesso!'
    );

    if (result) {
      // Sucesso - toast já foi mostrado
    }
  };
};
```

## 📚 Contextos de Erro

Os contextos ajudam a categorizar erros e fornecer mensagens mais específicas:

- `auth` - Erros de autenticação
- `equipment` - Erros relacionados a equipamentos
- `inspection` - Erros de inspeções
- `profile` - Erros de perfil do usuário
- `storage` - Erros de upload/download
- `network` - Erros de rede
- `validation` - Erros de validação
- `permission` - Erros de permissão
- `unknown` - Erros desconhecidos

## 🎨 Toast Notifications

O sistema inclui toast notifications automáticas:

```typescript
const { showSuccess, showError, showWarning, showInfo } = useErrorHandler();

// Diferentes tipos de toast
showSuccess('Operação realizada com sucesso!');
showError('Erro ao processar solicitação');
showWarning('Atenção: dados podem estar desatualizados');
showInfo('Informação importante');
```

### Personalizar Duração

```typescript
showError('Erro crítico', 10000); // 10 segundos
showSuccess('Sucesso!', 3000); // 3 segundos
```

## 🔧 Funções Utilitárias

### `processError`

Processa um erro e retorna um objeto `AppError`:

```typescript
import { processError } from '../utils/errorHandler';

const error = processError(originalError, 'equipment', 'Mensagem customizada');
console.log(error.message); // Mensagem processada
console.log(error.context); // 'equipment'
console.log(error.userMessage); // Mensagem amigável
```

### `handleAsyncError`

Trata operações assíncronas:

```typescript
import { handleAsyncError } from '../utils/errorHandler';

const { data, error } = await handleAsyncError(
  () => fetchData(),
  'equipment',
  (msg) => showError(msg) // Callback opcional
);
```

### Validações de Tipo de Erro

```typescript
import { isNetworkError, isPermissionError } from '../utils/errorHandler';

if (isNetworkError(error)) {
  // Tratar erro de rede
}

if (isPermissionError(error)) {
  // Tratar erro de permissão
}
```

## 📝 Exemplos de Uso

### Exemplo 1: Página de Autenticação

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

const AuthPage = () => {
  const { handleError, showSuccess } = useErrorHandler();

  const handleLogin = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      showSuccess('Login realizado com sucesso!');
    } catch (error) {
      handleError(error, 'auth');
    }
  };
};
```

### Exemplo 2: Operação com Equipamento

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

const EquipmentPage = () => {
  const { executeWithFeedback } = useErrorHandler();

  const saveEquipment = async (data: EquipmentData) => {
    const result = await executeWithFeedback(
      () => saveEquipmentToDatabase(data),
      'equipment',
      'Equipamento salvo com sucesso!',
      'Erro ao salvar equipamento'
    );

    if (result) {
      // Navegar ou atualizar UI
    }
  };
};
```

### Exemplo 3: Upload de Arquivo

```typescript
import { useErrorHandler } from '../hooks/useErrorHandler';

const UploadComponent = () => {
  const { handleAsync } = useErrorHandler();

  const uploadFile = async (file: File) => {
    const { data, error } = await handleAsync(
      () => uploadToStorage(file),
      'storage'
    );

    if (error) {
      // Erro já foi mostrado no toast
      return;
    }

    // Usar URL retornada
    console.log('File uploaded:', data);
  };
};
```

## 🗺️ Mapeamento de Erros do Supabase

O sistema mapeia automaticamente erros comuns do Supabase:

| Erro | Mensagem Amigável |
|------|-------------------|
| `Failed to fetch` | Erro de conexão. Verifique sua internet. |
| `Invalid login credentials` | E-mail ou senha incorretos. |
| `Email not confirmed` | Por favor, confirme seu e-mail. |
| `PGRST301` | Você não tem permissão para esta ação. |
| `PGRST116` | Registro não encontrado. |
| `23505` (Unique) | Este registro já existe. |
| `File size exceeds` | O arquivo é muito grande (máx: 5MB). |

## 🔍 Logging

Em desenvolvimento, os erros são logados no console com informações estruturadas:

```typescript
🚨 Erro capturado: {
  message: "Erro ao processar equipamento: ...",
  context: "equipment",
  code: "PGRST301",
  timestamp: "2025-01-20T10:30:00.000Z",
  userAgent: "...",
  url: "https://..."
}
```

### Preparação para Produção

Para adicionar Sentry ou outro serviço de monitoramento:

1. Instalar Sentry:
```bash
npm install @sentry/react
```

2. Atualizar `src/utils/errorHandler.ts`:
```typescript
import * as Sentry from '@sentry/react';

export const logError = (error: AppError, additionalInfo?: Record<string, any>) => {
  // ... código existente ...

  if (import.meta.env.PROD) {
    Sentry.captureException(error.originalError || error.message, {
      tags: { context: error.context },
      extra: logData,
    });
  }
};
```

## 🎯 Boas Práticas

1. **Sempre use contextos apropriados** para melhor categorização
2. **Forneça mensagens customizadas** quando necessário
3. **Use `executeWithFeedback`** para operações que precisam de feedback
4. **Não duplique tratamento de erro** - o sistema já mostra toasts
5. **Use validações de tipo** (`isNetworkError`, etc.) para lógica condicional

## 📦 Componentes

### ToastContainer

O `ToastContainer` é automaticamente renderizado pelo `ToastProvider` e aparece no canto superior direito da tela.

### Personalização

Para personalizar a aparência dos toasts, edite `src/contexts/ToastContext.tsx`.

## 🔄 Migração de Código Existente

Para migrar código existente:

**Antes:**
```typescript
try {
  await operation();
} catch (error: any) {
  console.error('Erro:', error);
  setError(error.message || 'Erro desconhecido');
}
```

**Depois:**
```typescript
const { handleError } = useErrorHandler();

try {
  await operation();
} catch (error) {
  handleError(error, 'equipment');
  // Toast já foi mostrado automaticamente
}
```

## 📚 Referências

- [ToastContext](./src/contexts/ToastContext.tsx) - Contexto de toast
- [errorHandler](./src/utils/errorHandler.ts) - Utilitários de erro
- [useErrorHandler](./src/hooks/useErrorHandler.ts) - Hook React

---

**Última atualização:** Janeiro 2025

