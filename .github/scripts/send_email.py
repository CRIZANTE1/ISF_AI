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

from jinja2 import Template
from supabase import create_client, Client # PARA: Nova importação

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
        }
    </div>
</body>
</html>
'''
    },
    'invitation_email': {
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
        .urgent-box { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🚀 Você foi convidado!</h1>
            <p style="font-size: 18px;">Descubra o futuro da gestão de segurança contra incêndio</p>
        </div>
        
        <div class="content">
            <p>Olá <strong>{{recipient_name}}</strong>,</p>
            
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

            <div class="urgent-box">
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
                <li><strong>Solicite seu acesso:</strong> Clique no botão acima e faça login com sua conta Google</li>
                <li><strong>Preencha o formulário:</strong> Breve justificativa sobre seu interesse</li>
                <li><strong>Aprovação rápida:</strong> Nossa equipe analisa em até 24 horas</li>
                <li><strong>Comece a usar:</strong> Receba notificação e ambiente configurado</li>
                <li><strong>Teste por 14 dias:</strong> Explore todas as funcionalidades Premium IA</li>
            </ol>

            <div class="highlight-box">
                <h4>💬 Depoimentos de Clientes</h4>
                <p><em>"O ISF IA reduziu em 70% o tempo gasto com inspeções. A IA é incrível!"</em></p>
                <p style="text-align: right;"><strong>- João Silva, Gerente de Segurança</strong></p>
                
                <p><em>"Finalmente conseguimos centralizar todos os dados em um só lugar. Recomendo!"</em></p>
                <p style="text-align: right;"><strong>- Maria Santos, Coordenadora HSE</strong></p>
            </div>

            <h3>🎓 Recursos Disponíveis</h3>
            <ul>
                <li>📚 <a href="{{documentation_url}}">Documentação Completa</a></li>
                <li>🎥 <a href="{{video_demo_url}}">Vídeo Demonstrativo</a> (em breve)</li>
                <li>💡 <a href="{{faq_url}}">Perguntas Frequentes</a></li>
            </ul>

            <div class="urgent-box">
                <p><strong>⏰ Oferta Limitada!</strong></p>
                <p>As vagas para o trial gratuito são limitadas. Garanta a sua agora!</p>
            </div>
            
            <p><strong>Tem dúvidas? Nossa equipe está pronta para ajudar:</strong></p>
            <ul>
                <li>📧 Email: isfiasegurancanotrabalho@gmail.com</li>
            </ul>
            
            <p>Não perca esta oportunidade de transformar sua gestão de segurança!</p>
            
            <p>Atenciosamente,<br>
            <strong>Equipe ISF IA</strong><br>
            <em>Inovação e Segurança</em></p>
        </div>
        
        <div class="footer">
            <p>Este é uma notificação automática do sistema ISF IA.</p>
            <p>Você recebeu este email porque tentou acessar nossa plataforma em <strong>{{recipient_email}}</strong>.</p>
            <p>Se não foi você, por favor ignore este email.</p>
        </div>
    </div>
</body>
</html>
'''
    }

}

# PARA: Nova função para conectar ao Supabase usando variáveis de ambiente
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

# PARA: Função reescrita para buscar notificações do Supabase
def get_pending_notifications(supabase_client: Client) -> list:
    """Busca notificações pendentes da tabela do Supabase."""
    try:
        response = supabase_client.table("notificacoes_pendentes").select("*").eq("status", "pendente").execute()
        if response.data:
            # A API retorna dicionários, então não é preciso converter.
            # Renomeamos 'id' para 'row_index' para manter compatibilidade com o resto do código.
            notifications = []
            for item in response.data:
                item['row_index'] = item['id']
                notifications.append(item)
            return notifications
        return []
    except Exception as e:
        print(f"❌ Erro ao buscar notificações do Supabase: {e}")
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

# PARA: Função reescrita para atualizar o status no Supabase
def update_notification_status(supabase_client: Client, notification_id: int, status: str) -> bool:
    """Atualiza o status de uma notificação na tabela do Supabase."""
    try:
        supabase_client.table("notificacoes_pendentes").update({"status": status}).eq("id", notification_id).execute()
        return True
    except Exception as e:
        print(f"❌ Erro ao atualizar status no Supabase: {e}")
        return False

# PARA: A função process_notification agora recebe o cliente Supabase
def process_notification(notification, smtp_config, supabase_client):
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
    except Exception:
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
    
    notification_id = notification['id'] # Usa o 'id' da tabela
    
    if success:
        # Marca como enviado na tabela
        update_notification_status(supabase_client, notification_id, 'enviado')
        print(f"✅ Notificação {notification_type} processada para {recipient_email}")
    else:
        # Marca como erro
        update_notification_status(supabase_client, notification_id, 'erro')
        print(f"❌ Falha ao processar notificação {notification_type} para {recipient_email}")
    
    return success

def main():
    """Função principal"""
    print(" Iniciando processamento de notificações...")
    
    # Configuração SMTP
    smtp_config = {
        'server': os.environ['SMTP_SERVER'],
        'port': int(os.environ['SMTP_PORT']),
        'username': os.environ['SMTP_USERNAME'],
        'password': os.environ['SMTP_PASSWORD'],
        'from_email': os.environ['FROM_EMAIL'],
        'from_name': os.environ['FROM_NAME']
    }
    
    # PARA: Inicializa o cliente Supabase
    supabase_client = get_supabase_client_for_script()
    if not supabase_client:
        print("❌ Falha na conexão com o Supabase. Abortando.")
        return

    # Busca notificações pendentes do Supabase
    notifications = get_pending_notifications(supabase_client)
    
    if not notifications:
        print("✅ Nenhuma notificação pendente encontrada.")
        return
    
    print(f" Encontradas {len(notifications)} notificações pendentes.")
    
    # Processa cada notificação
    processed = 0
    for notification in notifications:
        try:
            # PARA: Passa o cliente Supabase para a função
            if process_notification(notification, smtp_config, supabase_client):
                processed += 1
        except Exception as e:
            print(f"❌ Erro ao processar notificação ID {notification.get('id')}: {e}")
    
    print(f"✅ Processamento concluído: {processed}/{len(notifications)} enviadas com sucesso.")

if __name__ == "__main__":
    main()