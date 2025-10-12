# auth/auth_utils.py (REFATORADO)

import streamlit as st
import pandas as pd
from datetime import date, datetime, timedelta
import pytz

# DE: from gdrive.gdrive_upload import GoogleDriveUploader
# DE: from gdrive.config import USERS_SHEET_NAME, ACCESS_REQUESTS_SHEET_NAME
# PARA: Importações refatoradas
from operations.history import load_sheet_data # Usamos a função genérica que agora usa Supabase
from supabase.client import get_supabase_client
from utils.github_notifications import notify_new_access_request

# ... (as funções is_oidc_available, is_user_logged_in, is_superuser, etc. permanecem as mesmas) ...
def is_oidc_available():
    try: return hasattr(st.user, 'is_logged_in')
    except Exception: return False

def is_user_logged_in():
    try: return st.user.is_logged_in
    except Exception: return False

def is_superuser() -> bool:
    try:
        user_email = get_user_email()
        superuser_email = st.secrets["superuser"]["admin_email"].lower().strip()
        return user_email is not None and user_email == superuser_email
    except (KeyError, AttributeError):
        return False

def get_user_display_name():
    try:
        if is_superuser(): return "Desenvolvedor (Mestre)"
        if hasattr(st.user, 'name') and st.user.name: return st.user.name
        elif hasattr(st.user, 'email'): return st.user.email
        return "Usuário Anônimo"
    except Exception: return "Usuário Anônimo"

def get_user_email() -> str | None:
    try:
        if hasattr(st.user, 'email') and st.user.email: return st.user.email.lower().strip()
        return None
    except Exception: return None

@st.cache_data(ttl=300, show_spinner="Verificando permissões...")
def get_users_data():
    """
    Carrega dados de usuários com tratamento robusto de erros, agora do Supabase.
    """
    try:
        # PARA: A lógica complexa de leitura e normalização foi substituída por uma única chamada.
        df = load_sheet_data("usuarios")
        
        if not df.empty:
            # Converte colunas de data que vêm como string do Supabase
            if 'data_cadastro' in df.columns:
                df['data_cadastro'] = pd.to_datetime(df['data_cadastro'], errors='coerce').dt.date
            if 'trial_end_date' in df.columns:
                df['trial_end_date'] = pd.to_datetime(df['trial_end_date'], errors='coerce').dt.date
        
        return df
        
    except Exception as e:
        st.error(f"Erro crítico ao carregar dados de usuários: {e}")
        return pd.DataFrame()

# ... (a função get_user_info e as demais funções que dependem de get_users_data não precisam de mudanças) ...
def get_user_info() -> dict | None:
    """
    Retorna o registro do usuário. Se for o superusuário, "fabrica" o registro
    usando os dados dos segredos, incluindo o ambiente de testes.
    """
    if is_superuser():
        # "Fabrica" um registro de usuário mestre, agora incluindo o ambiente de testes dos segredos.
        return {
            'email': get_user_email(),
            'nome': 'Desenvolvedor (Mestre)',
            'role': 'admin',
            'plano': 'premium_ia',
            'status': 'ativo',
            'spreadsheet_id': st.secrets["superuser"].get("spreadsheet_id"),
            'folder_id': st.secrets["superuser"].get("folder_id"),
            'data_cadastro': date.today().isoformat(),
            'trial_end_date': None
        }

    # Se não for o superusuário, executa a lógica normal.
    user_email = get_user_email()
    if not user_email: return None
    users_df = get_users_data()
    if users_df.empty: return None
    
    user_entry = users_df[users_df['email'] == user_email]
    return user_entry.iloc[0].to_dict() if not user_entry.empty else None

def save_access_request(user_name, user_email, justification):
    """Salva uma solicitação de acesso na tabela 'solicitacoes_acesso' do Supabase."""
    try:
        sao_paulo_tz = pytz.timezone("America/Sao_Paulo")
        timestamp = datetime.now(sao_paulo_tz).strftime('%Y-%m-%d %H:%M:%S')
        
        # PARA: Usa o cliente Supabase e um dicionário
        db_client = get_supabase_client()
        
        # Verifica se já existe solicitação pendente
        df_requests = db_client.get_data("solicitacoes_acesso")
        if not df_requests.empty:
            if not df_requests[(df_requests['email_usuario'] == user_email) & (df_requests['status'] == 'Pendente')].empty:
                st.warning("Você já possui uma solicitação de acesso pendente.")
                return False
        
        # PARA: Cria um dicionário em vez de uma lista
        request_record = {
            "timestamp_solicitacao": timestamp,
            "nome_usuario": user_name,
            "email_usuario": user_email,
            "tipo_solicitacao": "Solicitação de Trial",
            "justificativa": justification,
            "status": "Pendente"
        }
        
        # PARA: Usa o método append_data
        db_client.append_data("solicitacoes_acesso", request_record)
        
        # A lógica de notificação permanece a mesma
        try:
            admin_email = st.secrets.get("superuser", {}).get("admin_email")
            if admin_email:
                notify_new_access_request(
                    admin_email=admin_email,
                    user_email=user_email,
                    user_name=user_name,
                    justification=justification or "Nenhuma justificativa fornecida"
                )
                st.info(" O administrador foi notificado sobre sua solicitação.")
        except Exception as notification_error:
            print(f"Aviso: Falha ao enviar notificação para admin: {notification_error}")
        
        return True
        
    except Exception as e:
        st.error(f"Ocorreu um erro ao enviar sua solicitação: {e}")
        return False
        
# --- NOVAS FUNÇÕES RÁPIDAS ---
def get_current_user_info() -> dict | None:
    """Retorna os dados do usuário logado diretamente da sessão. É super rápido."""
    return st.session_state.get('user_data')

def get_current_user_role() -> str:
    """Retorna o 'role' do usuário da sessão."""
    user_data = get_current_user_info()
    return user_data.get('role', 'viewer') if user_data else 'viewer'
# --- FIM DAS NOVAS FUNÇÕES ---

def get_effective_user_status() -> str:
    user_info = get_current_user_info()  # <-- MUDANÇA AQUI
    if not user_info:
        return 'inativo'
    sheet_status = user_info.get('status', 'inativo')
    trial_end_date = user_info.get('trial_end_date')
    if sheet_status != 'ativo':
        return sheet_status
    if not pd.isna(trial_end_date) and isinstance(trial_end_date, date) and date.today() > trial_end_date:
        return 'trial_expirado'
    return sheet_status

def is_on_trial() -> bool:
    user_info = get_current_user_info()  # <-- MUDANÇA AQUI
    if not user_info:
        return False
    trial_end_date = user_info.get('trial_end_date')
    if pd.isna(trial_end_date):
        return False
    return date.today() <= trial_end_date

def get_effective_user_plan() -> str:
    user_info = get_current_user_info()  # <-- MUDANÇA AQUI
    if not user_info:
        return 'nenhum'
    sheet_plan = user_info.get('plano', 'nenhum')
    if is_on_trial():
        return 'premium_ia'
    return sheet_plan

def get_user_role():
    """Retorna o role do usuário logado - agora ultra rápido!"""
    return get_current_user_role()  # <-- MUDANÇA AQUI

def check_user_access(required_role="viewer"):
    """
    Checks if the current user has the required role or higher.
    Returns True if authorized, False otherwise.
    
    Roles hierarchy (highest to lowest):
    - superuser (special role)
    - admin
    - editor
    - viewer
    
    Usage:
        if not check_user_access("editor"):
            st.warning("You need editor permissions or higher.")
            return
    """
    role_hierarchy = {"viewer": 1, "editor": 2, "admin": 3}
    user_role = get_user_role()
    
    # Superuser always has access
    if is_superuser():
        return True
        
    # If required_role isn't in the hierarchy, default to viewer
    required_level = role_hierarchy.get(required_role, 1)
    user_level = role_hierarchy.get(user_role, 0)
    
    return user_level >= required_level

def can_edit(): return check_user_access("editor")
def can_view(): return check_user_access("viewer") 
def is_admin(): return check_user_access("admin")
def has_pro_features(): return get_effective_user_plan() in ['pro', 'premium_ia']
def has_ai_features(): return get_effective_user_plan() == 'premium_ia'

def setup_sidebar():
    user_info = get_current_user_info()  # <-- MUDANÇA AQUI: usa a função rápida
    effective_status = get_effective_user_status()
    
    if effective_status != 'ativo':
        if is_admin():
            st.sidebar.warning("Visão de Administrador.")
            return False
        if effective_status == 'inativo':
            st.sidebar.error("Sua conta não está ativa.")
            return False
        return False
    
    spreadsheet_id = user_info.get('spreadsheet_id')
    folder_id = user_info.get('folder_id')
    
    if pd.isna(spreadsheet_id) or spreadsheet_id == '' or pd.isna(folder_id) or folder_id == '':
        if not is_superuser():
            st.sidebar.error("Erro no ambiente de dados. Contate o suporte.")
        return False
    
    # Limpa cache se o usuário mudou
    if st.session_state.get('current_user_email') != user_info['email']:
        st.cache_data.clear()
    
    st.session_state['current_user_email'] = user_info['email']
    st.session_state['current_spreadsheet_id'] = spreadsheet_id
    st.session_state['current_folder_id'] = folder_id
    
    if is_superuser():
        st.sidebar.success("👑 **Acesso Mestre**")
    elif is_on_trial():
        trial_end = user_info.get('trial_end_date', date.today())
        days_left = (trial_end - date.today()).days
        st.sidebar.info(f"🚀 **Trial Premium:** {days_left} dias restantes.")
    else:
        plano_atual = get_effective_user_plan().replace('_', ' ').title()
        st.sidebar.success(f"**Plano:** {plano_atual}")
    
    return True
    

# Função de diagnóstico para ajudar a identificar problemas
def diagnose_users_sheet():
    """
    Função de diagnóstico para identificar problemas na planilha de usuários
    """
    try:
        uploader = GoogleDriveUploader(is_matrix=True)
        users_data = uploader.get_data_from_sheet(USERS_SHEET_NAME)
        
        st.write("### 🔍 Diagnóstico da Planilha de Usuários")
        
        if not users_data:
            st.error("❌ Planilha não encontrada ou completamente vazia")
            return
            
        st.success(f"✅ Planilha encontrada com {len(users_data)} linhas")
        
        if len(users_data) >= 1:
            st.write(f"**Cabeçalho ({len(users_data[0])} colunas):**")
            st.write(users_data[0])
            
        if len(users_data) >= 2:
            st.write("**Primeiras linhas de dados:**")
            for i, row in enumerate(users_data[1:6]):  # Mostra até 5 linhas
                st.write(f"Linha {i+2}: {row} ({len(row)} colunas)")
                
        # Identifica linhas vazias
        empty_rows = []
        for i, row in enumerate(users_data[1:], 2):
            if not any(str(cell).strip() for cell in row):
                empty_rows.append(i)
                
        if empty_rows:
            st.warning(f"⚠️ Linhas vazias encontradas: {empty_rows}")
        else:
            st.success("✅ Nenhuma linha vazia encontrada")
            
    except Exception as e:
        st.error(f"❌ Erro durante diagnóstico: {e}")