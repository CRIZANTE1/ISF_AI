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
from utils.auditoria import get_sao_paulo_time_str 
from datetime import datetime

set_page_config()

def show_page():
    st.title("💨 Gestão de Detectores Multigás")

    # Check if user has at least viewer permissions
    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return

    tab_inspection, tab_calibration, tab_register, tab_manual = st.tabs([
        "📋 Registrar Teste de Resposta", 
        "📄 Registrar Calibração Anual (PDF)",
        "➕ Cadastrar Novo Detector",
        "📝 Cadastro Manual"
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
                        pdf_name = f"Certificado_Multigas_{inspection_record['numero_certificado']}_{inspection_record['id_equip
