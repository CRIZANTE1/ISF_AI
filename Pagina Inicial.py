import streamlit as st
import sys
import os
from auth.login_page import show_login_page, show_user_header, show_logout_button
from auth.auth_utils import is_user_logged_in, is_admin, can_edit, can_view, get_user_role
from operations.demo_page import show_demo_page
from config.page_config import set_page_config 

set_page_config()

def show_admin_homepage():
    """Conteúdo completo para administradores."""
    st.sidebar.success("👑 Acesso de Administrador")
    st.title("Bem-vindo ao ISF IA!")
    st.subheader("Sistema de Fiscalização e Inspeções com Inteligência Artificial")
    st.markdown("""
    Use a barra de navegação à esquerda para acessar as funcionalidades do sistema.

    - **Inspeção de Extintores**: Registre novas inspeções, extraia dados de relatórios PDF com IA e salve o histórico.
    - **Situação Atual**: Visualize um dashboard com o status de todos os equipamentos.
    - **Histórico de Inspeções**: Consulte todos os registros já realizados.
    
    Este sistema foi projetado para otimizar e padronizar o processo de inspeção de equipamentos de combate a incêndio, 
    garantindo conformidade com as normas e segurança.
    """)

def show_editor_homepage():
    """Conteúdo para editores (pode ser o mesmo do admin ou um pouco diferente)."""
    st.sidebar.info("✏️ Acesso de Editor")
    st.title("Bem-vindo ao ISF IA!")
    st.subheader("Sistema de Fiscalização e Inspeções com Inteligência Artificial")
    st.markdown("""
    Você tem permissão para registrar novas inspeções e atualizar o status dos equipamentos.
    Use a barra de navegação à esquerda para acessar as funcionalidades de edição.
    """)

def main():
    if not is_user_logged_in():
        show_login_page()
        return

    show_user_header()
    show_logout_button() 

    user_role = get_user_role()

    import streamlit as st
import sys
import os
from auth.login_page import show_login_page, show_user_header, show_logout_button
from auth.auth_utils import is_user_logged_in, get_user_info, initialize_unit_session, get_matrix_data
from operations.demo_page import show_demo_page
from config.page_config import set_page_config 

set_page_config()

def show_admin_homepage():
    """Conteúdo completo para administradores."""
    st.sidebar.success("👑 Acesso de Administrador")
    st.title("Bem-vindo ao ISF IA!")
    st.subheader("Sistema de Fiscalização e Inspeções com Inteligência Artificial")
    st.markdown("""
    Use a barra de navegação à esquerda para acessar as funcionalidades do sistema.

    - **Inspeção de Extintores**: Registre novas inspeções, extraia dados de relatórios PDF com IA e salve o histórico.
    - **Situação Atual**: Visualize um dashboard com o status de todos os equipamentos.
    - **Histórico de Inspeções**: Consulte todos os registros já realizados.
    
    Este sistema foi projetado para otimizar e padronizar o processo de inspeção de equipamentos de combate a incêndio, 
    garantindo conformidade com as normas e segurança.
    """)

def show_editor_homepage():
    """Conteúdo para editores (pode ser o mesmo do admin ou um pouco diferente)."""
    st.sidebar.info("✏️ Acesso de Editor")
    st.title("Bem-vindo ao ISF IA!")
    st.subheader("Sistema de Fiscalização e Inspeções com Inteligência Artificial")
    st.markdown("""
    Você tem permissão para registrar novas inspeções e atualizar o status dos equipamentos.
    Use a barra de navegação à esquerda para acessar as funcionalidades de edição.
    """)

def show_homepage_for_role(role):
    if role == 'admin':
        show_admin_homepage()
    elif role == 'editor':
        show_admin_homepage() # Reutilizando a função
    elif role == 'viewer':
        st.sidebar.warning("👁️ Acesso Somente Leitura")
        show_demo_page()
    else:
        st.sidebar.error("🔒 Acesso de Demonstração")
        show_demo_page()

def main():
    if not is_user_logged_in():
        show_login_page()
        return

    show_user_header()
    show_logout_button() 

    role, assigned_unit = get_user_info()
    
    # --- LÓGICA DE SELEÇÃO DE UNIDADE OPERACIONAL ---
    selected_unit = None
    if role == 'admin' and assigned_unit == '*':
        # Administrador Global: pode escolher a UO
        _, units_df = get_matrix_data()
        unit_options = units_df['nome_unidade'].tolist()
        if unit_options:
            selected_unit = st.sidebar.selectbox("Selecionar Unidade Operacional:", unit_options)
        else:
            st.sidebar.error("Nenhuma UO cadastrada.")
    else:
        # Usuário normal: UO é fixa
        selected_unit = assigned_unit

    # Se uma UO foi selecionada/atribuída, inicializa a sessão com seus IDs
    if selected_unit:
        if initialize_unit_session(selected_unit):
            # Exibe a página principal somente se a sessão da UO foi carregada com sucesso
            show_homepage_for_role(role)
    else:
        st.error("Nenhuma Unidade Operacional associada a este usuário.")

if __name__ == "__main__":
    main()
    st.caption('Copyright 2024, Cristian Ferreira Carlos, Todos os direitos reservados.')
    st.caption('https://www.linkedin.com/in/cristian-ferreira-carlos-256b19161/')


if __name__ == "__main__":
    main()
    st.caption('Copyright 2024, Cristian Ferreira Carlos, Todos os direitos reservados.')
    st.caption('https://www.linkedin.com/in/cristian-ferreira-carlos-256b19161/')
