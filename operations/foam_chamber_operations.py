import streamlit as st
import json
import pandas as pd
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import (
    FOAM_CHAMBER_INVENTORY_SHEET_NAME, 
    FOAM_CHAMBER_INSPECTIONS_SHEET_NAME, 
    LOG_FOAM_CHAMBER_SHEET_NAME
)
from datetime import date
from dateutil.relativedelta import relativedelta
from utils.auditoria import log_action

# Checklist baseado nos requisitos fornecidos
CHECKLIST_QUESTIONS = {
    "Condições Gerais": [
        "Pintura e estrutura sem corrosão ou amassados",
        "Sem vazamentos visíveis no tanque e conexões",
        "Válvulas em bom estado e lubrificadas"
    ],
    "Componentes da Câmara": [
        "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)",
        "Junta de vedação em boas condições",
        "Selo de vidro limpo e fixado",
        "Defletor e barragem de espuma íntegros"
    ],
    "Linhas e Conexões": [
        "Tomadas de solução e linhas sem obstrução",
        "Anéis de borracha e tampões em bom estado",
        "Drenos livres e estanques",
        "Ejetores e orifícios desobstruídos"
    ],
    "Teste Funcional": [
        "Verificação de fluxo de água/espuma",
        "Verificação de estanqueidade da linha",
        "Funcionamento do sistema confirmado"
    ]
}

# Mapa de planos de ação para não conformidades
ACTION_PLAN_MAP = {
    "Pintura e estrutura sem corrosão ou amassados": "Programar serviço de tratamento de corrosão, reparo e repintura.",
    "Sem vazamentos visíveis no tanque e conexões": "Identificar ponto de vazamento, substituir juntas/vedações ou reparar a conexão.",
    "Válvulas em bom estado e lubrificadas": "Realizar a limpeza, lubrificação ou substituição da válvula defeituosa.",
    "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)": "Avaliar a integridade estrutural. Se comprometida, programar a substituição da câmara.",
    "Junta de vedação em boas condições": "Substituir a junta de vedação ressecada ou danificada.",
    "Selo de vidro limpo e fixado": "Realizar a limpeza do selo de vidro ou substituir o selo caso esteja trincado.",
    "Defletor e barragem de espuma íntegros": "Reparar ou substituir o defletor/barragem de espuma danificado.",
    "Tomadas de solução e linhas sem obstrução": "Realizar a desobstrução e limpeza completa das linhas de solução.",
    "Anéis de borracha e tampões em bom estado": "Substituir anéis e tampões desgastados ou danificados.",
    "Drenos livres e estanques": "Desobstruir e verificar a estanqueidade dos drenos.",
    "Ejetores e orifícios desobstruídos": "Realizar a limpeza e desobstrução dos ejetores e orifícios.",
    "Verificação de fluxo de água/espuma": "Investigar a causa da falha de fluxo (obstrução, problema na bomba, etc.) e corrigir.",
    "Verificação de estanqueidade da linha": "Localizar e reparar o vazamento na linha.",
    "Funcionamento do sistema confirmado": "Realizar diagnóstico completo para identificar e corrigir a falha funcional."
}

def save_new_foam_chamber(chamber_id, location, brand, model):
    """Salva uma nova câmara de espuma no inventário."""
    try:
        uploader = GoogleDriveUploader()
        inventory_data = uploader.get_data_from_sheet(FOAM_CHAMBER_INVENTORY_SHEET_NAME)
        if inventory_data and len(inventory_data) > 1:
            df = pd.DataFrame(inventory_data[1:], columns=inventory_data[0])
            if chamber_id in df['id_camara'].values:
                st.error(f"Erro: O ID '{chamber_id}' já está cadastrado.")
                return False

        data_row = [chamber_id, location, brand, model, date.today().isoformat()]
        uploader.append_data_to_sheet(FOAM_CHAMBER_INVENTORY_SHEET_NAME, data_row)
        log_action("CADASTROU_CAMARA_ESPUMA", f"ID: {chamber_id}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar nova câmara de espuma: {e}")
        return False

def generate_foam_chamber_action_plan(non_conformities):
    """Gera um plano de ação consolidado para as não conformidades."""
    if not non_conformities:
        return "Manter em monitoramento periódico."
    first_issue = non_conformities[0]
    return ACTION_PLAN_MAP.get(first_issue, "Corrigir a não conformidade reportada.")

def save_foam_chamber_inspection(chamber_id, inspection_type, overall_status, results_dict, inspector_name):
    """Salva uma nova inspeção de câmara de espuma."""
    try:
        uploader = GoogleDriveUploader()
        today = date.today()
        
        # Calcula a próxima data de inspeção com base no tipo
        if inspection_type == "Funcional Anual":
            next_inspection_date = (today + relativedelta(years=1)).isoformat()
        else: # Visual Mensal
            next_inspection_date = (today + relativedelta(months=1)).isoformat()
            
        non_conformities = [q for q, status in results_dict.items() if status == "Não Conforme"]
        action_plan = generate_foam_chamber_action_plan(non_conformities)
        
        results_json = json.dumps(results_dict, ensure_ascii=False)

        data_row = [
            today.isoformat(),
            chamber_id,
            inspection_type,
            overall_status,
            action_plan,
            results_json,
            inspector_name,
            next_inspection_date
        ]
        
        uploader.append_data_to_sheet(FOAM_CHAMBER_INSPECTIONS_SHEET_NAME, data_row)
        log_action("SALVOU_INSPECAO_CAMARA_ESPUMA", f"ID: {chamber_id}, Tipo: {inspection_type}, Status: {overall_status}")
        return True

    except Exception as e:
        st.error(f"Erro ao salvar a inspeção para a câmara {chamber_id}: {e}")
        return False

def save_foam_chamber_action_log(chamber_id, problem, action_taken, responsible):
    """Salva um registro de ação corretiva para uma câmara de espuma."""
    try:
        uploader = GoogleDriveUploader()
        data_row = [date.today().isoformat(), chamber_id, problem, action_taken, responsible]
        uploader.append_data_to_sheet(LOG_FOAM_CHAMBER_SHEET_NAME, data_row)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar log de ação para a câmara {chamber_id}: {e}")
        return False
