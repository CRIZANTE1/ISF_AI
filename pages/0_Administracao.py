
import streamlit as st
import sys
import os
import pandas as pd
import yaml  # Importa a biblioteca para ler o arquivo de configuração

# Adiciona o diretório raiz ao path para encontrar os módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.auth_utils import get_user_info, get_matrix_data
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import UNITS_SHEET_NAME, ADMIN_SHEET_NAME, CENTRAL_DRIVE_FOLDER_ID
from operations.demo_page import show_demo_page
from config.page_config import set_page_config

set_page_config()

# --- Carrega a configuração da estrutura da planilha do arquivo YAML ---
@st.cache_data
def load_sheets_config():
    """Carrega a configuração da estrutura da planilha do arquivo YAML."""
    # Constrói o caminho para a pasta 'config' que está no mesmo nível da pasta 'pages'
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'sheets_config.yaml')
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except FileNotFoundError:
        st.error("Arquivo de configuração 'config/sheets_config.yaml' não encontrado.")
        return {}
    except Exception as e:
        st.error(f"Erro ao ler o arquivo de configuração YAML: {e}")
        return {}

DEFAULT_SHEETS_CONFIG = load_sheets_config()

# --- Função Principal da Página de Administração ---
def show_admin_page():
    st.title("👑 Painel de Controle do Super Administrador")

    tab_users, tab_units, tab_provision = st.tabs([
        "👤 Gestão de Usuários",
        "🏢 Gestão de Unidades Operacionais",
        "🚀 Provisionar Nova UO"
    ])

    # --- ABA DE GESTÃO DE USUÁRIOS ---
    with tab_users:
        st.header("Gerenciar Acessos de Usuários")
        st.info("Adicione, edite ou remova usuários do sistema. As alterações são salvas diretamente na planilha matriz.")

        try:
            permissions_df, _ = get_matrix_data()
            
            if permissions_df.empty:
                st.warning("A aba 'adm' da planilha matriz está vazia ou não foi encontrada.")
                permissions_df = pd.DataFrame(columns=['email', 'role', 'unidade_operacional'])

            if 'original_users_df' not in st.session_state:
                st.session_state.original_users_df = permissions_df.copy()

            # Editor de dados interativo
            edited_df = st.data_editor(
                permissions_df,
                num_rows="dynamic",
                column_config={
                    "email": st.column_config.TextColumn("E-mail do Usuário", required=True),
                    "role": st.column_config.SelectboxColumn(
                        "Nível de Acesso (role)",
                        options=["admin", "editor", "viewer"],
                        required=True
                    ),
                    "unidade_operacional": st.column_config.TextColumn(
                        "Unidade Operacional",
                        help="Use '*' para acesso a todas as UOs (apenas para admins).",
                        required=True
                    )
                },
                use_container_width=True,
                key="user_editor"
            )

            if not edited_df.equals(st.session_state.original_users_df):
                if st.button("💾 Salvar Alterações nos Usuários", type="primary"):
                    with st.spinner("Salvando..."):
                        edited_df.dropna(how='all', inplace=True)
                        
                        matrix_uploader = GoogleDriveUploader(is_matrix=True)
                        matrix_uploader.overwrite_sheet(ADMIN_SHEET_NAME, edited_df)
                        
                        st.success("Lista de usuários atualizada com sucesso!")
                        st.cache_data.clear()
                        del st.session_state.original_users_df
                        st.rerun()

        except Exception as e:
            st.error(f"Erro ao carregar ou editar usuários: {e}")
            st.exception(e)

    # --- ABA DE GESTÃO DE UNIDADES OPERACIONAIS ---
    with tab_units:
        st.header("Unidades Operacionais Cadastradas")
        st.info("Visualize todas as UOs configuradas no sistema.")
        
        _, units_df_raw = get_matrix_data()
        
        if units_df_raw.empty:
            st.warning("Nenhuma Unidade Operacional cadastrada. Use a aba 'Provisionar Nova UO' para começar.")
        else:
            # Prepara o DataFrame para exibição com links clicáveis
            units_df_display = units_df_raw.copy()
            units_df_display['spreadsheet_link'] = 'https://docs.google.com/spreadsheets/d/' + units_df_display['spreadsheet_id'].astype(str)
            units_df_display['folder_link'] = 'https://drive.google.com/drive/folders/' + units_df_display['folder_id'].astype(str)
            
            st.dataframe(
                units_df_display,
                column_config={
                    "nome_unidade": "Nome da UO",
                    "spreadsheet_id": "ID da Planilha",
                    "folder_id": "ID da Pasta",
                    "spreadsheet_link": st.column_config.LinkColumn(
                        "Link da Planilha",
                        display_text="🔗 Abrir Planilha"
                    ),
                     "folder_link": st.column_config.LinkColumn(
                        "Link da Pasta",
                        display_text="🔗 Abrir Pasta"
                    )
                },
                column_order=("nome_unidade", "spreadsheet_link", "folder_link", "spreadsheet_id", "folder_id"),
                use_container_width=True
            )

    # --- ABA DE PROVISIONAMENTO ---
    with tab_provision:
        st.header("Provisionar Nova Unidade Operacional")
        st.info("Esta ferramenta automatiza a criação de toda a infraestrutura necessária para uma nova UO.")
        
        new_unit_name = st.text_input("Nome da Nova UO (ex: Santos)")
        
        if st.button(f"🚀 Criar Estrutura Completa para a UO '{new_unit_name}'", type="primary"):
            if not new_unit_name:
                st.error("O nome da Unidade Operacional não pode ser vazio.")
            # Verifica se a configuração foi carregada antes de prosseguir
            elif not DEFAULT_SHEETS_CONFIG:
                st.error("A configuração das planilhas (sheets_config.yaml) não pôde ser carregada. Verifique os logs.")
            else:
                with st.spinner(f"Criando infraestrutura para '{new_unit_name}'..."):
                    try:
                        uploader = GoogleDriveUploader()
                        new_sheet_id = uploader.create_new_spreadsheet(f"ISF IA - {new_unit_name}")
                        new_folder_id = uploader.create_drive_folder(
                            name=f"SFIA - Arquivos UO {new_unit_name}",
                            parent_folder_id=CENTRAL_DRIVE_FOLDER_ID
                        )
                        uploader.move_file_to_folder(new_sheet_id, new_folder_id)
                        uploader.setup_sheets_in_new_spreadsheet(new_sheet_id, DEFAULT_SHEETS_CONFIG)
                        
                        matrix_uploader = GoogleDriveUploader(is_matrix=True)
                        new_unit_row = [new_unit_name, new_sheet_id, new_folder_id]
                        matrix_uploader.append_data_to_sheet(UNITS_SHEET_NAME, new_unit_row)

                        st.success(f"Unidade Operacional '{new_unit_name}' criada e configurada com sucesso!")
                        st.balloons()
                        st.cache_data.clear()

                    except Exception as e:
                        st.error("Ocorreu um erro durante o provisionamento. Verifique os logs.")
                        st.exception(e)

# --- Verificação de Permissão (não precisa de alteração) ---
role, assigned_unit = get_user_info()

if role == 'admin' and assigned_unit == '*':
    st.sidebar.success("👑 Acesso de Super Admin")
    show_admin_page()
else:
    st.sidebar.error("🔒 Acesso Negado")
    st.error("Você não tem permissão para acessar esta página.")
    st.info("Apenas administradores globais podem gerenciar o sistema.")
    show_demo_page()
