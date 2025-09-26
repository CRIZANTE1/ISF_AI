import streamlit as st
from streamlit_option_menu import option_menu
import sys
import os

# Adiciona o diretório atual ao path para garantir que os módulos sejam encontrados
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from auth.auth_utils import (
    is_user_logged_in, setup_sidebar, get_user_email, get_users_data,
    get_effective_user_status, get_effective_user_plan, get_user_role, 
    is_admin, is_superuser
)
from auth.login_page import show_login_page, show_user_header, show_logout_button
from utils.auditoria import log_action
from config.page_config import set_page_config

# Import com tratamento de erro para módulos opcionais
try:
    from views import (
        administracao, dashboard, resumo_gerencial, inspecao_extintores, 
        inspecao_mangueiras, inspecao_scba, inspecao_chuveiros,
        inspecao_camaras_espuma, inspecao_multigas, historico, inspecao_alarmes,
        utilitarios, demo_page, trial_expired_page
    )
    # Import condicional do perfil_usuario
    try:
        from views import perfil_usuario
        PERFIL_DISPONIVEL = True
    except ImportError:
        PERFIL_DISPONIVEL = False
        st.error("Módulo perfil_usuario não encontrado. Algumas funcionalidades podem não estar disponíveis.")
        
except ImportError as e:
    st.error(f"Erro ao importar módulos: {e}")
    st.stop()

set_page_config()

# Páginas base (sempre disponíveis)
PAGES = {
    "Dashboard": dashboard.show_page, 
    "Resumo Gerencial": resumo_gerencial.show_page, 
    "Inspeção de Extintores": inspecao_extintores.show_page, 
    "Inspeção de Mangueiras": inspecao_mangueiras.show_page,
    "Inspeção de SCBA": inspecao_scba.show_page, 
    "Inspeção de Chuveiros/LO": inspecao_chuveiros.show_page,
    "Inspeção de Câmaras de Espuma": inspecao_camaras_espuma.show_page, 
    "Inspeção Multigás": inspecao_multigas.show_page,
    "Inspeção de Alarmes": inspecao_alarmes.show_page,
    "Histórico e Logs": historico.show_page, 
    "Utilitários": utilitarios.show_page, 
    "Super Admin": administracao.show_page,
}

# Adiciona perfil apenas se disponível
if PERFIL_DISPONIVEL:
    PAGES["Meu Perfil"] = perfil_usuario.show_page

def main():
    if not is_user_logged_in():
        show_login_page(); st.stop()

    if 'user_logged_in' not in st.session_state:
        log_action("LOGIN_SUCCESS", f"Email: {get_user_email()}")
        if is_superuser():
            log_action("SUPERUSER_LOGIN_SUCCESS", f"Email: {get_user_email()}")
        st.session_state['user_logged_in'] = True

    users_df = get_users_data()
    user_email = get_user_email()
    

    is_authorized = user_email is not None and (user_email in users_df['email'].values or is_superuser())

    if not is_authorized:
        log_action("ACCESS_DENIED_UNAUTHORIZED", f"Tentativa de acesso pelo email: {user_email}")
        show_user_header()
        demo_page.show_page()
        st.stop()

    effective_status = get_effective_user_status()

    if effective_status == 'trial_expirado':
        log_action("ACCESS_DENIED_TRIAL_EXPIRED", f"Usuário: {user_email}")
        show_user_header()
        trial_expired_page.show_page()
        st.stop()

    if effective_status == 'inativo' and not is_admin(): # is_admin() já cobre o superuser
        log_action("ACCESS_DENIED_INACTIVE_ACCOUNT", f"Usuário: {user_email}")
        show_user_header()
        st.warning("🔒 Sua conta está atualmente inativa. Por favor, entre em contato com o suporte para reativá-la.")
        show_logout_button()
        st.stop()
    
    show_user_header()
    is_user_environment_loaded = setup_sidebar()

    with st.sidebar:
        st.markdown("---")
        user_role = get_user_role()
        user_plan = get_effective_user_plan()
        page_options = []

        if user_plan == 'basico':
            page_options.extend(["Resumo Gerencial"])
        elif user_plan in ['pro', 'premium_ia']:
            if user_role == 'viewer': 
                page_options.extend(["Resumo Gerencial", "Histórico e Logs"])
            else: 
                page_options.extend([
                    "Dashboard", "Histórico e Logs", "Inspeção de Extintores", "Inspeção de Mangueiras", 
                    "Inspeção de SCBA", "Inspeção de Chuveiros/LO", "Inspeção de Câmaras de Espuma", 
                    "Inspeção Multigás", "Inspeção de Alarmes", "Utilitários"
                ])
        
        # Adiciona "Meu Perfil" apenas se o módulo estiver disponível
        if PERFIL_DISPONIVEL and "Meu Perfil" not in page_options:
            page_options.append("Meu Perfil")
            
        if is_admin() and "Super Admin" not in page_options:
            page_options.append("Super Admin")
        
        icon_map = {
            "Dashboard": "speedometer2", 
            "Resumo Gerencial": "clipboard-data", 
            "Histórico e Logs": "clock-history",
            "Inspeção de Extintores": "fire", 
            "Inspeção de Mangueiras": "droplet", 
            "Inspeção de SCBA": "lungs",
            "Inspeção de Chuveiros/LO": "droplet-half", 
            "Inspeção de Câmaras de Espuma": "cloud-rain-heavy",
            "Inspeção Multigás": "wind",
            "Inspeção de Alarmes": "bell",
            "Utilitários": "tools", 
            "Super Admin": "person-badge",
            "Meu Perfil": "person-circle"
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
                "nav-link": {"font-size": "12px", "text-align": "left", "margin": "0px", "--hover-color": "#262730"},
                "nav-link-selected": {"background-color": st.get_option("theme.primaryColor")},
            }
        )
        st.markdown("---")
        show_logout_button()

    # Lógica especial para "Meu Perfil" - sempre permite acesso se disponível
    if selected_page == "Meu Perfil" and PERFIL_DISPONIVEL:
        PAGES[selected_page]()
    elif is_user_environment_loaded or (is_admin() and selected_page == "Super Admin"):
        if selected_page in PAGES:
            PAGES[selected_page]()
        else:
            if page_options: 
                # Seleciona a primeira página disponível
                first_available_page = page_options[0]
                if first_available_page in PAGES:
                    PAGES[first_available_page]()
    else:
        if is_admin(): 
            st.info("👈 Como Administrador, seu ambiente de dados não é carregado. Para gerenciar o sistema, acesse o painel de Super Admin.")
        else: 
            st.warning("👈 Seu ambiente de dados não pôde ser carregado. Verifique o status da sua conta ou contate o administrador.")

if __name__ == "__main__":
    main()
