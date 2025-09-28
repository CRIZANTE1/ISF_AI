import streamlit as st
from datetime import date
import pandas as pd
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import EXTINGUISHER_DISPOSAL_LOG_SHEET_NAME, EXTINGUISHER_SHEET_NAME
from auth.auth_utils import get_user_display_name
from utils.auditoria import log_action
from operations.photo_operations import upload_evidence_photo

def register_extinguisher_disposal(equipment_id, condemnation_reason, substitute_id=None, observations="", photo_evidence=None):
    """
    Registra a baixa definitiva de um extintor condenado.
    
    Args:
        equipment_id (str): ID do extintor a ser baixado
        condemnation_reason (str): Motivo da condenação
        substitute_id (str, optional): ID do extintor substituto
        observations (str): Observações adicionais
        photo_evidence: Arquivo de foto como evidência
    
    Returns:
        bool: True se bem-sucedido, False caso contrário
    """
    try:
        uploader = GoogleDriveUploader()
        
        # Upload da foto de evidência se fornecida
        photo_link = None
        if photo_evidence:
            photo_link = upload_evidence_photo(
                photo_evidence, 
                equipment_id, 
                "baixa_condenacao"
            )
        
        # Registra a baixa no log
        disposal_row = [
            date.today().isoformat(),
            equipment_id,
            condemnation_reason,
            get_user_display_name(),
            substitute_id if substitute_id else "",
            observations,
            photo_link if photo_link else ""
        ]
        
        uploader.append_data_to_sheet(EXTINGUISHER_DISPOSAL_LOG_SHEET_NAME, [disposal_row])
        
        # Marca o equipamento como "BAIXADO" no sistema principal
        _mark_equipment_as_disposed(equipment_id, condemnation_reason, substitute_id)
        
        # Log de auditoria
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

def get_disposed_extinguishers():
    """
    Retorna a lista de extintores baixados.
    
    Returns:
        pd.DataFrame: DataFrame com extintores baixados
    """
    try:
        uploader = GoogleDriveUploader()
        disposal_data = uploader.get_data_from_sheet(EXTINGUISHER_DISPOSAL_LOG_SHEET_NAME)
        
        if not disposal_data or len(disposal_data) < 2:
            return pd.DataFrame()
            
        df = pd.DataFrame(disposal_data[1:], columns=disposal_data[0])
        return df
        
    except Exception as e:
        st.error(f"Erro ao carregar registros de baixa: {e}")
        return pd.DataFrame()

def is_equipment_disposed(equipment_id):
    """
    Verifica se um equipamento já foi baixado.
    
    Args:
        equipment_id (str): ID do equipamento
        
    Returns:
        bool: True se foi baixado, False caso contrário
    """
    df_disposed = get_disposed_extinguishers()
    if df_disposed.empty:
        return False
        
    return equipment_id in df_disposed['numero_identificacao'].values
