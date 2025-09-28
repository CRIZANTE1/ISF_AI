"""
Sistema de Notificações Periódicas de Equipamentos
Monitora vencimentos e pendências, enviando alertas automáticos para usuários
"""

import os
import pandas as pd
import logging
import json
from datetime import date, timedelta, datetime
from typing import List, Dict, Any

# Setup de logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Imports condicionais mais robustos
STREAMLIT_AVAILABLE = False
GDRIVE_AVAILABLE = False

try:
    import streamlit as st
    STREAMLIT_AVAILABLE = True
    logger.info("Streamlit carregado com sucesso")
except ImportError:
    logger.info("Streamlit não disponível - usando mock para GitHub Actions")
    # Mock completo do streamlit para GitHub Actions
    class MockSecrets:
        def __init__(self):
            self._data = {
                "app": {"url": os.environ.get("APP_URL", "https://isnpecoessmaia.streamlit.app")},
                "google_drive": {
                    "matrix_sheets_id": os.environ.get("MATRIX_SHEETS_ID", ""),
                    "central_drive_folder_id": os.environ.get("CENTRAL_DRIVE_FOLDER_ID", "")
                }
            }
        
        def get(self, key, default=None):
            keys = key.split(".") if isinstance(key, str) else [key]
            result = self._data
            for k in keys:
                result = result.get(k, {})
            return result if result else default
        
        def __getitem__(self, key):
            keys = key.split(".") if isinstance(key, str) else [key]
            result = self._data
            for k in keys:
                result = result[k]
            return result
    
    class MockSt:
        def __init__(self):
            self.secrets = MockSecrets()
    
    st = MockSt()

try:
    from google.oauth2 import service_account
    from googleapiclient.discovery import build
    
    # Imports específicos do projeto
    from gdrive.gdrive_upload import GoogleDriveUploader
    from gdrive.config import (
        EXTINGUISHER_SHEET_NAME, HOSE_SHEET_NAME, SCBA_SHEET_NAME,
        EYEWASH_INVENTORY_SHEET_NAME, MULTIGAS_INVENTORY_SHEET_NAME,
        FOAM_CHAMBER_INVENTORY_SHEET_NAME, MULTIGAS_INSPECTIONS_SHEET_NAME
    )
    GDRIVE_AVAILABLE = True
    logger.info("Google Drive APIs carregadas com sucesso")
    
except ImportError as e:
    logger.warning(f"Google Drive não disponível - usando fallback: {e}")
    
    # Implementação completa do fallback
    class MockGoogleDriveUploader:
        def __init__(self, is_matrix=False):
            self.is_matrix = is_matrix
            self.spreadsheet_id = None
            self.sheets_service = None
            
            if is_matrix:
                self.spreadsheet_id = os.environ.get('MATRIX_SHEETS_ID')
                logger.info(f"Usando planilha matriz: {self.spreadsheet_id}")
            
            # Inicializar serviço real se credenciais estiverem disponíveis
            self._init_real_service()
        
        def _init_real_service(self):
            """Tenta inicializar o serviço real do Google Sheets"""
            try:
                credentials_json = os.environ.get('GOOGLE_CREDENTIALS')
                if not credentials_json:
                    logger.error("GOOGLE_CREDENTIALS não encontrado no ambiente")
                    return
                
                credentials_dict = json.loads(credentials_json)
                
                from google.oauth2 import service_account
                from googleapiclient.discovery import build
                
                credentials = service_account.Credentials.from_service_account_info(
                    credentials_dict,
                    scopes=['https://www.googleapis.com/auth/spreadsheets']
                )
                
                self.sheets_service = build('sheets', 'v4', credentials=credentials)
                logger.info("Serviço Google Sheets inicializado com sucesso no fallback")
                
            except Exception as e:
                logger.error(f"Erro ao inicializar serviço Google Sheets: {e}")
                self.sheets_service = None

        def get_data_from_sheet(self, sheet_name):
            """Busca dados da planilha usando o serviço real se disponível"""
            if not self.sheets_service or not self.spreadsheet_id:
                logger.warning(f"Serviço não disponível para buscar dados de {sheet_name}")
                return []
            
            try:
                range_name = f"{sheet_name}!A:Z"
                result = self.sheets_service.spreadsheets().values().get(
                    spreadsheetId=self.spreadsheet_id,
                    range=range_name
                ).execute()
                
                data = result.get('values', [])
                logger.info(f"Dados carregados de {sheet_name}: {len(data)} linhas")
                return data
                
            except Exception as e:
                logger.error(f"Erro ao buscar dados de {sheet_name}: {e}")
                return []

        def append_data_to_sheet(self, sheet_name, data):
            """Adiciona dados à planilha usando o serviço real se disponível"""
            if not self.sheets_service or not self.spreadsheet_id:
                logger.warning(f"Serviço não disponível para adicionar dados em {sheet_name}")
                return False
            
            try:
                if not isinstance(data, list):
                    data = []
                if data and not isinstance(data[0], list):
                    data = [data]
                
                body = {'values': data}
                result = self.sheets_service.spreadsheets().values().append(
                    spreadsheetId=self.spreadsheet_id,
                    range=f"{sheet_name}!A:A",
                    valueInputOption='USER_ENTERED',
                    insertDataOption='INSERT_ROWS',
                    body=body
                ).execute()
                
                logger.info(f"Dados adicionados a {sheet_name} com sucesso")
                return True
                
            except Exception as e:
                logger.error(f"Erro ao adicionar dados em {sheet_name}: {e}")
                return False

    GoogleDriveUploader = MockGoogleDriveUploader
    
    # Mock constants
    EXTINGUISHER_SHEET_NAME = "extintores"
    HOSE_SHEET_NAME = "mangueiras"
    SCBA_SHEET_NAME = "conjuntos_autonomos"
    EYEWASH_INVENTORY_SHEET_NAME = "chuveiros_lava_olhos"
    MULTIGAS_INVENTORY_SHEET_NAME = "multigas_inventario"
    FOAM_CHAMBER_INVENTORY_SHEET_NAME = "camaras_espuma_inventario"
    MULTIGAS_INSPECTIONS_SHEET_NAME = "inspecoes_multigas"

def get_notification_handler():
    """Carrega o handler de notificações com import dinâmico"""
    logger.info("Inicializando handler de notificações...")
    
    # Para GitHub Actions, usa o FallbackGitHubNotificationHandler direto
    if not STREAMLIT_AVAILABLE:
        logger.info("Ambiente GitHub Actions detectado - usando handler fallback")
        
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
                    success = matrix_uploader.append_data_to_sheet('notificacoes_pendentes', [notification_row])
                    
                    if success:
                        logger.info(f"Notificação '{notification_type}' adicionada à fila para {recipient_email}")
                    else:
                        logger.error(f"Falha ao adicionar notificação à fila para {recipient_email}")
                        
                    return success
                    
                except Exception as e:
                    logger.error(f"Erro ao adicionar notificação à fila: {e}")
                    return False
        
            def trigger_notification_workflow(self, notification_type: str, recipient_email: str, 
                                            recipient_name: str, **kwargs):
                success = self.queue_notification(
                    notification_type, recipient_email, recipient_name, **kwargs
                )
                return success

        return FallbackGitHubNotificationHandler()
    
    # Para ambiente Streamlit, tenta importar o handler normal
    try:
        from utils.github_notifications import get_notification_handler as _get_handler
        return _get_handler()
    except (ImportError, ModuleNotFoundError):
        logger.warning("Handler normal não disponível - usando fallback")
        # Retorna o mesmo fallback se necessário
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
                    success = matrix_uploader.append_data_to_sheet('notificacoes_pendentes', [notification_row])
                    
                    if success:
                        logger.info(f"Notificação '{notification_type}' adicionada à fila para {recipient_email}")
                    else:
                        logger.error(f"Falha ao adicionar notificação à fila para {recipient_email}")
                        
                    return success
                    
                except Exception as e:
                    logger.error(f"Erro ao adicionar notificação à fila: {e}")
                    return False
            
            def trigger_notification_workflow(self, notification_type: str, recipient_email: str, 
                                            recipient_name: str, **kwargs):
                success = self.queue_notification(
                    notification_type, recipient_email, recipient_name, **kwargs
                )
                return success

        return FallbackGitHubNotificationHandler()

def get_users_data():
    """Carrega dados de usuários com import dinâmico"""
    try:
        if STREAMLIT_AVAILABLE:
            from auth.auth_utils import get_users_data as _get_users
            result = _get_users()
            logger.info(f"Usuários carregados via auth_utils: {len(result) if not result.empty else 0}")
            return result
    except ImportError:
        pass
    
    # Fallback para GitHub Actions
    logger.info("Carregando usuários diretamente da planilha matriz")
    
    try:
        matrix_uploader = GoogleDriveUploader(is_matrix=True)
        users_data = matrix_uploader.get_data_from_sheet("usuarios")

        if not users_data or len(users_data) < 2:
            logger.warning("Planilha de usuários vazia ou sem dados")
            return pd.DataFrame()

        # Log dos dados brutos para debug
        headers = users_data[0]
        logger.info(f"Cabeçalhos brutos encontrados ({len(headers)}): {headers}")
        
        # Limpa cabeçalhos vazios e normaliza
        clean_headers = []
        for i, header in enumerate(headers):
            if header and str(header).strip():
                clean_headers.append(str(header).strip())
            else:
                clean_headers.append(f"coluna_vazia_{i}")
        
        logger.info(f"Cabeçalhos limpos ({len(clean_headers)}): {clean_headers}")
        
        # Verifica se há dados
        data_rows = users_data[1:]
        if not data_rows:
            logger.warning("Nenhuma linha de dados encontrada")
            return pd.DataFrame()
        
        # Log do primeiro registro para debug
        first_row = data_rows[0] if data_rows else []
        logger.info(f"Primeira linha de dados ({len(first_row)}): {first_row}")
        
        # Normaliza os dados - garante que todas as linhas tenham o mesmo número de colunas
        normalized_data = []
        num_columns = len(clean_headers)
        
        for i, row in enumerate(data_rows):
            # Garante que a linha seja uma lista
            if not isinstance(row, list):
                row = list(row) if row else []
            
            # Completa com strings vazias se a linha tiver menos colunas
            if len(row) < num_columns:
                row = row + [''] * (num_columns - len(row))
            # Trunca se a linha tiver mais colunas
            elif len(row) > num_columns:
                row = row[:num_columns]
            
            # Converte todos os valores para string para evitar problemas de tipo
            normalized_row = [str(cell).strip() if cell is not None else '' for cell in row]
            normalized_data.append(normalized_row)
        
        logger.info(f"Dados normalizados: {len(normalized_data)} linhas com {num_columns} colunas cada")
        
        # Cria o DataFrame
        df = pd.DataFrame(normalized_data, columns=clean_headers)
        logger.info(f"DataFrame criado com sucesso: {len(df)} usuários carregados")
        
        # Log das colunas disponíveis para debug
        logger.info(f"Colunas da planilha de usuários: {list(df.columns)}")
        
        # Remove linhas completamente vazias
        df = df.dropna(how='all')
        df = df[df.astype(str).apply(lambda x: x.str.strip().str.len().sum(), axis=1) > 0]
        
        logger.info(f"Após limpeza: {len(df)} usuários válidos")
        
        # Log de alguns dados para verificação (apenas colunas importantes)
        if not df.empty:
            important_cols = []
            for col in ['email', 'nome', 'status', 'spreadsheet_id']:
                if col in df.columns:
                    important_cols.append(col)
            
            if important_cols:
                sample_data = df[important_cols].head(2).to_dict('records')
                logger.info(f"Amostra de dados importantes: {sample_data}")
        
        return df
        
    except Exception as e:
        logger.error(f"Erro ao carregar usuários: {e}")
        import traceback
        logger.error(traceback.format_exc())
        return pd.DataFrame()

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
            login_url=st.secrets.get("app", {}).get("url", "https://isnpecoessmaia.streamlit.app")
        )
    
    def notify_pending_issues(self, user_email: str, user_name: str, pending_issues: List[Dict]):
        """Notifica usuário sobre pendências não resolvidas"""
        return self.notification_handler.trigger_notification_workflow(
            notification_type="pending_issues",
            recipient_email=user_email,
            recipient_name=user_name,
            pending_issues=pending_issues,
            total_pending=len(pending_issues),
            login_url=st.secrets.get("app", {}).get("url", "https://isnpecoessmaia.streamlit.app")
        )
    
    def get_user_expiring_equipment(self, user_spreadsheet_id: str, days_ahead: int = 30) -> List[Dict]:
        """Busca equipamentos que vencem nos próximos X dias para um usuário específico"""
        expiring_equipment = []
        target_date = date.today() + timedelta(days=days_ahead)

        try:
            logger.info(f"Verificando equipamentos vencendo para planilha {user_spreadsheet_id}")
            
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
                    
                    logger.info(f"Extintores vencendo encontrados: {len([e for e in expiring_equipment if e['tipo'] == 'Extintor'])}")
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
                    
                    logger.info(f"Mangueiras vencendo encontradas: {len([e for e in expiring_equipment if e['tipo'] == 'Mangueira'])}")
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
                    
                    logger.info(f"SCBAs vencendo encontrados: {len([e for e in expiring_equipment if e['tipo'] == 'SCBA'])}")
            except Exception as e:
                logger.warning(f"Erro ao verificar SCBAs: {e}")
            
            # Verifica detectores multigás
            try:
                multigas_data = user_uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)
                if multigas_data and len(multigas_data) > 1:
                    df_multi = pd.DataFrame(multigas_data[1:], columns=multigas_data[0])
                    
                    # Busca calibrações na aba de inspeções
                    try:
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
                        
                        logger.info(f"Calibrações multigás vencendo encontradas: {len([e for e in expiring_equipment if e['tipo'] == 'Detector Multigás'])}")
                    except Exception as e:
                        logger.warning(f"Erro ao verificar calibrações multigás: {e}")
            except Exception as e:
                logger.warning(f"Erro ao verificar multigás: {e}")
                
        except Exception as e:
            logger.error(f"Erro geral ao buscar equipamentos vencendo: {e}")
        
        # Ordena por dias restantes (mais urgente primeiro)
        expiring_equipment.sort(key=lambda x: x['dias_restantes'])
        
        logger.info(f"Total de equipamentos vencendo encontrados: {len(expiring_equipment)}")
        return expiring_equipment
    
    def get_user_pending_issues(self, user_spreadsheet_id: str) -> List[Dict]:
        """Busca pendências não resolvidas para um usuário específico"""
        pending_issues = []

        try:
            logger.info(f"Verificando pendências para planilha {user_spreadsheet_id}")
            
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
                
                logger.info(f"Extintores reprovados encontrados: {len([p for p in pending_issues if 'Extintor' in p['tipo']])}")
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
                
                logger.info(f"Mangueiras reprovadas/condenadas encontradas: {len([p for p in pending_issues if 'Mangueira' in p['tipo']])}")
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
            
            logger.info(f"Equipamentos vencidos encontrados: {len(expired_equipment)}")
                
        except Exception as e:
            logger.error(f"Erro geral ao buscar pendências: {e}")
        
        # Ordena por prioridade (Crítica > Alta > Média)
        priority_order = {'Crítica': 0, 'Alta': 1, 'Média': 2}
        pending_issues.sort(key=lambda x: priority_order.get(x['prioridade'], 3))
        
        logger.info(f"Total de pendências encontradas: {len(pending_issues)}")
        return pending_issues
    
    def send_periodic_notifications(self, days_notice: int = 30):
        """Função principal para enviar notificações periódicas para todos os usuários ativos"""
        try:
            logger.info(f"Iniciando envio de notificações periódicas de equipamentos (dias de antecedência: {days_notice})")
            logger.info(f"GDRIVE_AVAILABLE: {GDRIVE_AVAILABLE}")
            logger.info(f"STREAMLIT_AVAILABLE: {STREAMLIT_AVAILABLE}")
            
            # Carrega usuários ativos
            users_df = get_users_data()
            if users_df.empty:
                logger.info("Nenhum usuário encontrado na planilha")
                return
            
            logger.info(f"Total de usuários carregados: {len(users_df)}")
            
            # Filtra usuários ativos com planilhas
            # Verifica se as colunas necessárias existem (busca por nomes similares)
            available_columns = [col.lower() for col in users_df.columns]
            logger.info(f"Colunas disponíveis (lowercase): {available_columns}")
            
            # Mapeia colunas por busca flexível
            status_col = None
            spreadsheet_col = None
            email_col = None
            nome_col = None
            
            for col in users_df.columns:
                col_lower = col.lower()
                if 'status' in col_lower:
                    status_col = col
                elif 'spreadsheet' in col_lower or 'planilha' in col_lower:
                    spreadsheet_col = col
                elif 'email' in col_lower or 'e-mail' in col_lower:
                    email_col = col
                elif 'nome' in col_lower or 'name' in col_lower:
                    nome_col = col
            
            logger.info(f"Colunas mapeadas - Status: {status_col}, Spreadsheet: {spreadsheet_col}, Email: {email_col}, Nome: {nome_col}")
            
            if not status_col or not spreadsheet_col or not email_col:
                logger.error(f"Colunas obrigatórias não encontradas:")
                logger.error(f"  - Status: {'✓' if status_col else '✗'}")
                logger.error(f"  - Spreadsheet: {'✓' if spreadsheet_col else '✗'}")
                logger.error(f"  - Email: {'✓' if email_col else '✗'}")
                logger.info(f"Colunas disponíveis: {list(users_df.columns)}")
                return
            
            # Filtra usuários ativos usando as colunas encontradas
            try:
                active_users = users_df[
                    (users_df[status_col].astype(str).str.lower().str.strip() == 'ativo') & 
                    (users_df[spreadsheet_col].notna()) & 
                    (users_df[spreadsheet_col].astype(str).str.strip() != '') &
                    (users_df[email_col].notna()) & 
                    (users_df[email_col].astype(str).str.strip() != '')
                ]
            except Exception as e:
                logger.error(f"Erro ao filtrar usuários ativos: {e}")
                logger.info("Tentando filtro mais simples...")
                # Fallback para filtro mais simples
                active_users = users_df[
                    (users_df[email_col].notna()) & 
                    (users_df[spreadsheet_col].notna())
                ]
            
            logger.info(f"Usuários ativos com planilhas: {len(active_users)}")
            
            if active_users.empty:
                logger.info("Nenhum usuário ativo com planilha encontrado")
                return
            
            notifications_sent = 0
            
            for idx, user in active_users.iterrows():
                try:
                    user_email = str(user.get(email_col, '')).strip()
                    user_name = str(user.get(nome_col, user_email)).strip()
                    spreadsheet_id = str(user.get(spreadsheet_col, '')).strip()
                    
                    # Validações básicas
                    if not user_email or '@' not in user_email:
                        logger.warning(f"Email inválido para usuário na linha {idx}: '{user_email}'")
                        continue
                    
                    if not spreadsheet_id:
                        logger.warning(f"spreadsheet_id vazio para usuário {user_email}")
                        continue
                    
                    logger.info(f"Processando notificações para {user_email} (planilha: {spreadsheet_id})")
                    
                    # Busca equipamentos vencendo
                    expiring_equipment = self.get_user_expiring_equipment(spreadsheet_id, days_notice)
                    logger.info(f"Equipamentos vencendo para {user_email}: {len(expiring_equipment)}")
                    
                    # Busca pendências
                    pending_issues = self.get_user_pending_issues(spreadsheet_id)
                    logger.info(f"Pendências para {user_email}: {len(pending_issues)}")
                    
                    # Envia notificação se houver vencimentos
                    if expiring_equipment:
                        success = self.notify_equipment_expiring(
                            user_email=user_email,
                            user_name=user_name,
                            expiring_equipment=expiring_equipment,
                            days_notice=days_notice
                        )
                        if success:
                            notifications_sent += 1
                            logger.info(f"Notificação de vencimentos enviada para {user_email} ({len(expiring_equipment)} itens)")
                        else:
                            logger.error(f"Falha ao enviar notificação de vencimentos para {user_email}")
                    
                    # Envia notificação se houver pendências
                    if pending_issues:
                        success = self.notify_pending_issues(
                            user_email=user_email,
                            user_name=user_name,
                            pending_issues=pending_issues
                        )
                        if success:
                            notifications_sent += 1
                            logger.info(f"Notificação de pendências enviada para {user_email} ({len(pending_issues)} itens)")
                        else:
                            logger.error(f"Falha ao enviar notificação de pendências para {user_email}")
                            
                except Exception as e:
                    logger.error(f"Erro ao processar usuário {user.get('email', 'N/A')}: {e}")
                    import traceback
                    logger.error(traceback.format_exc())
                    continue
            
            logger.info(f"Notificações periódicas concluídas: {notifications_sent} enviadas de {len(active_users)} usuários processados")
            
        except Exception as e:
            logger.error(f"Erro crítico no envio de notificações periódicas: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise


# Instância global
equipment_notification_system = EquipmentNotificationSystem()

def send_weekly_equipment_notifications():
    """Função para ser chamada semanalmente pelo GitHub Actions"""
    logger.info("Executando notificações semanais de equipamentos (30 dias)")
    equipment_notification_system.send_periodic_notifications(days_notice=30)

def send_daily_urgent_notifications():
    """Função para ser chamada diariamente pelo GitHub Actions para alertas urgentes"""
    logger.info("Executando notificações urgentes de equipamentos (7 dias)")
    equipment_notification_system.send_periodic_notifications(days_notice=7)
