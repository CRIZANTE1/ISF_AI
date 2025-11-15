import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Usar valores padrão vazios para evitar crash, mas avisar o usuário
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Variáveis de ambiente do Supabase não encontradas!');
  console.error('Por favor, crie um arquivo .env na raiz do projeto com:');
  console.error('VITE_SUPABASE_URL=sua_url_aqui');
  console.error('VITE_SUPABASE_ANON_KEY=sua_chave_aqui');
  console.warn('⚠️ Continuando com valores vazios. O app pode não funcionar corretamente.');
}

// Validação básica das variáveis (apenas se estiverem definidas)
if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  console.warn('⚠️ A URL do Supabase parece estar incorreta:', supabaseUrl);
}

if (supabaseAnonKey && supabaseAnonKey.length < 50) {
  console.warn('⚠️ A chave anônima do Supabase parece estar incorreta (muito curta)');
}

// Usar valores padrão se não estiverem definidos para evitar crash
export const supabase = createClient<Database>(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
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
