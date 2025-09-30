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
from operations.photo_operations import upload_evidence_photo

# --- ALTERAÇÃO AQUI: Checklist agora é um dicionário de modelos ---
CHECKLIST_QUESTIONS = {
    "MCS - Selo de Vidro": {
        "Condições Gerais": [
            "Pintura e estrutura sem corrosão ou amassados",
            "Sem vazamentos visíveis no tanque e conexões",
            "Válvulas em bom estado e lubrificadas"
        ],
        "Componentes da Câmara": [
            "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)",
            "Selo de vidro limpo, íntegro e bem fixado",
            "Junta de vedação em boas condições",
            "Defletor e barragem de espuma íntegros"
        ],
        "Linhas e Conexões": [
            "Tomadas de solução e linhas sem obstrução",
            "Drenos livres e estanques",
            "Ejetores e orifícios desobstruídos"
        ],
        "Teste Funcional": [
            "Verificação de fluxo de água/espuma",
            "Verificação de estanqueidade da linha",
            "Funcionamento do sistema confirmado"
        ]
    },
    "TF - Tubo de Filme": {
        "Condições Gerais": [
            "Pintura e estrutura sem corrosão ou amassados",
            "Sem vazamentos visíveis no tanque e conexões",
            "Válvulas em bom estado e lubrificadas"
        ],
        "Componentes da Câmara": [
            "Tubo de projeção íntegro (sem corrosão ou danos)",
            "Defletor de projeção íntegro e bem fixado"
        ],
        "Linhas e Conexões": [
            "Tomadas de solução e linhas sem obstrução",
            "Drenos livres e estanques",
            "Ejetores e orifícios desobstruídos"
        ],
        "Teste Funcional": [
            "Verificação de fluxo de água/espuma",
            "Verificação de estanqueidade da linha",
            "Funcionamento do sistema confirmado"
        ]
    },
    "MLS - Membrana Low Shear": {
        "Condições Gerais": [
            "Pintura e estrutura sem corrosão ou amassados",
            "Sem vazamentos visíveis no tanque e conexões",
            "Válvulas em bom estado e lubrificadas"
        ],
        "Componentes da Câmara": [
            "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)",
            "Membrana de elastômero sem ressecamento ou danos visíveis",
            "Junta de vedação em boas condições",
            "Defletor e barragem de espuma íntegros"
        ],
        "Linhas e Conexões": [
            "Tomadas de solução e linhas sem obstrução",
            "Drenos livres e estanques",
            "Ejetores e orifícios desobstruídos"
        ],
        "Teste Funcional": [
            "Verificação de fluxo de água/espuma",
            "Verificação de estanqueidade da linha",
            "Funcionamento do sistema confirmado"
        ]
    }
}

# Mapa de planos de ação (agora cobre todos os modelos)
ACTION_PLAN_MAP = {
    "Pintura e estrutura sem corrosão ou amassados": "Programar serviço de tratamento de corrosão, reparo e repintura.",
    "Sem vazamentos visíveis no tanque e conexões": "Identificar ponto de vazamento, substituir juntas/vedações ou reparar a conexão.",
    "Válvulas em bom estado e lubrificadas": "Realizar a limpeza, lubrificação ou substituição da válvula defeituosa.",
    "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)": "Avaliar a integridade estrutural. Se comprometida, programar a substituição da câmara.",
    "Selo de vidro limpo, íntegro e bem fixado": "Realizar a limpeza ou substituição do selo de vidro caso esteja sujo ou trincado.",
    "Junta de vedação em boas condições": "Substituir a junta de vedação ressecada ou danificada.",
    "Defletor e barragem de espuma íntegros": "Reparar ou substituir o defletor/barragem de espuma danificado.",
    "Tomadas de solução e linhas sem obstrução": "Realizar a desobstrução e limpeza completa das linhas de solução.",
    "Drenos livres e estanques": "Desobstruir e verificar a estanqueidade dos drenos.",
    "Ejetores e orifícios desobstruídos": "Realizar a limpeza e desobstrução dos ejetores e orifícios.",
    "Tubo de projeção íntegro (sem corrosão ou danos)": "Avaliar a integridade do tubo. Programar reparo ou substituição se necessário.",
    "Defletor de projeção íntegro e bem fixado": "Reapertar ou substituir o defletor de projeção.",
    "Membrana de elastômero sem ressecamento ou danos visíveis": "Substituir a membrana de elastômero.",
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
        log_action("CADASTROU_CAMARA_ESPUMA", f"ID: {chamber_id}, Modelo: {model}")
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

def save_foam_chamber_inspection(chamber_id, inspection_type, overall_status, results_dict, photo_file, inspector_name):
    """
    ✅ FUNÇÃO CORRIGIDA - Salva uma nova inspeção de câmara de espuma, incluindo a foto de não conformidade.
    
    Args:
        chamber_id (str): O ID da câmara inspecionada.
        inspection_type (str): O tipo da inspeção ("Visual Semestral" ou "Funcional Anual").
        overall_status (str): O status geral da inspeção ("Aprovado" ou "Reprovado com Pendências").
        results_dict (dict): Dicionário com as respostas do checklist.
        photo_file (UploadedFile or None): O arquivo da foto enviado pelo usuário.
        inspector_name (str): O nome do usuário que está realizando a inspeção.

    Returns:
        bool: True para sucesso, False para falha.
    """
    try:
        uploader = GoogleDriveUploader()
        today = date.today()
        
        photo_link = None

        if photo_file:
            st.info("Fazendo upload da foto de evidência para o Google Drive...")
            photo_link = upload_evidence_photo(
                photo_file, 
                chamber_id, 
                "nao_conformidade_camara_espuma"
            )

            if not photo_link:
                st.error("Falha crítica: Não foi possível obter o link da foto após o upload. A inspeção não foi salva.")
                return False

        if inspection_type == "Funcional Anual":
            next_inspection_date = (today + relativedelta(years=1)).isoformat()
        else:
            next_inspection_date = (today + relativedelta(months=6)).isoformat()
            
        non_conformities = [q for q, status in results_dict.items() if status == "Não Conforme"]
        action_plan = generate_foam_chamber_action_plan(non_conformities)
        
        results_json = json.dumps(results_dict, ensure_ascii=False)

        # ✅ CORRIGIDO: Agora inclui o link da foto na linha de dados
        data_row = [
            today.isoformat(),           # data_inspecao
            chamber_id,                  # id_camara
            inspection_type,             # tipo_inspecao
            overall_status,              # status_geral
            action_plan,                 # plano_de_acao
            results_json,                # resultados_json
            photo_link if photo_link else "",  # link_foto_nao_conformidade
            inspector_name,              # inspetor
            next_inspection_date         # data_proxima_inspecao
        ]
        
        st.info("Registrando dados da inspeção na planilha...")
        uploader.append_data_to_sheet(FOAM_CHAMBER_INSPECTIONS_SHEET_NAME, data_row)
        
        log_action("SALVOU_INSPECAO_CAMARA_ESPUMA", f"ID: {chamber_id}, Tipo: {inspection_type}, Status: {overall_status}")
        
        return True

    except Exception as e:
        st.error(f"Erro ao salvar a inspeção para a câmara {chamber_id}: {e}")
        return False

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
