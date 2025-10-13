import google.generativeai as genai
import streamlit as st
import logging
from AI.api_key_manager import get_api_key_manager

logger = logging.getLogger('api_load')


def load_api(specific_key: str = None):
    """Carrega a API do Gemini, opcionalmente com uma chave específica."""
    try:
        key_manager = get_api_key_manager()
        
        # Usa a chave específica se fornecida, senão, obtém a próxima
        api_key = specific_key if specific_key else key_manager.get_next_key()

        if not api_key:
            error_msg = "Nenhuma chave API disponível"
            logger.error(error_msg)
            st.error(error_msg)
            return None

        # Configura a API Gemini com a chave selecionada
        genai.configure(api_key=api_key)
        logger.info(
            f"API Gemini configurada com chave {key_manager._mask_key(api_key)}")

        return genai

    except Exception as e:
        error_msg = f"Erro ao carregar API: {str(e)}"
        logger.exception(error_msg)
        st.error(error_msg)
        return None
