from auth.auth_utils import is_user_logged_in, setup_sidebar, can_edit, is_admin, can_view, get_user_email, get_matrix_data, get_user_role
from utils.auditoria import log_action
import streamlit as st
from streamlit_option_menu import option_menu
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from views import (
    administracao,
    dashboard, 
    resumo_gerencial, 
    inspecao_extintores, 
    inspecao_mangueiras, 
    inspecao_scba,
    inspecao_chuveiros,
    inspecao_camaras_espuma,
    historico,
    utilitarios,
    demo_page,
    inspecao_multigas
)

from auth.login_page import show_login_page, show_logout_button, show_user_header
from config.page_config import set_page_config

set_page_config()

PAGES = {
    "Dashboard": dashboard.show_page,
    "Resumo Gerencial": resumo_gerencial.show_page, 
    "Inspeção de Extintores": inspecao_extintores.show_page,
    "Inspeção de Mangueiras": inspecao_mangueiras.show_page,
    "Inspeção de SCBA": inspecao_scba.show_page,
    "Inspeção de Chuveiros/LO": inspecao_chuveiros.show_page,
    "Inspeção de Câmaras de Espuma": inspecao_camaras_espuma.show_page,
    "Inspeção Multigás": inspecao_multigas.show_page,
    "Histórico e Logs": historico.show_page,
    "Utilitários": utilitarios.show_page,
    "Super Admin": administracao.show_page,
}

def main():
    # 1. Gerenciamento de Login
    if not is_user_logged_in():
        show_login_page()
        st.stop()

    if 'user_logged_in' not in st.session_state:
        log_action("LOGIN_SUCCESS")
        st.session_state['user_logged_in'] = True

    # 2. Verificação de Autorização
    permissions_df, _ = get_matrix_data()
    user_email = get_user_email()
    is_authorized = user_email is not None and user_email in permissions_df['email'].values

    if not is_authorized:
        show_user_header()
        show_logout_button()
        demo_page.show_page()
        st.stop()

    # A partir daqui, o usuário está LOGADO e AUTORIZADO
    show_user_header()
    is_uo_selected = setup_sidebar()
    user_role = get_user_role()

    # 3. Roteamento Específico para 'viewer'
    if user_role == 'viewer':
        # Para viewers, não mostramos o menu de navegação.
        # A página de resumo é a única visualização.
        if is_uo_selected:
            resumo_gerencial.show_page()
        else:
            st.info("👈 Por favor, selecione uma Unidade Operacional na barra lateral para carregar os dados.")
        st.stop() # Interrompe aqui para não renderizar o menu de editores/admins

    # 4. Roteamento para 'editor' e 'admin'
    with st.sidebar:
        st.markdown("---")
        
        page_options = []
        if can_view(): # can_view é True para editor e admin
            page_options.append("Dashboard")
            page_options.append("Histórico e Logs")
        if can_edit(): # can_edit é True para editor e admin
            page_options.append("Inspeção de Extintores")
            page_options.append("Inspeção de Mangueiras")
            page_options.append("Inspeção de SCBA")
            page_options.append("Inspeção de Chuveiros/LO")
            page_options.append("Inspeção de Câmaras de Espuma")
            page_options.append("Inspeção Multigás")
            page_options.append("Utilitários")
        if is_admin():
            page_options.append("Super Admin")
        
        icon_map = {
            "Dashboard": "speedometer2", "Histórico e Logs": "clock-history",
            "Inspeção de Extintores": "fire", "Inspeção de Mangueiras": "droplet",
            "Inspeção de SCBA": "lungs", "Inspeção de Chuveiros/LO": "droplet-half",
            "Inspeção de Câmaras de Espuma": "cloud-rain-heavy", "Inspeção Multigás": "wind",
            "Utilitários": "tools", "Super Admin": "person-badge"
        }
        icons = [icon_map.get(page, "question-circle") for page in page_options]

        selected_page = option_menu(
            menu_title="Navegação",
            options=page_options,
            icons=icons,
            menu_icon="compass-fill",
            default_index=0,
            styles={
                "container": {"padding": "0 !important", "background-color": "transparent"},
                "icon": {"color": "inherit", "font-size": "15px"},
                "nav-link": {"font-size": "12px", "text-align": "left", "margin": "0px", "--hover-color": "rgba(255, 255, 255, 0.1)" if st.get_option("theme.base") == "dark" else "#f0f2f6"},
                "nav-link-selected": {"background-color": st.get_option("theme.primaryColor")},
            }
        )
        st.markdown("---")

    if is_uo_selected or (is_admin() and selected_page == "Super Admin"):
        if selected_page in PAGES:
            PAGES[selected_page]()
        else:
            # Fallback para a primeira página disponível
            PAGES[page_options[0]]()
    else:
        st.info("👈 Por favor, selecione uma Unidade Operacional na barra lateral para carregar os dados.")

if __name__ == "__main__":
    main()

