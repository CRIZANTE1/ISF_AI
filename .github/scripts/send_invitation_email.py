"""
Script para processar e enviar emails de convite para usuários não autorizados
Executa via GitHub Actions quando detecta tentativas de acesso
"""

import json
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from jinja2 import Template
from google.oauth2 import service_account
from googleapiclient.discovery import build
import logging

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

INVITATION_EMAIL_TEMPLATE = {
    'subject': '🚀 Convite Especial - ISF IA | Sistema de Gestão de Inspeções',
    'template': '''
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Convite Especial - ISF IA</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4; }
        .container { max-width: 800px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 30px; text-align: center; }
        .content { padding: 30px; }
        .highlight-box { background-color: #f0f4ff; border-left: 4px solid #667eea; padding: 20px; margin: 20px 0; border-radius: 5px; }
        .feature-list { background-color: #f8f9fa; border-radius: 5px; padding: 20px; margin: 20px 0; }
        .action-button { display: inline-block; background-color: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; font-size: 16px; }
        .action-button:hover { background-color: #5568d3; }
        .stats-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
        .stat-box { background-color: #f8f9fa; padding: 15px; border-radius: 5px; text-align: center; }
        .stat-number { font-size: 24px; font-weight: bold; color: #667eea; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #6c757d; border-top: 1px solid #dee2e6; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Você foi convidado!</h1>
            <p style="font-size: 18px;">Descubra o futuro da gestão de segurança contra incêndio</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{recipient_email}}</strong>,</p>
            
            <p>Notamos que você tentou acessar o <strong>ISF IA</strong> - Sistema Integrado de Segurança contra Incêndio com Inteligência Artificial.</p>
            
            <div class="highlight-box">
                <h3>✨ Você está a um clique de revolucionar sua gestão de segurança!</h3>
                <p>O ISF IA é a plataforma mais avançada do mercado para gestão, inspeção e manutenção de equipamentos de combate a incêndio.</p>
            </div>

            <h3>🎯 Por que escolher o ISF IA?</h3>
            
            <div class="stats-grid">
                <div class="stat-box">
                    <div class="stat-number">80%</div>
                    <div>Redução de tempo</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">100%</div>
                    <div>Conformidade</div>
                </div>
                <div class="stat-box">
                    <div class="stat-number">24/7</div>
                    <div>Acesso aos dados</div>
                </div>
            </div>

            <div class="feature-list">
                <h4>💡 Principais Funcionalidades:</h4>
                <ul>
                    <li>🤖 <strong>IA Avançada:</strong> Extração automática de dados de PDFs e relatórios</li>
                    <li>📱 <strong>Inspeção Digital:</strong> QR Code, geolocalização e fotos integradas</li>
                    <li>📊 <strong>Dashboards Interativos:</strong> Visualize tudo em tempo real</li>
                    <li>🔧 <strong>Gestão Completa:</strong> Extintores, mangueiras, SCBAs, chuveiros e muito mais</li>
                    <li>📄 <strong>Relatórios Automáticos:</strong> Mensais, anuais e personalizados</li>
                    <li>☁️ <strong>100% em Nuvem:</strong> Google Sheets e Drive para máxima segurança</li>
                </ul>
            </div>

            <div class="highlight-box">
                <h3>🎁 Oferta Especial para Novos Usuários</h3>
                <p><strong>14 dias de Trial Premium IA GRATUITO!</strong></p>
                <p>Teste todas as funcionalidades avançadas sem compromisso.</p>
                <ul>
                    <li>✅ Acesso completo ao plano Premium IA</li>
                    <li>✅ Processamento ilimitado com IA</li>
                    <li>✅ Suporte prioritário</li>
                    <li>✅ Sem cartão de crédito necessário</li>
                </ul>
            </div>

            <div style="text-align: center;">
                <a href="{{request_access_url}}" class="action-button">🚀 Solicitar Acesso Gratuito Agora</a>
            </div>

            <h3>📋 Como Funciona?</h3>
            <ol>
                <li><strong>Solicite seu acesso:</strong> Clique no botão acima e preencha um breve formulário</li>
                <li><strong>Aprovação rápida:</strong> Nossa equipe analisa em até 24 horas</li>
                <li><strong>Comece a usar:</strong> Receba suas credenciais e ambiente configurado</li>
                <li><strong>Teste por 14 dias:</strong> Explore todas as funcionalidades Premium IA</li>
            </ol>

            <div class="highlight-box">
                <h4>💬 Depoimentos de Clientes</h4>
                <p><em>"O ISF IA reduziu em 70% o tempo gasto com inspeções. A IA é incrível!"</em></p>
                <p style="text-align: right;"><strong>- João Silva, Gerente de Segurança</strong></p>
            </div>

            <h3>🎓 Recursos Adicionais</h3>
            <ul>
                <li>📚 <a href="{{documentation_url}}">Documentação Completa</a></li>
                <li>🎥 <a href="{{video_demo_url}}">Vídeo Demonstrativo</a></li>
                <li>💡 <a href="{{faq_url}}">Perguntas Frequentes</a></li>
            </ul>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
                <p><strong>⏰ Oferta Limitada!</strong></p>
                <p>As vagas para o trial gratuito são limitadas. Garanta a sua agora!</p>
            </div>
            
            <p>Tem dúvidas? Nossa equipe está pronta para ajudar:</p>
            <ul>
                <li>📧 Email: cristian.ferreira.carlos@gmail.com</li>
                <li>💼 LinkedIn: <a href="https://www.linkedin.com/in/cristian-ferreira-carlos-256b19161/">Cristian Ferreira Carlos</a></li>
            </ul>
            
            <p>Atenciosamente,<br>
            <strong>Equipe ISF IA</strong><br>
            <em>Inovação e Segurança</em></p>
        </div>
        
        <div class="footer">
            <p>Este é um convite automático do sistema ISF IA.</p>
            <p>Você recebeu este email porque tentou acessar nossa plataforma.</p>
            <p>Se não foi você, por favor ignore este email.</p>
        </div>
    </div>
</body>
</html>
'''
}

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
        try:
            invitations_range = "convites_enviados!A:B"
            invitations_result = sheets_service.spreadsheets().values().get(
                spreadsheetId=spreadsheet_id,
                range=invitations_range
            ).execute()
            invited_emails = [row[0] for row in invitations_result.get('values', [])[1:] if row]
        except:
            invited_emails = []
            logger.info("Aba de convites não existe, será criada")
        
        # Processa tentativas de acesso não autorizadas
        unauthorized_attempts = []
        for i, row in enumerate(values[1:], 2):
            if len(row) >= 3:
                action = row[2] if len(row) > 2 else ""
                details = row[3] if len(row) > 3 else ""
                
                if action == "ACCESS_DENIED_UNAUTHORIZED" and "Email:" in details:
                    email = details.split("Email:")[1].strip()
                    
                    if email and email not in invited_emails:
                        attempt = {
                            'timestamp': row[0],
                            'email': email,
                            'row_index': i
                        }
                        unauthorized_attempts.append(attempt)
                        logger.info(f"Encontrada tentativa não autorizada: {email}")
        
        logger.info(f"Total de convites pendentes: {len(unauthorized_attempts)}")
        return unauthorized_attempts
        
    except Exception as e:
        logger.error(f"Erro ao buscar tentativas de acesso: {e}")
        return []

def send_invitation_email(smtp_config, recipient_email, app_url):
    """Envia email de convite"""
    try:
        logger.info(f"Enviando convite para {recipient_email}")
        
        msg = MIMEMultipart('alternative')
        
        # Limpa e valida os campos
        from_name = smtp_config['from_name'].strip()
        from_email = smtp_config['from_email'].strip()
        recipient_email = recipient_email.strip()
        
        template_data = INVITATION_EMAIL_TEMPLATE
        
        # Dados para o template
        template_vars = {
            'recipient_email': recipient_email,
            'request_access_url': f"{app_url}",
            'documentation_url': "https://github.com/seu-usuario/isf_ia",
            'video_demo_url': f"{app_url}",
            'faq_url': f"{app_url}"
        }
        
        # Renderiza template
        subject_template = Template(template_data['subject'])
        body_template = Template(template_data['template'])
        
        subject = subject_template.render(**template_vars)
        body_html = body_template.render(**template_vars)
        
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
        
        logger.info(f"Convite enviado com sucesso para {recipient_email}")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao enviar convite para {recipient_email}: {e}")
        return False

def register_sent_invitation(sheets_service, spreadsheet_id, email):
    """Registra que um convite foi enviado"""
    try:
        logger.info(f"Registrando convite enviado para {email}")
        
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        
        # Tenta adicionar na aba de convites enviados
        try:
            range_name = "convites_enviados!A:B"
            body = {'values': [[email, timestamp]]}
            
            sheets_service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range=range_name,
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
        except:
            # Se a aba não existe, cria ela
            logger.info("Criando aba de convites enviados...")
            
            request_body = {
                'requests': [{
                    'addSheet': {
                        'properties': {
                            'title': 'convites_enviados'
                        }
                    }
                }]
            }
            
            sheets_service.spreadsheets().batchUpdate(
                spreadsheetId=spreadsheet_id,
                body=request_body
            ).execute()
            
            # Adiciona cabeçalho
            headers = [['email', 'data_envio']]
            sheets_service.spreadsheets().values().update(
                spreadsheetId=spreadsheet_id,
                range='convites_enviados!A1:B1',
                valueInputOption='RAW',
                body={'values': headers}
            ).execute()
            
            # Adiciona o registro
            body = {'values': [[email, timestamp]]}
            sheets_service.spreadsheets().values().append(
                spreadsheetId=spreadsheet_id,
                range='convites_enviados!A:B',
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
        
        logger.info(f"Convite registrado com sucesso para {email}")
        return True
        
    except Exception as e:
        logger.error(f"Erro ao registrar convite: {e}")
        return False

def main():
    """Função principal"""
    try:
        logger.info("🔄 Iniciando processamento de convites...")
        
        # Verificar variáveis de ambiente
        required_vars = ['SMTP_SERVER', 'SMTP_PORT', 'SMTP_USERNAME', 'SMTP_PASSWORD', 
                        'FROM_EMAIL', 'FROM_NAME', 'GOOGLE_CREDENTIALS', 'MATRIX_SHEETS_ID', 'APP_URL']
        
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
        
        app_url = os.environ['APP_URL']
        
        # Serviços Google
        sheets_service = get_google_sheets_service()
        spreadsheet_id = os.environ['MATRIX_SHEETS_ID']
        
        # Busca tentativas de acesso não autorizadas
        attempts = get_unauthorized_access_attempts(sheets_service, spreadsheet_id)
        
        if not attempts:
            logger.info("✅ Nenhuma tentativa de acesso sem convite encontrada.")
            return
        
        logger.info(f"📧 Encontradas {len(attempts)} pessoas para convidar.")
        
        # Processa cada tentativa
        sent = 0
        for attempt in attempts:
            try:
                if send_invitation_email(smtp_config, attempt['email'], app_url):
                    if register_sent_invitation(sheets_service, spreadsheet_id, attempt['email']):
                        sent += 1
            except Exception as e:
                logger.error(f"Erro ao processar convite para {attempt['email']}: {e}")
        
        logger.info(f"✅ Processamento concluído: {sent}/{len(attempts)} convites enviados com sucesso.")
        
    except Exception as e:
        logger.error(f"Erro crítico no processamento de convites: {e}")
        import traceback
        logger.error(traceback.format_exc())
        raise

if __name__ == "__main__":
    main()
