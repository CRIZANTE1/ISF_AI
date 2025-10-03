import streamlit as st
import json
import pandas as pd
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import (
    CANHAO_MONITOR_INVENTORY_SHEET_NAME,
    CANHAO_MONITOR_INSPECTIONS_SHEET_NAME
)
from datetime import date
from dateutil.relativedelta import relativedelta
from utils.auditoria import log_action
from operations.photo_operations import upload_evidence_photo

# Checklist baseado na NFPA 25 e na imagem
CHECKLIST_VISUAL = {
    "Corpo e Estrutura": [
        "Ausência de corrosão, amassados ou trincas no corpo",
        "Pintura íntegra, sem descascamento ou ferrugem",
        "Conexões do flange firmes e sem vazamentos"
    ],
    "Componentes Operacionais": [
        "Volante para movimento vertical íntegro e de fácil manuseio",
        "Manípulo para travamento horizontal funcional e sem danos",
        "Juntas e articulações com lubrificação adequada",
        "Rosca para conexão do esguicho limpa e sem danos"
    ],
    "Acessórios e Acesso": [
        "Esguicho (bocal) instalado, limpo e sem danos",
        "Placa de identificação legível e visível",
        "Acesso ao equipamento livre e desobstruído"
    ]
}

CHECKLIST_FUNCIONAL = {
    "Testes Funcionais (Anual)": [
        "Movimento vertical e horizontal suave (sem água)",
        "Sistema de travamento horizontal eficaz",
        "Sem vazamentos nas juntas sob pressão",
        "Jato d'água firme, contínuo e com alcance esperado",
        "Movimentos suaves com o canhão sob pressão",
        "Drenagem completa após o uso"
    ]
}

def save_new_canhao_monitor(equip_id, location, brand, model):
    """Salva um novo canhão monitor no inventário."""
    try:
        uploader = GoogleDriveUploader()
        inventory_data = uploader.get_data_from_sheet(CANHAO_MONITOR_INVENTORY_SHEET_NAME)
        if inventory_data and len(inventory_data) > 1:
            df = pd.DataFrame(inventory_data[1:], columns=inventory_data[0])
            if equip_id in df['id_equipamento'].values:
                st.error(f"Erro: O ID '{equip_id}' já está cadastrado.")
                return False

        data_row = [
            equip_id,
            location,
            brand,
            model,
            date.today().isoformat()
        ]
        uploader.append_data_to_sheet(CANHAO_MONITOR_INVENTORY_SHEET_NAME, data_row)
        log_action("CADASTROU_CANHAO_MONITOR", f"ID: {equip_id}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo canhão monitor: {e}")
        return False

def save_canhao_monitor_inspection(equip_id, inspection_type, overall_status, results_dict, photo_file, inspector_name):
    """Salva uma nova inspeção de canhão monitor."""
    try:
        uploader = GoogleDriveUploader()
        today = date.today()
        
        photo_link = None
        if photo_file:
            photo_link = upload_evidence_photo(
                photo_file,
                equip_id,
                "nao_conformidade_canhao_monitor"
            )

        if inspection_type == "Teste Funcional (Anual)":
            next_inspection_date = (today + relativedelta(years=1)).isoformat()
        else: # Visual Trimestral
            next_inspection_date = (today + relativedelta(months=3)).isoformat()
            
        non_conformities = [q for q, status in results_dict.items() if status == "Não Conforme"]
        action_plan = "Corrigir itens não conformes." if non_conformities else "Manter monitoramento periódico."
        
        results_json = json.dumps(results_dict, ensure_ascii=False)

        data_row = [
            today.isoformat(),
            equip_id,
            inspection_type,
            overall_status,
            action_plan,
            results_json,
            photo_link if photo_link else "",
            inspector_name,
            next_inspection_date
        ]
        
        uploader.append_data_to_sheet(CANHAO_MONITOR_INSPECTIONS_SHEET_NAME, data_row)
        log_action("SALVOU_INSPECAO_CANHAO_MONITOR", f"ID: {equip_id}, Tipo: {inspection_type}, Status: {overall_status}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar a inspeção para {equip_id}: {e}")
        return False


def save_canhao_monitor_action_log(equip_id, problem, action_taken, responsible, photo_file=None):
    """Salva um registro de ação corretiva para um canhão monitor no log."""
    try:
        # AINDA NÃO TEMOS UMA PLANILHA DE LOG PARA CANHÕES, VAMOS USAR O LOG GERAL POR ENQUANTO
        from gdrive.config import LOG_ACTIONS
        
        uploader = GoogleDriveUploader()
        
        photo_link = None
        if photo_file:
            photo_link = upload_evidence_photo(
                photo_file, 
                equip_id, 
                "acao_corretiva_canhao"
            )

        data_row = [
            date.today().isoformat(),
            equip_id,
            problem,
            action_taken,
            responsible,
            None,  # id_substituto (não aplicável aqui)
            photo_link if photo_link else ""
        ]
        
        uploader.append_data_to_sheet(LOG_ACTIONS, [data_row]) # Usando log de ações genérico
        log_action("REGISTROU_ACAO_CANHAO_MONITOR", f"ID: {equip_id}, Ação: {action_taken[:50]}...")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar log de ação para o canhão {equip_id}: {e}")
        return False
