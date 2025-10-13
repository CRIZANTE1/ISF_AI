# operations/scba_operations.py (REFATORADO)

import streamlit as st
import json
from datetime import date
from dateutil.relativedelta import relativedelta
from database.supabase_client import get_supabase_client  # PARA: Nova importação
from auth.auth_utils import get_user_display_name
from utils.auditoria import log_action


def save_scba_inspection(record: dict, pdf_link: str, user_name: str) -> bool:
    """Salva um novo registro de teste Posi3 de SCBA no Supabase."""
    try:
        db_client = get_supabase_client()

        # O registro já vem como um dicionário. Adicionamos os campos que faltam.
        record['link_relatorio_pdf'] = pdf_link
        record['inspetor_responsavel'] = user_name

        db_client.append_data("conjuntos_autonomos", record)
        log_action("SALVOU_INSPECAO_SCBA",
                   f"ID: {record.get('numero_serie_equipamento')}, Resultado: {record.get('resultado_final')}")
        return True

    except Exception as e:
        st.error(
            f"Erro ao salvar inspeção do SCBA {record.get('numero_serie_equipamento')}: {e}")
        return False


def save_scba_visual_inspection(equipment_id: str, overall_status: str, results_dict: dict, inspector_name: str) -> bool:
    """Salva o resultado de uma inspeção visual periódica de SCBA no Supabase."""
    try:
        db_client = get_supabase_client()
        today = date.today()
        next_inspection_date = (today + relativedelta(months=3))

        # PARA: Cria um dicionário em vez de uma lista
        inspection_record = {
            "data_inspecao": today.isoformat(),
            "numero_serie_equipamento": equipment_id,
            "status_geral": overall_status,
            # Supabase aceita JSON diretamente
            "resultados_json": json.dumps(results_dict, ensure_ascii=False),
            "inspetor": inspector_name,
            "data_proxima_inspecao": next_inspection_date.isoformat()
        }

        db_client.append_data("inspecoes_scba", inspection_record)
        log_action("SALVOU_INSPECAO_VISUAL_SCBA",
                   f"ID: {equipment_id}, Status: {overall_status}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inspeção visual do SCBA {equipment_id}: {e}")
        return False


def save_scba_action_log(equipment_id: str, problem: str, action_taken: str, responsible: str) -> bool:
    """Salva um registro de ação corretiva para um SCBA no Supabase."""
    try:
        db_client = get_supabase_client()

        log_record = {
            "data_acao": date.today().isoformat(),
            "numero_serie_equipamento": equipment_id,
            "problema_original": problem,
            "acao_realizada": action_taken,
            "responsavel": responsible
        }

        db_client.append_data("log_scba", log_record)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar log de ação para o SCBA {equipment_id}: {e}")
        return False


def save_manual_scba(scba_data: dict) -> bool:
    """Salva um novo SCBA manualmente cadastrado no Supabase."""
    try:
        db_client = get_supabase_client()

        # Verificar se o número de série já existe
        df_scba = db_client.get_data("conjuntos_autonomos")
        if not df_scba.empty and scba_data['numero_serie_equipamento'] in df_scba['numero_serie_equipamento'].values:
            st.error(
                f"Erro: SCBA com número de série '{scba_data['numero_serie_equipamento']}' já existe.")
            return False

        today = date.today()
        validade = today + relativedelta(years=1)

        # Cria o registro completo para o novo SCBA
        record = {
            'data_teste': scba_data.get('data_teste', today.isoformat()),
            'data_validade': validade.isoformat(),
            'numero_serie_equipamento': scba_data['numero_serie_equipamento'],
            'marca': scba_data.get('marca'),
            'modelo': scba_data.get('modelo'),
            'numero_serie_mascara': scba_data.get('numero_serie_mascara'),
            'numero_serie_segundo_estagio': scba_data.get('numero_serie_segundo_estagio'),
            'resultado_final': "APTO PARA USO",
            'vazamento_mascara_resultado': "Aprovado",
            'inspetor_responsavel': get_user_display_name(),
            'empresa_executante': scba_data.get('empresa_executante', "Cadastro Manual")
        }

        db_client.append_data("conjuntos_autonomos", record)
        log_action("CADASTROU_SCBA_MANUAL",
                   f"S/N: {scba_data['numero_serie_equipamento']}")
        return True

    except Exception as e:
        st.error(f"Erro ao salvar SCBA: {e}")
        return False
