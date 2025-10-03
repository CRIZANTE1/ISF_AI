import streamlit as st
import sys
import os
from datetime import date, timedelta
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from operations.scba_operations import save_scba_inspection, save_scba_visual_inspection
from gdrive.gdrive_upload import GoogleDriveUploader
from AI.api_Operation import PDFQA
from utils.prompts import get_scba_inspection_prompt, get_air_quality_prompt 
from auth.auth_utils import (
    get_user_display_name, check_user_access, can_edit, has_ai_features
)
from config.page_config import set_page_config
from operations.history import load_sheet_data
from gdrive.config import SCBA_SHEET_NAME, SCBA_VISUAL_INSPECTIONS_SHEET_NAME
from utils.auditoria import log_action


set_page_config()
pdf_qa = PDFQA()

def save_manual_scba(scba_data):
    """
    Salva um novo SCBA manualmente cadastrado.
    
    Args:
        scba_data (dict): Dados do SCBA
    
    Returns:
        bool: True se bem-sucedido, False caso contrário
    """
    try:
        uploader = GoogleDriveUploader()
        
        # Verificar se o número de série já existe
        scba_records = uploader.get_data_from_sheet(SCBA_SHEET_NAME)
        if scba_records and len(scba_records) > 1:
            df = pd.DataFrame(scba_records[1:], columns=scba_records[0])
            if 'numero_serie_equipamento' in df.columns and scba_data['numero_serie_equipamento'] in df['numero_serie_equipamento'].values:
                st.error(f"Erro: SCBA com número de série '{scba_data['numero_serie_equipamento']}' já existe.")
                return False
        
        # Criar linha para a planilha
        # Importante: a ordem dos campos deve corresponder à ordem das colunas na planilha
        today = date.today()
        validade = today + timedelta(days=365)  # Validade padrão de 1 ano
        
        data_row = [
            scba_data.get('data_teste', today.isoformat()),
            validade.isoformat(),  # data_validade
            scba_data['numero_serie_equipamento'],
            scba_data['marca'],
            scba_data['modelo'],
            scba_data.get('numero_serie_mascara', 'N/A'),
            scba_data.get('numero_serie_segundo_estagio', 'N/A'),
            "APTO PARA USO",  # resultado_final padrão para registro manual
            "Aprovado",  # vazamento_mascara_resultado
            "N/A",  # vazamento_mascara_valor
            "Aprovado",  # vazamento_pressao_alta_resultado
            "N/A",  # vazamento_pressao_alta_valor
            "Aprovado",  # pressao_alarme_resultado
            "N/A",  # pressao_alarme_valor
            None,  # link_relatorio_pdf
            get_user_display_name(),  # inspetor_responsavel
            scba_data.get('empresa_executante', "Cadastro Manual"),
            scba_data.get('resp_tecnico', "N/A")
        ]
        
        uploader.append_data_to_sheet(SCBA_SHEET_NAME, [data_row])
        log_action("CADASTROU_SCBA_MANUAL", f"S/N: {scba_data['numero_serie_equipamento']}")
        return True
        
    except Exception as e:
        st.error(f"Erro ao salvar SCBA: {e}")
        return False

def save_manual_air_quality_record(air_data):
    """
    Salva um registro manual de qualidade do ar.
    """
    try:
        uploader = GoogleDriveUploader()
        
        # Para cada cilindro mencionado, cria um registro
        cilindros = [c.strip() for c in air_data['cilindros_text'].split(',') if c.strip()]
        
        if not cilindros:
            st.error("É necessário informar pelo menos um número de série de cilindro.")
            return False
            
        for cilindro_sn in cilindros:
            # Cria uma linha com os dados do laudo
            data_row = [None] * 18  # Preenche as primeiras 18 colunas com None
            data_row[2] = cilindro_sn  # Coluna C: numero_serie_equipamento
            
            # Adiciona os dados específicos do laudo de qualidade do ar
            data_row.extend([
                air_data['data_ensaio'],
                air_data['resultado_geral'],
                air_data.get('observacoes', 'Registro manual'),
                None  # link_laudo_ar (será None para registro manual)
            ])
            
            uploader.append_data_to_sheet(SCBA_SHEET_NAME, data_row)
        
        log_action("REGISTROU_QUALIDADE_AR_MANUAL", f"Cilindros: {', '.join(cilindros)}, Resultado: {air_data['resultado_geral']}")
        return True
        
    except Exception as e:
        st.error(f"Erro ao salvar registro de qualidade do ar: {e}")
        return False

def show_page():
    st.title("💨 Inspeção de Conjuntos Autônomos (SCBA)")

    # Check if user has at least viewer permissions
    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return
        
    tab_instrucoes, tab_visual_insp, tab_test_scba, tab_manual_test, tab_quality_air, tab_manual_air, tab_manual_scba = st.tabs([
        "📖 Como Usar",
        "🔍 Inspeção Visual Periódica",
        "🤖 Teste de Equipamentos (IA)",
        "✍️ Cadastro Manual de Teste",
        "💨 Laudo de Qualidade do Ar (IA)",
        "📝 Registro Manual de Qualidade do Ar",
        "➕ Cadastrar Novo SCBA"
    ])


    with tab_instrucoes:
        st.header("📖 Guia de Uso - Sistema de Conjuntos Autônomos (SCBA)")
        
        # Alerta de priorização
        st.success(
            "⚡ **Recomendação:** Para inspeções regulares, use a **Inspeção Visual Periódica**! "
            "É completa, guiada e não requer upload de arquivos."
        )
        
        st.markdown("---")
        
        # Comparação de métodos
        st.subheader("🎯 Escolha o Melhor Método para Sua Situação")
        
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.markdown("""
            ### 🔍 Inspeção Visual
            **⚡ PARA USO REGULAR - RECOMENDADA**
            
            **Tempo:** ~5-10 minutos por SCBA
            
            **Ideal para:**
            - ✅ Inspeções mensais obrigatórias
            - ✅ Verificações antes do uso
            - ✅ Inspeções após treinamento
            - ✅ Checklist completo e guiado
            
            **Como funciona:**
            1. Selecione o SCBA da lista
            2. Realize os 3 testes funcionais
            3. Faça a inspeção visual de cada componente
            4. Sistema gera status automático
            5. Salve - Pronto! ✅
            
            **O que inclui:**
            - 🧪 Teste de Estanqueidade
            - 🔔 Teste do Alarme Sonoro
            - 😷 Teste de Vedação da Máscara
            - 👁️ Inspeção Visual Completa
            - 📋 Checklist de 13+ itens
            
            **Vantagens:**
            - ⚡ Rápida e eficiente
            - 📋 Guiada passo a passo
            - 🤖 Avaliação automática
            - 📊 Rastreabilidade completa
            """)
        
        with col2:
            st.markdown("""
            ### 🤖 Testes Posi3 (IA)
            **🔬 INTELIGÊNCIA ARTIFICIAL**
            
            **Tempo:** ~2-3 minutos (múltiplos SCBAs)
            
            **Ideal para:**
            - 📅 Testes anuais obrigatórios
            - 🏢 Serviços de empresas certificadas
            - 📄 Processar relatórios Posi3 USB
            - 📋 Registro de laudos técnicos
            
            **Como funciona:**
            1. Receba relatório Posi3 da empresa
            2. Faça upload do PDF
            3. IA extrai todos os dados automaticamente
            4. Revise os testes extraídos
            5. Confirme e salve com PDF anexado
            
            **Vantagens:**
            - 🤖 IA processa tudo sozinha
            - 📄 PDF fica anexado ao registro
            - 📊 Múltiplos equipamentos de uma vez
            - ⏱️ Economiza tempo de digitação
            - 🔬 Dados técnicos precisos
            
            **Requer:** Plano Premium IA
            """)
        
        with col3:
            st.markdown("""
            ### 💨 Qualidade do Ar
            **🧪 ANÁLISE DE COMPRESSOR**
            
            **Tempo:** ~2-3 minutos
            
            **Ideal para:**
            - 📅 Análise trimestral obrigatória
            - 🏭 Laudo do compressor
            - 🔬 Análise laboratorial
            - 📋 Conformidade NBR 12543
            
            **Como funciona:**
            - **Com IA:** Upload do laudo PDF
            - **Manual:** Digite resultado e cilindros
            
            Sistema registra para todos os cilindros analisados automaticamente.
            
            **Vantagens:**
            - 🤖 IA extrai dados do laudo (Premium IA)
            - 📄 PDF anexado ao registro
            - 🔢 Registra múltiplos cilindros de uma vez
            - 📊 Rastreabilidade do ar comprimido
            """)
        
        st.markdown("---")
        
        # Fluxo de trabalho recomendado
        st.subheader("🎯 Fluxo de Trabalho Recomendado")
        
        st.info("""
        **Para Máxima Eficiência, Siga Esta Ordem:**
        
        1️⃣ **Inspeções Mensais/Pré-uso** → Use **"Inspeção Visual Periódica"** (mais completa!)
        
        2️⃣ **Recebeu Relatório Posi3 Anual** → Use **"Teste de Equipamentos (IA)"** (IA processa)
        
        3️⃣ **Recebeu Laudo de Qualidade do Ar** → Use **"Laudo de Qualidade do Ar (IA)"**
        
        4️⃣ **Cadastrar SCBA Novo** → Use **"Cadastrar Novo SCBA"**
        """)
        
        st.markdown("---")
        
        # Perguntas frequentes
        st.subheader("❓ Perguntas Frequentes")
        
        with st.expander("🔍 Qual a diferença entre Inspeção Visual e Teste Posi3?"):
            st.markdown("""
            **Inspeção Visual Periódica:**
            - 📅 Feita **mensalmente** ou antes de cada uso
            - 👤 **Você mesmo faz** no local
            - ⏱️ Tempo: 5-10 minutos
            - 🔧 **Testes básicos** (estanqueidade, alarme, vedação)
            - 👁️ Verificação visual de componentes
            - 💰 Custo: Zero
            - 🎯 Objetivo: Verificar se está **seguro para uso**
            
            **Teste Posi3 Anual:**
            - 📅 Feito **anualmente** (obrigatório)
            - 🏢 **Empresa especializada** faz em laboratório
            - ⏱️ Equipamento fica fora alguns dias
            - 🔬 **Testes de precisão** com equipamento Posi3 USB
            - 📋 Gera laudo técnico com validade
            - 💰 Custo: R$ 150-300 por equipamento
            - 🎯 Objetivo: **Certificação oficial** de conformidade
            
            **Analogia:**
            - Inspeção Visual = Você verificar o carro antes de viajar
            - Teste Posi3 = Revisão anual na concessionária com certificado
            
            **Ambos são obrigatórios e complementares!**
            """)
        
        with st.expander("⏰ Com que frequência devo fazer cada inspeção?"):
            st.markdown("""
            **Calendário Obrigatório:**
            
            📅 **Mensal:**
            - Inspeção Visual Periódica completa
            - Todos os 3 testes funcionais
            - Checklist visual de todos os componentes
            
            📅 **Antes de Cada Uso (Situações Críticas):**
            - Inspeção Visual simplificada
            - Teste de vedação da máscara
            - Verificação rápida de pressão
            
            📅 **Anual:**
            - Teste Posi3 por empresa certificada
            - Laudos técnicos com validade de 1 ano
            
            📅 **Extraordinária:**
            - Após quedas ou impactos
            - Após exposição a produtos químicos
            - Após longos períodos sem uso
            - Quando houver qualquer suspeita de problema
            
            **💡 Dica:** Configure lembretes mensais no sistema!
            """)
        
        with st.expander("😷 Como faço a limpeza e manutenção básica do SCBA?"):
            st.markdown("""
            ### **Limpeza Após Cada Uso**
            - 🧼 Lave a **máscara facial** com água morna e sabão neutro
            - 💦 Enxágue abundantemente em **água corrente**
            - 🌬️ Seque naturalmente em local arejado e à sombra
            - 🚫 Não utilize solventes, álcool, cloro ou produtos abrasivos
            - ✅ Se necessário, aplique desinfetante aprovado pelo fabricante
    
            ### **Cuidados Semanais**
            - 🔎 Verifique a integridade de mangueiras e conexões
            - 📊 Confirme a pressão do cilindro
            - 👓 Inspecione visor/lente contra riscos, rachaduras ou manchas
            - ⚙️ Teste a válvula de demanda (inalação/exalação suave)
    
            ### **Manutenção Mensal**
            - 🧰 Realize inspeção funcional completa:
                - Teste de estanqueidade
                - Teste de alarme sonoro
                - Teste de vedação da máscara
            - 📝 Registre os resultados no sistema para rastreabilidade
            - 🔄 Troque filtros ou componentes conforme manual do fabricante
    
            ### **Armazenamento Correto**
            - 📦 Guarde o SCBA em armário fechado, limpo e seco
            - 🌡️ Evite calor excessivo, umidade e exposição direta ao sol
            - 🪛 Mantenha pressão residual no cilindro (~30 bar)
            - 🧯 Nunca armazene próximo a óleo, graxa ou contaminantes
            - 🚫 Não deixe o equipamento jogado no chão ou sujeito a impactos
    
            ### **Boas Práticas**
            - 👥 Apenas pessoal treinado deve higienizar e inspecionar
            - 📋 Registre cada inspeção e limpeza em planilha ou sistema
            - ⏰ Nunca ultrapasse os prazos de inspeção periódica
            - 💡 Crie rotina: limpeza e checklist sempre após cada uso
            """)



    
    with tab_test_scba:
        st.header("Registrar Teste de SCBA com IA")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para registrar testes.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            # Check for AI features
            if not has_ai_features():
                st.info("✨ **Este recurso de IA** está disponível no plano **Premium IA**. Faça o upgrade para automatizar seu trabalho ou use as abas de cadastro manual!", icon="🚀")
            else:
                st.session_state.setdefault('scba_step', 'start')
                st.session_state.setdefault('scba_processed_data', None)
                st.session_state.setdefault('scba_uploaded_pdf', None)
                
                st.subheader("1. Faça o Upload do Relatório de Teste Posi3")
                st.info("O sistema analisará o PDF, extrairá os dados de todos os equipamentos listados e preparará os registros para salvamento.")
                
                uploaded_pdf = st.file_uploader("Escolha o relatório PDF", type=["pdf"], key="scba_pdf_uploader")
                if uploaded_pdf:
                    st.session_state.scba_uploaded_pdf = uploaded_pdf
                
                if st.session_state.scba_uploaded_pdf and st.button("🔎 Analisar Relatório com IA"):
                    with st.spinner("Analisando o documento com IA..."):
                        prompt = get_scba_inspection_prompt()
                        extracted_data = pdf_qa.extract_structured_data(st.session_state.scba_uploaded_pdf, prompt)
                        
                        if extracted_data and "scbas" in extracted_data and isinstance(extracted_data["scbas"], list):
                            st.session_state.scba_processed_data = extracted_data["scbas"]
                            st.session_state.scba_step = 'confirm'
                            st.rerun()
                        else:
                            st.error("A IA não conseguiu extrair os dados no formato esperado. Verifique o documento.")
                            st.json(extracted_data)
                
                if st.session_state.scba_step == 'confirm' and st.session_state.scba_processed_data:
                    st.subheader("2. Confira os Dados Extraídos e Salve no Sistema")
                    st.dataframe(pd.DataFrame(st.session_state.scba_processed_data))
                    
                    if st.button("💾 Confirmar e Salvar Registros", type="primary", use_container_width=True):
                        with st.spinner("Salvando registros..."):
                            uploader = GoogleDriveUploader()
                            pdf_name = f"Relatorio_SCBA_{date.today().isoformat()}_{st.session_state.scba_uploaded_pdf.name}"
                            pdf_link = uploader.upload_file(st.session_state.scba_uploaded_pdf, novo_nome=pdf_name)
                            
                            if not pdf_link:
                                st.error("Falha ao fazer o upload do relatório. Os dados não foram salvos.")
                                st.stop()
                            
                            total_count = len(st.session_state.scba_processed_data)
                            progress_bar = st.progress(0, "Salvando...")
                            
                            for i, record in enumerate(st.session_state.scba_processed_data):
                                save_scba_inspection(record=record, pdf_link=pdf_link, user_name=get_user_display_name())
                                progress_bar.progress((i + 1) / total_count)
                            
                            st.success(f"{total_count} registros de SCBA salvos com sucesso!")
                            
                            st.session_state.scba_step = 'start'
                            st.session_state.scba_processed_data = None
                            st.session_state.scba_uploaded_pdf = None
                            st.cache_data.clear()
                            st.rerun()

    # Nova aba para cadastro manual de teste SCBA
    with tab_manual_test:
        st.header("Cadastrar Teste de SCBA Manualmente")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para registrar testes.")
        else:
            st.info("Use este formulário para registrar manualmente um teste de equipamento SCBA (Posi3) sem necessidade de processar um relatório PDF.")
            
            with st.form("manual_scba_test_form", clear_on_submit=True):
                st.subheader("Dados do Teste")
                
                col1, col2 = st.columns(2)
                data_teste = col1.date_input("Data do Teste", value=date.today())
                data_validade = col2.date_input("Data de Validade do Laudo", value=date.today() + timedelta(days=365))
                
                st.subheader("Identificação do Equipamento")
                col3, col4 = st.columns(2)
                numero_serie = col3.text_input("Número de Série do Equipamento (Obrigatório)*")
                marca = col4.text_input("Marca")
                
                col5, col6 = st.columns(2)
                modelo = col5.text_input("Modelo")
                numero_serie_mascara = col6.text_input("Número de Série da Máscara")
                numero_serie_segundo_estagio = st.text_input("Número de Série do Segundo Estágio")
                
                st.subheader("Resultados dos Testes")
                resultado_final = st.selectbox("Resultado Final", ["APTO PARA USO", "NÃO APTO PARA USO"])
                
                # Teste de vazamento de máscara
                col7, col8 = st.columns(2)
                vazamento_mascara_resultado = col7.selectbox("Vazamento de Máscara", ["Aprovado", "Reprovado"])
                vazamento_mascara_valor = col8.text_input("Valor (mbar)", value="0,2 mbar")
                
                # Teste de vazamento de pressão alta
                col9, col10 = st.columns(2)
                vazamento_pressao_alta_resultado = col9.selectbox("Vazamento Pressão Alta", ["Aprovado", "Reprovado"])
                vazamento_pressao_alta_valor = col10.text_input("Valor (bar)", value="0,7 bar")
                
                # Teste de pressão de alarme
                col11, col12 = st.columns(2)
                pressao_alarme_resultado = col11.selectbox("Pressão de Alarme", ["Aprovado", "Reprovado"])
                pressao_alarme_valor = col12.text_input("Valor de Disparo (bar)", value="57,0 bar")
                
                st.subheader("Informações da Empresa")
                empresa_executante = st.text_input("Empresa Executante")
                responsavel_tecnico = st.text_input("Responsável Técnico")
                
                submitted = st.form_submit_button("Registrar Teste", type="primary", use_container_width=True)
                
                if submitted:
                    if not numero_serie:
                        st.error("O número de série do equipamento é obrigatório.")
                    else:
                        record = {
                            'data_teste': data_teste.isoformat(),
                            'data_validade': data_validade.isoformat(),
                            'numero_serie_equipamento': numero_serie,
                            'marca': marca,
                            'modelo': modelo,
                            'numero_serie_mascara': numero_serie_mascara,
                            'numero_serie_segundo_estagio': numero_serie_segundo_estagio,
                            'resultado_final': resultado_final,
                            'vazamento_mascara_resultado': vazamento_mascara_resultado,
                            'vazamento_mascara_valor': vazamento_mascara_valor,
                            'vazamento_pressao_alta_resultado': vazamento_pressao_alta_resultado,
                            'vazamento_pressao_alta_valor': vazamento_pressao_alta_valor,
                            'pressao_alarme_resultado': pressao_alarme_resultado,
                            'pressao_alarme_valor': pressao_alarme_valor,
                            'empresa_executante': empresa_executante,
                            'responsavel_tecnico': responsavel_tecnico
                        }
                        
                        if save_scba_inspection(record=record, pdf_link=None, user_name=get_user_display_name()):
                            st.success(f"Teste para o SCBA '{numero_serie}' registrado com sucesso!")
                            st.balloons()
                            st.cache_data.clear()

    with tab_quality_air:
        st.header("Registrar Laudo de Qualidade do Ar com IA")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para registrar laudos.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            # Check for AI features
            if not has_ai_features():
                st.info("✨ **Este recurso de IA** está disponível no plano **Premium IA**. Faça o upgrade para automatizar seu trabalho ou use a aba de registro manual!", icon="🚀")
            else:
                st.session_state.setdefault('airq_step', 'start')
                st.session_state.setdefault('airq_processed_data', None)
                st.session_state.setdefault('airq_uploaded_pdf', None)
                uploader = GoogleDriveUploader()

                st.subheader("1. Faça o Upload do Laudo PDF")
                st.info("A IA analisará o laudo, extrairá os dados e criará um registro para cada cilindro mencionado.")
                
                uploaded_pdf_airq = st.file_uploader("Escolha o laudo de qualidade do ar", type=["pdf"], key="airq_pdf_uploader")
                if uploaded_pdf_airq:
                    st.session_state.airq_uploaded_pdf = uploaded_pdf_airq
                
                if st.session_state.airq_uploaded_pdf and st.button("🔎 Analisar Laudo de Ar com IA"):
                    with st.spinner("Analisando o laudo com IA..."):
                        prompt = get_air_quality_prompt()
                        extracted_data = pdf_qa.extract_structured_data(st.session_state.airq_uploaded_pdf, prompt)
                        if extracted_data and "laudo" in extracted_data:
                            st.session_state.airq_processed_data = extracted_data["laudo"]
                            st.session_state.airq_step = 'confirm'
                            st.rerun()
                        else:
                            st.error("A IA não conseguiu extrair os dados do laudo.")
                
                if st.session_state.airq_step == 'confirm' and st.session_state.airq_processed_data:
                    data = st.session_state.airq_processed_data
                    st.subheader("2. Confira os Dados e Salve")
                    st.metric("Resultado do Laudo", data.get('resultado_geral', 'N/A'))
                    cilindros = data.get('cilindros', [])
                    st.info(f"O laudo será aplicado aos seguintes cilindros: {', '.join(cilindros)}")
                    
                    if st.button("💾 Confirmar e Registrar Laudo", type="primary", use_container_width=True):
                        with st.spinner("Processando e salvando..."):
                            pdf_name = f"Laudo_Ar_{data.get('data_ensaio')}_{st.session_state.airq_uploaded_pdf.name}"
                            pdf_link = uploader.upload_file(st.session_state.airq_uploaded_pdf, novo_nome=pdf_name)
                            
                            if pdf_link:
                                cilindros = data.get('cilindros', [])
                                if not cilindros:
                                    st.error("Não é possível salvar, pois nenhum cilindro foi identificado no laudo.")
                                else:
                                    for cilindro_sn in cilindros:
                                        data_row = [None] * 18
                                        data_row[2] = cilindro_sn # Coluna C: numero_serie_equipamento
                                        
                                        data_row.extend([
                                            data.get('data_ensaio'),
                                            data.get('resultado_geral'),
                                            data.get('observacoes'),
                                            pdf_link 
                                        ])
                                        uploader.append_data_to_sheet(SCBA_SHEET_NAME, data_row)
                                    
                                    st.success(f"Laudo de qualidade do ar registrado com sucesso para {len(cilindros)} cilindros!")
                                    
                                    st.session_state.airq_step = 'start'
                                    st.session_state.airq_processed_data = None
                                    st.session_state.airq_uploaded_pdf = None
                                    st.cache_data.clear()
                                    st.rerun()
                            else:
                                st.error("Falha no upload do PDF para o Google Drive. Nenhum dado foi salvo.")

    # Nova aba para registro manual de qualidade do ar
    with tab_manual_air:
        st.header("Registrar Qualidade do Ar Manualmente")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para registrar laudos de qualidade do ar.")
        else:
            st.info("Use este formulário para registrar manualmente um laudo de qualidade do ar sem necessidade de processar um PDF.")
            
            with st.form("manual_air_quality_form", clear_on_submit=True):
                st.subheader("Dados do Laudo")
                
                col1, col2 = st.columns(2)
                data_ensaio = col1.date_input("Data do Ensaio", value=date.today())
                resultado_geral = col2.selectbox("Resultado Geral", ["Aprovado", "Reprovado"])
                
                observacoes = st.text_area("Observações/Metodologia", 
                                         placeholder="Descreva a metodologia utilizada ou outras observações relevantes")
                
                st.subheader("Cilindros Analisados")
                cilindros_text = st.text_area("Números de Série dos Cilindros", 
                                            placeholder="Digite os números de série separados por vírgula\nEx: 1807087005, 1807087148, 1807087200",
                                            help="Informe todos os números de série dos cilindros que foram analisados no laudo, separados por vírgula")
                
                submitted = st.form_submit_button("Registrar Laudo de Qualidade do Ar", type="primary", use_container_width=True)
                
                if submitted:
                    if not cilindros_text.strip():
                        st.error("É obrigatório informar pelo menos um número de série de cilindro.")
                    else:
                        air_data = {
                            'data_ensaio': data_ensaio.isoformat(),
                            'resultado_geral': resultado_geral,
                            'observacoes': observacoes or "Registro manual",
                            'cilindros_text': cilindros_text
                        }
                        
                        if save_manual_air_quality_record(air_data):
                            cilindros_count = len([c.strip() for c in cilindros_text.split(',') if c.strip()])
                            st.success(f"Laudo de qualidade do ar registrado com sucesso para {cilindros_count} cilindro(s)!")
                            st.balloons()
                            st.cache_data.clear()

    with tab_visual_insp:
        st.header("Realizar Inspeção Periódica de SCBA")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para realizar inspeções.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            st.info("Esta inspeção inclui a verificação visual dos componentes e os testes funcionais de vedação e alarme.")
            
            df_scba = load_sheet_data(SCBA_SHEET_NAME)
            if not df_scba.empty:
                equipment_list = df_scba.dropna(subset=['numero_serie_equipamento'])['numero_serie_equipamento'].unique().tolist()
            else:
                equipment_list = []

            if not equipment_list:
                st.warning("Nenhum equipamento SCBA cadastrado. Registre um teste nas abas anteriores para começar.")
            else:
                options = ["Selecione um equipamento..."] + sorted(equipment_list)
                selected_scba_id = st.selectbox("Selecione o Equipamento para Inspecionar", options, key="scba_visual_select")

                if selected_scba_id != "Selecione um equipamento...":
                    # Define os itens do checklist
                    cilindro_items = ["Integridade Cilindro", "Registro e Valvulas", "Manômetro do Cilindro", "Pressão Manômetro", "Mangueiras e Conexões", "Correias/ Tirantes e Alças"]
                    mascara_items = ["Integridade da Máscara", "Visor ou Lente", "Borrachas de Vedação", "Conector da válvula de Inalação", "Correias/ Tirantes", "Fivelas e Alças", "Válvula de Exalação"]

                    with st.form(key=f"visual_insp_{selected_scba_id}", clear_on_submit=True):
                        results = {"Cilindro": {}, "Mascara": {}, "Testes Funcionais": {}}
                        has_issues = False

                        st.subheader("Testes Funcionais")

                        with st.expander("Ver instruções para o Teste de Estanqueidade"):
                            st.markdown("""
                            1.  **Trave** a válvula de demanda (bypass).
                            2.  **Abra e feche** completamente a válvula do cilindro.
                            3.  **Monitore** os manômetros por **1 minuto**.
                            4.  **Critério:** A queda de pressão deve ser **menor que 10 bar**.
                            """)
                        teste_estanqueidade = st.radio("1. Teste de Estanqueidade (Vedação Alta Pressão)", ["Aprovado", "Reprovado"], horizontal=True, key="teste_estanqueidade")
                        results["Testes Funcionais"]["Estanqueidade Alta Pressão"] = teste_estanqueidade
                        if teste_estanqueidade == "Reprovado": has_issues = True
                        
                        with st.expander("Ver instruções para o Teste do Alarme Sonoro"):
                            st.markdown("""
                            1.  Com o sistema ainda pressurizado, **libere o ar lentamente** pelo botão de purga.
                            2.  **Observe** o manômetro.
                            3.  **Critério:** O alarme sonoro deve disparar entre **50-55 bar**.
                            """)
                        teste_alarme = st.radio("2. Teste do Alarme Sonoro de Baixa Pressão", ["Aprovado", "Reprovado"], horizontal=True, key="teste_alarme")
                        results["Testes Funcionais"]["Alarme de Baixa Pressão"] = teste_alarme
                        if teste_alarme == "Reprovado": has_issues = True

                        with st.expander("Ver instruções para o Teste de Vedação da Máscara"):
                            st.markdown("""
                            1.  **Vista** a máscara e **ajuste** os tirantes.
                            2.  **Cubra** a entrada da válvula de demanda com a mão.
                            3.  **Inspire suavemente**.
                            4.  **Critério:** A máscara deve ser **sugada contra o rosto** e permanecer assim, sem vazamentos.
                            """)
                        teste_vedacao_mascara = st.radio("3. Teste de Vedação da Peça Facial (Pressão Negativa)", ["Aprovado", "Reprovado"], horizontal=True, key="teste_vedacao_mascara")
                        results["Testes Funcionais"]["Vedação da Máscara"] = teste_vedacao_mascara
                        if teste_vedacao_mascara == "Reprovado": has_issues = True

                        st.markdown("---")

                        st.subheader("Inspeção Visual dos Componentes")

                        st.markdown("**Item 1.0 - Cilindro de Ar**")
                        for item in cilindro_items:
                            cols = st.columns([3, 2])
                            with cols[0]: st.write(item)
                            with cols[1]:
                                status = st.radio("Status", ["C", "N/C", "N/A"], key=f"cil_{item}", horizontal=True, label_visibility="collapsed")
                                results["Cilindro"][item] = status
                                if status == "N/C": has_issues = True
                        results["Cilindro"]["Observações"] = st.text_area("Observações - Cilindro de Ar", key="obs_cilindro")

                        st.markdown("**Item 2.0 - Máscara Facial**")
                        for item in mascara_items:
                            cols = st.columns([3, 2])
                            with cols[0]: st.write(item)
                            with cols[1]:
                                status = st.radio("Status", ["C", "N/C", "N/A"], key=f"masc_{item}", horizontal=True, label_visibility="collapsed")
                                results["Mascara"][item] = status
                                if status == "N/C": has_issues = True
                        results["Mascara"]["Observações"] = st.text_area("Observações - Máscara Facial", key="obs_mascara")
                        
                        submitted = st.form_submit_button("✅ Salvar Inspeção Completa", type="primary", use_container_width=True)

                        if submitted:
                            overall_status = "Reprovado com Pendências" if has_issues else "Aprovado"
                            with st.spinner("Salvando inspeção..."):
                                if save_scba_visual_inspection(selected_scba_id, overall_status, results, get_user_display_name()):
                                    st.success(f"Inspeção periódica para o SCBA '{selected_scba_id}' salva com sucesso!")
                                    st.cache_data.clear()
                                else:
                                    st.error("Ocorreu um erro ao salvar a inspeção.")

    # Aba para cadastro manual de SCBA
    with tab_manual_scba:
        st.header("Cadastrar Novo SCBA Manualmente")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novos equipamentos.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            st.info("Use este formulário para cadastrar um novo conjunto autônomo (SCBA) sem necessidade de processar um relatório de teste Posi3.")
            
            with st.form("manual_scba_form", clear_on_submit=True):
                st.subheader("Dados do Equipamento SCBA")
                
                col1, col2 = st.columns(2)
                
                # Dados essenciais
                numero_serie = col1.text_input("Número de Série do Equipamento (Obrigatório)*")
                marca = col2.text_input("Marca")
                
                col3, col4 = st.columns(2)
                modelo = col3.text_input("Modelo")
                data_teste = col4.date_input("Data do Teste/Cadastro", value=date.today())
                
                # Dados opcionais
                st.markdown("---")
                st.subheader("Dados Complementares (Opcional)")
                
                col5, col6 = st.columns(2)
                numero_serie_mascara = col5.text_input("Número de Série da Máscara")
                numero_serie_segundo_estagio = col6.text_input("Número de Série do Segundo Estágio")
                
                empresa_executante = st.text_input("Empresa Fornecedora/Executante")
                
                submitted = st.form_submit_button("Cadastrar Novo SCBA", type="primary", use_container_width=True)
                
                if submitted:
                    if not numero_serie:
                        st.error("O número de série do equipamento é obrigatório.")
                    else:
                        scba_data = {
                            'numero_serie_equipamento': numero_serie,
                            'marca': marca,
                            'modelo': modelo,
                            'data_teste': data_teste.isoformat(),
                            'numero_serie_mascara': numero_serie_mascara,
                            'numero_serie_segundo_estagio': numero_serie_segundo_estagio,
                            'empresa_executante': empresa_executante
                        }
                        
                        if save_manual_scba(scba_data):
                            st.success(f"SCBA com número de série '{numero_serie}' cadastrado com sucesso!")
                            st.cache_data.clear()
