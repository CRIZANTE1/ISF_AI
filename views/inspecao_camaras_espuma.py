import streamlit as st
import sys
import os
import pandas as pd

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
from gdrive.config import FOAM_CHAMBER_INVENTORY_SHEET_NAME

set_page_config()

def show_page():
    st.title("☁️ Gestão de Câmaras de Espuma")

    # Check if user has at least viewer permissions
    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return

    tab_inspection, tab_register, tab_manual_register = st.tabs([
        "📋 Realizar Inspeção", 
        "➕ Cadastrar Nova Câmara (Completo)", 
        "✍️ Cadastro Rápido de Câmara"
    ])

    with tab_inspection:
        st.header("Realizar Inspeção Periódica")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para realizar inspeções.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            df_inventory = load_sheet_data(FOAM_CHAMBER_INVENTORY_SHEET_NAME)
            
            if df_inventory.empty:
                st.warning("Nenhuma câmara de espuma cadastrada. Vá para as abas de cadastro para começar.")
            else:
                equipment_options = ["Selecione uma câmara..."] + sorted(df_inventory['id_camara'].tolist())
                selected_chamber_id = st.selectbox("Selecione a Câmara para Inspecionar", equipment_options)

                if selected_chamber_id != "Selecione uma câmara...":
                    chamber_data = df_inventory[df_inventory['id_camara'] == selected_chamber_id].iloc[0]
                    location = chamber_data.get('localizacao', 'N/A')
                    model = chamber_data.get('modelo', 'N/A')
                    
                    st.info(f"**Localização:** {location} | **Modelo:** {model}")
                    
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
                        photo_file = None
                        if has_issues:
                            st.warning("Foi encontrada pelo menos uma não conformidade. Por favor, anexe uma foto como evidência.")
                            photo_file = st.file_uploader(
                                "Anexar foto da não conformidade", 
                                type=["jpg", "jpeg", "png"], 
                                key=f"photo_{selected_chamber_id}"
                            )

                        submitted = st.form_submit_button("✅ Salvar Inspeção", type="primary", use_container_width=True)

                        if submitted:
                            if has_issues and not photo_file:
                                st.error("É obrigatório anexar uma foto quando há não conformidades.")
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
        
        # Check for edit permissions
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
                
                # Informações adicionais
                st.markdown("---")
                st.subheader("Informações Complementares (Opcional)")
                
                additional_info = st.text_area(
                    "Observações/Especificações Técnicas",
                    placeholder="Ex: Capacidade de descarga, pressão de trabalho, especificações do tanque, etc."
                )
                
                submit_register = st.form_submit_button("➕ Cadastrar Equipamento", type="primary", use_container_width=True)
                
                if submit_register:
                    if not new_id or not new_location or not new_model:
                        st.error("Os campos 'ID', 'Localização' e 'Modelo' são obrigatórios.")
                    else:
                        with st.spinner("Cadastrando novo equipamento..."):
                            if save_new_foam_chamber(new_id, new_location, new_brand, new_model):
                                st.success(f"Câmara de espuma '{new_id}' cadastrada com sucesso!")
                                if additional_info:
                                    st.info(f"Observações registradas: {additional_info}")
                                st.cache_data.clear()

    # Nova aba para cadastro rápido
    with tab_manual_register:
        st.header("Cadastro Rápido de Câmara")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novas câmaras.")
        else:
            st.info("Use este formulário simplificado para cadastrar rapidamente uma câmara de espuma com informações básicas.")
            
            with st.form("quick_foam_chamber_form", clear_on_submit=True):
                st.subheader("Dados Essenciais")
                
                quick_id = st.text_input("ID da Câmara*", placeholder="CE-001")
                quick_location = st.text_input("Localização*", placeholder="Tanque TQ-101")
                
                # Modelo com opções mais diretas
                st.markdown("**Tipo de Câmara:**")
                chamber_type = st.radio(
                    "Selecione o tipo",
                    ["MCS - Selo de Vidro", "TF - Tubo de Filme", "MLS - Membrana Low Shear"],
                    horizontal=False
                )
                
                # Marca comum pré-preenchida
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
                    if not quick_id or not quick_location:
                        st.error("ID e Localização são obrigatórios.")
                    else:
                        with st.spinner("Cadastrando..."):
                            if save_new_foam_chamber(quick_id, quick_location, final_brand, chamber_type):
                                st.success(f"Câmara '{quick_id}' cadastrada rapidamente!")
                                st.balloons()
                                st.cache_data.clear()
                            else:
                                st.error("Erro ao cadastrar. Verifique se o ID já não existe.")
