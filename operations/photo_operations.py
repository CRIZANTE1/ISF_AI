# operations/photo_operations.py (REFATORADO)

import streamlit as st
from datetime import date
from supabase.client import get_supabase_client
import requests
import logging

logger = logging.getLogger(__name__)
BUCKET_NAME = "evidencias" # O nome do bucket que você criou

def upload_evidence_photo(photo_file, id_equipamento, photo_type="nao_conformidade"):
    """
    Faz o upload de uma foto de evidência para o Supabase Storage e retorna a URL PÚBLICA.
    
    Args:
        photo_file: O objeto de arquivo do Streamlit.
        id_equipamento (str): O ID do equipamento para nomear o arquivo.
        photo_type (str): "nao_conformidade" ou "acao_corretiva".
    
    Returns:
        str or None: A URL pública da foto no Supabase Storage ou None se falhar.
    """
    if not photo_file:
        return None

    try:
        db_client = get_supabase_client()
        supabase_storage = db_client.client.storage
        
        # Monta um nome de arquivo único
        file_name = f"foto_{photo_type.lower()}_id_{id_equipamento}_{date.today().isoformat()}.jpg"
        path_in_bucket = f"public/{file_name}" # Usar uma pasta 'public' é uma boa prática
        
        # Lê os bytes do arquivo
        file_bytes = photo_file.getvalue()
        
        # Faz o upload para o bucket
        response = supabase_storage.from_(BUCKET_NAME).upload(
            file=file_bytes,
            path=path_in_bucket,
            file_options={"content-type": "image/jpeg", "upsert": "true"} # upsert=true sobrescreve se já existir
        )
        
        # Obtém a URL pública
        public_url_response = supabase_storage.from_(BUCKET_NAME).get_public_url(path_in_bucket)
        
        if public_url_response:
            st.success(f"Foto de evidência ({photo_type}) salva no Supabase Storage!")
            logger.info(f"Foto salva em: {public_url_response}")
            return public_url_response
        else:
            logger.error("Falha ao obter URL pública da foto após upload.")
            st.error("Foto enviada, mas não foi possível obter o link público.")
            return None
        
    except Exception as e:
        logger.error(f"Falha ao fazer upload da foto para o Supabase Storage: {e}")
        st.error(f"Falha ao fazer upload da foto de evidência: {e}")
        return None

def display_drive_image(image_url, caption="", width=300):
    """
    Exibe uma imagem de uma URL pública (agora do Supabase).
    A lógica interna não precisa mudar, pois ela já usa 'requests'.
    """
    if not image_url or not isinstance(image_url, str):
        return

    try:
        # A URL pública do Supabase já é direta para o conteúdo
        response = requests.get(image_url, timeout=15)
        response.raise_for_status()
        
        st.image(response.content, caption=caption, width=width)
        
    except requests.exceptions.RequestException as e:
        st.warning(f"Não foi possível carregar a imagem de evidência. Link: {image_url}")
        logger.warning(f"Erro ao carregar imagem do Supabase: {e}")