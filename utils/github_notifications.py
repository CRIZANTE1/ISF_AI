import requests
import streamlit as st
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class GitHubNotificationHandler:
    """Classe para disparar notificações via GitHub Actions"""
    
    def __init__(self):
        try:
            self.github_token = st.secrets["github"]["token"]
            self.repo_owner = st.secrets["github"]["repo_owner"] 
            self.repo_name = st.secrets["github"]["repo_name"]
            self.workflow_id = st.secrets["github"]["workflow_id"] 
        except KeyError as e:
            logger.error(f"Configuração GitHub não encontrada: {e}")
            self.github_token = None
    
    def trigger_notification_workflow(self, notification_type: str, recipient_email: str, 
                                    recipient_name: str, **kwargs):
        """
        Dispara o workflow do GitHub Actions para enviar notificação por email
        
        Args:
            notification_type: Tipo da notificação (access_approved, access_denied, etc.)
            recipient_email: Email do destinatário
            recipient_name: Nome do destinatário
            **kwargs: Dados adicionais específicos do tipo de notificação
        """
        
        if not self.github_token:
            logger.warning("GitHub token não configurado, pulando notificação")
            return False
            
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
                    **kwargs  # Dados adicionais
                }
            }
            
            # Faz a requisição para o GitHub
            response = requests.post(url, json=payload, headers=headers, timeout=10)
            
            if response.status_code == 204:
                logger.info(f"Notificação '{notification_type}' disparada para {recipient_email}")
                return True
            else:
                logger.error(f"Falha ao disparar notificação: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao disparar notificação GitHub: {e}")
            return False

# Funções de conveniência para diferentes tipos de notificação
def notify_access_approved(user_email: str, user_name: str, trial_days: int = 14):
    """Notifica usuário sobre aprovação de acesso com trial"""
    notifier = GitHubNotificationHandler()
    return notifier.trigger_notification_workflow(
        notification_type="access_approved",
        recipient_email=user_email,
        recipient_name=user_name,
        trial_days=trial_days,
        login_url=st.secrets.get("app", {}).get("url", "https://sua-app.streamlit.app")
    )

def notify_access_denied(user_email: str, user_name: str, reason: str = ""):
    """Notifica usuário sobre negação de acesso"""
    notifier = GitHubNotificationHandler()
    return notifier.trigger_notification_workflow(
        notification_type="access_denied", 
        recipient_email=user_email,
        recipient_name=user_name,
        reason=reason
    )

def notify_trial_expiring(user_email: str, user_name: str, days_left: int):
    """Notifica usuário sobre trial expirando"""
    notifier = GitHubNotificationHandler()
    return notifier.trigger_notification_workflow(
        notification_type="trial_expiring",
        recipient_email=user_email,
        recipient_name=user_name,
        days_left=days_left
    )

def notify_payment_confirmed(user_email: str, user_name: str, plan_name: str):
    """Notifica usuário sobre confirmação de pagamento"""
    notifier = GitHubNotificationHandler()
    return notifier.trigger_notification_workflow(
        notification_type="payment_confirmed",
        recipient_email=user_email,
        recipient_name=user_name,
        plan_name=plan_name
    )
