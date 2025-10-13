import streamlit as st
import json
from supabase.client import get_supabase_client
from datetime import date
from dateutil.relativedelta import relativedelta
from utils.auditoria import log_action


def save_shelter_inventory(shelter_id, client, local, items_dict):
    """
    Salva o inventário de um novo abrigo de emergência na tabela 'abrigos'.
    Converte o dicionário de itens em uma string JSON para armazenamento.
    """
    try:
        db_client = get_supabase_client()
        items_json_string = json.dumps(items_dict, ensure_ascii=False)

        # Verifica se o ID já existe
        df_shelters = db_client.get_data("abrigos")
        if not df_shelters.empty and shelter_id in df_shelters['id_abrigo'].values:
            st.error(f"Erro: O ID do abrigo '{shelter_id}' já existe.")
            return False

        new_record = {
            "id_abrigo": shelter_id,
            "cliente": client,
            "local": local,
            "itens_json": items_json_string
        }
        db_client.append_data("abrigos", new_record)
        log_action("CADASTROU_ABRIGO", f"ID: {shelter_id}, Local: {local}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inventário do abrigo {shelter_id}: {e}")
        return False


def save_shelter_inspection(shelter_id, overall_status, inspection_results, inspector_name):
    """
    Salva o resultado de uma inspeção de abrigo e calcula a próxima data de inspeção.
    """
    try:
        db_client = get_supabase_client()
        today = date.today()
        next_inspection_date = (today + relativedelta(months=3)).isoformat()
        results_json_string = json.dumps(
            inspection_results, ensure_ascii=False)

        new_record = {
            "data_inspecao": today.isoformat(),
            "id_abrigo": shelter_id,
            "status_geral": overall_status,
            "resultados_json": results_json_string,
            "inspetor": inspector_name,
            "data_proxima_inspecao": next_inspection_date
        }

        db_client.append_data("inspecoes_abrigos", new_record)
        log_action("SALVOU_INSPECAO_ABRIGO",
                   f"ID: {shelter_id}, Status: {overall_status}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inspeção do abrigo {shelter_id}: {e}")
        return False


def save_shelter_action_log(shelter_id, problem, action_taken, responsible):
    """
    Salva um registro de ação corretiva para um abrigo no log.
    """
    try:
        db_client = get_supabase_client()
        new_record = {
            "data_acao": date.today().isoformat(),
            "id_abrigo": shelter_id,
            "problema_identificado": problem,
            "acao_realizada": action_taken,
            "responsavel": responsible
        }
        db_client.append_data("log_acoes_abrigos", new_record)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar log de ação para o abrigo {shelter_id}: {e}")
        return False
