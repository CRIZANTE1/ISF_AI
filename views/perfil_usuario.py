import streamlit as st
import streamlit.components.v1 as components
import sys
import os
import pandas as pd
from datetime import date, timedelta
import re
import requests
import logging

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.auth_utils import (
    get_user_display_name, get_user_email, get_user_info,
    get_effective_user_plan, get_effective_user_status, is_on_trial
)
from supabase.client import get_supabase_client
from utils.auditoria import log_action
from config.page_config import set_page_config
from utils.webhook_handler import (
    simulate_payment_webhook, set_payment_success_message, 
    get_payment_success_message, clear_payment_success_message
)

set_page_config()

logger = logging.getLogger(__name__)

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

        with st.container():
            st.markdown("### 💳 Finalizar Pagamento")
            
            with st.expander("📋 Resumo do Pedido", expanded=True):
                col1, col2 = st.columns([2, 1])
                with col1:
                    st.markdown(f"**{plan_info['nome']}**")
                    st.caption(plan_info['descricao'])
                    
                    for recurso in plan_info['recursos'][:3]:
                        st.markdown(f"• {recurso}")
                        
                with col2:
                    st.markdown(f"### R$ {plan_info['preco']:.2f}")
                    st.markdown("*por mês*")
                    st.caption("💳 Parcelamento disponível")

        html_template_path = os.path.join(os.path.dirname(__file__), 'templates', 'payment_form.html')
        
        try:
            with open(html_template_path, 'r', encoding='utf-8') as f:
                payment_html_template = f.read()
            
            payment_html = payment_html_template.format(
                public_key=self.public_key,
                user_name=user_name,
                plan_type=plan_type,
                user_email=user_email,
                api_url=self.api_url,
                price=f"{plan_info['preco']:.2f}",
                plan_name=plan_info['nome']
            )
            
            components.html(payment_html, height=800, scrolling=True)
            
            message_handler = """
            <script>
                window.addEventListener("message", function(event) {
                    console.log("Received message:", event.data);
                    
                    if (event.data.type === "payment_success") {
                        alert("✅ Pagamento aprovado! Sua conta será ativada em instantes.");
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
        db_client = get_supabase_client()
        
        db_client.update_data("usuarios", updated_data, "email", user_email)
        
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
    
    user_email = get_user_email()
    if not user_email:
        st.error("❌ Usuário não autenticado.")
        st.stop()
    
    user_info = get_user_info()
    user_name = get_user_display_name()
    current_plan = get_effective_user_plan()
    user_status = get_effective_user_status()
    is_trial = is_on_trial()
    real_plan = user_info.get('plano', 'basico') if user_info else 'basico'
    
    payment_success = get_payment_success_message()
    if payment_success:
        st.success("🎉 **Pagamento realizado com sucesso!** Seu plano foi ativado.")
        clear_payment_success_message()
        st.cache_data.clear()

    tab_profile, tab_plan_and_payment, tab_support = st.tabs([
        "📝 Meus Dados", 
        "💎 Planos e Pagamento", 
        "🆘 Suporte"
    ])
    
    with tab_profile:
        st.header("📋 Informações do Perfil")
        
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
        
        if is_trial:
            trial_end = user_info.get('trial_end_date')
            if trial_end and isinstance(trial_end, date):
                days_left = (trial_end - date.today()).days
                if days_left > 0:
                    st.info(f"⏰ **Trial Premium:** {days_left} dias restantes até {trial_end.strftime('%d/%m/%Y')}")
                else:
                    st.warning("⏰ **Trial Premium:** Expirado")

        st.markdown("---")
        
        with st.form("profile_form"):
            st.subheader("✏️ Editar Dados Pessoais")
            
            new_name = st.text_input(
                "Nome Completo *", 
                value=user_info.get('nome', user_name),
                help="Nome completo como deve aparecer nos relatórios"
            )
            
            st.text_input(
                "Email", 
                value=user_email, 
                disabled=True,
                help="Email não pode ser alterado"
            )
            
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

            if st.form_submit_button("💾 Salvar Alterações", type="primary", use_container_width=True):
                if not new_name.strip():
                    st.error("❌ O nome não pode estar vazio.")
                else:
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

    with tab_plan_and_payment:
        if 'selected_plan_to_pay' not in st.session_state:
            st.header("💎 Nossos Planos")
            
            if is_trial:
                st.info("🚀 **Você está em um período de teste Premium!** Contrate um plano abaixo para garantir acesso contínuo após o término do trial.")
            
            plans_to_show = []
            if is_trial or real_plan == 'basico':
                plans_to_show = ['pro', 'premium_ia']
            elif real_plan == 'pro':
                plans_to_show = ['premium_ia']
    
            if not plans_to_show and not is_trial:
                st.success("🎉 Parabéns! Você já possui nosso plano mais completo!")
                st.balloons()
            else:
                if plans_to_show:
                    cols = st.columns(len(plans_to_show))
                    
                    for i, plan_key in enumerate(plans_to_show):
                        with cols[i]:
                            plan_info = PLANOS_CONFIG[plan_key]
                            
                            with st.container(border=True, height=500):
                                if plan_key == 'premium_ia':
                                    st.markdown("🌟 **MAIS POPULAR**")
                                
                                st.subheader(plan_info['nome'])
                                st.markdown(f"## R$ {plan_info['preco']:.2f}")
                                st.caption("*por mês*")
                                st.markdown(f"*{plan_info['descricao']}*")
                                
                                st.markdown("---")
                                
                                st.markdown("**Recursos inclusos:**")
                                for feature in plan_info['recursos']:
                                    st.markdown(f"• {feature}")
                            
                            button_label = f"🚀 Contratar {plan_info['nome']}"
                            if st.button(button_label, key=f"btn_{plan_key}", type="primary", use_container_width=True):
                                
                                try:
                                    api_url = st.secrets.get("payment", {}).get("api_url")
                                    if api_url:
                                        st.toast("Preparando o formulário de pagamento...", icon="💳")
                                        requests.get(f"{api_url}/ping", timeout=3)
                                        logger.info(f"Ping enviado para {api_url}")
                                except Exception as e:
                                    logger.warning(f"Ping falhou: {e}")
    
                                st.session_state.selected_plan_to_pay = plan_key
                                st.rerun()
    
        else:
            selected_plan = st.session_state.selected_plan_to_pay
            plan_info = PLANOS_CONFIG[selected_plan]
            
            st.header(f"💳 Finalizar Contratação")
            st.subheader(f"{plan_info['nome']}")
            
            payment_integration = MercadoPagoPayment()
            payment_integration.render_payment_form(
                plan_type=selected_plan, 
                user_email=user_email, 
                user_name=user_name
            )
    
            col1, col2 = st.columns([1, 1])
            with col1:
                if st.button("⬅️ Escolher outro plano", use_container_width=True):
                    del st.session_state.selected_plan_to_pay
                    st.rerun()
            
            with col2:
                if st.secrets.get("debug_mode", False):
                    if st.button("🧪 Simular Pagamento (Debug)", use_container_width=True):
                        if simulate_payment_webhook(user_email, selected_plan):
                            set_payment_success_message(selected_plan)
                            del st.session_state.selected_plan_to_pay
                            st.rerun()

    with tab_support:
        st.header("🆘 Central de Suporte")
        
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
            
            if current_plan == 'premium_ia':
                priority = st.selectbox("Prioridade", ["Normal", "Alta", "Crítica"])
            else:
                priority = "Normal"
                
            if st.form_submit_button("📤 Enviar Solicitação", type="primary", use_container_width=True):
                if not subject.strip() or not message.strip():
                    st.error("❌ Por favor, preencha o assunto e a mensagem.")
                else:
                    try:
                        from datetime import datetime
                        
                        support_data = {
                            "data_solicitacao": datetime.now().isoformat(),
                            "email_usuario": user_email,
                            "nome_usuario": user_name,
                            "tipo_solicitacao": support_type,
                            "assunto": subject.strip(),
                            "mensagem": message.strip(),
                            "prioridade": priority,
                            "status": "Pendente",
                        }
                        
                        db_client = get_supabase_client()
                        db_client.append_data("solicitacoes_suporte", support_data)
                        
                        support_details = f"Tipo: {support_type}, Assunto: {subject[:50]}..."
                        log_action("SOLICITACAO_SUPORTE", support_details)
                        
                        ticket_number = datetime.now().strftime("%Y%m%d%H%M%S")
                        
                        st.success("✅ **Solicitação enviada com sucesso!**")
                        st.info(f"⏱️ Tempo estimado de resposta: **{support_info['response']}**")
                        st.info(f"🎫 **Número do ticket:** #{ticket_number}")
                        
                        if support_type == "Problema Técnico":
                            st.warning("💡 **Dica:** Para problemas técnicos, inclua sempre capturas de tela quando possível.")
                            
                    except Exception as e:
                        st.error(f"❌ Erro ao enviar solicitação: {e}")
                        st.warning("📧 Tente novamente ou envie diretamente para: cristian.ferreira.carlos@gmail.com")
                        
                        log_action("ERRO_SOLICITACAO_SUPORTE", f"Erro: {str(e)}")
        
        st.markdown("---")
        
        show_contact_info()
        
        with st.expander("❓ Perguntas Frequentes", expanded=False):
            st.markdown("""
            **P: Como faço para alterar meu plano?**  
            R: Vá para a aba "Planos e Pagamento" e selecione o plano desejado.
            
            **P: Posso cancelar minha assinatura?**  
            R: Sim, entre em contato conosco para processar o cancelamento.
            
            **P: Os dados ficam salvos na nuvem?**  
            R: Sim, utilizamos Supabase para máxima segurança e performance.
            
            **P: Como funciona o período de teste?**  
            R: O trial Premium IA é gratuito por 14 dias com todas as funcionalidades.
            """)