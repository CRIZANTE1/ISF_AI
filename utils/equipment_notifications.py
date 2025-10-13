"""
Sistema de Notificações Periódicas de Equipamentos
Monitora vencimentos e pendências, enviando alertas automáticos para usuários
"""

from supabase import create_client as supabase_create_client, Client as SupabaseClient
from supabase.client import get_supabase_client
import os
import pandas as pd
import logging
import json
from datetime import date, timedelta, datetime
from typing import List, Dict

# Setup de logging
logging.basicConfig(level=logging.INFO,
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Função específica para scripts, sem cache do Streamlit
def get_supabase_client_for_script() -> SupabaseClient:
    """Inicializa o cliente Supabase para uso em scripts de backend."""
    try:
        url = os.environ.get("SUPABASE_URL")
        key = os.environ.get("SUPABASE_KEY")
        if not url or not key:
            raise ValueError("Credenciais SUPABASE_URL ou SUPABASE_KEY não encontradas no ambiente.")
        return supabase_create_client(url, key)
    except Exception as e:
        logger.error(f"Erro ao inicializar cliente Supabase no script: {e}")
        return None

# Imports condicionais mais robustos
STREAMLIT_AVAILABLE = False

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
                "supabase": {
                    "url": os.environ.get("SUPABASE_URL", ""),
                    "key": os.environ.get("SUPABASE_KEY", "")
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

# PARA: Importa o cliente Supabase


def get_notification_handler():
    """Carrega o handler de notificações com import dinâmico"""
    logger.info("Inicializando handler de notificações...")

    # Para GitHub Actions, usa o FallbackGitHubNotificationHandler direto
    if not STREAMLIT_AVAILABLE:
        logger.info(
                    # Adiciona à tabela de notificações pendentes no Supabase
                    db_client = get_supabase_client_for_script()
                    if not db_client:
                        logger.error("Falha ao inicializar o cliente Supabase para a fila de notificações.")
                        return False
                    response = db_client.table('notificacoes_pendentes').insert(notification_record).execute()

                    if response:
                        logger.info(
                            f"Notificação '{notification_type}' adicionada à fila para {recipient_email}")
                    else:
                        logger.error(
                            f"Falha ao adicionar notificação à fila para {recipient_email}")

                    return bool(response)

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

                    # Linha para adicionar na tabela
                    notification_record = {
                        "timestamp": datetime.now().isoformat(),  # timestamp
                        "type": notification_type,                             # tipo_notificacao
                        "email": recipient_email,                               # email_destinatario
                        "name": recipient_name,                               # nome_destinatario
                        # dados_json
                        "data": json.dumps(notification_data, ensure_ascii=False, default=str),
                        "status": 'pendente'                                    # status
                    }

                    # Adiciona à tabela de notificações pendentes no Supabase
                    db_client = get_supabase_client_for_script()
                    if not db_client:
                        logger.error("Falha ao inicializar o cliente Supabase para a fila de notificações.")
                        return False
                    response = db_client.table('notificacoes_pendentes').insert(notification_record).execute()

                    if response:
                        logger.info(
                            f"Notificação '{notification_type}' adicionada à fila para {recipient_email}")
                    else:
                        logger.error(
                            f"Falha ao adicionar notificação à fila para {recipient_email}")

                    return bool(response)

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
    """Carrega dados de usuários do Supabase."""
    logger.info("Carregando usuários do Supabase.")
    try:
        db_client = get_supabase_client_for_script()
        if not db_client:
            return pd.DataFrame()
        response = db_client.table("usuarios").select("*").execute()
        df = pd.DataFrame(response.data)

        if df.empty:
            logger.warning("Tabela de usuários vazia.")
            return pd.DataFrame()

        # Converte colunas de data que vêm como string do Supabase
        if 'data_cadastro' in df.columns:
            df['data_cadastro'] = pd.to_datetime(
                df['data_cadastro'], errors='coerce').dt.date
        if 'trial_end_date' in df.columns:
            df['trial_end_date'] = pd.to_datetime(
                df['trial_end_date'], errors='coerce').dt.date

        logger.info(f"DataFrame de usuários carregado: {len(df)} registros.")
        return df

    except Exception as e:
        logger.error(f"Erro ao carregar usuários do Supabase: {e}")
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
            login_url=st.secrets.get("app", {}).get(
                "url", "https://isnpecoessmaia.streamlit.app")
        )

    def notify_pending_issues(self, user_email: str, user_name: str, pending_issues: List[Dict]):
        """Notifica usuário sobre pendências não resolvidas"""
        return self.notification_handler.trigger_notification_workflow(
            notification_type="pending_issues",
            recipient_email=user_email,
            recipient_name=user_name,
            pending_issues=pending_issues,
            total_pending=len(pending_issues),
            login_url=st.secrets.get("app", {}).get(
                "url", "https://isnpecoessmaia.streamlit.app")
        )

    def get_user_expiring_equipment(self, user_spreadsheet_id: str, days_ahead: int = 30) -> List[Dict]:
        """Busca equipamentos que vencem nos próximos X dias para um usuário específico"""
        expiring_equipment = []
        target_date = date.today() + timedelta(days=days_ahead)

        try:
            logger.info(
                f"Verificando equipamentos vencendo para usuário com spreadsheet_id {user_spreadsheet_id}")

            db_client = get_supabase_client_for_script()
            if not db_client:
                return []

            # Verifica extintores
            try:
                response = db_client.table("extintores").select("*").execute()
                df_ext = pd.DataFrame(response.data)
                if not df_ext.empty:
                    date_columns = [
                        'data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 'data_proxima_manutencao_3_nivel']
                    for col in date_columns:
                        if col in df_ext.columns:
                            df_ext[col] = pd.to_datetime(
                                df_ext[col], errors='coerce').dt.date
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

                    logger.info(
                        f"Extintores vencendo encontrados: {len([e for e in expiring_equipment if e['tipo'] == 'Extintor'])}")
            except Exception as e:
                logger.warning(f"Erro ao verificar extintores: {e}")

            # Verifica mangueiras
            try:
                response = db_client.table("mangueiras").select("*").execute()
                df_hose = pd.DataFrame(response.data)
                if not df_hose.empty:
                    if 'data_proximo_teste' in df_hose.columns:
                        df_hose['data_proximo_teste'] = pd.to_datetime(
                            df_hose['data_proximo_teste'], errors='coerce').dt.date
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

                    logger.info(
                        f"Mangueiras vencendo encontradas: {len([e for e in expiring_equipment if e['tipo'] == 'Mangueira'])}")
            except Exception as e:
                logger.warning(f"Erro ao verificar mangueiras: {e}")

            # Verifica SCBAs
            try:
                response = db_client.table("conjuntos_autonomos").select("*").execute()
                df_scba = pd.DataFrame(response.data)
                if not df_scba.empty:
                    if 'data_validade' in df_scba.columns:
                        df_scba['data_validade'] = pd.to_datetime(
                            df_scba['data_validade'], errors='coerce').dt.date
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

                    logger.info(
                        f"SCBAs vencendo encontrados: {len([e for e in expiring_equipment if e['tipo'] == 'SCBA'])}")
            except Exception as e:
                logger.warning(f"Erro ao verificar SCBAs: {e}")

            # Verifica detectores multigás
            try:
                response = db_client.table("inventario_multigas").select("*").execute()
                df_multi = pd.DataFrame(response.data)
                if not df_multi.empty:
                    try:
                        response_insp = db_client.table("inspecoes_multigas").select("*").execute()
                        df_insp = pd.DataFrame(response_insp.data)
                        if not df_insp.empty:
                            if 'proxima_calibracao' in df_insp.columns:
                                df_insp['proxima_calibracao'] = pd.to_datetime(
                                    df_insp['proxima_calibracao'], errors='coerce').dt.date
                                expiring_calibrations = df_insp[
                                    (df_insp['proxima_calibracao'].notna()) &
                                    (df_insp['proxima_calibracao'] <= target_date) &
                                    (df_insp['proxima_calibracao']
                                     >= date.today())
                                ]

                                for _, row in expiring_calibrations.iterrows():
                                    expiring_equipment.append({
                                        'tipo': 'Detector Multigás',
                                        'identificacao': row.get('id_equipamento', 'N/A'),
                                        'servico': 'Calibração',
                                        'data_vencimento': row['proxima_calibracao'].strftime('%d/%m/%Y'),
                                        'dias_restantes': (row['proxima_calibracao'] - date.today()).days
                                    })

                        logger.info(
                            f"Calibrações multigás vencendo encontradas: {len([e for e in expiring_equipment if e['tipo'] == 'Detector Multigás'])}")
                    except Exception as e:
                        logger.warning(
                            f"Erro ao verificar calibrações multigás: {e}")
            except Exception as e:
                logger.warning(f"Erro ao verificar multigás: {e}")

        except Exception as e:
            logger.error(f"Erro geral ao buscar equipamentos vencendo: {e}")

        expiring_equipment.sort(key=lambda x: x['dias_restantes'])

        logger.info(
            f"Total de equipamentos vencendo encontrados: {len(expiring_equipment)}")
        return expiring_equipment

    def get_user_pending_issues(self, user_spreadsheet_id: str) -> List[Dict]:
        """Busca pendências não resolvidas para um usuário específico"""
        pending_issues = []

        try:
            logger.info(
                f"Verificando pendências para usuário com spreadsheet_id {user_spreadsheet_id}")

            db_client = get_supabase_client_for_script()
            if not db_client:
                return []

            # Verifica extintores reprovados sem ações corretivas
            try:
                response = db_client.table("extintores").select("*").execute()
                df_ext = pd.DataFrame(response.data)
                if not df_ext.empty:
                    if 'aprovado_inspecao' in df_ext.columns:
                        failed_extinguishers = df_ext[
                            (df_ext['aprovado_inspecao'].str.lower().isin(['não', 'nao', 'reprovado', 'r'])) &
                            (df_ext['plano_de_acao'].fillna(
                                '').str.strip() == '')
                        ]

                        for _, row in failed_extinguishers.iterrows():
                            pending_issues.append({
                                'tipo': 'Extintor Reprovado',
                                'identificacao': row.get('numero_identificacao', 'N/A'),
                                'problema': 'Inspeção reprovada sem plano de ação definido',
                                'data_identificacao': row.get('data_servico', 'N/A'),
                                'prioridade': 'Alta'
                            })

                logger.info(
                    f"Extintores reprovados encontrados: {len([p for p in pending_issues if 'Extintor' in p['tipo']])}")
            except Exception as e:
                logger.warning(
                    f"Erro ao verificar pendências de extintores: {e}")

            # Verifica mangueiras reprovadas/condenadas
            try:
                response = db_client.table("mangueiras").select("*").execute()
                df_hose = pd.DataFrame(response.data)
                if not df_hose.empty:
                    if 'resultado' in df_hose.columns:
                        failed_hoses = df_hose[
                            df_hose['resultado'].str.lower().isin(
                                ['reprovado', 'condenada', 'r', 'c'])
                        ]

                        for _, row in failed_hoses.iterrows():
                            status = 'Condenada' if row['resultado'].lower(
                            ) in ['condenada', 'c'] else 'Reprovada'
                            pending_issues.append({
                                'tipo': f'Mangueira {status}',
                                'identificacao': row.get('id_mangueira', 'N/A'),
                                'problema': f'Mangueira {status.lower()} necessita substituição',
                                'data_identificacao': row.get('data_inspecao', 'N/A'),
                                'prioridade': 'Crítica' if status == 'Condenada' else 'Alta'
                            })

                logger.info(
                    f"Mangueiras reprovadas/condenadas encontradas: {len([p for p in pending_issues if 'Mangueira' in p['tipo']])}")
            except Exception as e:
                logger.warning(
                    f"Erro ao verificar pendências de mangueiras: {e}")

            # Verifica equipamentos vencidos (já passaram da data)
            expired_equipment = self.get_user_expiring_equipment(
                user_spreadsheet_id, days_ahead=0)
            expired_equipment = [
                eq for eq in expired_equipment if eq['dias_restantes'] < 0]

            for eq in expired_equipment:
                pending_issues.append({
                    'tipo': f'{eq["tipo"]} Vencido',
                    'identificacao': eq['identificacao'],
                    'problema': f'{eq["servico"]} vencido há {abs(eq["dias_restantes"])} dias',
                    'data_identificacao': eq['data_vencimento'],
                    'prioridade': 'Crítica'
                })

            logger.info(
                f"Equipamentos vencidos encontrados: {len(expired_equipment)}")

        except Exception as e:
            logger.error(f"Erro geral ao buscar pendências: {e}")

        priority_order = {"Crítica": 0, "Alta": 1, "Média": 2, "Normal": 3}
        pending_issues.sort(
            key=lambda x: priority_order.get(x['prioridade'], 3))

        logger.info(f"Total de pendências encontradas: {len(pending_issues)}")
        return pending_issues

    def send_periodic_notifications(self, days_notice: int = 30):
        """Função principal para enviar notificações periódicas para todos os usuários ativos"""
        try:
            logger.info(
                f"Iniciando envio de notificações periódicas de equipamentos (dias de antecedência: {days_notice})")
            logger.info(f"STREAMLIT_AVAILABLE: {STREAMLIT_AVAILABLE}")

            users_df = get_users_data()
            if users_df.empty:
                logger.info("Nenhum usuário encontrado na tabela")
                return

            logger.info(f"Total de usuários carregados: {len(users_df)}")

            available_columns = [col.lower() for col in users_df.columns]
            logger.info(
                f"Colunas disponíveis (lowercase): {available_columns}")

            status_col = None
            email_col = None
            nome_col = None

            for col in users_df.columns:
                col_lower = col.lower()
                if 'status' in col_lower:
                    status_col = col
                elif 'email' in col_lower or 'e-mail' in col_lower:
                    email_col = col
                elif 'nome' in col_lower or 'name' in col_lower:
                    nome_col = col

            logger.info(
                f"Colunas mapeadas - Status: {status_col}, Email: {email_col}, Nome: {nome_col}")

            if not status_col or not email_col:
                logger.error("Colunas obrigatórias não encontradas:")
                logger.error(f"  - Status: {'✓' if status_col else '✗'}")
                logger.error(f"  - Email: {'✓' if email_col else '✗'}")
                logger.info(f"Colunas disponíveis: {list(users_df.columns)}")
                return

            try:
                active_users = users_df[
                    (users_df[status_col].astype(str).str.lower().str.strip() == 'ativo') &
                    (users_df[email_col].notna()) &
                    (users_df[email_col].astype(str).str.strip() != '')
                ]
            except Exception as e:
                logger.error(f"Erro ao filtrar usuários ativos: {e}")
                logger.info("Tentando filtro mais simples...")
                active_users = users_df[
                    (users_df[email_col].notna())
                ]

            logger.info(f"Usuários ativos: {len(active_users)}")

            if active_users.empty:
                logger.info("Nenhum usuário ativo encontrado")
                return

            notifications_sent = 0

            for idx, user in active_users.iterrows():
                try:
                    user_email = str(user.get(email_col, '')).strip()
                    user_name = str(user.get(nome_col, user_email)).strip()

                    if not user_email or '@' not in user_email:
                        logger.warning(
                            f"Email inválido para usuário na linha {idx}: '{user_email}'")
                        continue

                    logger.info(f"Processando notificações para {user_email}")

                    expiring_equipment = self.get_user_expiring_equipment(
                        user_email, days_notice)
                    logger.info(
                        f"Equipamentos vencendo para {user_email}: {len(expiring_equipment)}")

                    pending_issues = self.get_user_pending_issues(user_email)
                    logger.info(
                        f"Pendências para {user_email}: {len(pending_issues)}")

                    if expiring_equipment:
                        success = self.notify_equipment_expiring(
                            user_email=user_email,
                            user_name=user_name,
                            expiring_equipment=expiring_equipment,
                            days_notice=days_notice
                        )
                        if success:
                            notifications_sent += 1
                            logger.info(
                                f"Notificação de vencimentos enviada para {user_email} ({len(expiring_equipment)} itens)")
                        else:
                            logger.error(
                                f"Falha ao enviar notificação de vencimentos para {user_email}")

                    if pending_issues:
                        success = self.notify_pending_issues(
                            user_email=user_email,
                            user_name=user_name,
                            pending_issues=pending_issues
                        )
                        if success:
                            notifications_sent += 1
                            logger.info(
                                f"Notificação de pendências enviada para {user_email} ({len(pending_issues)} itens)")
                        else:
                            logger.error(
                                f"Falha ao enviar notificação de pendências para {user_email}")

                except Exception as e:
                    logger.error(
                        f"Erro ao processar usuário {user.get('email', 'N/A')}: {e}")
                    import traceback
                    logger.error(traceback.format_exc())
                    continue

            logger.info(
                f"Notificações periódicas concluídas: {notifications_sent} enviadas de {len(active_users)} usuários processados")

        except Exception as e:
            logger.error(
                f"Erro crítico no envio de notificações periódicas: {e}")
            import traceback
            logger.error(traceback.format_exc())
            raise


equipment_notification_system = EquipmentNotificationSystem()


def send_weekly_equipment_notifications():
    """Função para ser chamada semanalmente pelo GitHub Actions"""
    logger.info("Executando notificações semanais de equipamentos (30 dias)")
    equipment_notification_system.send_periodic_notifications(days_notice=30)


def send_daily_urgent_notifications():
    """Função para ser chamada diariamente pelo GitHub Actions para alertas urgentes"""
    logger.info("Executando notificações urgentes de equipamentos (7 dias)")
    equipment_notification_system.send_periodic_notifications(days_notice=7)
