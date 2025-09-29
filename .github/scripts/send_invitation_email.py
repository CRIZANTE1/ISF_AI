"""
Script para detectar tentativas de acesso não autorizadas e criar notificações
de convite na aba notificacoes_pendentes (que já é processada pelo send_email.py)
Executa via GitHub Actions periodicamente
"""

import json
import os
from datetime import datetime, timedelta
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
    """
    Busca emails que já têm convites pendentes ou enviados NAS ÚLTIMAS 7 DIAS
    """
    try:
        range_name = "notificacoes_pendentes!A:F"
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        if not values or len(values) < 2:
            logger.info("Nenhuma notificação pendente encontrada na planilha")
            return set()
        
        # Log da estrutura para debug
        logger.info(f"Estrutura de notificacoes_pendentes:")
        logger.info(f"  Cabeçalho: {values[0]}")
        logger.info(f"  Total de linhas: {len(values) - 1}")
        
        # Apenas considera convites recentes (últimas 7 DIAS)
        cutoff_time = datetime.now() - timedelta(days=7)
        
        # Coleta emails que já têm convite recente
        invited_emails = set()
        invitation_count = 0
        
        for row in values[1:]:
            if len(row) >= 6:
                timestamp_str = row[0]
                tipo_notificacao = row[1]
                email = row[2]
                status = row[5]
                
                # Apenas invitation_email conta
                if tipo_notificacao == 'invitation_email' and email:
                    invitation_count += 1
                    try:
                        # Parse timestamp
                        timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                        
                        # Se o convite foi enviado nos últimos 7 dias, considera como "já convidado"
                        if timestamp >= cutoff_time:
                            invited_emails.add(email.strip().lower())
                            logger.info(f"  ✓ Email {email} tem convite recente (enviado em {timestamp_str}, status: {status})")
                        else:
                            logger.info(f"  ✗ Email {email} tem convite antigo (enviado em {timestamp_str}) - ignorado")
                    except Exception as e:
                        logger.warning(f"Erro ao fazer parse da data {timestamp_str}: {e}")
                        pass
        
        logger.info(f"Resumo de convites:")
        logger.info(f"  Total de invitation_email na planilha: {invitation_count}")
        logger.info(f"  Emails com convites recentes (últimos 7 dias): {len(invited_emails)}")
        if invited_emails:
            logger.info(f"  Lista: {list(invited_emails)}")
        
        return invited_emails
        
    except Exception as e:
        logger.error(f"Erro ao buscar convites pendentes: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return set()

# Alteração na função get_unauthorized_access_attempts (linha ~85)

def get_existing_users(sheets_service, spreadsheet_id):
    """
    Busca emails que já estão cadastrados na planilha de usuários
    """
    try:
        range_name = "usuarios!A:L"  # Ajuste conforme necessário
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        if not values or len(values) < 2:
            logger.info("Nenhum usuário encontrado na planilha de usuários")
            return set()
        
        # Log da estrutura para debug
        logger.info(f"Estrutura da planilha de usuários:")
        logger.info(f"  Cabeçalho: {values[0]}")
        logger.info(f"  Total de usuários: {len(values) - 1}")
        
        # Encontra a coluna de email
        email_col_index = None
        for i, header in enumerate(values[0]):
            if 'email' in header.lower():
                email_col_index = i
                break
        
        if email_col_index is None:
            logger.error("Coluna de email não encontrada na planilha de usuários!")
            return set()
        
        # Coleta todos os emails cadastrados
        existing_emails = set()
        for row in values[1:]:
            if len(row) > email_col_index:
                email = row[email_col_index].strip().lower()
                if email and '@' in email:
                    existing_emails.add(email)
        
        logger.info(f"Total de emails cadastrados na planilha: {len(existing_emails)}")
        if existing_emails and len(existing_emails) <= 10:
            logger.info(f"  Lista: {list(existing_emails)}")
        
        return existing_emails
        
    except Exception as e:
        logger.error(f"Erro ao buscar usuários existentes: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return set()

def get_unauthorized_access_attempts(sheets_service, spreadsheet_id):
    """
    Busca tentativas de acesso não autorizadas que ainda não receberam convite RECENTEMENTE
    """
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
        
        # ✅ LOG DEBUG: Mostra estrutura da planilha
        logger.info(f"Estrutura do log de auditoria:")
        logger.info(f"  Cabeçalho: {values[0]}")
        logger.info(f"  Total de linhas: {len(values)}")
        
        # Mostra exemplos de ACCESS_DENIED_UNAUTHORIZED
        sample_count = 0
        for i, row in enumerate(values[1:], 1):
            if len(row) >= 4:
                action = row[2] if len(row) > 2 else ""
                if action == "ACCESS_DENIED_UNAUTHORIZED":
                    sample_count += 1
                    if sample_count <= 3:
                        logger.info(f"  Exemplo {sample_count}: {row}")
        
        # Busca emails que já receberam convite recentemente (últimos 7 dias)
        invited_emails = get_pending_invitations(sheets_service, spreadsheet_id)
        
        # ✅ NOVO: Busca emails que já estão cadastrados como usuários
        existing_users = get_existing_users(sheets_service, spreadsheet_id)
        
        # Processa tentativas de acesso não autorizadas NOS ÚLTIMOS 7 DIAS
        cutoff_time = datetime.now() - timedelta(days=7)
        logger.info(f"Cutoff time (7 dias atrás): {cutoff_time.strftime('%Y-%m-%d %H:%M:%S')}")
        
        unauthorized_attempts = []
        seen_emails = set()
        email_attempt_count = {}
        
        # CONTADORES DE DEBUG
        total_rows = 0
        access_denied_rows = 0
        within_time_window = 0
        already_invited = 0
        already_user = 0  # ✅ NOVO: Contador para usuários já cadastrados
        email_parse_errors = 0
        
        for i, row in enumerate(values[1:], 2):
            total_rows += 1
            
            if len(row) >= 5:  # ✅ CORREÇÃO: Precisa ter pelo menos 5 colunas
                timestamp_str = row[0]
                action = row[3] if len(row) > 3 else ""  # ✅ CORREÇÃO: Índice 3 (era 2)
                details = row[4] if len(row) > 4 else ""  # ✅ CORREÇÃO: Índice 4 (era 3)
                
                if action == "ACCESS_DENIED_UNAUTHORIZED":
                    access_denied_rows += 1
                    
                    # Log DEBUG para primeira ocorrência
                    if access_denied_rows == 1:
                        logger.info(f"Primeira ACCESS_DENIED_UNAUTHORIZED encontrada:")
                        logger.info(f"  Timestamp: {timestamp_str}")
                        logger.info(f"  Action: {action}")
                        logger.info(f"  Details: {details}")
                    
                    if "Email:" in details or "email:" in details.lower():
                        try:
                            # Parse timestamp do log
                            log_timestamp = datetime.strptime(timestamp_str, '%Y-%m-%d %H:%M:%S')
                            
                            # Considera tentativas que aconteceram NOS últimos 7 dias
                            if log_timestamp < cutoff_time:
                                continue
                            
                            within_time_window += 1
                            
                        except Exception as e:
                            logger.warning(f"Erro ao fazer parse da data {timestamp_str}: {e}")
                            continue
                        
                        # Extrai email - tenta múltiplos formatos
                        email = None
                        try:
                            if "Email:" in details:
                                email = details.split("Email:")[1].strip().lower()
                            elif "email:" in details.lower():
                                email = details.lower().split("email:")[1].strip()
                        except Exception as e:
                            email_parse_errors += 1
                            logger.warning(f"Erro ao extrair email de: '{details}' - Erro: {e}")
                            continue
                        
                        # Valida email
                        if not email or '@' not in email:
                            email_parse_errors += 1
                            logger.warning(f"Email inválido extraído: '{email}' de '{details}'")
                            continue
                        
                        # Conta tentativas por email
                        if email not in email_attempt_count:
                            email_attempt_count[email] = 0
                        email_attempt_count[email] += 1
                        
                        # ✅ NOVO: Verifica se já é usuário cadastrado
                        if email in existing_users:
                            already_user += 1
                            if already_user <= 3:  # Mostra apenas os 3 primeiros
                                logger.info(f"Email {email} já é usuário cadastrado - não será convidado")
                            continue
                        
                        # Verifica se já tem convite RECENTE
                        if email in invited_emails:
                            already_invited += 1
                            if already_invited <= 3:  # Mostra apenas os 3 primeiros
                                logger.info(f"Email {email} já tem convite recente - não será convidado novamente")
                            continue
                        
                        # Verifica se já adicionou nesta execução
                        if email in seen_emails:
                            continue
                        
                        # Adiciona à lista
                        seen_emails.add(email)
                        attempt = {
                            'timestamp': timestamp_str,
                            'email': email,
                            'attempt_count': email_attempt_count[email]
                        }
                        unauthorized_attempts.append(attempt)
                        logger.info(f"✉️ Novo convite será criado para: {email} ({email_attempt_count[email]} tentativas)")
        
        # RELATÓRIO FINAL
        logger.info("=" * 60)
        logger.info("RELATÓRIO DE PROCESSAMENTO:")
        logger.info(f"  Total de linhas processadas: {total_rows}")
        logger.info(f"  ACCESS_DENIED_UNAUTHORIZED encontrados: {access_denied_rows}")
        logger.info(f"  Dentro da janela de tempo (7 dias): {within_time_window}")
        logger.info(f"  Já são usuários cadastrados: {already_user}")
        logger.info(f"  Já convidados recentemente: {already_invited}")
        logger.info(f"  Erros ao extrair email: {email_parse_errors}")
        logger.info(f"  TOTAL DE NOVOS CONVITES: {len(unauthorized_attempts)}")
        logger.info("=" * 60)
        
        return unauthorized_attempts
        
    except Exception as e:
        logger.error(f"Erro ao buscar tentativas de acesso: {e}")
        import traceback
        logger.error(traceback.format_exc())
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
            'recipient_email': email,
            'recipient_name': nome,
            'request_access_url': app_url,
            'documentation_url': f'{app_url}/?page=documentacao',
            'video_demo_url': f'{app_url}/?page=demo',
            'faq_url': f'{app_url}/?page=faq'
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
        
        # Busca tentativas de acesso não autorizadas RECENTES
        attempts = get_unauthorized_access_attempts(sheets_service, spreadsheet_id)
        
        if not attempts:
            logger.info("✅ Nenhuma tentativa de acesso sem convite recente encontrada.")
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
