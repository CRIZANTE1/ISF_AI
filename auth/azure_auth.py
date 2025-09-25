import streamlit as st
import msal
import logging

logger = logging.getLogger('abrangencia_app.azure_auth')

# --- Configuração ---
CLIENT_ID = st.secrets.get("azure", {}).get("client_id")
CLIENT_SECRET = st.secrets.get("azure", {}).get("client_secret")
TENANT_ID = st.secrets.get("azure", {}).get("tenant_id")
REDIRECT_URI = st.secrets.get("azure", {}).get("redirect_uri")

AUTHORITY = f"https://login.microsoftonline.com/{TENANT_ID}"
SCOPE = ["User.Read"] # Permissões básicas para ler o perfil do usuário

@st.cache_resource
def get_msal_app():
    """Inicializa e retorna a aplicação MSAL Confidential Client."""
    if not all([CLIENT_ID, CLIENT_SECRET, TENANT_ID]):
        logger.error("Credenciais do Azure não configuradas nos secrets.")
        return None
    return msal.ConfidentialClientApplication(
        client_id=CLIENT_ID,
        authority=AUTHORITY,
        client_credential=CLIENT_SECRET
    )

def get_login_button():
    """Gera a URL de login do Azure e retorna um st.link_button."""
    msal_app = get_msal_app()
    if not msal_app:
        st.error("O login com Azure não está configurado corretamente.")
        return

    auth_url = msal_app.get_authorization_request_url(
        scopes=SCOPE,
        redirect_uri=REDIRECT_URI
    )
    st.link_button("Fazer Login com Microsoft Azure", auth_url, use_container_width=True)

from streamlit_js_eval import streamlit_js_eval # <-- NOVO IMPORT

def handle_redirect():
    """
    Processa o redirecionamento, armazena as informações do usuário e, em caso de
    sucesso, força um redirecionamento via JavaScript para limpar a URL.
    """
    msal_app = get_msal_app()
    if not msal_app:
        return # Não faz nada se o app MSAL não estiver configurado

    auth_code = st.query_params.get("code")
    if not auth_code or st.session_state.get('login_processed', False):
        return # Sai se não houver código ou se o login já foi processado

    try:
        result = msal_app.acquire_token_by_authorization_code(
            code=auth_code,
            scopes=SCOPE,
            redirect_uri=REDIRECT_URI
        )

        if "error" in result:
            logger.error(f"Erro ao adquirir token: {result.get('error_description')}")
            st.error(f"Erro de autenticação: {result.get('error_description')}")
            st.session_state.login_processed = True # Marca como processado para não tentar de novo
            return

        id_token_claims = result.get('id_token_claims', {})
        user_email = id_token_claims.get('preferred_username')
        user_name = id_token_claims.get('name')

        if not user_email:
            st.error("Erro: E-mail não encontrado no perfil do Azure.")
            st.session_state.login_processed = True
            return

        # Salva as informações do usuário na sessão
        st.session_state.is_logged_in = True
        st.session_state.user_info_custom = {
            "email": user_email.lower().strip(),
            "name": user_name or user_email.split('@')[0]
        }
        st.session_state.login_processed = True # Marca como processado

        logger.info(f"Usuário '{user_email}' autenticado. Redirecionando para limpar URL.")

        st.success("Autenticação bem-sucedida! Redirecionando...")
        streamlit_js_eval(js_expressions="window.location.href = window.location.pathname;")
        st.stop() # Interrompe a execução do script aqui para aguardar o JS

    except Exception as e:
        logger.error(f"Erro inesperado durante handle_redirect: {e}")
        st.error("Ocorreu um erro inesperado durante a autenticação.")
        st.session_state.login_processed = True
