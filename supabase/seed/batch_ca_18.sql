INSERT INTO inspecoes_camaras_espuma (data_inspecao, id_camara, tipo_inspecao, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-03', '03_A', 'Funcional Anual', 'Aprovado', 'Manter em monitoramento periódico.', '{"Pintura e estrutura sem corrosão ou amassados":"Conforme","Sem vazamentos visíveis no tanque e conexões":"Conforme","Válvulas em bom estado e lubrificadas":"Conforme","Câmara de espuma íntegra (sem trincas, deformações ou corrosão)":"Conforme","Selo de vidro limpo, íntegro e bem fixado":"Conforme","Junta de vedação em boas condições":"Conforme","Defletor e barragem de espuma íntegros":"Conforme","Tomadas de solução e linhas sem obstrução":"Conforme","Drenos livres e estanques":"Conforme","Ejetores e orifícios desobstruídos":"Conforme","Placa de orifício íntegra e sem obstruções":"Conforme","Placa de orifício compatível com o modelo da câmara":"Conforme","Verificação de fluxo de água/espuma":"Conforme","Verificação de estanqueidade da linha":"Conforme","Funcionamento do sistema confirmado":"Conforme"}'::jsonb, NULL, 'CRISTIAN CARLOS', '2026-10-03', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_camaras_espuma b
  WHERE b.id_camara = '03_A'
    AND b.data_inspecao = '2025-10-03'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);