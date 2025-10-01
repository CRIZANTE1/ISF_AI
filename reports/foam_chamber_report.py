"""
Módulo para geração de relatórios em PDF das inspeções de câmaras de espuma
"""

import streamlit as st
from weasyprint import HTML, CSS
from datetime import datetime
import pandas as pd
import json
from io import BytesIO
import base64

def generate_foam_chamber_consolidated_report(inspections_df, inventory_df):
    """
    Gera relatório consolidado em PDF de todas as câmaras de espuma inspecionadas
    
    Args:
        inspections_df: DataFrame com as inspeções
        inventory_df: DataFrame com o inventário de câmaras
    
    Returns:
        BytesIO: Arquivo PDF em memória
    """
    
    # Merge dos dados para ter informações completas
    if inspections_df.empty:
        st.warning("Nenhuma inspeção de câmara de espuma encontrada.")
        return None
    
    # Pega a última inspeção de cada câmara
    inspections_df['data_inspecao'] = pd.to_datetime(inspections_df['data_inspecao'])
    latest_inspections = inspections_df.sort_values('data_inspecao').groupby('id_camara').tail(1)
    
    # Merge com inventário
    merged_df = latest_inspections.merge(
        inventory_df[['id_camara', 'localizacao', 'marca', 'modelo', 'tamanho_especifico']], 
        on='id_camara', 
        how='left'
    )
    
    # Gera HTML
    html_content = _generate_html_content(merged_df)
    
    # Converte para PDF
    try:
        pdf_file = BytesIO()
        HTML(string=html_content).write_pdf(pdf_file, stylesheets=[CSS(string=_get_css_styles())])
        pdf_file.seek(0)
        return pdf_file
    except Exception as e:
        st.error(f"Erro ao gerar PDF: {e}")
        return None

def _generate_html_content(df):
    """Gera o conteúdo HTML do relatório"""
    
    current_date = datetime.now().strftime('%d/%m/%Y %H:%M')
    
    # Cabeçalho
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Relatório de Câmaras de Espuma</title>
    </head>
    <body>
        <div class="header">
            <h1>RELATÓRIO CONSOLIDADO</h1>
            <h2>Inspeções de Câmaras de Espuma</h2>
            <p class="report-date">Gerado em: {current_date}</p>
        </div>
        
        <div class="summary">
            <h3>Resumo Geral</h3>
            <table class="summary-table">
                <tr>
                    <td class="summary-item">
                        <div class="summary-number">{len(df)}</div>
                        <div class="summary-label">Total de Câmaras</div>
                    </td>
                    <td class="summary-item approved">
                        <div class="summary-number">{len(df[df['status_geral'] == 'Aprovado'])}</div>
                        <div class="summary-label">Aprovadas</div>
                    </td>
                    <td class="summary-item rejected">
                        <div class="summary-number">{len(df[df['status_geral'] != 'Aprovado'])}</div>
                        <div class="summary-label">Com Pendências</div>
                    </td>
                </tr>
            </table>
        </div>
    """
    
    # Detalhes de cada câmara
    for idx, row in df.iterrows():
        html += _generate_chamber_section(row, idx + 1)
    
    html += """
        <div class="footer">
            <p>Este relatório foi gerado automaticamente pelo Sistema ISF IA</p>
            <p>Para mais informações, consulte o sistema online</p>
        </div>
    </body>
    </html>
    """
    
    return html

def _generate_chamber_section(row, chamber_number):
    """Gera a seção HTML de uma câmara específica"""
    
    status_class = "approved" if row['status_geral'] == "Aprovado" else "rejected"
    status_icon = "✓" if row['status_geral'] == "Aprovado" else "✗"
    
    data_inspecao = pd.to_datetime(row['data_inspecao']).strftime('%d/%m/%Y')
    data_proxima = pd.to_datetime(row['data_proxima_inspecao']).strftime('%d/%m/%Y')
    
    html = f"""
    <div class="chamber-section page-break">
        <div class="chamber-header {status_class}">
            <div class="chamber-number">Câmara #{chamber_number}</div>
            <div class="chamber-status">
                <span class="status-icon">{status_icon}</span>
                {row['status_geral']}
            </div>
        </div>
        
        <div class="chamber-info">
            <table class="info-table">
                <tr>
                    <td class="label">ID da Câmara:</td>
                    <td class="value"><strong>{row['id_camara']}</strong></td>
                    <td class="label">Tipo de Inspeção:</td>
                    <td class="value">{row['tipo_inspecao']}</td>
                </tr>
                <tr>
                    <td class="label">Localização:</td>
                    <td class="value">{row.get('localizacao', 'N/A')}</td>
                    <td class="label">Data da Inspeção:</td>
                    <td class="value">{data_inspecao}</td>
                </tr>
                <tr>
                    <td class="label">Modelo:</td>
                    <td class="value">{row.get('modelo', 'N/A')}</td>
                    <td class="label">Próxima Inspeção:</td>
                    <td class="value"><strong>{data_proxima}</strong></td>
                </tr>
                <tr>
                    <td class="label">Tamanho:</td>
                    <td class="value">{row.get('tamanho_especifico', 'N/A')}</td>
                    <td class="label">Inspetor:</td>
                    <td class="value">{row['inspetor']}</td>
                </tr>
                <tr>
                    <td class="label">Marca:</td>
                    <td class="value">{row.get('marca', 'N/A')}</td>
                    <td class="label"></td>
                    <td class="value"></td>
                </tr>
            </table>
        </div>
    """
    
    # Checklist de resultados
    html += _generate_checklist_html(row['resultados_json'])
    
    # Plano de ação (se houver pendências)
    if row['status_geral'] != "Aprovado":
        html += f"""
        <div class="action-plan">
            <h4>📋 Plano de Ação</h4>
            <p>{row['plano_de_acao']}</p>
        </div>
        """
    
    # Foto de não conformidade (se houver)
    if row.get('link_foto_nao_conformidade') and str(row['link_foto_nao_conformidade']).strip():
        html += f"""
        <div class="photo-section">
            <h4>📸 Evidência Fotográfica</h4>
            <p class="photo-note">Foto disponível no sistema. Link: <a href="{row['link_foto_nao_conformidade']}" target="_blank">Visualizar Foto</a></p>
        </div>
        """
    
    html += """
    </div>
    """
    
    return html

def _generate_checklist_html(results_json):
    """Gera o HTML do checklist de resultados"""
    
    try:
        results = json.loads(results_json)
    except:
        return "<p>Erro ao carregar resultados da inspeção.</p>"
    
    html = """
    <div class="checklist">
        <h4>✓ Checklist de Inspeção</h4>
        <table class="checklist-table">
            <thead>
                <tr>
                    <th style="width: 70%;">Item Verificado</th>
                    <th style="width: 30%;">Resultado</th>
                </tr>
            </thead>
            <tbody>
    """
    
    for question, answer in results.items():
        result_class = ""
        if answer == "Conforme":
            result_class = "result-ok"
            icon = "✓"
        elif answer == "Não Conforme":
            result_class = "result-nok"
            icon = "✗"
        else:
            result_class = "result-na"
            icon = "—"
        
        html += f"""
                <tr>
                    <td>{question}</td>
                    <td class="{result_class}">{icon} {answer}</td>
                </tr>
        """
    
    html += """
            </tbody>
        </table>
    </div>
    """
    
    return html

def _get_css_styles():
    """Retorna os estilos CSS para o relatório"""
    
    return """
    @page {
        size: A4;
        margin: 1.5cm;
    }
    
    body {
        font-family: 'Arial', sans-serif;
        font-size: 10pt;
        line-height: 1.4;
        color: #333;
    }
    
    .header {
        text-align: center;
        border-bottom: 3px solid #2c3e50;
        padding-bottom: 15px;
        margin-bottom: 25px;
    }
    
    .header h1 {
        color: #2c3e50;
        font-size: 24pt;
        margin: 0 0 5px 0;
    }
    
    .header h2 {
        color: #7f8c8d;
        font-size: 16pt;
        margin: 0;
        font-weight: normal;
    }
    
    .report-date {
        color: #95a5a6;
        font-size: 9pt;
        margin-top: 10px;
    }
    
    .summary {
        background: #ecf0f1;
        padding: 15px;
        border-radius: 5px;
        margin-bottom: 25px;
    }
    
    .summary h3 {
        margin: 0 0 15px 0;
        color: #2c3e50;
    }
    
    .summary-table {
        width: 100%;
        text-align: center;
    }
    
    .summary-item {
        padding: 10px;
        background: white;
        border-radius: 5px;
    }
    
    .summary-item.approved {
        border-left: 4px solid #27ae60;
    }
    
    .summary-item.rejected {
        border-left: 4px solid #e74c3c;
    }
    
    .summary-number {
        font-size: 24pt;
        font-weight: bold;
        color: #2c3e50;
    }
    
    .summary-label {
        font-size: 9pt;
        color: #7f8c8d;
        margin-top: 5px;
    }
    
    .chamber-section {
        margin-bottom: 30px;
        border: 1px solid #ddd;
        border-radius: 5px;
        overflow: hidden;
    }
    
    .page-break {
        page-break-inside: avoid;
    }
    
    .chamber-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 15px;
        color: white;
        font-weight: bold;
    }
    
    .chamber-header.approved {
        background: linear-gradient(135deg, #27ae60, #229954);
    }
    
    .chamber-header.rejected {
        background: linear-gradient(135deg, #e74c3c, #c0392b);
    }
    
    .chamber-number {
        font-size: 12pt;
    }
    
    .chamber-status {
        font-size: 11pt;
    }
    
    .status-icon {
        font-size: 14pt;
        margin-right: 5px;
    }
    
    .chamber-info {
        padding: 15px;
        background: white;
    }
    
    .info-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .info-table td {
        padding: 6px 8px;
        border-bottom: 1px solid #ecf0f1;
    }
    
    .info-table .label {
        width: 25%;
        color: #7f8c8d;
        font-weight: 600;
        font-size: 9pt;
    }
    
    .info-table .value {
        width: 25%;
        color: #2c3e50;
    }
    
    .checklist {
        padding: 15px;
        background: #f9f9f9;
    }
    
    .checklist h4 {
        margin: 0 0 10px 0;
        color: #2c3e50;
    }
    
    .checklist-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
    }
    
    .checklist-table th {
        background: #34495e;
        color: white;
        padding: 8px;
        text-align: left;
        font-size: 9pt;
    }
    
    .checklist-table td {
        padding: 6px 8px;
        border-bottom: 1px solid #ecf0f1;
        font-size: 9pt;
    }
    
    .result-ok {
        color: #27ae60;
        font-weight: bold;
    }
    
    .result-nok {
        color: #e74c3c;
        font-weight: bold;
    }
    
    .result-na {
        color: #95a5a6;
    }
    
    .action-plan {
        padding: 15px;
        background: #fff3cd;
        border-left: 4px solid #ffc107;
    }
    
    .action-plan h4 {
        margin: 0 0 8px 0;
        color: #856404;
    }
    
    .action-plan p {
        margin: 0;
        color: #856404;
        font-size: 9pt;
    }
    
    .photo-section {
        padding: 15px;
        background: #e8f4f8;
        border-left: 4px solid #3498db;
    }
    
    .photo-section h4 {
        margin: 0 0 8px 0;
        color: #2c3e50;
    }
    
    .photo-note {
        margin: 0;
        font-size: 9pt;
        color: #555;
    }
    
    .photo-note a {
        color: #3498db;
        text-decoration: none;
    }
    
    .footer {
        margin-top: 30px;
        padding-top: 15px;
        border-top: 2px solid #ecf0f1;
        text-align: center;
        color: #95a5a6;
        font-size: 8pt;
    }
    
    .footer p {
        margin: 3px 0;
    }
    """
