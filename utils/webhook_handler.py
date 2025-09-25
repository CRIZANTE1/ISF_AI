import streamlit as st
import pandas as pd
from datetime import date, timedelta
import logging
import json
from typing import Dict, Any, Optional

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import USERS_SHEET_NAME
from utils.auditoria import log_action, get_sao_paulo_time_str

# Configurar logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PaymentWebhookHandler:
    """Classe para gerenciar webhooks de pagamento no Streamlit"""
    
    def __init__(self):
        self.matrix_uploader = GoogleDriveUploader(is_matrix=True)
    
    def process_payment_webhook(self, payment_data: Dict[str, Any]) -> bool:
        """
        Processa webhook de pagamento aprovado e atualiza dados do usuário
        
        Args:
            payment_data: Dados do pagamento vindos do webhook
            
        Returns:
            bool: True se processado com sucesso, False caso contrário
        """
        try:
            logger.info(f"Processando webhook de pagamento: {payment_data.get('payment_id')}")
            
            # Validar dados obrigatórios
            required_fields = ['status', 'user_email', 'plan_type', 'payment_id']
            for field in required_fields:
                if field not in payment_data:
                    logger.error(f"Campo obrigatório ausente: {field}")
                    return False
            
            # Processar apenas pagamentos aprovados
            if payment_data.get('status') != 'approved':
                logger.info(f"Pagamento não aprovado: {payment_data.get('status')}")
                return True  # Não é erro, apenas não processamos
            
            user_email = payment_data.get('user_email')
            plan_type = payment_data.get('plan_type')
            payment_id = payment_data.get('payment_id')
            amount = payment_data.get('amount', 0)
            
            # Atualizar plano do usuário
            success = self.update_user_plan(user_email, plan_type)
            
            if success:
                # Registrar log de auditoria
                log_action(
                    "PAGAMENTO_APROVADO", 
                    f"Email: {user_email}, Plano: {plan_type}, ID: {payment_id}, Valor: R$ {amount:.2f}"
                )
                
                # Salvar histórico de pagamento
                self.save_payment_history(user_email, plan_type, payment_id, amount)
                
                logger.info(f"Webhook processado com sucesso para {user_email}")
                return True
            else:
                logger.error(f"Falha ao atualizar plano para {user_email}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao processar webhook: {str(e)}")
            return False
    
    def update_user_plan(self, user_email: str, new_plan: str) -> bool:
        """
        Atualiza o plano do usuário na planilha de usuários
        
        Args:
            user_email: Email do usuário
            new_plan: Novo plano (pro, premium_ia)
            
        Returns:
            bool: True se atualizado com sucesso
        """
        try:
            # Carregar dados dos usuários
            users_data = self.matrix_uploader.get_data_from_sheet(USERS_SHEET_NAME)
            
            if not users_data or len(users_data) < 2:
                logger.error("Planilha de usuários vazia ou inválida")
                return False
            
            # Criar DataFrame
            df_users = pd.DataFrame(users_data[1:], columns=users_data[0])
            
            # Encontrar usuário
            user_row = df_users[df_users['email'].str.lower() == user_email.lower()]
            
            if user_row.empty:
                logger.error(f"Usuário não encontrado: {user_email}")
                return False
            
            # Calcular índice da linha na planilha (base 1 + cabeçalho)
            row_index = user_row.index[0] + 2
            
            # Determinar colunas baseado no cabeçalho
            headers = users_data[0]
            
            # Mapear colunas (assumindo ordem padrão)
            plano_col = None
            status_col = None  
            trial_col = None
            
            for i, header in enumerate(headers):
                if 'plano' in header.lower():
                    plano_col = self._get_excel_column(i)
                elif 'status' in header.lower():
                    status_col = self._get_excel_column(i)
                elif 'trial' in header.lower() or 'end_date' in header.lower():
                    trial_col = self._get_excel_column(i)
            
            # Atualizar dados
            updates = []
            
            # Atualizar plano
            if plano_col:
                self.matrix_uploader.update_cells(
                    USERS_SHEET_NAME, 
                    f"{plano_col}{row_index}", 
                    [[new_plan]]
                )
                updates.append(f"Plano: {new_plan}")
            
            # Atualizar status para ativo
            if status_col:
                self.matrix_uploader.update_cells(
                    USERS_SHEET_NAME, 
                    f"{status_col}{row_index}", 
                    [["ativo"]]
                )
                updates.append("Status: ativo")
            
            # Limpar data de trial (usuário pagante não precisa de trial)
            if trial_col:
                self.matrix_uploader.update_cells(
                    USERS_SHEET_NAME, 
                    f"{trial_col}{row_index}", 
                    [[""]]
                )
                updates.append("Trial removido")
            
            logger.info(f"Usuário atualizado: {user_email} - {', '.join(updates)}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao atualizar plano do usuário: {str(e)}")
            return False
    
    def save_payment_history(self, user_email: str, plan_type: str, payment_id: str, amount: float):
        """
        Salva histórico de pagamento (implementação futura)
        Por enquanto, apenas registra no log
        """
        try:
            # TODO: Implementar planilha de histórico de pagamentos
            payment_record = {
                'timestamp': get_sao_paulo_time_str(),
                'user_email': user_email,
                'plan_type': plan_type,
                'payment_id': payment_id,
                'amount': amount,
                'status': 'completed'
            }
            
            logger.info(f"Histórico de pagamento: {json.dumps(payment_record)}")
            
        except Exception as e:
            logger.error(f"Erro ao salvar histórico: {str(e)}")
    
    def _get_excel_column(self, index: int) -> str:
        """Converte índice numérico para letra de coluna do Excel (A, B, C, etc.)"""
        result = ""
        while index >= 0:
            result = chr(index % 26 + ord('A')) + result
            index = index // 26 - 1
        return result
    
    def validate_webhook_signature(self, payload: bytes, signature: str) -> bool:
        """
        Valida assinatura do webhook (implementação de segurança)
        """
        try:
            import hmac
            import hashlib
            
            webhook_secret = st.secrets.get("mercadopago", {}).get("webhook_secret")
            if not webhook_secret:
                logger.warning("Webhook secret não configurado - validação desabilitada")
                return True  # Em desenvolvimento
            
            expected_signature = hmac.new(
                webhook_secret.encode(),
                payload,
                hashlib.sha256
            ).hexdigest()
            
            return hmac.compare_digest(signature, expected_signature)
            
        except Exception as e:
            logger.error(f"Erro na validação da assinatura: {str(e)}")
            return False


# Instância global para uso nas páginas
payment_webhook_handler = PaymentWebhookHandler()


def handle_payment_success(payment_data: Dict[str, Any]) -> bool:
    """
    Função de conveniência para processar pagamento aprovado
    
    Args:
        payment_data: Dados do pagamento
        
    Returns:
        bool: True se processado com sucesso
    """
    return payment_webhook_handler.process_payment_webhook(payment_data)


def update_user_plan_after_payment(user_email: str, plan_type: str) -> bool:
    """
    Função de conveniência para atualizar plano após pagamento
    
    Args:
        user_email: Email do usuário
        plan_type: Novo plano
        
    Returns:
        bool: True se atualizado com sucesso
    """
    return payment_webhook_handler.update_user_plan(user_email, plan_type)


# ================================================================
# INTEGRAÇÃO COM SESSION STATE DO STREAMLIT
# ================================================================

def set_payment_success_message(plan_type: str):
    """Define mensagem de sucesso no session state"""
    st.session_state['payment_success'] = True
    st.session_state['payment_success_plan'] = plan_type
    st.session_state['payment_success_timestamp'] = get_sao_paulo_time_str()


def get_payment_success_message() -> Optional[Dict[str, Any]]:
    """Recupera mensagem de sucesso do session state"""
    if st.session_state.get('payment_success', False):
        return {
            'plan_type': st.session_state.get('payment_success_plan'),
            'timestamp': st.session_state.get('payment_success_timestamp')
        }
    return None


def clear_payment_success_message():
    """Limpa mensagem de sucesso do session state"""
    keys_to_clear = ['payment_success', 'payment_success_plan', 'payment_success_timestamp']
    for key in keys_to_clear:
        if key in st.session_state:
            del st.session_state[key]


# ================================================================
# SIMULADOR DE WEBHOOK PARA TESTES
# ================================================================

def simulate_payment_webhook(user_email: str, plan_type: str, payment_id: str = "test_payment_123"):
    """
    Simula recebimento de webhook para testes em desenvolvimento
    
    Args:
        user_email: Email do usuário
        plan_type: Tipo do plano
        payment_id: ID do pagamento (opcional)
    """
    if not st.secrets.get("debug_mode", False):
        logger.warning("Simulação de webhook disponível apenas em modo debug")
        return False
    
    # Dados simulados do webhook
    fake_payment_data = {
        'payment_id': payment_id,
        'status': 'approved',
        'user_email': user_email,
        'plan_type': plan_type,
        'amount': 89.90 if plan_type == 'pro' else 149.90,
        'external_reference': f'isf-ia-{plan_type}-test123',
        'date_approved': get_sao_paulo_time_str()
    }
    
    logger.info(f"Simulando webhook de pagamento: {fake_payment_data}")
    
    # Processar webhook simulado
    success = handle_payment_success(fake_payment_data)
    
    if success:
        set_payment_success_message(plan_type)
        logger.info("Webhook simulado processado com sucesso")
    else:
        logger.error("Falha ao processar webhook simulado")
    
    return success
