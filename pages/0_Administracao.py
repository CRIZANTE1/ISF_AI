import streamlit as st
import sys
import os
import pandas as pd
import yaml
from datetime import date
from dateutil.relativedelta import relativedelta

# Adiciona o diretório raiz ao path para encontrar os módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.auth_utils import get_user_info, get_matrix_data
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import UNITS_SHEET_NAME, ADMIN_SHEET_NAME, CENTRAL_DRIVE_FOLDER_ID, EXTINGUISHER_SHEET_NAME
from operations.demo_page import show_demo_page
from config.page_config import set_page_config
from auth.auth_utils import setup_sidebar


set_page_config()

# --- Carrega a configuração da estrutura da planilha do arquivo YAML ---
@st.cache_data
def load_sheets_config():
    """Carrega a configuração da estrutura da planilha do arquivo YAML."""
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

# --- FUNÇÃO PARA O DASHBOARD GLOBAL ---
@st.cache_data(ttl=900)
def get_global_status_summary(units_df):
    """Busca e consolida o status dos extintores de todas as Unidades Operacionais."""
    summary_data = []
    uploader = GoogleDriveUploader()

    progress_bar = st.progress(0, "Iniciando consolidação de dados...")
    total_units = len(units_df)

    for i, unit in units_df.iterrows():
        unit_name = unit['nome_unidade']
        spreadsheet_id = unit['spreadsheet_id']
        progress_bar.progress((i + 1) / total_units, f"Analisando UO: {unit_name}...")
        uploader.spreadsheet_id = spreadsheet_id
        
        try:
            ext_data = uploader.get_data_from_sheet(EXTINGUISHER_SHEET_NAME)
            if not ext_data or len(ext_data) < 2:
                summary_data.append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
                continue

            df_ext = pd.DataFrame(ext_data[1:], columns=ext_data[0])
            df_ext['data_servico'] = pd.to_datetime(df_ext['data_servico'], errors='coerce')
            latest_records = df_ext.sort_values('data_servico', ascending=False).drop_duplicates(subset='numero_identificacao', keep='first')
            
            ok_count, pending_count = 0, 0
            today_ts = pd.Timestamp(date.today())

            for _, record in latest_records.iterrows():
                if record.get('plano_de_acao') == "FORA DE OPERAÇÃO (SUBSTITUIDO)": continue
                is_pending = False
                if record.get('aprovado_inspecao') == 'Não':
                    is_pending = True
                else:
                    next_dates = [pd.to_datetime(record.get(col), errors='coerce') for col in ['data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 'data_proxima_manutencao_3_nivel']]
                    next_dates = [d for d in next_dates if pd.notna(d)]
                    if next_dates and min(next_dates) < today_ts:
                        is_pending = True
                if is_pending: pending_count += 1
                else: ok_count += 1
            summary_data.append({'Unidade Operacional': unit_name, 'OK': ok_count, 'Com Pendência': pending_count})
        except Exception:
            summary_data.append({'Unidade Operacional': unit_name, 'OK': 0, 'Com Pendência': 0})
            continue
    progress_bar.empty()
    return pd.DataFrame(summary_data)

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
        # Se uma UO está selecionada, mostra todas as abas
        tab_dashboard, tab_users, tab_units, tab_provision = st.tabs([
            "📊 Dashboard Global", "👤 Gestão de Usuários", "🏢 Gestão de UOs", "🚀 Provisionar Nova UO"
        ])
    else:
        # Se NENHUMA UO está selecionada, mostra apenas as abas essenciais
        tab_users, tab_units, tab_provision = st.tabs([
            "👤 Gestão de Usuários", "🏢 Gestão de UOs", "🚀 Provisionar Nova UO"
        ])
        # Informa o admin sobre a aba desabilitada
        st.info("👈 Selecione uma Unidade Operacional na barra lateral para habilitar o Dashboard Global.")
        # Define a aba do dashboard como None para o código abaixo não dar erro
        tab_dashboard = None


    if tab_dashboard:
        with tab_dashboard:
            st.header("Visão Geral do Status de Todos os Equipamentos")
            st.info("Este painel consolida os dados de todas as Unidades Operacionais cadastradas.")

            if st.button("Recarregar Dados de Todas as UOs"):
                st.cache_data.clear()
                st.rerun()

            _, units_df = get_matrix_data()

            if units_df.empty:
                st.warning("Nenhuma Unidade Operacional cadastrada para exibir no dashboard.")
            else:
                with st.spinner("Buscando e consolidando dados de todas as planilhas... Isso pode levar um minuto."):
                    # A função get_global_status_summary retorna um dicionário de DataFrames
                    all_summaries = get_global_status_summary(units_df)

                # --- LÓGICA DE EXIBIÇÃO CORRIGIDA E SIMPLIFICADA ---
                
                # Cria as sub-abas imediatamente
                sub_tab_ext, sub_tab_hose, sub_tab_shelter, sub_tab_scba = st.tabs([
                    "🔥 Extintores", "💧 Mangueiras", "🧯 Abrigos", "💨 Conjuntos Autônomos"
                ])
                
                # Função auxiliar para exibir o resumo. Agora a verificação de vazio é a primeira coisa que ela faz.
                def display_summary(summary_df, equipment_name):
                    # VERIFICAÇÃO SEGURA: Usa .empty para checar se o DataFrame não tem linhas.
                    if summary_df is None or summary_df.empty:
                        st.info(f"Nenhum dado de {equipment_name.lower()} encontrado para consolidar.")
                        return # Sai da função se não há dados

                    # Se chegamos aqui, o DataFrame tem dados.
                    total_ok = summary_df['OK'].sum()
                    total_pending = summary_df['Com Pendência'].sum()
                    total_equip = total_ok + total_pending
                    
                    st.subheader(f"Métricas Globais - {equipment_name}")
                    col1, col2, col3 = st.columns(3)
                    col1.metric("Total de Equipamentos", f"{total_equip}")
                    col2.metric("Equipamentos OK", f"{total_ok}")
                    col3.metric("Com Pendência", f"{total_pending}", delta=f"{total_pending} pendências", delta_color="inverse")
                    
                    st.subheader("Status por Unidade Operacional")
                    chart_df = summary_df.set_index('Unidade Operacional')
                    st.bar_chart(chart_df, color=["#28a745", "#dc3545"])
                    with st.expander("Ver tabela de dados detalhada"):
                        st.dataframe(chart_df, use_container_width=True)

                # Chama a função para cada aba, passando o DataFrame correspondente do dicionário
                with sub_tab_ext:
                    display_summary(all_summaries.get("Extintores"), "Extintores")
                
                with sub_tab_hose:
                    display_summary(all_summaries.get("Mangueiras"), "Mangueiras")

                with sub_tab_shelter:
                    display_summary(all_summaries.get("Abrigos"), "Abrigos")

                with sub_tab_scba:
                    display_summary(all_summaries.get("SCBA"), "Conjuntos Autônomos")

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
