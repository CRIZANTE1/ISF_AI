# operations/extinguisher_operations.py (REFATORADO)

import streamlit as st
import pandas as pd
from datetime import date
from dateutil.relativedelta import relativedelta

# DE: from gdrive.gdrive_upload import GoogleDriveUploader
# DE: from gdrive.config import EXTINGUISHER_SHEET_NAME, LOCATIONS_SHEET_NAME, AUDIT_LOG_SHEET_NAME
# PARA:
from database.supabase_client import get_supabase_client

from AI.api_Operation import PDFQA
from utils.prompts import get_extinguisher_inspection_prompt
from utils.auditoria import log_action
from auth.auth_utils import get_user_display_name

# ... (As constantes ACTION_MAP, MAINTENANCE_INTERVALS e a função generate_action_plan permanecem as mesmas) ...
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
MAINTENANCE_INTERVALS = {
    "Inspeção": {"next_inspection": 1},  # meses
    "Manutenção Nível 2": {"next_inspection": 1, "next_level2": 12},  # meses
    # meses (5 anos)
    "Manutenção Nível 3": {"next_inspection": 1, "next_level2": 12, "next_level3": 60},
    "Substituição": {"next_inspection": 1},  # meses
}


def generate_action_plan(record):
    # ... (código original sem mudanças) ...
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

# ... (A função calculate_next_dates permanece a mesma) ...


def calculate_next_dates(service_date_str, service_level, existing_dates=None):
    # ... (código original sem mudanças) ...
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
        dates['data_proxima_manutencao_2_nivel'] = service_date + \
            relativedelta(months=12)
        dates['data_proxima_manutencao_3_nivel'] = service_date + \
            relativedelta(years=5)
        dates['data_ultimo_ensaio_hidrostatico'] = service_date

    elif service_level == "Manutenção Nível 2":
        # Renova inspeção mensal e N2, preserva N3 se existir
        dates['data_proxima_inspecao'] = service_date + relativedelta(months=1)
        dates['data_proxima_manutencao_2_nivel'] = service_date + \
            relativedelta(months=12)
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

# ... (As funções process_extinguisher_pdf e clean_and_prepare_ia_data permanecem as mesmas) ...


def process_extinguisher_pdf(uploaded_file):
    # ... (código original sem mudanças) ...
    if not uploaded_file:
        return None

    with st.spinner("Analisando PDF com IA..."):
        prompt = get_extinguisher_inspection_prompt()
        pdf_qa = PDFQA()
        extracted_data = pdf_qa.extract_structured_data(uploaded_file, prompt)

        if extracted_data and "extintores" in extracted_data and isinstance(extracted_data["extintores"], list):
            st.success(
                f"✅ {len(extracted_data['extintores'])} extintores identificados no documento.")
            return extracted_data["extintores"]
        else:
            st.error(
                "A IA não retornou os dados no formato esperado (uma lista de extintores).")
            if extracted_data:
                with st.expander("🔍 Ver resposta da IA (debug)"):
                    st.json(extracted_data)
            return None


def clean_and_prepare_ia_data(ia_item):
    # ... (código original sem mudanças) ...
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


def save_inspection(record: dict) -> bool:
    """
    Salva uma inspeção de extintor no Supabase.
    
    Args:
        record: Dicionário com os dados da inspeção
        
    Returns:
        True se salvou com sucesso, False caso contrário
    """
    try:
        from database.supabase_client import get_supabase_client
        from config.table_names import EXTINGUISHER_SHEET_NAME
        
        db_client = get_supabase_client()
        
        # Remove campos None ou vazios
        clean_record = {k: v for k, v in record.items() if v is not None and v != ''}
        
        # Salva no Supabase
        db_client.append_data(EXTINGUISHER_SHEET_NAME, clean_record)
        
        return True
        
    except Exception as e:
        st.error(f"Erro ao salvar inspeção: {e}")
        import traceback
        st.error(traceback.format_exc())
        return False


def save_inspection_batch(inspections_list: list[dict]) -> tuple[bool, int]:
    """
    Salva múltiplas inspeções de uma vez (batch), com tratamento de erro individual.

    Returns:
        tuple: (sucesso_geral: bool, quantidade_salva: int)
    """
    if not inspections_list:
        return True, 0 # Retorna sucesso se a lista estiver vazia

    db_client = get_supabase_client()
    success_count = 0
    failed_records = []

    progress_bar = st.progress(0, text="Salvando registros...")
    total_records = len(inspections_list)

    for i, inspection in enumerate(inspections_list):
        try:
            clean_record = {}
            for key, value in inspection.items():
                if pd.isna(value):
                    clean_record[key] = None
                elif isinstance(value, (date, pd.Timestamp)):
                    clean_record[key] = value.isoformat()
                else:
                    clean_record[key] = value
            
            # Insere um registro de cada vez
            db_client.append_data("extintores", clean_record)
            success_count += 1
        except Exception as e:
            failed_records.append({
                'id': inspection.get('numero_identificacao', 'N/A'),
                'erro': str(e)
            })
        
        progress_bar.progress((i + 1) / total_records, text=f"Salvando {i+1}/{total_records}...")

    if failed_records:
        st.error(f"Falha ao salvar {len(failed_records)} registro(s).")
        with st.expander("Ver detalhes dos erros"):
            for failed in failed_records:
                st.error(f"ID: {failed['id']} - Erro: {failed['erro']}")
    
    if success_count > 0:
        log_action(
            "SALVOU_INSPECAO_EXTINTOR_LOTE",
            f"Sucesso: {success_count}/{total_records} inspeções salvas."
        )

    # Considera sucesso geral se pelo menos um registro foi salvo
    return success_count > 0, success_count


def save_new_location(location_id, description):
    """Salva um novo local na tabela 'locais'."""
    try:
        db_client = get_supabase_client()

        # Verifica se o ID já existe
        df_locations = db_client.get_data("locais")
        if not df_locations.empty and location_id in df_locations['id'].values:
            st.error(f"❌ Erro: O ID de Local '{location_id}' já existe.")
            return False

        # PARA: Cria um dicionário para o novo registro
        new_record = {'id': location_id, 'local': description}
        db_client.append_data("locais", new_record)

        log_action("CADASTROU_LOCAL",
                   f"ID: {location_id}, Nome: {description}")
        return True

    except Exception as e:
        st.error(f"Erro ao salvar novo local: {e}")
        return False


def update_extinguisher_location(equip_id, location_desc):
    """
    Atualiza o local de um equipamento (Upsert).
    """
    try:
        db_client = get_supabase_client()

        # Tenta atualizar. Se não funcionar, insere.
        # A função `upsert` do Supabase é perfeita para isso.
        record = {'id': str(equip_id), 'local': location_desc}
        db_client.client.table("locais").upsert(record).execute()

        log_action("ASSOCIOU_LOCAL_EXTINTOR",
                   f"ID: {equip_id}, Local: {location_desc}")
        return True

    except Exception as e:
        st.error(f"Erro ao salvar local para o equipamento '{equip_id}': {e}")
        return False


def save_new_extinguisher(details_dict: dict) -> bool:
    """
    Salva um novo extintor na tabela 'extintores' do Supabase.
    Cria um registro inicial com o status "Cadastro".
    """
    try:
        db_client = get_supabase_client()
        ext_id = details_dict.get('numero_identificacao')

        # Verifica se o ID já existe
        df_extinguishers = db_client.get_data("extintores")
        if not df_extinguishers.empty and ext_id in df_extinguishers['numero_identificacao'].values:
            st.error(
                f"❌ Erro: O ID de Extintor '{ext_id}' já está cadastrado.")
            return False

        # Monta o dicionário do novo registro
        new_record = {
            'numero_identificacao': ext_id,
            'numero_selo_inmetro': details_dict.get('numero_selo_inmetro'),
            'tipo_agente': details_dict.get('tipo_agente'),
            'capacidade': details_dict.get('capacidade'),
            'marca_fabricante': details_dict.get('marca_fabricante'),
            'ano_fabricacao': details_dict.get('ano_fabricacao'),
            'tipo_servico': "Cadastro",
            'data_servico': date.today().isoformat(),
            'inspetor_responsavel': get_user_display_name(),
            'empresa_executante': None,
            'data_proxima_inspecao': (date.today() + relativedelta(months=1)).isoformat(),
            'data_proxima_manutencao_2_nivel': None,
            'data_proxima_manutencao_3_nivel': None,
            'data_ultimo_ensaio_hidrostatico': None,
            'aprovado_inspecao': "N/A",
            'observacoes_gerais': "Equipamento recém-cadastrado no sistema.",
            'plano_de_acao': "Aguardando primeira inspeção.",
            'link_relatorio_pdf': None,
            'latitude': None,
            'longitude': None,
            'link_foto_nao_conformidade': None
        }

        db_client.append_data("extintores", new_record)
        log_action("CADASTROU_EXTINTOR", f"ID: {ext_id}")
        return True

    except Exception as e:
        st.error(f"Erro ao salvar novo extintor: {e}")
        return False


def batch_regularize_monthly_inspections(df_all_extinguishers: pd.DataFrame) -> int:
    """
    Encontra extintores com inspeção mensal vencida, cria novos registros de inspeção
    "Aprovado" e salva em lote no Supabase.
    """
    if df_all_extinguishers.empty:
        st.warning("Não há extintores cadastrados para regularizar.")
        return 0

    latest_records = df_all_extinguishers.sort_values(by='data_servico', ascending=False).drop_duplicates(
        subset=['numero_identificacao'], keep='first').copy()
    latest_records['data_proxima_inspecao'] = pd.to_datetime(
        latest_records['data_proxima_inspecao'], errors='coerce')
    today = pd.Timestamp(date.today())

    vencidos_e_aprovados = latest_records[
        (latest_records['data_proxima_inspecao'] < today) &
        (latest_records['plano_de_acao'] != 'FORA DE OPERAÇÃO (SUBSTITUÍDO)') &
        (latest_records['aprovado_inspecao'] == 'Sim')
    ]

    if vencidos_e_aprovados.empty:
        st.success(
            "✅ Nenhuma inspeção mensal (de equipamentos previamente aprovados) está vencida. Tudo em dia!")
        return 0

    new_inspections = []
    with st.spinner(f"Regularizando {len(vencidos_e_aprovados)} extintores..."):
        for _, original_record in vencidos_e_aprovados.iterrows():
            new_record = original_record.to_dict()

            new_record.update({
                'tipo_servico': "Inspeção",
                'data_servico': date.today().isoformat(),
                'inspetor_responsavel': get_user_display_name(),
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
            new_inspections.append(new_record)

    try:
        success, count = save_inspection_batch(new_inspections)
        if success:
            st.success(f"✅ {count} extintores regularizados com sucesso!")
            # Log de auditoria para o lote
            log_action("REGULARIZOU_INSPECAO_EXTINTOR_MASSA",
                       f"Total: {count} extintores.")
            return count
        else:
            st.error("❌ Ocorreu um erro durante a regularização em massa.")
            return -1

    except Exception as e:
        st.error(f"❌ Ocorreu um erro durante a regularização em massa: {e}")
        log_action("FALHA_REGULARIZACAO_MASSA", f"Erro: {str(e)[:200]}")
        return -1
