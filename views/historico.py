import streamlit as st
import pandas as pd
import sys
import os
from config.page_config import set_page_config

set_page_config()

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from operations.history import load_sheet_data
from auth.auth_utils import check_user_access, can_view
from gdrive.config import (
    EXTINGUISHER_SHEET_NAME, HOSE_SHEET_NAME, SHELTER_SHEET_NAME,
    INSPECTIONS_SHELTER_SHEET_NAME, SCBA_SHEET_NAME, SCBA_VISUAL_INSPECTIONS_SHEET_NAME,
    EYEWASH_INVENTORY_SHEET_NAME, EYEWASH_INSPECTIONS_SHEET_NAME,
    FOAM_CHAMBER_INVENTORY_SHEET_NAME, FOAM_CHAMBER_INSPECTIONS_SHEET_NAME,
    LOG_ACTIONS, LOG_SHELTER_SHEET_NAME, LOG_SCBA_SHEET_NAME, LOG_EYEWASH_SHEET_NAME,
    LOG_FOAM_CHAMBER_SHEET_NAME, ALARM_INVENTORY_SHEET_NAME, ALARM_INSPECTIONS_SHEET_NAME, LOG_ALARM_SHEET_NAME
)

# O dicionário ALL_COLUMNS foi movido para fora da função, tornando-se uma constante do módulo.
ALL_COLUMNS = {
    # Comuns
    'data_inspecao': 'Data Inspeção', 'status_geral': 'Status', 'inspetor': 'Inspetor',
    'data_proxima_inspecao': 'Próx. Inspeção', 'data_servico': 'Data Serviço', 'numero_identificacao': 'ID Equip.',
    'tipo_servico': 'Tipo Serviço', 'aprovado_inspecao': 'Status', 'plano_de_acao': 'Plano de Ação',
    'link_relatorio_pdf': 'Relatório (PDF)', 'id_mangueira': 'ID Mangueira', 'data_proximo_teste': 'Próx. Teste',
    'link_certificado_pdf': 'Certificado (PDF)', 'data_teste': 'Data Teste', 'numero_serie_equipamento': 'S/N Equip.',
    'resultado_final': 'Resultado', 'id_abrigo': 'ID Abrigo', 'cliente': 'Cliente', 'local': 'Local',
    'itens_json': 'Inventário (JSON)', 'id_equipamento': 'ID Equipamento', 'localizacao': 'Localização',
    'id_sistema': 'ID Sistema', 'marca': 'Marca', 'modelo': 'Modelo', 'data_acao': 'Data Ação', 'problema_original': 'Problema', 'acao_realizada': 'Ação Realizada',
    'responsavel': 'Responsável', 'responsavel_acao': 'Responsável'
}
# -----------------------------

def format_dataframe_for_display(df, sheet_name):
    """
    Prepara o DataFrame para exibição, renomeando colunas e selecionando as mais importantes.
    """
    if df.empty:
        return df
    
    df = df.copy()

    # Este dicionário agora está definido fora, mas a função ainda pode acessá-lo.
    SHEET_VIEW_COLUMNS = {
        EXTINGUISHER_SHEET_NAME: ['data_servico', 'numero_identificacao', 'tipo_servico', 'aprovado_inspecao', 'plano_de_acao', 'link_relatorio_pdf'],
        HOSE_SHEET_NAME: ['id_mangueira', 'data_inspecao', 'data_proximo_teste', 'resultado', 'link_certificado_pdf'],
        SHELTER_SHEET_NAME: ['id_abrigo', 'cliente', 'local', 'itens_json'],
        INSPECTIONS_SHELTER_SHEET_NAME: ['data_inspecao', 'id_abrigo', 'status_geral', 'data_proxima_inspecao', 'inspetor'],
        SCBA_SHEET_NAME: ['numero_serie_equipamento', 'data_teste', 'resultado_final', 'data_validade', 'link_relatorio_pdf'],
        SCBA_VISUAL_INSPECTIONS_SHEET_NAME: ['data_inspecao', 'numero_serie_equipamento', 'status_geral', 'data_proxima_inspecao', 'inspetor'],
        EYEWASH_INVENTORY_SHEET_NAME: ['id_equipamento', 'localizacao', 'marca', 'modelo', 'data_cadastro'],
        EYEWASH_INSPECTIONS_SHEET_NAME: ['data_inspecao', 'id_equipamento', 'status_geral', 'plano_de_acao', 'data_proxima_inspecao', 'inspetor'],
        FOAM_CHAMBER_INVENTORY_SHEET_NAME: ['id_camara', 'localizacao', 'marca', 'modelo', 'data_cadastro'],
        FOAM_CHAMBER_INSPECTIONS_SHEET_NAME: ['data_inspecao', 'id_camara', 'tipo_inspecao', 'status_geral', 'plano_de_acao', 'data_proxima_inspecao', 'inspetor'],
        LOG_FOAM_CHAMBER_SHEET_NAME: ['data_acao', 'id_camara', 'problema_original', 'acao_realizada', 'responsavel'],
        LOG_ACTIONS: ['data_acao', 'id_equipamento', 'problema_original', 'acao_realizada', 'responsavel_acao'],
        LOG_SHELTER_SHEET_NAME: ['data_acao', 'id_abrigo', 'problema_original', 'acao_realizada', 'responsavel'],
        LOG_SCBA_SHEET_NAME: ['data_acao', 'numero_serie_equipamento', 'problema_original', 'acao_realizada', 'responsavel'],
        LOG_EYEWASH_SHEET_NAME: ['data_acao', 'id_equipamento', 'problema_original', 'acao_realizada', 'responsavel'],
        ALARM_INVENTORY_SHEET_NAME: ['id_sistema', 'localizacao', 'marca', 'modelo', 'data_cadastro'],
        ALARM_INSPECTIONS_SHEET_NAME: ['data_inspecao', 'id_sistema', 'status_geral', 'plano_de_acao', 'data_proxima_inspecao', 'inspetor'],
        LOG_ALARM_SHEET_NAME: ['data_acao', 'id_sistema', 'problema_original', 'acao_realizada', 'responsavel']
    }

    cols_to_show = SHEET_VIEW_COLUMNS.get(sheet_name, df.columns.tolist())
    final_cols = [col for col in cols_to_show if col in df.columns]
    renamed_df = df[final_cols].rename(columns=ALL_COLUMNS)
    
    return renamed_df

def display_formatted_dataframe(sheet_name):
    """Função helper para carregar, formatar e exibir um DataFrame com links clicáveis."""
    df = load_sheet_data(sheet_name)
    
    if df.empty:
        st.info("Nenhum registro encontrado.")
        return
    
    df_formatted = format_dataframe_for_display(df, sheet_name)

    column_config = {}
    for col_name in df_formatted.columns:
        # A lógica para links clicáveis pode ser simplificada
        if "PDF" in col_name or "Certificado" in col_name:
            column_config[col_name] = st.column_config.LinkColumn(
                col_name, display_text="🔗 Ver Documento"
            )

    st.dataframe(
        df_formatted,
        use_container_width=True,
        hide_index=True,
        column_config=column_config
    )
    
def show_page():
    st.title("Histórico e Logs do Sistema")
    
    # Check if user has at least viewer permissions
    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return
        
    st.info("Consulte o histórico de registros e ações para todos os equipamentos do sistema.")
    
    if st.button("Limpar Cache e Recarregar Dados"):
        st.cache_data.clear()
        st.rerun()

    tab_registros, tab_logs = st.tabs(["📜 Histórico de Registros", "📖 Logs de Ações Corretivas"])

    with tab_registros:
        st.header("Histórico de Registros por Tipo de Equipamento")
        subtabs = st.tabs([
        "🔥 Extintores", "💧 Mangueiras", "🧯 Abrigos (Cadastro)", "📋 Abrigos (Inspeções)",
        "💨 SCBA (Testes)", "🩺 SCBA (Inspeções)", "🚿 C/LO (Cadastro)", "🚿 C/LO (Inspeções)", 
        "☁️ Câmaras (Cadastro)", "☁️ Câmaras (Inspeções)", "🔔 Alarmes (Cadastro)", "🔔 Alarmes (Inspeções)"
    ])

        with subtabs[0]: display_formatted_dataframe(EXTINGUISHER_SHEET_NAME)
        with subtabs[1]: display_formatted_dataframe(HOSE_SHEET_NAME)
        with subtabs[2]: display_formatted_dataframe(SHELTER_SHEET_NAME)
        with subtabs[3]: display_formatted_dataframe(INSPECTIONS_SHELTER_SHEET_NAME)
        with subtabs[4]: display_formatted_dataframe(SCBA_SHEET_NAME)
        with subtabs[5]: display_formatted_dataframe(SCBA_VISUAL_INSPECTIONS_SHEET_NAME)
        with subtabs[6]: display_formatted_dataframe(EYEWASH_INVENTORY_SHEET_NAME)
        with subtabs[7]: display_formatted_dataframe(EYEWASH_INSPECTIONS_SHEET_NAME)
        with subtabs[8]: display_formatted_dataframe(FOAM_CHAMBER_INVENTORY_SHEET_NAME)
        with subtabs[9]: display_formatted_dataframe(FOAM_CHAMBER_INSPECTIONS_SHEET_NAME)
        with subtabs[10]: display_formatted_dataframe(ALARM_INVENTORY_SHEET_NAME)
        with subtabs[11]: display_formatted_dataframe(ALARM_INSPECTIONS_SHEET_NAME)    

    with tab_logs:
        st.header("Logs de Ações Corretivas")
        subtabs = st.tabs(["🔥 Extintores", "🧯 Abrigos", "💨 C. Autônomo", "🚿 Chuveiros/Lava-Olhos", "☁️ Câmaras de Espuma", "🔔 Alarmes"])

        with subtabs[0]: display_formatted_dataframe(LOG_ACTIONS)
        with subtabs[1]: display_formatted_dataframe(LOG_SHELTER_SHEET_NAME)
        with subtabs[2]: display_formatted_dataframe(LOG_SCBA_SHEET_NAME)
        with subtabs[3]: display_formatted_dataframe(LOG_EYEWASH_SHEET_NAME)
        with subtabs[4]: display_formatted_dataframe(LOG_FOAM_CHAMBER_SHEET_NAME)
        with subtabs[5]: display_formatted_dataframe(LOG_ALARM_SHEET_NAME)    

