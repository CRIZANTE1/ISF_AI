# 🚀 Guia Rápido: Configurar Supabase

## Passo 1: Obter Credenciais do Supabase

1. Acesse https://app.supabase.com
2. Faça login na sua conta
3. Selecione seu projeto (ou crie um novo)
4. Vá em **Settings** (⚙️) no menu lateral
5. Clique em **API** no submenu
6. Você verá duas informações importantes:
   - **Project URL** (exemplo: `https://abcdefghijklmnop.supabase.co`)
   - **anon public** key (uma chave longa que começa com `eyJ...`)

## Passo 2: Criar Arquivo .env

1. Na raiz do projeto (mesmo nível do `package.json`), crie um arquivo chamado `.env`
2. Adicione as seguintes linhas (substitua pelos seus valores):

```env
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**⚠️ IMPORTANTE:**
- Não adicione espaços antes ou depois do `=`
- Não use aspas ao redor dos valores
- A URL deve começar com `https://` e terminar com `.supabase.co` (sem barra no final)
- A chave deve ser a chave **anon/public**, não a service_role key

## Passo 3: Verificar o Arquivo

Seu arquivo `.env` deve ficar assim:

```
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.exemplo_de_chave_muito_longa_aqui
```

## Passo 4: Reiniciar o Servidor

**CRÍTICO:** Após criar ou modificar o arquivo `.env`, você DEVE reiniciar o servidor de desenvolvimento:

1. Pare o servidor (Ctrl+C no terminal)
2. Inicie novamente:
   ```bash
   npm run dev
   ```

## Passo 5: Verificar se Funcionou

1. Abra o console do navegador (F12)
2. Vá na aba Console
3. Você NÃO deve ver mensagens de erro sobre variáveis de ambiente
4. Tente fazer login novamente

## ❌ Problemas Comuns

### "Supabase URL and Anon Key must be defined in .env file"
- **Causa:** Arquivo `.env` não existe ou não está na raiz do projeto
- **Solução:** Crie o arquivo `.env` na raiz (mesmo nível do `package.json`)

### "Failed to fetch" ou "NetworkError"
- **Causa 1:** URL ou chave incorretas
- **Solução:** Verifique se copiou corretamente do painel do Supabase
- **Causa 2:** Servidor não foi reiniciado após criar o `.env`
- **Solução:** Pare e reinicie o servidor (`npm run dev`)

### "Invalid API key"
- **Causa:** Chave anônima incorreta ou copiada com espaços
- **Solução:** Verifique se copiou a chave **anon/public** (não a service_role) e sem espaços

### URL parece incorreta
- **Causa:** URL não começa com `https://` ou não termina com `.supabase.co`
- **Solução:** Verifique o formato: `https://xxxxx.supabase.co` (sem barra no final)

## 🔍 Verificação Rápida

Execute no terminal (na raiz do projeto):

```bash
# Windows PowerShell
if (Test-Path .env) { Write-Host "✅ Arquivo .env encontrado"; Get-Content .env } else { Write-Host "❌ Arquivo .env NÃO encontrado" }

# Linux/Mac
if [ -f .env ]; then echo "✅ Arquivo .env encontrado"; cat .env; else echo "❌ Arquivo .env NÃO encontrado"; fi
```

## 📝 Exemplo Completo

Arquivo `.env` completo e correto:

```env
VITE_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTYxNjIzOTAyMiwiZXhwIjoxOTMxODE1MDIyfQ.abcdefghijklmnopqrstuvwxyz1234567890
```

## 🆘 Ainda com Problemas?

1. Verifique o console do navegador (F12) para mensagens de erro específicas
2. Verifique o terminal onde o servidor está rodando
3. Confirme que o projeto Supabase está ativo (não pausado)
4. Tente acessar a URL do Supabase diretamente no navegador para verificar se está online

