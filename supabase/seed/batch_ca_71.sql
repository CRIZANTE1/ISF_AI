INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-09-04', 'CECI 08', 'Reprovado com Pendências', '{"Mangueira de 1½\"":{"status":"Faltando","observacao":"Faltando 2"},"Mangueira de 2½\"":{"status":"OK","observacao":""},"Esguicho de 1½\"":{"status":"OK","observacao":""},"Esguicho de 2½\"":{"status":"OK","observacao":""},"Derivante":{"status":"OK","observacao":""},"Chave de Acoplamento":{"status":"OK","observacao":""},"Proporcionador de Espuma":{"status":"OK","observacao":""},"Canhão Monitor Móvel":{"status":"OK","observacao":""},"Redução de 2 1/2 x 1 1/2":{"status":"OK","observacao":""},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-12-04', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 08'
    AND b.data_inspecao = '2025-09-04'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);