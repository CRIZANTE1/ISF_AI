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
    
    current_date = datetime.now().strftime('%d/%m/%Y às %H:%M')
    
    # Cabeçalho
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Relatório de Inspeções - Câmaras de Espuma</title>
    </head>
    <body>
        <div class="header">
            <h1>Relatório Técnico de Inspeções</h1>
            <h2>Câmaras de Espuma para Combate a Incêndio</h2>
            <p class="report-date">Emitido em: {current_date}</p>
        </div>
        
        <div class="summary">
            <h3>Resumo Executivo</h3>
            <table class="summary-table">
                <tr>
                    <td class="summary-item">
                        <div class="summary-number">{len(df)}</div>
                        <div class="summary-label">Total de Equipamentos</div>
                    </td>
                    <td class="summary-item approved">
                        <div class="summary-number">{len(df[df['status_geral'] == 'Aprovado'])}</div>
                        <div class="summary-label">Aprovados</div>
                    </td>
                    <td class="summary-item rejected">
                        <div class="summary-number">{len(df[df['status_geral'] != 'Aprovado'])}</div>
                        <div class="summary-label">Com Não Conformidades</div>
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
            <p>Sistema ISF IA - Gestão de Segurança Contra Incêndio</p>
            <p>Documento gerado automaticamente. Para informações adicionais, consulte o sistema.</p>
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

# Substitua a função _get_css_styles() completamente:

def _get_css_styles():
    """Retorna os estilos CSS sóbrios e corporativos para o relatório"""
    
    return """
    @page {
        size: A4;
        margin: 2.5cm 2cm;
        @bottom-center {
            content: "Página " counter(page);
            font-size: 8pt;
            color: #666;
        }
    }
    
    body {
        font-family: 'Times New Roman', 'Georgia', serif;
        font-size: 11pt;
        line-height: 1.6;
        color: #000;
        background: white;
    }
    
    /* ========== CABEÇALHO PRINCIPAL ========== */
    .header {
        text-align: center;
        border-bottom: 3px double #000;
        padding-bottom: 15px;
        margin-bottom: 25px;
    }
    
    .header h1 {
        color: #000;
        font-size: 18pt;
        margin: 0 0 5px 0;
        font-weight: bold;
        text-transform: uppercase;
        letter-spacing: 1px;
    }
    
    .header h2 {
        color: #333;
        font-size: 14pt;
        margin: 0 0 10px 0;
        font-weight: normal;
    }
    
    .report-date {
        color: #666;
        font-size: 10pt;
        margin-top: 10px;
        font-style: italic;
    }
    
    /* ========== RESUMO EXECUTIVO ========== */
    .summary {
        background: #f5f5f5;
        padding: 15px;
        border: 2px solid #000;
        margin-bottom: 25px;
    }
    
    .summary h3 {
        margin: 0 0 15px 0;
        color: #000;
        font-size: 13pt;
        font-weight: bold;
        text-align: center;
        text-transform: uppercase;
        border-bottom: 1px solid #000;
        padding-bottom: 8px;
    }
    
    .summary-table {
        width: 100%;
        text-align: center;
        border-collapse: collapse;
    }
    
    .summary-item {
        padding: 12px;
        background: white;
        border: 1px solid #333;
    }
    
    .summary-item.approved {
        border-left: 4px solid #000;
    }
    
    .summary-item.rejected {
        border-left: 4px solid #666;
    }
    
    .summary-number {
        font-size: 24pt;
        font-weight: bold;
        color: #000;
        line-height: 1;
    }
    
    .summary-label {
        font-size: 10pt;
        color: #333;
        font-weight: normal;
        margin-top: 5px;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }
    
    /* ========== SEÇÕES DE CÂMARAS ========== */
    .chamber-section {
        margin-bottom: 30px;
        border: 2px solid #000;
        page-break-inside: avoid;
    }
    
    .chamber-header {
        padding: 12px 15px;
        background: #000;
        color: white;
        font-weight: bold;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }
    
    .chamber-header.approved {
        background: #000;
    }
    
    .chamber-header.rejected {
        background: #333;
    }
    
    .chamber-number {
        font-size: 12pt;
    }
    
    .chamber-status {
        font-size: 11pt;
    }
    
    .status-icon {
        margin-right: 5px;
    }
    
    /* ========== INFORMAÇÕES DA CÂMARA ========== */
    .chamber-info {
        padding: 15px;
        background: white;
        border-bottom: 1px solid #000;
    }
    
    .info-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #000;
    }
    
    .info-table td {
        padding: 8px 10px;
        border: 1px solid #ccc;
    }
    
    .info-table .label {
        width: 25%;
        color: #000;
        font-weight: bold;
        font-size: 10pt;
        background: #f0f0f0;
    }
    
    .info-table .value {
        width: 25%;
        color: #000;
        font-size: 10pt;
    }
    
    /* ========== CHECKLIST ========== */
    .checklist {
        padding: 15px;
        background: white;
    }
    
    .checklist h4 {
        margin: 0 0 12px 0;
        color: #000;
        font-size: 11pt;
        font-weight: bold;
        text-transform: uppercase;
        border-bottom: 2px solid #000;
        padding-bottom: 5px;
    }
    
    .checklist-table {
        width: 100%;
        border-collapse: collapse;
        border: 2px solid #000;
    }
    
    .checklist-table th {
        background: #000;
        color: white;
        padding: 10px;
        text-align: left;
        font-size: 10pt;
        font-weight: bold;
        border: 1px solid #000;
    }
    
    .checklist-table td {
        padding: 8px 10px;
        border: 1px solid #ccc;
        font-size: 10pt;
    }
    
    .checklist-table tbody tr:nth-child(even) {
        background: #f9f9f9;
    }
    
    .result-ok {
        color: #000;
        font-weight: bold;
    }
    
    .result-nok {
        color: #000;
        font-weight: bold;
        text-decoration: underline;
    }
    
    .result-na {
        color: #666;
        font-style: italic;
    }
    
    /* ========== PLANO DE AÇÃO ========== */
    .action-plan {
        padding: 15px;
        background: #f5f5f5;
        border: 2px solid #000;
        margin: 15px;
    }
    
    .action-plan h4 {
        margin: 0 0 10px 0;
        color: #000;
        font-size: 11pt;
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .action-plan p {
        margin: 0;
        color: #000;
        font-size: 10pt;
        line-height: 1.6;
    }
    
    /* ========== SEÇÃO DE FOTO ========== */
    .photo-section {
        padding: 15px;
        background: white;
        border-top: 1px solid #000;
    }
    
    .photo-section h4 {
        margin: 0 0 12px 0;
        color: #000;
        font-size: 11pt;
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .photo-container {
        text-align: center;
        background: white;
        padding: 10px;
        border: 2px solid #000;
        margin-bottom: 8px;
    }
    
    .evidence-photo {
        max-width: 100%;
        max-height: 350px;
        height: auto;
        border: 1px solid #ccc;
    }
    
    .photo-caption {
        margin: 8px 0 0 0;
        font-size: 9pt;
        color: #333;
        text-align: center;
        font-style: italic;
    }
    
    /* ========== RODAPÉ ========== */
    .footer {
        margin-top: 30px;
        padding: 15px 0;
        border-top: 3px double #000;
        text-align: center;
        color: #333;
        font-size: 9pt;
    }
    
    .footer p {
        margin: 3px 0;
        line-height: 1.4;
    }
    
    .footer p:first-child {
        font-weight: bold;
        color: #000;
    }
    """
