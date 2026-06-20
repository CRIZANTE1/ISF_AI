INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-12-15', 'CECI 12', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":""},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Desenvolvedor (Mestre)', '2026-03-15', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 12'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);