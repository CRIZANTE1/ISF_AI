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