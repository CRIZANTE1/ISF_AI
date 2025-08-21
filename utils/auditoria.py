# FILE: utils/auditoria.py

import streamlit as st
from datetime import datetime
import pytz
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import AUDIT_LOG_SHEET_NAME
from auth.auth_utils import get_user_email, get_user_role

def _get_sao_paulo_time_str():
    """Retorna o timestamp atual formatado para São Paulo."""
    sao_paulo_tz = pytz.timezone("America/Sao_Paulo")
    return datetime.now(sao_paulo_tz).strftime('%Y-%m-%d %H:%M:%S')

def log_action(action: str, details: str = "", target_uo: str = None):
    """
    Registra uma ação de usuário no log de auditoria global.

    Args:
        action (str): Um identificador curto para a ação (ex: "LOGIN_SUCCESS").
        details (str, optional): Detalhes adicionais sobre a ação.
        target_uo (str, optional): A UO na qual a ação foi realizada. Se não fornecida,
                                   tenta pegar da session_state.
    """
    try:
        # Pega os dados do usuário e da sessão
        user_email = get_user_email() or "não logado"
        user_role = get_user_role()
        timestamp = _get_sao_paulo_time_str()
        
        # Se a UO não for passada como argumento, tenta pegá-la da sessão
        if target_uo is None:
            target_uo = st.session_state.get('current_unit_name', 'N/A')

        # Monta a linha de dados para o log
        log_row = [
            timestamp,
            user_email,
            user_role,
            action,
            details,
            target_uo
        ]

        # Usa o uploader no modo 'matrix' para escrever na planilha global
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        matrix_uploader.append_data_to_sheet(AUDIT_LOG_SHEET_NAME, log_row)

    except Exception as e:
        # Em caso de falha no log, apenas exibe um aviso no console/log do Streamlit
        # para não quebrar a aplicação principal.
        print(f"ALERTA: Falha ao registrar a ação de auditoria. Erro: {e}")
