"""
Script para detectar tentativas de acesso não autorizadas e criar notificações
de convite na aba notificacoes_pendentes (que já é processada pelo send_email.py)
Executa via GitHub Actions periodicamente
"""

import json
import os
from datetime import datetime
from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

def get_google_sheets_service():
    """Inicializa serviço do Google Sheets"""
    try:
        logger.info("Inicializando serviço Google Sheets...")
        
        credentials_json = os.environ.get('GOOGLE_CREDENTIALS')
        if not credentials_json:
            raise ValueError("GOOGLE_CREDENTIALS não encontrado nas variáveis de ambiente")
        
        credentials_dict = json.loads(credentials_json)
        
        credentials = service_account.Credentials.from_service_account_info(
            credentials_dict,
            scopes=['https://www.googleapis.com/auth/spreadsheets']
        )
        
        service = build('sheets', 'v4', credentials=credentials)
        logger.info("Serviço Google Sheets inicializado com sucesso")
        
        return service
    except Exception as e:
        logger.error(f"Erro ao inicializar serviço Google Sheets: {e}")
        raise

def get_pending_invitations(sheets_service, spreadsheet_id):
    """Busca emails que já têm convites pendentes ou enviados"""
    try:
        range_name = "notificacoes_pendentes!A:F"
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        if not values or len(values) < 2:
            return set()
        
        # Coleta emails que já têm convite (pendente ou enviado)
        invited_emails = set()
        for row in values[1:]:
            if len(row) >= 6:
                tipo_notificacao = row[1]
                email = row[2]
                
                if tipo_notificacao == 'invitation_email' and email:
                    invited_emails.add(email.strip().lower())
        
        logger.info(f"Encontrados {len(invited_emails)} emails com convites já processados/pendentes")
        return invited_emails
        
    except Exception as e:
        logger.error(f"Erro ao buscar convites pendentes: {e}")
        return set()

def get_unauthorized_access_attempts(sheets_service, spreadsheet_id):
    """Busca tentativas de acesso não autorizadas que ainda não receberam convite"""
    try:
        logger.info("Buscando tentativas de acesso não autorizadas...")
        
        # Busca no log de auditoria
        range_name = "log_auditoria!A:E"
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        if not values or len(values) < 2:
            logger.info("Nenhum log de auditoria encontrado")
            return []
        
        # Busca emails que já receberam convite
        invited_emails = get_pending_invitations(sheets_service, spreadsheet_id)
        
        # Processa tentativas de acesso não autorizadas
        unauthorized_attempts = []
        seen_emails = set()  # Para evitar duplicatas na mesma execução
        
        for i, row in enumerate(values[1:], 2):
            if len(row) >= 4:
                action = row[2] if len(row) > 2 else ""
                details = row[3] if len(row) > 3 else ""
                
                if action == "ACCESS_DENIED_UNAUTHORIZED" and "Email:" in details:
                    # Extrai email
                    try:
                        email = details.split("Email:")[1].strip().lower()
                    except:
                        continue
                    
                    # Valida email
                    if not email or '@' not in email:
                        continue
                    
                    # Verifica se já tem convite
                    if email in invited_emails:
                        logger.info(f"Convite já processado/pendente para: {email}")
                        continue
                    
                    # Verifica se já adicionou nesta execução
                    if email in seen_emails:
                        continue
                    
                    # Adiciona à lista
                    seen_emails.add(email)
                    attempt = {
                        'timestamp': row[0],
                        'email': email
                    }
                    unauthorized_attempts.append(attempt)
                    logger.info(f"✉️ Novo convite será criado para: {email}")
        
        logger.info(f"Total de novos convites a criar: {len(unauthorized_attempts)}")
        return unauthorized_attempts
        
    except Exception as e:
        logger.error(f"Erro ao buscar tentativas de acesso: {e}")
        return []

def create_invitation_notification(sheets_service, spreadsheet_id, email, app_url):
    """Cria uma notificação de convite na aba notificacoes_pendentes"""
    try:
        logger.info(f"📝 Criando notificação de convite para {email}")
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Nome genérico baseado no email
        nome = email.split('@')[0].title()
        
        # Dados da notificação (JSON)
        notification_data = {
            'request_access_url': app_url,
            'documentation_url': 'https://github.com/seu-usuario/isf_ia',
            'video_demo_url': app_url,
            'faq_url': app_url
        }
        
        # Linha para adicionar: timestamp, tipo, email, nome, dados_json, status
        notification_row = [
            timestamp,
            'invitation_email',
            email,
            nome,
            json.dumps(notification_data, ensure_ascii=False),
            'pendente'
        ]
        
        # Adiciona na aba notificacoes_pendentes
        range_name = "notificacoes_pendentes!A:F"
        body = {'values': [notification_row]}
        
        sheets_service.spreadsheets().values().append(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption='RAW',
            insertDataOption='INSERT_ROWS',
            body=body
        ).execute()
        
        logger.info(f"✅ Notificação de convite criada com sucesso para {email}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao criar notificação de convite: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return False

def main():
    """Função principal"""
    try:
        logger.info("🔄 Iniciando detecção de tentativas não autorizadas...")
        
        # Verificar variáveis de ambiente
        required_vars = ['GOOGLE_CREDENTIALS', 'MATRIX_SHEETS_ID', 'APP_URL']
        
        missing_vars = [var for var in required_vars if not os.environ.get(var)]
        if missing_vars:
            logger.error(f"Variáveis de ambiente faltando: {missing_vars}")
            return
        
        logger.info("✅ Todas as variáveis de ambiente estão configuradas")
        
        app_url = os.environ['APP_URL']
        
        # Serviços Google
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.environ['MATRIX_SHEETS_ID']
        
        logger.info(f"📊 Usando planilha matriz: {spreadsheet_id}")
        
        # Busca tentativas de acesso não autorizadas
        attempts = get_unauthorized_access_attempts(sheets_service, spreadsheet_id)
        
        if not attempts:
            logger.info("✅ Nenhuma tentativa de acesso sem convite encontrada.")
            return
        
        logger.info(f"📧 Encontradas {len(attempts)} pessoas para convidar.")
        
        # Cria notificações para cada tentativa
        created = 0
        for attempt in attempts:
            try:
                if create_invitation_notification(
                    sheets_service, 
                    spreadsheet_id, 
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
