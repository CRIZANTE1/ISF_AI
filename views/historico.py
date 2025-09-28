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
    LOG_FOAM_CHAMBER_SHEET_NAME, ALARM_INVENTORY_SHEET_NAME, ALARM_INSPECTIONS_SHEET_NAME, 
    LOG_ALARM_SHEET_NAME, HOSE_DISPOSAL_LOG_SHEET_NAME
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
    'id_sistema': 'ID Sistema', 'marca': 'Marca', 'modelo': 'Modelo', 'data_acao': 'Data Ação', 
    'problema_original': 'Problema', 'acao_realizada': 'Ação Realizada',
    'responsavel': 'Responsável', 'responsavel_acao': 'Responsável',
    'data_baixa': 'Data da Baixa', 'motivo_condenacao': 'Motivo da Condenação', 
    'responsavel_baixa': 'Responsável pela Baixa', 'numero_identificacao_substituto': 'ID Substituto',
    'observacoes': 'Observações', 'link_foto_evidencia': 'Evidência Fotográfica',
    'motivo': 'Motivo da Baixa', 'id_mangueira_substituta': 'Mangueira Substituta'
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
        LOG_ALARM_SHEET_NAME: ['data_acao', 'id_sistema', 'problema_original', 'acao_realizada', 'responsavel'],
        'log_baixas_extintores': ['data_baixa', 'numero_identificacao', 'motivo_condenacao', 'responsavel_baixa', 'numero_identificacao_substituto', 'observacoes', 'link_foto_evidencia'],
        HOSE_DISPOSAL_LOG_SHEET_NAME: ['data_baixa', 'id_mangueira', 'motivo', 'responsavel', 'id_mangueira_substituta']
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
        if "PDF" in col_name or "Certificado" in col_name or "Evidência" in col_name:
            column_config[col_name] = st.column_config.LinkColumn(
                col_name, 
                display_text="🔗 Ver Documento" if "PDF" in col_name or "Certificado" in col_name else "📷 Ver Foto"
            )

    st.dataframe(
        df_formatted,
        use_container_width=True,
        hide_index=True,
        column_config=column_config
    )

def display_disposal_summary():
    """Exibe um resumo das baixas por tipo de equipamento."""
    try:
        # Carrega dados de baixas de extintores
        from operations.extinguisher_disposal_operations import get_disposed_extinguishers
        df_ext_disposed = get_disposed_extinguishers()
        
        # Carrega dados de baixas de mangueiras
        df_hose_disposed = load_sheet_data(HOSE_DISPOSAL_LOG_SHEET_NAME)
        
        # Calcula estatísticas
        total_ext_disposed = len(df_ext_disposed) if not df_ext_disposed.empty else 0
        total_hose_disposed = len(df_hose_disposed) if not df_hose_disposed.empty else 0
        total_disposed = total_ext_disposed + total_hose_disposed
        
        # Exibe métricas
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("📊 Total de Baixas", total_disposed)
        col2.metric("🔥 Extintores Baixados", total_ext_disposed)
        col3.metric("💧 Mangueiras Baixadas", total_hose_disposed)
        col4.metric("📅 Este Mês", "Em desenvolvimento")  # Pode ser implementado depois
        
        st.markdown("---")
        
        # Gráfico de motivos mais comuns (se houver dados)
        if not df_ext_disposed.empty:
            st.subheader("📈 Principais Motivos de Baixa - Extintores")
            motivos_count = df_ext_disposed['motivo_condenacao'].value_counts()
            if not motivos_count.empty:
                st.bar_chart(motivos_count)
        
    except Exception as e:
        st.error(f"Erro ao carregar resumo de baixas: {e}")

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

    tab_registros, tab_logs, tab_disposals = st.tabs([
        "📜 Histórico de Registros", 
        "📖 Logs de Ações Corretivas", 
        "🗑️ Baixas Definitivas"
    ])

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
        subtabs = st.tabs([
            "🔥 Extintores", "🧯 Abrigos", "💨 C. Autônomo", 
            "🚿 Chuveiros/Lava-Olhos", "☁️ Câmaras de Espuma", "🔔 Alarmes"
        ])

        with subtabs[0]: display_formatted_dataframe(LOG_ACTIONS)
        with subtabs[1]: display_formatted_dataframe(LOG_SHELTER_SHEET_NAME)
        with subtabs[2]: display_formatted_dataframe(LOG_SCBA_SHEET_NAME)
        with subtabs[3]: display_formatted_dataframe(LOG_EYEWASH_SHEET_NAME)
        with subtabs[4]: display_formatted_dataframe(LOG_FOAM_CHAMBER_SHEET_NAME)
        with subtabs[5]: display_formatted_dataframe(LOG_ALARM_SHEET_NAME)    

    with tab_disposals:
        st.header("🗑️ Registros de Baixas Definitivas")
        
        # Exibe resumo das baixas
        with st.expander("📊 Resumo de Baixas", expanded=True):
            display_disposal_summary()
        
        st.markdown("---")
        
        # Sub-abas para diferentes tipos de equipamentos
        disposal_subtabs = st.tabs([
            "🔥 Extintores Baixados", 
            "💧 Mangueiras Baixadas"
        ])
        
        with disposal_subtabs[0]:
            st.subheader("Extintores com Baixa Definitiva")
            try:
                from operations.extinguisher_disposal_operations import get_disposed_extinguishers
                df_disposed = get_disposed_extinguishers()
                
                if df_disposed.empty:
                    st.info("✅ Nenhum extintor foi baixado definitivamente.")
                else:
                    # Formatação especial para extintores baixados
                    df_formatted = df_disposed.rename(columns=ALL_COLUMNS)
                    
                    # Configuração de colunas com links
                    column_config = {
                        "Evidência Fotográfica": st.column_config.LinkColumn(
                            "Evidência Fotográfica", 
                            display_text="📷 Ver Foto"
                        )
                    }
                    
                    st.dataframe(
                        df_formatted,
                        column_config=column_config,
                        use_container_width=True,
                        hide_index=True
                    )
                    
                    # Estatísticas detalhadas
                    st.markdown("### 📈 Análise Detalhada")
                    
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        st.write("**Motivos de Baixa:**")
                        motivos_count = df_disposed['motivo_condenacao'].value_counts()
                        for motivo, count in motivos_count.items():
                            st.write(f"• {motivo}: {count}")
                    
                    with col2:
                        st.write("**Responsáveis pelas Baixas:**")
                        responsaveis_count = df_disposed['responsavel_baixa'].value_counts()
                        for responsavel, count in responsaveis_count.items():
                            st.write(f"• {responsavel}: {count}")
                            
            except Exception as e:
                st.error(f"Erro ao carregar registros de baixa de extintores: {e}")
        
        with disposal_subtabs[1]:
            st.subheader("Mangueiras com Baixa Definitiva")
            
            df_hose_disposed = load_sheet_data(HOSE_DISPOSAL_LOG_SHEET_NAME)
            
            if df_hose_disposed.empty:
                st.info("✅ Nenhuma mangueira foi baixada definitivamente.")
            else:
                # Formatação para mangueiras baixadas
                df_formatted = format_dataframe_for_display(df_hose_disposed, HOSE_DISPOSAL_LOG_SHEET_NAME)
                
                st.dataframe(
                    df_formatted,
                    use_container_width=True,
                    hide_index=True
                )
                
                # Estatísticas para mangueiras
                st.markdown("### 📈 Análise de Baixas de Mangueiras")
                
                col1, col2 = st.columns(2)
                
                with col1:
                    st.metric("Total de Baixas", len(df_hose_disposed))
                
                with col2:
                    if 'motivo' in df_hose_disposed.columns:
                        motivos_hose = df_hose_disposed['motivo'].value_counts()
                        st.write("**Principais Motivos:**")
                        for motivo, count in motivos_hose.head(3).items():
                            st.write(f"• {motivo}: {count}")
        
        # Seção de filtros e busca
        st.markdown("---")
        with st.expander("🔍 Filtros e Busca Avançada"):
            st.info("Em desenvolvimento: Filtros por período, responsável, motivo, etc.")
            
            # Placeholder para filtros futuros
            col1, col2, col3 = st.columns(3)
            with col1:
                st.date_input("Data Inicial", disabled=True)
            with col2:
                st.date_input("Data Final", disabled=True)
            with col3:
                st.selectbox("Tipo de Equipamento", ["Todos", "Extintores", "Mangueiras"], disabled=True)
