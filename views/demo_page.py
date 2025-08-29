import streamlit as st
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from auth.auth_utils import get_user_display_name

def show_page(admin_email="seu_email_de_admin@exemplo.com"):
    """
    Exibe uma página estática de acesso negado para usuários autenticados, mas não autorizados.
    """
    st.title("Sistema de Gestão de Inspeções de Incêndio")
    st.header("Acesso Restrito")
    
    user_name = get_user_display_name()
    user_email = "não identificado"
    if hasattr(st.user, 'email'):
        user_email = st.user.email

    st.warning(f"🔒 Olá, **{user_name}**. Você está autenticado, mas seu usuário (`{user_email}`) ainda não tem permissão para acessar o sistema.")

    st.markdown("---")
    st.subheader("Como Obter Acesso?")
    st.write("Para visualizar os dashboards e registrar inspeções, seu e-mail precisa ser cadastrado por um administrador. Clique no botão abaixo para enviar uma solicitação de acesso.")

    # Cria o link mailto:
    subject = "Solicitação de Acesso ao Sistema de Inspeção"
    body = (f"Olá,\n\nEu, {user_name}, gostaria de solicitar acesso ao Sistema de Gestão de Inspeções.\n\n"
            f"Por favor, me conceda permissão de 'visualizador' (viewer) para a Unidade Operacional [PREENCHA O NOME DA UO AQUI].\n\n"
            f"Meu e-mail de login é: {user_email}\n\nObrigado(a).")
    
    # Codifica o corpo do e-mail para URL
    import urllib.parse
    body_encoded = urllib.parse.quote(body)
    
    link = f"mailto:{admin_email}?subject={subject}&body={body_encoded}"
    st.link_button("📧 Enviar Solicitação de Acesso por E-mail", url=link, type="primary")

    st.markdown("---")
    st.subheader("Demonstração do Sistema")
    st.video('https://youtu.be/h7DSCUAzHsE')
