
import streamlit as st
from streamlit_option_menu import option_menu
import sys
import os

# Adiciona o diretório raiz ao path do Python para garantir que os módulos sejam encontrados
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# --- Módulos do Projeto ---
from auth.auth_utils import is_user_logged_in, setup_sidebar, get_user_role, get_user_email, get_users_data, is_admin
from auth.login_page import show_login_page, show_user_header
from utils.auditoria import log_action
from config.page_config import set_page_config

# --- Módulos de Views (Páginas) ---
from views import (
    administracao,
    dashboard, 
    resumo_gerencial, 
    inspecao_extintores, 
    inspecao_mangueiras, 
    inspecao_scba,
    inspecao_chuveiros,
    inspecao_camaras_espuma,
    inspecao_multigas,
    historico,
    utilitarios,
    demo_page
)

# Configurações iniciais da página (título, ícone, layout)
set_page_config()

# Dicionário que mapeia o nome da página para a função que a renderiza
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
    """Função principal que controla o fluxo da aplicação."""

    # 1. VERIFICAÇÃO DE LOGIN
    # Ninguém passa deste ponto sem estar logado no Google.
    if not is_user_logged_in():
        show_login_page()
        st.stop()

    # Registra o evento de login na auditoria, apenas na primeira vez após logar
    if 'user_logged_in' not in st.session_state:
        log_action("LOGIN_SUCCESS")
        st.session_state['user_logged_in'] = True

    # 2. VERIFICAÇÃO DE AUTORIZAÇÃO
    # O usuário está logado, mas ele está na nossa lista de usuários permitidos?
    users_df = get_users_data()
    user_email = get_user_email()
    is_authorized = user_email is not None and user_email in users_df['email'].values

    if not is_authorized:
        show_user_header() # Mostra o nome do usuário para que ele saiba com qual conta logou
        demo_page.show_page() # Mostra a página para solicitar acesso
        st.stop()

    # 3. SETUP DO AMBIENTE DO USUÁRIO
    # Se chegou aqui, o usuário está autorizado. Agora, carregamos seu ambiente.
    show_user_header()
    is_user_environment_loaded = setup_sidebar() # Tenta carregar spreadsheet_id e folder_id na sessão

    # 4. CONSTRUÇÃO DO MENU DE NAVEGAÇÃO
    with st.sidebar:
        st.markdown("---")
        
        user_role = get_user_role()
        page_options = []

        # Constrói a lista de páginas permitidas com base no perfil do usuário
        if user_role == 'viewer':
            page_options.extend(["Resumo Gerencial", "Histórico e Logs"])
        else: # 'editor' ou 'admin'
            page_options.extend([
                "Dashboard", "Histórico e Logs", "Inspeção de Extintores", 
                "Inspeção de Mangueiras", "Inspeção de SCBA", "Inspeção de Chuveiros/LO", 
                "Inspeção de Câmaras de Espuma", "Inspeção Multigás", "Utilitários"
            ])
        
        # A página de admin só aparece para admins
        if is_admin():
            page_options.append("Super Admin")
        
        # Mapeamento de ícones para cada página
        icon_map = {
            "Dashboard": "speedometer2", "Resumo Gerencial": "clipboard-data",
            "Histórico e Logs": "clock-history", "Inspeção de Extintores": "fire",
            "Inspeção de Mangueiras": "droplet", "Inspeção de SCBA": "lungs",
            "Inspeção de Chuveiros/LO": "droplet-half", "Inspeção de Câmaras de Espuma": "cloud-rain-heavy",
            "Inspeção Multigás": "wind", "Utilitários": "tools", "Super Admin": "person-badge"
        }
        icons = [icon_map.get(page, "question-circle") for page in page_options]

        # Cria o menu visual na sidebar
        selected_page = option_menu(
            menu_title="Navegação",
            options=page_options,
            icons=icons,
            menu_icon="compass-fill",
            default_index=0,
            styles={
                "container": {"padding": "0 !important", "background-color": "transparent"},
                "icon": {"color": "inherit", "font-size": "15px"},
                "nav-link": {"font-size": "12px", "text-align": "left", "margin": "0px", "--hover-color": "#262730"},
                "nav-link-selected": {"background-color": st.get_option("theme.primaryColor")},
            }
        )
        st.markdown("---")

    # 5. RENDERIZAÇÃO DA PÁGINA SELECIONADA
    # Condição principal: o ambiente do usuário precisa estar carregado, OU
    # o usuário é um admin e selecionou a página de admin.
    if is_user_environment_loaded or (is_admin() and selected_page == "Super Admin"):
        if selected_page in PAGES:
            PAGES[selected_page]() # Chama a função da página selecionada
        else:
            # Fallback para a primeira página disponível, caso algo dê errado
            if page_options:
                PAGES[page_options[0]]()
    else:
        # Se o ambiente não foi carregado, exibe uma mensagem informativa.
        if is_admin():
            st.info("👈 Como Administrador, seu ambiente de dados pessoal não é carregado por padrão. As páginas de dados estarão vazias. Para gerenciar usuários e o sistema, acesse o painel de Super Admin.")
        else:
            st.warning("👈 Seu ambiente de dados não pôde ser carregado. Verifique o status do seu plano na barra lateral ou contate o administrador do sistema.")

if __name__ == "__main__":
    main()
