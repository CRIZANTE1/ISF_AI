import streamlit as st
import sys
import os
import pandas as pd
import yaml
from datetime import date
from dateutil.relativedelta import relativedelta

# Adiciona o diretório raiz ao path
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.auth_utils import get_user_info, get_matrix_data, setup_sidebar
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import (
    UNITS_SHEET_NAME, ADMIN_SHEET_NAME, CENTRAL_DRIVE_FOLDER_ID,
    EXTINGUISHER_SHEET_NAME, HOSE_SHEET_NAME, INSPECTIONS_SHELTER_SHEET_NAME, SCBA_VISUAL_INSPECTIONS_SHEET_NAME
)
from operations.demo_page import show_demo_page
from config.page_config import set_page_config

set_page_config()

# --- Carrega a configuração da estrutura da planilha do arquivo YAML ---
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

# --- FUNÇÃO ROBUSTA PARA O DASHBOARD GLOBAL ---
@st.cache_data(ttl=900)
def get_global_status_summary(units_df):
    """
    Busca e consolida o status de TODOS os tipos de equipamentos de todas as UOs.
    """
    all_summaries = {
        "Extintores": [], "Mangueiras": [], "Abrigos": [], "SCBA": []
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
                pending = latest[pd.to_datetime(latest['data_proximo_teste'], errors='coerce').dt.date < today].shape[0] if 'data_proximo_teste' in latest.columns else 0
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
            
        # 4. Processar SCBA
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

    progress_bar.empty()
    for key, data in all_summaries.items():
        all_summaries[key] = pd.DataFrame(data) if data else pd.DataFrame(columns=['Unidade Operacional', 'OK', 'Com Pendência'])
    return all_summaries


# --- DIALOGS PARA GESTÃO DE USUÁRIOS ---
@st.dialog("Adicionar Novo Usuário")
def add_user_dialog():
    with st.form("new_user_form"):
        email = st.text_input("E-mail do Usuário")
        role = st.selectbox("Nível de Acesso", ["viewer", "editor", "admin"])
        unit = st.text_input("Unidade Operacional", help="Use '*' para acesso global (apenas admins).")
        if st.form_submit_button("Salvar Usuário", type="primary"):
            if not all([email, role, unit]): st.error("Todos os campos são obrigatórios."); return
            uploader = GoogleDriveUploader(is_matrix=True)
            uploader.append_data_to_sheet(ADMIN_SHEET_NAME, [email, role, unit])
            st.success(f"Usuário '{email}' adicionado!"); st.cache_data.clear(); st.rerun()

@st.dialog("Editar Usuário")
def edit_user_dialog(user_data, row_index):
    st.write(f"Editando dados do usuário: **{user_data['email']}**")
    with st.form("edit_user_form"):
        roles = ["viewer", "editor", "admin"]
        role = st.selectbox("Nível de Acesso", roles, index=roles.index(user_data['role']) if user_data['role'] in roles else 0)
        unit = st.text_input("Unidade Operacional", value=user_data['unidade_operacional'])
        if st.form_submit_button("Atualizar Usuário", type="primary"):
            range_to_update = f"B{row_index + 2}:C{row_index + 2}"
            uploader = GoogleDriveUploader(is_matrix=True)
            uploader.update_cells(ADMIN_SHEET_NAME, range_to_update, [[role, unit]])
            st.success(f"Usuário '{user_data['email']}' atualizado!"); st.cache_data.clear(); st.rerun()

@st.dialog("Confirmar Remoção")
def confirm_delete_dialog(user_data, df):
    st.warning(f"Tem certeza de que deseja remover o usuário **{user_data['email']}**?")
    col1, col2 = st.columns(2)
    if col1.button("Sim, Remover", type="primary", use_container_width=True):
        df_updated = df[df['email'] != user_data['email']]
        uploader = GoogleDriveUploader(is_matrix=True)
        uploader.overwrite_sheet(ADMIN_SHEET_NAME, df_updated)
        st.success(f"Usuário '{user_data['email']}' removido."); st.cache_data.clear(); st.rerun()
    if col2.button("Cancelar", use_container_width=True): st.rerun()

def show_admin_page():
    is_uo_selected = setup_sidebar()
    st.title("👑 Painel de Controle do Super Administrador")

    if is_uo_selected:
        tab_dashboard, tab_users, tab_units, tab_provision = st.tabs(["📊 Dashboard Global", "👤 Gestão de Usuários", "🏢 Gestão de UOs", "🚀 Provisionar Nova UO"])
    else:
        tab_users, tab_units, tab_provision = st.tabs(["👤 Gestão de Usuários", "🏢 Gestão de UOs", "🚀 Provisionar Nova UO"])
        st.info("👈 Selecione uma Unidade Operacional na barra lateral para habilitar o Dashboard Global.")
        tab_dashboard = None

    if tab_dashboard:
        with tab_dashboard:
            st.header("Visão Geral do Status de Todos os Equipamentos")
            if st.button("Recarregar Dados de Todas as UOs"): st.cache_data.clear(); st.rerun()
            _, units_df = get_matrix_data()
            if units_df.empty: st.warning("Nenhuma UO cadastrada para exibir.")
            else:
                with st.spinner("Buscando e consolidando dados..."):
                    all_summaries = get_global_status_summary(units_df)
                
                sub_tab_ext, sub_tab_hose, sub_tab_shelter, sub_tab_scba = st.tabs(["🔥 Extintores", "💧 Mangueiras", "🧯 Abrigos", "💨 Conjuntos Autônomos"])
                
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
                
                with sub_tab_ext: display_summary(all_summaries.get("Extintores"), "Extintores")
                with sub_tab_hose: display_summary(all_summaries.get("Mangueiras"), "Mangueiras")
                with sub_tab_shelter: display_summary(all_summaries.get("Abrigos"), "Abrigos")
                with sub_tab_scba: display_summary(all_summaries.get("SCBA"), "Conjuntos Autônomos")

    with tab_users:
        st.header("Gerenciar Acessos de Usuários")
        if st.button("➕ Adicionar Novo Usuário", type="primary"): add_user_dialog()
        st.markdown("---")
        permissions_df, _ = get_matrix_data()
        if permissions_df.empty:
            st.info("Nenhum usuário cadastrado.")
        else:
            st.dataframe(permissions_df, hide_index=True, use_container_width=True,
                         column_config={"email": "E-mail", "role": "Nível", "unidade_operacional": "UO"})
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
                        st.success(f"UO '{new_unit_name}' criada com sucesso!"); st.balloons(); st.cache_data.clear()
                    except Exception as e:
                        st.error("Ocorreu um erro durante o provisionamento."); st.exception(e)

# --- Verificação de Permissão ---
role, assigned_unit = get_user_info()
if role == 'admin' and assigned_unit == '*':
    st.sidebar.success("👑 Acesso de Super Admin")
    show_admin_page()
else:
    st.sidebar.error("🔒 Acesso Negado")
    st.error("Você não tem permissão para acessar esta página.")
    st.info("Apenas administradores globais podem gerenciar o sistema.")
    show_demo_page()
