-- BAERI chuveiros/lava-olhos import (idempotente)

-- user_id: 2cce6373-6ecc-4bf3-a44c-1df959d7cc84

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

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-08-19', 'PLECT-02', 'Reprovado com Pendências', 'Programar a pintura de demarcação do piso conforme norma.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Não Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1EjFQrpkkOzjeg_peoUez4F5wvPO86npZ', 'Cristian ferreira', '2025-09-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-02'
    AND b.data_inspecao = '2025-08-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'PLECT-14', 'Reprovado com Pendências', 'Limpar ou substituir os esguichos/bocais do lava-olhos.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Não Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, 'https://drive.google.com/uc?export=view&id=1IYsNLdzBz0jGJe8UFyzbFbwsSPUpiWFd', 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-14'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'DESC-AA', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AA'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'DESC-AH', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AH'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'LAB-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'LAB-01'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'PLECT-02', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-02'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'PLECT-04', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-04'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'PLECT-06', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-06'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'PLECT-08', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-08'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'PLECT-10', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-10'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'PLECT-12', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-12'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'PLECT-16', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-16'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'RUA-C', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'RUA-C'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-09-23', 'SAO-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-10-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'SAO-01'
    AND b.data_inspecao = '2025-09-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-12', 'PLECT-14', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-14'
    AND b.data_inspecao = '2025-10-12'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'PLECT-02', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Não Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-02'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'PLECT-14', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Não Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-14'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'DESC-AA', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AA'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'DESC-AH', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AH'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'LAB-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'LAB-01'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'PLECT-04', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-04'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'PLECT-06', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-06'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'PLECT-08', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-08'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'PLECT-10', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-10'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'PLECT-12', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-12'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'PLECT-16', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-16'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'RUA-C', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'RUA-C'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-10-19', 'SAO-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-11-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'SAO-01'
    AND b.data_inspecao = '2025-10-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'PLECT-02', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Não Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-02'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'PLECT-14', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Não Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-14'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'DESC-AA', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AA'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'DESC-AH', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AH'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'LAB-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'LAB-01'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'PLECT-04', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-04'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'PLECT-06', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-06'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'PLECT-08', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-08'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'PLECT-10', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-10'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'PLECT-12', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-12'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'PLECT-16', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-16'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'RUA-C', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'RUA-C'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-11-19', 'SAO-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2025-12-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'SAO-01'
    AND b.data_inspecao = '2025-11-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'PLECT-02', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Não Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-02'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'PLECT-14', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Não Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-14'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'DESC-AA', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AA'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'DESC-AH', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AH'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'LAB-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'LAB-01'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'PLECT-04', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-04'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'PLECT-06', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-06'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'PLECT-08', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-08'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'PLECT-10', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-10'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'PLECT-12', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-12'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'PLECT-16', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-16'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'RUA-C', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'RUA-C'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2025-12-15', 'SAO-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-01-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'SAO-01'
    AND b.data_inspecao = '2025-12-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'PLECT-02', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-02'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'PLECT-04', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-04'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'PLECT-06', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-06'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'PLECT-08', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-08'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'PLECT-10', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-10'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'PLECT-12', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-12'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'PLECT-14', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-14'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'PLECT-16', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-16'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'DESC-AA', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AA'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'DESC-AH', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AH'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'LAB-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'LAB-01'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'RUA-C', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'RUA-C'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-01-15', 'SAO-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-02-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'SAO-01'
    AND b.data_inspecao = '2026-01-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'PLECT-02', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-02'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'PLECT-04', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-04'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'PLECT-06', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-06'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'PLECT-08', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-08'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'PLECT-10', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-10'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'PLECT-12', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-12'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'PLECT-14', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-14'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'PLECT-16', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-16'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'DESC-AA', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AA'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'DESC-AH', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AH'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'LAB-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'LAB-01'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'RUA-C', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'RUA-C'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-02-15', 'SAO-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'SAO-01'
    AND b.data_inspecao = '2026-02-15'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'PLECT-02', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-03-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-02'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'PLECT-04', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-04'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'PLECT-06', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-06'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'PLECT-08', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-08'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'PLECT-10', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-10'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'PLECT-12', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-12'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'PLECT-14', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-14'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'PLECT-16', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-16'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'DESC-AA', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AA'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'DESC-AH', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AH'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'LAB-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'LAB-01'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-03-16', 'RUA-C', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'RUA-C'
    AND b.data_inspecao = '2026-03-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-16', 'SAO-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-15', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'SAO-01'
    AND b.data_inspecao = '2026-04-16'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-17', 'PLECT-02', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-16', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-02'
    AND b.data_inspecao = '2026-04-17'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-18', 'PLECT-04', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-17', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-04'
    AND b.data_inspecao = '2026-04-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-19', 'PLECT-06', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-06'
    AND b.data_inspecao = '2026-04-19'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-20', 'PLECT-08', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-19', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-08'
    AND b.data_inspecao = '2026-04-20'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-21', 'PLECT-10', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-20', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-10'
    AND b.data_inspecao = '2026-04-21'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-22', 'PLECT-12', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-21', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-12'
    AND b.data_inspecao = '2026-04-22'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-23', 'PLECT-14', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-22', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-14'
    AND b.data_inspecao = '2026-04-23'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-24', 'PLECT-16', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-23', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-16'
    AND b.data_inspecao = '2026-04-24'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-25', 'DESC-AA', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-24', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AA'
    AND b.data_inspecao = '2026-04-25'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-26', 'DESC-AH', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-25', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AH'
    AND b.data_inspecao = '2026-04-26'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-27', 'LAB-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-26', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'LAB-01'
    AND b.data_inspecao = '2026-04-27'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-28', 'RUA-C', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-27', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'RUA-C'
    AND b.data_inspecao = '2026-04-28'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-04-29', 'SAO-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-05-28', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'SAO-01'
    AND b.data_inspecao = '2026-04-29'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'SAO-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'SAO-01'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'PLECT-02', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-02'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'PLECT-04', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-04'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'PLECT-06', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-06'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'PLECT-08', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-08'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'PLECT-10', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-10'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'PLECT-12', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-12'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'PLECT-14', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-14'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'PLECT-16', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'PLECT-16'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'DESC-AA', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AA'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'DESC-AH', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'DESC-AH'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'LAB-01', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'LAB-01'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);

INSERT INTO inspecoes_chuveiros_lava_olhos (data_inspecao, id_equipamento, status_geral, plano_de_acao, resultados_json, link_foto_nao_conformidade, inspetor, data_proxima_inspecao, user_id)
SELECT '2026-05-18', 'RUA-C', 'Aprovado', 'Manter em monitoramento periódico.', '{"A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?":"Conforme","A PRESSÃO ESTÁ ADEQUADA?":"Conforme","A PINTURA ESTA ÍNTEGRA?":"Conforme","OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?":"Conforme","O ACESSO ESTÁ LIVRE?":"Conforme","NIVELAMENTO POSSUI DESNÍVEL?":"Conforme","A DRENAGEM DE ÁGUA FUNCIONA?":"Conforme","O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?":"Conforme","O FILTRO ESTÁ LIMPO?":"Conforme","O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?":"Conforme","O PISO POSSUI ADERÊNCIA?":"Conforme","OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?":"Conforme","O EQUIPAMENTO POSSUI CORROSÃO?":"Conforme","EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?":"Conforme","OS ESGUICHOS POSSUEM DEFEITOS?":"Conforme","O PISO ESTÁ DANIFICADO?":"Conforme"}'::jsonb, NULL, 'Cristian ferreira', '2026-06-18', '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
WHERE NOT EXISTS (
  SELECT 1 FROM inspecoes_chuveiros_lava_olhos b
  WHERE b.id_equipamento = 'RUA-C'
    AND b.data_inspecao = '2026-05-18'
    AND b.user_id = '2cce6373-6ecc-4bf3-a44c-1df959d7cc84'
);