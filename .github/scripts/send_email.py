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
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Acesso Aprovado - ISF IA</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .info-box { background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .feature-list { background-color: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; }
        .action-button { display: inline-block; background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .action-button:hover { background-color: #218838; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Bem-vindo ao ISF IA!</h1>
            <p>Seu acesso foi aprovado com sucesso</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{recipient_name}}</strong>,</p>
            
            <div class="info-box">
                <h3>✅ Detalhes da sua conta</h3>
                <ul>
                    <li><strong>Plano:</strong> Premium IA (Trial)</li>
                    <li><strong>Duração do teste:</strong> {{trial_days}} dias</li>
                    <li><strong>Acesso:</strong> Completo a todas as funcionalidades</li>
                </ul>
            </div>

            <h3>🚀 Como começar</h3>
            <ol>
                <li>Acesse o sistema através do botão abaixo</li>
                <li>Faça login com o mesmo email (<strong>{{recipient_email}}</strong>)</li>
                <li>Explore todas as funcionalidades disponíveis</li>
            </ol>

            <div style="text-align: center;">
                <a href="{{login_url}}" class="action-button">🚀 Acessar Sistema ISF IA</a>
            </div>

            <div class="feature-list">
                <h4>💡 Durante o trial você terá acesso a:</h4>
                <ul>
                    <li>✨ Processamento automático com IA</li>
                    <li>📄 Extração de dados de PDFs</li>
                    <li>🔍 Análise inteligente de documentos</li>
                    <li>📊 Relatórios com insights avançados</li>
                    <li>🎯 Suporte prioritário</li>
                </ul>
            </div>

            <div class="info-box">
                <h4>⏰ Importante</h4>
                <p>Seu trial expira em <strong>{{trial_days}} dias</strong>. Para garantir continuidade, você pode contratar um plano através do seu perfil no sistema.</p>
            </div>
            
            <p>Em caso de dúvidas, responda este email ou entre em contato conosco.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe ISF IA</strong></p>
        </div>
        
        <div class="footer">
            <p>Esta é uma notificação automática do sistema de gestão ISF IA.</p>
        </div>
    </div>
</body>
</html>
'''
    },
    
    'access_denied': {
        'subject': '❌ Solicitação de acesso - ISF IA',
        'template': '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Solicitação de Acesso - ISF IA</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #6c757d, #5a6268); color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .info-box { background-color: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📋 Solicitação de Acesso</h1>
            <p>Sistema ISF IA</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{recipient_name}}</strong>,</p>
            
            <p>Obrigado por seu interesse no Sistema ISF IA.</p>

            <div class="info-box">
                <p>Infelizmente, não pudemos aprovar sua solicitação de acesso neste momento.</p>
                {% if reason %}
                <p><strong>Motivo:</strong> {{reason}}</p>
                {% endif %}
            </div>

            <p>Você pode solicitar acesso novamente a qualquer momento. Para mais informações, entre em contato conosco.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe ISF IA</strong></p>
        </div>
        
        <div class="footer">
            <p>Esta é uma notificação automática do sistema de gestão ISF IA.</p>
        </div>
    </div>
</body>
</html>
'''
    },
    
    'trial_expiring': {
        'subject': '⏰ Seu trial expira em {{days_left}} dias - ISF IA',
        'template': '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Trial Expirando - ISF IA</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #ffc107, #ff9800); color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .alert-box { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .plan-box { background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 10px 0; }
        .action-button { display: inline-block; background-color: #ffc107; color: #212529; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .action-button:hover { background-color: #e0a800; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>⏰ Seu Trial Está Acabando</h1>
            <p>Não perca o acesso ao ISF IA</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{recipient_name}}</strong>,</p>
            
            <p>Esperamos que esteja aproveitando o Sistema ISF IA!</p>

            <div class="alert-box">
                <h3>⏰ Aviso importante</h3>
                <p>Seu período de teste expira em <strong>{{days_left}} dias</strong>.</p>
            </div>

            <h3>🔄 Para continuar usando o sistema:</h3>
            <ol>
                <li>Acesse seu perfil no sistema</li>
                <li>Vá em "Planos e Pagamento"</li>
                <li>Escolha o plano que melhor atende suas necessidades</li>
            </ol>

            <div style="text-align: center;">
                <a href="{{login_url}}" class="action-button">💎 Ver Planos Disponíveis</a>
            </div>

            <h3>💎 Nossos planos:</h3>
            <div class="plan-box">
                <strong>Pro</strong> (R$ 39,90/mês)<br>
                Funcionalidades completas para gestão profissional
            </div>
            <div class="plan-box">
                <strong>Premium IA</strong> (R$ 69,90/mês)<br>
                Automação completa com Inteligência Artificial
            </div>

            <div class="alert-box">
                <p><strong>⚠️ Importante:</strong> Não perca seus dados e configurações! Efetue a contratação antes do vencimento.</p>
            </div>
            
            <p>Em caso de dúvidas, estamos aqui para ajudar.</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe ISF IA</strong></p>
        </div>
        
        <div class="footer">
            <p>Esta é uma notificação automática do sistema de gestão ISF IA.</p>
        </div>
    </div>
</body>
</html>
'''
    },
    
    'payment_confirmed': {
        'subject': '✅ Pagamento confirmado - {{plan_name}} - ISF IA',
        'template': '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pagamento Confirmado - ISF IA</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #28a745, #20c997); color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .success-box { background-color: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .info-box { background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .action-button { display: inline-block; background-color: #28a745; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .action-button:hover { background-color: #218838; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>✅ Pagamento Confirmado!</h1>
            <p>Obrigado por confiar no ISF IA</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{recipient_name}}</strong>,</p>
            
            <div class="success-box">
                <h3>🎉 Pagamento confirmado com sucesso!</h3>
            </div>

            <div class="info-box">
                <h3>✅ Detalhes da assinatura</h3>
                <ul>
                    <li><strong>Plano contratado:</strong> {{plan_name}}</li>
                    <li><strong>Status:</strong> Ativo</li>
                    <li><strong>Próxima cobrança:</strong> 30 dias</li>
                </ul>
            </div>

            <p>Seu acesso completo já está liberado. Continue aproveitando todas as funcionalidades do ISF IA!</p>

            <div style="text-align: center;">
                <a href="{{login_url}}" class="action-button">🚀 Acessar Sistema</a>
            </div>
            
            <p>Obrigado por confiar em nosso sistema!</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe ISF IA</strong></p>
        </div>
        
        <div class="footer">
            <p>Esta é uma notificação automática do sistema de gestão ISF IA.</p>
        </div>
    </div>
</body>
</html>
'''
    },
    
    'new_access_request': {
        'subject': '🔔 Nova solicitação de acesso - ISF IA',
        'template': '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Solicitação - ISF IA</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #007bff, #0056b3); color: white; padding: 20px; text-align: center; }
        .content { padding: 30px; }
        .info-box { background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0; }
        .user-box { background-color: #f8f9fa; border-left: 4px solid #007bff; padding: 15px; margin: 20px 0; }
        .action-button { display: inline-block; background-color: #007bff; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
        .action-button:hover { background-color: #0056b3; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔔 Nova Solicitação de Acesso</h1>
            <p>Sistema ISF IA</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>Administrador</strong>,</p>
            
            <div class="info-box">
                <h3>📬 Nova solicitação de acesso recebida!</h3>
            </div>

            <div class="user-box">
                <h4>👤 Dados do solicitante</h4>
                <ul>
                    <li><strong>Nome:</strong> {{requesting_user_name}}</li>
                    <li><strong>Email:</strong> {{requesting_user_email}}</li>
                    <li><strong>Data da solicitação:</strong> {{timestamp}}</li>
                </ul>
            </div>

            <div class="user-box">
                <h4>💭 Justificativa</h4>
                <p>{{justification}}</p>
            </div>

            <div class="info-box">
                <h4>🎯 Ação necessária</h4>
                <p>Acesse o painel administrativo para aprovar ou rejeitar a solicitação:</p>
                <ol>
                    <li>Clique no botão abaixo para acessar o sistema</li>
                    <li>Vá em: <strong>Super Admin → Solicitações</strong></li>
                    <li>Analise e processe a solicitação</li>
                </ol>
            </div>

            <div style="text-align: center;">
                <a href="{{admin_panel_url}}" class="action-button">🔧 Acessar Painel Admin</a>
            </div>
            
            <p>Atenciosamente,<br>
            <strong>Sistema ISF IA</strong></p>
        </div>
        
        <div class="footer">
            <p>Esta é uma notificação automática do sistema de gestão ISF IA.</p>
        </div>
    </div>
</body>
</html>
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
    body_html = body_template.render(**template_vars)  # JÁ É HTML COMPLETO!
    
    # NÃO precisa mais converter - o template já é HTML!
    
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
