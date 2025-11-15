import { createClient } from '@supabase/supabase-js'
import { Database } from '../types/supabase'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validar variáveis de ambiente obrigatórias
if (!supabaseUrl || !supabaseAnonKey) {
  const errorMessage = '❌ Variáveis de ambiente do Supabase não encontradas!\n' +
    'Por favor, crie um arquivo .env na raiz do projeto com:\n' +
    'VITE_SUPABASE_URL=sua_url_aqui\n' +
    'VITE_SUPABASE_ANON_KEY=sua_chave_aqui';
  
  if (import.meta.env.DEV) {
    console.error(errorMessage);
    // Em desenvolvimento, usar valores placeholder para não bloquear
    console.warn('⚠️ Continuando com valores placeholder. O app pode não funcionar corretamente.');
  } else {
    // Em produção, lançar erro para evitar comportamento silencioso
    throw new Error('Configuração do Supabase não encontrada. Verifique as variáveis de ambiente.');
  }
}

// Validação básica das variáveis (apenas se estiverem definidas)
if (supabaseUrl && !supabaseUrl.startsWith('http://') && !supabaseUrl.startsWith('https://')) {
  console.warn('⚠️ A URL do Supabase parece estar incorreta:', supabaseUrl);
}

if (supabaseAnonKey && supabaseAnonKey.length < 50) {
  console.warn('⚠️ A chave anônima do Supabase parece estar incorreta (muito curta)');
}

// Usar valores padrão apenas em desenvolvimento para evitar crash
// Em produção, as variáveis devem estar definidas
const finalUrl = supabaseUrl || (import.meta.env.DEV ? 'https://placeholder.supabase.co' : '');
const finalKey = supabaseAnonKey || (import.meta.env.DEV ? 'placeholder-key' : '');

if (!finalUrl || !finalKey) {
  throw new Error('Configuração do Supabase inválida. Verifique as variáveis de ambiente.');
}

export const supabase = createClient<Database>(
  finalUrl,
  finalKey,
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
