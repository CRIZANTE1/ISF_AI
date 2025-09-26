import streamlit as st
import pandas as pd
import numpy as np
import json
from datetime import date
from dateutil.relativedelta import relativedelta
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
    MULTIGAS_INSPECTIONS_SHEET_NAME,
    ALARM_INVENTORY_SHEET_NAME,
    ALARM_INSPECTIONS_SHEET_NAME,
    LOG_ALARM_SHEET_NAME
)



def safe_percentage(numerator, denominator):
    """
    Calcula porcentagem de forma segura, evitando divisão por zero.
    
    Args:
        numerator: Valor numerador
        denominator: Valor denominador
        
    Returns:
        float: Porcentagem ou 0 se denominador for zero
    """
    if denominator == 0:
        return 0.0
    return (numerator / denominator) * 100

def calculate_equipment_metrics(status_series):
    """
    Calcula métricas de status de equipamentos.
    
    Args:
        status_series: Série pandas com os status dos equipamentos
        
    Returns:
        dict: Dicionário com métricas calculadas
    """
    if status_series.empty:
        return {
            'total': 0,
            'ok_count': 0,
            'expired_count': 0,
            'pending_count': 0,
            'compliance_rate': 0.0
        }
    
    total = len(status_series)
    ok_count = sum(1 for status in status_series if '🟢' in str(status))
    expired_count = sum(1 for status in status_series if '🔴' in str(status))
    pending_count = sum(1 for status in status_series if '🟠' in str(status) or '🔵' in str(status))
    
    compliance_rate = safe_percentage(ok_count, total)
    
    return {
        'total': total,
        'ok_count': ok_count,
        'expired_count': expired_count,
        'pending_count': pending_count,
        'compliance_rate': compliance_rate
    }


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
            'multigas_inspections': load_sheet_data(MULTIGAS_INSPECTIONS_SHEET_NAME),
            'alarm_inspections': load_sheet_data(ALARM_INSPECTIONS_SHEET_NAME),
            'alarm_inventory': load_sheet_data(ALARM_INVENTORY_SHEET_NAME),
            'alarm_actions': load_sheet_data(LOG_ALARM_SHEET_NAME)
        }
        
        return data
        
    except Exception as e:
        st.error(f"Erro ao carregar dados do dashboard: {e}")
        return {key: pd.DataFrame() for key in [
            'hoses', 'hose_disposals', 'shelters', 'shelter_inspections', 'shelter_actions',
            'scba_main', 'scba_visual', 'eyewash_inspections', 'foam_inventory', 
            'foam_inspections', 'foam_actions', 'multigas_inventory', 'multigas_inspections',
            'alarm_inspections', 'alarm_inventory', 'alarm_actions'
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
            
        # Estatísticas de Sistemas de Alarme
        alarm_df = get_alarm_status_df(all_data['alarm_inspections'])
        if not alarm_df.empty:
            alarm_metrics = calculate_equipment_metrics(alarm_df['status_dashboard'])
            summary['equipments']['alarm'] = alarm_metrics
        
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
