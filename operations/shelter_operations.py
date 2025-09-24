import streamlit as st
import json
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import SHELTER_SHEET_NAME, INSPECTIONS_SHELTER_SHEET_NAME, LOG_SHELTER_SHEET_NAME
from datetime import date 
from dateutil.relativedelta import relativedelta 
from utils.auditoria import log_action 

def save_shelter_inventory(shelter_id, client, local, items_dict):
    """
    Salva o inventário de um novo abrigo de emergência na planilha.
    Converte o dicionário de itens em uma string JSON para armazenamento.
    """
    try:
        uploader = GoogleDriveUploader()
        items_json_string = json.dumps(items_dict, ensure_ascii=False)
        data_row = [shelter_id, client, local, items_json_string]
        uploader.append_data_to_sheet(SHELTER_SHEET_NAME, data_row)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inventário do abrigo {shelter_id}: {e}")
        return False

def save_shelter_inspection(shelter_id, overall_status, inspection_results, inspector_name):
    """
    Salva o resultado de uma inspeção de abrigo e calcula a próxima data de inspeção.
    """
    try:
        uploader = GoogleDriveUploader()
        today = date.today()
        next_inspection_date = (today + relativedelta(months=3)).isoformat()
        results_json_string = json.dumps(inspection_results, ensure_ascii=False)
        data_row = [
            today.isoformat(),
            shelter_id,
            overall_status,
            results_json_string,
            inspector_name,
            next_inspection_date
        ]
        uploader.append_data_to_sheet(INSPECTIONS_SHELTER_SHEET_NAME, data_row)
        log_action("SALVOU_INSPECAO_ABRIGO", f"ID: {shelter_id}, Status: {overall_status}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inspeção do abrigo {shelter_id}: {e}")
        return False

def save_shelter_action_log(shelter_id, problem, action_taken, responsible):
    """
    Salva um registro de ação corretiva para um abrigo no log.
    """
    try:
        uploader = GoogleDriveUploader()
        data_row = [
            date.today().isoformat(),
            shelter_id,
            problem,
            action_taken,
            responsible
        ]
        uploader.append_data_to_sheet(LOG_SHELTER_SHEET_NAME, data_row)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar log de ação para o abrigo {shelter_id}: {e}")
        return False


def save_shelter_inventory_manual(shelter_id, client, local, item_list):
    """
    Salva o inventário de um novo abrigo de emergência na planilha a partir de uma lista manual.
    Converte a lista de itens em uma string JSON para armazenamento.
    
    Args:
        shelter_id (str): ID do abrigo
        client (str): Nome do cliente
        local (str): Localização do abrigo
        item_list (dict): Dicionário de itens e quantidades
    
    Returns:
        bool: True se bem-sucedido, False caso contrário
    """
    try:
        import json
        from gdrive.gdrive_upload import GoogleDriveUploader
        from gdrive.config import SHELTER_SHEET_NAME
        from utils.auditoria import log_action
        import streamlit as st
        
        # Valida se há pelo menos um item na lista
        if not item_list or len(item_list) == 0:
            st.error("É necessário cadastrar pelo menos um item no abrigo.")
            return False
            
        uploader = GoogleDriveUploader()
        
        # Verifica se o ID já existe para evitar duplicatas
        shelters_data = uploader.get_data_from_sheet(SHELTER_SHEET_NAME)
        if shelters_data and len(shelters_data) > 1:
            import pandas as pd
            df = pd.DataFrame(shelters_data[1:], columns=shelters_data[0])
            if shelter_id in df['id_abrigo'].values:
                st.error(f"Erro: O ID do abrigo '{shelter_id}' já existe.")
                return False
        
        # Converte a lista de itens para JSON
        items_json_string = json.dumps(item_list, ensure_ascii=False)
        
        # Cria a linha para inserir na planilha
        data_row = [shelter_id, client, local, items_json_string]
        
        # Adiciona à planilha
        uploader.append_data_to_sheet(SHELTER_SHEET_NAME, [data_row])
        
        # Registra no log de auditoria
        log_action("CADASTROU_ABRIGO_MANUAL", f"ID: {shelter_id}, Local: {local}")
        
        return True
        
    except Exception as e:
        st.error(f"Erro ao salvar abrigo: {e}")
        return False
