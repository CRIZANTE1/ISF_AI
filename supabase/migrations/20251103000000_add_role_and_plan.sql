/*
          # [Operation Name]
          Adicionar colunas 'role' e 'plan' à tabela de perfis

          ## Query Description: Este script modifica a tabela `profiles` para incluir gerenciamento de permissões (role) e planos (plan). Ele remove a coluna `role` antiga e a substitui por uma versão simplificada, além de adicionar a coluna `plan`. Também atualiza a função de gatilho para novos usuários e define um usuário específico como administrador com plano premium.

          ## Metadata:
          - Schema-Category: ["Structural"]
          - Impact-Level: ["Medium"]
          - Requires-Backup: true
          - Reversible: false

          ## Structure Details:
          - Tabela afetada: `public.profiles`
          - Colunas removidas: `role`
          - Tipos removidos: `user_role`
          - Colunas adicionadas: `role` (TEXT), `plan` (TEXT)
          - Funções modificadas: `public.handle_new_user()`

          ## Security Implications:
          - RLS Status: [Enabled]
          - Policy Changes: [No]
          - Auth Requirements: [N/A]

          ## Performance Impact:
          - Indexes: [N/A]
          - Triggers: [Modified]
          - Estimated Impact: [Baixo]
          */

-- 1. Remover a coluna 'role' e o tipo 'user_role' antigos para simplificar.
-- Esta operação é segura pois estamos redefinindo a estrutura de roles.
ALTER TABLE public.profiles DROP COLUMN role;
DROP TYPE public.user_role;

-- 2. Adicionar as novas colunas 'role' e 'plan' com valores padrão.
ALTER TABLE public.profiles
ADD COLUMN role TEXT CHECK (role IN ('admin', 'user')) DEFAULT 'user' NOT NULL;

ALTER TABLE public.profiles
ADD COLUMN plan TEXT CHECK (plan IN ('trial', 'premium')) DEFAULT 'trial' NOT NULL;

-- 3. Atualizar a função 'handle_new_user' para não mais lidar com 'role' na criação.
-- As novas colunas 'role' e 'plan' receberão seus valores padrão ('user', 'trial') automaticamente.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email);
  RETURN new;
END;
$$;

-- 4. Atualizar o perfil específico do Cristian para ser admin com plano premium.
UPDATE public.profiles
SET 
  role = 'admin',
  plan = 'premium'
WHERE email = 'bboycrysforever@gmail.com';
