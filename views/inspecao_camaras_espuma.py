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
from auth.auth_utils import get_user_display_name
from config.page_config import set_page_config
from operations.history import load_sheet_data
from gdrive.config import FOAM_CHAMBER_INVENTORY_SHEET_NAME

set_page_config()

def show_page():
    st.title("☁️ Gestão de Câmaras de Espuma")

    tab_inspection, tab_register = st.tabs(["📋 Realizar Inspeção", "➕ Cadastrar Nova Câmara"])

    with tab_inspection:
        st.header("Realizar Inspeção Periódica")
        
        df_inventory = load_sheet_data(FOAM_CHAMBER_INVENTORY_SHEET_NAME)
        
        if df_inventory.empty:
            st.warning("Nenhuma câmara de espuma cadastrada. Vá para a aba 'Cadastrar Nova Câmara' para começar.")
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
                                    photo_file=photo_file, # Passa o arquivo da foto
                                    inspector_name=get_user_display_name()
                                ):
                                    st.success(f"Inspeção '{inspection_type}' para a câmara '{selected_chamber_id}' salva com sucesso!")
                                    st.balloons() if not has_issues else None
                                    st.cache_data.clear()
                                    st.rerun()
                                else:
                                    st.error("Ocorreu um erro ao salvar a inspeção.")

    with tab_register:
        st.header("Cadastrar Nova Câmara de Espuma")
        
        with st.form("new_foam_chamber_form", clear_on_submit=True):
            st.info("Preencha os dados do novo equipamento a ser adicionado ao sistema.")
            new_id = st.text_input("**ID da Câmara (Obrigatório)**", help="Use um código único, ex: CE-TQ-01")
            new_location = st.text_input("**Localização (Obrigatório)**", help="Descrição da localização física, ex: Topo do Tanque TQ-101")
            
            model_options = list(CHECKLIST_QUESTIONS.keys())
            new_model = st.selectbox("**Modelo da Câmara (Obrigatório)**", options=model_options)
            
            new_brand = st.text_input("Marca")
            
            submit_register = st.form_submit_button("➕ Cadastrar Equipamento", type="primary", use_container_width=True)
            
            if submit_register:
                if not new_id or not new_location or not new_model:
                    st.error("Os campos 'ID', 'Localização' e 'Modelo' são obrigatórios.")
                else:
                    with st.spinner("Cadastrando novo equipamento..."):
                        if save_new_foam_chamber(new_id, new_location, new_brand, new_model):
                            st.success(f"Câmara de espuma '{new_id}' cadastrada com sucesso!")
                            st.cache_data.clear()
