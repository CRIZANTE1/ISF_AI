import streamlit as st
import sys
import os

# Add root directory to path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '.')))

# Imports from the original file, deduplicated
from auth.login_page import show_login_page, show_user_header, show_logout_button
from auth.auth_utils import is_user_logged_in, get_user_info, initialize_unit_session, get_matrix_data
from operations.demo_page import show_demo_page
from config.page_config import set_page_config

# Set page config once at the beginning
set_page_config()

def show_admin_homepage():
    """Content for administrators."""
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

def show_homepage_for_role(role):
    """Displays the appropriate homepage content based on the user's role."""
    if role == 'admin':
        show_admin_homepage()
    elif role == 'editor':
        # As per original logic, editor sees the admin homepage
        show_admin_homepage()
    elif role == 'viewer':
        st.sidebar.warning("👁️ Acesso Somente Leitura")
        show_demo_page()
    else:
        st.sidebar.error("🔒 Acesso de Demonstração")
        show_demo_page()

def run_app():
    """
    The main application logic for a logged-in user.
    This includes drawing common UI elements and handling the UO selection.
    """
    # Common UI elements for all pages
    show_user_header()
    show_logout_button()

    role, assigned_unit = get_user_info()
    
    # --- Logic for selecting Operational Unit (UO) ---
    selected_unit = None
    if role == 'admin' and assigned_unit == '*':
        # Global admin can choose the UO
        _, units_df = get_matrix_data()
        unit_options = units_df['nome_unidade'].tolist()
        if unit_options:
            # Add a placeholder to the beginning of the list
            unit_options.insert(0, "Selecione uma UO...")
            selected_unit = st.sidebar.selectbox("Selecionar Unidade Operacional:", unit_options, index=0)
        else:
            st.sidebar.error("Nenhuma UO cadastrada.")
    else:
        # Normal user has a fixed UO
        selected_unit = assigned_unit

    # If a UO is selected/assigned, initialize the session with its IDs
    if selected_unit and selected_unit != "Selecione uma UO...":
        # Initialize the session and display the main content
        if initialize_unit_session(selected_unit):
            st.sidebar.success(f"Visão da UO: **{selected_unit}**")
            show_homepage_for_role(role)
        else:
            # Error is shown by initialize_unit_session
            pass 
    elif role == 'admin' and assigned_unit == '*':
         st.info("Por favor, selecione uma Unidade Operacional na barra lateral para começar.")
    else:
        st.error("Nenhuma Unidade Operacional está associada a este usuário ou falha ao carregar a configuração.")

# --- Main execution block ---
# This top-level logic routes the user to the login page or the main app
if not is_user_logged_in():
    show_login_page()
else:
    run_app()

# Footer (optional, but was in the original file)
st.caption('Copyright 2024, Cristian Ferreira Carlos, Todos os direitos reservados.')
st.caption('https://www.linkedin.com/in/cristian-ferreira-carlos-256b19161/')