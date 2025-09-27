import streamlit as st
import pandas as pd
import sys
import os
import logging

# Garante que o app encontre a pasta gdrive
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import EXTINGUISHER_SHEET_NAME

@st.cache_data(ttl=600)
def load_sheet_data(sheet_name):
    """
    Carrega dados de uma aba específica do Google Sheets e os converte em um DataFrame do Pandas.
    Esta é uma função de utilidade central.
    """
    try:
        uploader = GoogleDriveUploader()
        data = uploader.get_data_from_sheet(sheet_name)
        
        if not data or len(data) < 2:
            st.info(f"Os dados ainda não foram adicionados")
            return pd.DataFrame()
            
        headers = data[0]
        rows = data[1:]
        
        # Garante que todas as linhas tenham o mesmo número de colunas do cabeçalho
        num_columns = len(headers)
        cleaned_rows = []
        for row in rows:
            # Completa a linha com 'None' se ela for mais curta que o cabeçalho
            row.extend([None] * (num_columns - len(row)))
            cleaned_rows.append(row[:num_columns])

        df = pd.DataFrame(cleaned_rows, columns=headers)
        return df

    except Exception as e:
        st.error(f"Erro ao carregar dados da planilha '{sheet_name}': {e}")
        return pd.DataFrame()
        


def find_last_record(df, search_value, column_name):
    """
    ✅ FUNÇÃO CORRIGIDA - Encontra o último registro e consolida as datas de vencimento de todo o histórico,
    retornando tudo como strings formatadas ou None.
    
    CORREÇÕES APLICADAS:
    - Validação robusta de entrada
    - Verificação de DataFrame vazio em todas as etapas
    - Melhor tratamento de erros
    - Logs detalhados para debug
    - Conversão segura de tipos de dados
    - Consolidação correta de datas de vencimento
    
    Args:
        df (pd.DataFrame): DataFrame com histórico de registros
        search_value (str): Valor a ser procurado
        column_name (str): Nome da coluna onde procurar
        
    Returns:
        dict or None: Último registro com datas consolidadas ou None se não encontrado
    """
    try:
        # Validação de entrada
        if df is None:
            logging.warning(f"DataFrame é None para busca de {column_name}='{search_value}'")
            return None
            
        if df.empty:
            logging.info(f"DataFrame está vazio para busca de {column_name}='{search_value}'")
            return None
            
        if not isinstance(search_value, (str, int, float)):
            logging.warning(f"Valor de busca inválido: {search_value} (tipo: {type(search_value)})")
            return None
            
        if not column_name or column_name not in df.columns:
            available_columns = list(df.columns) if not df.empty else []
            logging.error(f"Coluna '{column_name}' não encontrada. Colunas disponíveis: {available_columns}")
            return None

        # Converte search_value para string para comparação consistente
        search_value_str = str(search_value).strip()
        if not search_value_str:
            logging.warning("Valor de busca está vazio após conversão para string")
            return None

        # Filtra registros correspondentes
        try:
            # Converte coluna para string e remove espaços para comparação
            df_copy = df.copy()
            df_copy[column_name] = df_copy[column_name].astype(str).str.strip()
            records = df_copy[df_copy[column_name] == search_value_str].copy()
        except Exception as e:
            logging.error(f"Erro ao filtrar registros: {e}")
            return None
        
        if records.empty:
            logging.info(f"Nenhum registro encontrado para {column_name}='{search_value_str}'")
            return None

        # Lista de todas as colunas que podem conter datas
        date_columns = [
            'data_servico', 'data_inspecao', 'data_teste', 'data_proxima_inspecao', 
            'data_proxima_manutencao_2_nivel', 'data_proxima_manutencao_3_nivel', 
            'data_ultimo_ensaio_hidrostatico', 'data_validade', 'data_proximo_teste',
            'proxima_calibracao', 'data_proxima_inspecao'
        ]
        
        # Converte todas as colunas de data encontradas
        converted_columns = []
        for col in date_columns:
            if col in records.columns:
                try:
                    records[col] = pd.to_datetime(records[col], errors='coerce')
                    converted_columns.append(col)
                except Exception as e:
                    logging.warning(f"Erro ao converter coluna de data '{col}': {e}")

        # Identifica a coluna principal de data para ordenação
        primary_date_col = None
        for col in ['data_servico', 'data_inspecao', 'data_teste']:
            if col in records.columns:
                primary_date_col = col
                break
        
        if not primary_date_col:
            logging.error(f"Nenhuma coluna de data principal encontrada para {search_value_str}")
            return None

        # Remove registros com data principal nula
        records_before_dropna = len(records)
        records = records.dropna(subset=[primary_date_col])
        records_after_dropna = len(records)
        
        if records_before_dropna > records_after_dropna:
            logging.info(f"Removidos {records_before_dropna - records_after_dropna} registros com {primary_date_col} nula")
        
        # ✅ VERIFICAÇÃO CRÍTICA: DataFrame vazio após dropna
        if records.empty:
            logging.warning(f"Todos os registros para {column_name}='{search_value_str}' possuem {primary_date_col} inválida/nula")
            return None

        # Ordena por data principal e pega o último registro
        try:
            records_sorted = records.sort_values(by=primary_date_col, ascending=False)
            latest_record_dict = records_sorted.iloc[0].to_dict()
        except Exception as e:
            logging.error(f"Erro ao ordenar registros ou obter último registro: {e}")
            return None

        # ✅ CONSOLIDAÇÃO DE DATAS: Varre todo o histórico para encontrar a data MÁXIMA de cada coluna de vencimento
        consolidation_columns = {
            'data_proxima_manutencao_2_nivel': 'Manutenção Nível 2',
            'data_proxima_manutencao_3_nivel': 'Manutenção Nível 3', 
            'data_ultimo_ensaio_hidrostatico': 'Teste Hidrostático',
            'data_proxima_inspecao': 'Próxima Inspeção',
            'data_validade': 'Validade',
            'data_proximo_teste': 'Próximo Teste',
            'proxima_calibracao': 'Próxima Calibração'
        }
        
        consolidated_dates = {}
        for col, description in consolidation_columns.items():
            if col in records.columns:
                try:
                    # Encontra a data máxima (mais distante no futuro) para esta coluna
                    max_date = records[col].max()
                    if pd.notna(max_date):
                        consolidated_dates[col] = max_date
                        logging.debug(f"Data consolidada para {description}: {max_date}")
                    else:
                        consolidated_dates[col] = None
                except Exception as e:
                    logging.warning(f"Erro ao consolidar {col}: {e}")
                    consolidated_dates[col] = None

        # Sobrescreve as datas no dicionário final com os valores consolidados
        latest_record_dict.update(consolidated_dates)

        # ✅ CONVERSÃO FINAL: Converte todas as datas para string ou None
        for key, value in latest_record_dict.items():
            if isinstance(value, pd.Timestamp):
                try:
                    # Formata o Timestamp para string 'YYYY-MM-DD'
                    latest_record_dict[key] = value.strftime('%Y-%m-%d')
                except Exception as e:
                    logging.warning(f"Erro ao formatar data {key}: {e}")
                    latest_record_dict[key] = None
            elif pd.isna(value):
                # Garante que valores nulos (NaT, NaN) se tornem None
                latest_record_dict[key] = None
            elif isinstance(value, str) and key in date_columns:
                # Tenta normalizar strings de data já existentes
                try:
                    parsed_date = pd.to_datetime(value)
                    latest_record_dict[key] = parsed_date.strftime('%Y-%m-%d')
                except:
                    # Se não conseguir converter, mantém a string original
                    pass
                    
        logging.info(f"Último registro encontrado para {column_name}='{search_value_str}' com {len(consolidated_dates)} datas consolidadas")
        return latest_record_dict
        
    except Exception as e:
        logging.error(f"Erro crítico em find_last_record para {column_name}='{search_value}': {e}", exc_info=True)
        return None


def find_last_record_safe(df, search_value, column_name):
    """
    ✅ VERSÃO AINDA MAIS SEGURA - Função alternativa com logging detalhado para debug.
    
    Esta versão adiciona logs detalhados para facilitar o diagnóstico de problemas.
    Use esta versão se ainda houver problemas com a função principal.
    
    Args:
        df (pd.DataFrame): DataFrame com histórico de registros
        search_value (str): Valor a ser procurado
        column_name (str): Nome da coluna onde procurar
        
    Returns:
        dict or None: Último registro com datas consolidadas ou None se não encontrado
    """
    try:
        # Log inicial detalhado
        logging.info(f"[DEBUG] find_last_record_safe: Buscando {column_name}='{search_value}' em DataFrame com {len(df) if df is not None else 0} linhas")
        
        # Verificação 1: DataFrame vazio ou coluna inexistente
        if df is None or df.empty:
            logging.warning("[DEBUG] DataFrame está vazio ou é None")
            return None
            
        if column_name not in df.columns:
            logging.error(f"[DEBUG] Coluna '{column_name}' não encontrada. Colunas disponíveis: {list(df.columns)}")
            return None

        # Verificação 2: Filtra registros com logging detalhado
        search_str = str(search_value).strip()
        df_work = df.copy()
        df_work[column_name] = df_work[column_name].astype(str).str.strip()
        records = df_work[df_work[column_name] == search_str].copy()
        
        logging.info(f"[DEBUG] Encontrados {len(records)} registros correspondentes")
        
        if records.empty:
            logging.warning("[DEBUG] Nenhum registro correspondente encontrado")
            return None

        # Lista de colunas de data com logging
        date_columns = [
            'data_servico', 'data_inspecao', 'data_teste', 'data_proxima_inspecao', 
            'data_proxima_manutencao_2_nivel', 'data_proxima_manutencao_3_nivel',
            'data_ultimo_ensaio_hidrostatico', 'data_validade', 'data_proximo_teste'
        ]
        
        # Converte colunas de data com logging detalhado
        primary_date_col = None
        for col in ['data_servico', 'data_inspecao', 'data_teste']:
            if col in records.columns:
                primary_date_col = col
                break
                
        if not primary_date_col:
            logging.error("[DEBUG] Nenhuma coluna de data principal encontrada")
            return None
            
        before_count = len(records)
        
        # Converte datas
        for col in date_columns:
            if col in records.columns:
                try:
                    records[col] = pd.to_datetime(records[col], errors='coerce')
                    logging.debug(f"[DEBUG] Coluna '{col}' convertida para datetime")
                except Exception as e:
                    logging.warning(f"[DEBUG] Erro ao converter '{col}': {e}")

        # Limpa registros com data principal nula
        records = records.dropna(subset=[primary_date_col])
        after_count = len(records)
        
        logging.info(f"[DEBUG] Após dropna({primary_date_col}): {before_count} -> {after_count} registros")
        
        # ✅ VERIFICAÇÃO CRÍTICA: DataFrame vazio após dropna
        if records.empty:
            logging.error("[DEBUG] ATENÇÃO: DataFrame ficou vazio após dropna!")
            return None

        # Processamento seguro do último registro
        logging.debug("[DEBUG] Processando último registro...")
        try:
            latest_record_dict = records.sort_values(by=primary_date_col, ascending=False).iloc[0].to_dict()
        except Exception as e:
            logging.error(f"[DEBUG] Erro ao obter último registro: {e}")
            return None
        
        # Consolida datas máximas com logging
        consolidation_map = {
            'data_proxima_manutencao_2_nivel': 'N2',
            'data_proxima_manutencao_3_nivel': 'N3', 
            'data_ultimo_ensaio_hidrostatico': 'TH'
        }
        
        for col, short_name in consolidation_map.items():
            if col in records.columns:
                max_date = records[col].max()
                latest_record_dict[col] = max_date
                logging.debug(f"[DEBUG] {short_name} consolidado: {max_date}")

        # Converte datas para strings com logging
        converted_count = 0
        for key, value in latest_record_dict.items():
            if isinstance(value, pd.Timestamp):
                latest_record_dict[key] = value.strftime('%Y-%m-%d')
                converted_count += 1
            elif pd.isna(value):
                latest_record_dict[key] = None
                
        logging.info(f"[DEBUG] Último registro processado com sucesso. {converted_count} datas convertidas para string")
        return latest_record_dict
        
    except Exception as e:
        logging.error(f"[ERROR] Erro em find_last_record_safe: {e}", exc_info=True)
        return None


def find_all_records_for_equipment(df, search_value, column_name):
    """
    ✅ FUNÇÃO ADICIONAL - Retorna TODOS os registros de um equipamento, ordenados cronologicamente.
    
    Útil para análise completa do histórico de um equipamento específico.
    
    Args:
        df (pd.DataFrame): DataFrame com histórico
        search_value (str): Valor a ser procurado
        column_name (str): Nome da coluna onde procurar
        
    Returns:
        pd.DataFrame: Todos os registros do equipamento ordenados por data
    """
    try:
        if df is None or df.empty or column_name not in df.columns:
            return pd.DataFrame()
            
        # Filtra e limpa dados
        search_str = str(search_value).strip()
        df_work = df.copy()
        df_work[column_name] = df_work[column_name].astype(str).str.strip()
        records = df_work[df_work[column_name] == search_str].copy()
        
        if records.empty:
            return pd.DataFrame()
        
        # Identifica coluna de data principal
        primary_date_col = None
        for col in ['data_servico', 'data_inspecao', 'data_teste']:
            if col in records.columns:
                primary_date_col = col
                break
                
        if not primary_date_col:
            return records  # Retorna sem ordenação se não há coluna de data
            
        # Converte e ordena por data
        records[primary_date_col] = pd.to_datetime(records[primary_date_col], errors='coerce')
        records = records.dropna(subset=[primary_date_col])
        
        if records.empty:
            return pd.DataFrame()
            
        # Ordena por data de serviço (mais recente primeiro)
        return records.sort_values(by=primary_date_col, ascending=False)
        
    except Exception as e:
        logging.error(f"Erro em find_all_records_for_equipment: {e}")
        return pd.DataFrame()


def get_equipment_status_summary(df, equipment_id_column='numero_identificacao'):
    """
    ✅ FUNÇÃO ADICIONAL - Gera um resumo do status de todos os equipamentos.
    
    Retorna um DataFrame com o status atual de cada equipamento baseado no último registro.
    
    Args:
        df (pd.DataFrame): DataFrame com histórico completo
        equipment_id_column (str): Nome da coluna com ID do equipamento
        
    Returns:
        pd.DataFrame: Resumo do status de todos os equipamentos
    """
    try:
        if df is None or df.empty or equipment_id_column not in df.columns:
            return pd.DataFrame()
            
        # Pega equipamentos únicos
        unique_equipment = df[equipment_id_column].dropna().unique()
        summary_data = []
        
        for equipment_id in unique_equipment:
            if pd.isna(equipment_id) or str(equipment_id).strip() == '':
                continue
                
            # Pega último registro para cada equipamento
            last_record = find_last_record(df, equipment_id, equipment_id_column)
            
            if last_record:
                summary_data.append({
                    'equipment_id': equipment_id,
                    'last_service_date': last_record.get('data_servico'),
                    'service_type': last_record.get('tipo_servico'),
                    'approval_status': last_record.get('aprovado_inspecao'),
                    'action_plan': last_record.get('plano_de_acao'),
                    'next_inspection': last_record.get('data_proxima_inspecao')
                })
        
        return pd.DataFrame(summary_data)
        
    except Exception as e:
        logging.error(f"Erro ao gerar resumo de equipamentos: {e}")
        return pd.DataFrame()


def validate_dataframe_for_search(df, column_name, search_value):
    """
    ✅ FUNÇÃO AUXILIAR - Valida se DataFrame e parâmetros estão adequados para busca
    
    Args:
        df (pd.DataFrame): DataFrame a ser validado
        column_name (str): Nome da coluna
        search_value: Valor a ser buscado
        
    Returns:
        tuple: (is_valid: bool, error_message: str)
    """
    try:
        if df is None:
            return False, "DataFrame é None"
            
        if df.empty:
            return False, "DataFrame está vazio"
            
        if not column_name:
            return False, "Nome da coluna não pode estar vazio"
            
        if column_name not in df.columns:
            return False, f"Coluna '{column_name}' não existe. Colunas disponíveis: {list(df.columns)}"
            
        if search_value is None or str(search_value).strip() == '':
            return False, "Valor de busca não pode estar vazio"
            
        return True, ""
        
    except Exception as e:
        return False, f"Erro na validação: {str(e)}"



