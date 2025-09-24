import streamlit as st
from .auth_utils import is_oidc_available, is_user_logged_in, get_user_display_name

def show_login_page():
    """Mostra a página de login"""
    st.title("Login do Sistema de Inspeções")

    # A função é usada aqui para verificar se a autenticação é possível
    if not is_oidc_available():
        st.error("O sistema de autenticação (OIDC) não está disponível ou configurado.")
        return False
        
    if not is_user_logged_in():
        st.info("Por favor, faça login com sua conta Google para acessar o sistema.")
        if st.button("Fazer Login com Google", type="primary", use_container_width=True):
            st.login()
        return False
        
    return True

def show_user_header():
    """Mostra o nome do usuário logado na sidebar"""
    st.sidebar.info(f"Usuário: **{get_user_display_name()}**")

def show_logout_button():
    """Mostra o botão de logout na sidebar"""
    if st.sidebar.button("Sair do Sistema (Logout)"):
        st.logout()
        st.rerun()
