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
from auth.auth_utils import (
    get_user_display_name, check_user_access, can_edit, has_ai_features
)
from config.page_config import set_page_config
from operations.history import load_sheet_data
from operations.instrucoes import instru_eyewash

set_page_config()

def show_page():
    st.title("🚿 Gestão de Chuveiros e Lava-Olhos de Emergência")

    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return
        
    tab_instrucoes, tab_inspection, tab_register, tab_quick_register = st.tabs([
        "📖 Como Usar",
        "📋 Realizar Inspeção", 
        "➕ Cadastrar Novo Equipamento (Completo)",
        "✍️ Cadastro Rápido"
    ])

    with tab_instrucoes:
        instru_eyewash()
        
    with tab_inspection:

        st.header("Realizar Inspeção Periódica")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para realizar inspeções.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            df_inventory = load_sheet_data("inventario_chuveiros_lava_olhos")
            
            if df_inventory.empty:
                st.warning("Nenhum equipamento cadastrado. Vá para as abas de cadastro para começar.")
            else:
                equipment_options = df_inventory['id_equipamento'].tolist()
                options = ["Selecione um equipamento..."] + sorted(equipment_options)
                
                selected_equipment_id = st.selectbox("Selecione o Equipamento para Inspecionar", options)

                if selected_equipment_id != "Selecione um equipamento...":
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

    with tab_register:
        st.header("Cadastrar Novo Chuveiro / Lava-Olhos (Completo)")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novos equipamentos.")
        else:        
            with st.form("new_eyewash_form", clear_on_submit=True):
                st.info("Preencha os dados completos do novo equipamento a ser adicionado ao sistema.")
                
                col1, col2 = st.columns(2)
                new_id = col1.text_input("**ID do Equipamento (Obrigatório)**", help="Use um código único, ex: CLO-01")
                new_location = col2.text_input("**Localização (Obrigatório)**", help="Descrição da localização física, ex: Ao lado do Laboratório Químico")
                
                col3, col4 = st.columns(2)
                new_brand = col3.text_input("Marca")
                new_model = col4.text_input("Modelo")
                
                st.markdown("---")
                st.subheader("Especificações Técnicas (Opcional)")
                
                col5, col6 = st.columns(2)
                equipment_type = col5.selectbox(
                    "Tipo de Equipamento",
                    ["", "Chuveiro de Emergência", "Lava-Olhos", "Chuveiro + Lava-Olhos Combinado", "Chuveiro Portátil", "Lava-Olhos Portátil"]
                )
                installation_date = col6.date_input("Data de Instalação", value=None)
                
                water_pressure = st.text_input("Pressão da Água (opcional)", placeholder="Ex: 2,5 bar")
                flow_rate = st.text_input("Taxa de Fluxo (opcional)", placeholder="Ex: 76 L/min (chuveiro), 5,7 L/min (lava-olhos)")
                
                additional_notes = st.text_area(
                    "Observações Adicionais",
                    placeholder="Informações sobre instalação, manutenções anteriores, etc."
                )
                
                submit_register = st.form_submit_button("➕ Cadastrar Equipamento Completo", type="primary", use_container_width=True)
                
                if submit_register:
                    if not new_id or not new_location:
                        st.error("Os campos 'ID do Equipamento' e 'Localização' são obrigatórios.")
                    else:
                        with st.spinner("Cadastrando novo equipamento..."):
                            if save_new_eyewash_station(new_id, new_location, new_brand, new_model):
                                st.success(f"Equipamento '{new_id}' cadastrado com sucesso!")
                                if additional_notes:
                                    st.info(f"Observações registradas: {additional_notes}")
                                st.cache_data.clear()

    with tab_quick_register:
        st.header("Cadastro Rápido de Equipamento")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novos equipamentos.")
        else:
            st.info("Use este formulário simplificado para cadastrar rapidamente um chuveiro/lava-olhos com informações básicas.")
            
            with st.form("quick_eyewash_form", clear_on_submit=True):
                st.subheader("Dados Essenciais")
                
                quick_id = st.text_input("ID do Equipamento*", placeholder="CLO-001")
                quick_location = st.text_input("Localização*", placeholder="Laboratório - Setor A")
                
                quick_type = st.selectbox(
                    "Tipo de Equipamento",
                    ["Chuveiro de Emergência", "Lava-Olhos", "Chuveiro + Lava-Olhos Combinado"]
                )
                
                common_brands = ["", "HAWS", "BRADLEY", "SPEAKMAN", "GUARDIAN", "ENWARE", "OUTRO"]
                quick_brand = st.selectbox("Marca (opcional)", common_brands)
                
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
                        model_to_use = quick_type if not final_brand else ""
                        
                        with st.spinner("Cadastrando..."):
                            if save_new_eyewash_station(quick_id, quick_location, final_brand, model_to_use):
                                st.success(f"Equipamento '{quick_id}' ({quick_type}) cadastrado rapidamente!")
                                st.balloons()
                                st.cache_data.clear()