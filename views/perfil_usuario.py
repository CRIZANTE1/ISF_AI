import streamlit as st
import streamlit.components.v1 as components
import sys
import os
import pandas as pd
from datetime import date, timedelta

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

# Configuração dos planos (pode ser movida para secrets.toml no futuro)
PLANOS_CONFIG = {
    "basico": {
        "nome": "Plano Básico", "preco": 0.00,
        "descricao": "Acesso limitado para visualização.",
        "recursos": ["📊 Resumo gerencial", "📋 Visualização de dados"]
    },
    "pro": {
        "nome": "Plano Pro", "preco": 89.90,
        "descricao": "Gestão completa com todas as funcionalidades.",
        "recursos": [
            "✅ Todas as funcionalidades do Básico", "✏️ Registro e edição completa",
            "📱 Inspeções manuais e QR Code", "📊 Dashboards interativos",
            "🔧 Ações corretivas", "📞 Suporte prioritário"
        ]
    },
    "premium_ia": {
        "nome": "Plano Premium IA", "preco": 149.90,
        "descricao": "Automação completa com Inteligência Artificial.",
        "recursos": [
            "✅ Todas as funcionalidades do Pro", "🤖 Processamento com IA",
            "📄 Extração automática de PDFs", "🧠 Análise inteligente de documentos",
            "⚡ Automações avançadas", "🎯 Suporte VIP 24/7"
        ]
    }
}

class MercadoPagoPayment:
    """Classe para integração com pagamentos"""
    
    def __init__(self):
        self.public_key = st.secrets.get("mercadopago", {}).get("public_key")
        self.api_url = st.secrets.get("payment", {}).get("api_url")
        
    def render_payment_form(self, plan_type: str, user_email: str, user_name: str):
        """Renderiza formulário de pagamento do Mercado Pago"""
        
        if not self.public_key or not self.api_url:
            st.error("⚠️ Configuração de pagamento não encontrada. Entre em contato com o suporte.")
            return
            
        plan_info = PLANOS_CONFIG.get(plan_type)
        if not plan_info:
            st.error("Plano inválido selecionado.")
            return

        # Carrega o código HTML do arquivo separado
        html_template_path = os.path.join(os.path.dirname(__file__), 'templates', 'payment_form.html')
        try:
            with open(html_template_path, 'r', encoding='utf-8') as f:
                payment_html_template = f.read()
            
            payment_html = payment_html_template.format(
                public_key=self.public_key, user_name=user_name,
                plan_type=plan_type, user_email=user_email,
                api_url=self.api_url, price=f"{plan_info['preco']:.2f}"
            )
            
            components.html(payment_html, height=700, scrolling=False)
            
        except FileNotFoundError:
            st.error(f"Template de pagamento não encontrado: {html_template_path}")

def update_user_profile(user_email: str, updated_data: dict):
    """Atualiza os dados do perfil do usuário de forma dinâmica."""
    try:
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        users_data = matrix_uploader.get_data_from_sheet(USERS_SHEET_NAME)
        
        if not users_data or len(users_data) < 2:
            st.error("Erro ao carregar dados dos usuários.")
            return False
        
        headers = users_data[0]
        df_users = pd.DataFrame(users_data[1:], columns=headers)
        user_row = df_users[df_users['email'] == user_email]
        
        if user_row.empty:
            st.error("Usuário não encontrado.")
            return False
            
        row_index = user_row.index[0] + 2
        
        column_map = {'nome': 'nome', 'telefone': 'telefone', 'empresa': 'empresa', 'cargo': 'cargo'}
        
        updates_to_perform = {}
        for data_key, col_name in column_map.items():
            if col_name in headers:
                col_index = headers.index(col_name)
                col_letter = chr(ord('A') + col_index)
                updates_to_perform[data_key] = col_letter

        for data_key, col_letter in updates_to_perform.items():
            if data_key in updated_data:
                value_to_update = updated_data[data_key]
                matrix_uploader.update_cells(USERS_SHEET_NAME, f"{col_letter}{row_index}", [[value_to_update]])
        
        log_action("ATUALIZOU_PERFIL", f"Email: {user_email}, Dados: {list(updated_data.keys())}")
        return True
        
    except Exception as e:
        st.error(f"Erro ao atualizar perfil: {e}")
        return False

def show_page():
    st.title("👤 Meu Perfil e Planos")
    
    user_email = get_user_email()
    if not user_email:
        st.error("Usuário não autenticado."); return
    
    user_info = get_user_info()
    user_name = get_user_display_name()
    current_plan = get_effective_user_plan()
    user_status = get_effective_user_status()
    is_trial = is_on_trial()
    real_plan = user_info.get('plano', 'basico') if user_info else 'basico'
    
    if get_payment_success_message():
        st.success("🎉 **Pagamento realizado com sucesso!** Seu plano foi ativado.")
        st.balloons()
        clear_payment_success_message()
        st.cache_data.clear()

    tab_profile, tab_plan_and_payment = st.tabs(["📝 Meus Dados", "💎 Planos e Pagamento"])
    
    with tab_profile:
        # (O código da aba de perfil permanece o mesmo, você pode colar o seu aqui)
        st.header("Informações do Perfil")
        col1, col2 = st.columns(2)
        with col1:
            st.success(f"✅ **Status**: {user_status.title()}") if user_status == "ativo" else st.warning(f"⚠️ **Status**: {user_status.title()}")
        with col2:
            plan_display = PLANOS_CONFIG.get(current_plan, {}).get('nome', current_plan.title())
            st.info(f"🚀 **Plano**: {plan_display} (Trial)") if is_trial else st.info(f"💎 **Plano**: {plan_display}")
        
        if is_trial:
            trial_end = user_info.get('trial_end_date')
            if trial_end and isinstance(trial_end, date):
                days_left = (trial_end - date.today()).days
                st.info(f"⏰ **Trial Premium**: {days_left} dias restantes até {trial_end.strftime('%d/%m/%Y')}")

        st.markdown("---")
        with st.form("profile_form"):
            st.subheader("✏️ Editar Dados Pessoais")
            new_name = st.text_input("Nome Completo", value=user_info.get('nome', user_name))
            st.text_input("Email", value=user_email, disabled=True)
            
            with st.expander("📋 Campos Adicionais"):
                new_phone = st.text_input("Telefone", value=user_info.get('telefone', ''), placeholder="(11) 99999-9999")
                new_company = st.text_input("Empresa", value=user_info.get('empresa', ''), placeholder="Nome da sua empresa")
                new_position = st.text_input("Cargo", value=user_info.get('cargo', ''), placeholder="Seu cargo na empresa")

            if st.form_submit_button("💾 Salvar Alterações", type="primary", use_container_width=True):
                updated_data = {
                    'nome': new_name.strip(), 'telefone': new_phone.strip(),
                    'empresa': new_company.strip(), 'cargo': new_position.strip()
                }
                with st.spinner("Salvando..."):
                    if update_user_profile(user_email, updated_data):
                        st.success("✅ Perfil atualizado!"); st.cache_data.clear(); st.rerun()

    with tab_plan_and_payment:
        # --- LÓGICA DE RENDERIZAÇÃO DA PÁGINA DE PLANOS/PAGAMENTO ---
        
        # Estado inicial: O usuário ainda não selecionou um plano para pagar
        if 'selected_plan_to_pay' not in st.session_state:
            st.header("💎 Nossos Planos")
            
            if is_trial:
                st.info("Você está em um período de teste Premium. Escolha um plano abaixo para continuar após o término.")
            
            # Determina quais planos exibir
            plans_to_show = []
            if is_trial:
                plans_to_show = ['pro', 'premium_ia'] # Em trial, pode contratar qualquer plano pago
            elif real_plan == 'basico':
                plans_to_show = ['pro', 'premium_ia']
            elif real_plan == 'pro':
                plans_to_show = ['premium_ia'] # Só pode fazer upgrade

            if not plans_to_show and not is_trial:
                st.success("🎉 Você já possui nosso plano mais completo!")
            else:
                cols = st.columns(len(plans_to_show))
                for i, plan_key in enumerate(plans_to_show):
                    with cols[i]:
                        plan_info = PLANOS_CONFIG[plan_key]
                        with st.container(border=True):
                            st.subheader(plan_info['nome'])
                            st.markdown(f"## R$ {plan_info['preco']:.2f} /mês")
                            st.caption(plan_info['descricao'])
                            st.markdown("---")
                            for feature in plan_info['recursos']:
                                st.markdown(f"<span>{feature}</span>", unsafe_allow_html=True)
                            
                            st.markdown("<br>", unsafe_allow_html=True) # Espaçamento
                            
                            # Botão que define o estado para mostrar o formulário de pagamento
                            if st.button(f"Contratar {plan_info['nome']}", key=f"btn_{plan_key}", type="primary", use_container_width=True):
                                st.session_state.selected_plan_to_pay = plan_key
                                st.rerun()

        # Estado 2: O usuário CLICOU em um botão "Contratar"
        else:
            selected_plan = st.session_state.selected_plan_to_pay
            plan_info = PLANOS_CONFIG[selected_plan]
            
            st.header(f"💳 Finalizar Contratação: {plan_info['nome']}")
            
            # Resumo do pedido
            with st.expander("📋 Resumo do Pedido", expanded=True):
                col1, col2 = st.columns([2, 1])
                with col1:
                    st.markdown(f"**{plan_info['nome']}**")
                    st.markdown(plan_info['descricao'])
                with col2:
                    st.markdown(f"### R$ {plan_info['preco']:.2f}")
                    st.markdown("*por mês*")
            
            # Renderiza o formulário de pagamento
            payment_integration = MercadoPagoPayment()
            payment_integration.render_payment_form(
                plan_type=selected_plan,
                user_email=user_email,
                user_name=user_name
            )

            # Botão para voltar à seleção de planos
            if st.button("⬅️ Escolher outro plano"):
                del st.session_state.selected_plan_to_pay
                st.rerun()
            
            # Simulação para desenvolvimento
            if st.secrets.get("debug_mode", False):
                st.markdown("---")
                if st.button("🧪 Simular Pagamento Aprovado (Debug)"):
                    if simulate_payment_webhook(user_email, selected_plan):
                        set_payment_success_message(selected_plan)
                        del st.session_state.selected_plan_to_pay
                        st.rerun()
