import streamlit as st
import pandas as pd
from datetime import date
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import MULTIGAS_INVENTORY_SHEET_NAME, MULTIGAS_INSPECTIONS_SHEET_NAME
from utils.auditoria import log_action

def save_new_multigas_detector(detector_id, brand, model, serial_number, cylinder_values):
    """Salva um novo detector multigás no inventário, incluindo os valores do cilindro de calibração."""
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
            cylinder_values['LEL'], cylinder_values['O2'],
            cylinder_values['H2S'], cylinder_values['CO']
        ]
        uploader.append_data_to_sheet(MULTIGAS_INVENTORY_SHEET_NAME, [data_row])
        log_action("CADASTROU_MULTIGAS", f"ID: {detector_id}, S/N: {serial_number}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo detector: {e}")
        return False

def save_multigas_inspection(data):
    """Salva um novo registro de teste de resposta (bump test) de um detector multigás."""
    try:
        uploader = GoogleDriveUploader()
        data_row = [
            data['data_teste'], data['hora_teste'], data['id_equipamento'],
            data['LEL_encontrado'], data['O2_encontrado'], data['H2S_encontrado'], data['CO_encontrado'],
            data['tipo_teste'], data['resultado_teste'],
            data['responsavel_nome'], data['responsavel_matricula']
        ]
        uploader.append_data_to_sheet(MULTIGAS_INSPECTIONS_SHEET_NAME, [data_row])
        log_action("SALVOU_INSPECAO_MULTIGAS", f"ID: {data['id_equipamento']}, Resultado: {data['resultado_teste']}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inspeção: {e}")
        return False
