import streamlit as st
from .auth_utils import is_oidc_available, is_user_logged_in, get_user_display_name
from .azure_auth import get_login_button, handle_redirect

def show_login_page():
    """
    Mostra a página de login com opções para Google e Azure, e processa
    o redirecionamento de volta do Azure.
    """

    if handle_redirect():
        # Se o login com Azure foi concluído com sucesso, recarrega a página
        # para que o app reconheça o novo estado de login.
        st.success("Login com Azure realizado com sucesso! Redirecionando...")
        st.rerun()

    # --- ETAPA 2: EXIBIR A TELA DE LOGIN ---
    st.title("Login do Sistema de Inspeções")
    st.info("Por favor, escolha um método de login para acessar o sistema.")
    
    # Container para organizar os botões
    with st.container(border=True):
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Login Pessoal / Google")
            # Verifica se o login OIDC (Google) está disponível antes de mostrar o botão
            if is_oidc_available():
                if st.button("Fazer Login com Google", type="primary", use_container_width=True):
                    try:
                        st.login()
                    except Exception as e:
                        st.error(f"O login com Google não está disponível no momento. Erro: {e}")
            else:
                st.warning("O login com Google não está configurado neste ambiente.")

        with col2:
            st.subheader("Login Corporativo / Microsoft")
            # Esta função gera o botão de login do Azure com o link correto.
            get_login_button()
    
    # Retorna False para indicar que o usuário ainda não está logado
    # e que a execução do app principal (Pagina Inicial.py) deve parar.
    return False

def show_user_header():
    """
    Mostra o nome do usuário logado na sidebar.
    Esta função não precisa de alteração porque a lógica foi generalizada
    em `auth_utils.py`.
    """
    st.sidebar.info(f"Usuário: **{get_user_display_name()}**")

def show_logout_button():
    """
    Mostra o botão de logout na sidebar e limpa todas as sessões possíveis.
    """
    if st.sidebar.button("Sair do Sistema (Logout)"):
        # Limpa a sessão customizada do Azure
        keys_to_clear = ['is_logged_in', 'user_info_custom']
        for key in keys_to_clear:
            if key in st.session_state:
                del st.session_state[key]
        
        # Tenta o logout OIDC do Google
        try:
            # st.logout() é específico para o login OIDC
            if is_oidc_available() and st.user.is_logged_in:
                st.logout()
        except Exception:
            # Ignora o erro se o usuário não estava logado com o Google
            pass 
        
        # Recarrega a página para garantir que o estado de logout seja aplicado
        st.rerun()
