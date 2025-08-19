import streamlit as st
import sys
import os
import pandas as pd
from datetime import date

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from operations.eyewash_operations import (
    save_eyewash_inspection, 
    save_new_eyewash_station, 
    CHECKLIST_QUESTIONS
)
from auth.auth_utils import can_edit, get_user_display_name
from operations.demo_page import show_demo_page
from config.page_config import set_page_config
from operations.history import load_sheet_data
from gdrive.config import EYEWASH_INVENTORY_SHEET_NAME

set_page_config()

def show_eyewash_page():
    st.title("🚿 Gestão de Chuveiros e Lava-Olhos de Emergência")

    tab_inspection, tab_register = st.tabs(["📋 Realizar Inspeção", "➕ Cadastrar Novo Equipamento"])

    # --- ABA DE INSPEÇÃO ---
    with tab_inspection:
        st.header("Realizar Inspeção Periódica")
        
        # Carrega a lista de equipamentos cadastrados
        df_inventory = load_sheet_data(EYEWASH_INVENTORY_SHEET_NAME)
        
        if df_inventory.empty:
            st.warning("Nenhum equipamento cadastrado. Vá para a aba 'Cadastrar Novo Equipamento' para começar.")
            st.stop()
        
        # Cria a lista de opções para o selectbox
        equipment_options = df_inventory['id_equipamento'].tolist()
        options = ["Selecione um equipamento..."] + sorted(equipment_options)
        
        selected_equipment_id = st.selectbox("Selecione o Equipamento para Inspecionar", options)

        if selected_equipment_id != "Selecione um equipamento...":
            # Exibe a localização do equipamento selecionado para confirmação
            location = df_inventory[df_inventory['id_equipamento'] == selected_equipment_id].iloc[0].get('localizacao', 'N/A')
            st.info(f"**Localização:** {location}")
            
            st.markdown("---")
            
            with st.form(key=f"inspection_form_{selected_equipment_id}"):
                inspection_results = {}
                non_conformities_found = []
                
                for category, questions in CHECKLIST_QUESTIONS.items():
                    st.subheader(category)
                    for question in questions:
                        key = f"{selected_equipment_id}_{question}".replace(" ", "_").replace("?", "")
                        answer = st.radio(
                            label=question, options=["Conforme", "Não Conforme", "N/A"],
                            key=key, horizontal=True
                        )
                        inspection_results[question] = answer
                        if answer == "Não Conforme":
                            non_conformities_found.append(question)
                
                st.markdown("---")
                
                photo_file = None
                if non_conformities_found:
                    st.warning(f"Foram encontradas {len(non_conformities_found)} não conformidades. Por favor, anexe uma foto como evidência.")
                    photo_file = st.file_uploader("Anexar foto da não conformidade", type=["jpg", "jpeg", "png"], key=f"photo_{selected_equipment_id}")

                submitted = st.form_submit_button("✅ Salvar Inspeção", type="primary", use_container_width=True)

                if submitted:
                    if non_conformities_found and not photo_file:
                        st.error("É obrigatório anexar uma foto quando há não conformidades.")
                    else:
                        overall_status = "Reprovado com Pendências" if non_conformities_found else "Aprovado"
                        with st.spinner("Salvando inspeção..."):
                            if save_eyewash_inspection(selected_equipment_id, overall_status, inspection_results, photo_file, get_user_display_name()):
                                st.success(f"Inspeção para '{selected_equipment_id}' salva com sucesso!")
                                st.balloons() if not non_conformities_found else None
                                st.cache_data.clear()
                                st.rerun()
                            else:
                                st.error("Ocorreu um erro ao salvar a inspeção.")

    # --- ABA DE CADASTRO ---
    with tab_register:
        st.header("Cadastrar Novo Chuveiro / Lava-Olhos")
        
        with st.form("new_eyewash_form", clear_on_submit=True):
            st.info("Preencha os dados do novo equipamento a ser adicionado ao sistema.")
            new_id = st.text_input("**ID do Equipamento (Obrigatório)**", help="Use um código único, ex: CLO-01")
            new_location = st.text_input("**Localização (Obrigatório)**", help="Descrição da localização física, ex: Ao lado do Laboratório Químico")
            new_brand = st.text_input("Marca")
            new_model = st.text_input("Modelo")
            
            submit_register = st.form_submit_button("➕ Cadastrar Equipamento", type="primary", use_container_width=True)
            
            if submit_register:
                if not new_id or not new_location:
                    st.error("Os campos 'ID do Equipamento' e 'Localização' são obrigatórios.")
                else:
                    with st.spinner("Cadastrando novo equipamento..."):
                        if save_new_eyewash_station(new_id, new_location, new_brand, new_model):
                            st.success(f"Equipamento '{new_id}' cadastrado com sucesso!")
                            st.cache_data.clear() # Limpa o cache para atualizar a lista na outra aba
                        # A mensagem de erro já é tratada dentro da função save_new_eyewash_station

# --- Verificação de Permissão ---
if can_edit():
    st.sidebar.success("✅ Acesso completo")
    show_eyewash_page()
else:
    st.sidebar.error("🔒 Acesso negado")
    st.info("Você não tem permissão para acessar esta funcionalidade.")
    show_demo_page()
