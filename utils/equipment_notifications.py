"""
Sistema de Notificações Periódicas de Equipamentos
Monitora vencimentos e pendências, enviando alertas automáticos para usuários
"""

import os
import pandas as pd
import logging
from datetime import date, timedelta
from typing import List, Dict, Any

# Imports condicionais para compatibilidade com GitHub Actions
try:
    import streamlit as st
    STREAMLIT_AVAILABLE = True
except ImportError:
    STREAMLIT_AVAILABLE = False
    # Mock do st.secrets para GitHub Actions
    class MockSecrets:
        @staticmethod
        def get(key, default=None):
            if key == "app" and default is None:
                return {"url": os.environ.get("APP_URL", "https://isnpecoessmaia.streamlit.app")}
            return default or {}
    
    class MockSt:
        secrets = MockSecrets()
    
    st = MockSt()

# Imports condicionais para compatibilidade com GitHub Actions
try:
    from gdrive.gdrive_upload import GoogleDriveUploader
    from gdrive.config import (
        EXTINGUISHER_SHEET_NAME, HOSE_SHEET_NAME, SCBA_SHEET_NAME,
        EYEWASH_INVENTORY_SHEET_NAME, MULTIGAS_INVENTORY_SHEET_NAME,
        FOAM_CHAMBER_INVENTORY_SHEET_NAME
    )
    GDRIVE_AVAILABLE = True
except ImportError:
    GDRIVE_AVAILABLE = False
    # Mock classes para GitHub Actions
    class MockGoogleDriveUploader:
        def __init__(self, is_matrix=False):
            self.spreadsheet_id: str | None = None

        def get_data_from_sheet(self, sheet_name):
            return []

        def append_data_to_sheet(self, sheet_name, data):
            return True

    GoogleDriveUploader = MockGoogleDriveUploader

    # Mock constants
    EXTINGUISHER_SHEET_NAME = "extintores"
    HOSE_SHEET_NAME = "mangueiras"
    SCBA_SHEET_NAME = "scba"
    EYEWASH_INVENTORY_SHEET_NAME = "eyewash"
    MULTIGAS_INVENTORY_SHEET_NAME = "multigas_inventario"
    FOAM_CHAMBER_INVENTORY_SHEET_NAME = "foam_chamber"

logger = logging.getLogger(__name__)

def get_notification_handler():
    """Carrega o handler de notificações com import dinâmico"""
    try:
        from utils.github_notifications import get_notification_handler as _get_handler
        return _get_handler()
    except (ImportError, ModuleNotFoundError):
        # Fallback para GitHub Actions. A lógica do handler é replicada aqui
        # para evitar o erro de import do Streamlit de github_notifications.py.
        import json
        from datetime import datetime

        logger.info("Using fallback notification handler defined in equipment_notifications.py.")

        class FallbackGitHubNotificationHandler:
            def queue_notification(self, notification_type: str, recipient_email: str, 
                                  recipient_name: str, **kwargs):
                try:
                    # Prepara dados JSON para a coluna de dados
                    notification_data = {**kwargs}
                    
                    # Linha para adicionar na planilha
                    notification_row = [
                        datetime.now().strftime('%Y-%m-%d %H:%M:%S'),  # timestamp
                        notification_type,                             # tipo_notificacao
                        recipient_email,                               # email_destinatario
                        recipient_name,                               # nome_destinatario
                        json.dumps(notification_data, ensure_ascii=False, default=str),  # dados_json
                        'pendente'                                    # status
                    ]
                    
                    # Adiciona à planilha matriz
                    matrix_uploader = GoogleDriveUploader(is_matrix=True)
                    matrix_uploader.append_data_to_sheet('notificacoes_pendentes', [notification_row])
                    
                    logger.info(f"Notificação '{notification_type}' adicionada à fila para {recipient_email}")
                    return True
                    
                except Exception as e:
                    logger.error(f"Erro ao adicionar notificação à fila: {e}")
                    return False
    
            def trigger_notification_workflow(self, notification_type: str, recipient_email: str, 
                                            recipient_name: str, **kwargs):
                success = self.queue_notification(
                    notification_type, recipient_email, recipient_name, **kwargs
                )
                
                if success:
                    logger.info(f"Notificação '{notification_type}' adicionada à fila para processamento automático")
                else:
                    logger.error(f"Falha ao adicionar notificação à fila para {recipient_email}")
                
                return success

        return FallbackGitHubNotificationHandler()

def get_users_data():
    """Carrega dados de usuários com import dinâmico"""
    try:
        from auth.auth_utils import get_users_data as _get_users
        return _get_users()
    except ImportError:
        # Fallback para GitHub Actions
        if not GDRIVE_AVAILABLE:
            logger.warning("GoogleDrive não disponível em ambiente GitHub Actions")
            return pd.DataFrame()

        # carrega diretamente da planilha
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        users_data = matrix_uploader.get_data_from_sheet("usuarios")

        if not users_data or len(users_data) < 2:
            return pd.DataFrame()

        df = pd.DataFrame(users_data[1:], columns=users_data[0])
        return df

class EquipmentNotificationSystem:
    """Sistema de notificações para equipamentos vencendo e pendências"""
    
    def __init__(self):
        self.notification_handler = get_notification_handler()
        
    def notify_equipment_expiring(self, user_email: str, user_name: str, expiring_equipment: List[Dict], days_notice: int = 30):
        """Notifica usuário sobre equipamentos vencendo"""
        return self.notification_handler.trigger_notification_workflow(
            notification_type="equipment_expiring",
            recipient_email=user_email,
            recipient_name=user_name,
            expiring_equipment=expiring_equipment,
            days_notice=days_notice,
            total_items=len(expiring_equipment),
            login_url=st.secrets.get("app", {}).get("url", "https://sua-app.streamlit.app")
        )
    
    def notify_pending_issues(self, user_email: str, user_name: str, pending_issues: List[Dict]):
        """Notifica usuário sobre pendências não resolvidas"""
        return self.notification_handler.trigger_notification_workflow(
            notification_type="pending_issues",
            recipient_email=user_email,
            recipient_name=user_name,
            pending_issues=pending_issues,
            total_pending=len(pending_issues),
            login_url=st.secrets.get("app", {}).get("url", "https://sua-app.streamlit.app")
        )
    
    def get_user_expiring_equipment(self, user_spreadsheet_id: str, days_ahead: int = 30) -> List[Dict]:
        """Busca equipamentos que vencem nos próximos X dias para um usuário específico"""
        expiring_equipment = []
        target_date = date.today() + timedelta(days=days_ahead)

        if not GDRIVE_AVAILABLE:
            logger.warning("GoogleDrive não disponível - retornando lista vazia")
            return expiring_equipment

        try:
            # Cria uploader para planilha do usuário
            user_uploader = GoogleDriveUploader(is_matrix=False)
            user_uploader.spreadsheet_id = user_spreadsheet_id
            
            # Verifica extintores
            try:
                extinguisher_data = user_uploader.get_data_from_sheet(EXTINGUISHER_SHEET_NAME)
                if extinguisher_data and len(extinguisher_data) > 1:
                    df_ext = pd.DataFrame(extinguisher_data[1:], columns=extinguisher_data[0])
                    
                    # Converte datas e verifica vencimentos
                    date_columns = ['data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 'data_proxima_manutencao_3_nivel']
                    for col in date_columns:
                        if col in df_ext.columns:
                            df_ext[col] = pd.to_datetime(df_ext[col], errors='coerce').dt.date
                            expiring = df_ext[
                                (df_ext[col].notna()) & 
                                (df_ext[col] <= target_date) & 
                                (df_ext[col] >= date.today())
                            ]
                            
                            for _, row in expiring.iterrows():
                                expiring_equipment.append({
                                    'tipo': 'Extintor',
                                    'identificacao': row.get('numero_identificacao', 'N/A'),
                                    'servico': col.replace('data_proxima_', '').replace('_', ' ').title(),
                                    'data_vencimento': row[col].strftime('%d/%m/%Y'),
                                    'dias_restantes': (row[col] - date.today()).days
                                })
            except Exception as e:
                logger.warning(f"Erro ao verificar extintores: {e}")
            
            # Verifica mangueiras
            try:
                hose_data = user_uploader.get_data_from_sheet(HOSE_SHEET_NAME)
                if hose_data and len(hose_data) > 1:
                    df_hose = pd.DataFrame(hose_data[1:], columns=hose_data[0])
                    
                    if 'data_proximo_teste' in df_hose.columns:
                        df_hose['data_proximo_teste'] = pd.to_datetime(df_hose['data_proximo_teste'], errors='coerce').dt.date
                        expiring_hoses = df_hose[
                            (df_hose['data_proximo_teste'].notna()) & 
                            (df_hose['data_proximo_teste'] <= target_date) & 
                            (df_hose['data_proximo_teste'] >= date.today())
                        ]
                        
                        for _, row in expiring_hoses.iterrows():
                            expiring_equipment.append({
                                'tipo': 'Mangueira',
                                'identificacao': row.get('id_mangueira', 'N/A'),
                                'servico': 'Teste Hidrostático',
                                'data_vencimento': row['data_proximo_teste'].strftime('%d/%m/%Y'),
                                'dias_restantes': (row['data_proximo_teste'] - date.today()).days
                            })
            except Exception as e:
                logger.warning(f"Erro ao verificar mangueiras: {e}")
            
            # Verifica SCBAs
            try:
                scba_data = user_uploader.get_data_from_sheet(SCBA_SHEET_NAME)
                if scba_data and len(scba_data) > 1:
                    df_scba = pd.DataFrame(scba_data[1:], columns=scba_data[0])
                    
                    if 'data_validade' in df_scba.columns:
                        df_scba['data_validade'] = pd.to_datetime(df_scba['data_validade'], errors='coerce').dt.date
                        expiring_scba = df_scba[
                            (df_scba['data_validade'].notna()) & 
                            (df_scba['data_validade'] <= target_date) & 
                            (df_scba['data_validade'] >= date.today())
                        ]
                        
                        for _, row in expiring_scba.iterrows():
                            expiring_equipment.append({
                                'tipo': 'SCBA',
                                'identificacao': row.get('numero_serie_equipamento', 'N/A'),
                                'servico': 'Validade do Laudo',
                                'data_vencimento': row['data_validade'].strftime('%d/%m/%Y'),
                                'dias_restantes': (row['data_validade'] - date.today()).days
                            })
            except Exception as e:
                logger.warning(f"Erro ao verificar SCBAs: {e}")
            
            # Verifica detectores multigás
            try:
                multigas_data = user_uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)
                if multigas_data and len(multigas_data) > 1:
                    df_multi = pd.DataFrame(multigas_data[1:], columns=multigas_data[0])
                    
                    # Busca calibrações na aba de inspeções
                    try:
                        if GDRIVE_AVAILABLE:
                            from gdrive.config import MULTIGAS_INSPECTIONS_SHEET_NAME
                        else:
                            MULTIGAS_INSPECTIONS_SHEET_NAME = "multigas_inspecoes"
                        inspections_data = user_uploader.get_data_from_sheet(MULTIGAS_INSPECTIONS_SHEET_NAME)
                        if inspections_data and len(inspections_data) > 1:
                            df_insp = pd.DataFrame(inspections_data[1:], columns=inspections_data[0])
                            
                            if 'proxima_calibracao' in df_insp.columns:
                                df_insp['proxima_calibracao'] = pd.to_datetime(df_insp['proxima_calibracao'], errors='coerce').dt.date
                                expiring_calibrations = df_insp[
                                    (df_insp['proxima_calibracao'].notna()) & 
                                    (df_insp['proxima_calibracao'] <= target_date) & 
                                    (df_insp['proxima_calibracao'] >= date.today())
                                ]
                                
                                for _, row in expiring_calibrations.iterrows():
                                    expiring_equipment.append({
                                        'tipo': 'Detector Multigás',
                                        'identificacao': row.get('id_equipamento', 'N/A'),
                                        'servico': 'Calibração',
                                        'data_vencimento': row['proxima_calibracao'].strftime('%d/%m/%Y'),
                                        'dias_restantes': (row['proxima_calibracao'] - date.today()).days
                                    })
                    except Exception as e:
                        logger.warning(f"Erro ao verificar calibrações multigás: {e}")
            except Exception as e:
                logger.warning(f"Erro ao verificar multigás: {e}")
                
        except Exception as e:
            logger.error(f"Erro geral ao buscar equipamentos vencendo: {e}")
        
        # Ordena por dias restantes (mais urgente primeiro)
        expiring_equipment.sort(key=lambda x: x['dias_restantes'])
        
        return expiring_equipment
    
    def get_user_pending_issues(self, user_spreadsheet_id: str) -> List[Dict]:
        """Busca pendências não resolvidas para um usuário específico"""
        pending_issues = []

        if not GDRIVE_AVAILABLE:
            logger.warning("GoogleDrive não disponível - retornando lista vazia")
            return pending_issues

        try:
            user_uploader = GoogleDriveUploader(is_matrix=False)
            user_uploader.spreadsheet_id = user_spreadsheet_id
            
            # Verifica extintores reprovados sem ações corretivas
            try:
                extinguisher_data = user_uploader.get_data_from_sheet(EXTINGUISHER_SHEET_NAME)
                if extinguisher_data and len(extinguisher_data) > 1:
                    df_ext = pd.DataFrame(extinguisher_data[1:], columns=extinguisher_data[0])
                    
                    if 'aprovado_inspecao' in df_ext.columns:
                        failed_extinguishers = df_ext[
                            (df_ext['aprovado_inspecao'].str.lower().isin(['não', 'nao', 'reprovado', 'r'])) &
                            (df_ext['plano_de_acao'].fillna('').str.strip() == '')
                        ]
                        
                        for _, row in failed_extinguishers.iterrows():
                            pending_issues.append({
                                'tipo': 'Extintor Reprovado',
                                'identificacao': row.get('numero_identificacao', 'N/A'),
                                'problema': 'Inspeção reprovada sem plano de ação definido',
                                'data_identificacao': row.get('data_servico', 'N/A'),
                                'prioridade': 'Alta'
                            })
            except Exception as e:
                logger.warning(f"Erro ao verificar pendências de extintores: {e}")
            
            # Verifica mangueiras reprovadas/condenadas
            try:
                hose_data = user_uploader.get_data_from_sheet(HOSE_SHEET_NAME)
                if hose_data and len(hose_data) > 1:
                    df_hose = pd.DataFrame(hose_data[1:], columns=hose_data[0])
                    
                    if 'resultado' in df_hose.columns:
                        failed_hoses = df_hose[
                            df_hose['resultado'].str.lower().isin(['reprovado', 'condenada', 'r', 'c'])
                        ]
                        
                        for _, row in failed_hoses.iterrows():
                            status = 'Condenada' if row['resultado'].lower() in ['condenada', 'c'] else 'Reprovada'
                            pending_issues.append({
                                'tipo': f'Mangueira {status}',
                                'identificacao': row.get('id_mangueira', 'N/A'),
                                'problema': f'Mangueira {status.lower()} necessita substituição',
                                'data_identificacao': row.get('data_inspecao', 'N/A'),
                                'prioridade': 'Crítica' if status == 'Condenada' else 'Alta'
                            })
            except Exception as e:
                logger.warning(f"Erro ao verificar pendências de mangueiras: {e}")
            
            # Verifica equipamentos vencidos (já passaram da data)
            expired_equipment = self.get_user_expiring_equipment(user_spreadsheet_id, days_ahead=0)
            expired_equipment = [eq for eq in expired_equipment if eq['dias_restantes'] < 0]
            
            for eq in expired_equipment:
                pending_issues.append({
                    'tipo': f'{eq["tipo"]} Vencido',
                    'identificacao': eq['identificacao'],
                    'problema': f'{eq["servico"]} vencido há {abs(eq["dias_restantes"])} dias',
                    'data_identificacao': eq['data_vencimento'],
                    'prioridade': 'Crítica'
                })
                
        except Exception as e:
            logger.error(f"Erro geral ao buscar pendências: {e}")
        
        # Ordena por prioridade (Crítica > Alta > Média)
        priority_order = {'Crítica': 0, 'Alta': 1, 'Média': 2}
        pending_issues.sort(key=lambda x: priority_order.get(x['prioridade'], 3))
        
        return pending_issues
    
    def send_periodic_notifications(self, days_notice: int = 30):
        """Função principal para enviar notificações periódicas para todos os usuários ativos"""
        try:
            logger.info("Iniciando envio de notificações periódicas de equipamentos")
            
            # Carrega usuários ativos
            users_df = get_users_data()
            if users_df.empty:
                logger.info("Nenhum usuário encontrado")
                return
            
            active_users = users_df[
                (users_df['status'] == 'ativo') & 
                (users_df['spreadsheet_id'].notna()) & 
                (users_df['spreadsheet_id'] != '')
            ]
            
            notifications_sent = 0
            
            for _, user in active_users.iterrows():
                try:
                    user_email = user['email']
                    user_name = user['nome']
                    spreadsheet_id = user['spreadsheet_id']
                    
                    logger.info(f"Processando notificações para {user_email}")
                    
                    # Busca equipamentos vencendo
                    expiring_equipment = self.get_user_expiring_equipment(spreadsheet_id, days_notice)
                    
                    # Busca pendências
                    pending_issues = self.get_user_pending_issues(spreadsheet_id)
                    
                    # Envia notificação se houver vencimentos
                    if expiring_equipment:
                        self.notify_equipment_expiring(
                            user_email=user_email,
                            user_name=user_name,
                            expiring_equipment=expiring_equipment,
                            days_notice=days_notice
                        )
                        notifications_sent += 1
                        logger.info(f"Notificação de vencimentos enviada para {user_email} ({len(expiring_equipment)} itens)")
                    
                    # Envia notificação se houver pendências
                    if pending_issues:
                        self.notify_pending_issues(
                            user_email=user_email,
                            user_name=user_name,
                            pending_issues=pending_issues
                        )
                        notifications_sent += 1
                        logger.info(f"Notificação de pendências enviada para {user_email} ({len(pending_issues)} itens)")
                        
                except Exception as e:
                    logger.error(f"Erro ao processar usuário {user.get('email', 'N/A')}: {e}")
                    continue
            
            logger.info(f"Notificações periódicas concluídas: {notifications_sent} enviadas")
            
        except Exception as e:
            logger.error(f"Erro no envio de notificações periódicas: {e}")


# Instância global
equipment_notification_system = EquipmentNotificationSystem()

def send_weekly_equipment_notifications():
    """Função para ser chamada semanalmente pelo GitHub Actions"""
    equipment_notification_system.send_periodic_notifications(days_notice=30)

def send_daily_urgent_notifications():
    """Função para ser chamada diariamente pelo GitHub Actions para alertas urgentes"""
    equipment_notification_system.send_periodic_notifications(days_notice=7)
