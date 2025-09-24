import streamlit as st
import sys
import os
import pandas as pd
import yaml
from datetime import date
from dateutil.relativedelta import relativedelta
from functools import reduce

# Adiciona o diretório raiz ao path para encontrar os outros módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.auth_utils import get_users_data
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import (
    USERS_SHEET_NAME, get_central_drive_folder_id, ACCESS_REQUESTS_SHEET_NAME,
    AUDIT_LOG_SHEET_NAME, EXTINGUISHER_SHEET_NAME, HOSE_SHEET_NAME,
    INSPECTIONS_SHELTER_SHEET_NAME, SCBA_VISUAL_INSPECTIONS_SHEET_NAME,
    EYEWASH_INSPECTIONS_SHEET_NAME, FOAM_CHAMBER_INSPECTIONS_SHEET_NAME,
    MULTIGAS_INSPECTIONS_SHEET_NAME
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

@st.cache_data(ttl=900)
def get_global_status_summary(users_df):
    """
    Busca e consolida o status de TODOS os tipos de equipamentos de TODOS os usuários ativos.
    """
    all_summaries = {
        "Extintores": [], "Mangueiras": [], "Abrigos": [], "SCBA": [], "Eyewash": [], 
        "Câmaras de Espuma": [], "Multigás": []
    }
    today = pd.Timestamp.today().date()
    
    provisioned_users = users_df[
        (users_df['plano'] == 'ativo') & 
        (users_df['spreadsheet_id'].notna()) & 
        (users_df['spreadsheet_id'] != '')
    ].copy()

    if provisioned_users.empty:
        return all_summaries

    progress_bar = st.progress(0, "Iniciando consolidação de dados...")
    total_users = len(provisioned_users)

    for i, user in provisioned_users.iterrows():
        user_name = user['nome']
        spreadsheet_id = user['spreadsheet_id']
        progress_bar.progress((i + 1) / total_users, f"Analisando dados de: {user_name}...")
        
        # Temporariamente define o ID da planilha na sessão para o uploader usar
        st.session_state['current_spreadsheet_id'] = spreadsheet_id
        uploader = GoogleDriveUploader()

        # Função genérica para processar equipamentos
        def process_equipment(sheet_name, id_col, date_col, status_col, fail_val, equipment_type, icon):
            try:
                data = uploader.get_data_from_sheet(sheet_name)
                if data and len(data) > 1:
                    df = pd.DataFrame(data[1:], columns=data[0])
                    latest = df.dropna(subset=[id_col]).sort_values(date_col, ascending=False).drop_duplicates(id_col, keep='first')
                    pending = latest[latest[status_col] == fail_val].shape[0] if status_col in latest.columns else 0
                    all_summaries[equipment_type].append({'Usuário': user_name, 'OK': latest.shape[0] - pending, 'Com Pendência': pending})
                else:
                    all_summaries[equipment_type].append({'Usuário': user_name, 'OK': 0, 'Com Pendência': 0})
            except Exception:
                all_summaries[equipment_type].append({'Usuário': user_name, 'OK': 0, 'Com Pendência': 0})
        
        process_equipment(EXTINGUISHER_SHEET_NAME, 'numero_identificacao', 'data_servico', 'aprovado_inspecao', 'Não', "Extintores", "🔥")
        # Adicione chamadas para outros equipamentos aqui, seguindo o padrão
        
    progress_bar.empty()
    # Limpa o ID temporário da sessão
    if 'current_spreadsheet_id' in st.session_state:
        del st.session_state['current_spreadsheet_id']
        
    for key, data in all_summaries.items():
        all_summaries[key] = pd.DataFrame(data) if data else pd.DataFrame(columns=['Usuário', 'OK', 'Com Pendência'])
    return all_summaries

def provision_user_environment(user_email, user_name):
    """Cria a infraestrutura (planilha, pasta) para um novo usuário."""
    DEFAULT_SHEETS_CONFIG = load_sheets_config()
    if not DEFAULT_SHEETS_CONFIG:
        st.error("Configuração YAML das planilhas não carregada. Impossível provisionar.")
        return False, None, None
    try:
        uploader = GoogleDriveUploader()
        central_folder_id = get_central_drive_folder_id()
        
        st.info(f"Criando planilha para {user_name}...")
        new_sheet_id = uploader.create_new_spreadsheet(f"ISF IA - Dados de {user_name}")
        
        st.info(f"Criando pasta no Google Drive...")
        new_folder_id = uploader.create_drive_folder(f"SFIA - Arquivos de {user_name}", central_folder_id)
        
        st.info(f"Organizando arquivos...")
        uploader.move_file_to_folder(new_sheet_id, new_folder_id)
        uploader.setup_sheets_in_new_spreadsheet(new_sheet_id, DEFAULT_SHEETS_CONFIG)
        
        log_action("PROVISIONOU_AMBIENTE_USUARIO", f"Email: {user_email}, Sheet ID: {new_sheet_id}")
        return True, new_sheet_id, new_folder_id
    except Exception as e:
        st.error(f"Ocorreu um erro durante o provisionamento para {user_name}."); st.exception(e)
        return False, None, None

def show_page():
    st.title("👑 Painel de Controle do Super Administrador")

    tab_dashboard, tab_requests, tab_users, tab_audit = st.tabs([
        "📊 Dashboard Global", "📬 Solicitações de Acesso", "👤 Usuários e Planos", "🛡️ Log de Auditoria"
    ])

    with tab_dashboard:
        st.header("Visão Geral do Status de Todos os Usuários Ativos")
        if st.button("Recarregar Dados de Todos os Usuários"):
            st.cache_data.clear()
            st.rerun()

        users_df = get_users_data()
        if users_df.empty:
            st.warning("Nenhum usuário cadastrado para exibir.")
        else:
            with st.spinner("Buscando e consolidando dados de todas as contas... Este processo pode levar alguns minutos."):
                all_summaries = get_global_status_summary(users_df)
            
            st.subheader("Painel de Pendências Globais")
            dfs_to_merge = []
            for name, df_summary in all_summaries.items():
                if not df_summary.empty and 'Com Pendência' in df_summary.columns:
                    df_renamed = df_summary.rename(columns={"Com Pendência": name})[['Usuário', name]]
                    dfs_to_merge.append(df_renamed)

            if dfs_to_merge:
                df_pending = reduce(lambda left, right: pd.merge(left, right, on='Usuário', how='outer'), dfs_to_merge)
                df_pending = df_pending.set_index('Usuário').fillna(0).astype(int)
                
                if not df_pending.empty:
                    st.bar_chart(df_pending)
                else:
                    st.success("✅ Nenhum item com pendência encontrado em todas as contas de usuários!")
            else:
                st.success("✅ Nenhum dado de equipamento encontrado para consolidar.")

    with tab_requests:
        st.header("Gerenciar Solicitações de Acesso Pendentes")
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        try:
            requests_data = matrix_uploader.get_data_from_sheet(ACCESS_REQUESTS_SHEET_NAME)
            if not requests_data or len(requests_data) < 2:
                st.info("Nenhuma solicitação de acesso recebida ainda.")
            else:
                df_requests = pd.DataFrame(requests_data[1:], columns=requests_data[0])
                pending_requests = df_requests[df_requests['status'] == 'Pendente']

                if pending_requests.empty:
                    st.success("✅ Nenhuma solicitação de acesso pendente.")
                else:
                    for index, request in pending_requests.iterrows():
                        with st.container(border=True):
                            st.write(f"**Usuário:** {request['nome_usuario']} (`{request['email_usuario']}`)")
                            cols = st.columns([2, 1, 1])
                            role = cols[0].selectbox("Atribuir Perfil:", ["editor", "viewer"], key=f"role_{index}")
                            
                            if cols[1].button("Aprovar e Provisionar", key=f"approve_{index}", type="primary"):
                                with st.spinner("Provisionando ambiente do novo usuário..."):
                                    success, sheet_id, folder_id = provision_user_environment(request['email_usuario'], request['nome_usuario'])
                                    if success:
                                        new_user_row = [
                                            request['email_usuario'], request['nome_usuario'], role, 
                                            'ativo', sheet_id, folder_id, date.today().isoformat()
                                        ]
                                        matrix_uploader.append_data_to_sheet(USERS_SHEET_NAME, [new_user_row])
                                        matrix_uploader.update_cells(ACCESS_REQUESTS_SHEET_NAME, f"F{index + 2}", [['Aprovado']])
                                        log_action("APROVOU_ACESSO", f"Email: {request['email_usuario']}")
                                        st.success(f"Usuário {request['nome_usuario']} aprovado e ambiente criado!")
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
            
            selected_email = st.selectbox("Selecione um usuário para gerenciar:", options=[""] + users_df['email'].tolist())
            if selected_email:
                user_data = users_df[users_df['email'] == selected_email].iloc[0]
                st.write(f"**Gerenciando:** {user_data['nome']} (`{user_data['email']}`)")

                col1, col2 = st.columns(2)
                with col1:
                    new_plan = st.selectbox("Alterar Plano:", ["ativo", "inativo"], index=["ativo", "inativo"].index(user_data['plano']))
                with col2:
                    new_role = st.selectbox("Alterar Perfil:", ["editor", "viewer", "admin"], index=["editor", "viewer", "admin"].index(user_data['role']))

                if st.button("Salvar Alterações", type="primary"):
                    row_index = user_data.name + 2 # +2 para compensar cabeçalho e index 0
                    range_to_update = f"C{row_index}:D{row_index}"
                    values_to_update = [[new_role, new_plan]]
                    
                    matrix_uploader = GoogleDriveUploader(is_matrix=True)
                    matrix_uploader.update_cells(USERS_SHEET_NAME, range_to_update, values_to_update)
                    log_action("ALTEROU_USUARIO", f"Email: {selected_email}, Novo Plano: {new_plan}, Novo Perfil: {new_role}")
                    st.success("Usuário atualizado com sucesso!")
                    st.cache_data.clear(); st.rerun()

    with tab_audit:
        st.header("Log de Auditoria do Sistema")
        st.info("Registro de todas as ações importantes realizadas no sistema.")
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        log_data = matrix_uploader.get_data_from_sheet(AUDIT_LOG_SHEET_NAME)
        if not log_data or len(log_data) < 2:
            st.warning("Nenhum registro de auditoria encontrado.")
        else:
            df_log = pd.DataFrame(log_data[1:], columns=log_data[0]).sort_values(by='timestamp', ascending=False)
            st.dataframe(df_log, use_container_width=True, hide_index=True)

