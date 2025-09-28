"""
Script para processar notificações pendentes e enviar emails
Executa via GitHub Actions periodicamente
"""

import json
import smtplib
import os
import ast
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from jinja2 import Template
from google.oauth2 import service_account
from googleapiclient.discovery import build

EMAIL_TEMPLATES = {
    'access_approved': {
        'subject': '🎉 Seu acesso foi aprovado! - ISF IA',
        'template': '''
Olá {{recipient_name}},

🎉 **Excelente notícia!** Seu acesso ao Sistema ISF IA foi aprovado!

✅ **Detalhes da sua conta:**
• Plano: Premium IA (Trial)
• Duração do teste: {{trial_days}} dias
• Acesso completo a todas as funcionalidades

🚀 **Como começar:**
1. Acesse: {{login_url}}
2. Faça login com o mesmo email ({{recipient_email}})
3. Explore todas as funcionalidades do sistema

💡 **Durante o trial você terá acesso a:**
• Processamento automático com IA
• Extração de dados de PDFs
• Análise inteligente de documentos
• Relatórios com insights avançados
• Suporte prioritário

⏰ **Importante:** Seu trial expira em {{trial_days}} dias. Para garantir continuidade, você pode contratar um plano através do seu perfil no sistema.

Em caso de dúvidas, responda este email ou entre em contato conosco.

Bem-vindo ao ISF IA!

Atenciosamente,
Equipe ISF IA
'''
    },
    
    'access_denied': {
        'subject': '❌ Solicitação de acesso - ISF IA',
        'template': '''
Olá {{recipient_name}},

Obrigado por seu interesse no Sistema ISF IA.

Infelizmente, não pudemos aprovar sua solicitação de acesso neste momento.

{% if reason %}
**Motivo:** {{reason}}
{% endif %}

Você pode solicitar acesso novamente a qualquer momento. Para mais informações, entre em contato conosco.

Atenciosamente,
Equipe ISF IA
'''
    },
    
    'trial_expiring': {
        'subject': '⏰ Seu trial expira em {{days_left}} dias - ISF IA',
        'template': '''
Olá {{recipient_name}},

Esperamos que esteja aproveitando o Sistema ISF IA!

⏰ **Aviso importante:** Seu período de teste expira em {{days_left}} dias.

🔄 **Para continuar usando o sistema:**
1. Acesse seu perfil: {{login_url}}
2. Vá em "Planos e Pagamento"
3. Escolha o plano que melhor atende suas necessidades

💎 **Nossos planos:**
• **Pro** (R$ 39,90/mês): Funcionalidades completas
• **Premium IA** (R$ 69,90/mês): Automação com Inteligência Artificial

Não perca seus dados e configurações! Efetue a contratação antes do vencimento.

Em caso de dúvidas, estamos aqui para ajudar.

Atenciosamente,
Equipe ISF IA
'''
    },
    
    'payment_confirmed': {
        'subject': '✅ Pagamento confirmado - {{plan_name}} - ISF IA',
        'template': '''
Olá {{recipient_name}},

🎉 **Pagamento confirmado com sucesso!**

✅ **Detalhes:**
• Plano contratado: {{plan_name}}
• Status: Ativo
• Próxima cobrança: 30 dias

Seu acesso completo já está liberado. Continue aproveitando todas as funcionalidades do ISF IA!

Acesse: {{login_url}}

Obrigado por confiar em nosso sistema!

Atenciosamente,
Equipe ISF IA
'''
    },
    
    'new_access_request': {
        'subject': '🔔 Nova solicitação de acesso - ISF IA',
        'template': '''
Olá Administrador,

📬 **Nova solicitação de acesso recebida!**

👤 **Dados do solicitante:**
• Nome: {{requesting_user_name}}
• Email: {{requesting_user_email}}
• Data da solicitação: {{timestamp}}

💭 **Justificativa:**
{{justification}}

🎯 **Ação necessária:**
Acesse o painel administrativo para aprovar ou rejeitar a solicitação:
{{admin_panel_url}}

➡️ Vá em: Super Admin → Solicitações

Atenciosamente,
Sistema ISF IA
'''
    }
}

def get_google_sheets_service():
    """Inicializa serviço do Google Sheets"""
    credentials_json = os.environ['GOOGLE_CREDENTIALS']
    credentials_dict = json.loads(credentials_json)
    
    credentials = service_account.Credentials.from_service_account_info(
        credentials_dict,
        scopes=['https://www.googleapis.com/auth/spreadsheets']
    )
    
    return build('sheets', 'v4', credentials=credentials)

def get_pending_notifications(sheets_service, spreadsheet_id):
    """Busca notificações pendentes na planilha"""
    try:
        range_name = "notificacoes_pendentes!A:F"
        result = sheets_service.spreadsheets().values().get(
            spreadsheetId=spreadsheet_id,
            range=range_name
        ).execute()
        
        values = result.get('values', [])
        if not values or len(values) < 2:
            return []
        
        # Converte para lista de dicionários
        headers = values[0]
        notifications = []
        
        for i, row in enumerate(values[1:], 2):  # i=2 para linha da planilha
            if len(row) >= 6 and row[5] == 'pendente':
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
        
        return notifications
        
    except Exception as e:
        print(f"❌ Erro ao buscar notificações: {e}")
        return []

def send_email(smtp_config, recipient_email, subject, body_html):
    """Envia email usando configuração SMTP"""
    try:
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
        
        print(f"✅ Email enviado para {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao enviar email para {recipient_email}: {e}")
        return False

def update_notification_status(sheets_service, spreadsheet_id, row_index, status):
    """Atualiza status da notificação na planilha"""
    try:
        range_name = f"notificacoes_pendentes!F{row_index}"
        body = {'values': [[status]]}
        
        sheets_service.spreadsheets().values().update(
            spreadsheetId=spreadsheet_id,
            range=range_name,
            valueInputOption='RAW',
            body=body
        ).execute()
        
        return True
    except Exception as e:
        print(f"❌ Erro ao atualizar status: {e}")
        return False

def process_notification(notification, smtp_config, sheets_service, spreadsheet_id):
    """Processa uma notificação individual"""
    
    notification_type = notification['type']
    recipient_email = notification['email']
    recipient_name = notification['name']
    
    # Parse dos dados da notificação
    try:
        # Tenta fazer parse do JSON
        data_str = notification['data']
        if data_str.startswith('{'):
            data_dict = json.loads(data_str)
        else:
            # Se não for JSON válido, tenta eval (compatibilidade com versão antiga)
            data_dict = ast.literal_eval(data_str) if data_str else {}
    except:
        data_dict = {}
    
    # Busca template
    if notification_type not in EMAIL_TEMPLATES:
        print(f"❌ Template não encontrado para: {notification_type}")
        return False
    
    template_data = EMAIL_TEMPLATES[notification_type]
    
    # Dados padrão para template
    template_vars = {
        'recipient_name': recipient_name,
        'recipient_email': recipient_email,
        'login_url': data_dict.get('login_url', 'https://isnpecoessmaia.streamlit.app'),
        'trial_days': data_dict.get('trial_days', '14'),
        'reason': data_dict.get('reason', ''),
        'days_left': data_dict.get('days_left', '3'),
        'plan_name': data_dict.get('plan_name', ''),
        'timestamp': notification['timestamp'],
        # Novos campos para solicitação de acesso
        'requesting_user_name': data_dict.get('requesting_user_name', ''),
        'requesting_user_email': data_dict.get('requesting_user_email', ''),
        'justification': data_dict.get('justification', 'Nenhuma justificativa fornecida'),
        'admin_panel_url': data_dict.get('admin_panel_url', 'https://isnpecoessmaia.streamlit.app')
    }
    
    # Renderiza template
    subject_template = Template(template_data['subject'])
    body_template = Template(template_data['template'])
    
    subject = subject_template.render(**template_vars)
    body_text = body_template.render(**template_vars)
    
    # Converte para HTML
    body_html = body_text.replace('\n', '<br>\n')
    body_html = f"<html><body><pre style='font-family: Arial, sans-serif; white-space: pre-wrap;'>{body_html}</pre></body></html>"
    
    # Envia email
    success = send_email(smtp_config, recipient_email, subject, body_html)
    
    if success:
        # Marca como enviado na planilha
        update_notification_status(sheets_service, spreadsheet_id, notification['row_index'], 'enviado')
        print(f"✅ Notificação {notification_type} processada para {recipient_email}")
    else:
        # Marca como erro
        update_notification_status(sheets_service, spreadsheet_id, notification['row_index'], 'erro')
        print(f"❌ Falha ao processar notificação {notification_type} para {recipient_email}")
    
    return success

def main():
    """Função principal"""
    print("🔄 Iniciando processamento de notificações...")
    
    # Configuração SMTP
    smtp_config = {
        'server': os.environ['SMTP_SERVER'],
        'port': int(os.environ['SMTP_PORT']),
        'username': os.environ['SMTP_USERNAME'],
        'password': os.environ['SMTP_PASSWORD'],
        'from_email': os.environ['FROM_EMAIL'],
        'from_name': os.environ['FROM_NAME']
    }
    
    # Serviços Google
    sheets_service = get_google_sheets_service()
    spreadsheet_id = os.environ['MATRIX_SHEETS_ID']
    
    # Busca notificações pendentes
    notifications = get_pending_notifications(sheets_service, spreadsheet_id)
    
    if not notifications:
        print("✅ Nenhuma notificação pendente encontrada.")
        return
    
    print(f"📧 Encontradas {len(notifications)} notificações pendentes.")
    
    # Processa cada notificação
    processed = 0
    for notification in notifications:
        try:
            if process_notification(notification, smtp_config, sheets_service, spreadsheet_id):
                processed += 1
        except Exception as e:
            print(f"❌ Erro ao processar notificação: {e}")
    
    print(f"✅ Processamento concluído: {processed}/{len(notifications)} enviadas com sucesso.")

if __name__ == "__main__":
    main()
