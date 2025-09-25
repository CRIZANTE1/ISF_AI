import streamlit as st
from .auth_utils import is_oidc_available, is_user_logged_in, get_user_display_name
from .azure_auth import get_login_button, handle_redirect

def show_login_page():
    """
    Mostra a página de login e lida com o redirecionamento do Azure de forma robusta.
    """
    
    # Verifica se há um código na URL, indicando um retorno do Azure
    auth_code = st.query_params.get("code")
    
    if auth_code and not st.session_state.get('is_logged_in', False):
        # Somente tenta o login se houver um código E o usuário ainda não estiver logado.
        # Isso evita loops se a página for recarregada com o código ainda na URL.
        login_success = handle_redirect()
        
        if login_success:
            # Se o handle_redirect foi bem-sucedido, ele já definiu o session_state
            # e limpou os query_params. Agora, apenas fazemos o rerun.
            st.success("Autenticação bem-sucedida! Carregando aplicativo...")
            st.rerun() # O rerun fará a verificação `is_user_logged_in()` retornar True na próxima execução
        else:
            # Se o handle_redirect falhou, mostre um erro e pare.
            st.error("Falha ao validar a autenticação com o Azure. Tente novamente.")
            # Não exibe os botões de login para evitar confusão.
            return False

    # Se não houver código de autenticação, exibe a página de login normalmente
    st.title("Login do Sistema de Inspeções")
    st.info("Por favor, escolha um método de login para acessar o sistema.")
    
    with st.container(border=True):
        col1, col2 = st.columns(2)
        
        with col1:
            st.subheader("Login Pessoal / Google")
            if is_oidc_available():
                if st.button("Fazer Login com Google", type="primary", use_container_width=True):
                    st.login()
            else:
                st.warning("O login com Google não está configurado.")

        with col2:
            st.subheader("Login Corporativo / Microsoft")
            get_login_button()
            
    return False # Indica que o login ainda não foi concluído.

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
