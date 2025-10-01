import streamlit as st
import pandas as pd
from datetime import date
from dateutil.relativedelta import relativedelta
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import EXTINGUISHER_SHEET_NAME, LOCATIONS_SHEET_NAME 
from AI.api_Operation import PDFQA
from utils.prompts import get_extinguisher_inspection_prompt
from utils.auditoria import log_action, get_sao_paulo_time_str
from auth.auth_utils import get_user_display_name, get_user_email, get_user_role
from utils.auditoria import log_action

uploader = GoogleDriveUploader()
pdf_qa = PDFQA()

def generate_action_plan(record):
    """
    Gera um plano de ação padronizado e mais detalhado com base no status e nas observações.
    """
    aprovado = record.get('aprovado_inspecao')
    observacoes = str(record.get('observacoes_gerais', '')).upper()

    if aprovado == "Sim":
        return "Manter em monitoramento periódico."

    if aprovado == "Não":
        action_map = {
            "PINTURA": "Programar a repintura corretiva do extintor.",
            "MANÔMETRO": "Realizar a substituição imediata do manômetro.",
            "GATILHO": "Realizar a substituição do conjunto de gatilho.",
            "VÁLVULA": "Verificar e/ou substituir o conjunto da válvula.",
            "MANGOTE": "Realizar a substituição da mangueira/mangote.",
            "MANGUEIRA": "Realizar a substituição da mangueira/mangote.",
            "RECARGA": "Enviar o extintor para o processo de recarga.",
            "RECARREGANDO": "Enviar o extintor para o processo de recarga.",
            "LACRE": "Substituir lacre e verificar motivo da violação.",
            "SINALIZAÇÃO": "Corrigir a sinalização de piso e/ou parede do equipamento.",
            "SUPORTE": "Verificar e/ou substituir o suporte de parede/piso.",
            "OBSTRUÇÃO": "Desobstruir o acesso ao equipamento e garantir visibilidade.",
            "DANO VISÍVEL": "Realizar inspeção detalhada para avaliar a integridade do casco. Se necessário, enviar para teste hidrostático.",
            "VENCIDO": "Retirar de uso e enviar para manutenção (Nível 2 ou 3) imediatamente."
        }

        # Itera sobre o mapa de ações e retorna o primeiro plano correspondente
        for keyword, plan in action_map.items():
            if keyword in observacoes:
                return plan
        
        # Se nenhuma palavra-chave for encontrada, retorna um plano de ação genérico, mas informativo.
        return f"Analisar e corrigir a não conformidade reportada: '{record.get('observacoes_gerais', '')}'"
    
    return "N/A" # Caso o status não seja 'Sim' ou 'Não'


def calculate_next_dates(service_date_str, service_level, existing_dates=None):
    """
    Calcula as próximas datas de serviço, retornando-as como strings formatadas.
    """
    if not service_date_str: return {}
        
    try:
        service_date = pd.to_datetime(service_date_str).date()
    except (ValueError, TypeError):
        return {} 

    dates = existing_dates.copy() if existing_dates else {}

    # Função auxiliar para converter datetime para string 'YYYY-MM-DD' ou None
    def to_iso_string(dt_object):
        return dt_object.isoformat() if dt_object else None

    if service_level == "Manutenção Nível 3":
        dates['data_proxima_inspecao'] = (service_date + relativedelta(months=1))
        dates['data_proxima_manutencao_2_nivel'] = (service_date + relativedelta(months=12))
        dates['data_proxima_manutencao_3_nivel'] = (service_date + relativedelta(years=5))
        dates['data_ultimo_ensaio_hidrostatico'] = service_date
    
    elif service_level == "Manutenção Nível 2":
        dates['data_proxima_inspecao'] = (service_date + relativedelta(months=1))
        dates['data_proxima_manutencao_2_nivel'] = (service_date + relativedelta(months=12))

    elif service_level in ["Inspeção", "Substituição"]:
        dates['data_proxima_inspecao'] = (service_date + relativedelta(months=1))

    # Converte todos os valores de data no dicionário para string ou None antes de retornar
    for key, value in dates.items():
        if isinstance(value, (date, pd.Timestamp)):
            dates[key] = value.strftime('%Y-%m-%d')
        elif isinstance(value, str):
            # Garante que as strings de data já existentes também não tenham hora
            try:
                dates[key] = pd.to_datetime(value).strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                dates[key] = None # Se for uma string inválida, anula
        elif pd.isna(value):
            dates[key] = None

    return dates
    
def process_extinguisher_pdf(uploaded_file):
    """Processa um PDF de inspeção de extintor usando IA para extrair dados em lote."""
    if uploaded_file:
        prompt = get_extinguisher_inspection_prompt()
        extracted_data = pdf_qa.extract_structured_data(uploaded_file, prompt)
        if extracted_data and "extintores" in extracted_data and isinstance(extracted_data["extintores"], list):
            return extracted_data["extintores"]
        else:
            st.error("A IA não retornou os dados no formato esperado (uma lista de extintores).")
            st.json(extracted_data)
            return None
    return None



def save_inspection(data):
    """Salva os dados de UMA inspeção no Google Sheets, garantindo a serialização correta dos dados."""
    
    def to_safe_string(value):
        if pd.isna(value) or value is None:
            return None
        if isinstance(value, (pd.Timestamp, date)):
            return value.strftime('%Y-%m-%d')
        return str(value)

    lat = data.get('latitude')
    lon = data.get('longitude')

    lat_str = str(lat).replace('.', ',') if lat is not None else None
    lon_str = str(lon).replace('.', ',') if lon is not None else None

    data_row = [
        to_safe_string(data.get('numero_identificacao')),
        to_safe_string(data.get('numero_selo_inmetro')),
        to_safe_string(data.get('tipo_agente')),
        to_safe_string(data.get('capacidade')),
        to_safe_string(data.get('marca_fabricante')),
        to_safe_string(data.get('ano_fabricacao')),
        to_safe_string(data.get('tipo_servico')),
        to_safe_string(data.get('data_servico')),
        to_safe_string(data.get('inspetor_responsavel')),
        to_safe_string(data.get('empresa_executante')),
        to_safe_string(data.get('data_proxima_inspecao')),
        to_safe_string(data.get('data_proxima_manutencao_2_nivel')),
        to_safe_string(data.get('data_proxima_manutencao_3_nivel')),
        to_safe_string(data.get('data_ultimo_ensaio_hidrostatico')),
        to_safe_string(data.get('aprovado_inspecao')),
        to_safe_string(data.get('observacoes_gerais')),
        to_safe_string(data.get('plano_de_acao')),
        to_safe_string(data.get('link_relatorio_pdf')),
        lat_str, 
        lon_str, 
        to_safe_string(data.get('link_foto_nao_conformidade'))
    ]
    
    try:
        uploader = GoogleDriveUploader()
        uploader.append_data_to_sheet(EXTINGUISHER_SHEET_NAME, data_row)
        log_action("SALVOU_INSPECAO_EXTINTOR", f"ID: {data.get('numero_identificacao')}, Status: {data.get('aprovado_inspecao')}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar dados do equipamento {data.get('numero_identificacao')}: {e}")
        return False


def clean_and_prepare_ia_data(ia_item):
    """
    Limpa e prepara um item extraído pela IA.
    - Converte campos de data para o formato YYYY-MM-DD.
    - Garante que campos essenciais existam.
    """
    if not isinstance(ia_item, dict):
        return None

    cleaned_item = ia_item.copy()

    # Limpa os campos de data, removendo a hora
    for key, value in cleaned_item.items():
        if 'data' in key and isinstance(value, str):
            try:
                # Converte a string para data e formata de volta para YYYY-MM-DD
                clean_date = pd.to_datetime(value).strftime('%Y-%m-%d')
                cleaned_item[key] = clean_date
            except (ValueError, TypeError):
                # Se a conversão falhar, define como None para evitar erros
                cleaned_item[key] = None
    
    return cleaned_item
def save_new_location(location_id, description):
    """Salva um novo local na planilha 'locais'."""
    try:
        uploader = GoogleDriveUploader()
        # Verifica se o ID já existe
        locations_data = uploader.get_data_from_sheet(LOCATIONS_SHEET_NAME)
        if locations_data and len(locations_data) > 1:
            df = pd.DataFrame(locations_data[1:], columns=locations_data[0])
            if location_id in df['id_local'].values:
                st.error(f"Erro: O ID de Local '{location_id}' já existe.")
                return False
        
        uploader.append_data_to_sheet(LOCATIONS_SHEET_NAME, [location_id, description])
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo local: {e}")
        return False

def save_new_extinguisher(details_dict):
    """Salva um novo extintor na planilha 'extintores'."""
    try:
        uploader = GoogleDriveUploader()
        ext_id = details_dict.get('numero_identificacao')
        
        # Verifica se o ID já existe
        ext_data = uploader.get_data_from_sheet(EXTINGUISHER_SHEET_NAME)
        if ext_data and len(ext_data) > 1:
            df = pd.DataFrame(ext_data[1:], columns=ext_data[0])
            if ext_id in df['numero_identificacao'].values:
                st.error(f"Erro: O ID de Extintor '{ext_id}' já está cadastrado. Use a aba de 'Inspeção' para atualizar seu status.")
                return False

        data_row = [
            ext_id,
            details_dict.get('numero_selo_inmetro'),
            details_dict.get('tipo_agente'),
            details_dict.get('capacidade'),
            details_dict.get('marca_fabricante'),
            details_dict.get('ano_fabricacao'),
            "Cadastro", # tipo_servico
            date.today().isoformat(), # data_servico
            get_user_display_name(), # inspetor_responsavel
            None, # empresa_executante
            (date.today() + relativedelta(months=1)).isoformat(), # data_proxima_inspecao
            None, None, None, # datas de manutenção N2, N3, TH
            "N/A", # aprovado_inspecao
            "Equipamento recém-cadastrado no sistema.", # observacoes_gerais
            "Aguardando primeira inspeção.", # plano_de_acao
            None, None, None, None # links e geo
        ]
        uploader.append_data_to_sheet(EXTINGUISHER_SHEET_NAME, data_row)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo extintor: {e}")
        return False

def update_extinguisher_location(equip_id, location_desc):
    """
    Atualiza o local de um equipamento existente ou adiciona um novo registro
    na planilha 'locais'. (Lógica de Upsert)
    """
    try:
        uploader = GoogleDriveUploader()
        df_locais = pd.DataFrame()
        
        # Carrega os dados existentes para verificação
        locais_data = uploader.get_data_from_sheet(LOCATIONS_SHEET_NAME)
        if locais_data and len(locais_data) > 1:
            df_locais = pd.DataFrame(locais_data[1:], columns=locais_data[0])
            df_locais['id'] = df_locais['id'].astype(str)

        if df_locais.empty or 'id' not in df_locais.columns:
            # Planilha vazia ou mal formatada, apenas adiciona
            uploader.append_data_to_sheet(LOCATIONS_SHEET_NAME, [equip_id, location_desc])
            return True
        else:
            existing_row = df_locais[df_locais['id'] == str(equip_id)]
            
            if not existing_row.empty:
                row_index = existing_row.index[0] + 2  # +1 para cabeçalho, +1 para base 0
                range_to_update = f"B{row_index}"  # Atualiza apenas a coluna B (local)
                uploader.update_cells(LOCATIONS_SHEET_NAME, range_to_update, [[location_desc]])
                return True
            else:
                # Adiciona nova linha
                uploader.append_data_to_sheet(LOCATIONS_SHEET_NAME, [equip_id, location_desc])
                return True
    except Exception as e:
        st.error(f"Erro ao salvar local para o equipamento '{equip_id}': {e}")
        return False

def batch_regularize_monthly_inspections(df_all_extinguishers):
    """
    Encontra extintores com inspeção mensal vencida E que estavam 'Aprovado'
    na última verificação, cria novos registros de inspeção "Aprovado" e LOGA CADA AÇÃO.
    Retorna o número de extintores regularizados.
    """
    if df_all_extinguishers.empty:
        st.warning("Não há extintores cadastrados para regularizar.")
        return 0

    latest_records = df_all_extinguishers.sort_values(by='data_servico', ascending=False).drop_duplicates(subset=['numero_identificacao'], keep='first').copy()
    latest_records['data_proxima_inspecao'] = pd.to_datetime(latest_records['data_proxima_inspecao'], errors='coerce')
    today = pd.Timestamp(date.today())

    vencidos_e_aprovados = latest_records[
        (latest_records['data_proxima_inspecao'] < today) &
        (latest_records['plano_de_acao'] != 'FORA DE OPERAÇÃO (SUBSTITUÍDO)') &
        (latest_records['aprovado_inspecao'] == 'Sim')
    ]

    if vencidos_e_aprovados.empty:
        st.success("✅ Nenhuma inspeção mensal (de equipamentos previamente aprovados) está vencida. Tudo em dia!")
        return 0

    new_inspection_rows = []
    audit_log_rows = []
    user_name = get_user_display_name()
    user_email = get_user_email()
    user_role = get_user_role()
    current_time_str = get_sao_paulo_time_str()
    current_unit = st.session_state.get('current_unit_name', 'N/A')

    for _, original_record in vencidos_e_aprovados.iterrows():
        new_record = original_record.copy()
        
        new_record.update({
            'tipo_servico': "Inspeção",
            'data_servico': date.today().isoformat(),
            'inspetor_responsavel': user_name,
            'aprovado_inspecao': "Sim",
            'observacoes_gerais': "Inspeção mensal de rotina regularizada em massa.",
            'plano_de_acao': "Manter em monitoramento periódico.",
            'link_relatorio_pdf': None,
            'link_foto_nao_conformidade': None
        })

        existing_dates = {
            'data_proxima_manutencao_2_nivel': original_record.get('data_proxima_manutencao_2_nivel'),
            'data_proxima_manutencao_3_nivel': original_record.get('data_proxima_manutencao_3_nivel'),
            'data_ultimo_ensaio_hidrostatico': original_record.get('data_ultimo_ensaio_hidrostatico'),
        }
        updated_dates = calculate_next_dates(
            service_date_str=new_record['data_servico'],
            service_level="Inspeção",
            existing_dates=existing_dates
        )
        new_record.update(updated_dates)

        new_inspection_rows.append([
            new_record.get('numero_identificacao'), new_record.get('numero_selo_inmetro'),
            new_record.get('tipo_agente'), new_record.get('capacidade'), new_record.get('marca_fabricante'),
            new_record.get('ano_fabricacao'), new_record.get('tipo_servico'), new_record.get('data_servico'),
            new_record.get('inspetor_responsavel'), new_record.get('empresa_executante'),
            new_record.get('data_proxima_inspecao'), new_record.get('data_proxima_manutencao_2_nivel'),
            new_record.get('data_proxima_manutencao_3_nivel'), new_record.get('data_ultimo_ensaio_hidrostatico'),
            new_record.get('aprovado_inspecao'), new_record.get('observacoes_gerais'),
            new_record.get('plano_de_acao'), new_record.get('link_relatorio_pdf'),
            str(new_record.get('latitude', '')).replace('.', ','), 
            str(new_record.get('longitude', '')).replace('.', ','), 
            new_record.get('link_foto_nao_conformidade')
        ])

        audit_log_rows.append([
            current_time_str,
            user_email or "não logado",
            user_role,
            "REGULARIZOU_INSPECAO_EXTINTOR_MASSA",
            f"ID: {new_record.get('numero_identificacao')}",
            current_unit
        ])

    try:
        # Salva todos os novos registros de inspeção de uma vez
        uploader = GoogleDriveUploader()
        uploader.append_data_to_sheet(EXTINGUISHER_SHEET_NAME, new_inspection_rows)
        
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        matrix_uploader.append_data_to_sheet(AUDIT_LOG_SHEET_NAME, audit_log_rows)

        return len(vencidos_e_aprovados)
    except Exception as e:
        st.error(f"Ocorreu um erro durante a regularização em massa: {e}")
        return -1


def format_coordinate(coord):
    """
    Formata coordenada preservando precisão decimal e tratando valores inválidos.
    
    Args:
        coord: Coordenada (float, str ou None)
        
    Returns:
        str: Coordenada formatada ou None
    """
    if coord is None or pd.isna(coord):
        return None
    
    # Se for string vazia, retorna None
    if isinstance(coord, str) and coord.strip() == '':
        return None
    
    # Se for string 'None', 'nan', etc, retorna None
    if isinstance(coord, str) and coord.lower() in ['none', 'nan', 'null']:
        return None
    
    try:
        # Converte para float e formata com 6 casas decimais
        coord_float = float(coord) if not isinstance(coord, float) else coord
        
        # Se for zero, retorna None (coordenada não válida)
        if coord_float == 0.0:
            return None
        
        # Usa ponto decimal (padrão internacional)
        return f"{coord_float:.6f}"
    except (ValueError, TypeError):
        return None
