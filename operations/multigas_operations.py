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
        
        # Encontra o índice da linha do detector a ser atualizado
        target_indices = df_inventory.index[df_inventory['id_equipamento'] == detector_id].tolist()
        
        if not target_indices:
            st.error(f"Detector com ID '{detector_id}' não encontrado no inventário.")
            return False
            
        row_index = target_indices[0]
        
        # O índice da planilha é o índice do DataFrame + 2 (cabeçalho e base 0)
        sheet_row_index = row_index + 2
        
        # Define o range para atualização (Colunas F a I)
        range_to_update = f"F{sheet_row_index}:I{sheet_row_index}"
        
        # Prepara os novos valores na ordem correta
        values_to_update = [[
            new_cylinder_values['LEL'],
            new_cylinder_values['O2'],
            new_cylinder_values['H2S'],
            new_cylinder_values['CO']
        ]]

        uploader.update_cells(MULTIGAS_INVENTORY_SHEET_NAME, range_to_update, values_to_update)
        log_action("ATUALIZOU_CILINDRO_MULTIGAS", f"ID: {detector_id}")
        return True
        
    except Exception as e:
        st.error(f"Ocorreu um erro ao atualizar os valores do cilindro: {e}")
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
        
    uploader = GoogleDriveUploader()
    inventory_data = uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)
    detector_id = None
    is_new = False
    
    # --- INÍCIO DA CORREÇÃO ---
    if inventory_data and len(inventory_data) > 1:
        headers = inventory_data[0]
        rows = inventory_data[1:]
        
        # Filtra linhas vazias e garante que todas as linhas tenham o mesmo número de colunas
        num_columns = len(headers)
        cleaned_rows = []
        for row in rows:
            if any(cell for cell in row): # Ignora linhas completamente vazias
                row.extend([None] * (num_columns - len(row))) # Garante que a linha tenha o tamanho certo
                cleaned_rows.append(row[:num_columns])

        if cleaned_rows:
            df_inventory = pd.DataFrame(cleaned_rows, columns=headers)
            existing_detector = df_inventory[df_inventory['numero_serie'] == serial_number]
            if not existing_detector.empty:
                detector_id = existing_detector.iloc[0]['id_equipamento']
            else:
                is_new = True
        else: # Se a planilha só tinha cabeçalho e linhas vazias
            is_new = True
    else: # Se a planilha está completamente vazia
        is_new = True
    # --- FIM DA CORREÇÃO ---
        
    if is_new:
        suger_id = f"MG-{serial_number[-4:]}"
        st.info(f"Detector com S/N {serial_number} não encontrado. Ele será cadastrado automaticamente.")
        # Usamos uma chave única para o text_input para evitar problemas de estado
        detector_id = st.text_input("Confirme ou edite o ID para o novo equipamento:", suger_id, key=f"new_id_{serial_number}")
        
        cylinder_values = {"LEL": None, "O2": None, "H2S": None, "CO": None}
        
        # Botão para confirmar o cadastro dentro da lógica
        if st.button("Confirmar Cadastro do Novo Detector", key=f"confirm_new_{serial_number}"):
            if save_new_multigas_detector(detector_id, calib_data.get('marca'), calib_data.get('modelo'), serial_number, cylinder_values):
                st.success(f"Novo detector com ID '{detector_id}' cadastrado com sucesso! Por favor, clique em 'Analisar Certificado com IA' novamente.")
                st.cache_data.clear()
                st.rerun()
            else:
                return None, None
        else:
            # Se o usuário ainda não confirmou o novo cadastro, paramos aqui.
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
        "link_certificado": None
    }
    
    return inspection_record, calib_data
