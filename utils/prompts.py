def get_extinguisher_inspection_prompt():
    """
    Retorna um prompt robusto e inteligente para extrair dados de relatórios de extintores,
    determinando automaticamente o nível de serviço para cada item.
    """
    return """
    Você é um especialista em analisar relatórios de inspeção e manutenção de extintores de incêndio.
    Sua tarefa é analisar o relatório PDF fornecido e extrair informações detalhadas para CADA extintor listado.
    O identificador principal e permanente é o "N° DO CILINDRO / RECIPIENTE" ou "Extin.".

    **Para cada extintor (cada linha da tabela), extraia os seguintes campos NA ORDEM EXATA:**

    1.  `numero_identificacao`: Extraia da coluna "N° DO CILINDRO / RECIPIENTE". Este é o campo chave.
    2.  `numero_selo_inmetro`: Extraia da coluna "N° SELO INMETRO / CASA DA MOEDA".
    3.  `tipo_agente`: Extraia da coluna "Tipo" ou "TIPO".
    4.  `capacidade`: Extraia da coluna "CAPAC. CARGA" ou do tipo (ex: "PQS 4,5KG").
    5.  `marca_fabricante`: Extraia da coluna "FABRIC. OU MARCA".
    6.  `ano_fabricacao`: Extraia da coluna "ANO FABRIC formate ex: 10 para 2010.".
    7.  `tipo_servico`: **CAMPO ESSENCIAL.** Determine o tipo de serviço com a seguinte prioridade:
        *   **Primeiro**, verifique se a coluna "MANUTENÇÃO NÍVEL" existe. Se o valor for '3', retorne "Manutenção Nível 3".
        *   **Se não for 3**, verifique se o valor é '2'. Se sim, retorne "Manutenção Nível 2".
        *   **Se a coluna não existir ou não for 2 ou 3**, verifique a coluna "Nivel da Inspeção". Se o valor for '1', retorne "Inspeção".
        *   Use "Inspeção" como valor padrão se nenhuma das condições acima for atendida.
    8.  `data_servico`: Use a data global do relatório (ex: "Data saída....:" ou a data no cabeçalho). Formato YYYY-MM-DD, não inclua hora.
    9.  `inspetor_responsavel`: Nome do responsável técnico.
    10. `empresa_executante`: Nome da empresa que realizou o serviço.
    11. `aprovado_inspecao`: Da coluna "STATUS" ou "INSPEÇÃO FINAL" ('CONFORME'/'A' = "Sim", 'N/CONFORME'/'R' = "Não").
    12. `observacoes_gerais`: Da coluna "Alterações" ou "PEÇA". Use legendas para decodificar.

    **Formato de Saída OBRIGATÓRIO:**
    Retorne a resposta APENAS como um objeto JSON com uma chave "extintores" contendo uma LISTA de objetos,
    onde cada objeto representa um extintor COM OS CAMPOS NA ORDEM CORRETA.

    Exemplo de formato de saída obrigatório:
    {
      "extintores": [
        {
          "numero_identificacao": "20579",
          "numero_selo_inmetro": "306472069",
          "tipo_agente": "CO2",
          "capacidade": "6 kg",
          "marca_fabricante": "KB",
          "ano_fabricacao": "2021",
          "tipo_servico": "Manutenção Nível 2",
          "data_servico": "2024-10-08",
          "inspetor_responsavel": "Renato Busch",
          "empresa_executante": "Extintores Armênia",
          "aprovado_inspecao": "Sim",
          "observacoes_gerais": "Peças verificadas: 16/51/23/22/24/52/48"
        }
      ]
    }
    """
def get_hose_inspection_prompt():
    """
    Retorna um prompt para extrair dados de certificados de inspeção e manutenção de mangueiras de incêndio.
    """
    return """
    Você é um especialista em analisar relatórios de inspeção de mangueiras de incêndio (NBR 12779).
    Sua tarefa é analisar o documento PDF e extrair informações para CADA mangueira listada na tabela principal.
    O identificador principal é a coluna "IDENTIFICAÇÃO".

    **Para cada mangueira (cada linha da tabela), extraia os seguintes campos:**

    1.  `id_mangueira`: Extraia da coluna "IDENTIFICAÇÃO". Este é o campo chave. Se o valor for "COND", use o valor da coluna "ITEM" precedido de "COND-". Exemplo: "COND-11".
    2.  `marca`: Extraia da coluna "FABRICANTE".
    3.  `diametro`: Extraia da coluna "DIÂMETRO (mm)". Converta polegadas para o formato numérico, por exemplo '2 1/2"' deve ser "2 1/2".
    4.  `tipo`: Extraia da coluna "TIPO".
    5.  `comprimento`: Extraia da coluna "COMPRIMENTO NOMINAL (m)".
    6.  `ano_fabricacao`: Se houver uma coluna de ano de fabricação, use-a. Se não, extraia o ano do campo "DATA DA PRÓXIMA MANUTENÇÃO" e subtraia 5 anos, assumindo um ciclo de vida padrão. Retorne apenas o ano.
    7.  `data_inspecao`: **ESSENCIAL**. Encontre a data em que o serviço foi realizado. A melhor fonte é a "Data" no rodapé do documento (Ex: "Data 08 / 2025"). Se essa data não existir, use a "DATA DA PRÓXIMA MANUTENÇÃO" e subtraia 1 ano. Formate como YYYY-MM-DD.
    8.  `data_proximo_teste`: **ESSENCIAL**. Extraia diretamente da coluna "DATA DA PRÓXIMA MANUTENÇÃO". Formate como YYYY-MM-DD. O ano deve ser 2026 conforme o documento.
    9.  `empresa_executante`: Extraia do nome da empresa no topo do relatório (Ex: "THUNDER Equipamentos C/ Incêndio").
    10. `inspetor_responsavel`: Extraia do campo "RESPONSÁVEL TÉCNICO".
    11. `resultado`: Extraia da coluna "RESULTADO FINAL". Use a legenda para decodificar ('A' = "Aprovado", 'R' = "Reprovado", 'C' = "Condenada").

    **Formato de Saída OBRIGATÓRIO:**
    Retorne a resposta APENAS como um objeto JSON com uma chave "mangueiras" contendo uma LISTA de objetos,
    onde cada objeto representa uma mangueira.

    Exemplo de formato de saída obrigatório:
    {
      "mangueiras": [
        {
          "id_mangueira": "01",
          "marca": "BUCKA",
          "diametro": "2 1/2",
          "tipo": "4",
          "comprimento": "15",
          "ano_fabricacao": "2021",
          "data_inspecao": "2025-08-01",
          "data_proximo_teste": "2026-08-01",
          "empresa_executante": "THUNDER Equipamentos C/ Incêndio",
          "inspetor_responsavel": "342.079.138-07 / 14.184.086-9",
          "resultado": "Aprovado"
        },
        {
          "id_mangueira": "COND-11",
          "marca": "KIDDE",
          "diametro": "1 1/2",
          "tipo": "5",
          "comprimento": "15",
          "ano_fabricacao": "2021",
          "data_inspecao": "2025-08-01",
          "data_proximo_teste": null,
          "empresa_executante": "THUNDER Equipamentos C/ Incêndio",
          "inspetor_responsavel": "342.079.138-07 / 14.184.086-9",
          "resultado": "Condenada"
        }
      ]
    }
    """

def get_shelter_inventory_prompt():
    """
    Retorna um prompt para extrair o inventário de abrigos de emergência de um documento.
    """
    return """
    Você é um especialista em analisar documentos de inventário de segurança contra incêndio.
    Sua tarefa é analisar o documento PDF e extrair o inventário de CADA abrigo listado.

    **Para cada abrigo, extraia os seguintes campos:**

    1.  `cliente`: O nome do cliente ou da unidade principal, geralmente no topo do documento (Ex: "VIBRA ENERGIA"). Este campo será o mesmo para todos os abrigos no mesmo documento.
    2.  `id_abrigo`: O identificador do abrigo (Ex: "CECI 01").
    3.  `itens`: Um objeto (dicionário) contendo cada item e sua respectiva quantidade. As chaves devem ser o nome do item e os valores devem ser a quantidade como um número inteiro.

    **Formato de Saída OBRIGATÓRIO:**
    Retorne a resposta APENAS como um objeto JSON com uma chave "abrigos" contendo uma LISTA de objetos,
    onde cada objeto representa um abrigo.

    Exemplo de formato de saída obrigatório para um documento com um único abrigo:
    {
      "abrigos": [
        {
          "cliente": "VIBRA ENERGIA",
          "id_abrigo": "CECI 01",
          "itens": {
            "Mangueira de 1½\"": 2,
            "Mangueira de 2½\"": 2,
            "Esguicho de 1½\"": 2,
            "Esguicho de 2½\"": 1,
            "Derivante": 1,
            "Chave de Acoplamento": 4,
            "Proporcionador de Espuma": 0
          }
        }
      ]
    }
    """    

def get_scba_inspection_prompt():
    """
    Retorna um prompt para extrair dados de relatórios de teste de
    conjuntos autônomos (SCBA) do tipo Posi3 USB.
    """
    return """
    Você é um especialista em analisar relatórios "Resultados do teste Posi3 USB" para equipamentos de respiração autônoma (SCBA).
    Sua tarefa é analisar o documento PDF e extrair as informações detalhadas do equipamento e seus testes.
    O PDF pode conter múltiplos relatórios em páginas diferentes. Extraia os dados de CADA um.

    **Para cada equipamento/relatório no PDF, extraia os seguintes campos:**

    1.  `data_teste`: A data e hora principal do teste, localizada no topo à direita. Formato: "AAAA-MM-DD HH:MM:SS".
    2.  `data_validade`: A data de validade do laudo, encontrada no final do texto. Formato: "AAAA-MM-DD".
    3.  `numero_serie_equipamento`: O número de série principal do equipamento, rotulado como "S/N".
    4.  `marca`: A marca do equipamento. Ex: "FANGZHAN".
    5.  `modelo`: O modelo do equipamento. Ex: "RHZK6.8".
    6.  `numero_serie_mascara`: O ID auxiliar da "Máscara".
    7.  `numero_serie_segundo_estagio`: O ID auxiliar do "Segundo estágio".
    8.  `resultado_final`: A conclusão geral do teste, geralmente "APTO PARA USO".
    9.  `vazamento_mascara_resultado`: O status do teste "Vazamento de máscara" (Ex: "Aprovado").
    10. `vazamento_mascara_valor`: O valor numérico e a unidade do teste "Vazamento de máscara" (Ex: "0,2 mbar").
    11. `vazamento_pressao_alta_resultado`: O status do teste "Vazamento de pressão alta" (Ex: "Aprovado").
    12. `vazamento_pressao_alta_valor`: O valor numérico e a unidade do teste "Vazamento de pressão alta" (Ex: "0,7 bar").
    13. `pressao_alarme_resultado`: O status do teste "300 bar Whistle" (Ex: "Aprovado").
    14. `pressao_alarme_valor`: O valor numérico e a unidade do teste "300 bar Whistle" (Ex: "57,0 bar").
    15. `empresa_executante`: O nome da empresa que realizou o teste. Ex: "TECNO SERVICE DO BRASIL LTDA".
    16. `responsavel_tecnico`: O nome do responsável técnico que assinou o laudo. Ex: "Edmilson Luis da Silva".

    **Formato de Saída OBRIGATÓRIO:**
    Retorne a resposta APENAS como um objeto JSON com uma chave "scbas" contendo uma LISTA de objetos,
    onde cada objeto representa um equipamento SCBA.

    Exemplo de formato de saída:
    {
      "scbas": [
        {
          "data_teste": "2024-10-14 12:55:32",
          "data_validade": "2025-10-14",
          "numero_serie_equipamento": "19268077",
          "marca": "FANGZHAN",
          "modelo": "RHZK6.8",
          "numero_serie_mascara": "2020053642",
          "numero_serie_segundo_estagio": "190311389",
          "resultado_final": "APTO PARA USO",
          "vazamento_mascara_resultado": "Aprovado",
          "vazamento_mascara_valor": "0,2 mbar",
          "vazamento_pressao_alta_resultado": "Aprovado",
          "vazamento_pressao_alta_valor": "0,7 bar",
          "pressao_alarme_resultado": "Aprovado",
          "pressao_alarme_valor": "57,0 bar",
          "empresa_executante": "TECNO SERVICE DO BRASIL LTDA",
          "responsavel_tecnico": "Edmilson Luis da Silva"
        }
      ]
    }
    """

def get_air_quality_prompt():
    """
    Retorna um prompt para extrair a data e o resultado de um Laudo de Qualidade do Ar.
    """
    return """
    Você é um especialista em analisar "Laudos de Qualidade do Ar" para compressores.
    Sua tarefa é analisar o documento PDF e extrair APENAS as seguintes informações-chave:

    1.  `data_ensaio`: A data em que o ensaio foi realizado, encontrada como "DATA DO ENSAIO". Se não encontrar, use a data da assinatura no final do documento. Formato: "AAAA-MM-DD".
    2.  `resultado_geral`: A conclusão geral do teste, encontrada na seção "RESULTADO". A palavra-chave é "aprovado". Retorne "Aprovado" se encontrar essa palavra, caso contrário, retorne "Reprovado".
    3.  `observacoes`: Metodologia se houver caso contrario será N/A.
    4.  `cilindros`: Uma LISTA de strings contendo apenas os números de série de CADA cilindro listado na tabela (coluna "Nº CILINDRO").
    
    **Formato de Saída OBRIGATÓRIO:**
    Retorne a resposta APENAS como um objeto JSON com uma chave "laudo".

    Exemplo de formato de saída:
    {
      "laudo": {
        "data_ensaio": "2024-09-20",
        "resultado_geral": "Aprovado",
        "observacoes": "Como foi realizado",
        "cilindros": ["1807087005", "1807087148"]
      }
    }
    """
    
def get_multigas_calibration_prompt():
    """
    Retorna um prompt para extrair dados de Certificados de Calibração de detectores multigás.
    """
    return """
    Você é um especialista em analisar Certificados de Calibração de detectores de gás (modelo Almont).
    Sua tarefa é analisar o documento PDF e extrair as informações detalhadas do equipamento e dos resultados.
    O PDF pode conter apenas um relatório.

    **Para o equipamento/relatório no PDF, extraia os seguintes campos:**

    1.  `numero_serie`: O "N.º de Série" do equipamento, encontrado na "Identificação do Item".
    2.  `marca`: A "Marca" do equipamento.
    3.  `modelo`: O "Modelo" do equipamento.
    4.  `data_calibracao`: A "Data da Calibração". Formate como YYYY-MM-DD.
    5.  `proxima_calibracao`: Calcule adicionando 1 ano à `data_calibracao`. Formate como YYYY-MM-DD.
    6.  `numero_certificado`: O número do certificado, localizado no topo (Ex: "N° 1140-2025").
    7.  `empresa_executante`: O nome da empresa que emitiu o certificado (Ex: "Almont do Brasil").
    8.  `tecnico_responsavel`: O nome do "Técnico Executor".
    9.  `resultado_geral`: Verifique a tabela "Resultado Obtido". Se todos os valores na coluna "Erro" estiverem dentro de um limite aceitável (ex: < 5%), considere "Aprovado". Caso contrário, "Reprovado". Use "Aprovado" como padrão se a análise for complexa.
    10. `resultados_detalhados`: Um objeto contendo os resultados para cada gás da tabela "Resultado Obtido". Extraia os valores das colunas "Gás", "V.R" (Valor de Referência) e "R.M" (Resultado da Medição).
        -   CH4 deve ser a chave "LEL".
        -   O2 deve ser a chave "O2".
        -   CO deve ser a chave "CO".
        -   H2S deve ser a chave "H2S".

    **Formato de Saída OBRIGATÓRIO:**
    Retorne a resposta APENAS como um objeto JSON com uma chave "calibracao".

    Exemplo de formato de saída:
    {
      "calibracao": {
        "numero_serie": "MA220-604451",
        "marca": "BW Technologies",
        "modelo": "GasAlert Max XT II",
        "data_calibracao": "2025-03-12",
        "proxima_calibracao": "2026-03-12",
        "numero_certificado": "1140-2025",
        "empresa_executante": "Almont do Brasil Imp. Com. e Repr. Ltda",
        "tecnico_responsavel": "Vinicius L. A. Gonçalez",
        "resultado_geral": "Aprovado",
        "resultados_detalhados": {
          "O2": {"referencia": "18,0", "medido": "18"},
          "LEL": {"referencia": "50,4", "medido": "50"},
          "CO": {"referencia": "102,8", "medido": "103"},
          "H2S": {"referencia": "25,9", "medido": "26"}
        }
      }
    }
    """
