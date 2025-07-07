import streamlit as st
import pandas as pd
from datetime import datetime
from streamlit_js_eval import streamlit_js_eval
from operations.history import load_sheet_data

def _generate_extinguisher_report_content(df_inspections_month, df_action_log, month, year):
    """Gera o conteúdo do relatório de EXTINTORES."""
    
    st.header(f"Relatório de Inspeções de Extintores - {month:02d}/{year}")
    st.markdown("---")

    if df_inspections_month.empty:
        st.warning("Nenhum registro de inspeção de extintor encontrado para o período.")
        return

    # Garante que a coluna de data no log de ações esteja no formato correto para comparação
    if not df_action_log.empty:
        df_action_log['data_correcao_dt'] = pd.to_datetime(df_action_log['data_correcao'], errors='coerce')

    for index, inspection in df_inspections_month.iterrows():
        ext_id = inspection['numero_identificacao']
        status = inspection['aprovado_inspecao']
        obs = inspection['observacoes_gerais']
        photo_nc_link = inspection.get('link_foto_nao_conformidade')
        inspection_date = pd.to_datetime(inspection['data_servico'])

        status_icon = "✅" if status == "Sim" else "❌"
        
        with st.container(border=True):
            st.subheader(f"{status_icon} Equipamento ID: {ext_id}")
            col1, col2 = st.columns(2)
            col1.metric("Data da Inspeção", inspection_date.strftime('%d/%m/%Y'))
            col2.metric("Status", "Conforme" if status == "Sim" else "Não Conforme")
            
            st.text_input("Observações da Inspeção:", value=obs, disabled=True, key=f"obs_{ext_id}_{index}")
            
            if status == 'Não':
                st.markdown("---")
                st.subheader("Evidência da Não Conformidade")
                if pd.notna(photo_nc_link) and photo_nc_link.strip():
                    # Usa st.markdown para inserir a imagem, que é mais robusto
                    st.markdown(f"![Foto da Não Conformidade]({photo_nc_link})")
                else:
                    st.info("Nenhuma foto de não conformidade foi anexada.")
                
                st.markdown("---")
                st.subheader("Ação Corretiva")
                
                action = pd.DataFrame() # Inicia como DataFrame vazio
                if not df_action_log.empty:
                    action = df_action_log[
                        (df_action_log['id_equipamento'].astype(str) == str(ext_id)) &
                        (df_action_log['data_correcao_dt'] >= inspection_date)
                    ].sort_values(by='data_correcao_dt')

                if not action.empty:
                    action_taken = action.iloc[0] # Pega a primeira ação corretiva após a inspeção
                    st.success("Ação Corretiva Registrada:")
                    st.text_input("Ação Realizada:", value=action_taken.get('acao_realizada', 'N/A'), disabled=True, key=f"action_{ext_id}_{index}")
                    st.text_input("Responsável:", value=action_taken.get('responsavel_acao', 'N/A'), disabled=True, key=f"resp_{ext_id}_{index}")
                    st.text_input("Data da Correção:", value=pd.to_datetime(action_taken['data_correcao_dt']).strftime('%d/%m/%Y'), disabled=True, key=f"date_{ext_id}_{index}")
                else:
                    st.error("Ação Corretiva Pendente.")

def show_monthly_report_interface():
    """Função principal que desenha a interface de geração de relatórios."""
    st.title("📄 Emissão de Relatórios Mensais")
    
    today = datetime.now()
    col1, col2 = st.columns(2)
    with col1:
        selected_year = st.selectbox("Selecione o Ano:", range(today.year, today.year - 5, -1), index=0, key="report_year")
    with col2:
        months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
        default_month_index = today.month - 2 if today.day < 5 else today.month - 1
        selected_month_name = st.selectbox("Selecione o Mês:", months, index=default_month_index, key="report_month_name")
        selected_month_num = months.index(selected_month_name) + 1

    if st.button("Gerar Relatório", type="primary", key="generate_report_btn"):
        month = selected_month_num
        year = selected_year
        
        with st.spinner(f"Carregando dados para {month:02d}/{year}..."):
            df_inspections = load_sheet_data("extintores")
            df_action_log = load_sheet_data("log_acoes")
            # Futuramente, você carregaria o df_hoses aqui também

        # --- Área de Impressão com Abas ---
        with st.container(border=True):
            if st.button("🖨️ Imprimir / Salvar como PDF", key="print_btn"):
                streamlit_js_eval(js_expressions="window.print()")
            
            tab_ext, tab_hose = st.tabs(["🔥 Relatório de Extintores", "💧 Relatório de Mangueiras (em breve)"])

            with tab_ext:
                if not df_inspections.empty:
                    df_inspections['data_servico'] = pd.to_datetime(df_inspections['data_servico'], errors='coerce')
                    mask = (df_inspections['data_servico'].dt.year == year) & \
                           (df_inspections['data_servico'].dt.month == month) & \
                           (df_inspections['tipo_servico'] == 'Inspeção')
                    df_inspections_month = df_inspections[mask].sort_values(by='data_servico')
                else:
                    df_inspections_month = pd.DataFrame()
                
                _generate_extinguisher_report_content(df_inspections_month, df_action_log, month, year)
            
            with tab_hose:
                st.info("A funcionalidade de relatório de inspeção de mangueiras está em desenvolvimento.")
                #  _generate_hose_report_content(...) aqui.
