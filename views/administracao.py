import streamlit as st
import sys
import os
import pandas as pd
import yaml
from datetime import date, timedelta
from functools import reduce

# Adiciona o diretório raiz ao path para encontrar os outros módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.auth_utils import get_users_data
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import (
    USERS_SHEET_NAME, get_central_drive_folder_id, ACCESS_REQUESTS_SHEET_NAME,
    AUDIT_LOG_SHEET_NAME, EXTINGUISHER_SHEET_NAME # Adicione outros sheets para o dashboard
)
from config.page_config import set_page_config
from utils.auditoria import log_action

set_page_config()

@st.cache_data(show_spinner=False)
def load_sheets_config():
    """Carrega a configuração de cabeçalhos das planilhas a partir de um arquivo YAML."""
    config_path = os.path.join(os.path.dirname(__file__), '..', 'config', 'sheets_config.yaml')
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception:
        st.error("Arquivo de configuração 'config/sheets_config.yaml' não encontrado ou inválido.")
        return {}

def provision_user_environment(user_email, user_name):
    """Cria a infraestrutura (planilha, pasta) para um novo usuário."""
    DEFAULT_SHEETS_CONFIG = load_sheets_config()
    if not DEFAULT_SHEETS_CONFIG:
        st.error("Configuração YAML das planilhas não carregada. Impossível provisionar.")
        return False, None, None
    try:
        uploader = GoogleDriveUploader()
        central_folder_id = get_central_drive_folder_id()
        
        st.info(f"1/4 - Criando planilha para {user_name}...")
        new_sheet_id = uploader.create_new_spreadsheet(f"ISF IA - Dados de {user_name}")
        
        st.info(f"2/4 - Criando pasta no Google Drive...")
        new_folder_id = uploader.create_drive_folder(f"SFIA - Arquivos de {user_name}", central_folder_id)
        
        st.info(f"3/4 - Organizando arquivos...")
        uploader.move_file_to_folder(new_sheet_id, new_folder_id)

        st.info(f"4/4 - Configurando abas e cabeçalhos...")
        uploader.setup_sheets_in_new_spreadsheet(new_sheet_id, DEFAULT_SHEETS_CONFIG)
        
        log_action("PROVISIONOU_AMBIENTE_USUARIO", f"Email: {user_email}, Sheet ID: {new_sheet_id}")
        return True, new_sheet_id, new_folder_id
    except Exception as e:
        st.error(f"Ocorreu um erro durante o provisionamento para {user_name}."); st.exception(e)
        return False, None, None

def show_page():
    st.title("👑 Painel de Controle do Super Administrador")

    tab_dashboard, tab_requests, tab_users, tab_audit = st.tabs([
        "📊 Dashboard Global", "📬 Solicitações", "👤 Usuários e Planos", "🛡️ Auditoria"
    ])

    with tab_dashboard:
        st.header("Visão Geral do Status de Todos os Usuários Ativos")
        if st.button("Recarregar Dados de Todos os Usuários"):
            st.cache_data.clear()
            st.rerun()

        users_df = get_users_data()
        st.info(f"Analisando dados de **{len(users_df[users_df['status'] == 'ativo'])}** usuários ativos.")
        # Lógica do dashboard aqui (pode ser pesada, mantenha-a opcional ou otimizada)
        # Exemplo simplificado:
        st.write("Funcionalidade de Dashboard Global em desenvolvimento.")


    with tab_requests:
        st.header("Gerenciar Solicitações de Acesso Pendentes")
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        try:
            requests_data = matrix_uploader.get_data_from_sheet(ACCESS_REQUESTS_SHEET_NAME)
            df_requests = pd.DataFrame(requests_data[1:], columns=requests_data[0]) if requests_data and len(requests_data) > 1 else pd.DataFrame()
            pending_requests = df_requests[df_requests['status'] == 'Pendente'] if not df_requests.empty else pd.DataFrame()

            if pending_requests.empty:
                st.success("✅ Nenhuma solicitação de acesso pendente.")
            else:
                st.info(f"Você tem {len(pending_requests)} solicitação(ões) para avaliar.")
                for index, request in pending_requests.iterrows():
                    with st.container(border=True):
                        st.write(f"**Usuário:** {request['nome_usuario']} (`{request['email_usuario']}`)")
                        cols = st.columns([2, 1, 1])
                        role = cols[0].selectbox("Atribuir Perfil:", ["editor", "viewer"], key=f"role_{index}")
                        
                        if cols[1].button("Aprovar e Iniciar Trial", key=f"approve_{index}", type="primary"):
                            with st.spinner(f"Provisionando ambiente para {request['nome_usuario']}..."):
                                success, sheet_id, folder_id = provision_user_environment(request['email_usuario'], request['nome_usuario'])
                                if success:
                                    today = date.today()
                                    trial_end = today + timedelta(days=14)
                                    new_user_row = [
                                        request['email_usuario'], request['nome_usuario'], role,
                                        'premium_ia', 'ativo', sheet_id, folder_id,
                                        today.isoformat(), trial_end.isoformat()
                                    ]
                                    matrix_uploader.append_data_to_sheet(USERS_SHEET_NAME, [new_user_row])
                                    matrix_uploader.update_cells(ACCESS_REQUESTS_SHEET_NAME, f"F{index + 2}", [['Aprovado']])
                                    log_action("APROVOU_ACESSO_COM_TRIAL", f"Email: {request['email_usuario']}")
                                    st.success(f"Usuário {request['nome_usuario']} aprovado com 14 dias de teste Premium!")
                                    st.cache_data.clear(); st.rerun()

                        if cols[2].button("Rejeitar", key=f"reject_{index}"):
                            matrix_uploader.update_cells(ACCESS_REQUESTS_SHEET_NAME, f"F{index + 2}", [['Rejeitado']])
                            log_action("REJEITOU_ACESSO", f"Email: {request['email_usuario']}")
                            st.warning(f"Solicitação de {request['nome_usuario']} rejeitada.")
                            st.cache_data.clear(); st.rerun()
        except Exception as e:
            st.error(f"Não foi possível carregar as solicitações de acesso: {e}")

    with tab_users:
        st.header("Gerenciar Usuários e Planos")
        users_df = get_users_data()
        if users_df.empty:
            st.info("Nenhum usuário cadastrado.")
        else:
            st.dataframe(users_df.drop(columns=['spreadsheet_id', 'folder_id'], errors='ignore'), use_container_width=True)
            st.markdown("---")
            st.subheader("Ações de Gerenciamento")
            
            user_list = users_df['email'].tolist()
            selected_email = st.selectbox("Selecione um usuário para gerenciar:", options=[""] + user_list)
            
            if selected_email:
                user_data = users_df[users_df['email'] == selected_email].iloc[0]
                user_index_in_df = users_df.index[users_df['email'] == selected_email].tolist()[0]
                
                st.write(f"**Gerenciando:** {user_data['nome']} (`{user_data['email']}`)")

                col1, col2, col3 = st.columns(3)
                with col1:
                    plan_options = ["basico", "pro", "premium_ia"]
                    new_plan = st.selectbox("Plano:", plan_options, index=plan_options.index(user_data['plano']))
                with col2:
                    status_options = ["ativo", "inativo", "cancelado"]
                    new_status = st.selectbox("Status da Conta:", status_options, index=status_options.index(user_data['status']))
                with col3:
                    role_options = ["editor", "viewer", "admin"]
                    new_role = st.selectbox("Perfil de Acesso:", role_options, index=role_options.index(user_data['role']))

                if st.button("Salvar Alterações", type="primary"):
                    row_index_in_sheet = user_index_in_df + 2 # +2 para compensar cabeçalho e index 0
                    range_to_update = f"C{row_index_in_sheet}:E{row_index_in_sheet}"
                    values_to_update = [[new_role, new_plan, new_status]]
                    
                    matrix_uploader = GoogleDriveUploader(is_matrix=True)
                    matrix_uploader.update_cells(USERS_SHEET_NAME, range_to_update, values_to_update)
                    
                    # Se um plano for atribuído manualmente, limpa a data do trial para evitar confusão.
                    if new_plan != user_data['plano'] or new_status != user_data['status']:
                         matrix_uploader.update_cells(USERS_SHEET_NAME, f"I{row_index_in_sheet}", [['']]) # Limpa a célula do trial_end_date
                    
                    log_action("ALTEROU_USUARIO", f"Email: {selected_email}, Plano: {new_plan}, Status: {new_status}, Perfil: {new_role}")
                    st.success("Usuário atualizado com sucesso!")
                    st.cache_data.clear(); st.rerun()

    with tab_audit:
        st.header("Log de Auditoria do Sistema")
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        log_data = matrix_uploader.get_data_from_sheet(AUDIT_LOG_SHEET_NAME)
        if not log_data or len(log_data) < 2:
            st.warning("Nenhum registro de auditoria encontrado.")
        else:
            df_log = pd.DataFrame(log_data[1:], columns=log_data[0]).sort_values(by='timestamp', ascending=False)
            st.dataframe(df_log, use_container_width=True, hide_index=True)

