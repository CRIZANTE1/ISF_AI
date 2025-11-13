import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.error('Por favor, crie um arquivo .env na raiz do projeto com:');
  console.error('VITE_SUPABASE_URL=sua_url_aqui');
  console.error('VITE_SUPABASE_ANON_KEY=sua_chave_aqui');
  throw new Error('Supabase URL and Anon Key must be defined in .env file');
}

// Validação básica das variáveis
if (!supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  console.warn('⚠️ A URL do Supabase parece estar incorreta:', supabaseUrl);
}

if (supabaseAnonKey.length < 50) {
  console.warn('⚠️ A chave anônima do Supabase parece estar incorreta (muito curta)');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'implicit',
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
