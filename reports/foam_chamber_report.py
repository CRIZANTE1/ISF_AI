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
        photo_url = row['link_foto_nao_conformidade']
        
        # Converte link do Google Drive para formato de download direto
        if 'drive.google.com' in photo_url:
            if '/file/d/' in photo_url:
                file_id = photo_url.split('/file/d/')[1].split('/')[0]
                photo_url = f"https://drive.google.com/uc?export=view&id={file_id}"
            elif 'id=' in photo_url:
                # Já está no formato correto
                pass
        
        html += f"""
        <div class="photo-section">
            <h4>📸 Evidência Fotográfica</h4>
            <div class="photo-container">
                <img src="{photo_url}" alt="Foto de não conformidade" class="evidence-photo" />
            </div>
            <p class="photo-caption">Registro fotográfico realizado durante a inspeção</p>
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
    """Retorna os estilos CSS profissionais para o relatório"""
    
    return """
    @page {
        size: A4;
        margin: 2cm 1.5cm;
        @bottom-right {
            content: "Página " counter(page) " de " counter(pages);
            font-size: 8pt;
            color: #7f8c8d;
        }
    }
    
    body {
        font-family: 'Segoe UI', 'Arial', sans-serif;
        font-size: 10pt;
        line-height: 1.5;
        color: #2c3e50;
        background: white;
    }
    
    /* ========== CABEÇALHO PRINCIPAL ========== */
    .header {
        text-align: center;
        border-bottom: 4px solid #34495e;
        padding-bottom: 20px;
        margin-bottom: 30px;
        background: linear-gradient(to bottom, #f8f9fa 0%, white 100%);
        padding-top: 15px;
    }
    
    .header h1 {
        color: #2c3e50;
        font-size: 26pt;
        margin: 0 0 8px 0;
        font-weight: 700;
        letter-spacing: -0.5px;
        text-transform: uppercase;
    }
    
    .header h2 {
        color: #34495e;
        font-size: 18pt;
        margin: 0 0 12px 0;
        font-weight: 400;
    }
    
    .report-date {
        color: #7f8c8d;
        font-size: 9pt;
        margin-top: 12px;
        font-weight: 500;
    }
    
    /* ========== RESUMO EXECUTIVO ========== */
    .summary {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        padding: 20px;
        border-radius: 8px;
        margin-bottom: 30px;
        color: white;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }
    
    .summary h3 {
        margin: 0 0 18px 0;
        color: white;
        font-size: 14pt;
        font-weight: 600;
        text-align: center;
    }
    
    .summary-table {
        width: 100%;
        text-align: center;
        border-collapse: separate;
        border-spacing: 10px 0;
    }
    
    .summary-item {
        padding: 15px;
        background: rgba(255, 255, 255, 0.95);
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    
    .summary-item.approved {
        border-bottom: 4px solid #27ae60;
    }
    
    .summary-item.rejected {
        border-bottom: 4px solid #e74c3c;
    }
    
    .summary-number {
        font-size: 32pt;
        font-weight: 700;
        color: #2c3e50;
        line-height: 1;
        margin-bottom: 5px;
    }
    
    .summary-label {
        font-size: 10pt;
        color: #7f8c8d;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* ========== SEÇÕES DE CÂMARAS ========== */
    .chamber-section {
        margin-bottom: 35px;
        border: 2px solid #e0e0e0;
        border-radius: 10px;
        overflow: hidden;
        box-shadow: 0 3px 8px rgba(0,0,0,0.08);
        background: white;
    }
    
    .page-break {
        page-break-inside: avoid;
    }
    
    .chamber-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 15px 20px;
        color: white;
        font-weight: 600;
    }
    
    .chamber-header.approved {
        background: linear-gradient(135deg, #27ae60 0%, #229954 100%);
    }
    
    .chamber-header.rejected {
        background: linear-gradient(135deg, #e74c3c 0%, #c0392b 100%);
    }
    
    .chamber-number {
        font-size: 13pt;
        font-weight: 700;
    }
    
    .chamber-status {
        font-size: 12pt;
        display: flex;
        align-items: center;
    }
    
    .status-icon {
        font-size: 16pt;
        margin-right: 8px;
        font-weight: bold;
    }
    
    /* ========== INFORMAÇÕES DA CÂMARA ========== */
    .chamber-info {
        padding: 20px;
        background: #f8f9fa;
        border-bottom: 1px solid #e0e0e0;
    }
    
    .info-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border-radius: 6px;
        overflow: hidden;
    }
    
    .info-table td {
        padding: 10px 12px;
        border-bottom: 1px solid #ecf0f1;
    }
    
    .info-table tr:last-child td {
        border-bottom: none;
    }
    
    .info-table .label {
        width: 25%;
        color: #34495e;
        font-weight: 600;
        font-size: 9pt;
        background: #f8f9fa;
    }
    
    .info-table .value {
        width: 25%;
        color: #2c3e50;
        font-size: 10pt;
    }
    
    /* ========== CHECKLIST ========== */
    .checklist {
        padding: 20px;
        background: white;
    }
    
    .checklist h4 {
        margin: 0 0 15px 0;
        color: #2c3e50;
        font-size: 12pt;
        font-weight: 600;
        padding-bottom: 8px;
        border-bottom: 2px solid #3498db;
    }
    
    .checklist-table {
        width: 100%;
        border-collapse: collapse;
        background: white;
        border: 1px solid #e0e0e0;
        border-radius: 6px;
        overflow: hidden;
    }
    
    .checklist-table th {
        background: linear-gradient(to bottom, #34495e 0%, #2c3e50 100%);
        color: white;
        padding: 12px;
        text-align: left;
        font-size: 10pt;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    .checklist-table td {
        padding: 10px 12px;
        border-bottom: 1px solid #ecf0f1;
        font-size: 9pt;
    }
    
    .checklist-table tbody tr:hover {
        background: #f8f9fa;
    }
    
    .checklist-table tbody tr:last-child td {
        border-bottom: none;
    }
    
    .result-ok {
        color: #27ae60;
        font-weight: 700;
        font-size: 10pt;
    }
    
    .result-nok {
        color: #e74c3c;
        font-weight: 700;
        font-size: 10pt;
    }
    
    .result-na {
        color: #95a5a6;
        font-weight: 600;
    }
    
    /* ========== PLANO DE AÇÃO ========== */
    .action-plan {
        padding: 18px 20px;
        background: linear-gradient(to right, #fff3cd 0%, #ffeaa7 100%);
        border-left: 5px solid #f39c12;
        margin: 20px;
        border-radius: 6px;
    }
    
    .action-plan h4 {
        margin: 0 0 10px 0;
        color: #856404;
        font-size: 11pt;
        font-weight: 700;
    }
    
    .action-plan p {
        margin: 0;
        color: #856404;
        font-size: 10pt;
        line-height: 1.6;
    }
    
    /* ========== SEÇÃO DE FOTO ========== */
    .photo-section {
        padding: 20px;
        background: #f8f9fa;
        border-top: 1px solid #e0e0e0;
    }
    
    .photo-section h4 {
        margin: 0 0 15px 0;
        color: #2c3e50;
        font-size: 11pt;
        font-weight: 600;
    }
    
    .photo-container {
        text-align: center;
        background: white;
        padding: 15px;
        border-radius: 8px;
        border: 2px solid #e0e0e0;
        margin-bottom: 10px;
    }
    
    .evidence-photo {
        max-width: 100%;
        max-height: 400px;
        height: auto;
        border-radius: 6px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.1);
    }
    
    .photo-caption {
        margin: 10px 0 0 0;
        font-size: 9pt;
        color: #7f8c8d;
        text-align: center;
        font-style: italic;
    }
    
    /* ========== RODAPÉ ========== */
    .footer {
        margin-top: 40px;
        padding: 20px 0;
        border-top: 3px solid #34495e;
        text-align: center;
        color: #7f8c8d;
        font-size: 8pt;
        background: linear-gradient(to bottom, white 0%, #f8f9fa 100%);
    }
    
    .footer p {
        margin: 5px 0;
        line-height: 1.4;
    }
    
    .footer p:first-child {
        font-weight: 600;
        color: #34495e;
        font-size: 9pt;
    }
    """
