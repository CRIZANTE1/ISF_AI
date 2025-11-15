# Guia de Solução de Problemas - Erro "Failed to fetch"

## Problema: Erro "Failed to fetch" ao tentar fazer login

Este erro geralmente ocorre quando há problemas de conexão com o Supabase. Siga os passos abaixo para resolver:

## ✅ Soluções

### 1. Verificar Variáveis de Ambiente

Certifique-se de que você tem um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anon-aqui
```

**Como obter essas informações:**
1. Acesse o painel do Supabase: https://app.supabase.com
2. Selecione seu projeto
3. Vá em **Settings** > **API**
4. Copie a **URL** e a **anon/public key**

### 2. Verificar se o arquivo .env está sendo carregado

- Certifique-se de que o arquivo está na **raiz do projeto** (mesmo nível do `package.json`)
- O arquivo deve se chamar exatamente `.env` (sem extensão)
- Reinicie o servidor de desenvolvimento após criar/modificar o `.env`:
  ```bash
  npm run dev
  ```

### 3. Verificar Conexão com a Internet

- Verifique se sua conexão com a internet está funcionando
- Tente acessar o painel do Supabase no navegador para confirmar que o serviço está online

### 4. Verificar CORS no Supabase

Se você estiver em desenvolvimento local:

1. Acesse o painel do Supabase
2. Vá em **Settings** > **API**
3. Em **CORS**, adicione `http://localhost:5173` (ou a porta que você está usando)
4. Salve as alterações

### 5. Verificar Console do Navegador

Abra o console do navegador (F12) e verifique:
- Se há mensagens de erro mais específicas
- Se as variáveis de ambiente estão sendo carregadas corretamente
- Se há erros de CORS ou de rede

### 6. Verificar URL e Chave do Supabase

Certifique-se de que:
- A URL começa com `https://` (não `http://`)
- A URL termina com `.supabase.co` (sem barra no final)
- A chave anônima é longa (geralmente mais de 100 caracteres)

### 7. Limpar Cache e Reinstalar

```bash
# Limpar node_modules e cache
rm -rf node_modules
rm package-lock.json

# Reinstalar dependências
npm install

# Reiniciar servidor
npm run dev
```

## 🔍 Mensagens de Erro Comuns

### "Supabase URL and Anon Key must be defined in .env file"
- **Solução**: Crie o arquivo `.env` na raiz do projeto com as variáveis necessárias

### "Invalid API key"
- **Solução**: Verifique se a chave anônima está correta no arquivo `.env`

### "NetworkError" ou "Failed to fetch"
- **Solução**: Verifique sua conexão com a internet e as configurações do Supabase

### "Invalid login credentials"
- **Solução**: Este é um erro diferente - verifique se o e-mail e senha estão corretos

## 📞 Ainda com problemas?

1. Verifique os logs no console do navegador (F12)
2. Verifique os logs do servidor de desenvolvimento
3. Confirme que o projeto Supabase está ativo e não foi pausado
4. Tente criar uma nova conta de teste para verificar se o problema é específico de uma conta

## 📝 Exemplo de arquivo .env correto

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.exemplo_de_chave_muito_longa_aqui
```

**⚠️ IMPORTANTE**: Nunca commite o arquivo `.env` no Git! Ele contém informações sensíveis.

