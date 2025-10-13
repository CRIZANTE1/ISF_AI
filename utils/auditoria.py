# utils/auditoria.py (REFATORADO)

import streamlit as st
from datetime import datetime
import pytz
import logging

# DE: from gdrive.gdrive_upload import GoogleDriveUploader
# DE: from gdrive.config import AUDIT_LOG_SHEET_NAME
# PARA:
from database.supabase_client import get_supabase_client
from auth.auth_utils import get_user_email, get_user_role

logger = logging.getLogger(__name__)


def get_sao_paulo_time_str():
    """Retorna o timestamp atual formatado para São Paulo."""
    sao_paulo_tz = pytz.timezone("America/Sao_Paulo")
    return datetime.now(sao_paulo_tz).strftime('%Y-%m-%d %H:%M:%S')


def log_action(action: str, details: str = "", target_uo: str = None):
    """
    Registra uma ação de usuário no log de auditoria do Supabase.
    """
    try:
        user_email = get_user_email() or "não logado"
        user_role = get_user_role()
        # PARA: Envia o objeto datetime completo para o Supabase, que gerenciará o fuso horário
        timestamp = datetime.now(pytz.timezone(
            "America/Sao_Paulo")).isoformat()

        if target_uo is None:
            target_uo = st.session_state.get('current_unit_name', 'N/A')

        # PARA: Monta um dicionário com os dados do log
        log_record = {
            "timestamp": timestamp,
            "user_email": user_email,
            "user_role": user_role,
            "action": action,
            "details": details,
            "target_uo": target_uo
        }

        # PARA: Usa o cliente Supabase para inserir o registro
        db_client = get_supabase_client()
        db_client.append_data("log_auditoria", log_record)

    except Exception as e:
        logger.error(
            f"ALERTA: Falha ao registrar a ação de auditoria no Supabase. Erro: {e}")
        # Evita que a aplicação quebre se o log falhar
        if st.secrets.get("debug_mode", False):
            st.toast(f"⚠️ Erro no log de auditoria: {e}", icon="")


def log_action_with_geo(action, details, latitude=None, longitude=None):
    """
    Versão estendida do log_action que inclui informação de geolocalização.
    (Sem mudanças na lógica interna)
    """
    geo_info = ""
    if latitude and longitude:
        geo_info = f" | GPS: {latitude:.6f},{longitude:.6f}"

    log_action(action, f"{details}{geo_info}")
