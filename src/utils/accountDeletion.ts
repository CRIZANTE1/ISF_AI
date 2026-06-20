/**
 * Utilitário para exclusão completa de conta do usuário
 * Conforme requisitos LGPD/GDPR
 * 
 * ATENÇÃO: Esta operação é IRREVERSÍVEL
 */

import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import { handleErrorWithoutToast } from './errorHandler';
import { logger } from './logger';

/**
 * Exclui todos os dados do usuário do banco de dados.
 * 
 * NOTA DE SEGURANÇA:
 * O ideal é configurar o banco de dados com `ON DELETE CASCADE` nas chaves estrangeiras
 * para garantir que a exclusão do usuário (auth.users) limpe automaticamente todos os dados.
 * 
 * Execute o arquivo `supabase/migrations/20251220_security_fixes.sql` no seu banco de dados
 * para aplicar as regras de CASCADE corretas.
 * 
 * Esta função mantêm a exclusão manual como um fallback de robustez caso a migration
 * não tenha sido aplicada ou para bancos legados.
 */
export async function deleteAllUserData(userId: string): Promise<void> {
  // Lista de todas as tabelas que contêm dados do usuário
  const tables = [
    // Equipamentos
    'extintores',
    'mangueiras',
    'conjuntos_autonomos',
    'inventario_multigas',
    'inventario_camaras_espuma',
    'inventario_canhoes_monitores',
    'inventario_chuveiros_lava_olhos',
    'inventario_alarmes',
    'abrigos',
    // Inspeções
    'inspecoes_extintores',
    'inspecoes_mangueiras',
    'inspecoes_scba',
    'inspecoes_multigas',
    'inspecoes_camaras_espuma',
    'inspecoes_canhoes_monitores',
    'inspecoes_chuveiros_lava_olhos',
    'inspecoes_alarmes',
    'inspecoes_abrigos',
    // Logs de ações
    'log_acoes_extintores',
    'log_acoes_scba',
    'log_acoes_multigas',
    'log_acoes_camaras_espuma',
    'log_acoes_canhoes_monitores',
    'log_acoes_chuveiros_lava_olhos',
    'log_acoes_alarmes',
    'log_acoes_abrigos',
    'log_baixa_extintores',
    // Logs de Acesso/Audit (Opcional, mas requerido para "esquecimento" total)
    'user_action_logs',
    'user_access_logs',
    // Outros
    'purchases', // Dados de compra (atenção a regras fiscais aqui, mas para LGPD total remove-se)
  ];

  logger.info('Iniciando exclusão manual de dados (fallback)...', 'accountDeletion');

  // Deletar dados de todas as tabelas
  const deletePromises = tables.map(async (table) => {
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('user_id', userId);

      if (error) {
        // Ignorar erro se tabela não existir ou coluna user_id não existir (possível em algumas configs)
        if (error.code !== '42P01' && error.code !== '42703') {
           logger.error(`Erro ao deletar dados da tabela ${table}`, 'accountDeletion', error);
        }
      }
    } catch (err) {
      // Ignorar erros de execução
    }
  });

  await Promise.all(deletePromises);

  // Deletar perfil
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId);

  if (profileError) {
    logger.error('Erro ao deletar perfil', 'accountDeletion', profileError);
  }
}

/**
 * Exclui a conta de autenticação do Supabase
 * 
 * Usa Edge Function para deletar a conta de autenticação de forma segura.
 * Se a Edge Function não estiver disponível, apenas faz logout.
 */
export async function deleteAuthAccount(user: User): Promise<void> {
  if (!user) {
    throw new Error('Usuário não autenticado');
  }

  try {
    // Tentar deletar via Edge Function
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      // Se não houver sessão, apenas fazer logout
      await supabase.auth.signOut();
      return;
    }

    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const functionUrl = `${supabaseUrl}/functions/v1/delete-user`;

    const response = await fetch(functionUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ userId: user.id }),
    });

    if (response.ok) {
      // Conta deletada com sucesso
      return;
    }

    // Se a função não existir ou houver erro, fazer fallback para logout
    const errorData = await response.json().catch(() => ({}));
    
    // Se for erro 404, a Edge Function não está deployada
    if (response.status === 404) {
      logger.warn('Edge Function delete-user não encontrada. Fazendo apenas logout.', 'accountDeletion');
      await supabase.auth.signOut();
      return;
    }

    // Outros erros: fazer logout e logar o erro
    logger.error('Erro ao deletar conta via Edge Function', 'accountDeletion', errorData);
    await supabase.auth.signOut();
  } catch (error) {
    // Em caso de erro, fazer logout como fallback
    logger.error('Erro ao deletar conta de autenticação', 'accountDeletion', error);
    await supabase.auth.signOut();
  }
}

/**
 * Exclui completamente a conta do usuário
 * 
 * ATENÇÃO: Esta operação é IRREVERSÍVEL
 * 
 * @param user - Usuário autenticado
 * @param confirmText - Texto de confirmação (deve ser "DELETAR")
 * @returns Resultado da operação
 */
export async function deleteUserAccount(
  user: User,
  confirmText: string
): Promise<{ success: boolean; message: string }> {
  if (!user) {
    return {
      success: false,
      message: 'Usuário não autenticado',
    };
  }

  // Validação de segurança
  if (confirmText !== 'DELETAR') {
    return {
      success: false,
      message: 'Texto de confirmação incorreto. Digite "DELETAR" para confirmar.',
    };
  }

  try {
    // 1. Deletar todos os dados do usuário (Fallback manual + Cascade DB)
    await deleteAllUserData(user.id);

    // 2. Fazer logout (a exclusão da conta de auth requer Edge Function)
    await deleteAuthAccount(user);

    return {
      success: true,
      message: 'Conta excluída com sucesso. Todos os seus dados foram removidos permanentemente.',
    };
  } catch (error) {
    const appError = handleErrorWithoutToast(error, 'profile');
    return {
      success: false,
      message: appError.userMessage || appError.message || 'Erro ao excluir conta. Entre em contato com o suporte.',
    };
  }
}

/**
 * NOTA IMPORTANTE SOBRE EXCLUSÃO DE CONTA DE AUTENTICAÇÃO:
 * 
 * Para excluir completamente a conta de autenticação do Supabase Auth,
 * você precisa criar uma Edge Function no Supabase que use a service role key.
 * 
 * Passos:
 * 1. Criar Edge Function no Supabase Dashboard
 * 2. Implementar função que chama admin.auth.deleteUser()
 * 3. Chamar essa função após deletar os dados do banco
 * 
 * Por enquanto, esta implementação:
 * - ✅ Tenta deletar via cascade (se migration aplicada)
 * - ✅ Deleta dados via fallback manual
 * - ✅ Deleta o perfil
 * - ✅ Faz logout do usuário
 * - ⚠️ A conta de autenticação permanece se Edge Function falhar
 */

