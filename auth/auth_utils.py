import streamlit as st
import pandas as pd
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import ADMIN_SHEET_NAME, UNITS_SHEET_NAME, ACCESS_REQUESTS_SHEET_NAME
from datetime import datetime
import pytz

def is_oidc_available():
    try:
        return hasattr(st.user, 'is_logged_in')
    except Exception:
        return False

def is_user_logged_in():
    try:
        return st.user.is_logged_in
    except Exception:
        return False

def get_user_display_name():
    try:
        if hasattr(st.user, 'name'):
            return st.user.name
        elif hasattr(st.user, 'email'):
            return st.user.email
        return "Usuário"
    except Exception:
        return "Usuário"


def get_user_email() -> str | None:
    """Retorna o e-mail do usuário logado, normalizado para minúsculas."""
    try:
        if hasattr(st.user, 'email') and st.user.email:
            return st.user.email.lower().strip()
        return None
    except Exception:
        return None

@st.cache_data(ttl=600)
def get_matrix_data():
    """Carrega os dados das abas 'adm' and 'unidades' da Planilha Matriz."""
    try:
        uploader = GoogleDriveUploader(is_matrix=True) # Indica que é para usar a planilha matriz
        
        # Carrega dados de permissões
        admin_data = uploader.get_data_from_sheet(ADMIN_SHEET_NAME)
        permissions_df = pd.DataFrame(columns=['email', 'nome', 'role', 'unidade_operacional'])
        if admin_data and len(admin_data) >= 2:
            permissions_df = pd.DataFrame(admin_data[1:], columns=admin_data[0])
            permissions_df['email'] = permissions_df['email'].str.lower().str.strip()
            permissions_df['role'] = permissions_df['role'].str.lower().str.strip()

        # Carrega dados das unidades
        units_data = uploader.get_data_from_sheet(UNITS_SHEET_NAME)
        units_df = pd.DataFrame(columns=['nome_unidade', 'spreadsheet_id', 'folder_id'])
        if units_data and len(units_data) >= 2:
            units_df = pd.DataFrame(units_data[1:], columns=units_data[0])

        return permissions_df, units_df
    except Exception as e:
        st.error(f"Erro crítico ao carregar dados da planilha matriz: {e}")
        return pd.DataFrame(), pd.DataFrame()

def get_user_info():
    """Retorna o role e a UO do usuário logado."""
    user_email = get_user_email()
    if not user_email:
        return 'viewer', None # Padrão para não logado

    permissions_df, _ = get_matrix_data()
    if permissions_df.empty:
        return 'viewer', None

    user_entry = permissions_df[permissions_df['email'] == user_email]
    
    if not user_entry.empty:
        user_data = user_entry.iloc[0]
        return user_data.get('role', 'viewer'), user_data.get('unidade_operacional', None)
    
    return 'viewer', None

def initialize_unit_session(selected_unit_name):
    """
    Com base no nome da UO, encontra os IDs e os salva na sessão.
    Retorna True se bem-sucedido, False caso contrário.
    """
    _, units_df = get_matrix_data()
    if units_df.empty:
        st.error("Nenhuma Unidade Operacional está cadastrada no sistema.")
        return False
        
    unit_config = units_df[units_df['nome_unidade'] == selected_unit_name]
    
    if not unit_config.empty:
        st.session_state['current_unit_name'] = selected_unit_name
        st.session_state['current_spreadsheet_id'] = unit_config.iloc[0]['spreadsheet_id']
        st.session_state['current_folder_id'] = unit_config.iloc[0]['folder_id']
        return True
    else:
        st.error(f"Configuração para a Unidade Operacional '{selected_unit_name}' não encontrada.")
        return False

# --- Funções de verificação de permissão (agora sem @st.cache_data) ---
def get_user_role():
    return get_user_info()[0]

def is_admin():
    return get_user_role() == 'admin'

def can_edit():
    return get_user_role() in ['admin', 'editor']

def can_view():
    return get_user_role() in ['admin', 'editor', 'viewer']

def on_unit_change():
    """Callback para limpar o cache quando a UO é alterada."""
    st.cache_data.clear()

def setup_sidebar():
    """
    Configura a barra lateral, incluindo o seletor de UO para admins e o botão de logout.
    Retorna True se uma UO está selecionada e pronta para uso, False caso contrário.
    """
    from .login_page import show_logout_button
    if is_user_logged_in():
        show_logout_button() # <-- Botão de logout movido para cá

    role, assigned_unit = get_user_info()
    
    selected_unit = None
    if role == 'admin' and assigned_unit == '*':
        _, units_df = get_matrix_data()
        unit_options = ["Selecione uma UO..."] + units_df['nome_unidade'].tolist()
        
        current_selection = st.session_state.get('current_unit_name', "Selecione uma UO...")
        selected_index = unit_options.index(current_selection) if current_selection in unit_options else 0

        selected_unit = st.sidebar.selectbox(
            "Selecionar Unidade Operacional:", 
            unit_options, 
            index=selected_index,
            key='unit_selector'
        )
    else:
        selected_unit = assigned_unit

    if selected_unit and selected_unit != "Selecione uma UO...":
        # Limpa o cache se a UO mudou
        if st.session_state.get('current_unit_name') != selected_unit:
            st.cache_data.clear()

        if initialize_unit_session(selected_unit):
            st.sidebar.success(f"Visão da UO: **{selected_unit}**")
            return True
        else:
            return False
    
    return False

def save_access_request(user_name, user_email, requested_unit, justification):
    """Salva uma nova solicitação de acesso na Planilha Matriz."""
    try:
        # Pega o timestamp atual formatado para São Paulo
        sao_paulo_tz = pytz.timezone("America/Sao_Paulo")
        timestamp = datetime.now(sao_paulo_tz).strftime('%Y-%m-%d %H:%M:%S')

        # Monta a linha de dados para o log
        request_row = [
            timestamp,
            user_name,
            user_email,
            requested_unit,
            justification,
            "Pendente"  # Status inicial
        ]
        
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        
        # Verifica se já existe uma solicitação pendente para este usuário
        requests_data = matrix_uploader.get_data_from_sheet(ACCESS_REQUESTS_SHEET_NAME)
        if requests_data and len(requests_data) > 1:
            df_requests = pd.DataFrame(requests_data[1:], columns=requests_data[0])
            existing_request = df_requests[
                (df_requests['email_usuario'] == user_email) & 
                (df_requests['status'] == 'Pendente')
            ]
            if not existing_request.empty:
                st.warning("Você já possui uma solicitação de acesso pendente. Por favor, aguarde a aprovação do administrador.")
                return False

        matrix_uploader.append_data_to_sheet(ACCESS_REQUESTS_SHEET_NAME, [request_row])
        return True
    except Exception as e:
        st.error(f"Ocorreu um erro ao enviar sua solicitação: {e}")
        return False
