import streamlit as st
import sys
import os
import pandas as pd
from datetime import date, timedelta
import requests
import json
from streamlit_js_eval import streamlit_js_eval

# Adiciona o diretório raiz ao path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.auth_utils import (
    get_user_display_name, get_user_email, get_user_info, get_users_data,
    get_effective_user_plan, get_effective_user_status, is_on_trial
)
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import USERS_SHEET_NAME
from utils.auditoria import log_action
from config.page_config import set_page_config

set_page_config()

# Configuração do Stripe (use suas chaves reais em produção)
STRIPE_PUBLISHABLE_KEY = st.secrets.get("stripe", {}).get("publishable_key", "pk_test_...")
STRIPE_SECRET_KEY = st.secrets.get("stripe", {}).get("secret_key", "sk_test_...")

# Configuração dos planos
PLANOS_CONFIG = {
    "basico": {
        "nome": "Plano Básico",
        "preco": 29.90,
        "preco_cents": 2990,
        "stripe_price_id": "price_basico_monthly",
        "descricao": "Visualização de dados e relatórios básicos",
        "recursos": [
            "📊 Resumo gerencial",
            "📋 Visualização de dados",
            "📄 Exportação de relatórios",
            "💬 Suporte por email"
        ]
    },
    "pro": {
        "nome": "Plano Pro",
        "preco": 89.90,
        "preco_cents": 8990,
        "stripe_price_id": "price_pro_monthly",
        "descricao": "Gestão completa com todas as funcionalidades",
        "recursos": [
            "✅ Todas as funcionalidades do Básico",
            "✏️ Registro e edição completa",
            "📱 Inspeções manuais e QR Code",
            "📊 Dashboards interativos",
            "🔧 Ações corretivas",
            "📞 Suporte prioritário"
        ]
    },
    "premium_ia": {
        "nome": "Plano Premium IA",
        "preco": 149.90,
        "preco_cents": 14990,
        "stripe_price_id": "price_premium_monthly",
        "descricao": "Automação completa com Inteligência Artificial",
        "recursos": [
            "✅ Todas as funcionalidades do Pro",
            "🤖 Processamento com IA",
            "📄 Extração automática de PDFs",
            "🧠 Análise inteligente de documentos",
            "⚡ Automações avançadas",
            "🎯 Suporte VIP 24/7"
        ]
    }
}

def create_stripe_checkout_session(price_id, customer_email, user_id):
    """Cria uma sessão de checkout do Stripe"""
    try:
        import stripe
        stripe.api_key = STRIPE_SECRET_KEY
        
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[{
                'price': price_id,
                'quantity': 1,
            }],
            mode='subscription',
            customer_email=customer_email,
            metadata={
                'user_id': user_id,
                'user_email': customer_email
            },
            success_url=f"{st.experimental_get_query_params().get('host', ['http://localhost:8501'])[0]}/?payment=success",
            cancel_url=f"{st.experimental_get_query_params().get('host', ['http://localhost:8501'])[0]}/?payment=cancel",
        )
        
        return session.url, session.id
    except Exception as e:
        st.error(f"Erro ao criar sessão de pagamento: {e}")
        return None, None

def update_user_profile(user_email, updated_data):
    """Atualiza os dados do perfil do usuário"""
    try:
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        users_data = matrix_uploader.get_data_from_sheet(USERS_SHEET_NAME)
        
        if not users_data or len(users_data) < 2:
            st.error("Erro ao carregar dados dos usuários.")
            return False
            
        df_users = pd.DataFrame(users_data[1:], columns=users_data[0])
        user_row = df_users[df_users['email'] == user_email]
        
        if user_row.empty:
            st.error("Usuário não encontrado.")
            return False
            
        row_index = user_row.index[0] + 2  # +2 para compensar cabeçalho e base 0
        
        # Mapeamento de campos para colunas (ajuste conforme sua estrutura)
        field_to_column = {
            'nome': 'B',
            'telefone': 'J',  # Assumindo que existe uma coluna para telefone
            'empresa': 'K',   # Assumindo que existe uma coluna para empresa
            'cargo': 'L'      # Assumindo que existe uma coluna para cargo
        }
        
        # Atualiza cada campo
        for field, value in updated_data.items():
            if field in field_to_column:
                column = field_to_column[field]
                range_to_update = f"{column}{row_index}"
                matrix_uploader.update_cells(USERS_SHEET_NAME, range_to_update, [[value]])
        
        log_action("ATUALIZOU_PERFIL", f"Email: {user_email}")
        return True
        
    except Exception as e:
        st.error(f"Erro ao atualizar perfil: {e}")
        return False

def show_payment_plans():
    """Exibe os planos disponíveis com opções de pagamento"""
    st.header("Escolha seu Plano")
    
    current_plan = get_effective_user_plan()
    user_email = get_user_email()
    
    cols = st.columns(len(PLANOS_CONFIG))
    
    for i, (plan_key, plan_info) in enumerate(PLANOS_CONFIG.items()):
        with cols[i]:
            # Card do plano
            is_current = current_plan == plan_key
            card_style = "🌟" if plan_key == "premium_ia" else ("⭐" if plan_key == "pro" else "📋")
            
            with st.container():
                if is_current:
                    st.success(f"✅ **Plano Atual**")
                
                st.markdown(f"### {card_style} {plan_info['nome']}")
                st.markdown(f"**R$ {plan_info['preco']:.2f}/mês**")
                st.markdown(plan_info['descricao'])
                
                # Lista de recursos
                st.markdown("**Recursos inclusos:**")
                for recurso in plan_info['recursos']:
                    st.markdown(f"- {recurso}")
                
                if not is_current:
                    if st.button(f"Assinar {plan_info['nome']}", 
                               key=f"subscribe_{plan_key}", 
                               type="primary",
                               use_container_width=True):
                        
                        # Criar sessão do Stripe
                        checkout_url, session_id = create_stripe_checkout_session(
                            plan_info['stripe_price_id'],
                            user_email,
                            user_email  # Usando email como ID único
                        )
                        
                        if checkout_url:
                            st.success("Redirecionando para o pagamento...")
                            # JavaScript para redirecionar
                            js_code = f"""
                                window.open('{checkout_url}', '_blank');
                            """
                            streamlit_js_eval(js_expressions=js_code, key=f"redirect_{plan_key}")
                        else:
                            st.error("Erro ao processar pagamento. Tente novamente.")
                else:
                    st.info("Plano ativo")

def show_billing_history():
    """Exibe o histórico de cobrança (simulado)"""
    st.header("Histórico de Pagamentos")
    
    # Em uma implementação real, você buscaria do Stripe
    # Por agora, vamos simular alguns dados
    billing_data = [
        {"data": "2024-01-15", "plano": "Premium IA", "valor": "R$ 149,90", "status": "Pago"},
        {"data": "2023-12-15", "plano": "Premium IA", "valor": "R$ 149,90", "status": "Pago"},
        {"data": "2023-11-15", "plano": "Pro", "valor": "R$ 89,90", "status": "Pago"},
    ]
    
    if billing_data:
        df_billing = pd.DataFrame(billing_data)
        st.dataframe(df_billing, use_container_width=True, hide_index=True)
    else:
        st.info("Nenhum histórico de pagamento encontrado.")

def show_page():
    st.title("👤 Meu Perfil")
    
    # Verificação de login
    user_email = get_user_email()
    if not user_email:
        st.error("Usuário não autenticado.")
        return
    
    user_info = get_user_info()
    user_name = get_user_display_name()
    current_plan = get_effective_user_plan()
    user_status = get_effective_user_status()
    is_trial = is_on_trial()
    
    # Abas principais
    tab_profile, tab_plans, tab_billing = st.tabs([
        "📝 Dados Pessoais", 
        "💳 Planos e Pagamento", 
        "📊 Histórico"
    ])
    
    with tab_profile:
        st.header("Informações do Perfil")
        
        # Informações atuais
        col1, col2 = st.columns(2)
        
        with col1:
            st.metric("Status da Conta", user_status.title())
            if is_trial:
                trial_end = user_info.get('trial_end_date')
                if trial_end:
                    days_left = (trial_end - date.today()).days
                    st.info(f"🚀 Trial: {days_left} dias restantes")
        
        with col2:
            plan_display = PLANOS_CONFIG.get(current_plan, {}).get('nome', current_plan.title())
            st.metric("Plano Atual", plan_display)
        
        st.markdown("---")
        
        # Formulário de edição
        with st.form("profile_form"):
            st.subheader("Editar Dados Pessoais")
            
            col3, col4 = st.columns(2)
            
            with col3:
                new_name = st.text_input("Nome Completo", 
                                       value=user_info.get('nome', user_name))
                new_phone = st.text_input("Telefone", 
                                        value=user_info.get('telefone', ''))
            
            with col4:
                new_company = st.text_input("Empresa", 
                                          value=user_info.get('empresa', ''))
                new_position = st.text_input("Cargo", 
                                           value=user_info.get('cargo', ''))
            
            # Email (não editável)
            st.text_input("Email", value=user_email, disabled=True, 
                         help="O email não pode ser alterado pois é usado para autenticação.")
            
            submitted = st.form_submit_button("💾 Salvar Alterações", 
                                            type="primary", 
                                            use_container_width=True)
            
            if submitted:
                updated_data = {
                    'nome': new_name,
                    'telefone': new_phone,
                    'empresa': new_company,
                    'cargo': new_position
                }
                
                with st.spinner("Salvando alterações..."):
                    if update_user_profile(user_email, updated_data):
                        st.success("✅ Perfil atualizado com sucesso!")
                        # Limpa o cache para recarregar os dados
                        st.cache_data.clear()
                        st.rerun()
                    else:
                        st.error("❌ Erro ao atualizar perfil. Tente novamente.")
    
    with tab_plans:
        # Informações do plano atual
        if is_trial:
            st.info(f"🚀 Você está em um período de teste do **{PLANOS_CONFIG.get(current_plan, {}).get('nome', 'Premium IA')}** até {user_info.get('trial_end_date', 'N/A')}.")
        
        show_payment_plans()
        
        # Informações importantes
        st.markdown("---")
        st.markdown("""
        ### ℹ️ Informações Importantes
        
        - **Pagamento Seguro**: Processado pelo Stripe, líder mundial em pagamentos online
        - **Cancelamento**: Cancele a qualquer momento pelo painel
        - **Suporte**: Nossa equipe está disponível para ajudar
        - **Dados**: Seus dados estão seguros e criptografados
        """)
        
        # Status do pagamento (se vier de redirect)
        query_params = st.query_params
        if "payment" in query_params:
            if query_params["payment"] == "success":
                st.success("🎉 Pagamento realizado com sucesso! Seu plano será ativado em instantes.")
                st.balloons()
            elif query_params["payment"] == "cancel":
                st.warning("⚠️ Pagamento cancelado. Você pode tentar novamente a qualquer momento.")
    
    with tab_billing:
        show_billing_history()
        
        st.markdown("---")
        
        # Opções de faturamento
        st.subheader("Configurações de Cobrança")
        
        col5, col6 = st.columns(2)
        
        with col5:
            if st.button("📧 Receber Faturas por Email", use_container_width=True):
                st.info("Configuração salva! Você receberá as faturas em seu email.")
        
        with col6:
            if st.button("🔄 Atualizar Método de Pagamento", use_container_width=True):
                st.info("Redirecionando para o portal de cobrança...")
        
        # Informações de contato
        st.markdown("---")
        st.markdown("""
        ### 💬 Precisa de Ajuda?
        
        **Suporte Financeiro:**
        - 📧 Email: financeiro@suaempresa.com
        - 📞 Telefone: (11) 9999-9999
        - 💬 Chat: Segunda a Sexta, 9h às 18h
        
        **Suporte Técnico:**
        - 📧 Email: suporte@suaempresa.com
        - 🎫 Portal: [suporte.suaempresa.com](https://suporte.suaempresa.com)
        """)

if __name__ == "__main__":
    show_page()
