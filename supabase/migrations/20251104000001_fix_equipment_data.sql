/*
# [Operation] Fix Equipment Data and Add Specifications
This script fixes the equipment data to match the provided INSERT statement and adds
specifications for extinguishers based on the extinguisher operations requirements.
It also links all equipment to a specific user profile.

## Query Description:
This script:
1. Inserts or updates user profile for the specified user
2. Updates or inserts equipment data matching the provided INSERT statement
3. Adds specifications JSONB for all extinguishers
4. Links all equipment to the user ID: 2cce6373-6ecc-4bf3-a44c-1df959d7cc84

## Metadata:
- Schema-Category: "Data Update"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: false (data modification)

## Structure Details:
- Tables affected: `profiles`, `equipment`
- Updates: Creates/updates user profile and fixes equipment data with specifications and user_id

## Security Implications:
- RLS Status: No changes to RLS policies
- Policy Changes: None
- Auth Requirements: Requires database admin privileges

## Performance Impact:
- Indexes: No new indexes
- Triggers: None
- Estimated Impact: Low
*/

-- Clear existing mock data (optional - uncomment if needed)
-- DELETE FROM public.equipment WHERE equipment_id IN ('EXT-001', 'EXT-002', 'MANG-001', 'ABR-005', 'SCBA-001', 'EXT-003', 'EXT-004');

-- Insert or update user profile first
-- User ID: 2cce6373-6ecc-4bf3-a44c-1df959d7cc84
INSERT INTO public.profiles (
  id, full_name, avatar_url, updated_at, role, plan
) VALUES (
  '2cce6373-6ecc-4bf3-a44c-1df959d7cc84', 
  'CRISTIAN CARLOS', 
  null, 
  '2025-11-02 12:19:14.854905+00', 
  'admin', 
  'premium'
)
ON CONFLICT (id) DO UPDATE
SET 
  full_name = EXCLUDED.full_name,
  avatar_url = EXCLUDED.avatar_url,
  updated_at = EXCLUDED.updated_at,
  role = EXCLUDED.role,
  plan = EXCLUDED.plan;

-- Insert or update equipment data with specifications
-- User ID to link all equipment: 2cce6373-6ecc-4bf3-a44c-1df959d7cc84
-- EXT-001
INSERT INTO public.equipment (
  equipment_id, equipment_type, status, localizacao, proxima_inspecao, data_validade, specifications, user_id
) VALUES (
  'EXT-001', 'extintor', 'ok', 'Prédio A - Andar 1', '2025-12-01', '2026-05-15',
  jsonb_build_object(
    'numero_selo_inmetro', 'SELO-001',
    'tipo_agente', 'ABC',
    'capacidade', 10,
    'marca_fabricante', 'Fabricante A',
    'ano_fabricacao', 2020,
    'tipo_servico', 'Inspeção',
    'data_servico', TO_CHAR(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM-DD'),
    'aprovado_inspecao', 'Sim',
    'observacoes_gerais', 'Equipamento em conformidade.',
    'plano_de_acao', 'Manter em monitoramento periódico.',
    'data_proxima_inspecao', '2025-12-01',
    'data_proxima_manutencao_2_nivel', NULL,
    'data_proxima_manutencao_3_nivel', NULL,
    'data_ultimo_ensaio_hidrostatico', NULL
  ),
  '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
)
ON CONFLICT (equipment_id) DO UPDATE
SET 
  status = EXCLUDED.status,
  localizacao = EXCLUDED.localizacao,
  proxima_inspecao = EXCLUDED.proxima_inspecao,
  data_validade = EXCLUDED.data_validade,
  specifications = EXCLUDED.specifications,
  user_id = EXCLUDED.user_id;

-- EXT-002
INSERT INTO public.equipment (
  equipment_id, equipment_type, status, localizacao, proxima_inspecao, data_validade, specifications, user_id
) VALUES (
  'EXT-002', 'extintor', 'vencido', 'Prédio B - Térreo', '2025-02-10', '2025-08-20',
  jsonb_build_object(
    'numero_selo_inmetro', 'SELO-002',
    'tipo_agente', 'AP',
    'capacidade', 6,
    'marca_fabricante', 'Fabricante B',
    'ano_fabricacao', 2019,
    'tipo_servico', 'Inspeção',
    'data_servico', TO_CHAR(CURRENT_DATE - INTERVAL '9 months', 'YYYY-MM-DD'),
    'aprovado_inspecao', 'Não',
    'observacoes_gerais', 'Manômetro fora de faixa. LACRE violado.',
    'plano_de_acao', 'Realizar a substituição imediata do manômetro. Substituir lacre e verificar motivo da violação.',
    'data_proxima_inspecao', '2025-02-10',
    'data_proxima_manutencao_2_nivel', NULL,
    'data_proxima_manutencao_3_nivel', NULL,
    'data_ultimo_ensaio_hidrostatico', NULL
  ),
  '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
)
ON CONFLICT (equipment_id) DO UPDATE
SET 
  status = EXCLUDED.status,
  localizacao = EXCLUDED.localizacao,
  proxima_inspecao = EXCLUDED.proxima_inspecao,
  data_validade = EXCLUDED.data_validade,
  specifications = EXCLUDED.specifications,
  user_id = EXCLUDED.user_id;

-- EXT-003
INSERT INTO public.equipment (
  equipment_id, equipment_type, status, localizacao, proxima_inspecao, data_validade, specifications, user_id
) VALUES (
  'EXT-003', 'extintor', 'ok', 'Oficina', '2026-03-01', '2027-01-10',
  jsonb_build_object(
    'numero_selo_inmetro', 'SELO-003',
    'tipo_agente', 'CO2',
    'capacidade', 5,
    'marca_fabricante', 'Fabricante C',
    'ano_fabricacao', 2021,
    'tipo_servico', 'Inspeção',
    'data_servico', TO_CHAR(CURRENT_DATE - INTERVAL '8 months', 'YYYY-MM-DD'),
    'aprovado_inspecao', 'Sim',
    'observacoes_gerais', 'Equipamento em conformidade.',
    'plano_de_acao', 'Manter em monitoramento periódico.',
    'data_proxima_inspecao', '2026-03-01',
    'data_proxima_manutencao_2_nivel', NULL,
    'data_proxima_manutencao_3_nivel', NULL,
    'data_ultimo_ensaio_hidrostatico', NULL
  ),
  '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
)
ON CONFLICT (equipment_id) DO UPDATE
SET 
  status = EXCLUDED.status,
  localizacao = EXCLUDED.localizacao,
  proxima_inspecao = EXCLUDED.proxima_inspecao,
  data_validade = EXCLUDED.data_validade,
  specifications = EXCLUDED.specifications,
  user_id = EXCLUDED.user_id;

-- EXT-004
INSERT INTO public.equipment (
  equipment_id, equipment_type, status, localizacao, proxima_inspecao, data_validade, specifications, user_id
) VALUES (
  'EXT-004', 'extintor', 'vencido', 'Almoxarifado', '2025-01-05', '2025-06-01',
  jsonb_build_object(
    'numero_selo_inmetro', 'SELO-004',
    'tipo_agente', 'BC',
    'capacidade', 8,
    'marca_fabricante', 'Fabricante A',
    'ano_fabricacao', 2018,
    'tipo_servico', 'Inspeção',
    'data_servico', TO_CHAR(CURRENT_DATE - INTERVAL '10 months', 'YYYY-MM-DD'),
    'aprovado_inspecao', 'Não',
    'observacoes_gerais', 'VENCIDO. Equipamento fora de conformidade.',
    'plano_de_acao', 'Retirar de uso e enviar para manutenção (Nível 2 ou 3) imediatamente.',
    'data_proxima_inspecao', '2025-01-05',
    'data_proxima_manutencao_2_nivel', NULL,
    'data_proxima_manutencao_3_nivel', NULL,
    'data_ultimo_ensaio_hidrostatico', NULL
  ),
  '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
)
ON CONFLICT (equipment_id) DO UPDATE
SET 
  status = EXCLUDED.status,
  localizacao = EXCLUDED.localizacao,
  proxima_inspecao = EXCLUDED.proxima_inspecao,
  data_validade = EXCLUDED.data_validade,
  specifications = EXCLUDED.specifications,
  user_id = EXCLUDED.user_id;

-- MANG-001 (Mangueira - sem specifications complexas)
INSERT INTO public.equipment (
  equipment_id, equipment_type, status, localizacao, proxima_inspecao, data_validade, user_id
) VALUES (
  'MANG-001', 'mangueira', 'ok', 'Garagem G1', '2026-01-20', '2030-01-01', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
)
ON CONFLICT (equipment_id) DO UPDATE
SET 
  status = EXCLUDED.status,
  localizacao = EXCLUDED.localizacao,
  proxima_inspecao = EXCLUDED.proxima_inspecao,
  data_validade = EXCLUDED.data_validade,
  user_id = EXCLUDED.user_id;

-- ABR-005 (Abrigo - sem specifications complexas)
INSERT INTO public.equipment (
  equipment_id, equipment_type, status, localizacao, proxima_inspecao, data_validade, user_id
) VALUES (
  'ABR-005', 'abrigo', 'pendente', 'Prédio A - Andar 3', '2025-07-11', '2028-07-10', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
)
ON CONFLICT (equipment_id) DO UPDATE
SET 
  status = EXCLUDED.status,
  localizacao = EXCLUDED.localizacao,
  proxima_inspecao = EXCLUDED.proxima_inspecao,
  data_validade = EXCLUDED.data_validade,
  user_id = EXCLUDED.user_id;

-- SCBA-001 (SCBA - sem specifications complexas)
INSERT INTO public.equipment (
  equipment_id, equipment_type, status, localizacao, proxima_inspecao, data_validade, user_id
) VALUES (
  'SCBA-001', 'scba', 'ok', 'Sala de Brigada', '2025-09-01', '2027-09-01', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
)
ON CONFLICT (equipment_id) DO UPDATE
SET 
  status = EXCLUDED.status,
  localizacao = EXCLUDED.localizacao,
  proxima_inspecao = EXCLUDED.proxima_inspecao,
  data_validade = EXCLUDED.data_validade,
  user_id = EXCLUDED.user_id;

