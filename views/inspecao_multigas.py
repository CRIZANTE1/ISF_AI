import streamlit as st
import pandas as pd
import sys
import os
import json  
from datetime import datetime
from streamlit_js_eval import streamlit_js_eval 
import numpy as np


sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from operations.history import load_sheet_data
from operations.multigas_operations import (
    save_new_multigas_detector, 
    save_multigas_inspection, 
    process_calibration_pdf_analysis,
    verify_bump_test,
    update_cylinder_values
)
from gdrive.config import MULTIGAS_INVENTORY_SHEET_NAME, MULTIGAS_INSPECTIONS_SHEET_NAME
from gdrive.gdrive_upload import GoogleDriveUploader
from auth.auth_utils import (
    get_user_display_name, 
    check_user_access, 
    can_edit,
    has_ai_features
)
from config.page_config import set_page_config
from reports.multigas_report import generate_bump_test_html
from utils.auditoria import get_sao_paulo_time_str, log_action 
from datetime import datetime, date

set_page_config()

def show_page():
    st.title("💨 Gestão de Detectores Multigás")

    # Check if user has at least viewer permissions
    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return

    tab_inspection, tab_calibration, tab_register, tab_manual_register = st.tabs([
        "📋 Registrar Teste de Resposta", 
        "📄 Registrar Calibração Anual (PDF)",
        "➕ Cadastrar Novo Detector",
        "✍️ Cadastro Manual de Detector"  # Nova aba adicionada
    ])

    with tab_calibration:
        st.header("Registrar Calibração Anual com IA")
        
        # Check for AI features for this tab
        if not has_ai_features():
            st.info("✨ **Este recurso de IA** está disponível no plano **Premium IA**. Faça o upgrade para automatizar seu trabalho!", icon="🚀")
        else:
            st.info("Faça o upload do Certificado de Calibração. O sistema irá extrair os dados e, se o detector for novo, permitirá o cadastro antes de salvar.")
            
            st.session_state.setdefault('calib_step', 'start')
            st.session_state.setdefault('calib_data', None)
            st.session_state.setdefault('calib_status', None)
            st.session_state.setdefault('calib_uploaded_pdf', None)

            uploaded_pdf = st.file_uploader("Escolha o certificado PDF", type=["pdf"], key="calib_pdf_uploader")
            
            if uploaded_pdf and st.button("🔎 Analisar Certificado com IA"):
                st.session_state.calib_uploaded_pdf = uploaded_pdf
                with st.spinner("Analisando o documento..."):
                    calib_data, status = process_calibration_pdf_analysis(st.session_state.calib_uploaded_pdf)
                    if status != "error":
                        st.session_state.calib_data = calib_data
                        st.session_state.calib_status = status
                        st.session_state.calib_step = 'confirm'
                        st.rerun()

            if st.session_state.calib_step == 'confirm':
                st.subheader("Confira os Dados Extraídos")
                
                calib_data = st.session_state.calib_data
                
                # Se for um novo detector, mostra o campo para editar o ID
                if st.session_state.calib_status == 'new_detector':
                    st.info(f"Detector com S/N {calib_data['numero_serie']} não encontrado. Ele será cadastrado com os dados abaixo.")
                    new_id = st.text_input("Confirme ou edite o ID do novo equipamento:", value=calib_data['id_equipamento'])
                    # Atualiza o ID nos dados em tempo real
                    st.session_state.calib_data['id_equipamento'] = new_id

                # Monta o registro de inspeção a partir dos dados extraídos
                results = calib_data.get('resultados_detalhados', {})
                inspection_record = {
                    "id_equipamento": calib_data.get('id_equipamento'),
                    "numero_certificado": calib_data.get('numero_certificado'),
                    "data_teste": calib_data.get('data_calibracao'),
                    "proxima_calibracao": calib_data.get('proxima_calibracao'),
                    "resultado_teste": calib_data.get('resultado_geral'),
                    "tipo_teste": "Calibração Anual",
                    "LEL_encontrado": results.get('LEL', {}).get('medido'),
                    "O2_encontrado": results.get('O2', {}).get('medido'),
                    "H2S_encontrado": results.get('H2S', {}).get('medido'),
                    "CO_encontrado": results.get('CO', {}).get('medido'),
                    "responsavel_nome": calib_data.get('tecnico_responsavel'),
                }
                st.dataframe(pd.DataFrame([inspection_record]))

                if st.button("💾 Confirmar e Salvar", width='stretch', type="primary"):
                    with st.spinner("Salvando..."):
                        # Se for novo, primeiro cadastra
                        if st.session_state.calib_status == 'new_detector':
                            if not save_new_multigas_detector(
                                detector_id=st.session_state.calib_data['id_equipamento'],
                                brand=calib_data.get('marca'),
                                model=calib_data.get('modelo'),
                                serial_number=calib_data.get('numero_serie'),
                                cylinder_values={} # Valores do cilindro ficam vazios para preenchimento manual
                            ):
                                st.stop() # Interrompe se o cadastro falhar
                            st.success(f"Novo detector '{st.session_state.calib_data['id_equipamento']}' cadastrado!")

                        # Upload do PDF
                        uploader = GoogleDriveUploader()
                        pdf_name = f"Certificado_Multigas_{inspection_record['numero_certificado']}_{inspection_record['id_equipamento']}.pdf"
                        pdf_link = uploader.upload_file(st.session_state.calib_uploaded_pdf, novo_nome=pdf_name)
                        
                        if pdf_link:
                            inspection_record['link_certificado'] = pdf_link
                        else:
                            st.error("Falha ao fazer upload do certificado. O registro não foi salvo.")
                            st.stop()

                        if save_multigas_inspection(inspection_record):
                            st.success("Registro de calibração salvo com sucesso!")
                            st.balloons()
                            # Limpar estado
                            st.session_state.calib_step = 'start'
                            st.session_state.calib_data = None
                            st.session_state.calib_status = None
                            st.session_state.calib_uploaded_pdf = None
                            st.cache_data.clear()
                            st.rerun()

    with tab_inspection:
        st.header("Registrar Teste de Resposta (Bump Test)")
        
        # Check for edit permission for this functionality
        if not can_edit():
            st.warning("Você precisa de permissões de edição para registrar testes de resposta.")
        else:
            # --- INÍCIO DA SEÇÃO DE RELATÓRIO MENSAL (MODIFICADA) ---
            with st.expander("📄 Gerar Relatório Mensal de Bump Tests"):
                df_inspections_full = load_sheet_data(MULTIGAS_INSPECTIONS_SHEET_NAME)
                df_inventory_full = load_sheet_data(MULTIGAS_INVENTORY_SHEET_NAME)
                
                if df_inspections_full.empty:
                    st.info("Nenhum teste de resposta registrado no sistema para gerar relatórios.")
                else:
                    # Converte a coluna de data para o formato datetime para permitir a filtragem
                    df_inspections_full['data_teste_dt'] = pd.to_datetime(df_inspections_full['data_teste'], errors='coerce')

                    # Filtros para mês e ano
                    now_str = get_sao_paulo_time_str()
                    today_sao_paulo = datetime.strptime(now_str, '%Y-%m-%d %H:%M:%S')
                    col1, col2 = st.columns(2)
                    
                    with col1:
                        years_with_data = sorted(df_inspections_full['data_teste_dt'].dt.year.unique(), reverse=True)
                        if not years_with_data:
                            years_with_data = [today_sao_paulo.year]
                        selected_year = st.selectbox("Selecione o Ano:", years_with_data, key="multigas_report_year")
                    
                    with col2:
                        months = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"]
                        # Sugere o mês atual como padrão
                        default_month_index = today_sao_paulo.month - 1
                        selected_month_name = st.selectbox("Selecione o Mês:", months, index=default_month_index, key="multigas_report_month")
                    
                    selected_month_number = months.index(selected_month_name) + 1

                    # Filtra os dados pelo mês e ano selecionados
                    tests_selected_month = df_inspections_full[
                        (df_inspections_full['data_teste_dt'].dt.year == selected_year) &
                        (df_inspections_full['data_teste_dt'].dt.month == selected_month_number) &
                        (df_inspections_full['tipo_teste'] != 'Calibração Anual')
                    ].sort_values(by='data_teste_dt')

                    if tests_selected_month.empty:
                        st.info(f"Nenhum teste de resposta foi registrado em {selected_month_name} de {selected_year}.")
                    else:
                        st.write(f"Encontrados {len(tests_selected_month)} testes em {selected_month_name}/{selected_year}. Clique abaixo para gerar o relatório.")
                        if st.button("Gerar e Imprimir Relatório do Mês", width='stretch', type="primary"):
                            unit_name = st.session_state.get('current_unit_name', 'N/A')
                            report_html = generate_bump_test_html(tests_selected_month, df_inventory_full, unit_name)
                            
                            js_code = f"""
                                const reportHtml = {json.dumps(report_html)};
                                const printWindow = window.open('', '_blank');
                                if (printWindow) {{
                                    printWindow.document.write(reportHtml);
                                    printWindow.document.close();
                                    printWindow.focus();
                                    setTimeout(() => {{ printWindow.print(); printWindow.close(); }}, 500);
                                }} else {{
                                    alert('Por favor, desabilite o bloqueador de pop-ups para este site.');
                                }}
                            """
                            streamlit_js_eval(js_expressions=js_code, key="print_monthly_bump_test_js")
                            st.success("Relatório enviado para impressão!")
            st.markdown("---")
            # --- FIM DA SEÇÃO DE RELATÓRIO ---

            df_inventory = load_sheet_data(MULTIGAS_INVENTORY_SHEET_NAME)

            if df_inventory.empty:
                st.warning("Nenhum detector cadastrado. Vá para a aba 'Cadastrar Novo Detector' para começar.")
            else:
                detector_options = ["Selecione um detector..."] + df_inventory['id_equipamento'].tolist()
                selected_id = st.selectbox("Selecione o Equipamento", detector_options)

                if selected_id != "Selecione um detector...":
                    detector_info = df_inventory[df_inventory['id_equipamento'] == selected_id].iloc[0]
                    
                    st.subheader("Dados do Equipamento Selecionado")
                    c1, c2, c3 = st.columns(3)
                    c1.metric("Marca", detector_info.get('marca', 'N/A'))
                    c2.metric("Modelo", detector_info.get('modelo', 'N/A'))
                    c3.metric("Nº Série", detector_info.get('numero_serie', 'N/A'))

                    st.subheader("Valores de Referência do Cilindro (atuais)")
                    c4, c5, c6, c7 = st.columns(4)
                    c4.metric("LEL (% LEL)", f"{detector_info.get('LEL_cilindro', 0)}")
                    c5.metric("O² (% Vol)", f"{detector_info.get('O2_cilindro', 0)}")
                    c6.metric("H²S (ppm)", f"{detector_info.get('H2S_cilindro', 0)}")
                    c7.metric("CO (ppm)", f"{detector_info.get('CO_cilindro', 0)}")

                    with st.form(f"inspection_form_{selected_id}", clear_on_submit=True):
                        st.markdown("---")
                        
                        if st.toggle("Atualizar valores de referência do cilindro?"):
                            st.warning("Os novos valores informados abaixo serão salvos permanentemente para este detector.")
                            st.subheader("Novos Valores de Referência do Cilindro")
                            nc1, nc2, nc3, nc4 = st.columns(4)
                            new_lel_cylinder = nc1.number_input("LEL (% LEL)", step=0.1, format="%.1f", key="new_lel", value=float(detector_info.get('LEL_cilindro', 0)))
                            new_o2_cylinder = nc2.number_input("O² (% Vol)", step=0.1, format="%.1f", key="new_o2", value=float(detector_info.get('O2_cilindro', 0)))
                            new_h2s_cylinder = nc3.number_input("H²S (ppm)", step=1, key="new_h2s", value=int(detector_info.get('H2S_cilindro', 0)))
                            new_co_cylinder = nc4.number_input("CO (ppm)", step=1, key="new_co", value=int(detector_info.get('CO_cilindro', 0)))

                        st.subheader("Registro do Teste")
                        
                        now_str = get_sao_paulo_time_str()
                        now_dt = datetime.strptime(now_str, '%Y-%m-%d %H:%M:%S')
                        
                        c8, c9 = st.columns(2)
                        test_date = c8.date_input("Data do Teste", value=now_dt.date())
                        test_time = c9.time_input("Hora do Teste", value=now_dt.time())

                        st.write("**Valores Encontrados no Teste:**")
                        c10, c11, c12, c13 = st.columns(4)
                        lel_found = c10.text_input("LEL")
                        o2_found = c11.text_input("O²")
                        h2s_found = c12.text_input("H²S")
                        co_found = c13.text_input("CO")
                        
                        test_type = st.radio("Tipo de Teste", ["Periódico", "Extraordinário"], horizontal=True)

                        st.subheader("Responsável pelo Teste")
                        c16, c17 = st.columns(2)
                        resp_name = c16.text_input("Nome", value=get_user_display_name())
                        resp_id = c17.text_input("Matrícula")

                        submit_insp = st.form_submit_button("💾 Salvar Teste", width='stretch')
                        
                        if submit_insp:
                            # Pega os valores de referência corretos (os atuais ou os novos, se o toggle estiver ativo)
                            reference_values = {
                                'LEL': st.session_state.new_lel if 'new_lel' in st.session_state else detector_info.get('LEL_cilindro'),
                                'O2': st.session_state.new_o2 if 'new_o2' in st.session_state else detector_info.get('O2_cilindro'),
                                'H2S': st.session_state.new_h2s if 'new_h2s' in st.session_state else detector_info.get('H2S_cilindro'),
                                'CO': st.session_state.new_co if 'new_co' in st.session_state else detector_info.get('CO_cilindro')
                            }
                            found_values = {
                                'LEL': lel_found, 'O2': o2_found,
                                'H2S': h2s_found, 'CO': co_found
                            }

                            # Chama a função de verificação
                            auto_result, auto_observation = verify_bump_test(reference_values, found_values)

                            # Exibe o resultado automático para o usuário antes de salvar
                            st.subheader("Resultado da Verificação Automática")
                            if auto_result == "Aprovado":
                                st.success(f"✔️ **Resultado:** {auto_result}")
                            else:
                                st.error(f"❌ **Resultado:** {auto_result}")
                            st.info(f"**Observações Geradas:** {auto_observation}")
                            
                            # Se o toggle de atualização estiver ativo, atualiza os valores no inventário
                            if 'new_lel' in st.session_state:
                                if update_cylinder_values(selected_id, reference_values):
                                    st.success("Valores de referência do cilindro atualizados com sucesso!")
                                else:
                                    st.error("Falha ao atualizar valores de referência. O teste não foi salvo.")
                                    st.stop() # Interrompe se a atualização falhar
                            
                            inspection_data = {
                                "data_teste": test_date.isoformat(),
                                "hora_teste": test_time.strftime("%H:%M:%S"),
                                "id_equipamento": selected_id,
                                "LEL_encontrado": lel_found, "O2_encontrado": o2_found,
                                "H2S_encontrado": h2s_found, "CO_encontrado": co_found,
                                "tipo_teste": test_type, 
                                "resultado_teste": auto_result,
                                "observacoes": auto_observation,
                                "responsavel_nome": resp_name, 
                                "responsavel_matricula": resp_id
                            }
                            
                            with st.spinner("Salvando o registro..."):
                                if save_multigas_inspection(inspection_data):
                                    st.success(f"Teste para o detector '{selected_id}' salvo com sucesso!")
                                    st.cache_data.clear()
                                    # Limpa as chaves para resetar o toggle e os inputs
                                    keys_to_clear = ['new_lel', 'new_o2', 'new_h2s', 'new_co']
                                    for key in keys_to_clear:
                                        if key in st.session_state:
                                            del st.session_state[key]
    
    with tab_register:
        st.header("Cadastrar Novo Detector")
        
        # Check for edit permission for this functionality
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novos detectores.")
        else:
            st.info("Este formulário permite adicionar um novo detector multigás com informações completas.")
            
            with st.form("new_detector_form", clear_on_submit=True):
                st.subheader("Dados do Equipamento")
                
                col1, col2, col3 = st.columns(3)
                detector_id = col1.text_input("ID do Equipamento (Obrigatório)*", 
                                              help="Código de identificação único, ex: MG-001")
                brand = col2.text_input("Marca")
                model = col3.text_input("Modelo")
                
                serial_number = st.text_input("Número de Série (Obrigatório)*")
                
                st.subheader("Valores do Cilindro de Gás")
                st.info("Estes são os valores de referência do cilindro de gás padrão utilizado nos testes.")
                
                col4, col5, col6, col7 = st.columns(4)
                lel_cyl = col4.number_input("LEL (% LEL)", min_value=0.0, value=50.0, step=0.1, format="%.1f")
                o2_cyl = col5.number_input("O² (% Vol)", min_value=0.0, value=18.0, step=0.1, format="%.1f")
                h2s_cyl = col6.number_input("H²S (ppm)", min_value=0, value=25, step=1)
                co_cyl = col7.number_input("CO (ppm)", min_value=0, value=100, step=1)
                
                submitted = st.form_submit_button("Cadastrar Detector", type="primary", use_container_width=True)
                
                if submitted:
                    if not detector_id or not serial_number:
                        st.error("Os campos 'ID do Equipamento' e 'Número de Série' são obrigatórios.")
                    else:
                        cylinder_values = {
                            'LEL': lel_cyl,
                            'O2': o2_cyl,
                            'H2S': h2s_cyl,
                            'CO': co_cyl
                        }
                        
                        if save_new_multigas_detector(detector_id, brand, model, serial_number, cylinder_values):
                            st.success(f"Detector '{detector_id}' cadastrado com sucesso!")
                            st.balloons()
                            st.cache_data.clear()

    # Nova aba para cadastro manual simplificado
    with tab_manual_register:
        st.header("Cadastro Manual Simplificado")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar equipamentos.")
        else:
            st.info("Use este formulário simplificado para cadastrar rapidamente um detector multigás, com valores padrão de cilindro.")
            
            with st.form("simple_detector_form", clear_on_submit=True):
                st.subheader("Dados Básicos do Detector")
                
                col1, col2 = st.columns(2)
                simple_id = col1.text_input("ID do Detector (Obrigatório)*", placeholder="MG-001")
                simple_serial = col2.text_input("Número de Série (Obrigatório)*")
                
                col3, col4 = st.columns(2)
                simple_brand = col3.text_input("Marca", value="BW Technologies")
                simple_model = col4.text_input("Modelo", value="GasAlert Max XT II")
                
                st.info("Valores padrão do cilindro serão configurados automaticamente: LEL (50%), O² (18%), H²S (25 ppm), CO (100 ppm)")
                
                simple_submit = st.form_submit_button("Cadastrar Rápido", type="primary", use_container_width=True)
                
                if simple_submit:
                    if not simple_id or not simple_serial:
                        st.error("Os campos 'ID do Detector' e 'Número de Série' são obrigatórios.")
                    else:
                        # Valores padrão para o cilindro
                        default_cylinder = {
                            'LEL': 50.0,
                            'O2': 18.0,
                            'H2S': 25,
                            'CO': 100
                        }
                        
                        if save_new_multigas_detector(simple_id, simple_brand, simple_model, simple_serial, default_cylinder):
                            st.success(f"Detector '{simple_id}' cadastrado com sucesso com valores padrão de cilindro!")
                            st.cache_data.clear()
