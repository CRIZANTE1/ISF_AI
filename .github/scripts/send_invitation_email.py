"""
Script para detectar tentativas de acesso não autorizadas e criar notificações
de convite na aba notificacoes_pendentes (que já é processada pelo send_email.py)
Executa via GitHub Actions periodicamente
"""

import json
import os
from datetime import datetime, timedelta
import logging
from supabase import create_client, Client

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_supabase_client_for_script() -> Client:
    """Inicializa o cliente Supabase para uso em scripts de backend."""
    try:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("Credenciais SUPABASE_URL ou SUPABASE_KEY não encontradas no ambiente.")
        return create_client(url, key)
    except Exception as e:
        print(f"❌ Erro ao inicializar cliente Supabase: {e}")
        return None

def get_pending_invitations(supabase_client: Client) -> set:
    """
    Busca emails que já têm convites pendentes ou enviados NAS ÚLTIMAS 7 DIAS no Supabase.
    """
    try:
        logger.info("Buscando convites pendentes no Supabase...")
        response = supabase_client.table("notificacoes_pendentes").select("*").eq("type", "invitation_email").execute()
        
        invited_emails = set()
        if response.data:
            cutoff_time = datetime.now() - timedelta(days=7)
            for item in response.data:
                timestamp_str = item.get('timestamp') 
                if timestamp_str:
                    try:
                        timestamp = datetime.fromisoformat(timestamp_str)
                        if timestamp >= cutoff_time:
                            invited_emails.add(item['email'].strip().lower())
                    except ValueError:
                        logger.warning(f"Erro ao fazer parse da data {timestamp_str} para convite.")
        
        logger.info(f"Emails com convites recentes (últimos 7 dias): {len(invited_emails)}")
        return invited_emails
        
    except Exception as e:
        logger.error(f"Erro ao buscar convites pendentes do Supabase: {e}")
        return set()

def get_existing_users(supabase_client: Client) -> set:
    """
    Busca emails que já estão cadastrados na tabela de usuários do Supabase.
    """
    try:
        logger.info("Buscando usuários existentes no Supabase...")
        response = supabase_client.table("usuarios").select("email").execute()
        
        existing_emails = set()
        if response.data:
            for item in response.data:
                email = item.get('email')
                if email and '@' in email:
                    existing_emails.add(email.strip().lower())
        
        logger.info(f"Total de emails cadastrados no Supabase: {len(existing_emails)}")
        return existing_emails
        
    except Exception as e:
        logger.error(f"Erro ao buscar usuários existentes do Supabase: {e}")
        return set()

def get_unauthorized_access_attempts(supabase_client: Client) -> list:
    """
    Busca tentativas de acesso não autorizadas que ainda não receberam convite RECENTEMENTE no Supabase.
    """
    try:
        logger.info("Buscando tentativas de acesso não autorizadas no Supabase...")
        response = supabase_client.table("log_auditoria").select("*").eq("action", "ACCESS_DENIED_UNAUTHORIZED").execute()
        
        unauthorized_attempts = []
        if response.data:
            cutoff_time = datetime.now() - timedelta(days=7)
            invited_emails = get_pending_invitations(supabase_client)
            existing_users = get_existing_users(supabase_client)
            
            seen_emails = set()
            
            for item in response.data:
                timestamp_str = item.get('timestamp')
                email = item.get('user_email')
                
                if timestamp_str and email:
                    try:
                        log_timestamp = datetime.fromisoformat(timestamp_str)
                        if log_timestamp < cutoff_time:
                            continue
                        
                        email = email.strip().lower()
                        
                        if email in existing_users:
                            continue
                        
                        if email in invited_emails:
                            continue
                        
                        if email in seen_emails:
                            continue
                        
                        seen_emails.add(email)
                        unauthorized_attempts.append({
                            'timestamp': timestamp_str,
                            'email': email,
                            'attempt_count': 1 
                        })
                    except ValueError:
                        logger.warning(f"Erro ao fazer parse da data {timestamp_str} para tentativa de acesso.")
        
        logger.info(f"Total de novos convites: {len(unauthorized_attempts)}")
        return unauthorized_attempts
        
    except Exception as e:
        logger.error(f"Erro ao buscar tentativas de acesso do Supabase: {e}")
        return []

def create_invitation_notification(supabase_client: Client, email: str, app_url: str) -> bool:
    """Cria uma notificação de convite na tabela 'notificacoes_pendentes' do Supabase."""
    try:
        logger.info(f"📝 Criando notificação de convite para {email}")
        
        timestamp = datetime.now().isoformat()
        nome = email.split('@')[0].title()
        
        notification_data = {
            'recipient_email': email,
            'recipient_name': nome,
            'request_access_url': app_url,
            'documentation_url': f'{app_url}/?page=documentacao',
            'video_demo_url': f'{app_url}/?page=demo',
            'faq_url': f'{app_url}/?page=faq'
        }
        
        notification_record = {
            "timestamp": timestamp,
            "type": "invitation_email",
            "email": email,
            "name": nome,
            "data": json.dumps(notification_data, ensure_ascii=False),
            "status": "pendente"
        }
        
        supabase_client.append_data("notificacoes_pendentes", notification_record)
        
        logger.info(f"✅ Notificação de convite criada com sucesso para {email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar notificação de convite no Supabase: {e}")
        return False

def main():
    """Função principal"""
    try:
        logger.info("🔄 Iniciando detecção de tentativas não autorizadas...")
        
        required_vars = ['SUPABASE_URL', 'SUPABASE_KEY', 'APP_URL']
        
        missing_vars = [var for var in required_vars if not os.environ.get(var)]
        if missing_vars:
            logger.error(f"Variáveis de ambiente faltando: {missing_vars}")
            return
        
        logger.info("✅ Todas as variáveis de ambiente estão configuradas")
        
        app_url = os.environ['APP_URL']
        
        supabase_client = get_supabase_client_for_script()
        if not supabase_client:
            logger.error("❌ Falha na conexão com o Supabase. Abortando.")
            return
        
        logger.info(f"📊 Usando Supabase.")
        
        attempts = get_unauthorized_access_attempts(supabase_client)
        
        if not attempts:
            logger.info("✅ Nenhuma tentativa de acesso sem convite recente encontrada.")
            return
        
        logger.info(f"📧 Encontradas {len(attempts)} pessoas para convidar.")
        
        created = 0
        for attempt in attempts:
            try:
                if create_invitation_notification(
                    supabase_client, 
                    attempt['email'], 
                    app_url
                ):
                    created += 1
                    logger.info(f"✅ Convite {created}/{len(attempts)}: {attempt['email']}")
            except Exception as e:
                logger.error(f"❌ Erro ao processar convite para {attempt['email']}: {e}")
        
        logger.info(f"✅ Processamento concluído: {created}/{len(attempts)} convites criados.")
        logger.info(f"📧 Os emails serão enviados pelo sistema de notificações existente (send_email.py).")
        
    except Exception as e:
        logger.error(f"❌ Erro crítico no processamento: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise

if __name__ == "__main__":
    main()