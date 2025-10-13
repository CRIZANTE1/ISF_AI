import streamlit as st
import logging
import json
from datetime import datetime, timedelta

# Importe o cliente Supabase refatorado
from database.supabase_client import get_supabase_client

logger = logging.getLogger(__name__)

# O nome da tabela de notificações, conforme usado pelos scripts do GitHub Actions
NOTIFICATIONS_TABLE_NAME = "notificacoes_pendentes"


class GitHubNotificationHandler:
    """Classe para gerenciar a fila de notificações no Supabase."""

    def __init__(self):
        """Inicializa o handler com um cliente Supabase."""
        self.db_client = get_supabase_client()

    def queue_notification(self, notification_type: str, recipient_email: str,
                           recipient_name: str, **kwargs):
        """
        Adiciona uma notificação à tabela de notificações pendentes no Supabase.
        O GitHub Actions processa a fila periodicamente.

        Args:
            notification_type: Tipo da notificação (access_approved, etc.)
            recipient_email: Email do destinatário.
            recipient_name: Nome do destinatário.
            **kwargs: Dados adicionais específicos do tipo de notificação.
        """
        try:
            # Prepara o payload de dados em formato JSON
            notification_data = {
                'login_url': kwargs.get('login_url', 'https://isnpecoessmaia.streamlit.app'),
                'trial_days': str(kwargs.get('trial_days', '14')),
                'reason': kwargs.get('reason', ''),
                'days_left': str(kwargs.get('days_left', '3')),
                'plan_name': kwargs.get('plan_name', ''),
                **kwargs  # Inclui quaisquer outros dados
            }

            # Cria o registro a ser inserido no Supabase
            notification_record = {
                "timestamp": datetime.now().isoformat(),
                "type": notification_type,
                "email": recipient_email,
                "name": recipient_name,
                # Garante que o JSON seja uma string válida
                "data": json.dumps(notification_data, ensure_ascii=False, default=str),
                "status": "pendente"
            }

            # Insere os dados na tabela de notificações do Supabase
            self.db_client.append_data(NOTIFICATIONS_TABLE_NAME, notification_record)

            logger.info(f"Notificação '{notification_type}' adicionada à fila para {recipient_email}")
            return True

        except Exception as e:
            logger.error(f"Erro ao adicionar notificação à fila no Supabase: {e}")
            st.error(f"Ocorreu um erro ao enfileirar a notificação: {e}")
            return False

# Funções de conveniência (não precisam de trigger_notification_workflow separado)

def notify_access_approved(user_email: str, user_name: str, trial_days: int = 14):
    """Enfileira notificação de aprovação de acesso."""
    handler = GitHubNotificationHandler()
    return handler.queue_notification(
        notification_type="access_approved",
        recipient_email=user_email,
        recipient_name=user_name,
        trial_days=trial_days,
        login_url=st.secrets.get("app", {}).get("url", "https://isnpecoessmaia.streamlit.app")
    )

def notify_access_denied(user_email: str, user_name: str, reason: str = ""):
    """Enfileira notificação de negação de acesso."""
    handler = GitHubNotificationHandler()
    return handler.queue_notification(
        notification_type="access_denied",
        recipient_email=user_email,
        recipient_name=user_name,
        reason=reason
    )

def notify_trial_expiring(user_email: str, user_name: str, days_left: int):
    """Enfileira notificação de trial expirando."""
    handler = GitHubNotificationHandler()
    return handler.queue_notification(
        notification_type="trial_expiring",
        recipient_email=user_email,
        recipient_name=user_name,
        days_left=days_left,
        login_url=st.secrets.get("app", {}).get("url", "https://isnpecoessmaia.streamlit.app")
    )

def notify_payment_confirmed(user_email: str, user_name: str, plan_name: str):
    """Enfileira notificação de confirmação de pagamento."""
    handler = GitHubNotificationHandler()
    return handler.queue_notification(
        notification_type="payment_confirmed",
        recipient_email=user_email,
        recipient_name=user_name,
        plan_name=plan_name,
        login_url=st.secrets.get("app", {}).get("url", "https://isnpecoessmaia.streamlit.app")
    )

def notify_new_access_request(admin_email: str, user_email: str, user_name: str, justification: str = ""):
    """Notifica admin sobre nova solicitação de acesso."""
    handler = GitHubNotificationHandler()
    return handler.queue_notification(
        notification_type="new_access_request",
        recipient_email=admin_email,
        recipient_name="Administrador",
        requesting_user_email=user_email,
        requesting_user_name=user_name,
        justification=justification,
        admin_panel_url=st.secrets.get("app", {}).get("url", "https://isnpecoessmaia.streamlit.app")
    )

def send_trial_expiration_notifications():
    """
    Verifica usuários com trial expirando e enfileira as notificações.
    Esta função pode ser chamada por um job agendado.
    """
    try:
        from auth.auth_utils import get_users_data
        import pandas as pd

        users_df = get_users_data()
        if users_df.empty:
            logger.info("Nenhum usuário encontrado para verificar expiração de trial.")
            return

        # Filtra usuários ativos com data de fim de trial
        trial_users = users_df[
            (users_df['status'] == 'ativo') &
            (users_df['trial_end_date'].notna())
        ].copy()

        if trial_users.empty:
            logger.info("Nenhum usuário em período de trial encontrado.")
            return

        trial_users['trial_end_date'] = pd.to_datetime(trial_users['trial_end_date']).dt.date
        today = datetime.today().date()

        # Notifica usuários cujo trial expira em 3 dias ou 1 dia
        for days_left in [3, 1]:
            expiring_date = today + timedelta(days=days_left)
            expiring_users = trial_users[trial_users['trial_end_date'] == expiring_date]

            for _, user in expiring_users.iterrows():
                logger.info(f"Enfileirando notificação de trial expirando em {days_left} dias para {user['email']}.")
                notify_trial_expiring(
                    user_email=user['email'],
                    user_name=user['nome'],
                    days_left=days_left
                )

    except Exception as e:
        logger.error(f"Erro ao processar notificações de expiração de trial: {e}", exc_info=True)