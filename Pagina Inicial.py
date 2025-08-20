import streamlit as st
from streamlit_option_menu import option_menu
import sys
import os


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))



from views import (
    administracao,
    dashboard, 
    inspecao_extintores, 
    inspecao_mangueiras, 
    inspecao_scba,
    inspecao_chuveiros,
    historico,
    utilitarios
)

# --- 2. Suas importações normais ---
from auth.login_page import show_login_page, show_logout_button, show_user_header
from auth.auth_utils import is_user_logged_in, setup_sidebar, can_edit, is_admin
from config.page_config import set_page_config

# Configuração da página, sempre no início
set_page_config()

# --- 3. Dicionário de Roteamento ---
# Mapeia o nome do menu para a função que desenha a página.
PAGES = {
    "Dashboard": dashboard.show_page,
    "Inspeção de Extintores": inspecao_extintores.show_page,
    "Inspeção de Mangueiras": inspecao_mangueiras.show_page,
    "Inspeção de SCBA": inspecao_scba.show_page,
    "Inspeção de Chuveiros/LO": inspecao_chuveiros.show_page,
    "Histórico e Logs": historico.show_page,
    "Utilitários": utilitarios.show_page,
    "Super Admin": administracao.show_page,
}

def main():
    # --- Gerenciamento de Login ---
    if not is_user_logged_in():
        show_login_page()
        st.stop()

    # --- Interface Comum ---
    show_user_header()
    
    # A função setup_sidebar agora lida com a seleção da UO E o botão de logout
    is_uo_selected = setup_sidebar()
    
    # --- Menu de Navegação na Barra Lateral ---
    with st.sidebar:
        st.markdown("---")
        
        page_options = list(PAGES.keys())
        
        if not is_admin():
            page_options.remove("Super Admin")

        selected_page = option_menu(
            menu_title="Navegação",
            options=page_options,
            icons=["speedometer2", "fire", "droplet", "lungs", "droplet-half", "clock-history", "tools", "person-badge"],
            menu_icon="compass-fill",
            default_index=0,
            # --- SUBSTITUA SEU BLOCO 'styles' POR ESTE ---
            styles={
                "container": {
                    "padding": "5px !important", # Adiciona um pequeno respiro ao redor de todo o menu
                    "background-color": "#262730" # Sua cor de fundo preferida
                },
                "icon": {
                    "color": "#0083B8", 
                    "font-size": "20px" # Um pouco maior para melhor visibilidade
                }, 
                "nav-link": {
                    "font-size": "15px", # 15px é um bom equilíbrio entre compacto e legível
                    "text-align": "left",
                    "margin":"0px",
                    "--hover-color": "#333333",
                    "border-radius": "5px", # Suaviza as bordas no hover e na seleção
                },
                "nav-link-selected": {
                    "background-color": "#083D5B" # Sua cor de seleção preferida
                },
                "menu-title": {
                     "font-size": "18px",
                     "font-weight": "bold",
                }
            }
            # -----------------------------------------------
        )
        st.markdown("---")

    # --- Roteador Principal ---
    if is_uo_selected:
        if selected_page in PAGES:
            PAGES[selected_page]()
        else:
            PAGES["Dashboard"]()
    elif is_admin() and selected_page == "Super Admin":
         # Permite que o Super Admin acesse sua página mesmo sem UO selecionada
        PAGES["Super Admin"]()
    else:
        st.info("👈 Por favor, selecione uma Unidade Operacional na barra lateral para carregar os dados.")

if __name__ == "__main__":
    main()
