import streamlit as st
import pandas as pd
import numpy as np
from datetime import date
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import MULTIGAS_INVENTORY_SHEET_NAME, MULTIGAS_INSPECTIONS_SHEET_NAME
from utils.auditoria import log_action
from AI.api_Operation import PDFQA
from utils.prompts import get_multigas_calibration_prompt

def to_safe_cell(value):
    """Converte None ou NaN para string vazia para garantir a escrita correta na planilha."""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return ''
    return value

def save_new_multigas_detector(detector_id, brand, model, serial_number, cylinder_values):
    """Salva um novo detector multigás no inventário, tratando valores nulos."""
    try:
        uploader = GoogleDriveUploader()
        inventory_data = uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)

        expected_columns = 9
        if inventory_data and len(inventory_data[0]) != expected_columns:
            st.error(f"Erro de Configuração: O cabeçalho da planilha 'multigas_inventario' tem {len(inventory_data[0])} colunas, mas o sistema espera {expected_columns}. Por favor, corrija os cabeçalhos.")
            return False

        if inventory_data and len(inventory_data) > 1:
            headers = inventory_data[0]
            rows = [row for row in inventory_data[1:] if any(cell for cell in row)]
            if rows:
                df_inv = pd.DataFrame(rows, columns=headers)
                if detector_id in df_inv['id_equipamento'].values:
                    st.error(f"Erro: O ID de equipamento '{detector_id}' já existe.")
                    return False
        
        data_row = [
            to_safe_cell(detector_id),
            to_safe_cell(brand),
            to_safe_cell(model),
            to_safe_cell(serial_number),
            to_safe_cell(date.today().isoformat()),
            to_safe_cell(cylinder_values.get('LEL')),
            to_safe_cell(cylinder_values.get('O2')),
            to_safe_cell(cylinder_values.get('H2S')),
            to_safe_cell(cylinder_values.get('CO'))
        ]
        
        uploader.append_data_to_sheet(MULTIGAS_INVENTORY_SHEET_NAME, [data_row])
        log_action("CADASTROU_MULTIGAS", f"ID: {detector_id}, S/N: {serial_number}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo detector: {e}")
        return False

def save_multigas_inspection(data):
    """Salva um novo registro de teste (bump test ou calibração), tratando valores nulos."""
    try:
        uploader = GoogleDriveUploader()
        
        data_row = [
            to_safe_cell(data.get('data_teste')),
            to_safe_cell(data.get('hora_teste')),
            to_safe_cell(data.get('id_equipamento')),
            to_safe_cell(data.get('LEL_encontrado')),
            to_safe_cell(data.get('O2_encontrado')),
            to_safe_cell(data.get('H2S_encontrado')),
            to_safe_cell(data.get('CO_encontrado')),
            to_safe_cell(data.get('tipo_teste')),
            to_safe_cell(data.get('resultado_teste')),
            to_safe_cell(data.get('responsavel_nome')),
            to_safe_cell(data.get('responsavel_matricula')),
            to_safe_cell(data.get('proxima_calibracao')),
            to_safe_cell(data.get('numero_certificado')),
            to_safe_cell(data.get('link_certificado'))
        ]
        
        uploader.append_data_to_sheet(MULTIGAS_INSPECTIONS_SHEET_NAME, [data_row])
        log_action("SALVOU_INSPECAO_MULTIGAS", f"ID: {data.get('id_equipamento')}, Resultado: {data.get('resultado_teste')}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inspeção: {e}")
        return False

def process_calibration_pdf_analysis(pdf_file):
    """
    Analisa o PDF, extrai dados e verifica a existência do detector.
    """
    pdf_qa = PDFQA()
    prompt = get_multigas_calibration_prompt()
    extracted_data = pdf_qa.extract_structured_data(pdf_file, prompt)
    
    if not extracted_data or "calibracao" not in extracted_data:
        st.error("A IA não conseguiu extrair os dados do certificado no formato esperado.")
        st.json(extracted_data)
        return None, "error"

    calib_data = extracted_data["calibracao"]
    serial_number = calib_data.get('numero_serie')
    if not serial_number:
        st.error("Não foi possível identificar o Número de Série no certificado.")
        return None, "error"
        
    uploader = GoogleDriveUploader()
    inventory_data = uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)
    detector_id = None
    status = "new_detector"
    
    if inventory_data and len(inventory_data) > 1:
        headers = inventory_data[0]
        rows = inventory_data[1:]
        num_columns = len(headers)
        cleaned_rows = []
        for row in rows:
            if any(cell for cell in row):
                row.extend([None] * (num_columns - len(row)))
                cleaned_rows.append(row[:num_columns])
        
        if cleaned_rows:
            df_inventory = pd.DataFrame(cleaned_rows, columns=headers)
            existing_detector = df_inventory[df_inventory['numero_serie'] == serial_number]
            if not existing_detector.empty:
                detector_id = existing_detector.iloc[0]['id_equipamento']
                status = "exists"
    
    if status == "exists":
        calib_data['id_equipamento'] = detector_id
    else:
        calib_data['id_equipamento'] = f"MG-{serial_number[-4:]}"

    return calib_data, status

def update_cylinder_values(detector_id, new_cylinder_values):
    """
    Atualiza os valores de referência do cilindro para um detector específico no inventário.
    """
    try:
        uploader = GoogleDriveUploader()
        inventory_data = uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)
        
        if not inventory_data or len(inventory_data) < 2:
            st.error("Inventário de detectores não encontrado ou vazio. Não foi possível atualizar.")
            return False

        df_inventory = pd.DataFrame(inventory_data[1:], columns=inventory_data[0])
        
        target_indices = df_inventory.index[df_inventory['id_equipamento'] == detector_id].tolist()
        
        if not target_indices:
            st.error(f"Detector com ID '{detector_id}' não encontrado no inventário.")
            return False
            
        row_index = target_indices[0]
        sheet_row_index = row_index + 2
        range_to_update = f"F{sheet_row_index}:I{sheet_row_index}"
        
        values_to_update = [[
            to_safe_cell(new_cylinder_values['LEL']),
            to_safe_cell(new_cylinder_values['O2']),
            to_safe_cell(new_cylinder_values['H2S']),
            to_safe_cell(new_cylinder_values['CO'])
        ]]

        uploader.update_cells(MULTIGAS_INVENTORY_SHEET_NAME, range_to_update, values_to_update)
        log_action("ATUALIZOU_CILINDRO_MULTIGAS", f"ID: {detector_id}")
        return True
        
    except Exception as e:
        st.error(f"Ocorreu um erro ao atualizar os valores do cilindro: {e}")
        return False
