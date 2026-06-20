INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'LAB-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'LAB-01'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);