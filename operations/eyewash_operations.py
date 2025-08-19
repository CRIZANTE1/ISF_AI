import streamlit as st
import json
import pandas as pd
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import EYEWASH_INVENTORY_SHEET_NAME, EYEWASH_INSPECTIONS_SHEET_NAME, LOG_EYEWASH_SHEET_NAME
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



def save_eyewash_inspection(equipment_id, overall_status, results_dict, photo_file, inspector_name):
    """
    Salva uma nova inspeção de chuveiro/lava-olhos.

    Esta função executa as seguintes etapas em ordem:
    1. Faz o upload da foto de não conformidade para o Google Drive, se uma for fornecida.
    2. Gera um plano de ação padronizado com base nos resultados da inspeção.
    3. Prepara a linha de dados completa para o registro.
    4. Adiciona a linha de dados à planilha 'inspecoes_chuveiros_lava_olhos'.
    5. Retorna True se tudo for bem-sucedido, ou False se ocorrer um erro.

    Args:
        equipment_id (str): O ID do equipamento inspecionado.
        overall_status (str): O status geral da inspeção ("Aprovado" ou "Reprovado com Pendências").
        results_dict (dict): Dicionário com as respostas do checklist.
        photo_file (UploadedFile or None): O arquivo da foto enviado pelo usuário.
        inspector_name (str): O nome do usuário que está realizando a inspeção.

    Returns:
        bool: True para sucesso, False para falha.
    """
    try:
        # Inicializa o uploader do Google Drive para interagir com a API
        uploader = GoogleDriveUploader()
        
        today = date.today()
        next_inspection_date = (today + relativedelta(months=1)).isoformat()
        
        photo_link = None # Inicializa a variável do link da foto como Nula

        if photo_file:
            st.info("Fazendo upload da foto de evidência para o Google Drive...")
            # A função `upload_evidence_photo` lida com o upload e retorna o link direto
            photo_link = upload_evidence_photo(
                photo_file, 
                equipment_id, 
                "nao_conformidade_chuveiro"
            )

            if not photo_link:
                st.error("Falha crítica: Não foi possível obter o link da foto após o upload. A inspeção não foi salva.")
                return False

        # ETAPA 2: Geração do Plano de Ação
        # Identifica todas as perguntas que foram marcadas como "Não Conforme"
        non_conformities = [q for q, status in results_dict.items() if status == "Não Conforme"]
        # Gera o plano de ação com base na lista de não conformidades
        action_plan = generate_eyewash_action_plan(non_conformities)
        
        results_json = json.dumps(results_dict, ensure_ascii=False)

        data_row = [
            today.isoformat(),               # data_inspecao
            equipment_id,                    # id_equipamento
            overall_status,                  # status_geral
            action_plan,                     # plano_de_acao
            results_json,                    # resultados_json
            photo_link,                      # link_foto_nao_conformidade
            inspector_name,                  # inspetor
            next_inspection_date             # data_proxima_inspecao
        ]
        
        st.info("Registrando dados da inspeção na planilha...")
        uploader.append_data_to_sheet(EYEWASH_INSPECTIONS_SHEET_NAME, data_row)
        
        return True

    except Exception as e:
        st.error(f"Ocorreu um erro inesperado ao salvar a inspeção para o equipamento {equipment_id}:")
        st.error(f"Detalhes do erro: {e}")
        return False
        
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

def save_eyewash_action_log(equipment_id, problem, action_taken, responsible, photo_file):
    """Salva um registro de ação corretiva para um chuveiro/lava-olhos no log."""
    try:
        uploader = GoogleDriveUploader()
        
        # Faz o upload da foto de evidência da ação, se houver
        photo_link = upload_evidence_photo(photo_file, equipment_id, "acao_corretiva_chuveiro")

        data_row = [
            date.today().isoformat(),
            equipment_id,
            problem,
            action_taken,
            responsible,
            photo_link
        ]
        
        uploader.append_data_to_sheet(LOG_EYEWASH_SHEET_NAME, data_row)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar log de ação para o equipamento {equipment_id}: {e}")
        return False

