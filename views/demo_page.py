import streamlit as st
import sys
import os
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from auth.auth_utils import get_user_display_name, get_matrix_data, save_access_request

def show_page():
    """
    Exibe uma página de acesso negado com um formulário para solicitar acesso.
    """
    st.title("Sistema de Gestão de Inspeções de Incêndio")
    st.header("Acesso Restrito")
    
    user_name = get_user_display_name()
    user_email = "não identificado"
    if hasattr(st.user, 'email'):
        user_email = st.user.email

    st.warning(f"🔒 Olá, **{user_name}**. Você está autenticado, mas seu usuário (`{user_email}`) ainda não tem permissão para acessar o sistema.")
    st.session_state.setdefault('request_submitted', False)

    if st.session_state.request_submitted:
        st.success("✅ Sua solicitação de acesso foi enviada com sucesso! Você será notificado por e-mail quando o administrador avaliar seu pedido.")
    else:
        st.markdown("---")
        st.subheader("Solicitar Acesso")
        st.write("Para obter acesso, preencha o formulário abaixo. Sua solicitação será enviada a um administrador global para aprovação.")

        _, units_df = get_matrix_data()
        unit_options = ["Selecione a UO desejada..."] + units_df['nome_unidade'].tolist()

        with st.form("access_request_form"):
            requested_unit = st.selectbox("Unidade Operacional (UO) que deseja acessar:", unit_options)
            justification = st.text_area("Justificativa (Opcional)", placeholder="Ex: Faço parte da equipe de segurança da UO e preciso visualizar os relatórios.")
            
            submitted = st.form_submit_button("Enviar Solicitação", type="primary")

            if submitted:
                if requested_unit == "Selecione a UO desejada...":
                    st.error("Por favor, selecione uma Unidade Operacional.")
                else:
                    with st.spinner("Enviando..."):
                        if save_access_request(user_name, user_email, requested_unit, justification):
                            st.session_state.request_submitted = True
                            st.rerun()

    st.markdown("---")
    st.subheader("Demonstração do Sistema")
    st.video('https://youtu.be/h7DSCUAzHsE')
