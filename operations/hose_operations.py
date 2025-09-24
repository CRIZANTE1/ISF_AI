import streamlit as st
from datetime import date
from dateutil.relativedelta import relativedelta
import pandas as pd
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import HOSE_SHEET_NAME
from utils.auditoria import log_action
from auth.auth_utils import get_user_display_name


# Nova função a ser adicionada
def save_new_hose(hose_data):
    """
    Salva uma nova mangueira na planilha.
    
    Args:
        hose_data (dict): Dicionário contendo os dados da nova mangueira
    
    Returns:
        bool: True se bem-sucedido, False caso contrário
    """
    try:
        uploader = GoogleDriveUploader()
        
        # Verifica se o ID já existe para evitar duplicatas
        hoses_data = uploader.get_data_from_sheet(HOSE_SHEET_NAME)
        if hoses_data and len(hoses_data) > 1:
            df = pd.DataFrame(hoses_data[1:], columns=hoses_data[0])
            if hose_data['id_mangueira'] in df['id_mangueira'].values:
                st.error(f"Erro: O ID '{hose_data['id_mangueira']}' já existe.")
                return False
        
        hose_row = [
            hose_data['id_mangueira'],
            hose_data['marca'],
            hose_data['diametro'],
            hose_data['tipo'],
            hose_data['comprimento'],
            hose_data['ano_fabricacao'],
            date.today().isoformat(),  # data_inspecao
            (date.today() + relativedelta(years=1)).isoformat(),  # data_proximo_teste (1 ano)
            "Aprovado",  # resultado
            None,  # link_certificado_pdf
            get_user_display_name(),  # registrado_por
            hose_data.get('empresa_executante', "Registro Manual"),  # empresa_executante
            hose_data.get('resp_tecnico_certificado', None),  # resp_tecnico
        ]
        
        uploader.append_data_to_sheet(HOSE_SHEET_NAME, [hose_row])
        
        # Registra a ação no log de auditoria
        log_action("CADASTROU_MANGUEIRA_MANUAL", f"ID: {hose_data['id_mangueira']}, Marca: {hose_data['marca']}, Tipo: {hose_data['tipo']}")
        
        return True
    except Exception as e:
        st.error(f"Erro ao salvar nova mangueira: {e}")
        return False

# Mantenha todas as outras funções que possam existir no arquivo original
