import streamlit as st
import pandas as pd
import sys
import os

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
            st.warning(f"A planilha '{sheet_name}' está vazia ou não contém cabeçalhos.")
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
    
    CORREÇÃO APLICADA: Adicionada verificação adicional para evitar erro iloc[0] em DataFrame vazio.
    """
    if df.empty or column_name not in df.columns:
        return None

    # ✅ VERIFICAÇÃO 2: Filtra registros que correspondem ao valor buscado
    records = df[df[column_name].astype(str) == str(search_value)].copy()
    if records.empty:
        return None

    # Lista de todas as colunas que podem conter datas
    date_columns = [
        'data_servico', 'data_proxima_inspecao', 'data_proxima_manutencao_2_nivel',
        'data_proxima_manutencao_3_nivel', 'data_ultimo_ensaio_hidrostatico'
    ]
    
    # Converte todas as colunas de data de uma vez, tratando erros
    for col in date_columns:
        if col in records.columns:
            records[col] = pd.to_datetime(records[col], errors='coerce')

    records.dropna(subset=['data_servico'], inplace=True)
    
    if records.empty:
        st.warning(f"Nenhum registro válido encontrado para {column_name}='{search_value}' após limpeza de dados.")
        return None

    latest_record_dict = records.sort_values(by='data_servico', ascending=False).iloc[0].to_dict()

    # Varre todo o histórico para encontrar a data MÁXIMA de cada coluna de vencimento
    last_valid_n2_date = records['data_proxima_manutencao_2_nivel'].max()
    last_valid_n3_date = records['data_proxima_manutencao_3_nivel'].max()
    last_valid_hydro_date = records['data_ultimo_ensaio_hidrostatico'].max()

    # Sobrescreve as datas no dicionário final com os valores consolidados
    latest_record_dict['data_proxima_manutencao_2_nivel'] = last_valid_n2_date
    latest_record_dict['data_proxima_manutencao_3_nivel'] = last_valid_n3_date
    latest_record_dict['data_ultimo_ensaio_hidrostatico'] = last_valid_hydro_date

    # ✅ CORREÇÃO ADICIONAL: Garante que todas as datas no dicionário de retorno sejam strings
    for key, value in latest_record_dict.items():
        if isinstance(value, pd.Timestamp):
            # Formata o Timestamp para string 'YYYY-MM-DD'
            latest_record_dict[key] = value.strftime('%Y-%m-%d')
        elif pd.isna(value):
            # Garante que valores nulos (NaT) se tornem None
            latest_record_dict[key] = None
            
    return latest_record_dict


def find_last_record_safe(df, search_value, column_name):
    """
    ✅ VERSÃO AINDA MAIS SEGURA - Função alternativa com logging detalhado para debug.
    
    Esta versão adiciona logs detalhados para facilitar o diagnóstico de problemas.
    Use esta versão se ainda houver problemas com a função principal.
    """
    try:
        # Log inicial
        print(f"[DEBUG] find_last_record_safe: Buscando {column_name}='{search_value}' em DataFrame com {len(df)} linhas")
        
        # Verificação 1: DataFrame vazio ou coluna inexistente
        if df.empty:
            print("[DEBUG] DataFrame está vazio")
            return None
            
        if column_name not in df.columns:
            print(f"[DEBUG] Coluna '{column_name}' não encontrada. Colunas disponíveis: {list(df.columns)}")
            return None

        # Verificação 2: Filtra registros
        records = df[df[column_name].astype(str) == str(search_value)].copy()
        print(f"[DEBUG] Encontrados {len(records)} registros correspondentes")
        
        if records.empty:
            print("[DEBUG] Nenhum registro correspondente encontrado")
            return None

        # Lista de colunas de data
        date_columns = [
            'data_servico', 'data_proxima_inspecao', 'data_proxima_manutencao_2_nivel',
            'data_proxima_manutencao_3_nivel', 'data_ultimo_ensaio_hidrostatico'
        ]
        
        # Converte colunas de data
        for col in date_columns:
            if col in records.columns:
                before_count = len(records)
                records[col] = pd.to_datetime(records[col], errors='coerce')
                after_count = len(records)
                print(f"[DEBUG] Coluna '{col}': {before_count} -> {after_count} registros")

        # Limpa registros com data_servico nula
        before_dropna = len(records)
        records.dropna(subset=['data_servico'], inplace=True)
        after_dropna = len(records)
        print(f"[DEBUG] Após dropna(data_servico): {before_dropna} -> {after_dropna} registros")
        
        # Verificação crítica após dropna
        if records.empty:
            print("[DEBUG] ATENÇÃO: DataFrame ficou vazio após dropna!")
            st.warning(f"Registros para {column_name}='{search_value}' não possuem data_servico válida.")
            return None

        # Agora é seguro usar iloc[0]
        print("[DEBUG] Processando último registro...")
        latest_record_dict = records.sort_values(by='data_servico', ascending=False).iloc[0].to_dict()
        
        # Consolida datas máximas
        latest_record_dict['data_proxima_manutencao_2_nivel'] = records['data_proxima_manutencao_2_nivel'].max()
        latest_record_dict['data_proxima_manutencao_3_nivel'] = records['data_proxima_manutencao_3_nivel'].max()
        latest_record_dict['data_ultimo_ensaio_hidrostatico'] = records['data_ultimo_ensaio_hidrostatico'].max()

        # Converte datas para strings
        for key, value in latest_record_dict.items():
            if isinstance(value, pd.Timestamp):
                latest_record_dict[key] = value.strftime('%Y-%m-%d')
            elif pd.isna(value):
                latest_record_dict[key] = None
                
        print(f"[DEBUG] Último registro processado com sucesso para {search_value}")
        return latest_record_dict
        
    except Exception as e:
        print(f"[ERROR] Erro em find_last_record_safe: {e}")
        st.error(f"Erro ao processar último registro para {search_value}: {e}")
        return None


def find_all_records_for_equipment(df, search_value, column_name):
    """
    ✅ FUNÇÃO ADICIONAL - Retorna TODOS os registros de um equipamento, ordenados cronologicamente.
    
    Útil para análise completa do histórico de um equipamento específico.
    """
    if df.empty or column_name not in df.columns:
        return pd.DataFrame()
        
    # Filtra e limpa dados
    records = df[df[column_name].astype(str) == str(search_value)].copy()
    
    if records.empty:
        return pd.DataFrame()
    
    # Converte data_servico para ordenação
    records['data_servico'] = pd.to_datetime(records['data_servico'], errors='coerce')
    records = records.dropna(subset=['data_servico'])
    
    if records.empty:
        return pd.DataFrame()
        
    # Ordena por data de serviço (mais recente primeiro)
    return records.sort_values(by='data_servico', ascending=False)


def get_equipment_status_summary(df, equipment_id_column='numero_identificacao'):
    """
    ✅ FUNÇÃO ADICIONAL - Gera um resumo do status de todos os equipamentos.
    
    Retorna um DataFrame com o status atual de cada equipamento baseado no último registro.
    """
    if df.empty:
        return pd.DataFrame()
        
    try:
        # Pega equipamentos únicos
        unique_equipment = df[equipment_id_column].unique()
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
        st.error(f"Erro ao gerar resumo de equipamentos: {e}")
        return pd.DataFrame()
