import streamlit as st
import sys
import os
import pandas as pd
from datetime import date, timedelta

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

# Configuração dos planos (sem Stripe por enquanto)
PLANOS_CONFIG = {
    "basico": {
        "nome": "Plano Básico",
        "preco": 29.90,
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
        
        # Atualiza apenas o nome (coluna B) por enquanto
        # Você pode expandir isso conforme sua estrutura de planilha
        if 'nome' in updated_data:
            matrix_uploader.update_cells(USERS_SHEET_NAME, f"B{row_index}", [[updated_data['nome']]])
        
        log_action("ATUALIZOU_PERFIL", f"Email: {user_email}")
        return True
        
    except Exception as e:
        st.error(f"Erro ao atualizar perfil: {e}")
        return False

def show_contact_info():
    """Exibe informações de contato para upgrade de plano"""
    st.info("""
    ### 💰 Quer fazer upgrade do seu plano?
    
    Entre em contato conosco para ativar recursos adicionais:
    
    - 📧 **Email**: cristian.ferreira.carlos@gmail.com
    - 💼 **LinkedIn**: [Cristian Ferreira Carlos](https://www.linkedin.com/in/cristian-ferreira-carlos-256b19161/)
    - 📱 **WhatsApp**: Solicite contato por email
    
    **Oferecemos**:
    - Demonstração personalizada
    - Período de teste estendido
    - Configuração personalizada
    - Treinamento da equipe
    """)

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
    tab_profile, tab_plans = st.tabs([
        "📝 Dados Pessoais", 
        "💳 Planos Disponíveis"
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
                    if isinstance(trial_end, str):
                        trial_end = pd.to_datetime(trial_end).date()
                    days_left = (trial_end - date.today()).days
                    if days_left > 0:
                        st.info(f"🚀 Trial: {days_left} dias restantes")
                    else:
                        st.warning("🚀 Trial expirado")
        
        with col2:
            plan_display = PLANOS_CONFIG.get(current_plan, {}).get('nome', current_plan.title())
            st.metric("Plano Atual", plan_display)
        
        st.markdown("---")
        
        # Formulário de edição
        with st.form("profile_form"):
            st.subheader("Editar Dados Pessoais")
            
            # Nome (editável)
            new_name = st.text_input("Nome Completo", 
                                   value=user_info.get('nome', user_name))
            
            # Email (não editável)
            st.text_input("Email", value=user_email, disabled=True, 
                         help="O email não pode ser alterado pois é usado para autenticação.")
            
            # Campos adicionais (placeholder)
            st.info("📝 Campos adicionais como telefone, empresa e cargo serão adicionados em futuras atualizações.")
            
            submitted = st.form_submit_button("💾 Salvar Alterações", 
                                            type="primary", 
                                            use_container_width=True)
            
            if submitted:
                updated_data = {
                    'nome': new_name
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
        st.header("Planos Disponíveis")
        
        # Informações do plano atual
        if is_trial:
            trial_end = user_info.get('trial_end_date')
            if trial_end:
                if isinstance(trial_end, str):
                    trial_end = pd.to_datetime(trial_end).date()
                st.info(f"🚀 Você está em um período de teste do **{PLANOS_CONFIG.get(current_plan, {}).get('nome', 'Premium IA')}** até {trial_end}.")
        
        # Exibe todos os planos
        for plan_key, plan_info in PLANOS_CONFIG.items():
            is_current = current_plan == plan_key
            
            with st.container():
                if is_current:
                    st.success(f"✅ **Plano Atual**")
                
                # Ícone do plano
                plan_icon = "🌟" if plan_key == "premium_ia" else ("⭐" if plan_key == "pro" else "📋")
                
                st.markdown(f"### {plan_icon} {plan_info['nome']}")
                st.markdown(f"**R$ {plan_info['preco']:.2f}/mês**")
                st.markdown(plan_info['descricao'])
                
                # Lista de recursos
                st.markdown("**Recursos inclusos:**")
                for recurso in plan_info['recursos']:
                    st.markdown(f"- {recurso}")
                
                if not is_current:
                    st.markdown(f"*Interessado no {plan_info['nome']}? Entre em contato conosco!*")
                else:
                    st.info("✅ Este é seu plano atual")
                
                st.markdown("---")
        
        # Informações de contato
        show_contact_info()
        
        # Informações importantes
        st.markdown("""
        ### ℹ️ Informações Importantes
        
        - **Dados Seguros**: Todos os seus dados estão protegidos e criptografados
        - **Suporte Técnico**: Nossa equipe está disponível para ajudar
        - **Atualizações**: Novas funcionalidades são adicionadas regularmente
        - **Backup**: Backup automático diário de todos os dados
        """)

if __name__ == "__main__":
    show_page()
