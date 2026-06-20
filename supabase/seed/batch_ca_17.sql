INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-29', '01_B', 'Visual Semestral', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Tubo de projeção íntegro (sem corrosão ou danos)":"Conforme","Defletor de projeção íntegro e bem fixado":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-02-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '01_B'
    AND b.data_inspecao = '2025-08-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);