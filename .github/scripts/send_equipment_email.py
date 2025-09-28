import json
import smtplib
import os
import ast
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from jinja2 import Template
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

EQUIPMENT_EMAIL_TEMPLATES = {
    'equipment_expiring': {
        'subject': '⏰ Equipamentos vencendo em {{days_notice}} dias - ISF IA',
        'template': '''
Olá {{recipient_name}},

⏰ **Alerta de vencimentos próximos!**

Identificamos {{total_items}} equipamento(s) que necessitam de atenção nos próximos {{days_notice}} dias:

📋 **Equipamentos vencendo:**
{% for equipment in expiring_equipment %}
• **{{equipment.tipo}}** - {{equipment.identificacao}}
  └ Serviço: {{equipment.servico}}
  └ Vence em: {{equipment.data_vencimento}} ({{equipment.dias_restantes}} dias)
  
{% endfor %}

🎯 **Ação necessária:**
Acesse o sistema para agendar os serviços e manter a conformidade:
{{login_url}}

⚠️ **Importante:** Equipamentos vencidos podem comprometer a segurança e gerar não conformidades em auditorias.

💡 **Dica:** Com o plano Premium IA, você pode automatizar lembretes e relatórios de conformidade.

Atenciosamente,
Equipe ISF IA

---
Esta é uma notificação automática do sistema de gestão ISF IA.
Para alterar a frequência dos alertas, acesse seu perfil no sistema.
'''
    },
    
    'pending_issues': {
        'subject': '🚨 Pendências críticas encontradas - ISF IA',
        'template': '''
Olá {{recipient_name}},

🚨 **Atenção: Pendências críticas identificadas!**

Encontramos {{total_pending}} pendência(s) que necessitam de ação imediata:

🔴 **Pendências críticas:**
{% for issue in pending_issues %}
• **{{issue.tipo}}** - {{issue.identificacao}}
  └ Problema: {{issue.problema}}
  └ Identificado em: {{issue.data_identificacao}}
  └ Prioridade: {{issue.prioridade}}
  
{% endfor %}

🎯 **Ação urgente necessária:**
Acesse o sistema para resolver essas pendências:
{{login_url}}

⚠️ **Riscos:**
• Equipamentos reprovados comprometem a segurança
• Não conformidades podem gerar multas e responsabilizações
• Equipamentos vencidos perdem eficácia operacional

📞 **Precisa de ajuda?**
Nossa equipe de suporte está disponível para orientar as ações corretivas necessárias.

Atenciosamente,
Equipe ISF IA

---
Esta é uma notificação automática do sistema de gestão ISF IA.
Resolva as pendências o quanto antes para manter a conformidade.
'''
    }
}

def get_google_sheets_service():
    """Inicializa serviço do Google Sheets"""
    try:
        logger.info("Inicializando serviço Google Sheets...")
        
        credentials_json = os.environ.get('GOOGLE_CREDENTIALS')
        if not credentials_json:
            raise ValueError("GOOGLE_CREDENTIALS não encontrado nas variáveis de ambiente")
        
        logger.info("Credenciais carregadas, criando serviço...")
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

def get_pending_equipment_notifications(sheets_service, spreadsheet_id):
    """Busca notificações de equipamentos pendentes na planilha"""
    try:
        logger.info(f"Buscando notificações pendentes na planilha {spreadsheet_id}")
        
        range_name = "notificacoes_pendentes!A:F"
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        if not values or len(values) < 2:
            logger.info("Nenhuma notificação encontrada ou planilha vazia")
            return []
        
        logger.info(f"Encontradas {len(values) - 1} linhas na planilha de notificações")
        
        # Converte para lista de dicionários
        headers = values[0]
        notifications = []
        
        for i, row in enumerate(values[1:], 2):  # i=2 para linha da planilha
            if len(row) >= 6 and row[5] == 'pendente':
                # Filtra apenas notificações de equipamentos
                if row[1] in ['equipment_expiring', 'pending_issues']:
                    notification_data = {
                        'row_index': i,
                        'timestamp': row[0],
                        'type': row[1], 
                        'email': row[2],
                        'name': row[3],
                        'data': row[4],
                        'status': row[5]
                    }
                    notifications.append(notification_data)
        
        logger.info(f"Encontradas {len(notifications)} notificações de equipamentos pendentes")
        return notifications
        
    except Exception as e:
        logger.error(f"Erro ao buscar notificações de equipamentos: {e}")
        return []

def send_equipment_email(smtp_config, recipient_email, subject, body_html):
    """Envia email usando configuração SMTP"""
    try:
        logger.info(f"Enviando email para {recipient_email}")
        
        msg = MIMEMultipart('alternative')
        
        # Limpa e valida os campos do cabeçalho
        from_name = smtp_config['from_name'].strip().replace('\n', '').replace('\r', '')
        from_email = smtp_config['from_email'].strip().replace('\n', '').replace('\r', '')
        recipient_email = recipient_email.strip().replace('\n', '').replace('\r', '')
        subject = subject.strip().replace('\n', ' ').replace('\r', ' ')
        
        msg['From'] = f"{from_name} <{from_email}>"
        msg['To'] = recipient_email
        msg['Subject'] = subject
        
        html_part = MIMEText(body_html, 'html', 'utf-8')
        msg.attach(html_part)
        
        server = smtplib.SMTP(smtp_config['server'], smtp_config['port'])
        server.starttls()
        server.login(smtp_config['username'], smtp_config['password'])
        
        text = msg.as_string()
        server.sendmail(smtp_config['from_email'], recipient_email, text)
        server.quit()
        
        logger.info(f"Email de equipamento enviado com sucesso para {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao enviar email de equipamento para {recipient_email}: {e}")
        return False

def update_equipment_notification_status(sheets_service, spreadsheet_id, row_index, status):
    """Atualiza status da notificação na planilha"""
    try:
        logger.info(f"Atualizando status da linha {row_index} para '{status}'")
        
        range_name = f"notificacoes_pendentes!F{row_index}"
        body = {'values': [[status]]}
        
        sheets_service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption='RAW',
            body=body
        ).execute()
        
        logger.info(f"Status atualizado com sucesso para linha {row_index}")
        return True
    except Exception as e:
        logger.error(f"Erro ao atualizar status de equipamento: {e}")
        return False

def process_equipment_notification(notification, smtp_config, sheets_service, spreadsheet_id):
    """Processa uma notificação de equipamento individual"""
    
    notification_type = notification['type']
    recipient_email = notification['email']
    recipient_name = notification['name']
    
    logger.info(f"Processando notificação '{notification_type}' para {recipient_email}")
    
    # Parse dos dados da notificação
    try:
        # Tenta fazer parse do JSON
        data_str = notification['data']
        if data_str.startswith('{'):
            data_dict = json.loads(data_str)
        else:
            # Se não for JSON válido, tenta eval (compatibilidade com versão antiga)
            data_dict = ast.literal_eval(data_str) if data_str else {}
        
        logger.info(f"Dados da notificação parsados: {len(data_dict)} campos")
    except Exception as e:
        logger.error(f"Erro ao fazer parse dos dados da notificação: {e}")
        data_dict = {}
    
    # Busca template de equipamento
    if notification_type not in EQUIPMENT_EMAIL_TEMPLATES:
        logger.error(f"Template de equipamento não encontrado para: {notification_type}")
        return False
    
    template_data = EQUIPMENT_EMAIL_TEMPLATES[notification_type]
    
    # Processa listas específicas de equipamentos
    if 'expiring_equipment' in data_dict:
        expiring_equipment = data_dict.get('expiring_equipment', [])
        if isinstance(expiring_equipment, str):
            try:
                expiring_equipment = json.loads(expiring_equipment)
            except:
                expiring_equipment = []
        data_dict['expiring_equipment'] = expiring_equipment
        logger.info(f"Equipamentos vencendo processados: {len(expiring_equipment)}")
    
    if 'pending_issues' in data_dict:
        pending_issues = data_dict.get('pending_issues', [])
        if isinstance(pending_issues, str):
            try:
                pending_issues = json.loads(pending_issues)
            except:
                pending_issues = []
        data_dict['pending_issues'] = pending_issues
        logger.info(f"Pendências processadas: {len(pending_issues)}")
    
    # Dados padrão para template
    template_vars = {
        'recipient_name': recipient_name,
        'recipient_email': recipient_email,
        'login_url': data_dict.get('login_url', 'https://isnpecoessmaia.streamlit.app'),
        'days_notice': data_dict.get('days_notice', '30'),
        'total_items': data_dict.get('total_items', '0'),
        'total_pending': data_dict.get('total_pending', '0'),
        'expiring_equipment': data_dict.get('expiring_equipment', []),
        'pending_issues': data_dict.get('pending_issues', []),
        'timestamp': notification['timestamp']
    }
    
    logger.info(f"Variáveis do template preparadas para {recipient_email}")
    
    # Renderiza template
    try:
        subject_template = Template(template_data['subject'])
        body_template = Template(template_data['template'])
        
        subject = subject_template.render(**template_vars)
        body_text = body_template.render(**template_vars)
        
        # Converte para HTML
        body_html = body_text.replace('\n', '<br>\n')
        body_html = f"<html><body><pre style='font-family: Arial, sans-serif; white-space: pre-wrap;'>{body_html}</pre></body></html>"
        
        logger.info(f"Template renderizado com sucesso para {recipient_email}")
    except Exception as e:
        logger.error(f"Erro ao renderizar template: {e}")
        return False
    
    # Envia email
    success = send_equipment_email(smtp_config, recipient_email, subject, body_html)
    
    if success:
        # Marca como enviado na planilha
        update_success = update_equipment_notification_status(sheets_service, spreadsheet_id, notification['row_index'], 'enviado')
        if update_success:
            logger.info(f"Notificação de equipamento {notification_type} processada com sucesso para {recipient_email}")
        else:
            logger.warning(f"Email enviado mas falha ao atualizar status para {recipient_email}")
    else:
        # Marca como erro
        update_equipment_notification_status(sheets_service, spreadsheet_id, notification['row_index'], 'erro')
        logger.error(f"Falha ao processar notificação de equipamento {notification_type} para {recipient_email}")
    
    return success

def main():
    """Função principal para processamento de notificações de equipamentos"""
    try:
        logger.info("🔄 Iniciando processamento de notificações de equipamentos...")
        
        # Verificar variáveis de ambiente obrigatórias
        required_vars = ['SMTP_SERVER', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 
                        'FROM_EMAIL', 'FROM_NAME', 'GOOGLE_CREDENTIALS', 'MATRIX_SHEETS_ID']
        
        missing_vars = [var for var in required_vars if not os.environ.get(var)]
        if missing_vars:
            logger.error(f"Variáveis de ambiente faltando: {missing_vars}")
            return
        
        logger.info("Todas as variáveis de ambiente estão configuradas")
        
        # Configuração SMTP
        smtp_config = {
            'server': os.environ['SMTP_SERVER'],
            'port': int(os.environ['SMTP_PORT']),
            'username': os.environ['SMTP_USERNAME'],
            'password': os.environ['SMTP_PASSWORD'],
            'from_email': os.environ['FROM_EMAIL'],
            'from_name': os.environ['FROM_NAME']
        }
        
        logger.info(f"Configuração SMTP: servidor {smtp_config['server']}:{smtp_config['port']}")
        
        # Serviços Google
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.environ['MATRIX_SHEETS_ID']
        
        logger.info(f"Usando planilha matriz: {spreadsheet_id}")
        
        # Busca notificações de equipamentos pendentes
        notifications = get_pending_equipment_notifications(sheets_service, spreadsheet_id)
        
        if not notifications:
            logger.info("✅ Nenhuma notificação de equipamento pendente encontrada.")
            return
        
        logger.info(f"📧 Encontradas {len(notifications)} notificações de equipamentos pendentes.")
        
        # Processa cada notificação de equipamento
        processed = 0
        for notification in notifications:
            try:
                if process_equipment_notification(notification, smtp_config, sheets_service, spreadsheet_id):
                    processed += 1
            except Exception as e:
                logger.error(f"Erro ao processar notificação de equipamento: {e}")
                import traceback
                logger.error(traceback.format_exc())
        
        logger.info(f"✅ Processamento de equipamentos concluído: {processed}/{len(notifications)} enviadas com sucesso.")
        
    except Exception as e:
        logger.error(f"Erro crítico no processamento de notificações de equipamentos: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise

if __name__ == "__main__":
    main()
