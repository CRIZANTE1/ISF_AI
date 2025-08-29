import streamlit as st
import sys
import os
import pandas as pd
import yaml
from datetime import date
from dateutil.relativedelta import relativedelta

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.auth_utils import get_user_info, get_matrix_data, setup_sidebar
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import (
    UNITS_SHEET_NAME, ADMIN_SHEET_NAME, CENTRAL_DRIVE_FOLDER_ID, ACCESS_REQUESTS_SHEET_NAME
    EXTINGUISHER_SHEET_NAME, HOSE_SHEET_NAME, INSPECTIONS_SHELTER_SHEET_NAME, 
    SCBA_VISUAL_INSPECTIONS_SHEET_NAME, EYEWASH_INSPECTIONS_SHEET_NAME, AUDIT_LOG_SHEET_NAME, FOAM_CHAMBER_INSPECTIONS_SHEET_NAME 
)
from config.page_config import set_page_config
from utils.auditoria import log_action

set_page_config()

@st.cache_data
def load_sheets_config():
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

@st.cache_data(ttl=900)
def get_global_status_summary(units_df):
    """
    Busca e consolida o status de TODOS os tipos de equipamentos de todas as UOs.
    """
    # Adicionado "Eyewash" ao dicionário de resumos
    all_summaries = {
        "Extintores": [], "Mangueiras": [], "Abrigos": [], "SCBA": [], "Eyewash": [], "Câmaras de Espuma": [] 
    }
    today = pd.Timestamp.today().date()
    progress_bar = st.progress(0, "Iniciando consolidação de dados...")
    total_units = len(units_df)

    for i, unit in units_df.iterrows():
        unit_name = unit['nome_unidade']
        spreadsheet_id = unit['spreadsheet_id']
        progress_bar.progress((i + 1) / total_units, f"Analisando UO: {unit_name}...")
        
        st.session_state['current_spreadsheet_id'] = spreadsheet_id
        uploader = GoogleDriveUploader()

        # 1. Processar Extintores
        try:
            data = uploader.get_data_from_sheet(EXTINGUISHER_SHEET_NAME)
            if data and len(data) > 1:
                df = pd.DataFrame(data[1:], columns=data[0])
                latest = df.dropna(subset=['numero_identificacao']).sort_values('data_servico', ascending=False).drop_duplicates('numero_identificacao', keep='first')
                pending = latest[latest['aprovado_inspecao'] == 'Não'].shape[0] if 'aprovado_inspecao' in latest.columns else 0
                all_summaries["Extintores"].append({'Unidade Operacional': unit_name, 'OK': latest.shape[0] - pending, 'Com Pendência': pending})
            else: all_summaries["Extintores"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
        except Exception as e:
            st.warning(f"Falha ao processar Extintores da UO '{unit_name}': {e}", icon="🔥")
            all_summaries["Extintores"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})

        # 2. Processar Mangueiras
        try:
            data = uploader.get_data_from_sheet(HOSE_SHEET_NAME)
            if data and len(data) > 1:
                df = pd.DataFrame(data[1:], columns=data[0])
                latest = df.dropna(subset=['id_mangueira']).sort_values('data_inspecao', ascending=False).drop_duplicates('id_mangueira', keep='first')
                # CONDIÇÃO DE PENDÊNCIA ATUALIZADA
                vencidas = pd.to_datetime(latest['data_proximo_teste'], errors='coerce').dt.date < today
                reprovadas = latest['resultado'].str.lower() != 'aprovado'
                pending = latest[vencidas | reprovadas].shape[0]
                all_summaries["Mangueiras"].append({'Unidade Operacional': unit_name, 'OK': latest.shape[0] - pending, 'Com Pendência': pending})
            else: all_summaries["Mangueiras"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
        except Exception as e:
            st.warning(f"Falha ao processar Mangueiras da UO '{unit_name}': {e}", icon="💧")
            all_summaries["Mangueiras"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
            
        # 3. Processar Abrigos
        try:
            data = uploader.get_data_from_sheet(INSPECTIONS_SHELTER_SHEET_NAME)
            if data and len(data) > 1:
                df = pd.DataFrame(data[1:], columns=data[0])
                latest = df.dropna(subset=['id_abrigo']).sort_values('data_inspecao', ascending=False).drop_duplicates('id_abrigo', keep='first')
                pending = latest[latest['status_geral'] == 'Reprovado com Pendências'].shape[0] if 'status_geral' in latest.columns else 0
                all_summaries["Abrigos"].append({'Unidade Operacional': unit_name, 'OK': latest.shape[0] - pending, 'Com Pendência': pending})
            else: all_summaries["Abrigos"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
        except Exception as e:
            st.warning(f"Falha ao processar Abrigos da UO '{unit_name}': {e}", icon="🧯")
            all_summaries["Abrigos"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
            
        try:
            data = uploader.get_data_from_sheet(SCBA_VISUAL_INSPECTIONS_SHEET_NAME)
            if data and len(data) > 1:
                df = pd.DataFrame(data[1:], columns=data[0])
                latest = df.dropna(subset=['numero_serie_equipamento']).sort_values('data_inspecao', ascending=False).drop_duplicates('numero_serie_equipamento', keep='first')
                pending = latest[latest['status_geral'] == 'Reprovado com Pendências'].shape[0] if 'status_geral' in latest.columns else 0
                all_summaries["SCBA"].append({'Unidade Operacional': unit_name, 'OK': latest.shape[0] - pending, 'Com Pendência': pending})
            else: all_summaries["SCBA"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
        except Exception as e:
            st.warning(f"Falha ao processar SCBA da UO '{unit_name}': {e}", icon="💨")
            all_summaries["SCBA"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
        
        try:
            data = uploader.get_data_from_sheet(EYEWASH_INSPECTIONS_SHEET_NAME)
            if data and len(data) > 1:
                df = pd.DataFrame(data[1:], columns=data[0])
                latest = df.dropna(subset=['id_equipamento']).sort_values('data_inspecao', ascending=False).drop_duplicates('id_equipamento', keep='first')
                pending = latest[latest['status_geral'] == 'Reprovado com Pendências'].shape[0] if 'status_geral' in latest.columns else 0
                all_summaries["Eyewash"].append({'Unidade Operacional': unit_name, 'OK': latest.shape[0] - pending, 'Com Pendência': pending})
            else:
                all_summaries["Eyewash"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
        except Exception as e:
            st.warning(f"Falha ao processar Chuveiros/Lava-Olhos da UO '{unit_name}': {e}", icon="🚿")
            all_summaries["Eyewash"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})

        try:
            data = uploader.get_data_from_sheet(FOAM_CHAMBER_INSPECTIONS_SHEET_NAME)
            if data and len(data) > 1:
                df = pd.DataFrame(data[1:], columns=data[0])
                latest = df.dropna(subset=['id_camara']).sort_values('data_inspecao', ascending=False).drop_duplicates('id_camara', keep='first')
                pending = latest[latest['status_geral'] == 'Reprovado com Pendências'].shape[0] if 'status_geral' in latest.columns else 0
                all_summaries["Câmaras de Espuma"].append({'Unidade Operacional': unit_name, 'OK': latest.shape[0] - pending, 'Com Pendência': pending})
            else:
                all_summaries["Câmaras de Espuma"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
        except Exception as e:
            st.warning(f"Falha ao processar Câmaras de Espuma da UO '{unit_name}': {e}", icon="☁️")
            all_summaries["Câmaras de Espuma"].append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})    

    progress_bar.empty()
    for key, data in all_summaries.items():
        all_summaries[key] = pd.DataFrame(data) if data else pd.DataFrame(columns=['Unidade Operacional', 'OK', 'Com Pendência'])
    return all_summaries

@st.dialog("Adicionar Novo Usuário")
def add_user_dialog():
    with st.form("new_user_form"):
        email = st.text_input("E-mail do Usuário")
        nome = st.text_input("Nome do Usuário")
        role = st.selectbox("Nível de Acesso", ["viewer", "editor", "admin"])
        unit = st.text_input("Unidade Operacional", help="Use '*' para acesso global (apenas admins).")
        if st.form_submit_button("Salvar Usuário", type="primary"):
            if not all([email, nome, role, unit]): st.error("Todos os campos são obrigatórios."); return
            uploader = GoogleDriveUploader(is_matrix=True)
            uploader.append_data_to_sheet(ADMIN_SHEET_NAME, [email, nome, role, unit])
            log_action("ADD_USER", f"Email: {email}, Role: {role}, UO: {unit}")
            st.success(f"Usuário '{email}' adicionado!"); st.cache_data.clear(); st.rerun()

@st.dialog("Editar Usuário")
def edit_user_dialog(user_data, row_index):
    st.write(f"Editando dados do usuário: **{user_data['email']}**")
    with st.form("edit_user_form"):
        nome = st.text_input("Nome do Usuário", value=user_data.get('nome', ''))
        roles = ["viewer", "editor", "admin"]
        role = st.selectbox("Nível de Acesso", roles, index=roles.index(user_data['role']) if user_data['role'] in roles else 0)
        unit = st.text_input("Unidade Operacional", value=user_data['unidade_operacional'])
        if st.form_submit_button("Atualizar Usuário", type="primary"):
            range_to_update = f"B{row_index + 2}:D{row_index + 2}"
            uploader = GoogleDriveUploader(is_matrix=True)
            uploader.update_cells(ADMIN_SHEET_NAME, range_to_update, [[nome, role, unit]])
            log_action("EDIT_USER", f"Email: {user_data['email']}, New Role: {role}, New UO: {unit}")
            st.success(f"Usuário '{user_data['email']}' atualizado!"); st.cache_data.clear(); st.rerun()

@st.dialog("Confirmar Remoção")
def confirm_delete_dialog(user_data, df):
    st.warning(f"Tem certeza de que deseja remover o usuário **{user_data['email']}**?")
    col1, col2 = st.columns(2)
    if col1.button("Sim, Remover", type="primary", use_container_width=True):
        df_updated = df[df['email'] != user_data['email']]
        uploader = GoogleDriveUploader(is_matrix=True)
        uploader.overwrite_sheet(ADMIN_SHEET_NAME, df_updated)
        log_action("DELETE_USER", f"Email: {user_data['email']}")
        st.success(f"Usuário '{user_data['email']}' removido."); st.cache_data.clear(); st.rerun()
    if col2.button("Cancelar", use_container_width=True): st.rerun()


def show_page():
    st.title("👑 Painel de Controle do Super Administrador")

    # Adicione a nova aba 'Log de Auditoria'
    tab_dashboard, tab_requests, tab_users, tab_units, tab_provision, tab_audit = st.tabs([
        "📊 Dashboard Global", "📬 Solicitações de Acesso", "👤 Gestão de Usuários", "🏢 Gestão de UOs", 
        "🚀 Provisionar Nova UO", "🛡️ Log de Auditoria"
    ])

    if tab_dashboard:
        with tab_dashboard:
            st.header("Visão Geral do Status de Todos os Equipamentos")
            if st.button("Recarregar Dados de Todas as UOs"):
                st.cache_data.clear()
                st.rerun()

            _, units_df = get_matrix_data()

            if units_df.empty:
                st.warning("Nenhuma Unidade Operacional cadastrada para exibir.")
            else:
                with st.spinner("Buscando e consolidando dados de todas as planilhas..."):
                    all_summaries = get_global_status_summary(units_df)
                
                # Adicionada nova aba para Chuveiros/Lava-Olhos
                tab_overview, tab_ext, tab_hose, tab_shelter, tab_scba, tab_eyewash, tab_foam = st.tabs([
                "📈 Visão Geral", "🔥 Extintores", "💧 Mangueiras",
                "🧯 Abrigos", "💨 SCBA", "🚿 Lava-Olhos", "☁️ Câmaras de Espuma"
                ])
                
                with tab_overview:
                    st.subheader("Painel de Pendências Globais")
                    st.info("Resumo das pendências (equipamentos vencidos ou não conformes) em todas as UOs.")

                    df_ext_pending = all_summaries.get("Extintores", pd.DataFrame()).rename(columns={"Com Pendência": "Extintores"})
                    df_hose_pending = all_summaries.get("Mangueiras", pd.DataFrame()).rename(columns={"Com Pendência": "Mangueiras"})
                    df_shelter_pending = all_summaries.get("Abrigos", pd.DataFrame()).rename(columns={"Com Pendência": "Abrigos"})
                    df_scba_pending = all_summaries.get("SCBA", pd.DataFrame()).rename(columns={"Com Pendência": "SCBA"})
                    df_eyewash_pending = all_summaries.get("Eyewash", pd.DataFrame()).rename(columns={"Com Pendência": "Lava-Olhos"})
                    df_foam_pending = all_summaries.get("Câmaras de Espuma", pd.DataFrame()).rename(columns={"Com Pendência": "Câmaras de Espuma"}) 

                    # Adicionada a nova lista
                    df_list = [df_ext_pending, df_hose_pending, df_shelter_pending, df_scba_pending, df_eyewash_pending, df_foam_pending]
                    df_pending_consolidated = pd.DataFrame(columns=['Unidade Operacional'])
                    
                    for df in df_list:
                        if not df.empty and 'Unidade Operacional' in df.columns:
                           cols_to_merge = [col for col in ['Unidade Operacional', 'Extintores', 'Mangueiras', 'Abrigos', 'SCBA', 'Lava-Olhos', 'Câmaras de Espuma'] if col in df.columns]
                           df_pending_consolidated = pd.merge(df_pending_consolidated, df[cols_to_merge], on='Unidade Operacional', how='outer')

                    df_pending_consolidated = df_pending_consolidated.set_index('Unidade Operacional').fillna(0).astype(int)
                    
                    st.markdown("##### Total de Pendências por Categoria")
                    cols = st.columns(6)
                    cols[0].metric("🔥 Extintores", df_pending_consolidated['Extintores'].sum())
                    cols[1].metric("💧 Mangueiras", df_pending_consolidated['Mangueiras'].sum())
                    cols[2].metric("🧯 Abrigos", df_pending_consolidated['Abrigos'].sum())
                    cols[3].metric("💨 SCBA", df_pending_consolidated['SCBA'].sum())
                    cols[4].metric("🚿 Lava-Olhos", df_pending_consolidated['Lava-Olhos'].sum())
                    cols[5].metric("☁️ Câmaras Espuma", df_pending_consolidated['Câmaras de Espuma'].sum())
                    
                    st.markdown("---")

                    st.subheader("Gráfico de Pendências por Unidade Operacional")
                    if not df_pending_consolidated.empty:
                        st.bar_chart(df_pending_consolidated)
                    else:
                        st.info("Nenhum dado de pendência para exibir no gráfico.")
                        
                    with st.expander("Ver tabela de dados de pendências consolidada"):
                        st.dataframe(df_pending_consolidated, use_container_width=True)

                def display_summary(summary_df, name):
                    if summary_df is None or summary_df.empty or (summary_df['OK'].sum() == 0 and summary_df['Com Pendência'].sum() == 0):
                        st.info(f"Nenhum dado de {name.lower()} encontrado para consolidar."); return
                    total_ok, total_pending = summary_df['OK'].sum(), summary_df['Com Pendência'].sum()
                    st.subheader(f"Métricas Globais - {name}")
                    col1, col2, col3 = st.columns(3); col1.metric("Total", total_ok + total_pending); col2.metric("OK", total_ok); col3.metric("Pendência", total_pending, delta=f"{total_pending}", delta_color="inverse")
                    st.subheader("Status por Unidade Operacional")
                    chart_df = summary_df.set_index('Unidade Operacional')
                    st.bar_chart(chart_df, color=["#28a745", "#dc3545"])
                    with st.expander("Ver tabela detalhada"): st.dataframe(chart_df, use_container_width=True)
                
                with tab_ext: display_summary(all_summaries.get("Extintores"), "Extintores")
                with tab_hose: display_summary(all_summaries.get("Mangueiras"), "Mangueiras")
                with tab_shelter: display_summary(all_summaries.get("Abrigos"), "Abrigos")
                with tab_scba: display_summary(all_summaries.get("SCBA"), "Conjuntos Autônomos")
                with tab_eyewash: display_summary(all_summaries.get("Eyewash"), "Chuveiros e Lava-Olhos")
                with tab_foam: display_summary(all_summaries.get("Câmaras de Espuma"), "Câmaras de Espuma")

    
    with tab_requests:
        st.header("Gerenciar Solicitações de Acesso Pendentes")
        
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        
        try:
            requests_data = matrix_uploader.get_data_from_sheet(ACCESS_REQUESTS_SHEET_NAME)
            if requests_data and len(requests_data) > 1:
                df_requests = pd.DataFrame(requests_data[1:], columns=requests_data[0])
                pending_requests = df_requests[df_requests['status'] == 'Pendente']

                if pending_requests.empty:
                    st.success("✅ Nenhuma solicitação de acesso pendente.")
                else:
                    st.info(f"Você tem {len(pending_requests)} solicitação(ões) pendente(s).")
                    
                    for index, request in pending_requests.iterrows():
                        with st.container(border=True):
                            st.write(f"**Usuário:** {request['nome_usuario']} (`{request['email_usuario']}`)")
                            st.write(f"**UO Solicitada:** {request['uo_solicitada']}")
                            st.write(f"**Justificativa:** *{request.get('justificativa', 'Não informada')}*")
                            
                            cols = st.columns([2, 1, 1])
                            with cols[0]:
                                role = st.selectbox("Atribuir Perfil:", ["viewer", "editor"], key=f"role_{index}")
                            with cols[1]:
                                if st.button("Aprovar", key=f"approve_{index}", type="primary", use_container_width=True):
                                    with st.spinner("Processando..."):
                                        # 1. Adicionar usuário à lista 'adm'
                                        matrix_uploader.append_data_to_sheet(ADMIN_SHEET_NAME, [[request['email_usuario'], request['nome_usuario'], role, request['uo_solicitada']]])
                                        # 2. Atualizar status da solicitação para 'Aprovado'
                                        range_to_update = f"F{index + 2}" # Coluna F é o status
                                        matrix_uploader.update_cells(ACCESS_REQUESTS_SHEET_NAME, range_to_update, [['Aprovado']])
                                        log_action("APROVOU_ACESSO", f"Email: {request['email_usuario']}, Role: {role}, UO: {request['uo_solicitada']}")
                                        st.success(f"Acesso aprovado para {request['nome_usuario']}!")
                                        st.cache_data.clear()
                                        st.rerun()
                            with cols[2]:
                                if st.button("Rejeitar", key=f"reject_{index}", use_container_width=True):
                                    with st.spinner("Processando..."):
                                        # Atualizar status para 'Rejeitado'
                                        range_to_update = f"F{index + 2}"
                                        matrix_uploader.update_cells(ACCESS_REQUESTS_SHEET_NAME, range_to_update, [['Rejeitado']])
                                        log_action("REJEITOU_ACESSO", f"Email: {request['email_usuario']}")
                                        st.warning(f"Solicitação de {request['nome_usuario']} rejeitada.")
                                        st.cache_data.clear()
                                        st.rerun()
            else:
                st.info("Nenhuma solicitação de acesso recebida ainda.")
        except Exception as e:
            st.error(f"Não foi possível carregar as solicitações de acesso: {e}")
            
    
    with tab_users:
        st.header("Gerenciar Acessos de Usuários")
        if st.button("➕ Adicionar Novo Usuário", type="primary"): add_user_dialog()
        st.markdown("---")
        permissions_df, _ = get_matrix_data()
        if permissions_df.empty:
            st.info("Nenhum usuário cadastrado.")
        else:
            st.dataframe(permissions_df, hide_index=True, use_container_width=True,
                         column_config={"email": "E-mail", "nome": "Nome", "role": "Nível", "unidade_operacional": "UO"})
            st.subheader("Ações Individuais")
            for index, user_row in permissions_df.iterrows():
                col1, col2, col3 = st.columns([3, 1, 1])
                col1.write(f"**Usuário:** `{user_row['email']}`")
                if col2.button("✏️ Editar", key=f"edit_{index}", use_container_width=True): edit_user_dialog(user_row, index)
                if col3.button("🗑️ Remover", key=f"del_{index}", use_container_width=True): confirm_delete_dialog(user_row, permissions_df)

    with tab_units:
        st.header("Unidades Operacionais Cadastradas")
        _, units_df_raw = get_matrix_data()
        if units_df_raw.empty:
            st.warning("Nenhuma UO cadastrada.")
        else:
            units_df_display = units_df_raw.copy()
            units_df_display['spreadsheet_link'] = 'https://docs.google.com/spreadsheets/d/' + units_df_display['spreadsheet_id'].astype(str)
            units_df_display['folder_link'] = 'https://drive.google.com/drive/folders/' + units_df_display['folder_id'].astype(str)
            st.dataframe(units_df_display, use_container_width=True,
                         column_config={"nome_unidade": "Nome da UO", "spreadsheet_id": "ID Planilha", "folder_id": "ID Pasta",
                                        "spreadsheet_link": st.column_config.LinkColumn("Link Planilha", display_text="🔗 Abrir"),
                                        "folder_link": st.column_config.LinkColumn("Link Pasta", display_text="🔗 Abrir")},
                         column_order=("nome_unidade", "spreadsheet_link", "folder_link", "spreadsheet_id", "folder_id"))

    with tab_provision:
        st.header("Provisionar Nova Unidade Operacional")
        new_unit_name = st.text_input("Nome da Nova UO (ex: Santos)")
        if st.button(f"🚀 Criar Estrutura para '{new_unit_name}'", type="primary"):
            if not new_unit_name: st.error("O nome da UO não pode ser vazio.")
            elif not DEFAULT_SHEETS_CONFIG: st.error("Configuração das planilhas (YAML) não carregada.")
            else:
                with st.spinner(f"Criando infraestrutura para '{new_unit_name}'..."):
                    try:
                        uploader = GoogleDriveUploader()
                        new_sheet_id = uploader.create_new_spreadsheet(f"ISF IA - {new_unit_name}")
                        new_folder_id = uploader.create_drive_folder(f"SFIA - Arquivos UO {new_unit_name}", CENTRAL_DRIVE_FOLDER_ID)
                        uploader.move_file_to_folder(new_sheet_id, new_folder_id)
                        uploader.setup_sheets_in_new_spreadsheet(new_sheet_id, DEFAULT_SHEETS_CONFIG)
                        matrix_uploader = GoogleDriveUploader(is_matrix=True)
                        matrix_uploader.append_data_to_sheet(UNITS_SHEET_NAME, [new_unit_name, new_sheet_id, new_folder_id])
                        log_action("PROVISIONOU_NOVA_UO", f"Nome da UO: {new_unit_name}, Sheet ID: {new_sheet_id}", target_uo=new_unit_name)
                        st.success(f"UO '{new_unit_name}' criada com sucesso!"); st.balloons(); st.cache_data.clear()
                    except Exception as e:
                        st.error("Ocorreu um erro durante o provisionamento."); st.exception(e)
    
    with tab_audit:
        st.header("Log de Auditoria do Sistema")
        st.info("Registro de todas as ações importantes realizadas pelos usuários.")

        if st.button("Recarregar Log", key="reload_audit_log"):
            st.cache_data.clear()
        
        with st.spinner("Carregando log de auditoria..."):
            matrix_uploader = GoogleDriveUploader(is_matrix=True)
            log_data = matrix_uploader.get_data_from_sheet(AUDIT_LOG_SHEET_NAME)

        if not log_data or len(log_data) < 2:
            st.warning("Nenhum registro de auditoria encontrado.")
        else:
            df_log = pd.DataFrame(log_data[1:], columns=log_data[0])
            df_log_sorted = df_log.sort_index(ascending=False)
            
            st.markdown("---")
            col1, col2 = st.columns(2)
            
            users = ["Todos"] + df_log['user_email'].unique().tolist()
            selected_user = col1.selectbox("Filtrar por Usuário:", users)
            if selected_user != "Todos":
                df_log_sorted = df_log_sorted[df_log_sorted['user_email'] == selected_user]
            
            actions = ["Todas"] + df_log['action'].unique().tolist()
            selected_action = col2.selectbox("Filtrar por Ação:", actions)
            if selected_action != "Todas":
                df_log_sorted = df_log_sorted[df_log_sorted['action'] == selected_action]

            st.dataframe(df_log_sorted, use_container_width=True)


