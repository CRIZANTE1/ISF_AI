INSERT INTO log_baixa_extintores (data_baixa, numero_identificacao, motivo_condenacao, responsavel_baixa, numero_identificacao_substituto, observacoes, link_foto_evidencia, user_id)
SELECT '2026-03-14', '15776', 'Casco danificado irreparavelmente', 'Desenvolvedor (Mestre)', NULL, NULL, NULL, '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM log_baixa_extintores b
  WHERE b.numero_identificacao = '15776'
    AND b.data_baixa = '2026-03-14'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);;