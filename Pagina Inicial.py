from config.page_config import set_page_config
from utils.auditoria import log_action
from auth.login_page import show_login_page, show_user_header, show_logout_button
from auth.auth_utils import (
    is_user_logged_in, setup_sidebar, get_user_email,
    get_effective_user_status, get_effective_user_plan, get_user_role,
    is_admin, is_superuser, get_user_info
)
import streamlit as st
from streamlit_option_menu import option_menu
from PIL import Image
import sys
import os

# Adiciona o diretório atual ao path para garantir que os módulos sejam encontrados
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)


# Import com tratamento de erro para módulos opcionais
try:
    from views import (
        administracao, dashboard, resumo_gerencial, inspecao_extintores,
        inspecao_mangueiras, inspecao_scba, inspecao_chuveiros,
        inspecao_camaras_espuma, inspecao_multigas, historico, inspecao_alarmes,
        utilitarios, demo_page, trial_expired_page, inspecao_canhoes_monitores
    )

    # Import condicional do perfil_usuario
    try:
        from views import perfil_usuario
        PERFIL_DISPONIVEL = True
    except ImportError as e:
        PERFIL_DISPONIVEL = False
        st.error(
            f"Módulo perfil_usuario não encontrado: {e}. Algumas funcionalidades podem não estar disponíveis.")

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
    "Inspeção de Canhões Monitores": inspecao_canhoes_monitores.show_page,
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

        # Carrega e armazena os dados do usuário na sessão APENAS UMA VEZ
        if 'user_data' not in st.session_state:
            with st.spinner("Carregando perfil e permissões..."):
                user_info = get_user_info()
                if user_info is None:
                    st.session_state.user_data = {
                        'email': get_user_email(),
                        'status': 'not_in_database'
                    }
                else:
                    st.session_state.user_data = user_info

        user_email = st.session_state.user_data.get('email')

        # Lógica de autorização simplificada
        is_authorized = False

        if user_email is not None:
            if is_superuser():
                is_authorized = True
            elif st.session_state.user_data.get('status') != 'not_in_database':
                is_authorized = True
            else:
                is_authorized = False

        # Só registra ACCESS_DENIED_UNAUTHORIZED se realmente não autorizado
        if not is_authorized:
            if 'unauthorized_logged' not in st.session_state:
                log_action("ACCESS_DENIED_UNAUTHORIZED",
                           f"Tentativa de acesso pelo email: {user_email}")
                st.session_state['unauthorized_logged'] = True

            show_user_header()
            demo_page.show_page()
            st.stop()

        effective_status = get_effective_user_status()

        # Usuário com trial expirado
        if effective_status == 'trial_expirado':
            if 'trial_expired_logged' not in st.session_state:
                log_action("ACCESS_DENIED_TRIAL_EXPIRED",
                           f"Usuário: {user_email}")
                st.session_state['trial_expired_logged'] = True

            show_user_header()
            trial_expired_page.show_page()
            st.stop()

        # Usuário inativo (exceto admins)
        if effective_status == 'inativo' and not is_admin():
            if 'inactive_logged' not in st.session_state:
                log_action("ACCESS_DENIED_INACTIVE_ACCOUNT",
                           f"Usuário: {user_email}")
                st.session_state['inactive_logged'] = True

            show_user_header()
            st.warning(
                "🔒 Sua conta está atualmente inativa. Por favor, entre em contato com o suporte para reativá-la.")
            show_logout_button()
            st.stop()

        # Mostra cabeçalho do usuário
        show_user_header()

        # Configura sidebar e verifica se o ambiente foi carregado
        is_user_environment_loaded = setup_sidebar()

        # Configura navegação lateral
        with st.sidebar:
            # === LOGO NO TOPO DA SIDEBAR ===
            try:
                logo_path = os.path.join(os.path.dirname(
                    __file__), 'assets', 'logo.png')
                logo = Image.open(logo_path)

                # Redimensiona
                max_width = 180
                ratio = max_width / logo.width
                new_height = int(logo.height * ratio)
                logo_resized = logo.resize((max_width, new_height))

                # Centraliza com colunas
                col1, col2, col3 = st.columns([1, 3, 1])
                with col2:
                    st.image(logo_resized, width='content')
            except FileNotFoundError:
                pass
            except Exception as e:
                st.caption(f"Erro ao carregar logo: {e}")

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
                    page_options.extend(
                        ["Resumo Gerencial", "Histórico e Logs"])
                else:
                    page_options.extend([
                        "Dashboard", "Histórico e Logs", "Inspeção de Extintores", "Inspeção de Mangueiras",
                        "Inspeção de SCBA", "Inspeção de Chuveiros/LO", "Inspeção de Câmaras de Espuma",
                        "Inspeção Multigás", "Inspeção de Alarmes", "Inspeção de Canhões Monitores", "Utilitários"
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
                "Inspeção de Canhões Monitores": "water",
                "Utilitários": "tools",
                "Super Admin": "person-badge",
                "Meu Perfil": "person-circle"
            }

            # Gera lista de ícones correspondentes
            icons = [icon_map.get(page, "question-circle")
                     for page in page_options]

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
            if selected_page == "Meu Perfil" and PERFIL_DISPONIVEL:
                PAGES[selected_page]()
            elif is_user_environment_loaded or (is_admin() and selected_page == "Super Admin"):
                if selected_page in PAGES:
                    PAGES[selected_page]()
                else:
                    if page_options:
                        first_available_page = page_options[0]
                        if first_available_page in PAGES:
                            PAGES[first_available_page]()
                        else:
                            st.error(
                                f"Página '{first_available_page}' não encontrada.")
                    else:
                        st.error("Nenhuma página disponível para seu perfil.")
            else:
                if is_admin():
                    st.info(
                        "👈 Como Administrador, seu ambiente de dados não é carregado. Para gerenciar o sistema, acesse o painel de Super Admin.")
                else:
                    st.warning(
                        "👈 Seu ambiente de dados não pôde ser carregado. Verifique o status da sua conta ou contate o administrador.")

        except Exception as e:
            st.error(f"Erro ao carregar a página '{selected_page}': {e}")
            st.error("Tente recarregar a página ou entre em contato com o suporte.")

    except Exception as e:
        st.error(f"Erro crítico na aplicação: {e}")
        st.error("Entre em contato com o suporte técnico.")
        st.stop()


if __name__ == "__main__":
    main()
