# FILE: Pagina_Inicial.py

# ... (importações no topo do arquivo permanecem as mesmas)
# Certifique-se de que can_view está sendo importado de auth_utils
from auth.auth_utils import is_user_logged_in, setup_sidebar, can_edit, is_admin, can_view
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
    is_uo_selected = setup_sidebar()
    
    # --- Menu de Navegação Dinâmico com PERMISSÕES ---
    with st.sidebar:
        st.markdown("---")
        
        # Define a lista completa de páginas
        all_pages = list(PAGES.keys())
        
        # Filtra a lista com base no nível de permissão do usuário
        page_options = []
        if can_view(): # Todos (admin, editor, viewer) podem ver o dashboard
            page_options.append("Dashboard")
            page_options.append("Histórico e Logs")
            
        if can_edit(): # Apenas admin e editor podem acessar páginas de edição/criação
            page_options.append("Inspeção de Extintores")
            page_options.append("Inspeção de Mangueiras")
            page_options.append("Inspeção de SCBA")
            page_options.append("Inspeção de Chuveiros/LO")
            page_options.append("Utilitários")
            
        if is_admin(): # Apenas admin pode ver a página de Super Admin
            page_options.append("Super Admin")
        
        # Remove duplicatas e mantém a ordem original, se necessário
        # (Neste caso, a lógica acima já cria a lista na ordem desejada)

        if not page_options:
            st.warning("Seu usuário não tem permissão para visualizar nenhuma página.")
            st.stop()

        selected_page = option_menu(
            menu_title="Navegação",
            options=page_options,
            # Ícones precisam ser ajustados para corresponder à lista dinâmica
            # Uma abordagem mais segura é mapear nomes de página para ícones
            icons=["speedometer2", "fire", "droplet", "lungs", "droplet-half", "clock-history", "tools", "person-badge"][:len(page_options)],
            menu_icon="compass-fill",
            default_index=0,
            styles={ # Estilos
                "container": {"padding": "0 !important", "background-color": "transparent"},
                "icon": {"color": "inherit", "font-size": "20px"},
                "nav-link": {"font-size": "15px", "text-align": "left", "margin": "0px", "--hover-color": "rgba(255, 255, 255, 0.1)" if st.get_option("theme.base") == "dark" else "#f0f2f6"},
                "nav-link-selected": {"background-color": st.get_option("theme.primaryColor")},
            }
        )
        st.markdown("---")

    # --- Roteador Principal ---
    # A verificação de permissão já foi feita ao criar o menu,
    # então aqui só precisamos renderizar a página selecionada.
    if is_uo_selected or (is_admin() and selected_page == "Super Admin"):
        if selected_page in PAGES:
            PAGES[selected_page]()
        else:
            # Se a página padrão (Dashboard) não for permitida, redireciona para a primeira permitida
            if "Dashboard" in page_options:
                PAGES["Dashboard"]()
            else:
                PAGES[page_options[0]]()
    else:
        st.info("👈 Por favor, selecione uma Unidade Operacional na barra lateral para carregar os dados.")

if __name__ == "__main__":
    main()