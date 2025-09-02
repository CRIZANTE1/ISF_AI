# FILE: views/inspecao_multigas.py (VERSÃO CORRIGIDA)

import streamlit as st
import pandas as pd
import sys
import os
from datetime import datetime

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from operations.history import load_sheet_data
from operations.multigas_operations import save_new_multigas_detector, save_multigas_inspection, process_calibration_pdf, update_cylinder_values
from gdrive.config import MULTIGAS_INVENTORY_SHEET_NAME
from gdrive.gdrive_upload import GoogleDriveUploader
from auth.auth_utils import get_user_display_name
from config.page_config import set_page_config

set_page_config()

def show_page():
    st.title("💨 Gestão de Detectores Multigás")

    tab_inspection, tab_calibration, tab_register = st.tabs([
        "📋 Registrar Teste de Resposta", 
        "📄 Registrar Calibração Anual (PDF)", 
        "➕ Cadastrar Novo Detector"
    ])

    with tab_calibration:
        st.header("Registrar Calibração Anual com IA")
        st.info("Faça o upload do Certificado de Calibração em PDF. O sistema irá extrair os dados, salvar o registro e, se o detector não existir, irá cadastrá-lo automaticamente.")
        
        st.session_state.setdefault('calib_step', 'start')
        st.session_state.setdefault('calib_processed_data', None)
        st.session_state.setdefault('calib_uploaded_pdf', None)

        uploaded_pdf = st.file_uploader("Escolha o certificado PDF", type=["pdf"], key="calib_pdf_uploader")
        if uploaded_pdf:
            st.session_state.calib_uploaded_pdf = uploaded_pdf
        
        if st.session_state.calib_uploaded_pdf and st.button("🔎 Analisar Certificado com IA"):
            with st.spinner("Analisando o documento..."):
                inspection_record, calib_data = process_calibration_pdf(st.session_state.calib_uploaded_pdf)
                if inspection_record:
                    st.session_state.calib_processed_data = inspection_record
                    st.session_state.calib_step = 'confirm'
                    st.rerun()

        if st.session_state.calib_step == 'confirm' and st.session_state.calib_processed_data:
            st.subheader("Confira os Dados Extraídos e Salve")
            st.dataframe(pd.DataFrame([st.session_state.calib_processed_data]))

            if st.button("💾 Confirmar e Salvar Registro", width='stretch', type="primary"):
                with st.spinner("Salvando..."):
                    record_to_save = st.session_state.calib_processed_data
                    
                    uploader = GoogleDriveUploader()
                    pdf_name = f"Certificado_Multigas_{record_to_save.get('numero_certificado', 'S-N')}_{record_to_save['id_equipamento']}.pdf"
                    pdf_link = uploader.upload_file(st.session_state.calib_uploaded_pdf, novo_nome=pdf_name)
                    
                    if not pdf_link:
                        st.error("Falha ao fazer upload do certificado. O registro não foi salvo.")
                        st.stop()
                    
                    record_to_save['link_certificado'] = pdf_link

                    if save_multigas_inspection(record_to_save):
                        st.success("Registro de calibração salvo com sucesso!")
                        st.balloons()
                        st.session_state.calib_step = 'start'
                        st.session_state.calib_processed_data = None
                        st.session_state.calib_uploaded_pdf = None
                        st.cache_data.clear()
                        st.rerun()

    with tab_inspection:
        st.header("Registrar Teste de Resposta (Bump Test)")
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

                with st.form(f"inspection_form_{selected_id}", clear_on_submit=False): # clear_on_submit=False para manter o toggle
                    st.markdown("---")
                    
                    # --- INÍCIO DA ALTERAÇÃO ---
                    if st.toggle("Atualizar valores de referência do cilindro?"):
                        st.warning("Os novos valores informados abaixo serão salvos permanentemente para este detector.")
                        st.subheader("Novos Valores de Referência do Cilindro")
                        nc1, nc2, nc3, nc4 = st.columns(4)
                        new_lel_cylinder = nc1.number_input("LEL (% LEL)", step=0.1, format="%.1f", key="new_lel")
                        new_o2_cylinder = nc2.number_input("O² (% Vol)", step=0.1, format="%.1f", key="new_o2")
                        new_h2s_cylinder = nc3.number_input("H²S (ppm)", step=1, key="new_h2s")
                        new_co_cylinder = nc4.number_input("CO (ppm)", step=1, key="new_co")
                    # --- FIM DA ALTERAÇÃO ---

                    st.subheader("Registro do Teste")
                    c8, c9 = st.columns(2)
                    test_date = c8.date_input("Data do Teste", value=datetime.now())
                    test_time = c9.time_input("Hora do Teste", value=datetime.now().time())

                    st.write("**Valores Encontrados no Teste:**")
                    c10, c11, c12, c13 = st.columns(4)
                    lel_found = c10.text_input("LEL")
                    o2_found = c11.text_input("O²")
                    h2s_found = c12.text_input("H²S")
                    co_found = c13.text_input("CO")
                    
                    c14, c15 = st.columns(2)
                    test_type = c14.radio("Tipo de Teste", ["Periódico", "Extraordinário"], horizontal=True)
                    test_result = c15.radio("Resultado do Teste", ["Aprovado", "Reprovado"], horizontal=True)

                    st.subheader("Responsável pelo Teste")
                    c16, c17 = st.columns(2)
                    resp_name = c16.text_input("Nome", value=get_user_display_name())
                    resp_id = c17.text_input("Matrícula")

                    submit_insp = st.form_submit_button("💾 Salvar Teste", width='stretch')
                    if submit_insp:
                        # --- INÍCIO DA ALTERAÇÃO ---
                        # Se o toggle de atualização estiver ativo, primeiro atualiza os valores
                        if 'new_lel' in st.session_state and st.session_state.new_lel is not None:
                            new_values = {
                                "LEL": st.session_state.new_lel, "O2": st.session_state.new_o2,
                                "H2S": st.session_state.new_h2s, "CO": st.session_state.new_co
                            }
                            if not update_cylinder_values(selected_id, new_values):
                                st.error("Falha ao atualizar valores de referência. O teste não foi salvo.")
                                st.stop() # Interrompe se a atualização falhar
                            
                            st.success("Valores de referência do cilindro atualizados com sucesso!")
                        # --- FIM DA ALTERAÇÃO ---
                        
                        inspection_data = {
                            "data_teste": test_date.isoformat(),
                            "hora_teste": test_time.strftime("%H:%M:%S"),
                            "id_equipamento": selected_id,
                            "LEL_encontrado": lel_found, "O2_encontrado": o2_found,
                            "H2S_encontrado": h2s_found, "CO_encontrado": co_found,
                            "tipo_teste": test_type, "resultado_teste": test_result,
                            "responsavel_nome": resp_name, "responsavel_matricula": resp_id
                        }
                        if save_multigas_inspection(inspection_data):
                            st.success(f"Teste para o detector '{selected_id}' salvo com sucesso!")
                            st.cache_data.clear()
                            # Limpa as chaves para resetar o toggle e os inputs
                            keys_to_clear = ['new_lel', 'new_o2', 'new_h2s', 'new_co']
                            for key in keys_to_clear:
                                if key in st.session_state:
                                    del st.session_state[key]
                            st.rerun()

    # --- ABA DE CADASTRO MANUAL RESTAURADA ---
    with tab_register:
        st.header("Cadastrar Novo Detector Multigás")
        st.info("Cadastre o equipamento e os valores de referência do cilindro de gás utilizado para os testes de resposta (bump tests).")

        with st.form("new_detector_form", clear_on_submit=True):
            st.subheader("Dados do Equipamento")
            c1, c2 = st.columns(2)
            detector_id = c1.text_input("**ID do Equipamento (Obrigatório)**", help="Um código único para identificar o equipamento, ex: MG-01")
            serial_number = c2.text_input("**Nº de Série (Obrigatório)**")
            brand = c1.text_input("Marca")
            model = c2.text_input("Modelo")

            st.subheader("Valores de Referência do Cilindro de Calibração")
            c3, c4, c5, c6 = st.columns(4)
            lel_cylinder = c3.number_input("LEL (% LEL)", step=0.1, format="%.1f")
            o2_cylinder = c4.number_input("O² (% Vol)", step=0.1, format="%.1f")
            h2s_cylinder = c5.number_input("H²S (ppm)", step=1)
            co_cylinder = c6.number_input("CO (ppm)", step=1)

            submitted = st.form_submit_button("➕ Cadastrar Detector", width='stretch')
            if submitted:
                if not detector_id or not serial_number:
                    st.error("Os campos 'ID do Equipamento' e 'Nº de Série' são obrigatórios.")
                else:
                    cylinder_values = {
                        "LEL": lel_cylinder, "O2": o2_cylinder,
                        "H2S": h2s_cylinder, "CO": co_cylinder
                    }
                    if save_new_multigas_detector(detector_id, brand, model, serial_number, cylinder_values):
                        st.success(f"Detector '{detector_id}' cadastrado com sucesso!")
                        st.cache_data.clear()
