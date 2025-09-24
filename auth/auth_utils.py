import streamlit as st
import pandas as pd
from datetime import date, datetime, timedelta
import pytz

from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import USERS_SHEET_NAME, ACCESS_REQUESTS_SHEET_NAME


def is_user_logged_in():
    """Verifica se o usuário está atualmente logado via OIDC."""
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
    """Retorna o e-mail do usuário logado, normalizado para minúsculas."""
    try:
        if hasattr(st.user, 'email') and st.user.email:
            return st.user.email.lower().strip()
        return None
    except Exception:
        return None



@st.cache_data(ttl=600, show_spinner="Verificando permissões de usuário...")
def get_users_data():
    """
    Busca os dados da aba 'usuarios' da Planilha Matriz e os armazena em cache.
    Converte a coluna de data do trial para um formato de data utilizável.
    """
    try:
        uploader = GoogleDriveUploader(is_matrix=True)
        users_data = uploader.get_data_from_sheet(USERS_SHEET_NAME)
        
        if not users_data or len(users_data) < 2:
            return pd.DataFrame()

        df = pd.DataFrame(users_data[1:], columns=users_data[0])
        # Normaliza colunas de texto para consistência
        for col in ['email', 'role', 'plano', 'status']:
            if col in df.columns:
                df[col] = df[col].str.lower().str.strip()
        
        # Processa a data de expiração do trial
        if 'trial_end_date' in df.columns:
            df['trial_end_date'] = pd.to_datetime(df['trial_end_date'], errors='coerce').dt.date
        else:
            df['trial_end_date'] = None # Garante que a coluna exista
            
        return df
    except Exception as e:
        st.error(f"Erro crítico ao carregar dados de usuários: {e}")
        return pd.DataFrame()

def get_user_info() -> dict | None:
    """Retorna o registro completo (como um dicionário) do usuário logado."""
    user_email = get_user_email()
    if not user_email: return None
    
    users_df = get_users_data()
    if users_df.empty: return None

    user_entry = users_df[users_df['email'] == user_email]
    return user_entry.iloc[0].to_dict() if not user_entry.empty else None



def get_effective_user_status() -> str:
    """
    Calcula o status REAL do usuário, considerando a expiração do trial.
    Retorna: 'ativo', 'inativo', 'trial_expirado', 'cancelado', 'pendente'.
    """
    user_info = get_user_info()
    if not user_info: return 'inativo'

    sheet_status = user_info.get('status', 'inativo')
    trial_end_date = user_info.get('trial_end_date')

    # Se a conta não está 'ativa' na planilha, essa é a prioridade máxima.
    if sheet_status != 'ativo':
        return sheet_status

    # Se a conta está 'ativa', mas o período de teste terminou, o status efetivo muda.
    if trial_end_date and isinstance(trial_end_date, date):
        if date.today() > trial_end_date:
            return 'trial_expirado'

    # Se nada disso se aplica, o status da planilha é o que vale.
    return sheet_status

def get_effective_user_plan() -> str:
    """
    Retorna o plano de funcionalidades do usuário. Se estiver em trial,
    eleva o plano para 'premium_ia' temporariamente.
    """
    user_info = get_user_info()
    if not user_info: return 'nenhum'

    sheet_plan = user_info.get('plano', 'nenhum')
    
    # Se o usuário está em um trial ativo, ele tem acesso ao melhor plano.
    if is_on_trial():
        return 'premium_ia'

    return sheet_plan

def is_on_trial() -> bool:
    """Verifica se o usuário está atualmente em um período de teste ativo."""
    user_info = get_user_info()
    if not user_info: return False
    
    trial_end_date = user_info.get('trial_end_date')
    return trial_end_date and isinstance(trial_end_date, date) and date.today() <= trial_end_date


def get_user_role():
    user_info = get_user_info()
    return user_info.get('role', 'viewer') if user_info else 'viewer'

def is_admin(): return get_user_role() == 'admin'
def has_pro_features(): return get_effective_user_plan() in ['pro', 'premium_ia']
def has_ai_features(): return get_effective_user_plan() == 'premium_ia'


def setup_sidebar():
    """
    Prepara a barra lateral, verifica o status efetivo do usuário e carrega seu
    ambiente de dados na sessão do Streamlit.
    """
    from .login_page import show_logout_button
    show_logout_button()

    user_info = get_user_info()
    effective_status = get_effective_user_status()

    # Bloqueia o carregamento do ambiente se o status efetivo não for 'ativo'.
    if effective_status != 'ativo':
        if is_admin(): st.sidebar.warning("Visão de Administrador."); return False
        if effective_status == 'inativo': st.sidebar.error("Sua conta não está ativa."); return False
        # O caso 'trial_expirado' será tratado na Pagina Inicial.py
        return False

    spreadsheet_id = user_info.get('spreadsheet_id')
    folder_id = user_info.get('folder_id')
    if pd.isna(spreadsheet_id) or spreadsheet_id == '' or pd.isna(folder_id) or folder_id == '':
        st.sidebar.error("Erro no ambiente de dados. Contate o suporte."); return False

    if st.session_state.get('current_user_email') != user_info['email']:
        st.cache_data.clear()

    # Armazena os IDs na sessão para uso global pelo app
    st.session_state['current_user_email'] = user_info['email']
    st.session_state['current_spreadsheet_id'] = spreadsheet_id
    st.session_state['current_folder_id'] = folder_id
    
    # Exibe a mensagem de status/plano na sidebar
    if is_on_trial():
        trial_end = user_info.get('trial_end_date', date.today())
        days_left = (trial_end - date.today()).days
        st.sidebar.info(f"🚀 **Trial Premium:** {days_left} dias restantes.")
    else:
        plano_atual = get_effective_user_plan().replace('_', ' ').title()
        st.sidebar.success(f"**Plano:** {plano_atual}")
        
    return True


def save_access_request(user_name, user_email, justification):
    """Salva uma nova solicitação de acesso na Planilha Matriz."""
    try:
        sao_paulo_tz = pytz.timezone("America/Sao_Paulo")
        timestamp = datetime.now(sao_paulo_tz).strftime('%Y-%m-%d %H:%M:%S')

        request_row = [timestamp, user_name, user_email, "Solicitação de Trial", justification, "Pendente"]
        
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        
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
