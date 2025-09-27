import streamlit as st
import sys
import os
import pandas as pd
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from operations.alarm_operations import (
    save_new_alarm_system, 
    save_alarm_inspection, 
    CHECKLIST_QUESTIONS
)
from auth.auth_utils import (
    get_user_display_name, 
    check_user_access, 
    can_edit,
    has_ai_features
)
from config.page_config import set_page_config
from operations.history import load_sheet_data
from gdrive.config import ALARM_INVENTORY_SHEET_NAME, ALARM_INSPECTIONS_SHEET_NAME
from reports.alarm_report import generate_alarm_inspection_html
from streamlit_js_eval import streamlit_js_eval
import json

set_page_config()

def show_page():
    st.title("🔔 Gestão de Sistemas de Alarme de Emergência")

    # Verifica permissões de acesso
    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return

    # Cria as abas da interface
    tab_inspection, tab_register, tab_quick_register = st.tabs([
        "📋 Realizar Inspeção", 
        "➕ Cadastrar Novo Sistema (Completo)",
        "✍️ Cadastro Rápido de Sistema"
    ])

    # Aba de Inspeção
    with tab_inspection:
        st.header("Realizar Inspeção Periódica")

        with st.expander("📄 Gerar Relatório Mensal de Inspeções"):
            df_inspections_full = load_sheet_data(ALARM_INSPECTIONS_SHEET_NAME)
            df_inventory_full = load_sheet_data(ALARM_INVENTORY_SHEET_NAME)
            
            if df_inspections_full.empty:
                st.info("Nenhuma inspeção de sistema de alarme registrada para gerar relatórios.")
            else:
                # Converte a coluna de data para o formato datetime
                df_inspections_full['data_inspecao_dt'] = pd.to_datetime(df_inspections_full['data_inspecao'], errors='coerce')

                # Filtros para mês e ano
                today = datetime.now()
                col1, col2 = st.columns(2)
                
                with col1:
                    years_with_data = sorted(df_inspections_full['data_inspecao_dt'].dt.year.unique(), reverse=True)
                    if not years_with_data:
                        years_with_data = [today.year]
                    selected_year = st.selectbox("Selecione o Ano:", years_with_data, key="alarm_report_year")
                
                with col2:
                    months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", 
                             "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
                    default_month_index = today.month - 1
                    selected_month_name = st.selectbox("Selecione o Mês:", months, 
                                                     index=default_month_index, key="alarm_report_month")
                
                selected_month_number = months.index(selected_month_name) + 1

                # Filtra os dados pelo mês e ano selecionados
                inspections_selected_month = df_inspections_full[
                    (df_inspections_full['data_inspecao_dt'].dt.year == selected_year) &
                    (df_inspections_full['data_inspecao_dt'].dt.month == selected_month_number)
                ].sort_values(by='data_inspecao_dt')

                if inspections_selected_month.empty:
                    st.info(f"Nenhuma inspeção foi registrada em {selected_month_name} de {selected_year}.")
                else:
                    st.write(f"Encontradas {len(inspections_selected_month)} inspeções em {selected_month_name}/{selected_year}.")
                    
                    if st.button("📄 Gerar e Imprimir Relatório", type="primary", key="generate_alarm_report"):
                        unit_name = st.session_state.get('current_unit_name', 'N/A')
                        report_html = generate_alarm_inspection_html(
                            inspections_selected_month, 
                            df_inventory_full, 
                            unit_name
                        )
                        
                        js_code = f"""
                            const reportHtml = {json.dumps(report_html)};
                            const printWindow = window.open('', '_blank');
                            if (printWindow) {{
                                printWindow.document.write(reportHtml);
                                printWindow.document.close();
                                printWindow.focus();
                                setTimeout(() => {{ 
                                    printWindow.print(); 
                                    printWindow.close(); 
                                }}, 500);
                            }} else {{
                                alert('Por favor, desabilite o bloqueador de pop-ups para este site.');
                            }}
                        """
                        
                        streamlit_js_eval(js_expressions=js_code, key="print_alarm_report_js")
                        st.success("Relatório enviado para impressão!")
        
        st.markdown("---")
        
        # Verifica permissões de edição
        if not can_edit():
            st.warning("Você precisa de permissões de edição para realizar inspeções.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            # Carrega inventário de sistemas de alarme
            df_inventory = load_sheet_data(ALARM_INVENTORY_SHEET_NAME)
            
            if df_inventory.empty:
                st.warning("Nenhum sistema de alarme cadastrado. Vá para as abas de cadastro para começar.")
            else:
                equipment_options = ["Selecione um sistema..."] + sorted(df_inventory['id_sistema'].tolist())
                selected_system_id = st.selectbox("Selecione o Sistema para Inspecionar", equipment_options)

                if selected_system_id != "Selecione um sistema...":
                    # Exibe informações do sistema selecionado
                    system_data = df_inventory[df_inventory['id_sistema'] == selected_system_id].iloc[0]
                    location = system_data.get('localizacao', 'N/A')
                    model = system_data.get('modelo', 'N/A')
                    brand = system_data.get('marca', 'N/A')
                    
                    st.info(f"**Localização:** {location} | **Marca/Modelo:** {brand} / {model}")
                    
                    # Formulário de inspeção
                    with st.form(key=f"inspection_form_{selected_system_id}"):
                        inspection_results = {}
                        has_issues = False
                        
                        # Percorre todas as categorias e perguntas do checklist
                        for category, questions in CHECKLIST_QUESTIONS.items():
                            st.subheader(category)
                            for question in questions:
                                key = f"{selected_system_id}_{question}".replace(" ", "_").replace("/", "")
                                answer = st.radio(
                                    label=question, 
                                    options=["Conforme", "Não Conforme", "N/A"],
                                    key=key, 
                                    horizontal=True
                                )
                                inspection_results[question] = answer
                                if answer == "Não Conforme":
                                    has_issues = True
                        
                        st.markdown("---")
                        
                        # Campo para upload de foto se houver não conformidades
                        photo_file = None
                        if has_issues:
                            st.warning("Foi encontrada pelo menos uma não conformidade. Por favor, anexe uma foto como evidência.")
                            photo_file = st.file_uploader(
                                "Anexar foto da não conformidade", 
                                type=["jpg", "jpeg", "png"], 
                                key=f"photo_{selected_system_id}"
                            )

                        # Botão para salvar a inspeção
                        submitted = st.form_submit_button("✅ Salvar Inspeção", type="primary", use_container_width=True)

                        if submitted:
                            # Verifica se foto foi anexada quando necessária
                            if has_issues and not photo_file:
                                st.error("É obrigatório anexar uma foto quando há não conformidades.")
                            else:
                                # Define o status geral da inspeção
                                overall_status = "Reprovado com Pendências" if has_issues else "Aprovado"
                                
                                # Salva a inspeção
                                with st.spinner("Salvando inspeção..."):
                                    if save_alarm_inspection(
                                        system_id=selected_system_id,
                                        overall_status=overall_status,
                                        results_dict=inspection_results,
                                        photo_file=photo_file,
                                        inspector_name=get_user_display_name()
                                    ):
                                        st.success(f"Inspeção para o sistema '{selected_system_id}' salva com sucesso!")
                                        
                                        # Exibe animação de balões se tudo estiver conforme
                                        if not has_issues:
                                            st.balloons()
                                            
                                        # Limpa o cache e recarrega a página
                                        st.cache_data.clear()
                                        st.rerun()
                                    else:
                                        st.error("Ocorreu um erro ao salvar a inspeção.")

    # Aba de Cadastro Completo
    with tab_register:
        st.header("Cadastrar Novo Sistema de Alarme (Completo)")
        
        # Verifica permissões de edição
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novos sistemas.")
        else:
            with st.form("new_alarm_system_form", clear_on_submit=True):
                st.info("Preencha os dados completos do novo sistema a ser adicionado ao sistema.")
                
                # Campos básicos do formulário
                col1, col2 = st.columns(2)
                new_id = col1.text_input("**ID do Sistema (Obrigatório)**", help="Use um código único, ex: AL-01")
                new_location = col2.text_input("**Localização (Obrigatório)**", help="Descrição da localização física, ex: Prédio Administrativo - Recepção")
                
                col3, col4 = st.columns(2)
                new_brand = col3.text_input("Marca/Fabricante", help="Ex: Siemens, Johnson Controls, Honeywell")
                new_model = col4.text_input("Modelo", help="Modelo específico do sistema")
                
                # Campos adicionais
                st.markdown("---")
                st.subheader("Especificações do Sistema")
                
                col5, col6 = st.columns(2)
                system_type = col5.selectbox(
                    "Tipo de Sistema", 
                    ["Convencional", "Endereçável", "Sem Fio", "Híbrido"]
                )
                install_date = col6.date_input(
                    "Data de Instalação", 
                    value=None, 
                    help="Data aproximada da instalação"
                )
                
                coverage_area = st.text_input(
                    "Área de Cobertura", 
                    placeholder="Ex: 1200m² / Todos os andares",
                    help="Área aproximada ou setores cobertos pelo sistema"
                )
                
                # Observações adicionais
                additional_info = st.text_area(
                    "Observações/Especificações Técnicas",
                    placeholder="Ex: Sistema integrado com sprinklers, número de detectores, etc."
                )
                
                # Botão para submeter o formulário
                submit_register = st.form_submit_button("➕ Cadastrar Sistema", type="primary", use_container_width=True)
                
                if submit_register:
                    # Validação básica
                    if not new_id or not new_location:
                        st.error("Os campos 'ID do Sistema' e 'Localização' são obrigatórios.")
                    else:
                        # Salva o sistema no inventário
                        with st.spinner("Cadastrando novo sistema..."):
                            if save_new_alarm_system(new_id, new_location, new_brand, new_model):
                                st.success(f"Sistema de alarme '{new_id}' cadastrado com sucesso!")
                                
                                # Exibe as informações adicionais se fornecidas
                                if additional_info:
                                    st.info(f"Observações registradas: {additional_info}")
                                    
                                # Limpa o cache de dados
                                st.cache_data.clear()

    # Aba de Cadastro Rápido
    with tab_quick_register:
        st.header("Cadastro Rápido de Sistema")
        
        # Verifica permissões de edição
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novos sistemas.")
        else:
            st.info("Use este formulário simplificado para cadastrar rapidamente um sistema de alarme com informações básicas.")
            
            with st.form("quick_alarm_form", clear_on_submit=True):
                st.subheader("Dados Essenciais")
                
                # Campos básicos
                quick_id = st.text_input("ID do Sistema*", placeholder="AL-001")
                quick_location = st.text_input("Localização*", placeholder="Prédio Principal - Andar 1")
                
                # Tipo de sistema
                st.markdown("**Tipo de Sistema:**")
                system_type = st.radio(
                    "Selecione o tipo",
                    ["Convencional", "Endereçável", "Sem Fio"],
                    horizontal=True
                )
                
                # Marca com opções pré-definidas
                quick_brand = st.selectbox(
                    "Marca (opcional)", 
                    ["", "Siemens", "Honeywell", "Johnson Controls", "Bosch", "Tyco", "MSA", "OUTRO"],
                    index=0
                )
                
                # Campo para marca personalizada
                if quick_brand == "OUTRO":
                    custom_brand = st.text_input("Digite a marca:")
                    final_brand = custom_brand
                else:
                    final_brand = quick_brand
                
                # Botão para submeter o formulário
                quick_submit = st.form_submit_button("Cadastrar Rápido", type="primary", use_container_width=True)
                
                if quick_submit:
                    # Validação básica
                    if not quick_id or not quick_location:
                        st.error("ID e Localização são obrigatórios.")
                    else:
                        # Salva o sistema no inventário
                        with st.spinner("Cadastrando..."):
                            if save_new_alarm_system(quick_id, quick_location, final_brand, system_type):
                                st.success(f"Sistema '{quick_id}' cadastrado rapidamente!")
                                st.balloons()
                                st.cache_data.clear()
                            else:
                                st.error("Erro ao cadastrar. Verifique se o ID já não existe.")
