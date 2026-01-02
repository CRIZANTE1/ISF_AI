import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'
import { logger } from '../utils/logger'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar variáveis de ambiente obrigatórias
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = '❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não encontradas!\n' +
    'Por favor, crie um arquivo .env na raiz do projeto com:\n' +
    'VITE_SUPABASE_URL=sua_url_aqui\n' +
    'VITE_SUPABASE_ANON_KEY=sua_chave_aqui';
  
  logger.error(errorMessage, 'supabase');
  
  if (import.meta.env.DEV) {
    // Alerta visual mais forte no console do navegador
    console.error(
      '%c⚠️ CONFIGURAÇÃO CRÍTICA AUSENTE ⚠️',
      'color: red; font-size: 20px; font-weight: bold; background: yellow; padding: 10px;'
    );
    console.error(
      '%c' + errorMessage,
      'color: red; font-size: 14px; font-weight: bold;'
    );
    console.error(
      '%c⚠️ O APP NÃO FUNCIONARÁ SEM ESSAS CONFIGURAÇÕES!',
      'color: red; font-size: 16px; font-weight: bold;'
    );
  }
  
  // Em desenvolvimento E produção, lançar erro imediatamente
  // Não permitir que o app continue com valores inválidos
  throw new Error('Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.');
}

// Validação básica das variáveis
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  const errorMsg = '⚠️ A URL do Supabase está incorreta (deve começar com https://)';
  logger.error(errorMsg, 'supabase', { url: supabaseUrl });
  throw new Error(errorMsg);
}

if (supabaseAnonKey.length < 50) {
  const errorMsg = '⚠️ A chave anônima do Supabase está incorreta (muito curta)';
  logger.error(errorMsg, 'supabase');
  throw new Error(errorMsg);
}

// Validação adicional: verificar se não são valores placeholder
if (supabaseUrl.includes('placeholder') || supabaseUrl.includes('sua_url') || supabaseUrl.includes('example')) {
  const errorMsg = '❌ URL do Supabase é um placeholder. Configure com uma URL real.';
  logger.error(errorMsg, 'supabase');
  throw new Error(errorMsg);
}

if (supabaseAnonKey.includes('placeholder') || supabaseAnonKey.includes('sua_chave') || supabaseAnonKey === 'placeholder-key') {
  const errorMsg = '❌ Chave do Supabase é um placeholder. Configure com uma chave real.';
  logger.error(errorMsg, 'supabase');
  throw new Error(errorMsg);
}

export const supabase = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey,
  {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  global: {
    headers: {
      'x-client-info': 'isf-ia-app',
    },
  },
  db: {
    schema: 'public',
  },
})
