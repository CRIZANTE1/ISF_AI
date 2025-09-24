import streamlit as st
import json
from datetime import date
from dateutil.relativedelta import relativedelta
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import SCBA_SHEET_NAME, SCBA_VISUAL_INSPECTIONS_SHEET_NAME, LOG_SCBA_SHEET_NAME
from utils.auditoria import log_action

def save_scba_inspection(record, pdf_link, user_name):
    """
    Salva um novo registro de inspeção de conjunto autônomo na planilha.
    """
    try:
        uploader = GoogleDriveUploader()
        
        data_row = [
            record.get('data_teste'),
            record.get('data_validade'),
            record.get('numero_serie_equipamento'),
            record.get('marca'),
            record.get('modelo'),
            record.get('numero_serie_mascara'),
            record.get('numero_serie_segundo_estagio'),
            record.get('resultado_final'),
            record.get('vazamento_mascara_resultado'),
            record.get('vazamento_mascara_valor'),
            record.get('vazamento_pressao_alta_resultado'),
            record.get('vazamento_pressao_alta_valor'),
            record.get('pressao_alarme_resultado'),
            record.get('pressao_alarme_valor'),
            pdf_link,
            user_name,
            record.get('empresa_executante'),
            record.get('responsavel_tecnico')
        ]
        
        uploader.append_data_to_sheet(SCBA_SHEET_NAME, data_row)
        log_action("SALVOU_INSPECAO_SCBA", f"ID: {record.get('numero_serie_equipamento')}, Resultado: {record.get('resultado_final')}")
        return True

    except Exception as e:
        st.error(f"Erro ao salvar inspeção do SCBA {record.get('numero_serie_equipamento')}: {e}")
        return False


def save_scba_visual_inspection(equipment_id, overall_status, results_dict, inspector_name):
    """
    Salva o resultado de uma inspeção visual periódica de SCBA na planilha.
    """
    try:
        uploader = GoogleDriveUploader()
        today = date.today()
        next_inspection_date = (today + relativedelta(months=3)).isoformat()
        
        results_json = json.dumps(results_dict, ensure_ascii=False)

        data_row = [
            today.isoformat(),
            equipment_id,
            overall_status,
            results_json,
            inspector_name,
            next_inspection_date
        ]
        
        uploader.append_data_to_sheet(SCBA_VISUAL_INSPECTIONS_SHEET_NAME, data_row)
        log_action("SALVOU_INSPECAO_VISUAL_SCBA", f"ID: {equipment_id}, Status: {overall_status}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inspeção visual do SCBA {equipment_id}: {e}")
        return False
        
def save_scba_action_log(equipment_id, problem, action_taken, responsible):
    """
    Salva um registro de ação corretiva para um SCBA no log.
    """
    try:
        uploader = GoogleDriveUploader()
        data_row = [
            date.today().isoformat(),
            equipment_id,
            problem,
            action_taken,
            responsible
        ]
        uploader.append_data_to_sheet(LOG_SCBA_SHEET_NAME, data_row)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar log de ação para o SCBA {equipment_id}: {e}")
        return False     
        
def save_manual_scba(scba_data):
    """
    Salva um novo SCBA manualmente cadastrado.
    
    Args:
        scba_data (dict): Dados do SCBA
    
    Returns:
        bool: True se bem-sucedido, False caso contrário
    """
    try:
        uploader = GoogleDriveUploader()
        
        # Verificar se o número de série já existe
        scba_records = uploader.get_data_from_sheet(SCBA_SHEET_NAME)
        if scba_records and len(scba_records) > 1:
            df = pd.DataFrame(scba_records[1:], columns=scba_records[0])
            if 'numero_serie_equipamento' in df.columns and scba_data['numero_serie_equipamento'] in df['numero_serie_equipamento'].values:
                st.error(f"Erro: SCBA com número de série '{scba_data['numero_serie_equipamento']}' já existe.")
                return False
        
        # Criar linha para a planilha
        # Importante: a ordem dos campos deve corresponder à ordem das colunas na planilha
        today = date.today()
        validade = today + timedelta(days=365)  # Validade padrão de 1 ano
        
        data_row = [
            scba_data.get('data_teste', today.isoformat()),
            validade.isoformat(),  # data_validade
            scba_data['numero_serie_equipamento'],
            scba_data['marca'],
            scba_data['modelo'],
            scba_data.get('numero_serie_mascara', 'N/A'),
            scba_data.get('numero_serie_segundo_estagio', 'N/A'),
            "APTO PARA USO",  # resultado_final padrão para registro manual
            "Aprovado",  # vazamento_mascara_resultado
            "N/A",  # vazamento_mascara_valor
            "Aprovado",  # vazamento_pressao_alta_resultado
            "N/A",  # vazamento_pressao_alta_valor
            "Aprovado",  # pressao_alarme_resultado
            "N/A",  # pressao_alarme_valor
            None,  # link_relatorio_pdf
            get_user_display_name(),  # inspetor_responsavel
            scba_data.get('empresa_executante', "Cadastro Manual"),
            scba_data.get('resp_tecnico', "N/A")
        ]
        
        uploader.append_data_to_sheet(SCBA_SHEET_NAME, [data_row])
        log_action("CADASTROU_SCBA_MANUAL", f"S/N: {scba_data['numero_serie_equipamento']}")
        return True
        
    except Exception as e:
        st.error(f"Erro ao salvar SCBA: {e}")
        return False
