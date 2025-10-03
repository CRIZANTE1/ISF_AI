import streamlit as st
import logging
import time
import random
from typing import Optional, List
from datetime import datetime, timedelta
from collections import defaultdict

logger = logging.getLogger(__name__)

class APIKeyManager:
    """Gerenciador inteligente de múltiplas chaves API do Gemini"""
    
    def __init__(self):
        self.keys = self._load_api_keys()
        self.current_key_index = 0
        self.key_usage_count = defaultdict(int)
        self.key_failures = defaultdict(int)
        self.key_last_used = {}
        self.key_cooldown = {}  # Chaves em cooldown por rate limit
        
        self.max_retries = st.secrets.get("gemini_config", {}).get("max_retries", 3)
        self.retry_delay = st.secrets.get("gemini_config", {}).get("retry_delay_seconds", 2)
        self.rotation_strategy = st.secrets.get("gemini_config", {}).get("rotation_strategy", "round_robin")
        
        logger.info(f"APIKeyManager inicializado com {len(self.keys)} chaves")
        logger.info(f"Estratégia de rotação: {self.rotation_strategy}")
    
    def _load_api_keys(self) -> List[str]:
        """Carrega todas as chaves API disponíveis"""
        keys = []
        
        try:
            # Tenta carregar da seção gemini_api_keys
            gemini_keys = st.secrets.get("gemini_api_keys", {})
            if gemini_keys:
                keys.extend([v for k, v in gemini_keys.items() if k.startswith("key_")])
                logger.info(f"Carregadas {len(keys)} chaves de gemini_api_keys")
        except Exception as e:
            logger.warning(f"Erro ao carregar gemini_api_keys: {e}")
        
        # Fallback: chave principal do general
        if not keys:
            try:
                main_key = st.secrets["general"]["GOOGLE_API_KEY"]
                if main_key:
                    keys.append(main_key)
                    logger.info("Usando chave principal do general como fallback")
            except Exception as e:
                logger.error(f"Nenhuma chave API encontrada: {e}")
        
        if not keys:
            raise ValueError("❌ Nenhuma chave API do Gemini configurada!")
        
        return keys
    
    def get_next_key(self) -> str:
        """Obtém a próxima chave disponível baseada na estratégia"""
        
        # Remove chaves em cooldown que já expiraram
        current_time = datetime.now()
        expired_cooldowns = [
            key for key, cooldown_until in self.key_cooldown.items()
            if current_time > cooldown_until
        ]
        for key in expired_cooldowns:
            del self.key_cooldown[key]
            logger.info(f"Chave saiu do cooldown: {self._mask_key(key)}")
        
        # Filtra chaves disponíveis (não em cooldown)
        available_keys = [k for k in self.keys if k not in self.key_cooldown]
        
        if not available_keys:
            logger.warning("Todas as chaves estão em cooldown! Aguardando...")
            # Aguarda a chave mais próxima de sair do cooldown
            next_available = min(self.key_cooldown.values())
            wait_time = (next_available - current_time).total_seconds()
            if wait_time > 0:
                time.sleep(min(wait_time, 60))  # Max 60s de espera
            return self.get_next_key()  # Tenta novamente
        
        # Seleciona chave baseada na estratégia
        if self.rotation_strategy == "round_robin":
            key = self._round_robin_selection(available_keys)
        elif self.rotation_strategy == "random":
            key = random.choice(available_keys)
        elif self.rotation_strategy == "least_used":
            key = self._least_used_selection(available_keys)
        else:
            key = available_keys[0]
        
        # Registra uso
        self.key_usage_count[key] += 1
        self.key_last_used[key] = datetime.now()
        
        logger.debug(f"Chave selecionada: {self._mask_key(key)} (uso #{self.key_usage_count[key]})")
        return key
    
    def _round_robin_selection(self, available_keys: List[str]) -> str:
        """Seleção round-robin entre chaves disponíveis"""
        # Garante que o índice está dentro do range de chaves disponíveis
        if self.current_key_index >= len(available_keys):
            self.current_key_index = 0
        
        key = available_keys[self.current_key_index]
        self.current_key_index = (self.current_key_index + 1) % len(available_keys)
        return key
    
    def _least_used_selection(self, available_keys: List[str]) -> str:
        """Seleciona a chave menos utilizada"""
        return min(available_keys, key=lambda k: self.key_usage_count[k])
    
    def report_key_failure(self, key: str, error_message: str):
        """Registra falha de uma chave e coloca em cooldown se necessário"""
        self.key_failures[key] += 1
        
        # Detecta rate limit e coloca em cooldown
        if any(phrase in str(error_message).lower() for phrase in [
            "rate limit", "quota", "too many requests", "429"
        ]):
            cooldown_minutes = 5  # Cooldown de 5 minutos
            cooldown_until = datetime.now() + timedelta(minutes=cooldown_minutes)
            self.key_cooldown[key] = cooldown_until
            
            logger.warning(
                f"⚠️ Chave em cooldown por {cooldown_minutes}min devido a rate limit: "
                f"{self._mask_key(key)}"
            )
        
        logger.error(f"Falha na chave {self._mask_key(key)}: {error_message}")
    
    def report_key_success(self, key: str):
        """Registra sucesso de uma chave (limpa contador de falhas)"""
        if key in self.key_failures:
            self.key_failures[key] = max(0, self.key_failures[key] - 1)
    
    def _mask_key(self, key: str) -> str:
        """Mascara a chave para logs (mostra apenas primeiros e últimos 4 caracteres)"""
        if len(key) <= 8:
            return "****"
        return f"{key[:4]}...{key[-4:]}"
    
    def get_statistics(self) -> dict:
        """Retorna estatísticas de uso das chaves"""
        return {
            "total_keys": len(self.keys),
            "available_keys": len([k for k in self.keys if k not in self.key_cooldown]),
            "keys_in_cooldown": len(self.key_cooldown),
            "usage_count": dict(self.key_usage_count),
            "failure_count": dict(self.key_failures),
            "strategy": self.rotation_strategy
        }


# Instância global (singleton)
_api_key_manager = None

def get_api_key_manager() -> APIKeyManager:
    """Retorna a instância global do gerenciador de chaves"""
    global _api_key_manager
    if _api_key_manager is None:
        _api_key_manager = APIKeyManager()
    return _api_key_manager
