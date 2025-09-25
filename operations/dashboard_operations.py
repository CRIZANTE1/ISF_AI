import pandas as pd
import numpy as np
import json
from datetime import date
from dateutil.relativedelta import relativedelta
import streamlit as st
from operations.history import load_sheet_data
from gdrive.config import (
    HOSE_SHEET_NAME, SHELTER_SHEET_NAME, INSPECTIONS_SHELTER_SHEET_NAME,
    LOG_SHELTER_SHEET_NAME, SCBA_SHEET_NAME, SCBA_VISUAL_INSPECTIONS_SHEET_NAME,
    EYEWASH_INSPECTIONS_SHEET_NAME,
    FOAM_CHAMBER_INVENTORY_SHEET_NAME,
    FOAM_CHAMBER_INSPECTIONS_SHEET_NAME,
    HOSE_DISPOSAL_LOG_SHEET_NAME,
    LOG_FOAM_CHAMBER_SHEET_NAME,
    MULTIGAS_INVENTORY_SHEET_NAME, 
    MULTIGAS_INSPECTIONS_SHEET_NAME
)

# ============================================================================
# 🛡️ FUNÇÕES DE PROTEÇÃO CONTRA DIVISÃO POR ZERO (BUG 5 - CORRIGIDO)
# ============================================================================

def safe_division(numerator, denominator, default=0):
    """
    Realiza divisão de forma segura, evitando divisão por zero.
    
    Args:
        numerator: Valor numerador
        denominator: Valor denominador
        default: Valor padrão retornado se denominador for 0
        
    Returns:
        float: Resultado da divisão ou valor padrão
    """
    try:
        if denominator == 0 or pd.isna(denominator):
            return default
        return float(numerator) / float(denominator)
    except (TypeError, ValueError, ZeroDivisionError):
        return default

def safe_percentage(numerator, denominator, decimal_places=1):
    """
    Calcula percentual de forma segura.
    
    Args:
        numerator: Valor numerador
        denominator: Total para cálculo do percentual
        decimal_places: Casas decimais no resultado
        
    Returns:
        float: Percentual calculado de forma segura
    """
    result = safe_division(numerator, denominator, 0) * 100
    return round(result, decimal_places)

def safe_ratio(numerator, denominator, format_as_fraction=False):
    """
    Calcula razão de forma segura com opção de formatação.
    
    Args:
        numerator: Valor numerador
        denominator: Valor denominador
        format_as_fraction: Se True, retorna string formatada (ex: "5/10")
        
    Returns:
        float ou str: Razão calculada ou formatada
    """
    if format_as_fraction:
        num_safe = int(numerator) if not pd.isna(numerator) else 0
        den_safe = int(denominator) if not pd.isna(denominator) else 0
        return f"{num_safe}/{den_safe}"
    
    return safe_division(numerator, denominator, 0)

# ============================================================================
# FUNÇÕES DE STATUS PARA DIFERENTES TIPOS DE EQUIPAMENTOS
# ============================================================================

def get_multigas_status_df(df_inventory, df_inspections):
    """
    Gera DataFrame de status consolidado para detectores multigás.
    
    Args:
        df_inventory: DataFrame do inventário de detectores
        df_inspections: DataFrame das inspeções realizadas
        
    Returns:
        pd.DataFrame: Status consolidado dos detectores
    """
    if df_inventory.empty:
        return pd.DataFrame()

    # Começa com o inventário
    dashboard_df = df_inventory.copy()

    # Se não houver inspeções, define todos como pendentes
    if df_inspections.empty:
        dashboard_df['status_calibracao'] = '🔵 PENDENTE'
        dashboard_df['status_bump_test'] = '🔵 PENDENTE'
        dashboard_df['proxima_calibracao'] = pd.NaT
        dashboard_df['resultado_ultimo_bump_test'] = 'N/A'
        dashboard_df['data_ultimo_bump_test'] = pd.NaT
        dashboard_df['link_certificado'] = None
        return dashboard_df

    # Converte a coluna de data para datetime
    df_inspections['data_teste'] = pd.to_datetime(df_inspections['data_teste'], errors='coerce')

    # Inicializa colunas com valores padrão
    dashboard_df['proxima_calibracao'] = pd.NaT
    dashboard_df['link_certificado'] = None
    dashboard_df['resultado_ultimo_bump_test'] = 'N/A'
    dashboard_df['data_ultimo_bump_test'] = pd.NaT

    # Processa cada equipamento
    for index, row in dashboard_df.iterrows():
        equip_id = row['id_equipamento']
        equip_inspections = df_inspections[df_inspections['id_equipamento'] == equip_id]

        if not equip_inspections.empty:
            # Última calibração anual
            calibrations = equip_inspections[equip_inspections['tipo_teste'] == 'Calibração Anual']
            if not calibrations.empty:
                last_calib = calibrations.sort_values('data_teste', ascending=False).iloc[0]
                dashboard_df.loc[index, 'proxima_calibracao'] = last_calib.get('proxima_calibracao')
                dashboard_df.loc[index, 'link_certificado'] = last_calib.get('link_certificado')

            # Último bump test
            bump_tests = equip_inspections[equip_inspections['tipo_teste'] != 'Calibração Anual']
            if not bump_tests.empty:
                last_bump = bump_tests.sort_values('data_teste', ascending=False).iloc[0]
                dashboard_df.loc[index, 'resultado_ultimo_bump_test'] = last_bump.get('resultado_teste')
                dashboard_df.loc[index, 'data_ultimo_bump_test'] = last_bump.get('data_teste')

    # Calcula status usando funções seguras
    today = pd.Timestamp(date.today())
    
    # Status da Calibração
    dashboard_df['proxima_calibracao'] = pd.to_datetime(dashboard_df['proxima_calibracao'], errors='coerce')
    dashboard_df['status_calibracao'] = np.where(
        dashboard_df['proxima_calibracao'].isna(), '🔵 PENDENTE',
        np.where(dashboard_df['proxima_calibracao'] < today, '🔴 VENCIDO', '🟢 OK')
    )

    # Status do Bump Test
    dashboard_df['status_bump_test'] = np.where(
        dashboard_df['resultado_ultimo_bump_test'].isin(['N/A', None, '']), '🔵 PENDENTE',
        np.where(dashboard_df['resultado_ultimo_bump_test'] == 'Reprovado', '🟠 REPROVADO', '🟢 OK')
    )
    
    return dashboard_df

def get_foam_chamber_status_df(df_inspections):
    """
    Gera DataFrame de status para câmaras de espuma.
    
    Args:
        df_inspections: DataFrame das inspeções realizadas
        
    Returns:
        pd.DataFrame: Status das câmaras de espuma
    """
    if df_inspections.empty:
        return pd.DataFrame()

    df_inspections['data_inspecao'] = pd.to_datetime(df_inspections['data_inspecao'], errors='coerce')
    latest_inspections = df_inspections.sort_values('data_inspecao', ascending=False).drop_duplicates(subset='id_camara', keep='first').copy()
    
    today = pd.Timestamp(date.today())
    latest_inspections['data_proxima_inspecao'] = pd.to_datetime(latest_inspections['data_proxima_inspecao'], errors='coerce')
    
    conditions = [
        (latest_inspections['data_proxima_inspecao'] < today),
        (latest_inspections['status_geral'] == 'Reprovado com Pendências')
    ]
    choices = ['🔴 VENCIDO', '🟠 COM PENDÊNCIAS']
    latest_inspections['status_dashboard'] = np.select(conditions, choices, default='🟢 OK')
    
    return latest_inspections

def get_eyewash_status_df(df_inspections):
    """
    Gera DataFrame de status para chuveiros e lava-olhos.
    
    Args:
        df_inspections: DataFrame das inspeções realizadas
        
    Returns:
        pd.DataFrame: Status dos chuveiros/lava-olhos
    """
    if df_inspections.empty:
        return pd.DataFrame()

    df_inspections['data_inspecao'] = pd.to_datetime(df_inspections['data_inspecao'], errors='coerce')
    latest_inspections = df_inspections.sort_values('data_inspecao', ascending=False).drop_duplicates(subset='id_equipamento', keep='first').copy()
    
    today = pd.Timestamp(date.today())
    latest_inspections['data_proxima_inspecao'] = pd.to_datetime(latest_inspections['data_proxima_inspecao'], errors='coerce')
    
    conditions = [
        (latest_inspections['data_proxima_inspecao'] < today),
        (latest_inspections['status_geral'] == 'Reprovado com Pendências')
    ]
    choices = ['🔴 VENCIDO', '🟠 COM PENDÊNCIAS']
    latest_inspections['status_dashboard'] = np.select(conditions, choices, default='🟢 OK')
    
    return latest_inspections

def get_scba_status_df(df_scba_main, df_scba_visual):
    """
    Gera DataFrame de status consolidado para SCBAs.
    
    Args:
        df_scba_main: DataFrame dos testes principais (Posi3)
        df_scba_visual: DataFrame das inspeções visuais
        
    Returns:
        pd.DataFrame: Status consolidado dos SCBAs
    """
    if df_scba_main.empty:
        return pd.DataFrame()

    equipment_tests = df_scba_main.dropna(subset=['numero_serie_equipamento', 'data_teste']).copy()
    if equipment_tests.empty:
        return pd.DataFrame()
        
    latest_tests = equipment_tests.sort_values('data_teste', ascending=False).drop_duplicates(subset='numero_serie_equipamento', keep='first')
    
    if not df_scba_visual.empty:
        df_scba_visual['data_inspecao'] = pd.to_datetime(df_scba_visual['data_inspecao'], errors='coerce')
        latest_visual = df_scba_visual.sort_values('data_inspecao', ascending=False).drop_duplicates(subset='numero_serie_equipamento', keep='first')
        dashboard_df = pd.merge(latest_tests, latest_visual, on='numero_serie_equipamento', how='left', suffixes=('_teste', '_visual'))
    else:
        dashboard_df = latest_tests
        for col in ['data_inspecao', 'data_proxima_inspecao', 'status_geral', 'resultados_json']:
            dashboard_df[col] = None

    today = pd.Timestamp(date.today())
    dashboard_df['data_validade'] = pd.to_datetime(dashboard_df['data_validade'], errors='coerce')
    dashboard_df['data_proxima_inspecao'] = pd.to_datetime(dashboard_df['data_proxima_inspecao'], errors='coerce')
    
    conditions = [
        (dashboard_df['data_validade'] < today),
        (dashboard_df['data_proxima_inspecao'] < today),
        (dashboard_df['status_geral'] == 'Reprovado com Pendências')
    ]
    choices = ['🔴 VENCIDO (Teste Posi3)', '🔴 VENCIDO (Insp. Periódica)', '🟠 COM PENDÊNCIAS']
    dashboard_df['status_consolidado'] = np.select(conditions, choices, default='🟢 OK')
    
    return dashboard_df
    
def get_hose_status_df(df_hoses, df_disposals):
    """
    Gera DataFrame de status para mangueiras de incêndio.
    
    Args:
        df_hoses: DataFrame do histórico de mangueiras
        df_disposals: DataFrame das baixas registradas
        
    Returns:
        pd.DataFrame: Status das mangueiras ativas
    """
    if df_hoses.empty:
        return pd.DataFrame()
    
    # Garante que as colunas existam
    for col in ['data_inspecao', 'data_proximo_teste']:
        if col not in df_hoses.columns:
            df_hoses[col] = pd.NaT
        df_hoses[col] = pd.to_datetime(df_hoses[col], errors='coerce')

    # Pega apenas o último registro de cada mangueira
    latest_hoses = df_hoses.sort_values('data_inspecao', ascending=False).drop_duplicates(subset='id_mangueira', keep='first').copy()
    
    # Remove mangueiras que foram baixadas
    if not df_disposals.empty and 'id_mangueira' in df_disposals.columns:
        disposed_ids = df_disposals['id_mangueira'].astype(str).unique()
        latest_hoses = latest_hoses[~latest_hoses['id_mangueira'].astype(str).isin(disposed_ids)]

    if latest_hoses.empty:
        return pd.DataFrame()

    today = pd.Timestamp(date.today())
    
    if 'resultado' not in latest_hoses.columns:
        latest_hoses['resultado'] = ''
    latest_hoses['resultado'] = latest_hoses['resultado'].fillna('').str.lower()
    
    rejection_keywords = ['reprovado', 'condenada', 'rejeitado', 'condenado']
    is_rejected = latest_hoses['resultado'].str.contains('|'.join(rejection_keywords), na=False)

    conditions = [
        is_rejected,
        (latest_hoses['data_proximo_teste'] < today)
    ]
    choices = ['🟠 REPROVADA', '🔴 VENCIDO']
    latest_hoses['status'] = np.select(conditions, choices, default='🟢 OK')
    
    # Formata datas para exibição
    latest_hoses['data_inspecao'] = latest_hoses['data_inspecao'].dt.strftime('%d/%m/%Y')
    latest_hoses['data_proximo_teste'] = latest_hoses['data_proximo_teste'].dt.strftime('%d/%m/%Y')
    
    display_columns = [
        'id_mangueira', 'status', 'marca', 'diametro', 'tipo',
        'comprimento', 'ano_fabricacao', 'data_inspecao',
        'data_proximo_teste', 'link_certificado_pdf', 'registrado_por'
    ]
    
    existing_display_columns = [col for col in display_columns if col in latest_hoses.columns]
    
    return latest_hoses[existing_display_columns]

def get_shelter_status_df(df_shelters_registered, df_inspections):
    """
    Gera DataFrame de status para abrigos de emergência.
    
    Args:
        df_shelters_registered: DataFrame dos abrigos cadastrados
        df_inspections: DataFrame das inspeções realizadas
        
    Returns:
        pd.DataFrame: Status dos abrigos
    """
    if df_shelters_registered.empty:
        return pd.DataFrame()

    latest_inspections_list = []
    if not df_inspections.empty:
        df_inspections['data_inspecao'] = pd.to_datetime(df_inspections['data_inspecao'], errors='coerce').dt.date

        for shelter_id in df_shelters_registered['id_abrigo'].unique():
            shelter_inspections = df_inspections[df_inspections['id_abrigo'] == shelter_id].copy()
            if not shelter_inspections.empty:
                shelter_inspections = shelter_inspections.sort_values(by='data_inspecao', ascending=False)
                
                latest_date = shelter_inspections['data_inspecao'].iloc[0]
                inspections_on_latest_date = shelter_inspections[shelter_inspections['data_inspecao'] == latest_date]
                
                approved_on_latest = inspections_on_latest_date[inspections_on_latest_date['status_geral'] != 'Reprovado com Pendências']
                
                if not approved_on_latest.empty:
                    latest_inspections_list.append(approved_on_latest.iloc[0])
                else:
                    latest_inspections_list.append(inspections_on_latest_date.iloc[0])

    latest_inspections = pd.DataFrame(latest_inspections_list)

    if not latest_inspections.empty:
        dashboard_df = pd.merge(df_shelters_registered[['id_abrigo', 'cliente', 'local']], latest_inspections, on='id_abrigo', how='left')
    else:
        dashboard_df = df_shelters_registered.copy()
        for col in ['data_inspecao', 'data_proxima_inspecao', 'status_geral', 'inspetor', 'resultados_json']:
            dashboard_df[col] = None

    today = pd.to_datetime(date.today()).date()
    dashboard_df['data_proxima_inspecao'] = pd.to_datetime(dashboard_df['data_proxima_inspecao'], errors='coerce').dt.date

    conditions = [
        (dashboard_df['data_inspecao'].isna()),
        (dashboard_df['data_proxima_inspecao'] < today),
        (dashboard_df['status_geral'] == 'Reprovado com Pendências')
    ]
    choices = ['🔵 PENDENTE (Nova Inspeção)', '🔴 VENCIDO', '🟠 COM PENDÊNCIAS']
    dashboard_df['status_dashboard'] = np.select(conditions, choices, default='🟢 OK')

    # Formata datas para exibição
    dashboard_df['data_inspecao_str'] = dashboard_df['data_inspecao'].apply(lambda x: x.strftime('%d/%m/%Y') if pd.notna(x) else 'N/A')
    dashboard_df['data_proxima_inspecao_str'] = dashboard_df['data_proxima_inspecao'].apply(lambda x: x.strftime('%d/%m/%Y') if pd.notna(x) else 'N/A')
    dashboard_df['inspetor'] = dashboard_df['inspetor'].fillna('N/A')
    dashboard_df['resultados_json'] = dashboard_df['resultados_json'].fillna('{}')

    display_columns = ['id_abrigo', 'status_dashboard', 'data_inspecao_str', 'data_proxima_inspecao_str', 'status_geral', 'inspetor', 'resultados_json', 'local']
    existing_columns = [col for col in display_columns if col in dashboard_df.columns]
    
    return dashboard_df[existing_columns]

def get_consolidated_status_df(df_full, df_locais):
    """
    Gera DataFrame consolidado de status para extintores.
    
    Args:
        df_full: DataFrame completo do histórico de extintores
        df_locais: DataFrame dos locais cadastrados
        
    Returns:
        pd.DataFrame: Status consolidado dos extintores
    """
    if df_full.empty: 
        return pd.DataFrame()
    
    consolidated_data = []
    df_copy = df_full.copy()
    df_copy['data_servico'] = pd.to_datetime(df_copy['data_servico'], errors='coerce')
    df_copy = df_copy.dropna(subset=['data_servico'])
    
    unique_ids = df_copy['numero_identificacao'].unique()

    for ext_id in unique_ids:
        ext_df = df_copy[df_copy['numero_identificacao'] == ext_id].sort_values(by='data_servico')
        if ext_df.empty: 
            continue
        
        latest_record_info = ext_df.iloc[-1]
        
        last_insp_date = ext_df['data_servico'].max()
        last_maint2_date = ext_df[ext_df['tipo_servico'] == 'Manutenção Nível 2']['data_servico'].max()
        last_maint3_date = ext_df[ext_df['tipo_servico'] == 'Manutenção Nível 3']['data_servico'].max()
        
        next_insp = (last_insp_date + relativedelta(months=1)) if pd.notna(last_insp_date) else pd.NaT
        next_maint2 = (last_maint2_date + relativedelta(months=12)) if pd.notna(last_maint2_date) else pd.NaT
        next_maint3 = (last_maint3_date + relativedelta(years=5)) if pd.notna(last_maint3_date) else pd.NaT
        
        vencimentos = [d for d in [next_insp, next_maint2, next_maint3] if pd.notna(d)]
        if not vencimentos: 
            continue
        proximo_vencimento_real = min(vencimentos)
        
        today_ts = pd.Timestamp(date.today())
        status_atual = "OK"
        
        if latest_record_info.get('plano_de_acao') == "FORA DE OPERAÇÃO (SUBSTITUÍDO)":
            status_atual = "FORA DE OPERAÇÃO"
        elif latest_record_info.get('aprovado_inspecao') == 'Não': 
            status_atual = "NÃO CONFORME (Aguardando Ação)"
        elif proximo_vencimento_real < today_ts: 
            status_atual = "VENCIDO"

        if status_atual == "FORA DE OPERAÇÃO":
            continue

        consolidated_data.append({
            'numero_identificacao': ext_id,
            'numero_selo_inmetro': latest_record_info.get('numero_selo_inmetro'),
            'tipo_agente': latest_record_info.get('tipo_agente'),
            'status_atual': status_atual,
            'proximo_vencimento_geral': proximo_vencimento_real.strftime('%d/%m/%Y'),
            'prox_venc_inspecao': next_insp.strftime('%d/%m/%Y') if pd.notna(next_insp) else "N/A",
            'prox_venc_maint2': next_maint2.strftime('%d/%m/%Y') if pd.notna(next_maint2) else "N/A",
            'prox_venc_maint3': next_maint3.strftime('%d/%m/%Y') if pd.notna(next_maint3) else "N/A",
            'plano_de_acao': latest_record_info.get('plano_de_acao'),
        })

    if not consolidated_data:
        return pd.DataFrame()

    dashboard_df = pd.DataFrame(consolidated_data)
    
    if not df_locais.empty:
        df_locais = df_locais.rename(columns={'id': 'numero_identificacao'})
        df_locais['numero_identificacao'] = df_locais['numero_identificacao'].astype(str)
        dashboard_df = pd.merge(dashboard_df, df_locais[['numero_identificacao', 'local']], on='numero_identificacao', how='left')
        dashboard_df['status_instalacao'] = dashboard_df['local'].apply(lambda x: f"✅ {x}" if pd.notna(x) and str(x).strip() != '' else "⚠️ Local não definido")
    else:
        dashboard_df['status_instalacao'] = "⚠️ Local não definido"
        
    return dashboard_df

# ============================================================================
# FUNÇÕES AUXILIARES DE CÁLCULO COM PROTEÇÃO
# ============================================================================

def calculate_equipment_metrics(status_series):
    """
    Calcula métricas de equipamentos de forma segura.
    
    Args:
        status_series: Série pandas com status dos equipamentos
        
    Returns:
        dict: Dicionário com métricas calculadas
    """
    if status_series.empty:
        return {
            'total': 0,
            'ok_count': 0,
            'pending_count': 0,
            'expired_count': 0,
            'ok_percentage': 0.0,
            'compliance_rate': 0.0
        }
    
    total_count = len(status_series)
    status_counts = status_series.value_counts()
    
    # Contadores seguros
    ok_count = status_counts.get('🟢 OK', 0)
    pending_count = sum(status_counts.get(status, 0) for status in status_counts.index if '🟠' in str(status) or '🔵' in str(status))
    expired_count = sum(status_counts.get(status, 0) for status in status_counts.index if '🔴' in str(status))
    
    # Cálculos protegidos contra divisão por zero
    ok_percentage = safe_percentage(ok_count, total_count)
    compliance_rate = safe_percentage(ok_count, total_count)
    
    return {
        'total': total_count,
        'ok_count': ok_count,
        'pending_count': pending_count,
        'expired_count': expired_count,
        'ok_percentage': ok_percentage,
        'compliance_rate': compliance_rate
    }

def calculate_maintenance_ratio(df_maintenance, df_total, format_output=False):
    """
    Calcula razão de manutenção de forma segura.
    
    Args:
        df_maintenance: DataFrame com equipamentos em manutenção
        df_total: DataFrame com total de equipamentos
        format_output: Se True, retorna string formatada
        
    Returns:
        float ou str: Razão calculada
    """
    maintenance_count = len(df_maintenance) if not df_maintenance.empty else 0
    total_count = len(df_total) if not df_total.empty else 0
    
    return safe_ratio(maintenance_count, total_count, format_output)

# ============================================================================
# FUNÇÃO DE TESTE PARA VALIDAÇÃO DAS CORREÇÕES
# ============================================================================

def test_safe_calculations():
    """
    Testa as funções de cálculo seguro para validar as correções do Bug 5.
    
    Returns:
        bool: True se todos os testes passaram
    """
    print("🧪 Testando correções do Bug 5...")
    
    # Teste 1: Divisão por zero
    assert safe_division(10, 0) == 0, "Falha no teste de divisão por zero"
    assert safe_division(10, 0, default=-1) == -1, "Falha no teste de divisão por zero com default"
    
    # Teste 2: Percentual com zero
    assert safe_percentage(5, 0) == 0.0, "Falha no teste de percentual com denominador zero"
    assert safe_percentage(0, 10) == 0.0, "Falha no teste de percentual com numerador zero"
    assert safe_percentage(5, 10) == 50.0, "Falha no teste de percentual normal"
    
    # Teste 3: Razão formatada
    assert safe_ratio(5, 10, format_as_fraction=True) == "5/10", "Falha no teste de razão formatada"
    assert safe_ratio(5, 0, format_as_fraction=True) == "5/0", "Falha no teste de razão formatada com zero"
    
    # Teste 4: Métricas de equipamentos
    test_series = pd.Series(['🟢 OK', '🔴 VENCIDO', '🟢 OK', '🟠 PENDENTE'])
    metrics = calculate_equipment_metrics(test_series)
    assert metrics['total'] == 4, "Falha no cálculo de total"
    assert metrics['ok_percentage'] == 50.0, "Falha no cálculo de percentual"
    
    # Teste 5: DataFrame vazio
    empty_metrics = calculate_equipment_metrics(pd.Series(dtype=object))
    assert empty_metrics['total'] == 0, "Falha no tratamento de série vazia"
    assert empty_metrics['ok_percentage'] == 0.0, "Falha no cálculo de percentual vazio"
    
    print("✅ Todos os testes do Bug 5 passaram!")
    return True

# ============================================================================
# FUNÇÕES DE DADOS PARA CARREGAMENTO OTIMIZADO
# ============================================================================

@st.cache_data(ttl=300, show_spinner=False)
def load_all_dashboard_data():
    """
    Carrega todos os dados necessários para o dashboard de forma otimizada.
    
    Returns:
        dict: Dicionário com todos os DataFrames carregados
    """
    try:
        data = {
            'hoses': load_sheet_data(HOSE_SHEET_NAME),
            'hose_disposals': load_sheet_data(HOSE_DISPOSAL_LOG_SHEET_NAME),
            'shelters': load_sheet_data(SHELTER_SHEET_NAME),
            'shelter_inspections': load_sheet_data(INSPECTIONS_SHELTER_SHEET_NAME),
            'shelter_actions': load_sheet_data(LOG_SHELTER_SHEET_NAME),
            'scba_main': load_sheet_data(SCBA_SHEET_NAME),
            'scba_visual': load_sheet_data(SCBA_VISUAL_INSPECTIONS_SHEET_NAME),
            'eyewash_inspections': load_sheet_data(EYEWASH_INSPECTIONS_SHEET_NAME),
            'foam_inventory': load_sheet_data(FOAM_CHAMBER_INVENTORY_SHEET_NAME),
            'foam_inspections': load_sheet_data(FOAM_CHAMBER_INSPECTIONS_SHEET_NAME),
            'foam_actions': load_sheet_data(LOG_FOAM_CHAMBER_SHEET_NAME),
            'multigas_inventory': load_sheet_data(MULTIGAS_INVENTORY_SHEET_NAME),
            'multigas_inspections': load_sheet_data(MULTIGAS_INSPECTIONS_SHEET_NAME)
        }
        
        return data
        
    except Exception as e:
        st.error(f"Erro ao carregar dados do dashboard: {e}")
        return {key: pd.DataFrame() for key in [
            'hoses', 'hose_disposals', 'shelters', 'shelter_inspections', 'shelter_actions',
            'scba_main', 'scba_visual', 'eyewash_inspections', 'foam_inventory', 
            'foam_inspections', 'foam_actions', 'multigas_inventory', 'multigas_inspections'
        ]}

def get_dashboard_summary_stats(all_data):
    """
    Gera estatísticas resumidas para o dashboard principal.
    
    Args:
        all_data: Dicionário com todos os dados carregados
        
    Returns:
        dict: Estatísticas consolidadas de todos os equipamentos
    """
    summary = {
        'equipments': {},
        'overall_health': {},
        'alerts': []
    }
    
    try:
        # Estatísticas de Mangueiras
        hose_df = get_hose_status_df(all_data['hoses'], all_data['hose_disposals'])
        if not hose_df.empty:
            hose_metrics = calculate_equipment_metrics(hose_df['status'])
            summary['equipments']['hoses'] = hose_metrics
        
        # Estatísticas de Abrigos
        shelter_df = get_shelter_status_df(all_data['shelters'], all_data['shelter_inspections'])
        if not shelter_df.empty:
            shelter_metrics = calculate_equipment_metrics(shelter_df['status_dashboard'])
            summary['equipments']['shelters'] = shelter_metrics
        
        # Estatísticas de SCBAs
        scba_df = get_scba_status_df(all_data['scba_main'], all_data['scba_visual'])
        if not scba_df.empty:
            scba_metrics = calculate_equipment_metrics(scba_df['status_consolidado'])
            summary['equipments']['scba'] = scba_metrics
        
        # Estatísticas de Chuveiros/Lava-olhos
        eyewash_df = get_eyewash_status_df(all_data['eyewash_inspections'])
        if not eyewash_df.empty:
            eyewash_metrics = calculate_equipment_metrics(eyewash_df['status_dashboard'])
            summary['equipments']['eyewash'] = eyewash_metrics
        
        # Estatísticas de Câmaras de Espuma
        foam_df = get_foam_chamber_status_df(all_data['foam_inspections'])
        if not foam_df.empty:
            foam_metrics = calculate_equipment_metrics(foam_df['status_dashboard'])
            summary['equipments']['foam'] = foam_metrics
        
        # Estatísticas de Detectores Multigás
        multigas_df = get_multigas_status_df(all_data['multigas_inventory'], all_data['multigas_inspections'])
        if not multigas_df.empty:
            # Para multigás, consideramos OK apenas se ambos calibração e bump test estão OK
            multigas_overall_status = []
            for _, row in multigas_df.iterrows():
                if row['status_calibracao'] == '🟢 OK' and row['status_bump_test'] == '🟢 OK':
                    multigas_overall_status.append('🟢 OK')
                elif '🔴' in str(row['status_calibracao']) or '🔴' in str(row['status_bump_test']):
                    multigas_overall_status.append('🔴 CRÍTICO')
                else:
                    multigas_overall_status.append('🟠 PENDENTE')
            
            multigas_metrics = calculate_equipment_metrics(pd.Series(multigas_overall_status))
            summary['equipments']['multigas'] = multigas_metrics
        
        # Cálculo da saúde geral do sistema
        total_equipment = 0
        total_ok = 0
        total_critical = 0
        
        for equipment_type, metrics in summary['equipments'].items():
            total_equipment += metrics.get('total', 0)
            total_ok += metrics.get('ok_count', 0)
            if equipment_type != 'multigas':
                total_critical += metrics.get('expired_count', 0)
            else:
                # Para multigás, critical inclui vencidos e reprovados
                total_critical += metrics.get('expired_count', 0)
        
        # Saúde geral do sistema com proteção contra divisão por zero
        overall_health_percentage = safe_percentage(total_ok, total_equipment)
        critical_percentage = safe_percentage(total_critical, total_equipment)
        
        summary['overall_health'] = {
            'total_equipment': total_equipment,
            'healthy_percentage': overall_health_percentage,
            'critical_percentage': critical_percentage,
            'health_status': 'Excelente' if overall_health_percentage >= 90 else 
                           'Bom' if overall_health_percentage >= 75 else
                           'Regular' if overall_health_percentage >= 60 else 'Crítico'
        }
        
        # Geração de alertas automáticos
        for equipment_type, metrics in summary['equipments'].items():
            if metrics.get('expired_count', 0) > 0:
                summary['alerts'].append({
                    'type': 'critical',
                    'equipment': equipment_type,
                    'count': metrics['expired_count'],
                    'message': f"{equipment_type.title()}: {metrics['expired_count']} equipamento(s) vencido(s)"
                })
            
            # Alerta para baixa conformidade
            if metrics.get('compliance_rate', 0) < 50:
                summary['alerts'].append({
                    'type': 'warning', 
                    'equipment': equipment_type,
                    'percentage': metrics['compliance_rate'],
                    'message': f"{equipment_type.title()}: Taxa de conformidade baixa ({metrics['compliance_rate']:.1f}%)"
                })
    
    except Exception as e:
        st.error(f"Erro ao calcular estatísticas do dashboard: {e}")
        summary['equipments'] = {}
        summary['overall_health'] = {'health_status': 'Erro no cálculo', 'total_equipment': 0}
        summary['alerts'] = [{'type': 'error', 'message': f'Erro no processamento: {e}'}]
    
    return summary
