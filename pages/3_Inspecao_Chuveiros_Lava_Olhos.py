import streamlit as st
import sys
import os

# Adiciona o diretório raiz ao path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from operations.eyewash_operations import save_eyewash_inspection
from auth.auth_utils import can_edit, get_user_display_name
from operations.demo_page import show_demo_page
from config.page_config import set_page_config

set_page_config()

# Lista de perguntas para o checklist
CHECKLIST_QUESTIONS = {
    "Condições Gerais": [
        "A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?",
        "A PRESSÃO ESTÁ ADEQUADA?",
        "A PINTURA ESTA ÍNTEGRA?",
        "OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?",
        "O ACESSO ESTÁ LIVRE?",
        "NIVELAMENTO POSSUI DESNÍVEL?",
        "A DRENAGEM DE ÁGUA FUNCIONA?",
        "O CRIVO ESTÁ DESOBSTRUÍDO E BEM FIXADO?",
        "O FILTRO ESTÁ LIMPO?",
        "O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?",
        "O PISO POSSUI ADERÊNCIA?",
        "OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?",
        "O EQUIPAMENTO POSSUI CORROSÃO?",
        "EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?",
        "OS ESGUICHOS POSSUEM DEFEITOS?",
        "O PISO ESTÁ DANIFICADO?"
    ]
}

def show_eyewash_inspection_page():
    st.title("🚿 Inspeção de Chuveiros e Lava-Olhos de Emergência")
    
    equipment_id = st.text_input("**Digite o ID ou a localização do equipamento:**", placeholder="Ex: CLO-01 / Próximo ao Tanque T-102")

    if not equipment_id:
        st.info("Por favor, identifique o equipamento para iniciar a inspeção.")
        st.stop()
        
    st.markdown("---")
    
    with st.form(key=f"inspection_form_{equipment_id}", clear_on_submit=True):
        inspection_results = {}
        has_issues = False
        
        for category, questions in CHECKLIST_QUESTIONS.items():
            st.subheader(category)
            for question in questions:
                # Usando uma chave única para cada widget de rádio
                key = f"{equipment_id}_{question}".replace(" ", "_")
                answer = st.radio(
                    label=question,
                    options=["Conforme", "Não Conforme", "N/A"],
                    key=key,
                    horizontal=True
                )
                inspection_results[question] = answer
                if answer == "Não Conforme":
                    has_issues = True
        
        submitted = st.form_submit_button("✅ Salvar Inspeção", type="primary", use_container_width=True)

        if submitted:
            overall_status = "Reprovado com Pendências" if has_issues else "Aprovado"
            with st.spinner("Salvando inspeção..."):
                if save_eyewash_inspection(equipment_id, overall_status, inspection_results, get_user_display_name()):
                    st.success(f"Inspeção para '{equipment_id}' salva com sucesso como '{overall_status}'!")
                    st.balloons() if not has_issues else None
                    st.cache_data.clear()
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
