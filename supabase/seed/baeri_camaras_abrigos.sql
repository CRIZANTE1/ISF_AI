-- BAERI câmaras + abrigos import (idempotente)

-- user_id: 2cce6373-6ecc-4bf3-a44c-1df959d7cc84

INSERT INTO inventario_camaras_espuma (id_camara, localizacao, marca, tipo_camara, numero_mcs, tamanho_especifico, data_cadastro, user_id)
VALUES
  ('08_A', 'TQ1508', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-17', 'MCS-17', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('08_B', 'TQ1508', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-17', 'MCS-17', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('08_C', 'TQ1508', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-17', 'MCS-17', '2025-08-30', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('07_A', 'TQ1507', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-17', 'MCS-17', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('07_B', 'TQ1507', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-17', 'MCS-17', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('07_C', 'TQ1507', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-17', 'MCS-17', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('02_A', 'TQ1502', 'KIDDE', 'TF - Tubo de Filme', 'TF', 'TF', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('02_B', 'TQ1502', 'KIDDE', 'TF - Tubo de Filme', 'TF', 'TF', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('01_A', 'TQ1501', 'KIDDE', 'TF - Tubo de Filme', 'TF', 'TF', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('01_B', 'TQ1501', 'KIDDE', 'TF - Tubo de Filme', 'TF', 'TF', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('04_A', 'TQ1504', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-17', 'MCS-17', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('03_A', 'TQ1503', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-17', 'MCS-17', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('011_A', 'TQ1511', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-17', 'MCS-17', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('010_A', 'TQ1510', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-17', 'MCS-17', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('05_A', 'TQ1505', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-33', 'MCS-33', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('06_A', 'TQ1506', 'KIDDE', 'MCS - Selo de Vidro', 'MCS-33', 'MCS-33', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84')
ON CONFLICT (id_camara) DO NOTHING;

INSERT INTO abrigos (id_abrigo, cliente, local, itens_json, user_id)
VALUES
  ('CECI 01', 'VIBRA ENERGIA', 'CCO', '{"Mangueira de 1½\"":2,"Mangueira de 2½\"":2,"Esguicho de 1½\"":2,"Esguicho de 2½\"":1,"Derivante":1,"Chave de Acoplamento":4,"Proporcionador de Espuma":0}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 02', 'VIBRA ENERGIA', 'PLECT1', '{"Mangueira de 1½\"":3,"Mangueira de 2½\"":3,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":4,"Proporcionador de Espuma":0}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 03', 'VIBRA ENERGIA', 'Atrás da PLECT 6', '{"Mangueira de 1½\"":4,"Mangueira de 2½\"":3,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":3,"Proporcionador de Espuma":0}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 04', 'VIBRA ENERGIA', 'Atrás da PLECT 12', '{"Mangueira de 1½\"":3,"Mangueira de 2½\"":2,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":4,"Proporcionador de Espuma":1}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 05', 'VIBRA ENERGIA', 'PLECT17', '{"Mangueira de 1½\"":3,"Mangueira de 2½\"":4,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":4,"Proporcionador de Espuma":0}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 06', 'VIBRA ENERGIA', 'LGE', '{"Mangueira de 1½\"":4,"Mangueira de 2½\"":2,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":3,"Proporcionador de Espuma":1,"Canhão Monitor Móvel":1,"Canhão de Espuma (BAZUCA)":1}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 07', 'VIBRA ENERGIA', 'ADITIVAÇÃO', '{"Mangueira de 1½\"":3,"Mangueira de 2½\"":3,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":3,"Proporcionador de Espuma":1}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 08', 'VIBRA ENERGIA', 'RUA C Início', '{"Mangueira de 1½\"":4,"Mangueira de 2½\"":3,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":2,"Proporcionador de Espuma":1,"Canhão Monitor Móvel":1,"Redução de 2 1/2 x 1 1/2":1}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 09', 'VIBRA ENERGIA', 'RUA C', '{"Mangueira de 1½\"":4,"Mangueira de 2½\"":2,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":3,"Proporcionador de Espuma":1}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 10', 'VIBRA ENERGIA', 'RUA C CCM', '{"Mangueira de 1½\"":3,"Mangueira de 2½\"":4,"Esguicho de 1½\"":1,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":2,"Proporcionador de Espuma":1}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 11', 'VIBRA ENERGIA', 'SAO', '{"Mangueira de 1½\"":2,"Mangueira de 2½\"":1,"Esguicho de 1½\"":1,"Esguicho de 2½\"":1,"Derivante":1,"Chave de Acoplamento":1,"Proporcionador de Espuma":0}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 12', 'VIBRA ENERGIA', 'RUA D Início', '{"Mangueira de 1½\"":2,"Mangueira de 2½\"":2,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":2,"Proporcionador de Espuma":0}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 13', 'VIBRA ENERGIA', 'Atrás da Sala de Motoristas', '{"Mangueira de 1½\"":5,"Mangueira de 2½\"":2,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":2,"Proporcionador de Espuma":1}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('CECI 14', 'VIBRA ENERGIA', 'Pátio externo próximo a portaria', '{"Mangueira de 1½\"":4,"Mangueira de 2½\"":3,"Esguicho de 1½\"":2,"Esguicho de 2½\"":2,"Derivante":1,"Chave de Acoplamento":2,"Proporcionador de Espuma":1}'::jsonb, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84')
ON CONFLICT (id_abrigo) DO NOTHING;

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '010_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '010_A'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '011_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '011_A'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '01_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Tubo de projeção íntegro (sem corrosão ou danos)":"Conforme","Defletor de projeção íntegro e bem fixado":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '01_A'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '02_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Tubo de projeção íntegro (sem corrosão ou danos)":"Conforme","Defletor de projeção íntegro e bem fixado":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '02_A'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '02_B', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Tubo de projeção íntegro (sem corrosão ou danos)":"Conforme","Defletor de projeção íntegro e bem fixado":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '02_B'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '03_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '03_A'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '04_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '04_A'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '05_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '05_A'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '06_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '06_A'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '07_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '07_A'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '07_B', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '07_B'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '07_C', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '07_C'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '08_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '08_A'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '08_B', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '08_B'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '08_C', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '08_C'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '01_B', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Tubo de projeção íntegro (sem corrosão ou danos)":"Conforme","Defletor de projeção íntegro e bem fixado":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '01_B'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-03', '03_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-10-03', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '03_A'
    AND b.data_inspecao = '2025-10-03'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-03', '04_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-10-03', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '04_A'
    AND b.data_inspecao = '2025-10-03'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-03', '05_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-10-03', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '05_A'
    AND b.data_inspecao = '2025-10-03'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-03', '06_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-10-03', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '06_A'
    AND b.data_inspecao = '2025-10-03'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-09', '011_A', 'Funcional Anual', 'Reprovado com Pendências', 'CRÍTICO: Substituir a placa de orifício por uma compatível com o modelo da câmara. A placa incorreta compromete a vazão e eficiência do sistema.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Não Conforme","Verificação de fluxo de água/espuma":"Não Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=16ClkspKvpc5EAizn_snHVHZviFYOhMN3', 'CRISTIAN CARLOS', '2026-10-09', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '011_A'
    AND b.data_inspecao = '2025-10-09'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-09', '010_A', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-04-09', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '010_A'
    AND b.data_inspecao = '2025-10-09'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-09', '04_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1lsluEDp7u5d8ajY8Q4c_SBRtj-1wjFOy', 'CRISTIAN CARLOS', '2026-10-09', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '04_A'
    AND b.data_inspecao = '2025-10-09'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-09', '05_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1c3ngQVI09qKD9bgE0MuXqsEUmXlYgDOo', 'CRISTIAN CARLOS', '2026-10-09', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '05_A'
    AND b.data_inspecao = '2025-10-09'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-09', '06_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1CdTGNMEmXA1njXs1JyUocCNmbVEizWjY', 'CRISTIAN CARLOS', '2026-10-09', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '06_A'
    AND b.data_inspecao = '2025-10-09'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-09', '03_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1T067gGS9Ylp6K3NsqDdBg8aOL2sPHrF1', 'CRISTIAN CARLOS', '2026-10-09', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '03_A'
    AND b.data_inspecao = '2025-10-09'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-17', '02_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Tubo de projeção íntegro (sem corrosão ou danos)":"Conforme","Defletor de projeção íntegro e bem fixado":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1sUAc5B6RGikn5kQ8gq4c3776-d0vZa0l', 'CRISTIAN CARLOS', '2026-10-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '02_A'
    AND b.data_inspecao = '2025-10-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-17', '02_B', 'Funcional Anual', 'Reprovado com Pendências', 'Investigar a causa da falha de fluxo (obstrução, problema na bomba, etc.) e corrigir.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Tubo de projeção íntegro (sem corrosão ou danos)":"Conforme","Defletor de projeção íntegro e bem fixado":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Não Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1fy5aiilJs5hactPg4Incl0_XnvW_b_4j', 'CRISTIAN CARLOS', '2026-10-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '02_B'
    AND b.data_inspecao = '2025-10-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-17', '01_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Tubo de projeção íntegro (sem corrosão ou danos)":"Conforme","Defletor de projeção íntegro e bem fixado":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1pxNj9ad1xk68TIfKHgXbWHM_9KWysFEi', 'CRISTIAN CARLOS', '2026-10-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '01_A'
    AND b.data_inspecao = '2025-10-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-17', '01_B', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Tubo de projeção íntegro (sem corrosão ou danos)":"Conforme","Defletor de projeção íntegro e bem fixado":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1h0h9s7Fmtq1JYLbnGSnVhh9hey4raHHC', 'CRISTIAN CARLOS', '2026-10-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '01_B'
    AND b.data_inspecao = '2025-10-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-17', '08_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1cps-BZveDLqeM127y82uoL3zGij4tyr9', 'CRISTIAN CARLOS', '2026-10-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '08_A'
    AND b.data_inspecao = '2025-10-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-17', '08_B', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1Sk_lyUZGSHhqab47tHAkCJ6JAxaJU3Bu', 'CRISTIAN CARLOS', '2026-10-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '08_B'
    AND b.data_inspecao = '2025-10-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-17', '08_C', 'Funcional Anual', 'Reprovado com Pendências', 'Investigar a causa da falha de fluxo (obstrução, problema na bomba, etc.) e corrigir.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Não Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Não Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=16cY-Utuo8J5N8eptrPI_F5FdIVnGBLNm', 'CRISTIAN CARLOS', '2026-10-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '08_C'
    AND b.data_inspecao = '2025-10-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-17', '07_A', 'Funcional Anual', 'Reprovado com Pendências', 'CRÍTICO: Substituir a placa de orifício por uma compatível com o modelo da câmara. A placa incorreta compromete a vazão e eficiência do sistema.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Não Conforme","Verificação de fluxo de água/espuma":"Não Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Não Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1AN6SsM_D-8rwSfdWPVecjf7H5VeGzLSx', 'CRISTIAN CARLOS', '2026-10-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '07_A'
    AND b.data_inspecao = '2025-10-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-17', '07_B', 'Funcional Anual', 'Reprovado com Pendências', 'CRÍTICO: Substituir a placa de orifício por uma compatível com o modelo da câmara. A placa incorreta compromete a vazão e eficiência do sistema.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Não Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Não Conforme","Funcionamento do sistema confirmado":"Não Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1N_EtHuCqQpLH2wfLZ0B4e4eBbeIAlUD9', 'CRISTIAN CARLOS', '2026-10-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '07_B'
    AND b.data_inspecao = '2025-10-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-17', '07_C', 'Funcional Anual', 'Reprovado com Pendências', 'CRÍTICO: Substituir a placa de orifício por uma compatível com o modelo da câmara. A placa incorreta compromete a vazão e eficiência do sistema.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Não Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1qTOnFrGZdLwE92dehSVeCBglVxuW3gW1', 'CRISTIAN CARLOS', '2026-10-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '07_C'
    AND b.data_inspecao = '2025-10-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-09', '07_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=17512_DbUYDGdorsnpcdMPvgpQlYIBRJn', 'CRISTIAN CARLOS', '2026-12-09', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '07_A'
    AND b.data_inspecao = '2025-12-09'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-09', '07_B', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1gZRP2FcPSc1UCSH6_0iJTp1nZMEsReT-', 'CRISTIAN CARLOS', '2026-12-09', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '07_B'
    AND b.data_inspecao = '2025-12-09'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-09', '07_C', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1lK6BZIvMbzAd5S-lbI8tsvXX9aC4ar5e', 'CRISTIAN CARLOS', '2026-12-09', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '07_C'
    AND b.data_inspecao = '2025-12-09'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-09', '011_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=18Z13CjZ9rmz4LKQ6uUnL2TEh3_HozZbI', 'CRISTIAN CARLOS', '2026-12-09', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '011_A'
    AND b.data_inspecao = '2025-12-09'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-11', '02_B', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Tubo de projeção íntegro (sem corrosão ou danos)":"Conforme","Defletor de projeção íntegro e bem fixado":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1J0Q3n4BgDykhqJn-_WVWHHkQGkL4SCek', 'CRISTIAN CARLOS', '2026-12-11', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '02_B'
    AND b.data_inspecao = '2025-12-11'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', '08_C', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1MKZ4E34j_5f13s0ALbrSGNkIhVurZppf', 'CRISTIAN CARLOS', '2026-12-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '08_C'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-21', 'CECI 01', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"Faltando","observacao":"Faltando 1"},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-21', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 01'
    AND b.data_inspecao = '2025-07-21'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-22', 'CECI 01', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Mangueira de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Derivante":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Chave de Acoplamento":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Proporcionador de Espuma":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-21', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 01'
    AND b.data_inspecao = '2025-07-22'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-21', 'CECI 02', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-21', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 02'
    AND b.data_inspecao = '2025-07-21'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-21', 'CECI 03', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Não","Sinalização":"Sim","Acesso":"Não"}}'::jsonb, 'Cristian ferreira', '2025-10-21', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 03'
    AND b.data_inspecao = '2025-07-21'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-22', 'CECI 03', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Mangueira de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Derivante":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Chave de Acoplamento":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Proporcionador de Espuma":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-22', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 03'
    AND b.data_inspecao = '2025-07-22'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 14', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 14'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 01', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 01'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 11', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 11'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 02', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Não","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 02'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 03', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Não","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 03'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 04', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 04'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 05', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"Faltando","observacao":"1 Mangueira de 2 1\\2"},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 05'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 12', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 12'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 06', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"Faltando","observacao":"Faltando 1 chave"},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Não","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 06'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 10', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 10'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 08', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"Faltando","observacao":"1 mangueira"},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Não","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 08'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 07', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 07'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 09', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 09'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-25', 'CECI 13', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-25', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 13'
    AND b.data_inspecao = '2025-07-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-28', 'CECI 05', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Mangueira de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Derivante":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Chave de Acoplamento":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Proporcionador de Espuma":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-28', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 05'
    AND b.data_inspecao = '2025-07-28'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-28', 'CECI 02', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Mangueira de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Derivante":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Chave de Acoplamento":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Proporcionador de Espuma":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-28', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 02'
    AND b.data_inspecao = '2025-07-28'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-28', 'CECI 03', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Mangueira de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Derivante":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Chave de Acoplamento":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Proporcionador de Espuma":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-28', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 03'
    AND b.data_inspecao = '2025-07-28'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-28', 'CECI 06', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Mangueira de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Derivante":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Chave de Acoplamento":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Proporcionador de Espuma":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Canhão Monitor Móvel":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Canhão de Espuma (BAZUCA)":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-28', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 06'
    AND b.data_inspecao = '2025-07-28'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-28', 'CECI 08', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Mangueira de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Derivante":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Chave de Acoplamento":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Proporcionador de Espuma":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Canhão Monitor Móvel":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Redução de 2 1/2 x 1 1/2":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-28', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 08'
    AND b.data_inspecao = '2025-07-28'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-08-27', 'CECI 09', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"Faltando","observacao":"Faltando 1 Mangueira de 1½\""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-11-27', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 09'
    AND b.data_inspecao = '2025-08-27'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-08-27', 'CECI 10', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"Faltando","observacao":"Mangueira de 1½\" Faltando"},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-11-27', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 10'
    AND b.data_inspecao = '2025-08-27'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-02', 'CECI 01', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-02', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 01'
    AND b.data_inspecao = '2025-09-02'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 08', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"Faltando","observacao":"Faltando 2"},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Canhão Monitor Móvel":{"status":"OK","observacao":""},"Redução de 2 1/2 x 1 1/2":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 08'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 10', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Mangueira de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Derivante":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Chave de Acoplamento":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Proporcionador de Espuma":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 10'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 12', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Não","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 12'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 06', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Canhão Monitor Móvel":{"status":"OK","observacao":""},"Canhão de Espuma (BAZUCA)":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Não","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 06'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 02', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 02'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 03', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 03'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 04', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 04'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 05', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 05'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 07', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 07'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 11', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 11'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 13', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 13'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 14', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 14'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-08', 'CECI 06', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Canhão Monitor Móvel":{"status":"OK","observacao":""},"Canhão de Espuma (BAZUCA)":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-08', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 06'
    AND b.data_inspecao = '2025-09-08'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-08', 'CECI 12', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-08', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 12'
    AND b.data_inspecao = '2025-09-08'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 01', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 01'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 02', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 02'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 03', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 03'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 04', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 04'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 05', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 05'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 06', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Canhão Monitor Móvel":{"status":"OK","observacao":""},"Canhão de Espuma (BAZUCA)":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 06'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 07', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 07'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 08', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Canhão Monitor Móvel":{"status":"OK","observacao":""},"Redução de 2 1/2 x 1 1/2":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 08'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 09', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 09'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 10', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 10'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 11', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 11'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 12', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 12'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 13', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 13'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 14', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 14'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-03-13', 'CECI 01', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-06-13', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 01'
    AND b.data_inspecao = '2026-03-13'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-03-13', 'CECI 11', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Não","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-06-13', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 11'
    AND b.data_inspecao = '2026-03-13'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-03-13', 'CECI 02', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-06-13', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 02'
    AND b.data_inspecao = '2026-03-13'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-03-13', 'CECI 03', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-06-13', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 03'
    AND b.data_inspecao = '2026-03-13'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-03-13', 'CECI 04', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"Avariado","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-06-13', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 04'
    AND b.data_inspecao = '2026-03-13'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-03-13', 'CECI 05', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-06-13', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 05'
    AND b.data_inspecao = '2026-03-13'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-03-13', 'CECI 12', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-06-13', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 12'
    AND b.data_inspecao = '2026-03-13'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-03-13', 'CECI 06', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Canhão Monitor Móvel":{"status":"OK","observacao":""},"Canhão de Espuma (BAZUCA)":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-06-13', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 06'
    AND b.data_inspecao = '2026-03-13'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-03-13', 'CECI 09', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-06-13', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 09'
    AND b.data_inspecao = '2026-03-13'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-03-13', 'CECI 07', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-06-13', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 07'
    AND b.data_inspecao = '2026-03-13'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-04-06', 'CECI 08', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Canhão Monitor Móvel":{"status":"OK","observacao":""},"Redução de 2 1/2 x 1 1/2":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-07-06', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 08'
    AND b.data_inspecao = '2026-04-06'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-04-06', 'CECI 10', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-07-06', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 10'
    AND b.data_inspecao = '2026-04-06'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-04-06', 'CECI 13', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-07-06', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 13'
    AND b.data_inspecao = '2026-04-06'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-04-06', 'CECI 14', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-07-06', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 14'
    AND b.data_inspecao = '2026-04-06'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2026-04-14', 'CECI 08', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"Avariado","observacao":"1 esguicho Sem a borracha"},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Canhão Monitor Móvel":{"status":"OK","observacao":""},"Redução de 2 1/2 x 1 1/2":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Não","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-07-14', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 08'
    AND b.data_inspecao = '2026-04-14'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);