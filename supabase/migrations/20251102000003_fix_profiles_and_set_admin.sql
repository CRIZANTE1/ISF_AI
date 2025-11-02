/*
# [Migration] Adiciona Colunas 'role' e 'plan' e Corrige Erros Anteriores

Este script corrige os erros das migrações anteriores e adiciona as colunas `role` e `plan` à tabela `profiles` de forma segura.

## Query Description:
- **Segurança:** Adiciona as colunas `role` e `plan` apenas se elas não existirem, prevenindo erros de execução repetida.
- **Correção de Trigger:** A função `handle_new_user` é corrigida para não tentar inserir um `email` na tabela `profiles`, que não possui essa coluna.
- **Atualização de Perfil:** O perfil do administrador (Cristian Carlos) é atualizado para 'admin' e 'premium' usando o ID do usuário, corrigindo o erro de busca por e-mail.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Medium"
- Requires-Backup: false
- Reversible: false

## Structure Details:
- Tabela afetada: `public.profiles`
- Colunas adicionadas: `role`, `plan`
- Função afetada: `public.handle_new_user()`

## Security Implications:
- RLS Status: Habilitado na tabela `profiles`.
- Policy Changes: Não.
- Auth Requirements: A atualização de perfil requer que o usuário 'bboycrysforever@gmail.com' exista na tabela `auth.users`.
*/

-- 1. Criar os tipos ENUM para 'role' e 'plan' se eles não existirem
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM ('user', 'admin');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_plan') THEN
        CREATE TYPE public.user_plan AS ENUM ('trial', 'premium');
    END IF;
END
$$;

-- 2. Adicionar as colunas 'role' e 'plan' à tabela 'profiles' se não existirem
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS role public.user_role DEFAULT 'user',
ADD COLUMN IF NOT EXISTS plan public.user_plan DEFAULT 'trial';

-- 3. Corrigir a função que cria um perfil para um novo usuário
-- Esta versão remove a tentativa de inserir 'email', que não existe na tabela 'profiles'.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, plan)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    'user', -- Valor padrão para novos usuários
    'trial' -- Valor padrão para novos usuários
  );
  RETURN new;
END;
$$;

-- 4. Garantir que o trigger está usando a função correta
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Atualizar o perfil de Cristian para 'admin' e 'premium'
-- Esta versão corrige o erro anterior buscando o usuário pelo ID correspondente ao email.
UPDATE public.profiles
SET
  role = 'admin',
  plan = 'premium'
WHERE
  id = (SELECT id FROM auth.users WHERE email = 'bboycrysforever@gmail.com');
