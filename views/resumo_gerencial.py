import streamlit as st
import pandas as pd
from datetime import date
import sys
import os
import numpy as np
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from operations.history import load_sheet_data
from config.page_config import set_page_config
from auth.auth_utils import check_user_access, can_view
from gdrive.config import (
    EXTINGUISHER_SHEET_NAME, LOCATIONS_SHEET_NAME, HOSE_SHEET_NAME, HOSE_DISPOSAL_LOG_SHEET_NAME,
    SHELTER_SHEET_NAME, INSPECTIONS_SHELTER_SHEET_NAME, SCBA_SHEET_NAME,
    SCBA_VISUAL_INSPECTIONS_SHEET_NAME, EYEWASH_INSPECTIONS_SHEET_NAME,
    FOAM_CHAMBER_INVENTORY_SHEET_NAME, FOAM_CHAMBER_INSPECTIONS_SHEET_NAME,
    MULTIGAS_INVENTORY_SHEET_NAME, MULTIGAS_INSPECTIONS_SHEET_NAME, ALARM_INSPECTIONS_SHEET_NAME,
    CANHAO_MONITOR_INVENTORY_SHEET_NAME,      
    CANHAO_MONITOR_INSPECTIONS_SHEET_NAME    
)

from .dashboard import (
    get_consolidated_status_df,
    get_hose_status_df,
    get_shelter_status_df,
    get_scba_status_df,
    get_eyewash_status_df,
    get_foam_chamber_status_df,
    get_multigas_status_df,
    get_alarm_status_df,
    get_canhao_monitor_status_df  
)

set_page_config()

def show_page():
    st.title("📊 Resumo Gerencial de Equipamentos de Emergência")
    
    # Check if user has at least viewer permissions
    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return
        
    st.info("Esta é uma visão geral do status atual de todos os equipamentos. Para detalhes completos ou registros, contate um 'editor' ou 'administrador'.")

    if st.button("Limpar Cache e Recarregar Dados"):
        st.cache_data.clear()
        st.rerun()

    tab_extinguishers, tab_hoses, tab_shelters, tab_scba, tab_eyewash, tab_foam, tab_multigas, tab_alarms, tab_canhoes = st.tabs([
        "🔥 Extintores", "💧 Mangueiras", "🧯 Abrigos", "💨 C. Autônomo", 
        "🚿 Chuveiros/Lava-Olhos", "☁️ Câmaras de Espuma", "💨 Multigás", "🔔 Alarmes", "🌊 Canhões Monitores"
    ])

    with tab_extinguishers:
        st.header("Situação dos Extintores")
        df_full_history = load_sheet_data(EXTINGUISHER_SHEET_NAME)
        df_locais = load_sheet_data(LOCATIONS_SHEET_NAME)

        if df_full_history.empty:
            st.warning("Nenhum registro de extintor encontrado.")
        else:
            dashboard_df = get_consolidated_status_df(df_full_history, df_locais)
            if not dashboard_df.empty:
                status_counts = dashboard_df['status_atual'].value_counts()
                col1, col2, col3, col4 = st.columns(4)
                col1.metric("✅ Total Ativo", len(dashboard_df))
                col2.metric("🟢 OK", status_counts.get("OK", 0))
                col3.metric("🔴 VENCIDO", status_counts.get("VENCIDO", 0))
                col4.metric("🟠 NÃO CONFORME", status_counts.get("NÃO CONFORME (Aguardando Ação)", 0))
                st.markdown("---")

                st.subheader("Plano de Ação para Equipamentos com Pendências")
                pending_df = dashboard_df[dashboard_df['status_atual'] != 'OK']
                if pending_df.empty:
                    st.success("✅ Todos os extintores estão em conformidade!")
                else:
                    st.dataframe(
                        pending_df[['numero_identificacao', 'status_atual', 'plano_de_acao', 'status_instalacao']],
                        column_config={
                            "numero_identificacao": "ID Equip.", "status_atual": "Status",
                            "plano_de_acao": "Ação Recomendada", "status_instalacao": "Localização"
                        },
                        width='stretch', hide_index=True
                    )

    with tab_hoses:
        st.header("Situação das Mangueiras de Incêndio")
        df_hoses_history = load_sheet_data(HOSE_SHEET_NAME)
        df_disposals = load_sheet_data(HOSE_DISPOSAL_LOG_SHEET_NAME)

        if df_hoses_history.empty:
            st.warning("Nenhum registro de mangueira encontrado.")
        else:
            dashboard_df_hoses = get_hose_status_df(df_hoses_history, df_disposals)
            status_counts = dashboard_df_hoses['status'].value_counts()
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("✅ Total Ativas", len(dashboard_df_hoses))
            col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
            col3.metric("🔴 VENCIDO", status_counts.get("🔴 VENCIDO", 0))
            col4.metric("🟠 REPROVADA", status_counts.get("🟠 REPROVADA", 0))
            
            st.markdown("---")
            st.subheader("Mangueiras com Pendências")
            pending_hoses = dashboard_df_hoses[dashboard_df_hoses['status'] != '🟢 OK']
            if pending_hoses.empty:
                st.success("✅ Todas as mangueiras estão em conformidade!")
            else:
                st.dataframe(
                    pending_hoses[['id_mangueira', 'status', 'data_proximo_teste']],
                    column_config={"id_mangueira": "ID", "status": "Status", "data_proximo_teste": "Vencimento"},
                    width='stretch', hide_index=True
                )

    with tab_shelters:
        st.header("Situação dos Abrigos de Emergência")
        df_shelters_registered = load_sheet_data(SHELTER_SHEET_NAME)
        df_inspections_history = load_sheet_data(INSPECTIONS_SHELTER_SHEET_NAME)
        if df_shelters_registered.empty:
            st.warning("Nenhum abrigo cadastrado.")
        else:
            dashboard_df_shelters = get_shelter_status_df(df_shelters_registered, df_inspections_history)
            status_counts = dashboard_df_shelters['status_dashboard'].value_counts()
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("✅ Total de Abrigos", len(dashboard_df_shelters))
            col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
            col3.metric("🟠 Pendentes", status_counts.get("🟠 COM PENDÊNCIAS", 0) + status_counts.get("🔵 PENDENTE (Nova Inspeção)", 0))
            col4.metric("🔴 Vencido", status_counts.get("🔴 VENCIDO", 0))
            st.markdown("---")
            st.subheader("Abrigos com Pendências")
            pending_shelters = dashboard_df_shelters[dashboard_df_shelters['status_dashboard'] != '🟢 OK']
            if pending_shelters.empty:
                st.success("✅ Todos os abrigos estão em conformidade!")
            else:
                st.dataframe(
                    pending_shelters[['id_abrigo', 'status_dashboard', 'local', 'data_proxima_inspecao_str']],
                    column_config={"id_abrigo": "ID", "status_dashboard": "Status", "local": "Localização", "data_proxima_inspecao_str": "Vencimento"},
                    width='stretch', hide_index=True
                )

    with tab_scba:
        st.header("Situação dos Conjuntos Autônomos")
        df_scba_main = load_sheet_data(SCBA_SHEET_NAME)
        df_scba_visual = load_sheet_data(SCBA_VISUAL_INSPECTIONS_SHEET_NAME)
        if df_scba_main.empty:
            st.warning("Nenhum teste de SCBA registrado.")
        else:
            dashboard_df = get_scba_status_df(df_scba_main, df_scba_visual)
            if not dashboard_df.empty:
                status_counts = dashboard_df['status_consolidado'].value_counts()
                col1, col2, col3, col4 = st.columns(4)
                col1.metric("✅ Total", len(dashboard_df))
                col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
                col3.metric("🟠 Pendências", status_counts.get("🟠 COM PENDÊNCIAS", 0))
                col4.metric("🔴 Vencidos", status_counts.get("🔴 VENCIDO (Teste Posi3)", 0) + status_counts.get("🔴 VENCIDO (Insp. Periódica)", 0))
                st.markdown("---")
                st.subheader("SCBAs com Pendências")
                pending_scba = dashboard_df[dashboard_df['status_consolidado'] != '🟢 OK']
                if pending_scba.empty:
                    st.success("✅ Todos os conjuntos autônomos estão em conformidade!")
                else:
                    st.dataframe(
                        pending_scba[['numero_serie_equipamento', 'status_consolidado', 'data_validade', 'data_proxima_inspecao']],
                        column_config={"numero_serie_equipamento": "S/N", "status_consolidado": "Status", "data_validade": "Val. Teste", "data_proxima_inspecao": "Próx. Inspeção"},
                        width='stretch', hide_index=True
                    )

    with tab_eyewash:
        st.header("Situação dos Chuveiros e Lava-Olhos")
        df_eyewash_history = load_sheet_data(EYEWASH_INSPECTIONS_SHEET_NAME)
        if df_eyewash_history.empty:
            st.warning("Nenhuma inspeção registrada.")
        else:
            dashboard_df = get_eyewash_status_df(df_eyewash_history)
            status_counts = dashboard_df['status_dashboard'].value_counts()
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("✅ Total", len(dashboard_df))
            col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
            col3.metric("🟠 Com Pendências", status_counts.get("🟠 COM PENDÊNCIAS", 0))
            col4.metric("🔴 Vencido", status_counts.get("🔴 VENCIDO", 0))
            st.markdown("---")
            st.subheader("Chuveiros/Lava-Olhos com Pendências")
            pending_eyewash = dashboard_df[dashboard_df['status_dashboard'] != '🟢 OK']
            if pending_eyewash.empty:
                st.success("✅ Todos os chuveiros/lava-olhos estão em conformidade!")
            else:
                st.dataframe(
                    pending_eyewash[['id_equipamento', 'status_dashboard', 'plano_de_acao', 'data_proxima_inspecao']],
                    column_config={"id_equipamento": "ID", "status_dashboard": "Status", "plano_de_acao": "Ação Recomendada", "data_proxima_inspecao": "Vencimento"},
                    width='stretch', hide_index=True
                )

    with tab_foam:
        st.header("Situação das Câmaras de Espuma")
        df_foam_inventory = load_sheet_data(FOAM_CHAMBER_INVENTORY_SHEET_NAME)
        df_foam_history = load_sheet_data(FOAM_CHAMBER_INSPECTIONS_SHEET_NAME)
        if df_foam_history.empty:
            st.warning("Nenhuma inspeção registrada.")
        else:
            dashboard_df = get_foam_chamber_status_df(df_foam_history)
            if not df_foam_inventory.empty:
                dashboard_df = pd.merge(dashboard_df, df_foam_inventory[['id_camara', 'localizacao', 'modelo']], on='id_camara', how='left')
            
            status_counts = dashboard_df['status_dashboard'].value_counts()
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("✅ Total", len(dashboard_df))
            col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
            col3.metric("🟠 Com Pendências", status_counts.get("🟠 COM PENDÊNCIAS", 0))
            col4.metric("🔴 Vencido", status_counts.get("🔴 VENCIDO", 0))
            st.markdown("---")
            st.subheader("Câmaras de Espuma com Pendências")
            pending_foam = dashboard_df[dashboard_df['status_dashboard'] != '🟢 OK']
            if pending_foam.empty:
                st.success("✅ Todas as câmaras de espuma estão em conformidade!")
            else:
                st.dataframe(
                    pending_foam[['id_camara', 'status_dashboard', 'plano_de_acao', 'localizacao', 'data_proxima_inspecao']],
                    column_config={"id_camara": "ID", "status_dashboard": "Status", "plano_de_acao": "Ação Recomendada", "localizacao": "Localização", "data_proxima_inspecao": "Vencimento"},
                    width='stretch', hide_index=True
                )

    with tab_multigas:
        st.header("Situação dos Detectores Multigás")
        df_inventory = load_sheet_data(MULTIGAS_INVENTORY_SHEET_NAME)
        df_inspections = load_sheet_data(MULTIGAS_INSPECTIONS_SHEET_NAME)

        dashboard_df = get_multigas_status_df(df_inventory, df_inspections)
        
        total_equip = len(dashboard_df)
        calib_ok = (dashboard_df['status_calibracao'] == '🟢 OK').sum() if not dashboard_df.empty else 0
        bump_ok = (dashboard_df['status_bump_test'] == '🟢 OK').sum() if not dashboard_df.empty else 0
        
        col1, col2, col3 = st.columns(3)
        col1.metric("✅ Total de Detectores", total_equip)
        col2.metric("🗓️ Calibração Anual OK", f"{calib_ok} / {total_equip}")
        col3.metric("💨 Bump Test OK", f"{bump_ok} / {total_equip}")
        st.markdown("---")
        
        st.subheader("Detectores com Pendências")
        if df_inventory.empty:
            st.warning("Nenhum detector multigás cadastrado no sistema.")
        else:
            pending_df = dashboard_df[
                (dashboard_df['status_calibracao'] != '🟢 OK') | 
                (dashboard_df['status_bump_test'] != '🟢 OK')
            ]
            
            if pending_df.empty:
                st.success("✅ Todos os detectores estão em conformidade!")
            else:
                st.dataframe(
                    pending_df[['id_equipamento', 'numero_serie', 'status_calibracao', 'status_bump_test', 'proxima_calibracao']],
                    column_config={
                        "id_equipamento": "ID Equip.",
                        "numero_serie": "S/N",
                        "status_calibracao": "Status Calibração",
                        "status_bump_test": "Status Bump Test",
                        "proxima_calibracao": "Venc. Calibração"
                    },
                    width='stretch', hide_index=True
                )
    with tab_alarms:
        st.header("Situação dos Sistemas de Alarme")
        df_alarm_inspections = load_sheet_data(ALARM_INSPECTIONS_SHEET_NAME)
        
        if df_alarm_inspections.empty:
            st.warning("Nenhuma inspeção de sistema de alarme registrada.")
        else:
            dashboard_df = get_alarm_status_df(df_alarm_inspections)
            status_counts = dashboard_df['status_dashboard'].value_counts()
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("✅ Total", len(dashboard_df))
            col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
            col3.metric("🟠 Com Pendências", status_counts.get("🟠 COM PENDÊNCIAS", 0))
            col4.metric("🔴 Vencido", status_counts.get("🔴 VENCIDO", 0))
            st.markdown("---")
            st.subheader("Sistemas com Pendências")
            pending_alarms = dashboard_df[dashboard_df['status_dashboard'] != '🟢 OK']
            if pending_alarms.empty:
                st.success("✅ Todos os sistemas de alarme estão em conformidade!")
            else:
                st.dataframe(
                    pending_alarms[['id_sistema', 'status_dashboard', 'plano_de_acao', 'data_proxima_inspecao']],
                    column_config={"id_sistema": "ID", "status_dashboard": "Status", "plano_de_acao": "Ação Recomendada", "data_proxima_inspecao": "Vencimento"},
                    width='stretch', hide_index=True
                )

    with tab_canhoes:
        st.header("Situação dos Canhões Monitores")
        df_inventory = load_sheet_data(CANHAO_MONITOR_INVENTORY_SHEET_NAME)
        df_inspections = load_sheet_data(CANHAO_MONITOR_INSPECTIONS_SHEET_NAME)

        if df_inspections.empty:
            st.warning("Nenhum registro de canhão monitor encontrado.")
        else:
            dashboard_df = get_canhao_monitor_status_df(df_inspections)
            if not df_inventory.empty:
                dashboard_df = pd.merge(dashboard_df, df_inventory[['id_equipamento', 'localizacao']], on='id_equipamento', how='left')

            status_counts = dashboard_df['status_dashboard'].value_counts()
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("✅ Total", len(dashboard_df))
            col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
            col3.metric("🟠 Com Pendências", status_counts.get("🟠 COM PENDÊNCIAS", 0))
            col4.metric("🔴 Vencido", status_counts.get("🔴 VENCIDO", 0))
            st.markdown("---")

            st.subheader("Canhões Monitores com Pendências")
            pending_df = dashboard_df[dashboard_df['status_dashboard'] != '🟢 OK']
            if pending_df.empty:
                st.success("✅ Todos os canhões monitores estão em conformidade!")
            else:
                st.dataframe(
                    pending_df[['id_equipamento', 'status_dashboard', 'plano_de_acao', 'localizacao', 'data_proxima_inspecao']],
                    column_config={
                        "id_equipamento": "ID", "status_dashboard": "Status", "plano_de_acao": "Ação Recomendada", 
                        "localizacao": "Localização", "data_proxima_inspecao": "Vencimento"
                    },
                    use_container_width=True, hide_index=True
                )
