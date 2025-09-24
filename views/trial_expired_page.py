import streamlit as st
from auth.auth_utils import get_user_display_name

def show_page():
    """
    Exibe uma página informando que o período de teste do usuário expirou.
    """
    st.title("⏳ Seu Período de Teste Terminou")
    st.image("https://i.imgur.com/8kJU524.png", width=200) # Imagem de um cadeado
    
    user_name = get_user_display_name()
    
    st.warning(f"Olá, **{user_name}**. Seu período de teste de 14 dias do plano Premium IA chegou ao fim.")
    
    st.markdown("""
    Esperamos que você tenha aproveitado a experiência completa do nosso sistema!
    
    Para continuar utilizando todas as funcionalidades e garantir a segurança dos seus dados, por favor, escolha um de nossos planos.
    """)
    
    st.header("Assine um Plano para Continuar")
    st.info("Entre em contato com nosso time de vendas para ativar sua conta permanentemente.")
    
    # Substitua com suas informações de contato
    st.markdown("- **Email:** `contato@suaempresa.com`")
    st.markdown("- **Website:** [www.suaempresa.com/planos](https://www.suaempresa.com/planos)")
    
    st.balloons()
