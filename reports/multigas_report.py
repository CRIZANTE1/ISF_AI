import pandas as pd
from datetime import datetime

# URL da imagem do logo (upload em um local público ou usar ID do Drive)
LOGO_URL = "https://sindicom.com.br/wp-content/uploads/2021/11/vibra-sem-fundo.png" # Logo da Vibra (exemplo)

def generate_bump_test_html(df_tests, df_inventory, unit_name):
    """
    Gera um relatório de Registro de Bump Test em HTML com base nos dados fornecidos.
    """
    
    # Junta os dados dos testes com os dados do inventário para obter marca, modelo, etc.
    if not df_inventory.empty:
        report_df = pd.merge(
            df_tests,
            df_inventory[['id_equipamento', 'marca', 'modelo', 'numero_serie']],
            on='id_equipamento',
            how='left'
        )
    else:
        report_df = df_tests
        report_df[['marca', 'modelo', 'numero_serie']] = 'N/A'
    
    # Formata as colunas de data e hora
    report_df['data_teste_fmt'] = pd.to_datetime(report_df['data_teste']).dt.strftime('%d/%m/%Y')
    report_df['hora_teste_fmt'] = report_df['hora_teste'].apply(lambda x: x.split(':')[0] + ':' + x.split(':')[1] if isinstance(x, str) and ':' in x else 'N/A')

    # Gera as linhas da tabela
    table_rows_html = ""
    for _, row in report_df.iterrows():
        table_rows_html += f"""
        <tr>
            <td>{row['data_teste_fmt']}<br>Hora: {row['hora_teste_fmt']}</td>
            <td>Marca: {row.get('marca', '')}<br>Modelo: {row.get('modelo', '')}<br>Nº série: {row.get('numero_serie', '')}</td>
            <td>LEL<br>{row.get('LEL_encontrado', '')}</td>
            <td>O²<br>{row.get('O2_encontrado', '')}</td>
            <td>H²S<br>{row.get('H2S_encontrado', '')}</td>
            <td>CO<br>{row.get('CO_encontrado', '')}</td>
            <td>Periódico ({'X' if row.get('tipo_teste') == 'Periódico' else ' '})<br>Extraordinário ({'X' if row.get('tipo_teste') == 'Extraordinário' else ' '})</td>
            <td>Aprovado ({'X' if row.get('resultado_teste') == 'Aprovado' else ' '})<br>Reprovado ({'X' if row.get('resultado_teste') == 'Reprovado' else ' '})</td>
            <td>Nome: {row.get('responsavel_nome', '')}<br>Matrícula: {row.get('responsavel_matricula', '')}<br>Assinatura:</td>
        </tr>
        """
        
    # Preenche com linhas vazias para completar o formulário (total de 20 linhas)
    num_empty_rows = max(0, 20 - len(report_df))
    for _ in range(num_empty_rows):
        table_rows_html += """
        <tr>
            <td>__/__/____<br>Hora: ____</td>
            <td>Marca: <br>Modelo: <br>Nº série:</td>
            <td>LEL<br>____</td>
            <td>O²<br>____</td>
            <td>H²S<br>____</td>
            <td>CO<br>____</td>
            <td>Periódico ( )<br>Extraordinário ( )</td>
            <td>Aprovado ( )<br>Reprovado ( )</td>
            <td>Nome:<br>Matrícula:<br>Assinatura:</td>
        </tr>
        """
        
    styles = """
    <style>
        @media print { body { -webkit-print-color-adjust: exact; } }
        body { font-family: sans-serif; font-size: 10px; }
        .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #000; padding-bottom: 5px; }
        .header-left img { width: 150px; }
        .header-center { text-align: center; }
        .header-center h1, .header-center h2 { margin: 0; padding: 0; }
        .header-center h1 { font-size: 12px; }
        .header-center h2 { font-size: 14px; }
        .info-bar { display: flex; justify-content: space-between; border: 1px solid #000; padding: 5px; margin: 10px 0; }
        table { width: 100%; border-collapse: collapse; border: 2px solid #000; }
        th, td { border: 1px solid #000; padding: 4px; text-align: left; vertical-align: top; }
        th { background-color: #e0e0e0; text-align: center; }
        .footer { font-size: 8px; border: 1px solid #000; padding: 5px; margin-top: 10px; }
    </style>
    """

    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Registro de Bump Test</title>
        {styles}
    </head>
    <body>
        <div class="header">
            <div class="header-left"><img src="{LOGO_URL}" alt="Logo"></div>
            <div class="header-center">
                <h2>040.010.060.004.PR</h2>
                <h1>Anexo G – Registro de realização Bump Test</h1>
            </div>
            <div class="header-right"></div>
        </div>

        <div class="info-bar">
            <span><strong>Unidade:</strong> {unit_name}</span>
            <span><strong>Empresa:</strong> VIBRA ENERGIA</span>
        </div>

        <table>
            <thead>
                <tr>
                    <th width="10%">Data e hora de realização do teste</th>
                    <th width="20%">Equipamento</th>
                    <th colspan="4">Valores encontrados</th>
                    <th width="10%">Tipo de teste</th>
                    <th width="10%">Resultado do teste</th>
                    <th width="20%">Responsável pelos testes</th>
                </tr>
            </thead>
            <tbody>
                {table_rows_html}
            </tbody>
        </table>

        <div class="footer">
            <strong>IMPORTANTE!!!</strong> Para que o equipamento seja considerado aprovado no bumptest, o mesmo deve realizar a leitura correta da concentração de gases contidos no cilindro de gás padrão, admitindo-se no máximo a diferença de leitura que estiver dentro da margem de erro mencionada no manual do equipamento ou no próprio cilindro de gás utilizado.
        </div>
    </body>
    </html>
    """
    return html_content
