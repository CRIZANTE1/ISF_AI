import streamlit as st
import json
import pandas as pd
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import (
    ALARM_INVENTORY_SHEET_NAME, 
    ALARM_INSPECTIONS_SHEET_NAME, 
    LOG_ALARM_SHEET_NAME
)
from datetime import date
from dateutil.relativedelta import relativedelta
from operations.photo_operations import upload_evidence_photo
from utils.auditoria import log_action

# Define a estrutura do checklist de inspeção para sistemas de alarme
CHECKLIST_QUESTIONS = {
    "Componentes Físicos": [
        "Painel de controle sem danos físicos",
        "Fiação e conexões em bom estado",
        "Dispositivos de alarme (sirenes, luzes) intactos",
        "Baterias de backup em bom estado",
        "Detectores de fumaça/calor limpos e sem danos"
    ],
    "Funcionamento": [
        "Painel de controle em estado normal (sem indicação de falhas)",
        "Sirenes funcionam corretamente durante teste",
        "Luzes estroboscópicas funcionam corretamente",
        "Sistema comunica com central de monitoramento (se aplicável)",
        "Bateria de backup carrega corretamente"
    ],
    "Sensores e Detectores": [
        "Detectores de fumaça respondem ao teste",
        "Detectores de calor funcionam corretamente",
        "Acionadores manuais respondem quando ativados",
        "Sensores de fluxo de água (se aplicável) funcionam",
        "Cobertura de sensores adequada para o ambiente"
    ],
    "Documentação e Sinalização": [
        "Instruções de operação visíveis e legíveis",
        "Plano de evacuação atualizado e visível",
        "Registros de manutenção anteriores disponíveis",
        "Contatos de emergência atualizados",
        "Sinalização de rotas de fuga adequada"
    ]
}

# Mapeamento de ações corretivas para problemas comuns
ACTION_PLAN_MAP = {
    "Painel de controle sem danos físicos": "Solicitar reparo ou substituição do painel de controle danificado.",
    "Fiação e conexões em bom estado": "Realizar manutenção na fiação danificada e reconectar pontos soltos.",
    "Dispositivos de alarme (sirenes, luzes) intactos": "Substituir sirenes ou luzes estroboscópicas danificadas.",
    "Baterias de backup em bom estado": "Substituir baterias de backup que não estejam mantendo carga.",
    "Detectores de fumaça/calor limpos e sem danos": "Limpar ou substituir detectores danificados ou sujos.",
    "Painel de controle em estado normal (sem indicação de falhas)": "Investigar e corrigir falhas indicadas no painel.",
    "Sirenes funcionam corretamente durante teste": "Substituir ou reparar sirenes que não funcionam durante o teste.",
    "Luzes estroboscópicas funcionam corretamente": "Substituir luzes estroboscópicas defeituosas.",
    "Sistema comunica com central de monitoramento (se aplicável)": "Verificar e restaurar a comunicação com a central de monitoramento.",
    "Bateria de backup carrega corretamente": "Substituir carregador ou bateria que não mantém carga.",
    "Detectores de fumaça respondem ao teste": "Substituir detectores de fumaça que não respondem ao teste.",
    "Detectores de calor funcionam corretamente": "Substituir detectores de calor que não respondem corretamente.",
    "Acionadores manuais respondem quando ativados": "Reparar ou substituir acionadores manuais que não funcionam.",
    "Sensores de fluxo de água (se aplicável) funcionam": "Verificar e reparar sensores de fluxo de água.",
    "Cobertura de sensores adequada para o ambiente": "Adicionar sensores adicionais para garantir cobertura adequada.",
    "Instruções de operação visíveis e legíveis": "Atualizar e reposicionar instruções de operação.",
    "Plano de evacuação atualizado e visível": "Atualizar e exibir corretamente o plano de evacuação.",
    "Registros de manutenção anteriores disponíveis": "Organizar e disponibilizar registros de manutenção anteriores.",
    "Contatos de emergência atualizados": "Atualizar lista de contatos de emergência.",
    "Sinalização de rotas de fuga adequada": "Instalar ou atualizar sinalizações de rota de fuga."
}

def save_new_alarm_system(alarm_id, location, brand, model):
    """
    Salva um novo sistema de alarme no inventário.
    
    Args:
        alarm_id (str): ID único do sistema de alarme
        location (str): Localização do sistema
        brand (str): Marca/fabricante
        model (str): Modelo do sistema
        
    Returns:
        bool: True se o cadastro for bem-sucedido, False caso contrário
    """
    try:
        uploader = GoogleDriveUploader()
        
        # Verifica se o ID já existe para evitar duplicatas
        inventory_data = uploader.get_data_from_sheet(ALARM_INVENTORY_SHEET_NAME)
        if inventory_data and len(inventory_data) > 1:
            df = pd.DataFrame(inventory_data[1:], columns=inventory_data[0])
            if alarm_id in df['id_sistema'].values:
                st.error(f"Erro: O ID '{alarm_id}' já está cadastrado.")
                return False

        data_row = [
            alarm_id,
            location,
            brand,
            model,
            date.today().isoformat()  # data_cadastro
        ]
        
        uploader.append_data_to_sheet(ALARM_INVENTORY_SHEET_NAME, data_row)
        log_action("CADASTROU_SISTEMA_ALARME", f"ID: {alarm_id}, Modelo: {model}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo sistema de alarme: {e}")
        return False

def generate_alarm_action_plan(non_conformities):
    """
    Gera um plano de ação consolidado para uma lista de não conformidades.
    
    Args:
        non_conformities (list): Lista de itens não conformes
        
    Returns:
        str: Plano de ação recomendado
    """
    if not non_conformities:
        return "Manter em monitoramento periódico."
    
    # Retorna o plano de ação para a primeira não conformidade encontrada
    first_issue = non_conformities[0]
    return ACTION_PLAN_MAP.get(first_issue, "Corrigir a não conformidade reportada.")

def save_alarm_inspection(system_id, overall_status, results_dict, photo_file, inspector_name):
    """
    Salva uma nova inspeção de sistema de alarme.
    
    Args:
        system_id (str): ID do sistema de alarme
        overall_status (str): Status geral da inspeção ("Aprovado" ou "Reprovado com Pendências")
        results_dict (dict): Dicionário com as respostas do checklist
        photo_file (file): Arquivo da foto de não conformidade (opcional)
        inspector_name (str): Nome do inspetor
        
    Returns:
        bool: True se a operação for bem-sucedida, False caso contrário
    """
    try:
        uploader = GoogleDriveUploader()
        today = date.today()
        next_inspection_date = (today + relativedelta(months=3)).isoformat()  # Próxima inspeção em 3 meses
        
        photo_link = None
        
        # Faz upload da foto se fornecida
        if photo_file:
            st.info("Fazendo upload da foto de evidência para o Google Drive...")
            photo_link = upload_evidence_photo(
                photo_file, 
                system_id, 
                "nao_conformidade_alarme"
            )
            
            if not photo_link:
                st.error("Falha crítica: Não foi possível obter o link da foto após o upload. A inspeção não foi salva.")
                return False
                
        # Identifica não conformidades para gerar plano de ação
        non_conformities = [q for q, status in results_dict.items() if status == "Não Conforme"]
        action_plan = generate_alarm_action_plan(non_conformities)
        
        # Converte o dicionário de resultados para JSON
        results_json = json.dumps(results_dict, ensure_ascii=False)
        
        # Prepara linha de dados para salvar
        data_row = [
            today.isoformat(),               # data_inspecao
            system_id,                       # id_sistema
            overall_status,                  # status_geral
            action_plan,                     # plano_de_acao
            results_json,                    # resultados_json
            photo_link,                      # link_foto_nao_conformidade
            inspector_name,                  # inspetor
            next_inspection_date             # data_proxima_inspecao
        ]
        
        st.info("Registrando dados da inspeção na planilha...")
        uploader.append_data_to_sheet(ALARM_INSPECTIONS_SHEET_NAME, data_row)
        log_action("SALVOU_INSPECAO_ALARME", f"ID do sistema: {system_id}, Status: {overall_status}")
        return True
        
    except Exception as e:
        st.error(f"Ocorreu um erro inesperado ao salvar a inspeção para o sistema {system_id}:")
        st.error(f"Detalhes do erro: {e}")
        return False

def save_alarm_action_log(system_id, problem, action_taken, responsible, photo_file=None):
    """
    Salva um registro de ação corretiva para um sistema de alarme no log.
    
    Args:
        system_id (str): ID do sistema de alarme
        problem (str): Descrição do problema
        action_taken (str): Ação corretiva realizada
        responsible (str): Responsável pela ação
        photo_file (file): Foto da ação corretiva (opcional)
        
    Returns:
        bool: True se a operação for bem-sucedida, False caso contrário
    """
    try:
        uploader = GoogleDriveUploader()
        
        # Faz upload da foto se fornecida
        photo_link = None
        if photo_file:
            photo_link = upload_evidence_photo(
                photo_file, 
                system_id, 
                "acao_corretiva_alarme"
            )
        
        # Prepara linha de dados para o log
        data_row = [
            date.today().isoformat(),  # data_acao
            system_id,                 # id_sistema
            problem,                   # problema
            action_taken,              # acao_realizada
            responsible,               # responsavel
            photo_link                 # link_foto_evidencia
        ]
        
        uploader.append_data_to_sheet(LOG_ALARM_SHEET_NAME, data_row)
        log_action("REGISTROU_ACAO_ALARME", f"ID: {system_id}, Ação: {action_taken[:50]}...")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar log de ação para o sistema {system_id}: {e}")
        return False
