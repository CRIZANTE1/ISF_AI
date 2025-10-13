import streamlit as st
import json
from supabase.client import get_supabase_client
from datetime import date
from dateutil.relativedelta import relativedelta
from utils.auditoria import log_action
from storage.client import upload_evidence_photo

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
        db_client = get_supabase_client()

        # Verifica se o ID já existe
        df_inventory = db_client.get_data("inventario_canhoes_monitores")
        if not df_inventory.empty and equip_id in df_inventory['id_equipamento'].values:
            st.error(f"Erro: O ID '{equip_id}' já está cadastrado.")
            return False

        new_record = {
            "id_equipamento": equip_id,
            "localizacao": location,
            "marca": brand,
            "modelo": model,
            "data_cadastro": date.today().isoformat()
        }

        db_client.append_data("inventario_canhoes_monitores", new_record)
        log_action("CADASTROU_CANHAO_MONITOR", f"ID: {equip_id}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo canhão monitor: {e}")
        return False


def save_canhao_monitor_inspection(equip_id, inspection_type, overall_status, results_dict, photo_file, inspector_name):
    """Salva uma nova inspeção de canhão monitor."""
    try:
        db_client = get_supabase_client()
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
        else:  # Visual Trimestral
            next_inspection_date = (
                today + relativedelta(months=3)).isoformat()

        non_conformities = [
            q for q, status in results_dict.items() if status == "Não Conforme"]
        action_plan = "Corrigir itens não conformes." if non_conformities else "Manter monitoramento periódico."

        results_json = json.dumps(results_dict, ensure_ascii=False)

        inspection_record = {
            "data_inspecao": today.isoformat(),
            "id_equipamento": equip_id,
            "tipo_inspecao": inspection_type,
            "status_geral": overall_status,
            "plano_de_acao": action_plan,
            "resultados_json": results_json,
            "link_foto_nao_conformidade": photo_link if photo_link else "",
            "inspetor": inspector_name,
            "data_proxima_inspecao": next_inspection_date
        }

        db_client.append_data("inspecoes_canhoes_monitores", inspection_record)
        log_action("SALVOU_INSPECAO_CANHAO_MONITOR",
                   f"ID: {equip_id}, Tipo: {inspection_type}, Status: {overall_status}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar a inspeção para {equip_id}: {e}")
        return False


def save_canhao_monitor_action_log(equip_id, problem, action_taken, responsible, photo_file=None):
    """Salva um registro de ação corretiva para um canhão monitor no log específico."""
    try:
        db_client = get_supabase_client()

        photo_link = None
        if photo_file:
            photo_link = upload_evidence_photo(
                photo_file,
                equip_id,
                "acao_corretiva_canhao"
            )

        log_record = {
            "data_acao": date.today().isoformat(),
            "id_equipamento": equip_id,
            "problema_identificado": problem,
            "acao_realizada": action_taken,
            "responsavel": responsible,
            "link_foto_evidencia": photo_link if photo_link else ""
        }

        db_client.append_data("log_acoes_canhoes_monitores", log_record)
        log_action("REGISTROU_ACAO_CANHAO_MONITOR",
                   f"ID: {equip_id}, Ação: {action_taken[:50]}...")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar log de ação para o canhão {equip_id}: {e}")
        return False
