import streamlit as st
import pandas as pd
import sys
import os
from datetime import date
import json
from dateutil.relativedelta import relativedelta

# Adiciona o diretório raiz ao path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# Imports necessários para o novo fluxo
from operations.shelter_operations import save_shelter_inventory, save_shelter_inspection
from operations.hose_operations import save_new_hose
from gdrive.gdrive_upload import GoogleDriveUploader
from AI.api_Operation import PDFQA
from gdrive.config import SHELTER_SHEET_NAME, HOSE_SHEET_NAME, AUDIT_LOG_SHEET_NAME
from operations.history import load_sheet_data 
from utils.prompts import get_hose_inspection_prompt, get_shelter_inventory_prompt
from auth.auth_utils import (
    get_user_display_name, get_user_email, get_user_role,
    check_user_access, can_edit, has_ai_features
)
from utils.auditoria import get_sao_paulo_time_str, log_action
from config.page_config import set_page_config

set_page_config()
pdf_qa = PDFQA()

def show_page():
    st.title("💧 Gestão de Mangueiras e Abrigos de Incêndio")

    # Check if user has at least viewer permissions
    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return

    # Adicionando uma nova aba para cadastro manual de mangueiras
    tab_hoses, tab_manual_hose, tab_shelters, tab_shelters_insp = st.tabs([
        "Inspeção de Mangueiras com IA", 
        "Cadastro Manual de Mangueiras",
        "Cadastro de Abrigos de Emergência",
        "Inspeção de Abrigos"
    ])

    with tab_hoses:
        st.header("Registrar Teste Hidrostático de Mangueiras")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para registrar testes de mangueiras.")
        # Check for AI features
        elif not has_ai_features():
            st.info("✨ **Este recurso de IA** está disponível no plano **Premium IA**. Faça o upgrade para automatizar seu trabalho ou utilize a aba 'Cadastro Manual de Mangueiras'.", icon="🚀")
        else:
            st.session_state.setdefault('hose_step', 'start')
            st.session_state.setdefault('hose_processed_data', None)
            st.session_state.setdefault('hose_uploaded_pdf', None)

            st.subheader("1. Faça o Upload do Certificado de Teste")
            st.info("O sistema analisará o PDF, extrairá os dados de todas as mangueiras e preparará os registros para salvamento.")
            
            uploaded_pdf = st.file_uploader("Escolha o certificado PDF", type=["pdf"], key="hose_pdf_uploader")
            if uploaded_pdf:
                st.session_state.hose_uploaded_pdf = uploaded_pdf
            
            if st.session_state.hose_uploaded_pdf and st.button("🔎 Analisar Certificado com IA"):
                with st.spinner("Analisando o documento..."):
                    prompt = get_hose_inspection_prompt()
                    extracted_data = pdf_qa.extract_structured_data(st.session_state.hose_uploaded_pdf, prompt)
                    
                    if extracted_data and "mangueiras" in extracted_data and isinstance(extracted_data["mangueiras"], list):
                        st.session_state.hose_processed_data = extracted_data["mangueiras"]
                        st.session_state.hose_step = 'confirm'
                        st.rerun()
                    else:
                        st.error("A IA não conseguiu extrair os dados no formato esperado. Verifique o documento.")
                        st.json(extracted_data)
            
            if st.session_state.hose_step == 'confirm' and st.session_state.hose_processed_data:
                st.subheader("2. Confira os Dados Extraídos e Salve no Sistema")
                st.dataframe(pd.DataFrame(st.session_state.hose_processed_data))
                
                if st.button("💾 Confirmar e Salvar Registros", type="primary", use_container_width=True):
                    with st.spinner("Salvando registros em lote..."):
                        uploader = GoogleDriveUploader()
                        pdf_name = f"Certificado_Mangueiras_{date.today().isoformat()}_{st.session_state.hose_uploaded_pdf.name}"
                        pdf_link = uploader.upload_file(st.session_state.hose_uploaded_pdf, novo_nome=pdf_name)
                        
                        if not pdf_link:
                            st.error("Falha ao fazer o upload do certificado. Os dados não foram salvos.")
                            st.stop()

                        hose_rows = []
                        audit_log_rows = []

                        for record in st.session_state.hose_processed_data:
                            
                            # Trata a data de inspeção
                            inspection_date_val = record.get('data_inspecao')
                            inspection_date_str = pd.to_datetime(inspection_date_val).strftime('%Y-%m-%d') if pd.notna(inspection_date_val) else date.today().isoformat()
                            
                            # Trata a data do próximo teste
                            next_test_date_val = record.get('data_proximo_teste')
                            if pd.notna(next_test_date_val):
                                # Se a IA forneceu uma data, use-a
                                next_test_date_str = pd.to_datetime(next_test_date_val).strftime('%Y-%m-%d')
                            elif record.get('resultado', '').lower() in ['condenada', 'reprovado']:
                                # Se a mangueira foi condenada/reprovada, não há próximo teste
                                next_test_date_str = None
                            else:
                                # Fallback: calcula a data se não foi fornecida e a mangueira foi aprovada
                                next_test_date_str = (pd.to_datetime(inspection_date_str).date() + relativedelta(years=1)).isoformat()
                            

                            hose_row = [
                                record.get('id_mangueira'),
                                record.get('marca'),
                                record.get('diametro'),
                                record.get('tipo'),
                                record.get('comprimento'),
                                record.get('ano_fabricacao'),
                                inspection_date_str,
                                next_test_date_str,
                                record.get('resultado'),
                                pdf_link,
                                get_user_display_name(),
                                record.get('empresa_executante'),
                                record.get('inspetor_responsavel')
                            ]
                            hose_rows.append(hose_row)

                            audit_log_row = [
                                get_sao_paulo_time_str(),
                                get_user_email() or "não logado",
                                get_user_role(),
                                "SALVOU_INSPECAO_MANGUEIRA_LOTE",
                                f"ID: {record.get('id_mangueira')}, Resultado: {record.get('resultado')}",
                                st.session_state.get('current_unit_name', 'N/A')
                            ]
                            audit_log_rows.append(audit_log_row)

                        try:
                            uploader.append_data_to_sheet(HOSE_SHEET_NAME, hose_rows)
                            matrix_uploader = GoogleDriveUploader(is_matrix=True)
                            matrix_uploader.append_data_to_sheet(AUDIT_LOG_SHEET_NAME, audit_log_rows)

                            st.success(f"{len(hose_rows)} registros de mangueiras salvos com sucesso!")
                            st.balloons()
                            
                            st.session_state.hose_step = 'start'
                            st.session_state.hose_processed_data = None
                            st.session_state.hose_uploaded_pdf = None
                            st.cache_data.clear()
                            st.rerun()
                        except Exception as e:
                            st.error(f"Ocorreu um erro durante o salvamento em lote: {e}")

    # Nova aba de cadastro manual de mangueiras
    with tab_manual_hose:
        st.header("Cadastrar Nova Mangueira Manualmente")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novas mangueiras.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            st.info("Use este formulário para cadastrar uma nova mangueira sem necessidade de importar um certificado.")
            
            with st.form("new_hose_form", clear_on_submit=True):
                st.subheader("Dados da Mangueira")
                
                col1, col2 = st.columns(2)
                
                # Primeira linha
                hose_id = col1.text_input("ID da Mangueira (Obrigatório)*")
                marca = col2.text_input("Marca/Fabricante")
                
                # Segunda linha
                diametro_options = ["1", "1 1/2", "2", "2 1/2", "3"]
                diametro = col1.selectbox("Diâmetro (polegadas)", diametro_options)
                
                tipo_options = ["1", "2", "3", "4", "5"]
                tipo = col2.selectbox("Tipo", tipo_options)
                
                # Terceira linha
                comprimento_options = ["15", "20", "25", "30"]
                comprimento = col1.selectbox("Comprimento (metros)", comprimento_options)
                
                current_year = date.today().year
                ano_fabricacao = col2.number_input("Ano de Fabricação", 
                                                   min_value=current_year-30,  
                                                   max_value=current_year, 
                                                   value=current_year)
                
                st.markdown("---")
                
                # Opcional - dados da empresa que forneceu
                empresa_executante = st.text_input("Empresa Fornecedora (opcional)")
                
                # Botão de envio
                submitted = st.form_submit_button("Cadastrar Nova Mangueira", type="primary", use_container_width=True)
                
                if submitted:
                    if not hose_id:
                        st.error("O campo 'ID da Mangueira' é obrigatório.")
                    else:
                        hose_data = {
                            'id_mangueira': hose_id,
                            'marca': marca,
                            'diametro': diametro,
                            'tipo': tipo,
                            'comprimento': comprimento,
                            'ano_fabricacao': str(ano_fabricacao),
                            'empresa_executante': empresa_executante
                        }
                        
                        if save_new_hose(hose_data):
                            st.success(f"Mangueira '{hose_id}' cadastrada com sucesso!")
                            st.cache_data.clear()
                            st.balloons()

    with tab_shelters:
        st.header("Cadastrar Abrigos de Emergência com IA")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar abrigos.")
        # Check for AI features
        elif not has_ai_features():
            st.info("✨ **Este recurso de IA** está disponível no plano **Premium IA**. Faça o upgrade para automatizar seu trabalho ou cadastre manualmente na aba 'Inspeção de Abrigos'.", icon="🚀")
        else:
            # Gerenciamento de estado para a aba de abrigos
            st.session_state.setdefault('shelter_step', 'start')
            st.session_state.setdefault('shelter_processed_data', None)
            st.session_state.setdefault('shelter_uploaded_pdf', None)

            st.subheader("1. Faça o Upload do Inventário PDF")
            st.info("O sistema analisará o PDF, extrairá os dados de todos os abrigos e preparará os registros para salvamento.")
            
            uploaded_pdf_shelter = st.file_uploader(
                "Escolha o inventário PDF", 
                type=["pdf"], 
                key="shelter_pdf_uploader"
            )
            if uploaded_pdf_shelter:
                st.session_state.shelter_uploaded_pdf = uploaded_pdf_shelter
            
            if st.session_state.shelter_uploaded_pdf and st.button("🔎 Analisar Inventário com IA", key="shelter_analyze_btn"):
                with st.spinner("Analisando o documento..."):
                    prompt = get_shelter_inventory_prompt()
                    extracted_data = pdf_qa.extract_structured_data(st.session_state.shelter_uploaded_pdf, prompt)
                    
                    if extracted_data and "abrigos" in extracted_data and isinstance(extracted_data["abrigos"], list):
                        st.session_state.shelter_processed_data = extracted_data["abrigos"]
                        st.session_state.shelter_step = 'confirm'
                        st.rerun()
                    else:
                        st.error("A IA não conseguiu extrair os dados no formato esperado. Verifique o documento.")
                        st.json(extracted_data)
            
            if st.session_state.shelter_step == 'confirm' and st.session_state.shelter_processed_data:
                st.subheader("2. Confira os Dados Extraídos e Salve no Sistema")
                
                for abrigo in st.session_state.shelter_processed_data:
                    with st.expander(f"**Abrigo ID:** {abrigo.get('id_abrigo')} | **Cliente:** {abrigo.get('cliente')}"):
                        st.json(abrigo.get('itens', {}))

                if st.button("💾 Confirmar e Salvar Abrigos", type="primary", use_container_width=True):
                    with st.spinner("Salvando registros dos abrigos..."):
                        total_count = len(st.session_state.shelter_processed_data)
                        progress_bar = st.progress(0, "Salvando...")
                        
                        for i, record in enumerate(st.session_state.shelter_processed_data):
                            save_shelter_inventory(
                                shelter_id=record.get('id_abrigo'),
                                client=record.get('cliente'),
                                local=record.get('local'),
                                items_dict=record.get('itens', {})
                            )
                            progress_bar.progress((i + 1) / total_count)
                        
                        st.success(f"{total_count} abrigos salvos com sucesso!")
                        st.balloons()
                        
                        # Limpar o estado para um novo upload
                        st.session_state.shelter_step = 'start'
                        st.session_state.shelter_processed_data = None
                        st.session_state.shelter_uploaded_pdf = None
                        st.cache_data.clear()
                        st.rerun()

    with tab_shelters_insp:
        st.header("Realizar Inspeção de um Abrigo de Emergência")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para realizar inspeções de abrigos.")
        else:
            # Cadastro Manual de Abrigos
            with st.expander("➕ Cadastrar Novo Abrigo Manualmente", expanded=False):
                st.info("Use este formulário para cadastrar um novo abrigo sem necessidade de processamento por IA.")
                
                with st.form("manual_shelter_form", clear_on_submit=True):
                    st.subheader("Dados Básicos do Abrigo")
                    
                    col1, col2 = st.columns(2)
                    shelter_id = col1.text_input("ID do Abrigo (Obrigatório)*", help="Ex: ABR-01, CECI-02, etc.")
                    client = col2.text_input("Cliente/Unidade", value=st.session_state.get('current_unit_name', ''))
                    
                    local = st.text_input("Localização (Obrigatório)*", help="Descrição detalhada do local onde o abrigo está instalado")
                    
                    st.markdown("---")
                    st.subheader("Inventário de Itens")
                    st.markdown("Adicione os itens que compõem o abrigo e suas quantidades:")
                    
                    # Definir itens padrão comuns em abrigos
                    standard_items = [
                        "Mangueira de 1½\"", 
                        "Mangueira de 2½\"",
                        "Esguicho de 1½\"", 
                        "Esguicho de 2½\"", 
                        "Chave de Mangueira",
                        "Chave de Hidrante", 
                        "Chave Storz", 
                        "Derivante/Divisor", 
                        "Redutor",
                        "Adaptador"
                    ]
                    
                    # Interface para adicionar novos itens dentro do formulário
                    inventory_items = {}
                    
                    # Seção de itens pré-definidos
                    st.markdown("**Selecione os itens padrão:**")
                    for item in standard_items:
                        col1, col2 = st.columns([3, 1])
                        with col1:
                            st.text(item)
                        with col2:
                            qty = st.number_input(f"Qtd", min_value=0, value=0, step=1, key=f"qty_{item}")
                            if qty > 0:
                                inventory_items[item] = qty
                    
                    st.markdown("**Ou adicione item personalizado:**")
                    col1, col2 = st.columns([3, 1])
                    custom_item = col1.text_input("Nome do item personalizado")
                    custom_qty = col2.number_input("Quantidade", min_value=0, value=0, step=1, key="custom_qty")
                    
                    if custom_item and custom_qty > 0:
                        inventory_items[custom_item] = custom_qty
                    
                    # Botão para salvar o abrigo
                    submitted = st.form_submit_button("Cadastrar Novo Abrigo", type="primary", use_container_width=True)
                    
                    if submitted:
                        if not shelter_id or not local:
                            st.error("Os campos 'ID do Abrigo' e 'Localização' são obrigatórios.")
                        elif not inventory_items:
                            st.error("É necessário adicionar pelo menos um item ao inventário.")
                        else:
                            # Salvar o abrigo no sistema
                            if save_shelter_inventory(shelter_id, client, local, inventory_items):
                                st.success(f"Abrigo '{shelter_id}' cadastrado com sucesso!")
                                st.cache_data.clear()
                                st.balloons()
            
            # Inspeção de Abrigos
            st.markdown("---")
            st.subheader("Inspeção de Abrigo Existente")
            
            # Carregar a lista de abrigos cadastrados
            df_shelters = load_sheet_data(SHELTER_SHEET_NAME)
            
            if df_shelters.empty:
                st.warning("Nenhum abrigo cadastrado. Por favor, cadastre um abrigo utilizando o formulário acima primeiro.")
            else:
                shelter_ids = ["Selecione um abrigo..."] + df_shelters['id_abrigo'].tolist()
                selected_shelter_id = st.selectbox("Selecione o Abrigo para Inspecionar", shelter_ids)

                if selected_shelter_id != "Selecione um abrigo...":
                    # Encontrar o inventário do abrigo selecionado
                    shelter_data = df_shelters[df_shelters['id_abrigo'] == selected_shelter_id].iloc[0]
                    try:
                        items_dict = json.loads(shelter_data['itens_json'])
                    except (json.JSONDecodeError, TypeError):
                        st.error("Inventário do abrigo selecionado está em um formato inválido na planilha.")
                        st.stop()
                    
                    st.subheader(f"Checklist para o Abrigo: {selected_shelter_id}")

                    with st.form(key=f"inspection_form_{selected_shelter_id}", clear_on_submit=True):
                        inspection_results = {}
                        has_issues = False
                        
                        st.markdown("##### Itens do Inventário")
                        for item, expected_qty in items_dict.items():
                            cols = st.columns([3, 2, 2])
                            with cols[0]:
                                st.write(f"**{item}** (Previsto: {expected_qty})")
                            with cols[1]:
                                # Usando uma chave única para cada widget
                                status = st.radio("Status", ["OK", "Avariado", "Faltando"], key=f"status_{item}_{selected_shelter_id}", horizontal=True, label_visibility="collapsed")
                            with cols[2]:
                                obs = st.text_input("Obs.", key=f"obs_{item}_{selected_shelter_id}", label_visibility="collapsed")
                            
                            inspection_results[item] = {"status": status, "observacao": obs}
                            if status != "OK":
                                has_issues = True
                        
                        st.markdown("##### Condições Gerais do Abrigo")
                        geral_lacre = st.radio("Lacre de segurança intacto?", ["Sim", "Não"], key=f"lacre_{selected_shelter_id}", horizontal=True)
                        geral_sinal = st.radio("Sinalização visível e correta?", ["Sim", "Não"], key=f"sinal_{selected_shelter_id}", horizontal=True)
                        geral_acesso = st.radio("Acesso desobstruído?", ["Sim", "Não"], key=f"acesso_{selected_shelter_id}", horizontal=True)

                        if geral_lacre == "Não" or geral_sinal == "Não" or geral_acesso == "Não":
                            has_issues = True
                        
                        inspection_results["Condições Gerais"] = {
                            "Lacre": geral_lacre, "Sinalização": geral_sinal, "Acesso": geral_acesso
                        }

                        submitted = st.form_submit_button("✅ Salvar Inspeção", type="primary", use_container_width=True)

                        if submitted:
                            overall_status = "Reprovado com Pendências" if has_issues else "Aprovado"
                            with st.spinner("Salvando resultado da inspeção..."):
                                if save_shelter_inspection(selected_shelter_id, overall_status, inspection_results, get_user_display_name()):
                                    st.success(f"Inspeção do abrigo '{selected_shelter_id}' salva com sucesso como '{overall_status}'!")
                                    st.balloons() if not has_issues else None
                                    st.cache_data.clear()
                                else:
                                    st.error("Ocorreu um erro ao salvar a inspeção.")

