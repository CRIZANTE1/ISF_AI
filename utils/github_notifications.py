import requests
import streamlit as st
import logging
from datetime import datetime
from gdrive.gdrive_upload import GoogleDriveUploader

logger = logging.getLogger(__name__)

class GitHubNotificationHandler:
    """Classe para disparar notificações via GitHub Actions e gerenciar planilha de notificações"""
    
    def __init__(self):
        try:
            self.github_token = st.secrets["github"]["token"]
            self.repo_owner = st.secrets["github"]["repo_owner"] 
            self.repo_name = st.secrets["github"]["repo_name"]
            self.workflow_id = st.secrets["github"]["workflow_id"] 
        except KeyError as e:
            logger.error(f"Configuração GitHub não encontrada: {e}")
            self.github_token = None
    
    def add_notification_to_queue(self, notification_type: str, recipient_email: str, 
                                recipient_name: str, **kwargs):
        """
        Adiciona uma notificação à planilha de notificações pendentes
        
        Args:
            notification_type: Tipo da notificação (access_approved, access_denied, etc.)
            recipient_email: Email do destinatário
            recipient_name: Nome do destinatário
            **kwargs: Dados adicionais específicos do tipo de notificação
        """
        try:
            from gdrive.config import get_sao_paulo_time_str
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
        Dispara o workflow do GitHub Actions para enviar notificação por email
        Primeiro adiciona à planilha, depois dispara o workflow
        
        Args:
            notification_type: Tipo da notificação (access_approved, access_denied, etc.)
            recipient_email: Email do destinatário
            recipient_name: Nome do destinatário
            **kwargs: Dados adicionais específicos do tipo de notificação
        """
        
        # Primeiro, adiciona à planilha de notificações pendentes
        queue_success = self.add_notification_to_queue(
            notification_type, recipient_email, recipient_name, **kwargs
        )
        
        if not queue_success:
            logger.warning("Falha ao adicionar à fila, mas continuando com o workflow")
        
        # Se não tem token GitHub, só adiciona à planilha (será processado depois)
        if not self.github_token:
            logger.warning("GitHub token não configurado, notificação adicionada à fila apenas")
            return queue_success
            
        try:
            # URL da API do GitHub para disparar workflow
            url = f"https://api.github.com/repos/{self.repo_owner}/{self.repo_name}/actions/workflows/{self.workflow_id}/dispatches"
            
            # Headers para autenticação
            headers = {
                "Authorization": f"Bearer {self.github_token}",
                "Accept": "application/vnd.github.v3+json",
                "Content-Type": "application/json"
            }
            
            # Payload com os dados da notificação
            payload = {
                "ref": "main",  # Branch para executar o workflow
                "inputs": {
                    "notification_type": notification_type,
                    "recipient_email": recipient_email,
                    "recipient_name": recipient_name,
                    "timestamp": datetime.now().isoformat(),
                    **{k: str(v) for k, v in kwargs.items()}  # Converte todos os valores para string
                }
            }
            
            # Faz a requisição para o GitHub
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 204:
                logger.info(f"Workflow de notificação '{notification_type}' disparado para {recipient_email}")
                return True
            else:
                logger.error(f"Falha ao disparar workflow: {response.status_code} - {response.text}")
                return queue_success  # Pelo menos foi adicionado à fila
                
        except Exception as e:
            logger.error(f"Erro ao disparar workflow GitHub: {e}")
            return queue_success  # Pelo menos foi adicionado à fila

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
    """Notifica usuário sobre aprovação de acesso com trial"""
    handler = get_notification_handler()
    return handler.trigger_notification_workflow(
        notification_type="access_approved",
        recipient_email=user_email,
        recipient_name=user_name,
        trial_days=trial_days,
        login_url=st.secrets.get("app", {}).get("url", "https://sua-app.streamlit.app")
    )

def notify_access_denied(user_email: str, user_name: str, reason: str = ""):
    """Notifica usuário sobre negação de acesso"""
    handler = get_notification_handler()
    return handler.trigger_notification_workflow(
        notification_type="access_denied", 
        recipient_email=user_email,
        recipient_name=user_name,
        reason=reason
    )

def notify_trial_expiring(user_email: str, user_name: str, days_left: int):
    """Notifica usuário sobre trial expirando"""
    handler = get_notification_handler()
    return handler.trigger_notification_workflow(
        notification_type="trial_expiring",
        recipient_email=user_email,
        recipient_name=user_name,
        days_left=days_left,
        login_url=st.secrets.get("app", {}).get("url", "https://sua-app.streamlit.app")
    )

def notify_payment_confirmed(user_email: str, user_name: str, plan_name: str):
    """Notifica usuário sobre confirmação de pagamento"""
    handler = get_notification_handler()
    return handler.trigger_notification_workflow(
        notification_type="payment_confirmed",
        recipient_email=user_email,
        recipient_name=user_name,
        plan_name=plan_name,
        login_url=st.secrets.get("app", {}).get("url", "https://sua-app.streamlit.app")
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
