import streamlit as st
from .auth_utils import is_oidc_available, is_user_logged_in, get_user_display_name

def show_login_page():
    """
    Mostra a página de login apenas com Google OIDC.
    Azure foi removido do frontend.
    """
    
    st.title("Login do Sistema de Inspeções")
    st.info("Por favor, faça login com sua conta Google para acessar o sistema.")
    
    with st.container(border=True):
        st.subheader("Login com Google")
        if is_oidc_available():
            if st.button("Fazer Login com Google", type="primary", use_container_width=True):
                st.login()
        else:
            st.warning("O login com Google não está configurado.")
            st.error("Entre em contato com o administrador do sistema.")
            
    return False # Indica que o login ainda não foi concluído.

def show_user_header():
    """
    Mostra o nome do usuário logado na sidebar.
    """
    st.sidebar.info(f"Usuário: **{get_user_display_name()}**")

def show_logout_button():
    """
    Mostra o botão de logout na sidebar e limpa todas as sessões.
    """
    if st.sidebar.button("Sair do Sistema (Logout)"):
        # Limpa qualquer sessão customizada (caso Azure ainda seja usado no backend)
        keys_to_clear = ['is_logged_in', 'user_info_custom']
        for key in keys_to_clear:
            if key in st.session_state:
                del st.session_state[key]
        
        # Tenta o logout OIDC do Google
        try:
            if is_oidc_available() and st.user.is_logged_in:
                st.logout()
        except Exception:
            # Ignora o erro se o usuário não estava logado com o Google
            pass 
        
        # Recarrega a página para garantir que o estado de logout seja aplicado
        st.rerun()
