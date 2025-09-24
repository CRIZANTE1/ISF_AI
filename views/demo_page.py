import streamlit as st
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

# --- IMPORTAÇÕES CORRIGIDAS ---
# Removemos a chamada para a função inexistente 'get_matrix_data'
from auth.auth_utils import get_user_display_name, save_access_request

def show_page():
    """
    Exibe uma página de acesso negado com um formulário simplificado para solicitar
    o início de um período de teste (trial).
    """
    st.title("Sistema de Gestão de Inspeções de Incêndio")
    st.header("Acesso Restrito")
    
    user_name = get_user_display_name()
    user_email = "não identificado"
    if hasattr(st.user, 'email'):
        user_email = st.user.email

    st.warning(f"🔒 Olá, **{user_name}**. Você está autenticado, mas seu e-mail (`{user_email}`) ainda não está cadastrado em nosso sistema.")
    
    st.session_state.setdefault('request_submitted', False)

    if st.session_state.request_submitted:
        st.success("✅ Sua solicitação de acesso foi enviada! Nossa equipe avaliará seu pedido e você será notificado por e-mail em breve.")
    else:
        st.markdown("---")
        st.subheader("Solicite seu Período de Teste de 14 Dias")
        st.write("Para obter acesso, basta enviar a solicitação abaixo. Sua conta será provisionada com o plano Premium IA para você testar todas as funcionalidades.")

        # --- LÓGICA SIMPLIFICADA ---
        # REMOVIDO o selectbox de UO, pois não é mais necessário.
        with st.form("access_request_form"):
            justification = st.text_area(
                "Deixe uma mensagem (Opcional)", 
                placeholder="Ex: Gostaria de testar o sistema para a minha empresa de segurança."
            )
            
            submitted = st.form_submit_button("Iniciar meu Teste Gratuito", type="primary")

            if submitted:
                with st.spinner("Enviando solicitação..."):
                    # Chamamos a função com a assinatura correta (sem 'requested_unit')
                    if save_access_request(user_name, user_email, justification):
                        st.session_state.request_submitted = True
                        st.rerun()

    st.markdown("---")
    st.subheader("Demonstração do Sistema")
    st.video('https://youtu.be/h7DSCUAzHsE')
