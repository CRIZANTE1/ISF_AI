import streamlit as st
import pandas as pd
from datetime import date, datetime, timedelta
import pytz

from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import USERS_SHEET_NAME, ACCESS_REQUESTS_SHEET_NAME

# ==============================================================================
# SEÇÃO 1: FUNÇÕES BÁSICAS DE LOGIN E INFORMAÇÕES DO USUÁRIO
# ==============================================================================
def is_oidc_available():
    """Verifica se o componente de autenticação do Streamlit (st.user) está disponível."""
    try:
        return hasattr(st.user, 'is_logged_in')
    except Exception:
        return False

def is_user_logged_in():
    """Verifica se o usuário está atualmente logado via OIDC."""
    try:
        return st.user.is_logged_in
    except Exception:
        return False

def get_user_display_name():
    """Retorna o nome de exibição do usuário, com um nome especial para o superuser."""
    try:
        if _is_superuser():
            return "Desenvolvedor (Mestre)"
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

# ==============================================================================
# SEÇÃO 2: LÓGICA DO SUPERUSUÁRIO (ACESSO MESTRE)
# ==============================================================================
def _is_superuser() -> bool:
    """
    Verifica se o email do usuário logado corresponde ao admin_email nos segredos.
    Este é o mecanismo de acesso mestre.
    """
    try:
        user_email = get_user_email()
        superuser_email = st.secrets["superuser"]["admin_email"].lower().strip()
        return user_email is not None and user_email == superuser_email
    except (KeyError, AttributeError):
        # Se a seção [superuser] não existir nos segredos, a funcionalidade é ignorada com segurança.
        return False

# ==============================================================================
# SEÇÃO 3: ACESSO AOS DADOS DA PLANILHA MATRIZ
# ==============================================================================
@st.cache_data(ttl=600, show_spinner="Verificando permissões de usuário...")
def get_users_data():
    """Busca os dados de usuários da Planilha Matriz e os armazena em cache."""
    try:
        uploader = GoogleDriveUploader(is_matrix=True)
        users_data = uploader.get_data_from_sheet(USERS_SHEET_NAME)
        if not users_data or len(users_data) < 2: return pd.DataFrame()
        
        df = pd.DataFrame(users_data[1:], columns=users_data[0])
        for col in ['email', 'role', 'plano', 'status']:
            if col in df.columns: df[col] = df[col].str.lower().str.strip()
        
        if 'trial_end_date' in df.columns:
            df['trial_end_date'] = pd.to_datetime(df['trial_end_date'], errors='coerce').dt.date
        else:
            df['trial_end_date'] = None
            
        return df
    except Exception as e:
        st.error(f"Erro crítico ao carregar dados de usuários: {e}"); return pd.DataFrame()

def get_user_info() -> dict | None:
    """
    Retorna o registro do usuário.
    PRIORIDADE 1: Se for o superusuário dos segredos, retorna um registro mestre.
    PRIORIDADE 2: Caso contrário, busca na Planilha Google.
    """
    if _is_superuser():
        # "Fabrica" um registro de usuário mestre com permissões máximas.
        # spreadsheet_id é None, pois o superuser não tem um ambiente de dados próprio.
        return {
            'email': get_user_email(),
            'nome': 'Desenvolvedor (Mestre)',
            'role': 'admin',
            'plano': 'premium_ia',
            'status': 'ativo',
            'spreadsheet_id': None,
            'folder_id': None,
            'data_cadastro': date.today().isoformat(),
            'trial_end_date': None
        }

    # Se não for o superusuário, executa a lógica normal de busca na planilha.
    user_email = get_user_email()
    if not user_email: return None
    users_df = get_users_data()
    if users_df.empty: return None
    user_entry = users_df[users_df['email'] == user_email]
    return user_entry.iloc[0].to_dict() if not user_entry.empty else None

# ==============================================================================
# SEÇÃO 4: LÓGICA DE NEGÓCIOS - PLANOS, STATUS E TRIAL
# ==============================================================================
def get_effective_user_status() -> str:
    """Calcula o status REAL do usuário, considerando a expiração do trial."""
    user_info = get_user_info()
    if not user_info: return 'inativo'
    
    sheet_status = user_info.get('status', 'inativo')
    trial_end_date = user_info.get('trial_end_date')

    if sheet_status != 'ativo': return sheet_status
    
    if not pd.isna(trial_end_date) and isinstance(trial_end_date, date):
        if date.today() > trial_end_date:
            return 'trial_expirado'
            
    return sheet_status

def is_on_trial() -> bool:
    """Verifica se o usuário está atualmente em um período de teste ativo."""
    user_info = get_user_info()
    if not user_info: return False
    
    trial_end_date = user_info.get('trial_end_date')
    if pd.isna(trial_end_date): return False

    return date.today() <= trial_end_date

def get_effective_user_plan() -> str:
    """Retorna o plano de funcionalidades do usuário, elevando para premium durante o trial."""
    user_info = get_user_info()
    if not user_info: return 'nenhum'
    sheet_plan = user_info.get('plano', 'nenhum')
    if is_on_trial(): return 'premium_ia'
    return sheet_plan

# ==============================================================================
# SEÇÃO 5: FUNÇÕES AUXILIARES DE PERMISSÃO
# ==============================================================================
def get_user_role():
    user_info = get_user_info()
    return user_info.get('role', 'viewer') if user_info else 'viewer'

def can_edit():
    return get_user_role() in ['admin', 'editor']

def can_view():
    return get_user_role() in ['admin', 'editor', 'viewer']

def is_admin():
    return get_user_role() == 'admin'

def has_pro_features():
    return get_effective_user_plan() in ['pro', 'premium_ia']

def has_ai_features():
    return get_effective_user_plan() == 'premium_ia'

# ==============================================================================
# SEÇÃO 6: SETUP DA SESSÃO E SIDEBAR
# ==============================================================================
def setup_sidebar():
    """Prepara a barra lateral e carrega o ambiente de dados do usuário na sessão."""
    user_info = get_user_info()
    effective_status = get_effective_user_status()

    if effective_status != 'ativo':
        if is_admin(): st.sidebar.warning("Visão de Administrador."); return False
        if effective_status == 'inativo': st.sidebar.error("Sua conta não está ativa."); return False
        return False

    spreadsheet_id = user_info.get('spreadsheet_id')
    folder_id = user_info.get('folder_id')

    if pd.isna(spreadsheet_id) or spreadsheet_id == '' or pd.isna(folder_id) or folder_id == '':
        if not _is_superuser(): # Não mostra erro para o superuser, pois é esperado
            st.sidebar.error("Erro no ambiente de dados. Contate o suporte.")
        return False

    if st.session_state.get('current_user_email') != user_info['email']:
        st.cache_data.clear()

    st.session_state['current_user_email'] = user_info['email']
    st.session_state['current_spreadsheet_id'] = spreadsheet_id
    st.session_state['current_folder_id'] = folder_id
    
    if _is_superuser():
        st.sidebar.success("👑 **Acesso Mestre**")
    elif is_on_trial():
        trial_end = user_info.get('trial_end_date', date.today())
        days_left = (trial_end - date.today()).days
        st.sidebar.info(f"🚀 **Trial Premium:** {days_left} dias restantes.")
    else:
        plano_atual = get_effective_user_plan().replace('_', ' ').title()
        st.sidebar.success(f"**Plano:** {plano_atual}")
        
    return True

# ==============================================================================
# SEÇÃO 7: SOLICITAÇÃO DE ACESSO
# ==============================================================================
def save_access_request(user_name, user_email, justification):
    try:
        sao_paulo_tz = pytz.timezone("America/Sao_Paulo")
        timestamp = datetime.now(sao_paulo_tz).strftime('%Y-m-%d %H:%M:%S')
        request_row = [timestamp, user_name, user_email, "Solicitação de Trial", justification, "Pendente"]
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        requests_data = matrix_uploader.get_data_from_sheet(ACCESS_REQUESTS_SHEET_NAME)
        if requests_data and len(requests_data) > 1:
            df_requests = pd.DataFrame(requests_data[1:], columns=requests_data[0])
            if not df_requests[(df_requests['email_usuario'] == user_email) & (df_requests['status'] == 'Pendente')].empty:
                st.warning("Você já possui uma solicitação de acesso pendente."); return False
        matrix_uploader.append_data_to_sheet(ACCESS_REQUESTS_SHEET_NAME, [request_row])
        return True
    except Exception as e:
        st.error(f"Ocorreu um erro ao enviar sua solicitação: {e}"); return False
