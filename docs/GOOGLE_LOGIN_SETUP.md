# 🔐 Guia: Configurar Login com Google

Este guia explica passo a passo como configurar o login com Google no app ISF IA usando Supabase Auth.

## 📋 Visão Geral

O login com Google permite que os usuários façam login usando suas contas do Google, sem precisar criar uma senha. O Supabase gerencia toda a autenticação OAuth automaticamente.

## 🎯 Pré-requisitos

1. ✅ Projeto Supabase configurado (veja [CONFIGURAR_SUPABASE.md](./CONFIGURAR_SUPABASE.md))
2. ✅ Conta Google (para criar as credenciais OAuth)
3. ✅ App configurado e rodando

## 📝 Passo 1: Criar Credenciais OAuth no Google Cloud Console

### 1.1 Acessar o Google Cloud Console

1. Acesse: https://console.cloud.google.com
2. Faça login com sua conta Google
3. Selecione um projeto existente ou crie um novo:
   - Clique em **Selecionar projeto** no topo
   - Clique em **Novo projeto**
   - Digite um nome (ex: "ISF IA App")
   - Clique em **Criar**

### 1.2 Habilitar a API do Google+

1. No menu lateral, vá em **APIs e Serviços** > **Biblioteca**
2. Procure por "Google+ API" ou "Google Identity"
3. Clique em **Google+ API** ou **Google Identity Services API**
4. Clique em **Habilitar**

### 1.3 Configurar Tela de Consentimento OAuth

1. Vá em **APIs e Serviços** > **Tela de consentimento OAuth**
2. Selecione **Externo** (a menos que você tenha uma conta Google Workspace)
3. Clique em **Criar**
4. Preencha os campos obrigatórios:
   - **Nome do app**: ISF IA
   - **Email de suporte ao usuário**: seu-email@gmail.com
   - **Email de contato do desenvolvedor**: seu-email@gmail.com
5. Clique em **Salvar e continuar**
6. Na tela de **Escopos**, clique em **Salvar e continuar** (pode deixar vazio)
7. Na tela de **Usuários de teste**, adicione seu email para testes, depois clique em **Salvar e continuar**
8. Na tela de **Resumo**, revise e clique em **Voltar ao painel**

### 1.4 Criar Credenciais OAuth 2.0

1. Vá em **APIs e Serviços** > **Credenciais**
2. Clique em **+ Criar credenciais** > **ID do cliente OAuth**
3. Selecione **Aplicativo Web** como tipo de aplicativo
4. Configure:
   - **Nome**: ISF IA Web Client
   - **Origens JavaScript autorizadas**: 
     - Para desenvolvimento local: `http://localhost:5173` (ou a porta do seu Vite)
     - Para produção: `https://seu-dominio.com`
   - **URIs de redirecionamento autorizados**:
     - Primeiro, obtenha a URL de callback do Supabase (veja Passo 2)
     - Adicione: `https://<seu-projeto-ref>.supabase.co/auth/v1/callback`
5. Clique em **Criar**
6. **IMPORTANTE**: Copie e guarde:
   - **ID do cliente** (Client ID) - você precisará disso
   - **Segredo do cliente** (Client Secret) - você precisará disso

⚠️ **ATENÇÃO**: Guarde essas credenciais em local seguro. Você precisará delas no próximo passo.

## 🔧 Passo 2: Configurar Google no Supabase

### 2.1 Obter URL de Callback

1. Acesse seu projeto no [Supabase Dashboard](https://app.supabase.com)
2. Vá em **Authentication** (ícone de cadeado) no menu lateral
3. Clique em **Providers** (Provedores)
4. Clique em **Google** para expandir
5. Você verá a **Callback URL** - copie essa URL
   - Formato: `https://<seu-projeto-ref>.supabase.co/auth/v1/callback`
6. Volte ao Google Cloud Console e adicione essa URL nas **URIs de redirecionamento autorizados** (se ainda não adicionou)

### 2.2 Configurar Google no Supabase Dashboard

1. No painel do Supabase, em **Authentication** > **Providers** > **Google**:
2. Ative o toggle **Enable Google provider**
3. Cole o **Client ID** (ID do cliente) do Google Cloud Console
4. Cole o **Client Secret** (Segredo do cliente) do Google Cloud Console
5. Clique em **Save** (Salvar)

✅ **Pronto!** O Google está configurado no Supabase.

## ✉️ Confirmação de Email com Google Login

### ⚠️ Importante: Email Confirmado Automaticamente

**Quando alguém faz login com Google, a confirmação de email NÃO é necessária!**

O Supabase automaticamente marca o email como **confirmado** quando o login é feito via OAuth (Google, Facebook, etc.), porque:

1. ✅ O Google já verificou o email da pessoa antes de permitir a conta
2. ✅ O Supabase confia na verificação do Google
3. ✅ O usuário pode usar o app imediatamente após o login

**Diferença entre os métodos:**

| Método de Login | Confirmação de Email Necessária? |
|----------------|----------------------------------|
| **Email/Senha** | ✅ Sim - precisa confirmar email |
| **Google OAuth** | ❌ Não - confirmado automaticamente |
| **Outros OAuth** | ❌ Não - confirmado automaticamente |

### 📧 Email de Boas-Vindas

Se você configurou o sistema de emails de boas-vindas (Edge Function `enviar-email-boas-vindas`), o email será enviado normalmente quando:

- ✅ Usuário faz login pela primeira vez com Google
- ✅ Um novo perfil é criado no banco de dados

O email de boas-vindas é enviado independentemente do método de login usado.

## 🔗 Vinculação de Contas (Email + Google)

### ⚠️ Situação: Conta com Email/Senha e Login com Google

**Pergunta comum**: Se uma pessoa cria uma conta com email/senha (ex: `usuario@gmail.com`) e depois faz login com Google usando o mesmo email, os dados são vinculados?

### ✅ Resposta: Sim, mas com condições!

O Supabase **vincula automaticamente** as contas quando:

1. ✅ **O email é o mesmo** em ambas as contas
2. ✅ **O email está confirmado** na conta de email/senha
3. ✅ **O usuário faz login com Google** pela primeira vez

**Resultado**: Os dados ficam na mesma conta! O usuário pode fazer login com qualquer um dos métodos.

### ❌ Quando NÃO vincula automaticamente

O Supabase **NÃO vincula** se:

1. ❌ O email da conta email/senha **não foi confirmado**
   - **Motivo**: Segurança - evita ataques de "account takeover"
   - **Solução**: Usuário precisa confirmar o email primeiro

2. ❌ O email é diferente entre as contas
   - **Motivo**: São contas diferentes
   - **Solução**: Não é possível vincular contas com emails diferentes

### 🔄 Fluxo de Vinculação Automática

```
1. Usuário cria conta: email@gmail.com + senha
   ↓
2. Usuário confirma email (clica no link)
   ↓
3. Usuário faz login com Google usando email@gmail.com
   ↓
4. Supabase detecta: "Já existe conta com este email confirmado"
   ↓
5. ✅ Vincula automaticamente!
   ↓
6. Agora o usuário pode fazer login com:
   - Email/senha OU
   - Google OAuth
   ↓
7. Todos os dados ficam na mesma conta
```

### 📊 Exemplo Prático

**Cenário 1: Email Confirmado** ✅
```
1. Maria cria conta: maria@gmail.com + senha123
2. Maria confirma email (clica no link)
3. Maria faz login com Google (maria@gmail.com)
4. ✅ Contas vinculadas automaticamente!
5. Maria pode usar qualquer método de login
6. Todos os equipamentos/inspeções ficam na mesma conta
```

**Cenário 2: Email NÃO Confirmado** ❌
```
1. João cria conta: joao@gmail.com + senha123
2. João NÃO confirma email (não clicou no link)
3. João tenta fazer login com Google (joao@gmail.com)
4. ❌ Supabase cria uma NOVA conta separada
5. ⚠️ Agora existem 2 contas diferentes com o mesmo email!
6. ⚠️ Os dados ficam separados
```

### 🛠️ Solução para Email Não Confirmado

Se o usuário não confirmou o email e tentou fazer login com Google:

1. **Opção 1**: Usuário confirma o email primeiro, depois faz login com Google
2. **Opção 2**: Implementar vinculação manual (requer código adicional)
3. **Opção 3**: Mostrar mensagem educativa ao usuário

### 💡 Recomendação

**Para evitar problemas:**

1. ✅ Sempre confirme o email após criar conta com email/senha
2. ✅ Use o mesmo email para ambos os métodos
3. ✅ Se possível, implemente verificação de email obrigatória no Supabase Dashboard

### 🔍 Verificar se Contas Foram Vinculadas

No Supabase Dashboard, você pode verificar:

1. Vá em **Authentication** > **Users**
2. Procure pelo email do usuário
3. Veja a seção **Identities** (Identidades)
4. Se vinculado, você verá:
   - `email` (método email/senha)
   - `google` (método Google OAuth)

## 💻 Passo 3: Implementar Login com Google no App

O código já está implementado no app. Você só precisa verificar se está funcionando:

### 3.1 Verificar o Botão de Login

O botão "Entrar com Google" já está disponível na página de login (`src/pages/Auth.tsx`).

### 3.2 Testar o Login

1. Inicie o app: `npm run dev`
2. Acesse a página de login
3. Clique em **Entrar com Google**
4. Você será redirecionado para o Google para autorizar
5. Após autorizar, você será redirecionado de volta ao app
6. O login deve ser realizado automaticamente

## 🔍 Passo 4: Configurar URLs de Redirecionamento (CRÍTICO!)

### ⚠️ IMPORTANTE: Para App Android

**Para apps Android (Capacitor), você precisa adicionar APENAS a URL de callback do Supabase!**

1. **Obter a URL de callback**:
   - No Supabase Dashboard: **Authentication** > **Providers** > **Google**
   - Copie a **Callback URL** completa
   - Exemplo: `https://abcdefghijklmnop.supabase.co/auth/v1/callback`

2. **Adicionar no Google Cloud Console**:
   - Acesse: https://console.cloud.google.com
   - Vá em **APIs e Serviços** > **Credenciais**
   - Clique no seu **ID do cliente OAuth**
   - Em **URIs de redirecionamento autorizados**, clique em **+ Adicionar URI**
   - Cole a URL de callback do Supabase **exatamente como está** (sem espaços, sem barra no final)
   - Clique em **Salvar**

3. **NÃO adicione**:
   - ❌ URLs de localhost (não necessário para Android)
   - ❌ URLs do seu app (não necessário)
   - ✅ **APENAS** a URL de callback do Supabase

**⚠️ CRÍTICO**: A URL deve estar **exatamente igual** à do Supabase. Qualquer diferença (espaço, barra no final, etc.) causará o erro `redirect_uri_mismatch`!

### Para Desenvolvimento Web (Opcional)

Se você também vai testar no navegador durante o desenvolvimento:

1. Vá em **APIs e Serviços** > **Credenciais**
2. Clique no seu **ID do cliente OAuth**
3. Em **Origens JavaScript autorizadas**, adicione:
   - `http://localhost:5173` (ou a porta que o Vite está usando)
4. Clique em **Salvar**

**Nota**: Isso é opcional e só necessário se você for testar no navegador. Para o app Android, não é necessário.

## 🐛 Troubleshooting (Solução de Problemas)

### Erro: "redirect_uri_mismatch" ⚠️

**Este é o erro mais comum!** Significa que a URL de redirecionamento não está configurada corretamente.

**Causa**: A URL de callback do Supabase não está nas **URIs de redirecionamento autorizados** do Google Cloud Console, ou está com diferença (espaço, barra no final, etc.).

**Solução Passo a Passo**:

1. **Obter a URL de callback do Supabase**:
   - Acesse: https://app.supabase.com
   - Vá em **Authentication** > **Providers** > **Google**
   - Copie a **Callback URL** exibida
   - Formato: `https://<seu-projeto-ref>.supabase.co/auth/v1/callback`

2. **Adicionar no Google Cloud Console**:
   - Acesse: https://console.cloud.google.com
   - Vá em **APIs e Serviços** > **Credenciais**
   - Clique no seu **ID do cliente OAuth** (não no Client Secret)
   - Role até **URIs de redirecionamento autorizados**
   - Clique em **+ Adicionar URI**
   - Cole a URL de callback do Supabase **exatamente como está** (sem espaços, sem barra no final)
   - Clique em **Salvar**

3. **Verificar**:
   - A URL deve estar **exatamente igual** à do Supabase
   - Não pode ter espaços antes ou depois
   - Não pode ter barra (`/`) no final (a menos que o Supabase mostre com barra)
   - Deve começar com `https://` e terminar com `/auth/v1/callback`

4. **Aguardar propagação**:
   - As mudanças podem levar alguns minutos para propagar
   - Aguarde 2-5 minutos e tente novamente

**Exemplo Correto**:
```
✅ https://abcdefghijklmnop.supabase.co/auth/v1/callback
```

**Exemplos Incorretos** (não funcionam):
```
❌ https://abcdefghijklmnop.supabase.co/auth/v1/callback/  (barra no final)
❌  https://abcdefghijklmnop.supabase.co/auth/v1/callback  (espaço no início)
❌ https://abcdefghijklmnop.supabase.co/auth/v1/callback   (espaço no final)
❌ http://abcdefghijklmnop.supabase.co/auth/v1/callback     (http em vez de https)
```

**Dica**: Copie e cole diretamente do Supabase Dashboard para evitar erros de digitação!

### Erro: "invalid_client"

**Causa**: Client ID ou Client Secret incorretos no Supabase.

**Solução**:
1. Verifique se copiou corretamente o Client ID e Client Secret
2. No Supabase Dashboard, verifique se as credenciais estão corretas
3. Tente recriar as credenciais no Google Cloud Console se necessário

### Erro: "access_denied"

**Causa**: O app não está aprovado ou você não está na lista de usuários de teste.

**Solução**:
1. No Google Cloud Console, vá em **Tela de consentimento OAuth**
2. Adicione seu email em **Usuários de teste**
3. Se o app estiver em produção, você precisará solicitar verificação do Google

### Login funciona no navegador, mas não no app Android

**Causa**: O Capacitor precisa de configuração adicional para deep links e o app não está retornando do navegador após autenticação.

**Solução**:

1. **Verificar o `redirectTo` no código**:
   - O código já detecta automaticamente se está no Capacitor
   - No Android, usa: `https://com.isfia.app/auth`
   - No navegador, usa: `${window.location.origin}/auth`

2. **Verificar AndroidManifest.xml**:
   - O AndroidManifest precisa ter intent filters configurados para capturar deep links
   - Verifique se o arquivo `android/app/src/main/AndroidManifest.xml` tem:
   ```xml
   <activity
       android:name=".MainActivity"
       ...>
       <intent-filter>
           <action android:name="android.intent.action.VIEW" />
           <category android:name="android.intent.category.DEFAULT" />
           <category android:name="android.intent.category.BROWSABLE" />
           <data android:scheme="https" android:host="com.isfia.app" />
       </intent-filter>
   </activity>
   ```

3. **Se o app não retorna do navegador**:
   - O problema pode ser que o Supabase está redirecionando para a URL de callback, mas não para o app
   - Verifique se o `redirectTo` está sendo usado corretamente
   - O Supabase deve redirecionar para `https://com.isfia.app/auth` após processar o callback
   - Verifique os logs do Supabase Dashboard em **Logs** > **Auth Logs** para ver para onde está redirecionando

4. **Testar o deep link manualmente**:
   - No Android, você pode testar se o deep link funciona:
   ```bash
   adb shell am start -a android.intent.action.VIEW -d "https://com.isfia.app/auth"
   ```
   - Se o app abrir, o deep link está funcionando
   - Se não abrir, verifique o AndroidManifest.xml

## 📱 Configuração para Android (Capacitor)

O app já está configurado para funcionar com Capacitor. O `capacitor.config.ts` já tem:

```typescript
server: {
  androidScheme: 'https'
}
```

Isso permite que os deep links do OAuth funcionem corretamente no Android.

## ✅ Checklist de Configuração

Use este checklist para garantir que tudo está configurado:

- [ ] Projeto criado no Google Cloud Console
- [ ] Google+ API habilitada
- [ ] Tela de consentimento OAuth configurada
- [ ] Credenciais OAuth 2.0 criadas (Client ID e Secret)
- [ ] URL de callback do Supabase adicionada nas URIs de redirecionamento
- [ ] URLs de origem adicionadas (localhost para dev, produção para prod)
- [ ] Google provider habilitado no Supabase Dashboard
- [ ] Client ID e Secret configurados no Supabase
- [ ] Testado o login no navegador
- [ ] Testado o login no app Android (se aplicável)

## 🔐 Segurança

### Boas Práticas

1. **Nunca exponha o Client Secret** no código do frontend
2. O Client Secret deve estar apenas no Supabase Dashboard
3. Use HTTPS em produção
4. Mantenha as credenciais atualizadas
5. Revise periodicamente os usuários de teste no Google Cloud Console

### Rotação de Credenciais

Se precisar regenerar as credenciais:

1. Crie novas credenciais no Google Cloud Console
2. Atualize no Supabase Dashboard
3. Os usuários existentes continuarão logados (não precisam fazer login novamente)

## 📚 Recursos Adicionais

- [Documentação do Supabase - Google Auth](https://supabase.com/docs/guides/auth/social-login/auth-google)
- [Google Cloud Console](https://console.cloud.google.com)
- [Supabase Dashboard](https://app.supabase.com)
- [Documentação do Capacitor](https://capacitorjs.com/docs)

## 🆘 Precisa de Ajuda?

Se encontrar problemas:

1. Verifique os logs do console do navegador (F12)
2. Verifique os logs do Supabase Dashboard em **Logs** > **Auth Logs**
3. Consulte a seção de Troubleshooting acima
4. Verifique se todas as URLs estão configuradas corretamente

---

**Última atualização**: Janeiro 2025

