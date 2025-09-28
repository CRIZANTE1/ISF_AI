import argparse
import smtplib
import os
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime
from jinja2 import Template

# Templates de email
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
    }
}

def send_email(smtp_config, recipient_email, subject, body_html):
    """Envia email usando configuração SMTP"""
    
    try:
        # Cria mensagem
        msg = MIMEMultipart('alternative')
        msg['From'] = f"{smtp_config['from_name']} <{smtp_config['from_email']}>"
        msg['To'] = recipient_email
        msg['Subject'] = subject
        
        # Adiciona corpo HTML
        html_part = MIMEText(body_html, 'html', 'utf-8')
        msg.attach(html_part)
        
        # Conecta e envia
        server = smtplib.SMTP(smtp_config['server'], smtp_config['port'])
        server.starttls()
        server.login(smtp_config['username'], smtp_config['password'])
        
        text = msg.as_string()
        server.sendmail(smtp_config['from_email'], recipient_email, text)
        server.quit()
        
        print(f"✅ Email enviado com sucesso para {recipient_email}")
        return True
        
    except Exception as e:
        print(f"❌ Erro ao enviar email: {e}")
        return False

def main():
    parser = argparse.ArgumentParser(description='Enviar notificações por email')
    parser.add_argument('--type', required=True, help='Tipo da notificação')
    parser.add_argument('--email', required=True, help='Email do destinatário')
    parser.add_argument('--name', required=True, help='Nome do destinatário')
    parser.add_argument('--timestamp', required=True, help='Timestamp')
    parser.add_argument('--trial-days', default='14', help='Dias de trial')
    parser.add_argument('--login-url', required=True, help='URL de login')
    parser.add_argument('--reason', default='', help='Motivo (negações)')
    parser.add_argument('--days-left', default='3', help='Dias restantes')
    parser.add_argument('--plan-name', default='', help='Nome do plano')
    
    args = parser.parse_args()
    
    # Configuração SMTP dos secrets
    smtp_config = {
        'server': os.environ['SMTP_SERVER'],
        'port': int(os.environ['SMTP_PORT']),
        'username': os.environ['SMTP_USERNAME'], 
        'password': os.environ['SMTP_PASSWORD'],
        'from_email': os.environ['FROM_EMAIL'],
        'from_name': os.environ['FROM_NAME']
    }
    
    # Busca template
    if args.type not in EMAIL_TEMPLATES:
        print(f"❌ Tipo de notificação desconhecido: {args.type}")
        return False
    
    template_data = EMAIL_TEMPLATES[args.type]
    
    # Prepara dados para o template
    template_vars = {
        'recipient_name': args.name,
        'recipient_email': args.email,
        'trial_days': args.trial_days,
        'login_url': args.login_url,
        'reason': args.reason,
        'days_left': args.days_left,
        'plan_name': args.plan_name,
        'timestamp': args.timestamp
    }
    
    # Renderiza template
    subject_template = Template(template_data['subject'])
    body_template = Template(template_data['template'])
    
    subject = subject_template.render(**template_vars)
    body_text = body_template.render(**template_vars)
    
    # Converte texto para HTML básico
    body_html = body_text.replace('\n', '<br>\n')
    body_html = f"<html><body><pre style='font-family: Arial, sans-serif; white-space: pre-wrap;'>{body_html}</pre></body></html>"
    
    # Envia email
    success = send_email(smtp_config, args.email, subject, body_html)
    
    if success:
        print(f"✅ Notificação '{args.type}' enviada para {args.email}")
    else:
        print(f"❌ Falha ao enviar notificação '{args.type}' para {args.email}")
    
    return success

if __name__ == "__main__":
    main()
