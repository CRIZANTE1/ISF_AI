import streamlit as st
import pandas as pd
from datetime import datetime
import pytz

# Importa a classe de upload e o nome da aba de usuários da configuração
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import USERS_SHEET_NAME, ACCESS_REQUESTS_SHEET_NAME

# --- Funções de Status de Login e Informações Básicas do Usuário ---

def is_oidc_available():
    """Verifica se o componente de autenticação do Streamlit está disponível."""
    try:
        return hasattr(st.user, 'is_logged_in')
    except Exception:
        return False

def is_user_logged_in():
    """Verifica se o usuário está atualmente logado."""
    try:
        return st.user.is_logged_in
    except Exception:
        return False

def get_user_display_name():
    """Retorna o nome de exibição do usuário, ou o email como fallback."""
    try:
        if hasattr(st.user, 'name') and st.user.name:
            return st.user.name
        elif hasattr(st.user, 'email'):
            return st.user.email
        return "Usuário Anônimo"
    except Exception:
        return "Usuário Anônimo"

def get_user_email() -> str | None:
    """Retorna o e-mail do usuário logado, normalizado para minúsculas e sem espaços extras."""
    try:
        if hasattr(st.user, 'email') and st.user.email:
            return st.user.email.lower().strip()
        return None
    except Exception:
        return None

# --- Funções de Acesso e Gerenciamento de Dados da Planilha Matriz ---

@st.cache_data(ttl=600, show_spinner="Verificando permissões de usuário...")
def get_users_data():
    """
    Busca os dados da aba 'usuarios' da Planilha Matriz e os armazena em cache.
    Esta é uma função crítica para a performance, evitando múltiplas leituras da planilha.
    """
    try:
        # Instancia o uploader em modo 'matrix' para acessar a planilha central
        uploader = GoogleDriveUploader(is_matrix=True)
        users_data = uploader.get_data_from_sheet(USERS_SHEET_NAME)
        
        # Verifica se a planilha tem dados além do cabeçalho
        if users_data and len(users_data) >= 2:
            df = pd.DataFrame(users_data[1:], columns=users_data[0])
            # Normaliza colunas importantes para evitar erros de digitação ou maiúsculas/minúsculas
            df['email'] = df['email'].str.lower().str.strip()
            df['role'] = df['role'].str.lower().str.strip()
            df['plano'] = df['plano'].str.lower().str.strip()
            return df
        return pd.DataFrame() # Retorna um DataFrame vazio se não houver dados
    except Exception as e:
        st.error(f"Erro crítico ao carregar dados de usuários da planilha matriz: {e}")
        return pd.DataFrame()

def get_user_info() -> dict | None:
    """
    Encontra e retorna o registro completo (como um dicionário) do usuário logado.
    Retorna None se o usuário não for encontrado na planilha de usuários.
    """
    user_email = get_user_email()
    if not user_email:
        return None

    users_df = get_users_data()
    if users_df.empty:
        return None

    user_entry = users_df[users_df['email'] == user_email]
    
    return user_entry.iloc[0].to_dict() if not user_entry.empty else None

# --- Funções Abstratas de Permissão ---

def get_user_role():
    """Retorna o perfil ('role') do usuário logado. Padrão: 'viewer'."""
    user_info = get_user_info()
    return user_info.get('role', 'viewer') if user_info else 'viewer'

def is_admin():
    """Verifica se o usuário tem perfil de 'admin'."""
    return get_user_role() == 'admin'

def can_edit():
    """Verifica se o usuário tem permissão para editar (admin ou editor)."""
    return get_user_role() in ['admin', 'editor']

def can_view():
    """Verifica se o usuário tem permissão para visualizar (qualquer perfil logado e autorizado)."""
    return get_user_role() in ['admin', 'editor', 'viewer']

# --- Lógica Central de Carregamento de Ambiente na Sessão ---

def setup_sidebar():
    """
    Função principal que é executada em cada página.
    Verifica o status do usuário, seu plano, e carrega seu ambiente de dados na sessão.
    Retorna True se o ambiente foi carregado com sucesso, False caso contrário.
    """
    from .login_page import show_logout_button
    show_logout_button() # Coloca o botão de logout na sidebar

    user_info = get_user_info()
    
    # Caso 1: Usuário não está na lista ou não tem um plano ativo
    if not user_info or user_info.get('plano') != 'ativo':
        # Caso especial: Admins podem acessar o painel de admin mesmo sem um ambiente próprio
        if is_admin():
            st.sidebar.warning("Visão de Administrador. As páginas de dados não serão carregadas.")
            return False
        else:
            # Usuário comum com plano inativo ou não cadastrado
            st.sidebar.error("Seu plano não está ativo. Contate o suporte.")
            return False

    spreadsheet_id = user_info.get('spreadsheet_id')
    folder_id = user_info.get('folder_id')

    # Caso 2: Usuário tem plano ativo, mas seu ambiente não foi provisionado corretamente
    if pd.isna(spreadsheet_id) or pd.isna(folder_id) or spreadsheet_id == '' or folder_id == '':
        st.sidebar.error("Erro: Seu ambiente de dados não foi encontrado. Contate o suporte.")
        return False

    # Caso 3: Sucesso! O usuário tem plano ativo e ambiente provisionado.
    # Limpa o cache se o usuário logado mudou para evitar vazamento de dados de outra conta
    if st.session_state.get('current_user_email') != user_info['email']:
        st.cache_data.clear()

    # Armazena as informações críticas na sessão do Streamlit
    st.session_state['current_user_email'] = user_info['email']
    st.session_state['current_spreadsheet_id'] = spreadsheet_id
    st.session_state['current_folder_id'] = folder_id
    
    st.sidebar.success(f"Ambiente de **{user_info.get('nome', 'Usuário')}** carregado.")
    return True

# --- Função para Solicitação de Acesso ---

def save_access_request(user_name, user_email, justification):
    """Salva uma nova solicitação de acesso na Planilha Matriz."""
    try:
        sao_paulo_tz = pytz.timezone("America/Sao_Paulo")
        timestamp = datetime.now(sao_paulo_tz).strftime('%Y-%m-%d %H:%M:%S')

        request_row = [timestamp, user_name, user_email, "Plano Padrão", justification, "Pendente"]
        
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        
        # Verifica se já existe uma solicitação pendente para este e-mail
        requests_data = matrix_uploader.get_data_from_sheet(ACCESS_REQUESTS_SHEET_NAME)
        if requests_data and len(requests_data) > 1:
            df_requests = pd.DataFrame(requests_data[1:], columns=requests_data[0])
            if not df_requests[(df_requests['email_usuario'] == user_email) & (df_requests['status'] == 'Pendente')].empty:
                st.warning("Você já possui uma solicitação de acesso pendente. Por favor, aguarde.")
                return False

        matrix_uploader.append_data_to_sheet(ACCESS_REQUESTS_SHEET_NAME, [request_row])
        return True
    except Exception as e:
        st.error(f"Ocorreu um erro ao enviar sua solicitação: {e}")
        return False
