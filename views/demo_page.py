import streamlit as st
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.auth_utils import get_user_display_name, save_access_request
from auth.login_page import show_logout_button 

def show_page():
    """
    Exibe uma página de acesso negado com um formulário para solicitar
    o início de um período de teste (trial) E UM BOTÃO DE LOGOUT.
    """
    st.title("Sistema de Gestão de Inspeções de Incêndio")
    st.header("Acesso Restrito")
    
    user_name = get_user_display_name()
    user_email = "não identificado"
    # A função get_user_email() de auth_utils já faz isso de forma segura
    from auth.auth_utils import get_user_email
    user_email = get_user_email()

    st.warning(f"🔒 Olá, **{user_name}**. Você está autenticado, mas seu e-mail (`{user_email}`) ainda não está cadastrado em nosso sistema.")
    
    # --- BOTÃO DE LOGOUT ADICIONADO AQUI ---
    # Adicionamos o botão de logout em uma coluna para destacá-lo
    # sem ocupar a largura total da página.
    col1, col2, col3 = st.columns([1.5, 1, 1.5])
    with col2:
        # Reutilizamos a função de logout para manter a consistência.
        # Ela já sabe como limpar as sessões do Google e do Azure.
        if st.button("🚪 Sair / Trocar de Conta", use_container_width=True):
            # A lógica de logout já está encapsulada na função
            # show_logout_button() fará o st.rerun() necessário
            
            # Limpa sessões manualmente como uma garantia extra antes de chamar a função
            keys_to_clear = ['is_logged_in', 'user_info_custom']
            for key in keys_to_clear:
                if key in st.session_state:
                    del st.session_state[key]
            
            try:
                # Chama a função de logout que lida com OIDC
                st.logout()
            except Exception:
                # Se não houver sessão OIDC, apenas recarrega
                st.rerun()

    # --- FIM DA ADIÇÃO DO BOTÃO ---
    
    st.session_state.setdefault('request_submitted', False)

    if st.session_state.request_submitted:
        st.success("✅ Sua solicitação de acesso foi enviada! Nossa equipe avaliará seu pedido e você será notificado por e-mail em breve.")
    else:
        st.markdown("---")
        st.subheader("Solicite seu Período de Teste de 14 Dias")
        st.write("Para obter acesso, basta enviar a solicitação abaixo. Sua conta será provisionada com o plano Premium IA para você testar todas as funcionalidades.")

        with st.form("access_request_form"):
            justification = st.text_area(
                "Deixe uma mensagem (Opcional)", 
                placeholder="Ex: Gostaria de testar o sistema para a minha empresa de segurança."
            )
            
            submitted = st.form_submit_button("Iniciar meu Teste Gratuito", type="primary")

            if submitted:
                with st.spinner("Enviando solicitação..."):
                    if save_access_request(user_name, user_email, justification):
                        st.session_state.request_submitted = True
                        st.rerun()

    st.markdown("---")
    st.subheader("Demonstração do Sistema")
    st.info("Em breve disponibilizaremos um vídeo demonstrativo das funcionalidades.")
