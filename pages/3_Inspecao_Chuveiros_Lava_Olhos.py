import streamlit as st
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from operations.eyewash_operations import save_eyewash_inspection, CHECKLIST_QUESTIONS
from auth.auth_utils import can_edit, get_user_display_name
from operations.demo_page import show_demo_page
from config.page_config import set_page_config

set_page_config()

def show_eyewash_inspection_page():
    st.title("🚿 Inspeção de Chuveiros e Lava-Olhos de Emergência")
    
    equipment_id = st.text_input("**Digite o ID ou a localização do equipamento:**", placeholder="Ex: CLO-01 / Próximo ao Tanque T-102")

    if not equipment_id:
        st.info("Por favor, identifique o equipamento para iniciar a inspeção.")
        st.stop()
        
    st.markdown("---")
    
    with st.form(key=f"inspection_form_{equipment_id}"):
        inspection_results = {}
        non_conformities_found = []
        
        for category, questions in CHECKLIST_QUESTIONS.items():
            st.subheader(category)
            for question in questions:
                key = f"{equipment_id}_{question}".replace(" ", "_")
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
            photo_file = st.file_uploader("Anexar foto da não conformidade", type=["jpg", "jpeg", "png"])

        submitted = st.form_submit_button("✅ Salvar Inspeção", type="primary", use_container_width=True)

        if submitted:
            if non_conformities_found and not photo_file:
                st.error("É obrigatório anexar uma foto quando há não conformidades.")
            else:
                overall_status = "Reprovado com Pendências" if non_conformities_found else "Aprovado"
                with st.spinner("Salvando inspeção..."):
                    if save_eyewash_inspection(equipment_id, overall_status, inspection_results, photo_file, get_user_display_name()):
                        st.success(f"Inspeção para '{equipment_id}' salva com sucesso como '{overall_status}'!")
                        st.balloons() if not non_conformities_found else None
                        st.cache_data.clear()
                        st.rerun() 
                    else:
                        st.error("Ocorreu um erro ao salvar a inspeção.")

# --- Verificação de Permissão ---
if can_edit():
    st.sidebar.success("✅ Acesso completo")
    show_eyewash_inspection_page()
else:
    st.sidebar.error("🔒 Acesso negado")
    st.info("Você não tem permissão para acessar esta funcionalidade.")
    show_demo_page()
