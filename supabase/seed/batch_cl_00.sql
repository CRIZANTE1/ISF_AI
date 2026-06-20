INSERT INTO inventario_chuveiros_lava_olhos (id_equipamento, localizacao, marca, modelo, data_cadastro, user_id)
VALUES
  ('PLECT-02', 'Plataforma 02', 'HAWS', 'CL001KITABS', '2025-08-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('PLECT-16', 'Plataforma 16', 'HAWS', 'CL001KITABS', '2025-08-20', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('PLECT-04', 'Plataforma 04', 'HAWS', 'CL001KITABS', '2025-08-21', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('DESC-AA', 'Descarga desativada', 'HAWS', 'CL001KITABS', '2025-08-22', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('PLECT-06', 'Plataforma 06', 'HAWS', 'CL001KITABS', '2025-08-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('DESC-AH', 'Descarga desativada', 'HAWS', 'CL001KITABS', '2025-08-24', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('PLECT-08', 'Plataforma 08', 'HAWS', 'CL001KITABS', '2025-08-25', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('RUA-C', 'Rua C', 'HAWS', 'CL001KITABS', '2025-08-26', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('PLECT-10', 'Plataforma 10', 'HAWS', 'CL001KITABS', '2025-08-27', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('LAB-01', 'Laboratório', 'HAWS', 'CL001KITABS', '2025-08-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('PLECT-12', 'Plataforma 12', 'HAWS', 'CL001KITABS', '2025-08-29', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('PLECT-14', 'Plataforma 14', 'HAWS', 'CL001KITABS', '2025-08-30', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'),
  ('SAO-01', 'Separador de Agua do Óleo', 'HAWS', 'CL001KITABS', '2025-08-31', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84')
ON CONFLICT (id_equipamento) DO NOTHING;