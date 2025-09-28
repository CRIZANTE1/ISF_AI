import requests
import streamlit as st
import logging
from datetime import datetime
from gdrive.gdrive_upload import GoogleDriveUploader

logger = logging.getLogger(__name__)

class GitHubNotificationHandler:
    """Classe para gerenciar planilha de notificações (processadas automaticamente pelo GitHub Actions)"""
    
    def __init__(self):
        pass
    
    def queue_notification(self, notification_type: str, recipient_email: str, 
                          recipient_name: str, **kwargs):
        """
        Adiciona uma notificação à planilha de notificações pendentes
        O GitHub Actions processa automaticamente a cada 5 minutos
        
        Args:
            notification_type: Tipo da notificação (access_approved, access_denied, etc.)
            recipient_email: Email do destinatário
            recipient_name: Nome do destinatário
            **kwargs: Dados adicionais específicos do tipo de notificação
        """
        try:
            from utils.auditoria import get_sao_paulo_time_str
            import json
            
            # Prepara dados JSON para a coluna de dados
            notification_data = {
                'login_url': kwargs.get('login_url', 'https://sua-app.streamlit.app'),
                'trial_days': str(kwargs.get('trial_days', '14')),
                'reason': kwargs.get('reason', ''),
                'days_left': str(kwargs.get('days_left', '3')),
                'plan_name': kwargs.get('plan_name', ''),
                **kwargs  # Outros dados adicionais
            }
            
            # Linha para adicionar na planilha
            notification_row = [
                datetime.now().strftime('%Y-%m-%d %H:%M:%S'),  # timestamp
                notification_type,                             # tipo_notificacao
                recipient_email,                               # email_destinatario
                recipient_name,                               # nome_destinatario
                json.dumps(notification_data, ensure_ascii=False),  # dados_json
                'pendente'                                    # status
            ]
            
            # Adiciona à planilha matriz
            matrix_uploader = GoogleDriveUploader(is_matrix=True)
            matrix_uploader.append_data_to_sheet('notificacoes_pendentes', [notification_row])
            
            logger.info(f"Notificação '{notification_type}' adicionada à fila para {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao adicionar notificação à fila: {e}")
            return False
    
    def trigger_notification_workflow(self, notification_type: str, recipient_email: str, 
                                    recipient_name: str, **kwargs):
        """
        Adiciona notificação à fila de processamento
        O GitHub Actions executa automaticamente a cada 5 minutos via cron
        
        Args:
            notification_type: Tipo da notificação (access_approved, access_denied, etc.)
            recipient_email: Email do destinatário
            recipient_name: Nome do destinatário
            **kwargs: Dados adicionais específicos do tipo de notificação
        """
        
        # Adiciona à planilha de notificações pendentes
        success = self.queue_notification(
            notification_type, recipient_email, recipient_name, **kwargs
        )
        
        if success:
            logger.info(f"Notificação '{notification_type}' adicionada à fila para processamento automático")
        else:
            logger.error(f"Falha ao adicionar notificação à fila para {recipient_email}")
        
        return success

# Instância global
_notification_handler = None

def get_notification_handler():
    """Singleton para o handler de notificações"""
    global _notification_handler
    if _notification_handler is None:
        _notification_handler = GitHubNotificationHandler()
    return _notification_handler

# Funções de conveniência para diferentes tipos de notificação
def notify_access_approved(user_email: str, user_name: str, trial_days: int = 14):
    """Adiciona notificação de aprovação de acesso à fila de processamento"""
    handler = get_notification_handler()
    return handler.trigger_notification_workflow(
        notification_type="access_approved",
        recipient_email=user_email,
        recipient_name=user_name,
        trial_days=trial_days,
        login_url=st.secrets.get("app", {}).get("url", "https://sua-app.streamlit.app")
    )

def notify_access_denied(user_email: str, user_name: str, reason: str = ""):
    """Adiciona notificação de negação de acesso à fila de processamento"""
    handler = get_notification_handler()
    return handler.trigger_notification_workflow(
        notification_type="access_denied", 
        recipient_email=user_email,
        recipient_name=user_name,
        reason=reason
    )

def notify_trial_expiring(user_email: str, user_name: str, days_left: int):
    """Adiciona notificação de trial expirando à fila de processamento"""
    handler = get_notification_handler()
    return handler.trigger_notification_workflow(
        notification_type="trial_expiring",
        recipient_email=user_email,
        recipient_name=user_name,
        days_left=days_left,
        login_url=st.secrets.get("app", {}).get("url", "https://sua-app.streamlit.app")
    )

def notify_payment_confirmed(user_email: str, user_name: str, plan_name: str):
    """Adiciona notificação de confirmação de pagamento à fila de processamento"""
    handler = get_notification_handler()
    return handler.trigger_notification_workflow(
        notification_type="payment_confirmed",
        recipient_email=user_email,
        recipient_name=user_name,
        plan_name=plan_name,
        login_url=st.secrets.get("app", {}).get("url", "https://sua-app.streamlit.app")
    )

def notify_new_access_request(admin_email: str, user_email: str, user_name: str, justification: str = ""):
    """Notifica admin sobre nova solicitação de acesso"""
    handler = get_notification_handler()
    return handler.trigger_notification_workflow(
        notification_type="new_access_request",
        recipient_email=admin_email,
        recipient_name="Administrador",
        requesting_user_email=user_email,
        requesting_user_name=user_name,
        justification=justification,
        admin_panel_url=st.secrets.get("app", {}).get("url", "https://sua-app.streamlit.app")
    )

def send_trial_expiration_notifications():
    """
    Função para verificar usuários com trial expirando e enviar notificações
    Pode ser chamada por um cron job ou scheduler
    """
    try:
        from auth.auth_utils import get_users_data
        from datetime import date, timedelta
        import pandas as pd
        
        users_df = get_users_data()
        if users_df.empty:
            return
        
        # Filtra usuários com trial
        trial_users = users_df[
            (users_df['status'] == 'ativo') & 
            (users_df['trial_end_date'].notna())
        ].copy()
        
        if trial_users.empty:
            return
        
        # Converte trial_end_date para datetime se necessário
        trial_users['trial_end_date'] = pd.to_datetime(trial_users['trial_end_date']).dt.date
        
        today = date.today()
        
        # Notifica usuários com trial expirando em 3 dias
        expiring_soon = trial_users[
            trial_users['trial_end_date'] == (today + timedelta(days=3))
        ]
        
        for _, user in expiring_soon.iterrows():
            notify_trial_expiring(
                user_email=user['email'],
                user_name=user['nome'],
                days_left=3
            )
            logger.info(f"Notificação de trial expirando enviada para {user['email']}")
        
        # Notifica usuários com trial expirando em 1 dia
        expiring_tomorrow = trial_users[
            trial_users['trial_end_date'] == (today + timedelta(days=1))
        ]
        
        for _, user in expiring_tomorrow.iterrows():
            notify_trial_expiring(
                user_email=user['email'],
                user_name=user['nome'],
                days_left=1
            )
            logger.info(f"Notificação de trial expirando (1 dia) enviada para {user['email']}")
            
    except Exception as e:
        logger.error(f"Erro ao enviar notificações de trial: {e}")

def create_notifications_sheet_if_not_exists():
    """
    Cria a aba de notificações pendentes se ela não existir
    """
    try:
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        
        # Testa se a aba existe
        try:
            matrix_uploader.get_data_from_sheet('notificacoes_pendentes')
            return True  # Aba já existe
        except:
            pass  # Aba não existe, vamos criar
        
        # Cabeçalhos da aba de notificações
        headers = [
            'timestamp',
            'tipo_notificacao', 
            'email_destinatario',
            'nome_destinatario',
            'dados_json',
            'status'
        ]
        
        # Cria a aba
        spreadsheet_id = matrix_uploader.spreadsheet_id
        request_body = {
            'requests': [{
                'addSheet': {
                    'properties': {
                        'title': 'notificacoes_pendentes'
                    }
                }
            }]
        }
        
        matrix_uploader.sheets_service.spreadsheets().batchUpdate(
            spreadsheetId=spreadsheet_id,
            body=request_body
        ).execute()
        
        # Adiciona cabeçalhos
        matrix_uploader.append_data_to_sheet('notificacoes_pendentes', [headers])
        
        logger.info("Aba 'notificacoes_pendentes' criada com sucesso")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao criar aba de notificações: {e}")
        return False
