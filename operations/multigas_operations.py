import streamlit as st
import pandas as pd
from datetime import date
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import MULTIGAS_INVENTORY_SHEET_NAME, MULTIGAS_INSPECTIONS_SHEET_NAME
from utils.auditoria import log_action
from AI.api_Operation import PDFQA
from utils.prompts import get_multigas_calibration_prompt
from auth.auth_utils import get_user_display_name

def save_new_multigas_detector(detector_id, brand, model, serial_number, cylinder_values):
    """Salva um novo detector multigás no inventário."""
    try:
        uploader = GoogleDriveUploader()
        inventory_data = uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)
        if inventory_data and len(inventory_data) > 1:
            df = pd.DataFrame(inventory_data[1:], columns=inventory_data[0])
            if detector_id in df['id_equipamento'].values:
                st.error(f"Erro: O ID de equipamento '{detector_id}' já está cadastrado.")
                return False

        data_row = [
            detector_id, brand, model, serial_number, date.today().isoformat(),
            cylinder_values.get('LEL'), cylinder_values.get('O2'),
            cylinder_values.get('H2S'), cylinder_values.get('CO')
        ]
        uploader.append_data_to_sheet(MULTIGAS_INVENTORY_SHEET_NAME, [data_row])
        log_action("CADASTROU_MULTIGAS", f"ID: {detector_id}, S/N: {serial_number}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo detector: {e}")
        return False

def save_multigas_inspection(data):
    """Salva um novo registro de teste (bump test ou calibração)."""
    try:
        uploader = GoogleDriveUploader()
        # Garante que todos os campos esperados existam, preenchendo com None se ausentes
        data_row = [
            data.get('data_teste'), data.get('hora_teste'), data.get('id_equipamento'),
            data.get('LEL_encontrado'), data.get('O2_encontrado'), data.get('H2S_encontrado'), data.get('CO_encontrado'),
            data.get('tipo_teste'), data.get('resultado_teste'),
            data.get('responsavel_nome'), data.get('responsavel_matricula'),
            data.get('proxima_calibracao'), data.get('numero_certificado'), data.get('link_certificado')
        ]
        uploader.append_data_to_sheet(MULTIGAS_INSPECTIONS_SHEET_NAME, [data_row])
        log_action("SALVOU_INSPECAO_MULTIGAS", f"ID: {data.get('id_equipamento')}, Resultado: {data.get('resultado_teste')}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inspeção: {e}")
        return False

def process_calibration_pdf(pdf_file):
    """
    Processa um PDF de calibração, extrai dados com IA, verifica o inventário
    e cadastra o detector se ele não existir.
    """
    pdf_qa = PDFQA()
    prompt = get_multigas_calibration_prompt()
    extracted_data = pdf_qa.extract_structured_data(pdf_file, prompt)
    
    if not extracted_data or "calibracao" not in extracted_data:
        st.error("A IA não conseguiu extrair os dados do certificado no formato esperado.")
        st.json(extracted_data)
        return None, None

    calib_data = extracted_data["calibracao"]
    serial_number = calib_data.get('numero_serie')
    if not serial_number:
        st.error("Não foi possível identificar o Número de Série no certificado.")
        return None, None
        
    # Verifica se o detector já existe no inventário pelo N/S
    uploader = GoogleDriveUploader()
    inventory_data = uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)
    detector_id = None
    is_new = False
    
    if inventory_data and len(inventory_data) > 1:
        df_inventory = pd.DataFrame(inventory_data[1:], columns=inventory_data[0])
        existing_detector = df_inventory[df_inventory['numero_serie'] == serial_number]
        if not existing_detector.empty:
            detector_id = existing_detector.iloc[0]['id_equipamento']
        else:
            is_new = True
    else:
        is_new = True
        
    if is_new:
        # Gera um ID temporário/sugerido
        suger_id = f"MG-{serial_number[-4:]}"
        st.info(f"Detector com S/N {serial_number} não encontrado. Ele será cadastrado automaticamente.")
        detector_id = st.text_input("Confirme ou edite o ID para o novo equipamento:", suger_id)
        
        # Como não temos o cilindro, deixamos em branco por enquanto
        cylinder_values = {"LEL": None, "O2": None, "H2S": None, "CO": None}
        
        if save_new_multigas_detector(detector_id, calib_data.get('marca'), calib_data.get('modelo'), serial_number, cylinder_values):
            st.success(f"Novo detector com ID '{detector_id}' cadastrado com sucesso!")
        else:
            # Se o salvamento falhar (ex: ID duplicado), interrompe
            return None, None
            
    # Prepara os dados da inspeção para serem salvos
    results = calib_data.get('resultados_detalhados', {})
    inspection_record = {
        "data_teste": calib_data.get('data_calibracao'),
        "hora_teste": None,
        "id_equipamento": detector_id,
        "LEL_encontrado": results.get('LEL', {}).get('medido'),
        "O2_encontrado": results.get('O2', {}).get('medido'),
        "H2S_encontrado": results.get('H2S', {}).get('medido'),
        "CO_encontrado": results.get('CO', {}).get('medido'),
        "tipo_teste": "Calibração Anual",
        "resultado_teste": calib_data.get('resultado_geral'),
        "responsavel_nome": calib_data.get('tecnico_responsavel'),
        "responsavel_matricula": calib_data.get('empresa_executante'),
        "proxima_calibracao": calib_data.get('proxima_calibracao'),
        "numero_certificado": calib_data.get('numero_certificado'),
        "link_certificado": None # O link será adicionado depois
    }
    
    return inspection_record, calib_data
