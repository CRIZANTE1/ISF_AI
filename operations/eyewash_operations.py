import streamlit as st
import json
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import EYEWASH_INSPECTIONS_SHEET_NAME
from datetime import date
from dateutil.relativedelta import relativedelta

def save_eyewash_inspection(equipment_id, overall_status, results_dict, inspector_name):
    """
    Salva o resultado de uma inspeção de chuveiro/lava-olhos e calcula a próxima data.
    """
    try:
        uploader = GoogleDriveUploader()
        today = date.today()
        # Define a próxima inspeção para daqui a 1 mês
        next_inspection_date = (today + relativedelta(months=1)).isoformat()
        
        results_json = json.dumps(results_dict, ensure_ascii=False)

        data_row = [
            today.isoformat(),
            equipment_id,
            overall_status,
            results_json,
            inspector_name,
            next_inspection_date
        ]
        
        uploader.append_data_to_sheet(EYEWASH_INSPECTIONS_SHEET_NAME, data_row)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inspeção do equipamento {equipment_id}: {e}")
        return False
