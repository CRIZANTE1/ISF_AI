import streamlit as st
import pandas as pd
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import ADMIN_SHEET_NAME, UNITS_SHEET_NAME

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
        permissions_df = pd.DataFrame(columns=['email', 'role', 'unidade_operacional'])
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
    Configura a barra lateral, incluindo o seletor de UO para admins.
    Retorna True se uma UO está selecionada e pronta para uso, False caso contrário.
    """
    from .login_page import show_logout_butto
    # Exibe o botão de logout em todas as páginas para usuários logados
    if is_user_logged_in():
        show_logout_button()

    role, assigned_unit = get_user_info()
    
    selected_unit = None
    # Lógica de seleção de UO para o Super Admin
    if role == 'admin' and assigned_unit == '*':
        _, units_df = get_matrix_data()
        unit_options = ["Selecione uma UO..."] + units_df['nome_unidade'].tolist()
        
        # Usa o session_state para lembrar a seleção entre as páginas
        current_selection = st.session_state.get('current_unit_name', "Selecione uma UO...")
        selected_index = unit_options.index(current_selection) if current_selection in unit_options else 0

        selected_unit = st.sidebar.selectbox(
            "Selecionar Unidade Operacional:", 
            unit_options, 
            index=selected_index,
            on_change=on_unit_change,
            key='unit_selector'
        )
    else:
        # Usuário normal tem uma UO fixa
        selected_unit = assigned_unit

    # Processa a seleção
    if selected_unit and selected_unit != "Selecione uma UO...":
        if initialize_unit_session(selected_unit):
            st.sidebar.success(f"Visão da UO: **{selected_unit}**")
            return True  # UO selecionada e inicializada com sucesso
        else:
            return False # Falha ao inicializar a UO
    
    # Se nenhuma UO foi selecionada
    return False
