import streamlit as st
import pandas as pd
from datetime import date
from dateutil.relativedelta import relativedelta
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import EXTINGUISHER_SHEET_NAME, LOCATIONS_SHEET_NAME, AUDIT_LOG_SHEET_NAME
from AI.api_Operation import PDFQA
from utils.prompts import get_extinguisher_inspection_prompt
from utils.auditoria import log_action, get_sao_paulo_time_str
from auth.auth_utils import get_user_display_name, get_user_email, get_user_role

# Inicialização de serviços
uploader = GoogleDriveUploader()
pdf_qa = PDFQA()


# Mapeamento de palavras-chave para ações corretivas
ACTION_MAP = {
    "PINTURA": "Programar a repintura corretiva do extintor.",
    "MANÔMETRO": "Realizar a substituição imediata do manômetro.",
    "MANOMETRO": "Realizar a substituição imediata do manômetro.",
    "GATILHO": "Realizar a substituição do conjunto de gatilho.",
    "VÁLVULA": "Verificar e/ou substituir o conjunto da válvula.",
    "VALVULA": "Verificar e/ou substituir o conjunto da válvula.",
    "MANGOTE": "Realizar a substituição da mangueira/mangote.",
    "MANGUEIRA": "Realizar a substituição da mangueira/mangote.",
    "RECARGA": "Enviar o extintor para o processo de recarga.",
    "RECARREGANDO": "Enviar o extintor para o processo de recarga.",
    "LACRE": "Substituir lacre e verificar motivo da violação.",
    "SINALIZAÇÃO": "Corrigir a sinalização de piso e/ou parede do equipamento.",
    "SINALIZACAO": "Corrigir a sinalização de piso e/ou parede do equipamento.",
    "SUPORTE": "Verificar e/ou substituir o suporte de parede/piso.",
    "OBSTRUÇÃO": "Desobstruir o acesso ao equipamento e garantir visibilidade.",
    "OBSTRUCAO": "Desobstruir o acesso ao equipamento e garantir visibilidade.",
    "DANO VISÍVEL": "Realizar inspeção detalhada para avaliar a integridade do casco. Se necessário, enviar para teste hidrostático.",
    "DANO VISIVEL": "Realizar inspeção detalhada para avaliar a integridade do casco. Se necessário, enviar para teste hidrostático.",
    "VENCIDO": "Retirar de uso e enviar para manutenção (Nível 2 ou 3) imediatamente.",
    "CORROSÃO": "Avaliar extensão da corrosão. Se superficial, limpar e pintar. Se profunda, reprovar equipamento.",
    "CORROSAO": "Avaliar extensão da corrosão. Se superficial, limpar e pintar. Se profunda, reprovar equipamento.",
}

# Intervalos de manutenção por tipo de serviço
MAINTENANCE_INTERVALS = {
    "Inspeção": {"next_inspection": 1},  # meses
    "Manutenção Nível 2": {"next_inspection": 1, "next_level2": 12},  # meses
    "Manutenção Nível 3": {"next_inspection": 1, "next_level2": 12, "next_level3": 60},  # meses (5 anos)
    "Substituição": {"next_inspection": 1},  # meses
}



def generate_action_plan(record):
    """
    Gera um plano de ação padronizado e detalhado com base no status e observações.
    
    Args:
        record (dict): Registro da inspeção contendo 'aprovado_inspecao' e 'observacoes_gerais'
        
    Returns:
        str: Plano de ação formatado
    """
    aprovado = record.get('aprovado_inspecao', '').strip()
    observacoes = str(record.get('observacoes_gerais', '')).upper().strip()

    # Caso 1: Equipamento aprovado
    if aprovado == "Sim":
        return "Manter em monitoramento periódico."

    # Caso 2: Equipamento não aprovado
    if aprovado == "Não":
        # Busca ação específica no mapa
        for keyword, plan in ACTION_MAP.items():
            if keyword in observacoes:
                return plan
        
        # Se nenhuma palavra-chave for encontrada, retorna ação genérica
        if observacoes:
            return f"Analisar e corrigir a não conformidade reportada: '{record.get('observacoes_gerais', 'Não especificado')}'"
        else:
            return "Equipamento reprovado. Avaliar não conformidade e tomar ação corretiva apropriada."
    
    # Caso 3: Status indefinido
    return "N/A"


# ==============================================================================
# FUNÇÕES DE CÁLCULO DE DATAS
# ==============================================================================

def calculate_next_dates(service_date_str, service_level, existing_dates=None):
    """
    Calcula as próximas datas de vencimento baseado no tipo de serviço realizado.
    Preserva datas de níveis superiores quando aplicável.
    
    Args:
        service_date_str (str): Data do serviço no formato ISO (YYYY-MM-DD)
        service_level (str): Tipo de serviço realizado
        existing_dates (dict, optional): Datas existentes a preservar
        
    Returns:
        dict: Dicionário com as novas datas calculadas
    """
    if not service_date_str:
        return {}
    
    try:
        service_date = pd.to_datetime(service_date_str).date()
    except (ValueError, TypeError):
        st.warning(f"Data de serviço inválida: {service_date_str}")
        return {}

    # Inicializa com datas existentes ou dicionário vazio
    dates = existing_dates.copy() if existing_dates else {}

    # Aplica regras de cálculo baseado no tipo de serviço
    if service_level == "Manutenção Nível 3":
        # Renova todas as datas
        dates['data_proxima_inspecao'] = service_date + relativedelta(months=1)
        dates['data_proxima_manutencao_2_nivel'] = service_date + relativedelta(months=12)
        dates['data_proxima_manutencao_3_nivel'] = service_date + relativedelta(years=5)
        dates['data_ultimo_ensaio_hidrostatico'] = service_date
    
    elif service_level == "Manutenção Nível 2":
        # Renova inspeção mensal e N2, preserva N3 se existir
        dates['data_proxima_inspecao'] = service_date + relativedelta(months=1)
        dates['data_proxima_manutencao_2_nivel'] = service_date + relativedelta(months=12)
        # Não altera data_proxima_manutencao_3_nivel nem data_ultimo_ensaio_hidrostatico

    elif service_level in ["Inspeção", "Substituição"]:
        # Renova apenas a inspeção mensal
        dates['data_proxima_inspecao'] = service_date + relativedelta(months=1)
        # Preserva todas as outras datas

    # Normaliza todas as datas para string formato ISO ou None
    normalized_dates = {}
    for key, value in dates.items():
        if pd.isna(value) or value is None:
            normalized_dates[key] = None
        elif isinstance(value, (date, pd.Timestamp)):
            normalized_dates[key] = value.strftime('%Y-%m-%d')
        elif isinstance(value, str):
            try:
                # Valida e reformata string de data
                parsed_date = pd.to_datetime(value)
                normalized_dates[key] = parsed_date.strftime('%Y-%m-%d')
            except (ValueError, TypeError):
                normalized_dates[key] = None
        else:
            normalized_dates[key] = None

    return normalized_dates


# ==============================================================================
# FUNÇÕES DE PROCESSAMENTO COM IA
# ==============================================================================

def process_extinguisher_pdf(uploaded_file):
    """
    Processa um PDF de inspeção de extintor usando IA para extrair dados em lote.
    
    Args:
        uploaded_file: Arquivo PDF enviado via st.file_uploader
        
    Returns:
        list: Lista de dicionários com dados extraídos ou None em caso de erro
    """
    if not uploaded_file:
        return None
    
    with st.spinner("Analisando PDF com IA..."):
        prompt = get_extinguisher_inspection_prompt()
        extracted_data = pdf_qa.extract_structured_data(uploaded_file, prompt)
        
        if extracted_data and "extintores" in extracted_data and isinstance(extracted_data["extintores"], list):
            st.success(f"✅ {len(extracted_data['extintores'])} extintores identificados no documento.")
            return extracted_data["extintores"]
        else:
            st.error("A IA não retornou os dados no formato esperado (uma lista de extintores).")
            if extracted_data:
                with st.expander("🔍 Ver resposta da IA (debug)"):
                    st.json(extracted_data)
            return None


def clean_and_prepare_ia_data(ia_item):
    """
    Limpa e prepara um item extraído pela IA.
    Remove horas de campos de data e valida estrutura.
    
    Args:
        ia_item (dict): Item extraído pela IA
        
    Returns:
        dict: Item limpo e validado ou None se inválido
    """
    if not isinstance(ia_item, dict):
        st.warning("Item da IA não é um dicionário válido.")
        return None

    cleaned_item = ia_item.copy()

    # Limpa os campos de data, removendo a hora e validando formato
    for key, value in list(cleaned_item.items()):
        if 'data' in key and isinstance(value, str):
            try:
                # Converte a string para data e formata de volta para YYYY-MM-DD
                clean_date = pd.to_datetime(value).strftime('%Y-%m-%d')
                cleaned_item[key] = clean_date
            except (ValueError, TypeError):
                # Se a conversão falhar, define como None
                cleaned_item[key] = None
                st.warning(f"Data inválida no campo '{key}': {value}")
    
    return cleaned_item



def save_inspection(data):
    """
    Salva os dados de UMA inspeção no Google Sheets.
    Garante serialização correta e tratamento de valores nulos.
    
    Args:
        data (dict): Dicionário com todos os campos da inspeção
        
    Returns:
        bool: True se salvou com sucesso, False caso contrário
    """
    
    def to_safe_string(value):
        """Converte valor para string segura para o Sheets"""
        if pd.isna(value) or value is None:
            return None
        if isinstance(value, (pd.Timestamp, date)):
            return value.strftime('%Y-%m-%d')
        return str(value)

    # Trata coordenadas GPS com vírgula como separador decimal (padrão BR)
    lat = data.get('latitude')
    lon = data.get('longitude')

    lat_str = str(lat).replace('.', ',') if lat is not None else None
    lon_str = str(lon).replace('.', ',') if lon is not None else None

    # Monta linha de dados na ordem correta das colunas
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
        # ✅ CORREÇÃO: Cria uploader dentro da função
        uploader = GoogleDriveUploader()
        uploader.append_data_to_sheet(EXTINGUISHER_SHEET_NAME, [data_row])
        
        log_action(
            "SALVOU_INSPECAO_EXTINTOR", 
            f"ID: {data.get('numero_identificacao')}, Status: {data.get('aprovado_inspecao')}, Tipo: {data.get('tipo_servico')}"
        )
        return True
        
    except Exception as e:
        st.error(f"Erro ao salvar dados do equipamento {data.get('numero_identificacao')}: {e}")
        import traceback
        st.error(traceback.format_exc())
        return False

def save_inspection_batch(inspections_list):
    """
    Salva múltiplas inspeções de uma vez (batch).
    Mais eficiente que múltiplas chamadas individuais.
    
    Args:
        inspections_list (list): Lista de dicionários de inspeções
        
    Returns:
        tuple: (sucesso: bool, quantidade_salva: int)
    """
    if not inspections_list:
        return False, 0
    
    try:
        rows = []
        for inspection in inspections_list:
            # Reutiliza a lógica de conversão do save_inspection
            lat = inspection.get('latitude')
            lon = inspection.get('longitude')
            lat_str = str(lat).replace('.', ',') if lat is not None else None
            lon_str = str(lon).replace('.', ',') if lon is not None else None
            
            row = [
                str(v) if v is not None else None 
                for v in [
                    inspection.get('numero_identificacao'),
                    inspection.get('numero_selo_inmetro'),
                    inspection.get('tipo_agente'),
                    inspection.get('capacidade'),
                    inspection.get('marca_fabricante'),
                    inspection.get('ano_fabricacao'),
                    inspection.get('tipo_servico'),
                    inspection.get('data_servico'),
                    inspection.get('inspetor_responsavel'),
                    inspection.get('empresa_executante'),
                    inspection.get('data_proxima_inspecao'),
                    inspection.get('data_proxima_manutencao_2_nivel'),
                    inspection.get('data_proxima_manutencao_3_nivel'),
                    inspection.get('data_ultimo_ensaio_hidrostatico'),
                    inspection.get('aprovado_inspecao'),
                    inspection.get('observacoes_gerais'),
                    inspection.get('plano_de_acao'),
                    inspection.get('link_relatorio_pdf'),
                ]
            ] + [lat_str, lon_str, str(inspection.get('link_foto_nao_conformidade')) if inspection.get('link_foto_nao_conformidade') else None]
            
            rows.append(row)
        
        # ✅ CORREÇÃO: Cria uploader dentro da função
        uploader = GoogleDriveUploader()
        uploader.append_data_to_sheet(EXTINGUISHER_SHEET_NAME, rows)
        
        log_action(
            "SALVOU_INSPECAO_EXTINTOR_LOTE", 
            f"Total: {len(inspections_list)} inspeções salvas em lote"
        )
        
        return True, len(inspections_list)
        
    except Exception as e:
        st.error(f"Erro ao salvar lote de inspeções: {e}")
        import traceback
        st.error(traceback.format_exc())
        return False, 0



def save_new_location(location_id, description):
    """
    Salva um novo local na planilha 'locais'.
    
    Args:
        location_id (str): ID único do local
        description (str): Descrição/nome do local
        
    Returns:
        bool: True se salvou com sucesso, False caso contrário
    """
    try:
        # ✅ CORREÇÃO: Cria uploader dentro da função
        uploader = GoogleDriveUploader()
        
        # Verifica se o ID já existe
        locations_data = uploader.get_data_from_sheet(LOCATIONS_SHEET_NAME)
        if locations_data and len(locations_data) > 1:
            df = pd.DataFrame(locations_data[1:], columns=locations_data[0])
            if location_id in df['id'].values:
                st.error(f"❌ Erro: O ID de Local '{location_id}' já existe.")
                return False
        
        uploader.append_data_to_sheet(LOCATIONS_SHEET_NAME, [[location_id, description]])
        log_action("CADASTROU_LOCAL", f"ID: {location_id}, Nome: {description}")
        return True
        
    except Exception as e:
        st.error(f"Erro ao salvar novo local: {e}")
        import traceback
        st.error(traceback.format_exc())
        return False
        
def save_new_extinguisher(details_dict):
    """
    Salva um novo extintor na planilha 'extintores'.
    Cria registro inicial com status "Cadastro".
    
    Args:
        details_dict (dict): Dicionário com dados básicos do extintor
        
    Returns:
        bool: True se salvou com sucesso, False caso contrário
    """
    try:
        # ✅ CORREÇÃO: Cria uploader dentro da função
        uploader = GoogleDriveUploader()
        
        ext_id = details_dict.get('numero_identificacao')
        
        # Verifica se o ID já existe
        ext_data = uploader.get_data_from_sheet(EXTINGUISHER_SHEET_NAME)
        if ext_data and len(ext_data) > 1:
            df = pd.DataFrame(ext_data[1:], columns=ext_data[0])
            if ext_id in df['numero_identificacao'].values:
                st.error(
                    f"❌ Erro: O ID de Extintor '{ext_id}' já está cadastrado. "
                    f"Use a aba de 'Inspeção' para atualizar seu status."
                )
                return False

        # Monta registro inicial
        data_row = [
            ext_id,
            details_dict.get('numero_selo_inmetro'),
            details_dict.get('tipo_agente'),
            details_dict.get('capacidade'),
            details_dict.get('marca_fabricante'),
            details_dict.get('ano_fabricacao'),
            "Cadastro",  # tipo_servico
            date.today().isoformat(),  # data_servico
            get_user_display_name(),  # inspetor_responsavel
            None,  # empresa_executante
            (date.today() + relativedelta(months=1)).isoformat(),  # data_proxima_inspecao
            None, None, None,  # datas de manutenção N2, N3, TH
            "N/A",  # aprovado_inspecao
            "Equipamento recém-cadastrado no sistema.",  # observacoes_gerais
            "Aguardando primeira inspeção.",  # plano_de_acao
            None, None, None, None  # links e geo
        ]
        
        uploader.append_data_to_sheet(EXTINGUISHER_SHEET_NAME, [data_row])
        log_action("CADASTROU_EXTINTOR", f"ID: {ext_id}")
        return True
        
    except Exception as e:
        st.error(f"Erro ao salvar novo extintor: {e}")
        import traceback
        st.error(traceback.format_exc())
        return False


def update_extinguisher_location(equip_id, location_desc):
    """
    Atualiza o local de um equipamento existente ou adiciona um novo registro
    na planilha 'locais'. (Lógica de Upsert)
    
    Args:
        equip_id (str): ID do equipamento
        location_desc (str): Descrição do local
        
    Returns:
        bool: True se atualizou com sucesso, False caso contrário
    """
    try:
        # ✅ CORREÇÃO: Cria uploader dentro da função
        uploader = GoogleDriveUploader()
        
        df_locais = pd.DataFrame()
        
        # Carrega os dados existentes para verificação
        locais_data = uploader.get_data_from_sheet(LOCATIONS_SHEET_NAME)
        if locais_data and len(locais_data) > 1:
            df_locais = pd.DataFrame(locais_data[1:], columns=locais_data[0])
            df_locais['id'] = df_locais['id'].astype(str)

        if df_locais.empty or 'id' not in df_locais.columns:
            # Planilha vazia ou mal formatada, apenas adiciona
            uploader.append_data_to_sheet(LOCATIONS_SHEET_NAME, [[equip_id, location_desc]])
            log_action("ASSOCIOU_LOCAL_EXTINTOR", f"ID: {equip_id}, Local: {location_desc}")
            return True
        else:
            existing_row = df_locais[df_locais['id'] == str(equip_id)]
            
            if not existing_row.empty:
                # Atualiza registro existente
                row_index = existing_row.index[0] + 2  # +1 para cabeçalho, +1 para base 0
                range_to_update = f"B{row_index}"  # Atualiza apenas a coluna B (local)
                uploader.update_cells(LOCATIONS_SHEET_NAME, range_to_update, [[location_desc]])
                log_action("ATUALIZOU_LOCAL_EXTINTOR", f"ID: {equip_id}, Novo Local: {location_desc}")
                return True
            else:
                # Adiciona nova linha
                uploader.append_data_to_sheet(LOCATIONS_SHEET_NAME, [[equip_id, location_desc]])
                log_action("ASSOCIOU_LOCAL_EXTINTOR", f"ID: {equip_id}, Local: {location_desc}")
                return True
                
    except Exception as e:
        st.error(f"Erro ao salvar local para o equipamento '{equip_id}': {e}")
        import traceback
        st.error(traceback.format_exc())
        return False



def batch_regularize_monthly_inspections(df_all_extinguishers):
    """
    Encontra extintores com inspeção mensal vencida E que estavam 'Aprovado'
    na última verificação, cria novos registros de inspeção "Aprovado" e LOGA CADA AÇÃO.
    
    Args:
        df_all_extinguishers (pd.DataFrame): DataFrame com todo o histórico de extintores
        
    Returns:
        int: Número de extintores regularizados ou -1 em caso de erro
    """
    if df_all_extinguishers.empty:
        st.warning("Não há extintores cadastrados para regularizar.")
        return 0

    # Pega apenas o último registro de cada extintor
    latest_records = (
        df_all_extinguishers
        .sort_values(by='data_servico', ascending=False)
        .drop_duplicates(subset=['numero_identificacao'], keep='first')
        .copy()
    )
    
    # Converte datas
    latest_records['data_proxima_inspecao'] = pd.to_datetime(
        latest_records['data_proxima_inspecao'], 
        errors='coerce'
    )
    today = pd.Timestamp(date.today())

    # Filtra extintores que atendem aos critérios
    vencidos_e_aprovados = latest_records[
        (latest_records['data_proxima_inspecao'] < today) &
        (latest_records['plano_de_acao'] != 'FORA DE OPERAÇÃO (SUBSTITUÍDO)') &
        (latest_records['aprovado_inspecao'] == 'Sim')
    ]

    if vencidos_e_aprovados.empty:
        st.success("✅ Nenhuma inspeção mensal (de equipamentos previamente aprovados) está vencida. Tudo em dia!")
        return 0

    # Prepara dados para salvamento em lote
    new_inspection_rows = []
    audit_log_rows = []
    
    user_name = get_user_display_name()
    user_email = get_user_email()
    user_role = get_user_role()
    current_time_str = get_sao_paulo_time_str()
    current_unit = st.session_state.get('current_unit_name', 'N/A')

    with st.spinner(f"Regularizando {len(vencidos_e_aprovados)} extintores..."):
        for _, original_record in vencidos_e_aprovados.iterrows():
            new_record = original_record.copy()
            
            # Atualiza campos da nova inspeção
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

            # Preserva datas de N2, N3 e TH
            existing_dates = {
                'data_proxima_manutencao_2_nivel': original_record.get('data_proxima_manutencao_2_nivel'),
                'data_proxima_manutencao_3_nivel': original_record.get('data_proxima_manutencao_3_nivel'),
                'data_ultimo_ensaio_hidrostatico': original_record.get('data_ultimo_ensaio_hidrostatico'),
            }
            
            # Calcula apenas nova data de inspeção mensal
            updated_dates = calculate_next_dates(
                service_date_str=new_record['data_servico'],
                service_level="Inspeção",
                existing_dates=existing_dates
            )
            new_record.update(updated_dates)

            # Prepara linha para salvar
            new_inspection_rows.append([
                new_record.get('numero_identificacao'), 
                new_record.get('numero_selo_inmetro'),
                new_record.get('tipo_agente'), 
                new_record.get('capacidade'), 
                new_record.get('marca_fabricante'),
                new_record.get('ano_fabricacao'), 
                new_record.get('tipo_servico'), 
                new_record.get('data_servico'),
                new_record.get('inspetor_responsavel'), 
                new_record.get('empresa_executante'),
                new_record.get('data_proxima_inspecao'), 
                new_record.get('data_proxima_manutencao_2_nivel'),
                new_record.get('data_proxima_manutencao_3_nivel'), 
                new_record.get('data_ultimo_ensaio_hidrostatico'),
                new_record.get('aprovado_inspecao'), 
                new_record.get('observacoes_gerais'),
                new_record.get('plano_de_acao'), 
                new_record.get('link_relatorio_pdf'),
                str(new_record.get('latitude', '')).replace('.', ','), 
                str(new_record.get('longitude', '')).replace('.', ','), 
                new_record.get('link_foto_nao_conformidade')
            ])

            # Prepara linha de auditoria
            audit_log_rows.append([
                current_time_str,
                user_email or "não logado",
                user_role,
                "REGULARIZOU_INSPECAO_EXTINTOR_MASSA",
                f"ID: {new_record.get('numero_identificacao')}",
                current_unit
            ])

    try:
        # ✅ CORREÇÃO: Cria uploader dentro da função para extintores
        extinguisher_uploader = GoogleDriveUploader()
        extinguisher_uploader.append_data_to_sheet(EXTINGUISHER_SHEET_NAME, new_inspection_rows)
        
        # ✅ CORREÇÃO: Cria uploader separado para a planilha matriz (auditoria)
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        matrix_uploader.append_data_to_sheet(AUDIT_LOG_SHEET_NAME, audit_log_rows)

        st.success(f"✅ {len(vencidos_e_aprovados)} extintores regularizados com sucesso!")
        return len(vencidos_e_aprovados)
        
    except Exception as e:
        st.error(f"❌ Ocorreu um erro durante a regularização em massa: {e}")
        import traceback
        st.error(traceback.format_exc())
        
        # Log do erro para auditoria (tenta salvar mesmo se falhou a regularização)
        try:
            error_log_row = [
                current_time_str,
                user_email or "não logado",
                user_role,
                "FALHA_REGULARIZACAO_MASSA",
                f"Erro: {str(e)[:200]}",
                current_unit
            ]
            matrix_uploader = GoogleDriveUploader(is_matrix=True)
            matrix_uploader.append_data_to_sheet(AUDIT_LOG_SHEET_NAME, [error_log_row])
        except:
            pass  
            
        return -1
