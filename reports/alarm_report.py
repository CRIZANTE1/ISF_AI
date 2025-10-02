import pandas as pd
import json
from datetime import datetime

def generate_alarm_inspection_html(df_inspections, df_inventory, unit_name, period_type="monthly"):
    """
    Gera um relatório de inspeções de sistemas de alarme em HTML.
    
    Args:
        df_inspections: DataFrame com as inspeções de alarme
        df_inventory: DataFrame com o inventário de sistemas
        unit_name: Nome da unidade/empresa
        period_type: Tipo de período ("monthly" ou "biannual")
    
    Returns:
        str: HTML formatado para impressão
    """
    
    # Junta os dados das inspeções com o inventário
    if not df_inventory.empty:
        report_df = pd.merge(
            df_inspections,
            df_inventory[['id_sistema', 'localizacao', 'marca', 'modelo']],
            on='id_sistema',
            how='left'
        )
    else:
        report_df = df_inspections
        report_df[['localizacao', 'marca', 'modelo']] = 'N/A'
    
    # Formata as colunas de data
    report_df['data_inspecao_fmt'] = pd.to_datetime(report_df['data_inspecao']).dt.strftime('%d/%m/%Y')
    
    # Define o título baseado no tipo de período
    if period_type == "biannual":
        # Determina o semestre baseado na primeira inspeção
        first_date = pd.to_datetime(report_df['data_inspecao']).min()
        semester = 1 if first_date.month <= 6 else 2
        period_title = f"{semester}º Semestre de {first_date.year}"
    else:
        first_date = pd.to_datetime(report_df['data_inspecao']).min()
        period_title = first_date.strftime('%B/%Y')
    
    # Gera as linhas da tabela
    table_rows_html = ""
    for _, row in report_df.iterrows():
        status_icon = "✅" if row['status_geral'] == "Aprovado" else "❌"
        status_class = "status-ok" if row['status_geral'] == "Aprovado" else "status-fail"
        
        # Processa os resultados JSON para mostrar não conformidades
        non_conformities = []
        try:
            if pd.notna(row['resultados_json']):
                results = json.loads(row['resultados_json'])
                for item, status in results.items():
                    if status == "Não Conforme":
                        non_conformities.append(item)
        except (json.JSONDecodeError, TypeError):
            pass
        
        non_conf_text = ", ".join(non_conformities[:3]) if non_conformities else "Nenhuma"
        if len(non_conformities) > 3:
            non_conf_text += f" (+ {len(non_conformities) - 3} outros)"
        
        table_rows_html += f"""
        <tr class="{status_class}">
            <td>{row['data_inspecao_fmt']}</td>
            <td>{row['id_sistema']}</td>
            <td>{row.get('localizacao', 'N/A')}</td>
            <td>{row.get('marca', 'N/A')} / {row.get('modelo', 'N/A')}</td>
            <td class="{status_class}">{status_icon} {row['status_geral']}</td>
            <td>{non_conf_text}</td>
            <td>{row['inspetor']}</td>
            <td>{row['plano_de_acao'][:50]}{'...' if len(str(row['plano_de_acao'])) > 50 else ''}</td>
        </tr>
        """
    
    # Preenche com linhas vazias se necessário (mínimo 15 linhas)
    num_empty_rows = max(0, 15 - len(report_df))
    for _ in range(num_empty_rows):
        table_rows_html += """
        <tr>
            <td>__/__/____</td>
            <td>________________</td>
            <td>________________________</td>
            <td>________________________</td>
            <td>( ) Aprovado ( ) Reprovado</td>
            <td>________________________</td>
            <td>________________________</td>
            <td>________________________</td>
        </tr>
        """
    
    # CSS para o relatório (CORRIGIDO para evitar corte de texto)
    styles = """
    <style>
        @page { 
            size: A4 landscape; 
            margin: 15mm; 
        }
        @media print { 
            body { -webkit-print-color-adjust: exact; }
            .footer { page-break-inside: avoid; }
        }
        body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
        .header h1 { font-size: 16px; margin: 0; }
        .header h2 { font-size: 14px; margin: 0; color: #666; }
        .info-bar { display: flex; justify-content: space-between; border: 1px solid #000; padding: 8px; margin: 10px 0; background-color: #f5f5f5; }
        table { width: 100%; border-collapse: collapse; border: 1px solid #000; margin-bottom: 20px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; vertical-align: top; word-wrap: break-word; }
        th { background-color: #e0e0e0; text-align: center; font-weight: bold; }
        .status-ok { background-color: #e8f5e8; }
        .status-fail { background-color: #ffe5e5; }
        .footer { 
            font-size: 9px; 
            border: 1px solid #000; 
            padding: 10px; 
            margin-top: 20px; 
            background-color: #f9f9f9;
            page-break-inside: avoid;
            clear: both;
        }
        .signatures { 
            margin-top: 30px; 
            display: flex; 
            justify-content: space-around;
            page-break-inside: avoid;
        }
        .signature-box { text-align: center; }
        .signature-line { border-top: 1px solid #000; width: 200px; margin: 20px auto 5px; }
    </style>
    """
    
    # Conteúdo HTML completo
    html_content = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Relatório de Inspeções de Sistemas de Alarme</title>
        <meta charset="utf-8">
        {styles}
    </head>
    <body>
        <div class="header">
            <div>
                <h1>RELATÓRIO DE INSPEÇÕES DE SISTEMAS DE ALARME</h1>
                <h2>Período: {period_title}</h2>
            </div>
            <div>
                <strong>Data:</strong> {datetime.now().strftime('%d/%m/%Y')}<br>
                <strong>Unidade:</strong> {unit_name}
            </div>
        </div>

        <div class="info-bar">
            <span><strong>Total de Sistemas Inspecionados:</strong> {len(report_df)}</span>
            <span><strong>Aprovados:</strong> {len(report_df[report_df['status_geral'] == 'Aprovado'])}</span>
            <span><strong>Com Pendências:</strong> {len(report_df[report_df['status_geral'] != 'Aprovado'])}</span>
        </div>

        <table>
            <thead>
                <tr>
                    <th width="10%">Data da Inspeção</th>
                    <th width="12%">ID do Sistema</th>
                    <th width="15%">Localização</th>
                    <th width="15%">Marca / Modelo</th>
                    <th width="12%">Status</th>
                    <th width="20%">Não Conformidades</th>
                    <th width="12%">Inspetor</th>
                    <th width="24%">Plano de Ação</th>
                </tr>
            </thead>
            <tbody>
                {table_rows_html}
            </tbody>
        </table>

        <div class="footer">
            <strong>OBSERVAÇÕES:</strong><br>
            • Sistemas de alarme devem ser inspecionados semanalmente conforme procedimento padrão<br>
            • Não conformidades devem ser corrigidas imediatamente<br>
            • Este relatório deve ser arquivado por no mínimo 5 anos<br>
            • Em caso de dúvidas, consulte o responsável técnico
        </div>

        <div class="signatures">
            <div class="signature-box">
                <div class="signature-line"></div>
                <strong>Responsável Técnico</strong><br>
                Nome / Assinatura
            </div>
            <div class="signature-box">
                <div class="signature-line"></div>
                <strong>Supervisor de Segurança</strong><br>
                Nome / Assinatura
            </div>
        </div>
    </body>
    </html>
    """
    
    return html_content
