import streamlit as st
import sys
import os
import pandas as pd
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from operations.foam_chamber_operations import (
    save_new_foam_chamber,
    save_foam_chamber_inspection,
    CHECKLIST_QUESTIONS
)
from auth.auth_utils import (
    get_user_display_name, check_user_access, can_edit, has_ai_features
)
from config.page_config import set_page_config
from operations.history import load_sheet_data  
from reports.foam_chamber_report import generate_foam_chamber_consolidated_report  
from operations.instrucoes import instru_foam_chamber


set_page_config()

def show_page():
    st.title("☁️ Gestão de Câmaras de Espuma")

    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return

    tab_instructions, tab_inspection, tab_register, tab_manual_register, tab_report = st.tabs([
    "📖 Como Usar",
    "📋 Realizar Inspeção", 
    "➕ Cadastrar Nova Câmara (Completo)", 
    "✍️ Cadastro Rápido de Câmara",
    "📊 Relatório Consolidado"  
    ])
    
    with tab_instructions:
        instru_foam_chamber()

    with tab_inspection:
        st.header("Realizar Inspeção Periódica")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para realizar inspeções.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            df_inventory = load_sheet_data("inventario_camaras_espuma")
            
            if df_inventory.empty:
                st.warning("Nenhuma câmara de espuma cadastrada. Vá para as abas de cadastro para começar.")
            else:
                equipment_options = ["Selecione uma câmara..."] + sorted(df_inventory['id_camara'].tolist())
                selected_chamber_id = st.selectbox("Selecione a Câmara para Inspecionar", equipment_options)

                if selected_chamber_id != "Selecione uma câmara...":
                    chamber_data = df_inventory[df_inventory['id_camara'] == selected_chamber_id].iloc[0]
                    location = chamber_data.get('localizacao', 'N/A')
                    model = chamber_data.get('modelo', 'N/A')
                    specific_size = chamber_data.get('tamanho_especifico', 'Não informado')
                    
                    st.info(f"**Localização:** {location} | **Modelo:** {model} | **Tamanho:** {specific_size}")
                    
                    if not specific_size or specific_size == 'Não informado' or specific_size.strip() == '':
                        st.warning("⚠️ **ATENÇÃO:** O tamanho específico desta câmara não foi cadastrado. Não será possível verificar a compatibilidade da placa de orifício durante a inspeção.")
                    
                    checklist_for_model = CHECKLIST_QUESTIONS.get(model)
                    if not checklist_for_model:
                        st.error(f"Modelo '{model}' não reconhecido. Não é possível gerar o checklist de inspeção.")
                        st.stop()
                    
                    inspection_type = st.radio(
                        "Selecione o Tipo de Inspeção:",
                        ("Visual Semestral", "Funcional Anual"),
                        horizontal=True,
                        help="A inspeção funcional anual inclui todos os itens da inspeção visual."
                    )
                    
                    st.markdown("---")

                    with st.form(key=f"inspection_form_{selected_chamber_id}"):
                        inspection_results = {}
                        has_issues = False
                        
                        sections_to_show = list(checklist_for_model.keys())
                        if inspection_type == "Visual Semestral":
                            sections_to_show.pop()
                        
                        for category in sections_to_show:
                            st.subheader(category)
                            questions = checklist_for_model.get(category, [])
                            for question in questions:
                                key = f"{selected_chamber_id}_{question}".replace(" ", "_").replace("/", "")
                                answer = st.radio(
                                    label=question, options=["Conforme", "Não Conforme", "N/A"],
                                    key=key, horizontal=True
                                )
                                inspection_results[question] = answer
                                if answer == "Não Conforme":
                                    has_issues = True
                        
                        st.markdown("---")

                        show_photo_uploader = has_issues or (inspection_type == "Funcional Anual")
                        photo_file = None

                        if show_photo_uploader:
                            if inspection_type == "Funcional Anual":
                                if has_issues:
                                    st.error("FOTO OBRIGATÓRIA: Anexe uma foto da não conformidade encontrada durante o teste funcional.")
                                else:
                                    st.info("FOTO OBRIGATÓRIA: Para Testes Funcionais Anuais, anexe uma foto do equipamento durante o teste (ex: geração de espuma, verificação de fluxo).")
                            else:
                                st.warning("FOTO OBRIGATÓRIA: Uma ou mais não conformidades foram encontradas. Anexe uma foto como evidência.")
                            
                            photo_file = st.file_uploader(
                                "Anexar evidência fotográfica",
                                type=["jpg", "jpeg", "png"],
                                key=f"photo_{selected_chamber_id}"
                            )

                        submitted = st.form_submit_button("✅ Salvar Inspeção", type="primary", use_container_width=True)

                        if submitted:
                            error_message = ""
                            if has_issues and not photo_file:
                                error_message = "É obrigatório anexar uma foto quando há não conformidades."
                            elif inspection_type == "Funcional Anual" and not photo_file:
                                error_message = "É obrigatório anexar uma foto como evidência para o Teste Funcional Anual."

                            if error_message:
                                st.error(error_message)
                            else:
                                overall_status = "Reprovado com Pendências" if has_issues else "Aprovado"
                                with st.spinner("Salvando inspeção..."):
                                    if save_foam_chamber_inspection(
                                        chamber_id=selected_chamber_id,
                                        inspection_type=inspection_type,
                                        overall_status=overall_status,
                                        results_dict=inspection_results,
                                        photo_file=photo_file,
                                        inspector_name=get_user_display_name()
                                    ):
                                        st.success(f"Inspeção '{inspection_type}' para a câmara '{selected_chamber_id}' salva com sucesso!")
                                        st.balloons() if not has_issues else None
                                        st.cache_data.clear()
                                        st.rerun()
                                    else:
                                        st.error("Ocorreu um erro ao salvar a inspeção.")
    
    with tab_register:
        st.header("Cadastrar Nova Câmara de Espuma (Completo)")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novas câmaras.")
        else:
            with st.form("new_foam_chamber_form", clear_on_submit=True):
                st.info("Preencha os dados completos do novo equipamento a ser adicionado ao sistema.")
                
                col1, col2 = st.columns(2)
                new_id = col1.text_input("**ID da Câmara (Obrigatório)**", help="Use um código único, ex: CE-TQ-01")
                new_location = col2.text_input("**Localização (Obrigatório)**", help="Descrição da localização física, ex: Topo do Tanque TQ-101")
                
                col3, col4 = st.columns(2)
                model_options = list(CHECKLIST_QUESTIONS.keys())
                new_model = col3.selectbox("**Modelo da Câmara (Obrigatório)**", options=model_options)
                new_brand = col4.text_input("Marca")
                
                col5, col6 = st.columns(2)
                new_specific_size = col5.text_input(
                    "**Tamanho Específico (Obrigatório)**", 
                    placeholder="Ex: MCS-17, MCS-33, TF-22, MLS-45",
                    help="Informe o tamanho/modelo completo da câmara para verificação de compatibilidade da placa de orifício"
                )
                
                st.markdown("---")
                st.subheader("Informações Complementares (Opcional)")
                
                additional_info = st.text_area(
                    "Observações/Especificações Técnicas",
                    placeholder="Ex: Capacidade de descarga, pressão de trabalho, especificações do tanque, placa de orifício atual, etc."
                )
                
                submit_register = st.form_submit_button("➕ Cadastrar Equipamento", type="primary", use_container_width=True)
                
                if submit_register:
                    if not new_id or not new_location or not new_model or not new_specific_size:
                        st.error("Os campos 'ID', 'Localização', 'Modelo' e 'Tamanho Específico' são obrigatórios.")
                    else:
                        with st.spinner("Cadastrando novo equipamento..."):
                            if save_new_foam_chamber(new_id, new_location, new_brand, new_model, new_specific_size):
                                st.success(f"Câmara de espuma '{new_id}' ({new_specific_size}) cadastrada com sucesso!")
                                if additional_info:
                                    st.info(f"Observações registradas: {additional_info}")
                                st.cache_data.clear()

    with tab_manual_register:
        st.header("Cadastro Rápido de Câmara")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novas câmaras.")
        else:
            st.info("Use este formulário simplificado para cadastrar rapidamente uma câmara de espuma com informações básicas.")
            
            with st.form("quick_foam_chamber_form", clear_on_submit=True):
                st.subheader("Dados Essenciais")
                
                quick_id = st.text_input("ID da Câmara*", placeholder="CE-001")
                quick_location = st.text_input("Localização*", placeholder="Tanque TQ-101")
                
                st.markdown("**Tipo de Câmara:**")
                chamber_type = st.radio(
                    "Selecione o tipo",
                    ["MCS - Selo de Vidro", "TF - Tubo de Filme", "MLS - Membrana Low Shear"],
                    horizontal=False
                )
                
                quick_size = st.text_input(
                    "Tamanho/Modelo Específico*", 
                    placeholder="Ex: MCS-17, MCS-33, TF-22",
                    help="Essencial para verificar compatibilidade da placa de orifício"
                )
                
                quick_brand = st.selectbox(
                    "Marca (opcional)", 
                    ["", "ANSUL", "TYCO", "KIDDE", "FLAMEX", "OUTRO"],
                    index=0
                )
                
                if quick_brand == "OUTRO":
                    custom_brand = st.text_input("Digite a marca:")
                    final_brand = custom_brand
                else:
                    final_brand = quick_brand
                
                quick_submit = st.form_submit_button("Cadastrar Rápido", type="primary", use_container_width=True)
                
                if quick_submit:
                    if not quick_id or not quick_location or not quick_size:
                        st.error("ID, Localização e Tamanho Específico são obrigatórios.")
                    else:
                        with st.spinner("Cadastrando..."):
                            if save_new_foam_chamber(quick_id, quick_location, final_brand, chamber_type, quick_size):
                                st.success(f"Câmara '{quick_id}' ({quick_size}) cadastrada rapidamente!")
                                st.balloons()
                                st.cache_data.clear()

    with tab_report:
        st.header("📊 Relatório Consolidado de Câmaras de Espuma")
        
        st.info("Este relatório gera um PDF completo com todas as câmaras inspecionadas, incluindo checklist, planos de ação e fotos de não conformidades.")
        
        col1, col2 = st.columns([3, 1])
        
        with col1:
            st.markdown("""
            **O relatório inclui:**
            - ✅ Dados completos de cada câmara (ID, localização, modelo, tamanho)
            - ✅ Checklist completo com todos os resultados
            - ✅ Status geral (Aprovado/Reprovado)
            - ✅ Plano de ação para não conformidades
            - ✅ Links para fotos de evidências
            - ✅ Assinatura do inspetor responsável
            - ✅ Próxima data de inspeção
            - ✅ Resumo estatístico geral
            """)
        
        with col2:
            if st.button("🔄 Atualizar Dados", use_container_width=True):
                st.cache_data.clear()
                st.rerun()
        
        st.markdown("---")
        
        
        with st.spinner("Carregando dados das inspeções..."):
            inspections_df = load_sheet_data("inspecoes_camaras_espuma")
            inventory_df = load_sheet_data("inventario_camaras_espuma")
        
        if inspections_df.empty:
            st.warning("⚠️ Nenhuma inspeção de câmara de espuma foi realizada ainda.")
            st.info("Realize inspeções na aba 'Realizar Inspeção' para gerar o relatório.")
        else:
            total_chambers = len(inspections_df['id_camara'].unique())
            total_inspections = len(inspections_df)
            
            col1, col2, col3 = st.columns(3)
            col1.metric("Total de Câmaras", total_chambers)
            col2.metric("Total de Inspeções", total_inspections)
            
            inspections_df['data_inspecao'] = pd.to_datetime(inspections_df['data_inspecao'])
            latest = inspections_df.sort_values('data_inspecao').groupby('id_camara').tail(1)
            approved = len(latest[latest['status_geral'] == 'Aprovado'])
            col3.metric("Aprovadas (última inspeção)", f"{approved}/{total_chambers}")
            
            st.markdown("---")
            
            col1, col2, col3 = st.columns([1, 2, 1])
            
            with col2:
                if st.button("📄 Gerar Relatório PDF Consolidado", type="primary", use_container_width=True):
                    with st.spinner("Gerando relatório em PDF... Isso pode levar alguns segundos."):
                        pdf_file = generate_foam_chamber_consolidated_report(inspections_df, inventory_df)
                        
                        if pdf_file:
                            st.success("✅ Relatório gerado com sucesso!")
                            
                            current_date = datetime.now().strftime('%Y%m%d_%H%M')
                            filename = f"Relatorio_Camaras_Espuma_{current_date}.pdf"
                            
                            st.download_button(
                                label="⬇️ Baixar Relatório PDF",
                                data=pdf_file,
                                file_name=filename,
                                mime="application/pdf",
                                use_container_width=True
                            )