# 🔧 Configuração da Edge Function para Exclusão de Conta

## 📋 Sobre

Esta Edge Function permite a exclusão completa da conta de autenticação do Supabase Auth, complementando a exclusão de dados do banco de dados.

## 🚀 Instalação

### 1. Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2. Fazer Login no Supabase

```bash
supabase login
```

### 3. Vincular ao Projeto

```bash
supabase link --project-ref seu-project-ref
```

### 4. Deploy da Função

```bash
supabase functions deploy delete-user
```

## 🔐 Configuração de Variáveis de Ambiente

A função requer as seguintes variáveis de ambiente no Supabase:

1. Acesse o Dashboard do Supabase
2. Vá em **Settings > Edge Functions**
3. Adicione as variáveis:
   - `SUPABASE_URL` - URL do seu projeto
   - `SUPABASE_ANON_KEY` - Chave anônima
   - `SUPABASE_SERVICE_ROLE_KEY` - Service Role Key (⚠️ SECRETO)

## 📝 Uso no Frontend

A função já está integrada em `src/utils/accountDeletion.ts`. Ela será chamada automaticamente quando o usuário confirmar a exclusão da conta.

### Exemplo de Chamada Manual

```typescript
import { supabase } from '../lib/supabase';

async function deleteAuthAccount(userId: string) {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error('Usuário não autenticado');
  }

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user`,
    {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || 'Erro ao deletar conta');
  }

  return await response.json();
}
```

## 🔒 Segurança

- ✅ Validação de token de autenticação
- ✅ Verificação de propriedade (usuário só pode deletar própria conta)
- ✅ Uso de service role key apenas no servidor
- ✅ CORS configurado corretamente

## ⚠️ Importante

- A Service Role Key é **SECRETA** e nunca deve ser exposta no frontend
- A função valida que o usuário está tentando deletar sua própria conta
- A exclusão é **IRREVERSÍVEL**

## 🧪 Testando

```bash
# Testar localmente
supabase functions serve delete-user

# Testar em produção
curl -X POST https://seu-projeto.supabase.co/functions/v1/delete-user \
  -H "Authorization: Bearer SEU_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"userId": "user-id"}'
```

## 📚 Documentação

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Supabase Auth Admin API](https://supabase.com/docs/reference/javascript/auth-admin-deleteuser)

