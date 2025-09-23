import streamlit as st
from datetime import date
from gdrive.gdrive_upload import GoogleDriveUploader
import requests

def upload_evidence_photo(photo_file, id_equipamento, photo_type="nao_conformidade"):
    """
    Faz o upload de uma foto de evidência para o Google Drive e retorna o LINK DIRETO.
    
    Args:
        photo_file: O objeto de arquivo do Streamlit (st.camera_input ou st.file_uploader).
        id_equipamento (str): O ID do equipamento para nomear o arquivo.
        photo_type (str): "nao_conformidade" ou "acao_corretiva".
    
    Returns:
        str or None: A URL direta da foto no Google Drive ou None se falhar.
    """
    if not photo_file:
        return None

    try:
        uploader = GoogleDriveUploader()
        file_name = f"FOTO_{photo_type.upper()}_ID_{id_equipamento}_{date.today().isoformat()}.jpg"
        
        photo_link = uploader.upload_image_and_get_direct_link(photo_file, novo_nome=file_name)
        
        if photo_link:
            st.success(f"Foto de evidência ({photo_type}) salva no Google Drive!")
        
        return photo_link
        
    except Exception as e:
        st.error(f"Falha ao fazer upload da foto de evidência: {e}")
        return None

def display_drive_image(image_url, caption="", width=300):
    """
    Baixa uma imagem de uma URL do Google Drive e a exibe no Streamlit.
    Lida com o caso de a URL ser nula ou inválida.
    """
    if not image_url or not isinstance(image_url, str) or 'drive.google.com' not in image_url:
        # Não faz nada se não houver um link válido
        return

    try:
        # A URL do tipo uc?export=view já é uma URL de download direto
        response = requests.get(image_url, timeout=15)
        response.raise_for_status() # Lança um erro se o download falhar
        
        # Exibe a imagem a partir dos bytes baixados
        st.image(response.content, caption=caption, width=width)
        
    except requests.exceptions.RequestException as e:
        st.warning(f"Não foi possível carregar a imagem de evidência. Link: {image_url}")
        print(f"Erro ao carregar imagem do Drive: {e}") # Para depuração no console

