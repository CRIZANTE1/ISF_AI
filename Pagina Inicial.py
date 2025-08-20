import streamlit as st
from streamlit_option_menu import option_menu

# --- 1. Importe os MÓDULOS da sua nova pasta 'views' ---
# É importante renomear os arquivos para nomes válidos em Python
from views import (
    administracao,
    dashboard, 
    inspecao_extintores, 
    inspecao_mangueiras, 
    inspecao_scba,
    inspecao_chuveiros,
    historico,
    utilitarios
)

# --- 2. Suas importações normais ---
from auth.login_page import show_login_page, show_logout_button, show_user_header
from auth.auth_utils import is_user_logged_in, setup_sidebar, can_edit, is_admin
from config.page_config import set_page_config

# Configuração da página, sempre no início
set_page_config()

# --- 3. Dicionário de Roteamento ---
# Mapeia o nome que aparecerá no menu para a função que desenha a página.
# Isso torna o código principal muito limpo.
PAGES = {
    "Dashboard": dashboard.show_page,
    "Inspeção de Extintores": inspecao_extintores.show_page,
    "Inspeção de Mangueiras": inspecao_mangueiras.show_page,
    "Inspeção de SCBA": inspecao_scba.show_page,
    "Inspeção de Chuveiros/LO": inspecao_chuveiros.show_page,
    "Histórico e Logs": historico.show_page,
    "Utilitários": utilitarios.show_page,
    "Super Admin": administracao.show_page,
}

def main():
    # --- Gerenciamento de Login ---
    if not is_user_logged_in():
        show_login_page()
        st.stop() # Para a execução aqui se o usuário não estiver logado

    # --- Interface Comum para Todos os Usuários Logados ---
    show_user_header()
    
    # A função setup_sidebar aqui apenas lida com a seleção da UO,
    # não mais com a navegação de páginas.
    is_uo_selected = setup_sidebar()
    
    # --- Menu de Navegação Dinâmico na Barra Lateral ---
    with st.sidebar:
        st.markdown("---")
        
        # Lista de todas as páginas disponíveis
        page_options = list(PAGES.keys())
        
        # Regra de negócio: A página "Super Admin" só aparece para administradores
        if not is_admin():
            page_options.remove("Super Admin")

        selected_page = option_menu(
            menu_title="Navegação",
            options=page_options,
            icons=["speedometer2", "fire", "droplet", "lungs", "droplet-half", "clock-history", "tools", "person-badge"],
            menu_icon="compass-fill",
            default_index=0,
        )
        st.markdown("---")

    # --- Roteador Principal ---
    # Só tenta renderizar a página se uma UO estiver selecionada
    if is_uo_selected:
        # Busca a função no dicionário e a executa
        if selected_page in PAGES:
            PAGES[selected_page]()
        else:
            # Se algo der errado, mostra a página padrão
            PAGES["Dashboard"]()
    else:
        # Mensagem para o usuário selecionar uma UO para começar
        st.info("👈 Por favor, selecione uma Unidade Operacional na barra lateral para carregar os dados.")


if __name__ == "__main__":
    main()