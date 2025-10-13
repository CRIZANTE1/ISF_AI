# operations/photo_operations.py (REFATORADO)

import streamlit as st
from datetime import date
from supabase.client import get_supabase_client
import requests
import logging

logger = logging.getLogger(__name__)
BUCKET_NAME = "evidencias"  # O nome do bucket que você criou


def upload_evidence_photo(photo_file, equipment_id: str, folder: str) -> str:
    """
    Faz upload de foto para o Supabase Storage.
    
    Args:
        photo_file: Arquivo de foto (UploadedFile do Streamlit)
        equipment_id: ID do equipamento
        folder: Pasta de destino no storage
        
    Returns:
        URL pública da foto ou None se falhar
    """
    if not photo_file:
        return None
        
    try:
        from supabase.client import get_supabase_client
        from datetime import datetime
        
        db_client = get_supabase_client()
        
        # Gera nome único para o arquivo
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        file_extension = photo_file.name.split('.')[-1]
        file_name = f"{folder}/{equipment_id}_{timestamp}.{file_extension}"
        
        # Lê os bytes do arquivo
        file_bytes = photo_file.read()
        
        # Upload para o Supabase Storage
        response = db_client.supabase.storage.from_('evidence-photos').upload(
            file_name,
            file_bytes,
            file_options={"content-type": photo_file.type}
        )
        
        if response:
            # Retorna URL pública
            public_url = db_client.supabase.storage.from_('evidence-photos').get_public_url(file_name)
            return public_url
        
        return None
        
    except Exception as e:
        st.error(f"Erro ao fazer upload da foto: {e}")
        import traceback
        st.error(traceback.format_exc())
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
        st.warning(
            f"Não foi possível carregar a imagem de evidência. Link: {image_url}")
        logger.warning(f"Erro ao carregar imagem do Supabase: {e}")
