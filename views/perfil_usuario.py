# views/perfil_usuario.py - Versão atualizada com pagamentos
import streamlit as st
import streamlit.components.v1 as components
import sys
import os
import pandas as pd
import httpx
import asyncio
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

# Configuração dos planos
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
        ],
        "stripe_price_id": "price_basic_monthly"
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
        ],
        "stripe_price_id": "price_pro_monthly"
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
        ],
        "stripe_price_id": "price_premium_monthly"
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

        # Container para o formulário de pagamento
        with st.container():
            st.markdown("### 💳 Finalizar Pagamento")
            
            # Resumo do pedido
            with st.expander("📋 Resumo do Pedido", expanded=True):
                col1, col2 = st.columns([2, 1])
                with col1:
                    st.markdown(f"**{plan_info['nome']}**")
                    st.markdown(plan_info['descricao'])
                with col2:
                    st.markdown(f"### R$ {plan_info['preco']:.2f}")
                    st.markdown("*por mês*")

        # HTML do formulário de pagamento integrado
        payment_html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <script src="https://sdk.mercadopago.com/js/v2"></script>
            <style>
                .payment-container {{
                    max-width: 500px;
                    margin: 0 auto;
                    padding: 20px;
                    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
                    background: #fff;
                    border-radius: 12px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }}
                
                .form-group {{
                    margin-bottom: 16px;
                }}
                
                .form-control {{
                    width: 100%;
                    padding: 12px 16px;
                    border: 2px solid #e1e5e9;
                    border-radius: 8px;
                    font-size: 16px;
                    transition: border-color 0.3s ease;
                    box-sizing: border-box;
                }}
                
                .form-control:focus {{
                    outline: none;
                    border-color: #009ee3;
                    box-shadow: 0 0 0 3px rgba(0, 158, 227, 0.1);
                }}
                
                .btn-pay {{
                    width: 100%;
                    background: linear-gradient(135deg, #009ee3 0%, #0080b8 100%);
                    color: white;
                    border: none;
                    padding: 16px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: 600;
                    cursor: pointer;
                    transition: all 0.3s ease;
                    margin-top: 20px;
                }}
                
                .btn-pay:hover {{
                    background: linear-gradient(135deg, #0080b8 0%, #006a9a 100%);
                    transform: translateY(-1px);
                }}
                
                .btn-pay:disabled {{
                    background: #ccc;
                    cursor: not-allowed;
                    transform: none;
                }}
                
                .form-row {{
                    display: flex;
                    gap: 12px;
                }}
                
                .form-row .form-group {{
                    flex: 1;
                }}
                
                .alert {{
                    padding: 12px;
                    border-radius: 6px;
                    margin: 10px 0;
                    font-size: 14px;
                }}
                
                .alert-error {{
                    background-color: #fee;
                    color: #d63384;
                    border: 1px solid #f5c2c7;
                }}
                
                .alert-success {{
                    background-color: #d1e7dd;
                    color: #0a3622;
                    border: 1px solid #a3cfbb;
                }}
                
                .loading {{
                    text-align: center;
                    color: #666;
                    font-style: italic;
                }}
                
                .security-badge {{
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin-top: 16px;
                    font-size: 12px;
                    color: #666;
                }}
                
                .security-badge::before {{
                    content: "🔒";
                    margin-right: 4px;
                }}
                
                label {{
                    display: block;
                    margin-bottom: 6px;
                    font-weight: 500;
                    color: #333;
                    font-size: 14px;
                }}
            </style>
        </head>
        <body>
            <div class="payment-container">
                <form id="form-checkout">
                    <div class="form-group">
                        <label for="cardNumber">Número do Cartão</label>
                        <input type="text" id="form-checkout__cardNumber" class="form-control" placeholder="1234 1234 1234 1234">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="expirationDate">Validade</label>
                            <input type="text" id="form-checkout__expirationDate" class="form-control" placeholder="MM/AA">
                        </div>
                        <div class="form-group">
                            <label for="securityCode">CVV</label>
                            <input type="text" id="form-checkout__securityCode" class="form-control" placeholder="123">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="cardholderName">Nome no Cartão</label>
                        <input type="text" id="form-checkout__cardholderName" class="form-control" placeholder="Como aparece no cartão" value="{user_name}">
                    </div>
                    
                    <div class="form-row">
                        <div class="form-group">
                            <label for="identificationType">Tipo de Documento</label>
                            <select id="form-checkout__identificationType" class="form-control">
                                <option value="">Selecione</option>
                                <option value="CPF">CPF</option>
                                <option value="CNPJ">CNPJ</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="identificationNumber">Número do Documento</label>
                            <input type="text" id="form-checkout__identificationNumber" class="form-control" placeholder="000.000.000-00">
                        </div>
                    </div>
                    
                    <div class="form-group">
                        <label for="installments">Parcelas</label>
                        <select id="form-checkout__installments" class="form-control">
                            <option value="">Carregando parcelas...</option>
                        </select>
                    </div>
                    
                    <button type="submit" id="form-checkout__submit" class="btn-pay">
                        💳 Pagar R$ {plan_info['preco']:.2f}
                    </button>
                    
                    <div class="security-badge">
                        Pagamento 100% seguro e criptografado
                    </div>
                    
                    <div id="form-checkout__error" class="alert alert-error" style="display: none;"></div>
                    <div id="form-checkout__success" class="alert alert-success" style="display: none;"></div>
                    <div id="form-checkout__loading" class="loading" style="display: none;">
                        Processando seu pagamento...
                    </div>
                </form>
            </div>

            <script>
                const mp = new MercadoPago('{self.public_key}', {{
                    locale: 'pt-BR'
                }});
                
                const cardForm = mp.cardForm({{
                    form: {{
                        id: "form-checkout",
                        cardNumber: {{
                            id: "form-checkout__cardNumber",
                            placeholder: "Número do cartão",
                        }},
                        expirationDate: {{
                            id: "form-checkout__expirationDate", 
                            placeholder: "MM/AA",
                        }},
                        securityCode: {{
                            id: "form-checkout__securityCode",
                            placeholder: "Código de segurança",
                        }},
                        cardholderName: {{
                            id: "form-checkout__cardholderName",
                            placeholder: "Titular do cartão",
                        }},
                        issuer: {{
                            id: "form-checkout__issuer",
                            placeholder: "Banco emissor",
                        }},
                        installments: {{
                            id: "form-checkout__installments",
                            placeholder: "Parcelas",
                        }},
                        identificationType: {{
                            id: "form-checkout__identificationType",
                            placeholder: "Tipo de documento",
                        }},
                        identificationNumber: {{
                            id: "form-checkout__identificationNumber", 
                            placeholder: "Número do documento",
                        }},
                    }},
                    callbacks: {{
                        onFormMounted: error => {{
                            if (error) {{
                                console.warn("Callback onFormMounted: ", error);
                                showError("Erro ao carregar o formulário. Recarregue a página.");
                            }}
                        }},
                        onSubmit: event => {{
                            event.preventDefault();
                            processPayment();
                        }},
                        onFetching: (resource) => {{
                            console.log("Fetching resource: ", resource);
                        }}
                    }}
                }});
                
                function showError(message) {{
                    const errorDiv = document.getElementById("form-checkout__error");
                    errorDiv.innerHTML = "❌ " + message;
                    errorDiv.style.display = "block";
                    
                    // Ocultar após 5 segundos
                    setTimeout(() => {{
                        errorDiv.style.display = "none";
                    }}, 5000);
                }}
                
                function showSuccess(message) {{
                    const successDiv = document.getElementById("form-checkout__success");
                    successDiv.innerHTML = "✅ " + message;
                    successDiv.style.display = "block";
                }}
                
                function showLoading(show) {{
                    const loadingDiv = document.getElementById("form-checkout__loading");
                    const submitBtn = document.getElementById("form-checkout__submit");
                    
                    loadingDiv.style.display = show ? "block" : "none";
                    submitBtn.disabled = show;
                    
                    if (!show) {{
                        submitBtn.innerHTML = "💳 Pagar R$ {plan_info['preco']:.2f}";
                    }} else {{
                        submitBtn.innerHTML = "Processando...";
                    }}
                }}
                
                async function processPayment() {{
                    try {{
                        showLoading(true);
                        hideMessages();
                        
                        const cardData = cardForm.getCardFormData();
                        
                        if (!cardData.token) {{
                            throw new Error("Token do cartão não foi gerado corretamente.");
                        }}
                        
                        // Preparar dados do pagamento
                        const paymentData = {{
                            plan_type: "{plan_type}",
                            user_email: "{user_email}",
                            user_name: "{user_name}",
                            card_token: cardData.token,
                            installments: parseInt(cardData.installments),
                            payment_method_id: cardData.payment_method_id,
                            issuer_id: cardData.issuer_id
                        }};
                        
                        console.log("Enviando pagamento:", {{...paymentData, card_token: "***"}});
                        
                        // Enviar para o backend
                        const response = await fetch("{self.api_url}/create-payment", {{
                            method: "POST",
                            headers: {{
                                "Content-Type": "application/json",
                                "Accept": "application/json"
                            }},
                            body: JSON.stringify(paymentData)
                        }});
                        
                        const result = await response.json();
                        
                        if (!response.ok) {{
                            throw new Error(result.detail || "Erro ao processar pagamento");
                        }}
                        
                        // Processar resultado
                        switch (result.status) {{
                            case "approved":
                                showSuccess("Pagamento aprovado! Redirecionando...");
                                setTimeout(() => {{
                                    window.parent.postMessage({{
                                        type: "payment_success",
                                        payment_id: result.payment_id,
                                        plan_type: result.plan_type
                                    }}, "*");
                                }}, 2000);
                                break;
                                
                            case "pending":
                                showSuccess("Pagamento em análise. Você será notificado por email quando for aprovado.");
                                setTimeout(() => {{
                                    window.parent.postMessage({{
                                        type: "payment_pending", 
                                        payment_id: result.payment_id
                                    }}, "*");
                                }}, 3000);
                                break;
                                
                            case "in_process":
                                showSuccess("Pagamento em processamento. Aguarde a confirmação.");
                                break;
                                
                            default:
                                throw new Error(result.status_detail || "Pagamento não foi aprovado");
                        }}
                        
                    }} catch (error) {{
                        console.error("Erro no pagamento:", error);
                        showError(error.message || "Erro inesperado. Tente novamente.");
                    }} finally {{
                        showLoading(false);
                    }}
                }}
                
                function hideMessages() {{
                    document.getElementById("form-checkout__error").style.display = "none";
                    document.getElementById("form-checkout__success").style.display = "none";
                }}
            </script>
        </body>
        </html>
        """
        
        # Renderizar o formulário
        components.html(payment_html, height=700)
        
        # JavaScript para capturar mensagens do iframe
        message_handler = """
        <script>
            window.addEventListener("message", function(event) {
                console.log("Received message:", event.data);
                
                if (event.data.type === "payment_success") {
                    // Pagamento aprovado - recarregar página
                    setTimeout(function() {
                        window.location.reload();
                    }, 3000);
                } else if (event.data.type === "payment_pending") {
                    // Pagamento pendente - mostrar mensagem
                    console.log("Payment pending:", event.data.payment_id);
                }
            });
        </script>
        """
        
        components.html(message_handler, height=0)

def update_user_profile(user_email: str, updated_data: dict):
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
        
        # Atualizar nome (coluna B)
        if 'nome' in updated_data:
            matrix_uploader.update_cells(USERS_SHEET_NAME, f"B{row_index}", [[updated_data['nome']]])
        
        log_action("ATUALIZOU_PERFIL", f"Email: {user_email}")
        return True
        
    except Exception as e:
        st.error(f"Erro ao atualizar perfil: {e}")
        return False

def handle_payment_webhook_in_streamlit(payment_data: dict):
    """Processa webhooks de pagamento no contexto do Streamlit"""
    try:
        if payment_data.get("status") == "approved":
            user_email = payment_data.get("user_email")
            plan_type = payment_data.get("plan_type")
            
            if user_email and plan_type:
                # Atualizar plano do usuário
                success = update_user_plan_after_payment(user_email, plan_type)
                if success:
                    log_action("PAGAMENTO_APROVADO", f"Email: {user_email}, Plano: {plan_type}, ID: {payment_data.get('payment_id')}")
                    return True
                    
    except Exception as e:
        st.error(f"Erro ao processar pagamento: {e}")
        
    return False

def update_user_plan_after_payment(user_email: str, new_plan: str):
    """Atualiza o plano do usuário após pagamento aprovado"""
    try:
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        users_data = matrix_uploader.get_data_from_sheet(USERS_SHEET_NAME)
        
        if not users_data or len(users_data) < 2:
            return False
            
        df_users = pd.DataFrame(users_data[1:], columns=users_data[0])
        user_row = df_users[df_users['email'] == user_email]
        
        if user_row.empty:
            return False
            
        row_index = user_row.index[0] + 2
        
        # Atualizar plano (coluna D), status (coluna E) e limpar trial (coluna I)
        matrix_uploader.update_cells(USERS_SHEET_NAME, f"D{row_index}:E{row_index}", [[new_plan, "ativo"]])
        matrix_uploader.update_cells(USERS_SHEET_NAME, f"I{row_index}", [[""]])  # Limpar trial
        
        return True
        
    except Exception as e:
        print(f"Erro ao atualizar plano após pagamento: {e}")
        return False

def show_contact_info():
    """Exibe informações de contato para suporte"""
    st.info("""
    ### 📞 Precisa de Ajuda?
    
    Nossa equipe está pronta para ajudar você:
    
    - 📧 **Email**: cristian.ferreira.carlos@gmail.com
    - 💼 **LinkedIn**: [Cristian Ferreira Carlos](https://www.linkedin.com/in/cristian-ferreira-carlos-256b19161/)
    - ⏰ **Horário**: Segunda a Sexta, 8h às 18h
    
    **Oferecemos**:
    - ✅ Demonstração personalizada  
    - ✅ Configuração guiada
    - ✅ Treinamento da equipe
    - ✅ Suporte técnico especializado
    """)

def show_payment_history():
    """Mostra histórico de pagamentos do usuário"""
    st.subheader("💳 Histórico de Pagamentos")
    
    # Por enquanto, apenas placeholder
    st.info("📋 Em breve você poderá consultar seu histórico completo de pagamentos aqui.")
    
    # TODO: Implementar consulta ao histórico de pagamentos
    # Isso pode ser feito consultando o backend de pagamentos
    pass

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
    
    # Verificar se há mensagem de sucesso de pagamento
    if 'payment_success' in st.session_state:
        st.success("🎉 **Pagamento realizado com sucesso!** Seu plano foi atualizado.")
        st.balloons()
        del st.session_state['payment_success']
        st.cache_data.clear()  # Limpar cache para recarregar dados
        st.rerun()
    
    # Abas principais
    tab_profile, tab_plan, tab_payment, tab_support = st.tabs([
        "📝 Dados Pessoais", 
        "💎 Meu Plano",
        "💳 Pagamentos",
        "🆘 Suporte"
    ])
    
    with tab_profile:
        st.header("Informações do Perfil")
        
        # Status da conta
        col1, col2 = st.columns(2)
        
        with col1:
            if user_status == "ativo":
                st.success(f"✅ **Status**: {user_status.title()}")
            else:
                st.warning(f"⚠️ **Status**: {user_status.title()}")
            
        with col2:
            plan_display = PLANOS_CONFIG.get(current_plan, {}).get('nome', current_plan.title())
            if is_trial:
                st.info(f"🚀 **Plano**: {plan_display} (Trial)")
            else:
                st.info(f"💎 **Plano**: {plan_display}")
        
        # Informações do trial
        if is_trial:
            trial_end = user_info.get('trial_end_date')
            if trial_end:
                if isinstance(trial_end, str):
                    trial_end = pd.to_datetime(trial_end).date()
                days_left = (trial_end - date.today()).days
                
                if days_left > 0:
                    st.info(f"⏰ **Trial Premium**: {days_left} dias restantes até {trial_end.strftime('%d/%m/%Y')}")
                else:
                    st.error("⌛ **Trial Premium**: Período expirado")
        
        st.markdown("---")
        
        # Formulário de edição de dados pessoais
        with st.form("profile_form"):
            st.subheader("✏️ Editar Dados Pessoais")
            
            # Nome (editável)
            new_name = st.text_input(
                "Nome Completo", 
                value=user_info.get('nome', user_name),
                help="Nome que aparecerá nos relatórios e certificados"
            )
            
            # Email (não editável)
            st.text_input(
                "Email", 
                value=user_email, 
                disabled=True,
                help="O email não pode ser alterado pois é usado para autenticação."
            )
            
            # Campos futuros
            with st.expander("📋 Campos Adicionais (Em Desenvolvimento)"):
                st.text_input("Telefone", placeholder="(11) 99999-9999", disabled=True)
                st.text_input("Empresa", placeholder="Nome da sua empresa", disabled=True)
                st.text_input("Cargo", placeholder="Seu cargo na empresa", disabled=True)
                st.info("💡 Estes campos estarão disponíveis em futuras atualizações.")
            
            submitted = st.form_submit_button(
                "💾 Salvar Alterações", 
                type="primary", 
                use_container_width=True
            )
            
            if submitted:
                if not new_name.strip():
                    st.error("❌ O nome não pode estar vazio.")
                else:
                    updated_data = {'nome': new_name.strip()}
                    
                    with st.spinner("Salvando alterações..."):
                        if update_user_profile(user_email, updated_data):
                            st.success("✅ Perfil atualizado com sucesso!")
                            st.cache_data.clear()
                            st.rerun()
                        else:
                            st.error("❌ Erro ao atualizar perfil. Tente novamente.")

    with tab_plan:
        st.header("💎 Gerenciar Plano")
        
        # Plano atual
        current_plan_info = PLANOS_CONFIG.get(current_plan, {})
        
        with st.container():
            st.markdown("### 📊 Plano Atual")
            
            col1, col2, col3 = st.columns([2, 1, 1])
            
            with col1:
                st.markdown(f"**{current_plan_info.get('nome', 'Plano Desconhecido')}**")
                st.markdown(current_plan_info.get('descricao', ''))
                
            with col2:
                if current_plan != 'basico':
                    st.metric("Valor Mensal", f"R$ {current_plan_info.get('preco', 0):.2f}")
                else:
                    st.metric("Valor Mensal", "Gratuito")
                    
            with col3:
                if is_trial:
                    st.info("🚀 **Trial Ativo**")
                else:
                    st.success("✅ **Plano Ativo**")
        
        # Recursos do plano atual
        with st.expander("📋 Recursos Inclusos no Seu Plano", expanded=True):
            for recurso in current_plan_info.get('recursos', []):
                st.markdown(f"- {recurso}")
        
        st.markdown("---")
        
        # Opções de upgrade
        st.subheader("⬆️ Fazer Upgrade")
        
        available_upgrades = []
        if current_plan == 'basico':
            available_upgrades = ['pro', 'premium_ia']
        elif current_plan == 'pro':
            available_upgrades = ['premium_ia']
        
        if available_upgrades:
            for upgrade_plan in available_upgrades:
                upgrade_info = PLANOS_CONFIG[upgrade_plan]
                
                with st.container():
                    st.markdown(f"### 🌟 {upgrade_info['nome']}")
                    
                    col1, col2, col3 = st.columns([2, 1, 1])
                    
                    with col1:
                        st.markdown(upgrade_info['descricao'])
                        
                        # Recursos exclusivos
                        st.markdown("**Recursos adicionais:**")
                        for recurso in upgrade_info['recursos'][-3:]:  # Últimos 3 recursos
                            st.markdown(f"- {recurso}")
                    
                    with col2:
                        st.metric("Valor Mensal", f"R$ {upgrade_info['preco']:.2f}")
                        
                    with col3:
                        if st.button(
                            f"Contratar {upgrade_info['nome']}", 
                            key=f"upgrade_{upgrade_plan}",
                            type="primary",
                            use_container_width=True
                        ):
                            st.session_state.selected_plan_upgrade = upgrade_plan
                            st.rerun()
                    
                st.markdown("---")
        else:
            st.success("🎉 **Você já possui o plano mais avançado!**")

    with tab_payment:
        st.header("💳 Pagamentos")
        
        # Verificar se há plano selecionado para upgrade
        if 'selected_plan_upgrade' in st.session_state:
            selected_plan = st.session_state.selected_plan_upgrade
            plan_info = PLANOS_CONFIG[selected_plan]
            
            st.markdown(f"### 🎯 Finalizando Contratação: {plan_info['nome']}")
            
            # Resumo da contratação
            with st.container():
                col1, col2 = st.columns([2, 1])
                
                with col1:
                    st.markdown(f"**{plan_info['nome']}**")
                    st.markdown(plan_info['descricao'])
                    
                    with st.expander("📋 Recursos Inclusos"):
                        for recurso in plan_info['recursos']:
                            st.markdown(f"- {recurso}")
                
                with col2:
                    st.metric("Valor Mensal", f"R$ {plan_info['preco']:.2f}")
                    st.metric("Setup", "Gratuito")
                    st.metric("**Total**", f"**R$ {plan_info['preco']:.2f}**")
            
            # Formulário de pagamento
            st.markdown("---")
            
            payment_integration = MercadoPagoPayment()
            payment_integration.render_payment_form(
                plan_type=selected_plan,
                user_email=user_email,
                user_name=user_name
            )
            
            # Botão para cancelar
            col1, col2, col3 = st.columns([1, 1, 1])
            with col2:
                if st.button("❌ Cancelar", key="cancel_payment"):
                    if 'selected_plan_upgrade' in st.session_state:
                        del st.session_state.selected_plan_upgrade
                    st.rerun()
        else:
            # Mostrar histórico de pagamentos
            show_payment_history()
            
            # Informações de cobrança
            st.subheader("💰 Informações de Cobrança")
            
            if current_plan == 'basico':
                st.info("✅ **Plano Gratuito** - Sem cobrança mensal")
            else:
                next_billing = date.today().replace(day=1) + timedelta(days=32)
                next_billing = next_billing.replace(day=1)
                
                st.info(f"""
                📅 **Próxima Cobrança**: {next_billing.strftime('%d/%m/%Y')}  
                💳 **Valor**: R$ {current_plan_info.get('preco', 0):.2f}  
                🔄 **Renovação**: Automática
                """)

    with tab_support:
        st.header("🆘 Central de Suporte")
        
        # Status do suporte
        support_priority = {
            'basico': {'level': '📧 Email', 'response': '48-72h'},
            'pro': {'level': '📞 Prioritário', 'response': '12-24h'},
            'premium_ia': {'level': '🎯 VIP 24/7', 'response': '1-4h'}
        }
        
        current_support = support_priority.get(current_plan, support_priority['basico'])
        
        col1, col2 = st.columns(2)
        with col1:
            st.metric("Nível de Suporte", current_support['level'])
        with col2:
            st.metric("Tempo de Resposta", current_support['response'])
        
        st.markdown("---")
        
        # Formulário de contato rápido
        with st.form("support_form"):
            st.subheader("📝 Enviar Solicitação de Suporte")
            
            support_type = st.selectbox(
                "Tipo da Solicitação",
                [
                    "Dúvida sobre Funcionalidade",
                    "Problema Técnico", 
                    "Solicitação de Feature",
                    "Problema de Pagamento",
                    "Outro"
                ]
            )
            
            subject = st.text_input("Assunto", placeholder="Descreva resumidamente sua solicitação")
            
            message = st.text_area(
                "Mensagem", 
                placeholder="Descreva detalhadamente sua solicitação ou problema...",
                height=150
            )
            
            # Informações do sistema (automático)
            with st.expander("🔧 Informações do Sistema (Automático)"):
                st.text(f"Usuário: {user_email}")
                st.text(f"Plano: {current_plan}")
                st.text(f"Status: {user_status}")
                st.text(f"Trial: {'Sim' if is_trial else 'Não'}")
            
            submitted = st.form_submit_button("📤 Enviar Solicitação", type="primary")
            
            if submitted:
                if not subject or not message:
                    st.error("❌ Por favor, preencha o assunto e a mensagem.")
                else:
                    # TODO: Integrar com sistema de tickets
                    st.success("✅ Solicitação enviada com sucesso! Você receberá uma resposta em breve.")
                    log_action("SOLICITACAO_SUPORTE", f"Tipo: {support_type}, Assunto: {subject}")
        
        st.markdown("---")
        
        # Informações de contato direto
        show_contact_info()
        
        # FAQ
        with st.expander("❓ Perguntas Frequentes"):
            st.markdown("""
            **P: Como funciona o período de teste?**  
            R: O trial de 14 dias dá acesso completo ao Plano Premium IA, incluindo todas as funcionalidades de IA.
            
            **P: Posso cancelar minha assinatura a qualquer momento?**  
            R: Sim, você pode cancelar a qualquer momento através do suporte.
            
            **P: Os dados ficam salvos se eu cancelar?**  
            R: Sim, seus dados são preservados por 90 dias após o cancelamento.
            
            **P: Como funciona o suporte técnico?**  
            R: O tempo de resposta varia conforme seu plano. Premium IA tem suporte prioritário.
            """)

if __name__ == "__main__":
    show_page()
