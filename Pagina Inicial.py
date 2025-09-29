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
    except ImportError as e:
        PERFIL_DISPONIVEL = False
        st.error(f"Módulo perfil_usuario não encontrado: {e}. Algumas funcionalidades podem não estar disponíveis.")
        
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
    """Função principal do aplicativo"""
    try:
        # Verifica se o usuário está logado
        if not is_user_logged_in():
            show_login_page()
            st.stop()

        # Log de login (apenas uma vez por sessão)
        if 'user_logged_in' not in st.session_state:
            user_email = get_user_email()
            log_action("LOGIN_SUCCESS", f"Email: {user_email}")
            
            if is_superuser():
                log_action("SUPERUSER_LOGIN_SUCCESS", f"Email: {user_email}")
            
            st.session_state['user_logged_in'] = True

        # Carrega dados do usuário
        try:
            users_df = get_users_data()
            user_email = get_user_email()
        except Exception as e:
            st.error(f"Erro ao carregar dados do usuário: {e}")
            show_logout_button()
            st.stop()

        is_authorized = False
        user_status = None
        
        if user_email is not None:
            # Superuser sempre tem acesso
            if is_superuser():
                is_authorized = True
                user_status = "superuser"
            # Usuário comum deve estar na lista de usuários autorizados
            elif not users_df.empty and user_email in users_df['email'].values:
                user_row = users_df[users_df['email'] == user_email].iloc[0]
                user_status = user_row.get('status', 'inativo')
                
                # Considera autorizado se estiver na planilha (independente do status)
                # O status será verificado depois para determinar o tipo de acesso
                is_authorized = True
            else:
                # Usuário NÃO está na planilha - não autorizado
                is_authorized = False
                user_status = "not_in_database"

        # Só registra ACCESS_DENIED_UNAUTHORIZED se realmente não autorizado
        if not is_authorized:
            # Registra apenas UMA VEZ por sessão
            if 'unauthorized_logged' not in st.session_state:
                log_action("ACCESS_DENIED_UNAUTHORIZED", f"Tentativa de acesso pelo email: {user_email}")
                st.session_state['unauthorized_logged'] = True
            
            show_user_header()
            demo_page.show_page()
            st.stop()


        
        effective_status = get_effective_user_status()

        # Usuário com trial expirado
        if effective_status == 'trial_expirado':
            if 'trial_expired_logged' not in st.session_state:
                log_action("ACCESS_DENIED_TRIAL_EXPIRED", f"Usuário: {user_email}")
                st.session_state['trial_expired_logged'] = True
            
            show_user_header()
            trial_expired_page.show_page()
            st.stop()

        # Usuário inativo (exceto admins)
        if effective_status == 'inativo' and not is_admin():
            if 'inactive_logged' not in st.session_state:
                log_action("ACCESS_DENIED_INACTIVE_ACCOUNT", f"Usuário: {user_email}")
                st.session_state['inactive_logged'] = True
            
            show_user_header()
            st.warning("🔒 Sua conta está atualmente inativa. Por favor, entre em contato com o suporte para reativá-la.")
            show_logout_button()
            st.stop()
        

        
        # Mostra cabeçalho do usuário
        show_user_header()
        
        # Configura sidebar e verifica se o ambiente foi carregado
        is_user_environment_loaded = setup_sidebar()

        # Configura navegação lateral
        with st.sidebar:
            st.markdown("---")
            
            # Obtém informações do usuário
            user_role = get_user_role()
            user_plan = get_effective_user_plan()
            page_options = []

            # Define opções de página baseadas no plano e role
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
                
            # Adiciona "Super Admin" para administradores
            if is_admin() and "Super Admin" not in page_options:
                page_options.append("Super Admin")
            
            # Mapeia ícones para cada página
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
            
            # Gera lista de ícones correspondentes
            icons = [icon_map.get(page, "question-circle") for page in page_options]

            # Menu de navegação
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

        # Lógica de renderização de páginas
        try:
            # Lógica especial para "Meu Perfil" - sempre permite acesso se disponível
            if selected_page == "Meu Perfil" and PERFIL_DISPONIVEL:
                PAGES[selected_page]()
            # Verifica se ambiente está carregado ou se é admin acessando Super Admin
            elif is_user_environment_loaded or (is_admin() and selected_page == "Super Admin"):
                if selected_page in PAGES:
                    PAGES[selected_page]()
                else:
                    # Fallback para primeira página disponível
                    if page_options: 
                        first_available_page = page_options[0]
                        if first_available_page in PAGES:
                            PAGES[first_available_page]()
                        else:
                            st.error(f"Página '{first_available_page}' não encontrada.")
                    else:
                        st.error("Nenhuma página disponível para seu perfil.")
            else:
                # Mensagens para ambiente não carregado
                if is_admin(): 
                    st.info("👈 Como Administrador, seu ambiente de dados não é carregado. Para gerenciar o sistema, acesse o painel de Super Admin.")
                else: 
                    st.warning("👈 Seu ambiente de dados não pôde ser carregado. Verifique o status da sua conta ou contate o administrador.")
                    
        except Exception as e:
            st.error(f"Erro ao carregar a página '{selected_page}': {e}")
            st.error("Tente recarregar a página ou entre em contato com o suporte.")
            
    except Exception as e:
        st.error(f"Erro crítico na aplicação: {e}")
        st.error("Entre em contato com o suporte técnico.")
        st.stop()

if __name__ == "__main__":
    main()
