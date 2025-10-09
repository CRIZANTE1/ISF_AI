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


# Substitua COMPLETAMENTE a função _generate_html_content:

def _generate_html_content(df):
    """Gera o conteúdo HTML do relatório seguindo normas ABNT"""
    
    current_date = datetime.now().strftime('%d/%m/%Y')
    current_time = datetime.now().strftime('%H:%M')
    current_year = datetime.now().strftime('%Y')
    
    # Calcula estatísticas
    total_chambers = len(df)
    approved = len(df[df['status_geral'] == 'Aprovado'])
    rejected = total_chambers - approved
    
    html = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>Relatório Técnico de Inspeções - Câmaras de Espuma</title>
    </head>
    <body>
        <!-- ========== FOLHA DE ROSTO ========== -->
        <div class="cover-page">
            <div class="cover-header">
                <p>SISTEMA ISF IA</p>
                <p>GESTÃO DE SEGURANÇA CONTRA INCÊNDIO</p>
            </div>
            
            <div class="cover-title">
                <h1>RELATÓRIO TÉCNICO DE INSPEÇÕES</h1>
                <h2>Câmaras de Espuma para Combate a Incêndio</h2>
            </div>
            
            <div class="cover-info">
                <p><strong>Tipo de Documento:</strong> Relatório Técnico de Inspeções Periódicas</p>
                <p><strong>Período de Referência:</strong> {current_date}</p>
                <p><strong>Total de Equipamentos Inspecionados:</strong> {total_chambers}</p>
            </div>
            
            <div class="cover-footer">
                <p>São Paulo, {current_date}</p>
            </div>
        </div>
        
        <!-- ========== RESUMO ========== -->
        <div class="abstract-page page-break">
            <h2 class="section-title">RESUMO</h2>
            
            <p class="abstract-text">
                Este relatório técnico apresenta os resultados das inspeções periódicas realizadas em 
                câmaras de espuma para sistemas de combate a incêndio. Foram inspecionados {total_chambers} 
                equipamento(s), sendo {approved} aprovado(s) e {rejected} apresentando não conformidades. 
                As inspeções seguiram os procedimentos técnicos estabelecidos pelas normas NFPA 11 e 
                NBR 17505, abrangendo verificações visuais e testes funcionais. Os resultados indicam 
                {'conformidade geral dos equipamentos' if rejected == 0 else 'necessidade de ações corretivas em equipamentos específicos'}. 
                Todos os equipamentos com não conformidades foram devidamente documentados com planos 
                de ação e evidências fotográficas.
            </p>
            
            <p class="keywords"><strong>Palavras-chave:</strong> Câmara de Espuma. Inspeção Periódica. 
            Sistema de Combate a Incêndio. Segurança. Manutenção Preventiva.</p>
        </div>
        
        <!-- ========== SUMÁRIO ========== -->
        <div class="summary-page page-break">
            <h2 class="section-title">SUMÁRIO</h2>
            
            <div class="toc">
                <p class="toc-item"><span class="toc-number">1</span> INTRODUÇÃO <span class="toc-dots"></span> <span class="toc-page">4</span></p>
                <p class="toc-item"><span class="toc-number">2</span> OBJETIVO <span class="toc-dots"></span> <span class="toc-page">4</span></p>
                <p class="toc-item"><span class="toc-number">3</span> METODOLOGIA <span class="toc-dots"></span> <span class="toc-page">5</span></p>
                <p class="toc-item"><span class="toc-number">4</span> RESULTADOS DAS INSPEÇÕES <span class="toc-dots"></span> <span class="toc-page">6</span></p>
                <p class="toc-item toc-subitem"><span class="toc-number">4.1</span> Resumo Executivo <span class="toc-dots"></span> <span class="toc-page">6</span></p>
                <p class="toc-item toc-subitem"><span class="toc-number">4.2</span> Inspeções Detalhadas <span class="toc-dots"></span> <span class="toc-page">7</span></p>
                <p class="toc-item"><span class="toc-number">5</span> CONSIDERAÇÕES FINAIS <span class="toc-dots"></span> <span class="toc-page">N</span></p>
                <p class="toc-item"><span class="toc-number">6</span> REFERÊNCIAS <span class="toc-dots"></span> <span class="toc-page">N</span></p>
                <p class="toc-item"><span class="toc-number">7</span> ASSINATURAS E APROVAÇÕES <span class="toc-dots"></span> <span class="toc-page">N</span></p>
            </div>
        </div>
        
        <!-- ========== INTRODUÇÃO ========== -->
        <div class="introduction-page page-break">
            <h2 class="section-title"><span class="section-number">1</span> INTRODUÇÃO</h2>
            
            <p class="body-text">
                As câmaras de espuma são dispositivos críticos em sistemas de proteção contra incêndio 
                em instalações que armazenam ou manipulam líquidos inflamáveis. Estes equipamentos 
                desempenham papel fundamental na aplicação controlada de espuma sobre a superfície de 
                tanques de armazenamento, criando uma camada que suprime vapores e extingue chamas.
            </p>
            
            <p class="body-text">
                A manutenção periódica e inspeções regulares destes equipamentos são essenciais para 
                garantir sua operacionalidade em situações de emergência. Este relatório documenta as 
                inspeções realizadas de acordo com as melhores práticas da indústria e normas técnicas 
                aplicáveis.
            </p>
            
            <h2 class="section-title"><span class="section-number">2</span> OBJETIVO</h2>
            
            <p class="body-text">
                O presente relatório tem como objetivos:
            </p>
            
            <ul class="objective-list">
                <li>Documentar o estado operacional das câmaras de espuma inspecionadas;</li>
                <li>Identificar não conformidades e condições que possam comprometer a funcionalidade dos equipamentos;</li>
                <li>Estabelecer planos de ação para correção de não conformidades detectadas;</li>
                <li>Fornecer evidências documentais e fotográficas das condições encontradas;</li>
                <li>Garantir conformidade com as normas NFPA 11 e NBR 17505.</li>
            </ul>
            
            <h2 class="section-title"><span class="section-number">3</span> METODOLOGIA</h2>
            
            <p class="body-text">
                As inspeções foram realizadas seguindo procedimentos padronizados, compreendendo:
            </p>
            
            <p class="body-text"><strong>3.1 Inspeção Visual Semestral:</strong></p>
            <ul class="method-list">
                <li>Verificação de condições gerais (pintura, corrosão, amassados);</li>
                <li>Inspeção de vazamentos em tanques e conexões;</li>
                <li>Verificação do estado de válvulas e componentes;</li>
                <li>Análise da integridade de câmaras, selos e membranas;</li>
                <li>Verificação de obstruções em linhas, drenos e orifícios.</li>
            </ul>
            
            <p class="body-text"><strong>3.2 Teste Funcional Anual:</strong></p>
            <ul class="method-list">
                <li>Todos os itens da inspeção visual;</li>
                <li>Verificação de fluxo de água/espuma;</li>
                <li>Teste de estanqueidade de linhas;</li>
                <li>Confirmação de funcionamento do sistema completo.</li>
            </ul>
            
            <p class="body-text">
                Todas as não conformidades identificadas foram documentadas com registro fotográfico 
                e planos de ação específicos.
            </p>
        </div>
        
        <!-- ========== RESULTADOS ========== -->
        <div class="results-page page-break">
            <h2 class="section-title"><span class="section-number">4</span> RESULTADOS DAS INSPEÇÕES</h2>
            
            <h3 class="subsection-title"><span class="section-number">4.1</span> Resumo Executivo</h3>
            
            <table class="summary-table">
                <thead>
                    <tr>
                        <th>Indicador</th>
                        <th>Quantidade</th>
                        <th>Percentual</th>
                    </tr>
                </thead>
                <tbody>
                    <tr>
                        <td>Total de Equipamentos Inspecionados</td>
                        <td class="center">{total_chambers}</td>
                        <td class="center">100%</td>
                    </tr>
                    <tr>
                        <td>Equipamentos Aprovados</td>
                        <td class="center">{approved}</td>
                        <td class="center">{(approved/total_chambers*100):.1f}%</td>
                    </tr>
                    <tr>
                        <td>Equipamentos com Não Conformidades</td>
                        <td class="center">{rejected}</td>
                        <td class="center">{(rejected/total_chambers*100):.1f}%</td>
                    </tr>
                </tbody>
            </table>
            
            <h3 class="subsection-title"><span class="section-number">4.2</span> Inspeções Detalhadas</h3>
            
            <p class="body-text">
                A seguir são apresentados os resultados detalhados de cada equipamento inspecionado, 
                incluindo identificação, checklist completo, status e ações corretivas quando aplicável.
            </p>
        </div>
    """
    
    # Detalhes de cada câmara
    for idx, row in df.iterrows():
        html += _generate_chamber_section(row, idx + 1)
    
    # Considerações finais
    html += f"""
        <!-- ========== CONSIDERAÇÕES FINAIS ========== -->
        <div class="conclusions-page page-break">
            <h2 class="section-title"><span class="section-number">5</span> CONSIDERAÇÕES FINAIS</h2>
            
            <p class="body-text">
                As inspeções realizadas nas câmaras de espuma demonstraram que {approved} equipamento(s) 
                {"está" if approved == 1 else "estão"} em condições adequadas de operação, atendendo aos 
                requisitos técnicos estabelecidos.
            </p>
            
            {"<p class='body-text'>Não foram identificadas não conformidades que requeiram ação imediata, indicando adequada manutenção preventiva dos equipamentos.</p>" if rejected == 0 else f"<p class='body-text'>{rejected} equipamento(s) apresentou(aram) não conformidades que requerem atenção. Para cada não conformidade identificada, foi estabelecido um plano de ação específico visando a regularização das condições operacionais.</p>"}
            
            <p class="body-text">
                Recomenda-se:
            </p>
            
            <ul class="recommendation-list">
                <li>Execução imediata dos planos de ação estabelecidos para equipamentos reprovados;</li>
                <li>Manutenção do cronograma de inspeções periódicas;</li>
                <li>Registro fotográfico após conclusão das ações corretivas;</li>
                <li>Treinamento contínuo das equipes de operação e manutenção;</li>
                <li>Revisão dos procedimentos operacionais conforme necessário.</li>
            </ul>
            
            <p class="body-text">
                Este relatório permanece válido até a realização da próxima inspeção periódica programada 
                ou até que modificações significativas sejam realizadas nos equipamentos.
            </p>
        </div>
        
        <!-- ========== REFERÊNCIAS ========== -->
        <div class="references-page page-break">
            <h2 class="section-title"><span class="section-number">6</span> REFERÊNCIAS</h2>
            
            <p class="reference-item">
                ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <strong>NBR 17505-7:</strong> Armazenamento 
                de líquidos inflamáveis e combustíveis – Parte 7: Proteção contra incêndio para parques 
                de armazenamento com tanques estacionários. Rio de Janeiro, 2015.
            </p>
            
            <p class="reference-item">
                NATIONAL FIRE PROTECTION ASSOCIATION. <strong>NFPA 11:</strong> Standard for Low-, Medium-, 
                and High-Expansion Foam. Quincy, MA, 2021.
            </p>
            
            <p class="reference-item">
                NATIONAL FIRE PROTECTION ASSOCIATION. <strong>NFPA 25:</strong> Standard for the Inspection, 
                Testing, and Maintenance of Water-Based Fire Protection Systems. Quincy, MA, 2020.
            </p>
            
            <p class="reference-item">
                CORPO DE BOMBEIROS MILITAR DO ESTADO DE SÃO PAULO. <strong>Instrução Técnica nº 17:</strong> 
                Sistema de proteção por espuma. São Paulo, 2019.
            </p>
        </div>
        
        <!-- ========== ASSINATURAS ========== -->
        <div class="signatures-page page-break">
            <h2 class="section-title"><span class="section-number">7</span> ASSINATURAS E APROVAÇÕES</h2>
            
            <p class="body-text">
                As inspeções documentadas neste relatório foram realizadas e revisadas pelos 
                profissionais indicados abaixo, que atestam a veracidade e precisão das informações 
                apresentadas.
            </p>
            
            <div class="signature-block">
                <h3 class="signature-section-title">Responsável Técnico pela Inspeção</h3>
                
                <div class="signature-line">
                    <div class="signature-field">
                        <p class="signature-label">Nome Completo:</p>
                        <div class="signature-input"></div>
                    </div>
                </div>
                
                <div class="signature-line">
                    <div class="signature-field half">
                        <p class="signature-label">Registro Profissional:</p>
                        <div class="signature-input"></div>
                    </div>
                    <div class="signature-field half">
                        <p class="signature-label">Data:</p>
                        <div class="signature-input"></div>
                    </div>
                </div>
                
                <div class="signature-line">
                    <p class="signature-label">Assinatura:</p>
                    <div class="signature-box"></div>
                </div>
            </div>
            
            <div class="signature-block">
                <h3 class="signature-section-title">Responsável Técnico pela Manutenção</h3>
                
                <div class="signature-line">
                    <div class="signature-field">
                        <p class="signature-label">Nome Completo:</p>
                        <div class="signature-input"></div>
                    </div>
                </div>
                
                <div class="signature-line">
                    <div class="signature-field half">
                        <p class="signature-label">Registro Profissional:</p>
                        <div class="signature-input"></div>
                    </div>
                    <div class="signature-field half">
                        <p class="signature-label">Empresa:</p>
                        <div class="signature-input"></div>
                    </div>
                </div>
                
                <div class="signature-line">
                    <p class="signature-label">Assinatura:</p>
                    <div class="signature-box"></div>
                </div>
            </div>
            
            <div class="signature-block">
                <h3 class="signature-section-title">Responsável SSMA (Segurança, Saúde e Meio Ambiente)</h3>
                
                <div class="signature-line">
                    <div class="signature-field">
                        <p class="signature-label">Nome Completo:</p>
                        <div class="signature-input"></div>
                    </div>
                </div>
                
                <div class="signature-line">
                    <div class="signature-field half">
                        <p class="signature-label">Cargo/Função:</p>
                        <div class="signature-input"></div>
                    </div>
                    <div class="signature-field half">
                        <p class="signature-label">Data:</p>
                        <div class="signature-input"></div>
                    </div>
                </div>
                
                <div class="signature-line">
                    <p class="signature-label">Assinatura e Carimbo:</p>
                    <div class="signature-box"></div>
                </div>
            </div>
            
            <div class="signature-block">
                <h3 class="signature-section-title">Gestor/Responsável pela Unidade</h3>
                
                <div class="signature-line">
                    <div class="signature-field">
                        <p class="signature-label">Nome Completo:</p>
                        <div class="signature-input"></div>
                    </div>
                </div>
                
                <div class="signature-line">
                    <div class="signature-field half">
                        <p class="signature-label">Cargo:</p>
                        <div class="signature-input"></div>
                    </div>
                    <div class="signature-field half">
                        <p class="signature-label">Data de Aprovação:</p>
                        <div class="signature-input"></div>
                    </div>
                </div>
                
                <div class="signature-line">
                    <p class="signature-label">Assinatura e Carimbo:</p>
                    <div class="signature-box"></div>
                </div>
            </div>
            
            <div class="signature-footer">
                <p><strong>Observação:</strong> Este relatório é válido somente com todas as assinaturas 
                e aprovações devidamente preenchidas.</p>
            </div>
        </div>
        
        <div class="footer">
            <p>Relatório gerado pelo Sistema ISF IA em {current_date} às {current_time}</p>
            <p>© {current_year} - Sistema de Gestão de Segurança Contra Incêndio</p>
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
    <div class="chamber-section">
        <div class="chamber-header {status_class}">
            <span class="chamber-number">EQUIPAMENTO {chamber_number:02d}</span>
            <span class="chamber-status">{status_icon} {row['status_geral'].upper()}</span>
        </div>
        
        <div class="chamber-info">
            <table class="info-table">
                <tr>
                    <td class="label">Identificação:</td>
                    <td class="value"><strong>{row['id_camara']}</strong></td>
                    <td class="label">Tipo de Inspeção:</td>
                    <td class="value">{row['tipo_inspecao']}</td>
                </tr>
                <tr>
                    <td class="label">Localização:</td>
                    <td class="value">{row.get('localizacao', 'Não informada')}</td>
                    <td class="label">Data da Inspeção:</td>
                    <td class="value">{data_inspecao}</td>
                </tr>
                <tr>
                    <td class="label">Modelo:</td>
                    <td class="value">{row.get('modelo', 'Não informado')}</td>
                    <td class="label">Próxima Inspeção:</td>
                    <td class="value"><strong>{data_proxima}</strong></td>
                </tr>
                <tr>
                    <td class="label">Tamanho/Especificação:</td>
                    <td class="value">{row.get('tamanho_especifico', 'Não informado')}</td>
                    <td class="label">Inspetor Responsável:</td>
                    <td class="value">{row['inspetor']}</td>
                </tr>
                <tr>
                    <td class="label">Marca:</td>
                    <td class="value">{row.get('marca', 'Não informada')}</td>
                    <td class="label">Status Final:</td>
                    <td class="value"><strong>{row['status_geral']}</strong></td>
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
            <h4>Plano de Ação Corretiva</h4>
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
            <h4>Registro Fotográfico</h4>
            <div class="photo-container">
                <img src="{photo_url}" alt="Evidência fotográfica" class="evidence-photo" />
            </div>
            <p class="photo-caption">Figura {chamber_number}: Registro fotográfico realizado durante a inspeção do equipamento {row['id_camara']} em {data_inspecao}</p>
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
        <h4>Checklist de Inspeção Técnica</h4>
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
    """Retorna os estilos CSS sóbrios seguindo normas ABNT"""
    
    return """
    @page {
        size: A4;
        margin: 3cm 2cm 2cm 3cm;
        @bottom-center {
            content: counter(page);
            font-size: 10pt;
            color: #666;
        }
    }
    
    body {
        font-family: 'Arial', 'Helvetica', sans-serif;
        font-size: 12pt;
        line-height: 1.5;
        color: #000;
        background: white;
        text-align: justify;
    }
    
    /* ========== FOLHA DE ROSTO ========== */
    .cover-page {
        page-break-after: always;
        text-align: center;
        padding-top: 5cm;
    }
    
    .cover-header {
        margin-bottom: 6cm;
    }
    
    .cover-header p {
        margin: 5px 0;
        font-size: 12pt;
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .cover-title h1 {
        font-size: 18pt;
        font-weight: bold;
        text-transform: uppercase;
        margin: 0 0 15px 0;
        line-height: 1.3;
    }
    
    .cover-title h2 {
        font-size: 16pt;
        font-weight: normal;
        margin: 0 0 4cm 0;
    }
    
    .cover-info {
        text-align: left;
        margin: 0 auto;
        max-width: 70%;
    }
    
    .cover-info p {
        margin: 8px 0;
        font-size: 11pt;
    }
    
    .cover-footer {
        margin-top: 5cm;
        font-size: 12pt;
    }
    
    /* ========== RESUMO ========== */
    .abstract-page {
        page-break-after: always;
    }
    
    .abstract-text {
        text-indent: 1.5cm;
        margin-bottom: 15px;
    }
    
    .keywords {
        margin-top: 20px;
        font-size: 11pt;
    }
    
    /* ========== SUMÁRIO ========== */
    .summary-page {
        page-break-after: always;
    }
    
    .toc {
        margin-top: 20px;
    }
    
    .toc-item {
        display: flex;
        justify-content: space-between;
        margin: 8px 0;
        font-size: 11pt;
    }
    
    .toc-subitem {
        padding-left: 1.5cm;
    }
    
    .toc-number {
        margin-right: 10px;
        font-weight: bold;
    }
    
    .toc-dots {
        flex-grow: 1;
        border-bottom: 1px dotted #999;
        margin: 0 10px;
    }
    
    .toc-page {
        font-weight: bold;
    }
    
    /* ========== TÍTULOS E SEÇÕES ========== */
    .section-title {
        font-size: 14pt;
        font-weight: bold;
        text-transform: uppercase;
        margin: 25px 0 15px 0;
        page-break-after: avoid;
    }
    
    .section-number {
        margin-right: 10px;
    }
    
    .subsection-title {
        font-size: 12pt;
        font-weight: bold;
        margin: 20px 0 12px 0;
        page-break-after: avoid;
    }
    
    /* ========== TEXTO CORPO ========== */
    .body-text {
        text-indent: 1.5cm;
        margin: 12px 0;
        text-align: justify;
    }
    
    .objective-list,
    .method-list,
    .recommendation-list {
        margin: 10px 0 10px 2cm;
        list-style-type: disc;
    }
    
    .objective-list li,
    .method-list li,
    .recommendation-list li {
        margin: 6px 0;
    }
    
    /* ========== TABELAS ========== */
    .summary-table {
        width: 100%;
        border-collapse: collapse;
        margin: 20px 0;
        font-size: 11pt;
    }
    
    .summary-table th {
        background: #d0d0d0;
        color: #000;
        padding: 10px;
        text-align: left;
        font-weight: bold;
        border: 1px solid #999;
    }
    
    .summary-table td {
        padding: 8px 10px;
        border: 1px solid #ccc;
    }
    
    .summary-table tbody tr:nth-child(even) {
        background: #f5f5f5;
    }
    
    .center {
        text-align: center;
    }
    
    /* ========== QUEBRAS DE PÁGINA ========== */
    .page-break {
        page-break-after: always;
    }
    
    .introduction-page,
    .results-page,
    .conclusions-page,
    .references-page,
    .signatures-page {
        page-break-after: always;
    }
    
    /* ========== SEÇÕES DE CÂMARAS ========== */
    .chamber-section {
        margin: 25px 0;
        border: 1px solid #999;
        page-break-inside: avoid;
    }
    
    .chamber-header {
        padding: 10px 15px;
        background: #666;
        color: white;
        font-weight: bold;
        font-size: 11pt;
    }
    
    .chamber-header.approved {
        background: #666;
    }
    
    .chamber-header.rejected {
        background: #888;
    }
    
    .chamber-number {
        display: inline-block;
        margin-right: 15px;
    }
    
    .chamber-status {
        float: right;
    }
    
    /* ========== INFO CÂMARA ========== */
    .chamber-info {
        padding: 15px;
        background: white;
    }
    
    .info-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #999;
        margin: 10px 0;
    }
    
    .info-table td {
        padding: 8px 10px;
        border: 1px solid #ccc;
        font-size: 10pt;
    }
    
    .info-table .label {
        width: 25%;
        font-weight: bold;
        background: #e8e8e8;
    }
    
    .info-table .value {
        width: 25%;
    }
    
    /* ========== CHECKLIST ========== */
    .checklist {
        padding: 15px;
        background: white;
    }
    
    .checklist h4 {
        margin: 0 0 12px 0;
        font-size: 11pt;
        font-weight: bold;
        text-transform: uppercase;
        border-bottom: 2px solid #666;
        padding-bottom: 5px;
    }
    
    .checklist-table {
        width: 100%;
        border-collapse: collapse;
        border: 1px solid #999;
        font-size: 10pt;
    }
    
    .checklist-table th {
        background: #d0d0d0;
        color: #000;
        padding: 8px;
        text-align: left;
        font-weight: bold;
        border: 1px solid #999;
    }
    
    .checklist-table td {
        padding: 7px 10px;
        border: 1px solid #ccc;
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
        padding: 12px 15px;
        background: #f0f0f0;
        border: 1px solid #999;
        margin: 15px;
    }
    
    .action-plan h4 {
        margin: 0 0 8px 0;
        font-size: 11pt;
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .action-plan p {
        margin: 0;
        font-size: 10pt;
        line-height: 1.5;
    }
    
    /* ========== FOTO ========== */
    .photo-section {
        padding: 15px;
        background: white;
        border-top: 1px solid #999;
    }
    
    .photo-section h4 {
        margin: 0 0 10px 0;
        font-size: 11pt;
        font-weight: bold;
        text-transform: uppercase;
    }
    
    .photo-container {
        text-align: center;
        padding: 10px;
        border: 1px solid #999;
        background: #fafafa;
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
        color: #555;
        font-style: italic;
    }
    
    /* ========== REFERÊNCIAS ========== */
    .reference-item {
        margin: 15px 0;
        text-indent: -1.5cm;
        padding-left: 1.5cm;
        font-size: 11pt;
    }
    
    /* ========== ASSINATURAS ========== */
    .signature-block {
        margin: 30px 0;
        padding: 20px;
        border: 1px solid #999;
        background: #f9f9f9;
        page-break-inside: avoid;
    }
    
    .signature-section-title {
        font-size: 12pt;
        font-weight: bold;
        margin: 0 0 15px 0;
        text-align: center;
        text-transform: uppercase;
    }
    
    .signature-line {
        margin: 12px 0;
        display: flex;
        gap: 15px;
    }
    
    .signature-field {
        flex: 1;
    }
    
    .signature-field.half {
        flex: 0.5;
    }
    
    .signature-label {
        font-size: 10pt;
        font-weight: bold;
        margin: 0 0 5px 0;
    }
    
    .signature-input {
        border-bottom: 1px solid #000;
        height: 25px;
        width: 100%;
    }
    
    .signature-box {
        border: 1px solid #000;
        height: 80px;
        width: 100%;
        background: white;
        margin-top: 5px;
    }
    
    .signature-footer {
        margin-top: 25px;
        padding: 12px;
        background: #fff3cd;
        border: 1px solid #856404;
        font-size: 10pt;
        font-style: italic;
    }
    
    .signature-footer p {
        margin: 0;
    }
    
    /* ========== RODAPÉ ========== */
    .footer {
        margin-top: 30px;
        padding: 15px 0;
        border-top: 2px solid #666;
        text-align: center;
        font-size: 9pt;
        color: #666;
    }
    
    .footer p {
        margin: 3px 0;
    }
    """

