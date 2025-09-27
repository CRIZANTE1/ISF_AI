import streamlit as st
import streamlit.components.v1 as components
import sys
import os
import pandas as pd
from datetime import date, timedelta
import re
import requests
import logging

# Adiciona o diretório raiz ao path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.auth_utils import (
    get_user_display_name, get_user_email, get_user_info,
    get_effective_user_plan, get_effective_user_status, is_on_trial
)
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import USERS_SHEET_NAME
from utils.auditoria import log_action
from config.page_config import set_page_config
from utils.webhook_handler import (
    simulate_payment_webhook, set_payment_success_message, 
    get_payment_success_message, clear_payment_success_message
)

set_page_config()

# Configuração de logging
logger = logging.getLogger(__name__)

# Configuração dos planos
PLANOS_CONFIG = {
    "basico": {
        "nome": "Plano Básico", 
        "preco": 0.00,
        "descricao": "Acesso limitado para visualização de dados.",
        "recursos": [
            "📊 Resumo gerencial completo",
            "📋 Visualização de todos os dados",
            "📊 Relatórios básicos",
            "📞 Suporte via documentação"
        ]
    },
    "pro": {
        "nome": "Plano Pro", 
        "preco": 39.90,
        "descricao": "Gestão completa com todas as funcionalidades operacionais.",
        "recursos": [
            "✅ Todas as funcionalidades do Básico",
            "✏️ Registro e edição completa de dados",
            "📱 Inspeções manuais e QR Code",
            "📊 Dashboards interativos avançados",
            "🔧 Sistema de ações corretivas",
            "📄 Relatórios personalizados",
            "📞 Suporte prioritário via email"
        ]
    },
    "premium_ia": {
        "nome": "Plano Premium IA", 
        "preco": 69.90,
        "descricao": "Automação completa com Inteligência Artificial avançada.",
        "recursos": [
            "✅ Todas as funcionalidades do Pro",
            "🤖 Processamento automático com IA",
            "📄 Extração automática de dados de PDFs",
            "🧠 Análise inteligente de documentos",
            "⚡ Automações avançadas de workflow",
            "🎯 Relatórios com insights de IA",
            "📞 Suporte VIP 24/7 prioritário"
        ]
    }
}

class MercadoPagoPayment:
    """Classe para integração com pagamentos do Mercado Pago"""
    
    def __init__(self):
        # Busca as configurações do Mercado Pago nos secrets
        try:
            self.public_key = st.secrets["mercadopago"]["public_key"]
            self.api_url = st.secrets["payment"]["api_url"]
        except KeyError as e:
            logger.error(f"Configuração de pagamento não encontrada: {e}")
            self.public_key = None
            self.api_url = None
        
    def render_payment_form(self, plan_type: str, user_email: str, user_name: str):
        """Renderiza o formulário de pagamento integrado com Mercado Pago"""
        
        if not self.public_key or not self.api_url:
            st.error("⚠️ **Configuração de pagamento não encontrada**")
            st.warning("Entre em contato com o suporte para ativar os pagamentos.")
            return
            
        plan_info = PLANOS_CONFIG.get(plan_type)
        if not plan_info:
            st.error("❌ Plano inválido selecionado.")
            return

        # Container para o formulário de pagamento
        with st.container():
            st.markdown("### 💳 Finalizar Pagamento")
            
            # Resumo detalhado do pedido
            with st.expander("📋 Resumo do Pedido", expanded=True):
                col1, col2 = st.columns([2, 1])
                with col1:
                    st.markdown(f"**{plan_info['nome']}**")
                    st.caption(plan_info['descricao'])
                    
                    # Mostra alguns recursos principais
                    for recurso in plan_info['recursos'][:3]:
                        st.markdown(f"• {recurso}")
                        
                with col2:
                    st.markdown(f"### R$ {plan_info['preco']:.2f}")
                    st.markdown("*por mês*")
                    st.caption("💳 Parcelamento disponível")

        # Carrega e renderiza o template HTML
        html_template_path = os.path.join(os.path.dirname(__file__), 'templates', 'payment_form.html')
        
        try:
            with open(html_template_path, 'r', encoding='utf-8') as f:
                payment_html_template = f.read()
            
            # Substitui as variáveis no template
            payment_html = payment_html_template.format(
                public_key=self.public_key,
                user_name=user_name,
                plan_type=plan_type,
                user_email=user_email,
                api_url=self.api_url,
                price=f"{plan_info['preco']:.2f}",
                plan_name=plan_info['nome']
            )
            
            # Renderiza o formulário com altura adequada
            components.html(payment_html, height=800, scrolling=True)
            
            # JavaScript para capturar mensagens do iframe
            message_handler = """
            <script>
                window.addEventListener("message", function(event) {
                    console.log("Received message:", event.data);
                    
                    if (event.data.type === "payment_success") {
                        // Mostrar mensagem de sucesso
                        alert("✅ Pagamento aprovado! Sua conta será ativada em instantes.");
                        // Recarregar página após um tempo
                        setTimeout(function() {
                            window.location.reload();
                        }, 2000);
                    } else if (event.data.type === "payment_pending") {
                        alert("⏳ Pagamento pendente. Aguarde a confirmação.");
                    } else if (event.data.type === "payment_error") {
                        console.error("Payment error:", event.data.message);
                    }
                });
            </script>
            """
            
            components.html(message_handler, height=0)
            
        except FileNotFoundError:
            st.error(f"❌ **Template de pagamento não encontrado**")
            st.info(f"Esperado em: `{html_template_path}`")
            st.warning("Verifique se o diretório 'templates' existe na pasta 'views' com o arquivo 'payment_form.html'")
        except Exception as e:
            st.error(f"❌ Erro ao carregar o formulário de pagamento: {e}")

def update_user_profile(user_email: str, updated_data: dict):
    """Atualiza os dados do perfil do usuário de forma segura"""
    try:
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        users_data = matrix_uploader.get_data_from_sheet(USERS_SHEET_NAME)
        
        if not users_data or len(users_data) < 2:
            logger.error("Dados de usuários não encontrados ou vazios")
            return False
        
        headers = users_data[0]
        df_users = pd.DataFrame(users_data[1:], columns=headers)
        
        # Encontra o usuário
        user_row = df_users[df_users['email'].str.lower() == user_email.lower()]
        
        if user_row.empty:
            logger.error(f"Usuário não encontrado: {user_email}")
            return False
            
        row_index = user_row.index[0] + 2  # +2 para cabeçalho e índice baseado em 1
        
        # Mapeia os campos que podem ser atualizados
        updatable_fields = {
            'nome': 'nome',
            'telefone': 'telefone', 
            'empresa': 'empresa',
            'cargo': 'cargo'
        }
        
        # Atualiza cada campo individualmente
        for data_key, col_name in updatable_fields.items():
            if col_name in headers and data_key in updated_data:
                col_index = headers.index(col_name)
                col_letter = chr(ord('A') + col_index)  # Converte índice para letra
                
                matrix_uploader.update_cells(
                    USERS_SHEET_NAME, 
                    f"{col_letter}{row_index}", 
                    [[updated_data[data_key]]]
                )
        
        # Log da ação
        log_action("ATUALIZOU_PERFIL", f"Email: {user_email}, Campos: {list(updated_data.keys())}")
        logger.info(f"Perfil atualizado com sucesso para {user_email}")
        
        return True
        
    except Exception as e:
        logger.error(f"Erro ao atualizar perfil: {e}")
        st.error(f"Erro ao atualizar perfil: {e}")
        return False

def show_contact_info():
    """Exibe informações de contato de suporte"""
    st.markdown("""
    ### 📞 Precisa de Ajuda?
    
    **Entre em contato conosco:**
    - 📧 **Email:** cristian.ferreira.carlos@gmail.com  
    - 💼 **LinkedIn:** [Cristian Ferreira Carlos](https://www.linkedin.com/in/cristian-carlos-256b19161/)
    - 📱 **WhatsApp:** Em breve disponível
    - 🌐 **Documentação:** [Acesse nosso guia](https://github.com/seu-usuario/isf_ia)
    
    **Horário de Atendimento:**
    - Segunda a Sexta: 8h às 18h
    - Plano Premium IA: Suporte 24/7
    """)

def show_page():
    """Função principal da página de perfil"""
    st.title("👤 Meu Perfil e Configurações")
    
    # Verifica autenticação
    user_email = get_user_email()
    if not user_email:
        st.error("❌ Usuário não autenticado.")
        st.stop()
    
    # Carrega informações do usuário
    user_info = get_user_info()
    user_name = get_user_display_name()
    current_plan = get_effective_user_plan()
    user_status = get_effective_user_status()
    is_trial = is_on_trial()
    real_plan = user_info.get('plano', 'basico') if user_info else 'basico'
    
    # Verifica mensagem de pagamento bem-sucedido
    payment_success = get_payment_success_message()
    if payment_success:
        st.success("🎉 **Pagamento realizado com sucesso!** Seu plano foi ativado.")
        st.balloons()
        clear_payment_success_message()
        st.cache_data.clear()

    # Interface principal com tabs
    tab_profile, tab_plan_and_payment, tab_support = st.tabs([
        "📝 Meus Dados", 
        "💎 Planos e Pagamento", 
        "🆘 Suporte"
    ])
    
    # =================== ABA: MEUS DADOS ===================
    with tab_profile:
        st.header("📋 Informações do Perfil")
        
        # Status e plano atual
        col1, col2 = st.columns(2)
        with col1:
            if user_status == "ativo":
                st.success(f"✅ **Status:** {user_status.title()}")
            else:
                st.warning(f"⚠️ **Status:** {user_status.title()}")
                
        with col2:
            plan_display = PLANOS_CONFIG.get(current_plan, {}).get('nome', current_plan.title())
            if is_trial:
                st.info(f"🚀 **Plano:** {plan_display} (Trial)")
            else:
                st.info(f"💎 **Plano:** {plan_display}")
        
        # Informações do trial
        if is_trial:
            trial_end = user_info.get('trial_end_date')
            if trial_end and isinstance(trial_end, date):
                days_left = (trial_end - date.today()).days
                if days_left > 0:
                    st.info(f"⏰ **Trial Premium:** {days_left} dias restantes até {trial_end.strftime('%d/%m/%Y')}")
                else:
                    st.warning("⏰ **Trial Premium:** Expirado")

        st.markdown("---")
        
        # Formulário de edição de perfil
        with st.form("profile_form"):
            st.subheader("✏️ Editar Dados Pessoais")
            
            # Campo nome (obrigatório)
            new_name = st.text_input(
                "Nome Completo *", 
                value=user_info.get('nome', user_name),
                help="Nome completo como deve aparecer nos relatórios"
            )
            
            # Email (somente leitura)
            st.text_input(
                "Email", 
                value=user_email, 
                disabled=True,
                help="Email não pode ser alterado"
            )
            
            # Campos adicionais em expander
            with st.expander("📋 Informações Complementares", expanded=False):
                new_phone = st.text_input(
                    "Telefone", 
                    value=user_info.get('telefone', ''), 
                    placeholder="(11) 99999-9999",
                    help="Telefone para contato de suporte"
                )
                
                new_company = st.text_input(
                    "Empresa", 
                    value=user_info.get('empresa', ''), 
                    placeholder="Nome da sua empresa",
                    help="Empresa onde você trabalha"
                )
                
                new_position = st.text_input(
                    "Cargo", 
                    value=user_info.get('cargo', ''), 
                    placeholder="Seu cargo na empresa",
                    help="Seu cargo ou função"
                )

            # Botão de submit
            if st.form_submit_button("💾 Salvar Alterações", type="primary", use_container_width=True):
                if not new_name.strip():
                    st.error("❌ O nome não pode estar vazio.")
                else:
                    # Prepara dados para atualização
                    updated_data = {
                        'nome': new_name.strip(),
                        'telefone': new_phone.strip(),
                        'empresa': new_company.strip(), 
                        'cargo': new_position.strip()
                    }
                    
                    with st.spinner("💾 Salvando alterações..."):
                        if update_user_profile(user_email, updated_data):
                            st.success("✅ Perfil atualizado com sucesso!")
                            st.cache_data.clear()
                            st.rerun()
                        else:
                            st.error("❌ Erro ao atualizar perfil. Tente novamente.")

    # =================== ABA: PLANOS E PAGAMENTO ===================
    with tab_plan_and_payment:
        # Estado inicial: usuário não selecionou plano para pagar
        if 'selected_plan_to_pay' not in st.session_state:
            st.header("💎 Nossos Planos")
            
            # Informação sobre trial
            if is_trial:
                st.info("🚀 **Você está em um período de teste Premium!** Contrate um plano abaixo para garantir acesso contínuo após o término do trial.")
            
            # Determina quais planos mostrar
            plans_to_show = []
            if is_trial or real_plan == 'basico':
                plans_to_show = ['pro', 'premium_ia']
            elif real_plan == 'pro':
                plans_to_show = ['premium_ia']
    
            if not plans_to_show and not is_trial:
                st.success("🎉 Parabéns! Você já possui nosso plano mais completo!")
                st.balloons()
            else:
                # Exibe os planos disponíveis
                if plans_to_show:
                    cols = st.columns(len(plans_to_show))
                    
                    for i, plan_key in enumerate(plans_to_show):
                        with cols[i]:
                            plan_info = PLANOS_CONFIG[plan_key]
                            
                            # Container do plano
                            with st.container(border=True, height=500):
                                # Cabeçalho do plano
                                if plan_key == 'premium_ia':
                                    st.markdown("🌟 **MAIS POPULAR**")
                                
                                st.subheader(plan_info['nome'])
                                st.markdown(f"## R$ {plan_info['preco']:.2f}")
                                st.caption("*por mês*")
                                st.markdown(f"*{plan_info['descricao']}*")
                                
                                st.markdown("---")
                                
                                # Lista de recursos
                                st.markdown("**Recursos inclusos:**")
                                for feature in plan_info['recursos']:
                                    st.markdown(f"• {feature}")
                            
                            # Botão de contratação
                            button_label = f"🚀 Contratar {plan_info['nome']}"
                            if st.button(button_label, key=f"btn_{plan_key}", type="primary", use_container_width=True):
                                
                                # Wake-up call para o backend (opcional)
                                try:
                                    api_url = st.secrets.get("payment", {}).get("api_url")
                                    if api_url:
                                        st.toast("Preparando o formulário de pagamento...", icon="💳")
                                        # Chama endpoint de ping para acordar o servidor
                                        requests.get(f"{api_url}/ping", timeout=3)
                                        logger.info(f"Ping enviado para {api_url}")
                                except Exception as e:
                                    logger.warning(f"Ping falhou: {e}")
    
                                st.session_state.selected_plan_to_pay = plan_key
                                st.rerun()
    
        # Estado 2: usuário selecionou um plano
        else:
            selected_plan = st.session_state.selected_plan_to_pay
            plan_info = PLANOS_CONFIG[selected_plan]
            
            st.header(f"💳 Finalizar Contratação")
            st.subheader(f"{plan_info['nome']}")
            
            # Renderiza o formulário de pagamento
            payment_integration = MercadoPagoPayment()
            payment_integration.render_payment_form(
                plan_type=selected_plan, 
                user_email=user_email, 
                user_name=user_name
            )
    
            # Botão para voltar
            col1, col2 = st.columns([1, 1])
            with col1:
                if st.button("⬅️ Escolher outro plano", use_container_width=True):
                    del st.session_state.selected_plan_to_pay
                    st.rerun()
            
            # Simulação para desenvolvimento (só em debug mode)
            with col2:
                if st.secrets.get("debug_mode", False):
                    if st.button("🧪 Simular Pagamento (Debug)", use_container_width=True):
                        if simulate_payment_webhook(user_email, selected_plan):
                            set_payment_success_message(selected_plan)
                            del st.session_state.selected_plan_to_pay
                            st.rerun()

    # =================== ABA: SUPORTE ===================
    with tab_support:
        st.header("🆘 Central de Suporte")
        
        # Mostra nível de suporte baseado no plano
        support_levels = {
            'basico': {'level': 'Email', 'response': '48-72h', 'color': 'blue'},
            'pro': {'level': 'Prioritário', 'response': '24-48h', 'color': 'green'}, 
            'premium_ia': {'level': 'VIP 24/7', 'response': '2-6h', 'color': 'orange'}
        }
        
        support_info = support_levels.get(current_plan, support_levels['basico'])
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Seu Nível de Suporte", support_info['level'])
        with col2:
            st.metric("Tempo de Resposta", support_info['response'])
        
        st.markdown("---")
        
        # Formulário de suporte
        with st.form("support_form"):
            st.subheader("📝 Enviar Solicitação de Suporte")
            
            support_type = st.selectbox(
                "Tipo da Solicitação", 
                ["Dúvida sobre o Sistema", "Problema Técnico", "Solicitação de Recurso", "Bug Report", "Elogio/Sugestão"]
            )
            
            subject = st.text_input(
                "Assunto *", 
                placeholder="Descreva brevemente o problema ou dúvida"
            )
            
            message = st.text_area(
                "Descrição Detalhada *", 
                height=150,
                placeholder="Descreva em detalhes sua solicitação, incluindo passos para reproduzir problemas (se aplicável)..."
            )
            
            # Prioridade baseada no plano
            if current_plan == 'premium_ia':
                priority = st.selectbox("Prioridade", ["Normal", "Alta", "Crítica"])
            else:
                priority = "Normal"
                
            if st.form_submit_button("📤 Enviar Solicitação", type="primary", use_container_width=True):
                if not subject.strip() or not message.strip():
                    st.error("❌ Por favor, preencha o assunto e a mensagem.")
                else:
                    # Log da solicitação de suporte
                    support_details = f"Tipo: {support_type}, Assunto: {subject[:50]}..."
                    log_action("SOLICITACAO_SUPORTE", support_details)
                    
                    st.success("✅ **Solicitação enviada com sucesso!**")
                    st.info(f"⏱️ Tempo estimado de resposta: **{support_info['response']}**")
                    
                    # Mostra informações adicionais baseadas no tipo
                    if support_type == "Problema Técnico":
                        st.warning("💡 **Dica:** Para problemas técnicos, inclua sempre capturas de tela quando possível.")
        
        st.markdown("---")
        
        # Informações de contato
        show_contact_info()
        
        # FAQ rápida
        with st.expander("❓ Perguntas Frequentes", expanded=False):
            st.markdown("""
            **P: Como faço para alterar meu plano?**  
            R: Vá para a aba "Planos e Pagamento" e selecione o plano desejado.
            
            **P: Posso cancelar minha assinatura?**  
            R: Sim, entre em contato conosco para processar o cancelamento.
            
            **P: Os dados ficam salvos na nuvem?**  
            R: Sim, utilizamos Google Sheets e Google Drive para máxima segurança.
            
            **P: Como funciona o período de teste?**  
            R: O trial Premium IA é gratuito por 14 dias com todas as funcionalidades.
            """)
