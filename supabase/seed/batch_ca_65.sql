INSERT INTO inspecoes_abrigos (data_inspecao, id_abrigo, status_geral, resultados_json, inspetor, data_proxima_inspecao, plano_de_acao, user_id)
SELECT '2025-07-28', 'CECI 03', 'Aprovado', '{"Mangueira de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Mangueira de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 1½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Esguicho de 2½\"":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Derivante":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Chave de Acoplamento":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Proporcionador de Espuma":{"status":"OK","observacao":"Regularizado via ação corretiva"},"Condições Gerais":{"Lacre":"Sim","Sinalização":"Sim","Acesso":"Sim"}}'::jsonb, 'Cristian ferreira', '2025-10-28', NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_abrigos b
  WHERE b.id_abrigo = 'CECI 03'
    AND b.data_inspecao = '2025-07-28'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);