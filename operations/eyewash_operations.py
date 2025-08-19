import streamlit as st
import json
import pandas as pd
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import EYEWASH_INSPECTIONS_SHEET_NAME, EYEWASH_INVENTORY_SHEET_NAME
from datetime import date
from dateutil.relativedelta import relativedelta
from operations.photo_operations import upload_evidence_photo


CHECKLIST_QUESTIONS = {
    "Condições Gerais": [
        "A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?",
        "A PRESSÃO ESTÁ ADEQUADA?",
        "A PINTURA ESTA ÍNTEGRA?",
        "OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?",
        "O ACESSO ESTÁ LIVRE?",
        "NIVELAMENTO POSSUI DESNÍVEL?",
        "A DRENAGEM DE ÁGUA FUNCIONA?",
        "O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?",
        "O FILTRO ESTÁ LIMPO?",
        "O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?",
        "O PISO POSSUI ADERÊNCIA?",
        "OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?",
        "O EQUIPAMENTO POSSUI CORROSÃO?",
        "EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?",
        "OS ESGUICHOS POSSUEM DEFEITOS?",
        "O PISO ESTÁ DANIFICADO?"
    ]
}
ACTION_PLAN_MAP = {
    "A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?": "Verificar e desobstruir a linha de suprimento ou ajustar a válvula de vazão.",
    "A PRESSÃO ESTÁ ADEQUADA?": "Verificar a pressão na linha de entrada e ajustar o regulador de pressão, se aplicável.",
    "A PINTURA ESTA ÍNTEGRA?": "Programar serviço de lixamento e repintura do equipamento.",
    "OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?": "Substituir as gaxetas ou o reparo da válvula com vazamento.",
    "O ACESSO ESTÁ LIVRE?": "Remover obstruções e garantir corredor de acesso livre conforme norma.",
    "NIVELAMENTO POSSUI DESNÍVEL?": "Realinhar e fixar a base do equipamento para garantir o nivelamento correto.",
    "A DRENAGEM DE ÁGUA FUNCIONA?": "Desobstruir o ralo ou a tubulação de drenagem.",
    "O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?": "Realizar a limpeza do crivo e reapertar suas fixações.",
    "O FILTRO ESTÁ LIMPO?": "Remover, limpar e reinstalar o filtro da linha de água.",
    "O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?": "Testar e, se necessário, substituir o regulador de pressão.",
    "O PISO POSSUI ADERÊNCIA?": "Aplicar tratamento antiderrapante ou substituir o revestimento do piso.",
    "OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?": "Incluir treinamento sobre o uso do equipamento no próximo DDS ou treinamento da CIPA.",
    "O EQUIPAMENTO POSSUI CORROSÃO?": "Avaliar a extensão da corrosão. Programar serviço de tratamento e repintura.",
    "EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?": "Programar a pintura de demarcação do piso conforme norma.",
    "OS ESGUICHOS POSSUEM DEFEITOS?": "Limpar ou substituir os esguichos/bocais do lava-olhos.",
    "O PISO ESTÁ DANIFICADO?": "Programar o reparo ou a substituição da área danificada do piso."
}


def save_new_eyewash_station(equipment_id, location, brand, model):
    """Salva um novo chuveiro/lava-olhos na planilha de inventário."""
    try:
        uploader = GoogleDriveUploader()
        
        # Verifica se o ID já existe para evitar duplicatas
        inventory_data = uploader.get_data_from_sheet(EYEWASH_INVENTORY_SHEET_NAME)
        if inventory_data and len(inventory_data) > 1:
            df = pd.DataFrame(inventory_data[1:], columns=inventory_data[0])
            if equipment_id in df['id_equipamento'].values:
                st.error(f"Erro: O ID '{equipment_id}' já está cadastrado.")
                return False

        data_row = [
            equipment_id,
            location,
            brand,
            model,
            date.today().isoformat()
        ]
        
        uploader.append_data_to_sheet(EYEWASH_INVENTORY_SHEET_NAME, data_row)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo equipamento: {e}")
        return False
        
def generate_eyewash_action_plan(non_conformities):
    """Gera um plano de ação consolidado para uma lista de não conformidades."""
    if not non_conformities:
        return "Manter em monitoramento periódico."
    
    # Pega o plano de ação da primeira não conformidade encontrada
    first_issue = non_conformities[0]
    return ACTION_PLAN_MAP.get(first_issue, "Corrigir a não conformidade reportada.")

def save_eyewash_inspection(equipment_id, overall_status, results_dict, photo_file, inspector_name):
    """Salva a inspeção, incluindo plano de ação e foto."""
    try:
        uploader = GoogleDriveUploader()
        today = date.today()
        next_inspection_date = (today + relativedelta(months=1)).isoformat()
        
        # Faz o upload da foto, se houver
        photo_link = upload_evidence_photo(photo_file, equipment_id, "nao_conformidade_chuveiro")

        # Gera o plano de ação
        non_conformities = [q for q, status in results_dict.items() if status == "Não Conforme"]
        action_plan = generate_eyewash_action_plan(non_conformities)
        
        results_json = json.dumps(results_dict, ensure_ascii=False)

        data_row = [
            today.isoformat(),
            equipment_id,
            overall_status,
            action_plan,
            results_json,
            photo_link,
            inspector_name,
            next_inspection_date
        ]
        
        uploader.append_data_to_sheet(EYEWASH_INSPECTIONS_SHEET_NAME, data_row)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inspeção do equipamento {equipment_id}: {e}")
        return False
