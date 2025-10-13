import streamlit as st
from datetime import date
import pandas as pd
from supabase.client import get_supabase_client
from auth.auth_utils import get_user_display_name
from utils.auditoria import log_action
from storage.client import upload_evidence_photo


def get_disposed_extinguishers():
    """
    Retorna a lista de extintores baixados.
    """
    try:
        db_client = get_supabase_client()
        df = db_client.get_data("log_baixas_extintores")

        if df.empty:
            return pd.DataFrame()

        return df

    except Exception as e:
        st.error(f"Erro ao carregar registros de baixa: {e}")
        return pd.DataFrame()


def is_equipment_disposed(equipment_id):
    """
    Verifica se um equipamento já foi baixado.
    """
    df_disposed = get_disposed_extinguishers()
    if df_disposed.empty:
        return False

    return equipment_id in df_disposed['numero_identificacao'].values


def register_extinguisher_disposal(equipment_id, condemnation_reason, substitute_id=None, observations="", photo_evidence=None):
    """
    Registra a baixa definitiva de um extintor condenado.
    """
    try:
        db_client = get_supabase_client()

        if is_equipment_disposed(equipment_id):
            st.error(
                f"O extintor {equipment_id} já foi baixado anteriormente.")
            return False

        photo_link = None
        if photo_evidence:
            photo_link = upload_evidence_photo(
                photo_evidence,
                equipment_id,
                "baixa_condenacao"
            )

        disposal_record = {
            "data_baixa": date.today().isoformat(),
            "numero_identificacao": equipment_id,
            "motivo_condenacao": condemnation_reason,
            "responsavel_baixa": get_user_display_name(),
            "numero_identificacao_substituto": substitute_id if substitute_id else "",
            "observacoes": observations,
            "link_foto_evidencia": photo_link if photo_link else ""
        }

        db_client.append_data("log_baixas_extintores", disposal_record)

        _mark_equipment_as_disposed(
            equipment_id, condemnation_reason, substitute_id)

        log_action(
            "BAIXOU_EXTINTOR_CONDENADO",
            f"ID: {equipment_id}, Motivo: {condemnation_reason}, Substituto: {substitute_id or 'N/A'}"
        )

        return True

    except Exception as e:
        st.error(f"Erro ao registrar baixa do extintor {equipment_id}: {e}")
        return False


def _mark_equipment_as_disposed(equipment_id, reason, substitute_id):
    """
    Cria um registro final marcando o equipamento como baixado.
    """
    try:
        from operations.extinguisher_operations import save_inspection

        disposal_record = {
            'numero_identificacao': equipment_id,
            'numero_selo_inmetro': None,
            'tipo_agente': None,
            'capacidade': None,
            'marca_fabricante': None,
            'ano_fabricacao': None,
            'tipo_servico': "Baixa Definitiva",
            'data_servico': date.today().isoformat(),
            'inspetor_responsavel': get_user_display_name(),
            'empresa_executante': None,
            'data_proxima_inspecao': None,
            'data_proxima_manutencao_2_nivel': None,
            'data_proxima_manutencao_3_nivel': None,
            'data_ultimo_ensaio_hidrostatico': None,
            'aprovado_inspecao': "N/A",
            'observacoes_gerais': f"EQUIPAMENTO BAIXADO - {reason}",
            'plano_de_acao': f"BAIXADO DEFINITIVAMENTE - SUBSTITUTO: {substitute_id or 'AGUARDANDO'}",
            'link_relatorio_pdf': None,
            'latitude': None,
            'longitude': None,
            'link_foto_nao_conformidade': None
        }

        save_inspection(disposal_record)

    except Exception as e:
        st.error(f"Erro ao marcar equipamento como baixado: {e}")
