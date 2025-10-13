# storage/client.py (VERSÃO COMPLETA E DEFINITIVA)

import streamlit as st
from database.supabase_client import get_supabase_client
from datetime import datetime
import logging
from PIL import Image
import requests
from io import BytesIO
from config.table_names import BUCKET_NAME

logger = logging.getLogger(__name__)


def upload_file_to_storage(file, equipment_id: str, folder: str) -> str:
    """
    Faz upload de arquivo (imagem ou PDF) para o Supabase Storage.
    
    Args:
        file: Objeto UploadedFile do Streamlit (imagem ou PDF)
        equipment_id: ID do equipamento para nomear o arquivo
        folder: Subpasta no bucket (ex: 'nao_conformidades', 'certificados')
        
    Returns:
        URL pública do arquivo ou None se falhar
    """
    if not file:
        logger.warning("Tentativa de upload com arquivo vazio")
        return None

    try:
        db_client = get_supabase_client()
        storage = db_client.client.storage
        
        # Gera nome único com timestamp
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        file_extension = file.name.split('.')[-1] if '.' in file.name else 'bin'
        
        # Limpa o ID para ser um nome de arquivo seguro
        safe_id = "".join(c for c in str(equipment_id) if c.isalnum() or c in ('-', '_')).rstrip()
        
        # Caminho completo no bucket
        file_path = f"{folder}/{safe_id}_{timestamp}.{file_extension}"
        
        # Lê bytes do arquivo
        file_bytes = file.getvalue() if hasattr(file, 'getvalue') else file.read()
        
        # Faz o upload
        logger.info(f"📤 Fazendo upload: {file_path}")
        
        storage.from_(BUCKET_NAME).upload(
            path=file_path,
            file=file_bytes,
            file_options={
                "content-type": file.type if hasattr(file, 'type') else 'application/octet-stream',
                "upsert": "false"
            }
        )
        
        # Obtém URL pública
        public_url = storage.from_(BUCKET_NAME).get_public_url(file_path)
        
        if public_url:
            logger.info(f"✅ Upload bem-sucedido: {public_url}")
            return public_url
        else:
            logger.error("❌ Falha ao obter URL pública após upload")
            return None
        
    except Exception as e:
        # Tratamento especial para arquivos duplicados
        if 'Duplicate' in str(e) or 'already exists' in str(e):
            logger.warning(f"⚠️ Arquivo duplicado: {file_path}. Retornando URL existente.")
            try:
                public_url = db_client.client.storage.from_(BUCKET_NAME).get_public_url(file_path)
                return public_url
            except:
                pass
        
        logger.error(f"❌ Erro no upload: {e}")
        st.error(f"Falha ao enviar arquivo: {e}")
        return None


def display_storage_image(image_url: str, caption: str = "", width: int = 300):
    """
    Exibe uma imagem do Supabase Storage (ou qualquer URL) no Streamlit.
    Suporta URLs diretas e faz tratamento de erros robusto.
    
    Args:
        image_url: URL pública da imagem
        caption: Legenda opcional
        width: Largura em pixels
    """
    # Validações básicas
    if not image_url:
        st.info("📷 Nenhuma imagem disponível.")
        logger.info("display_storage_image chamado sem URL")
        return
    
    if not isinstance(image_url, str):
        st.warning(f"⚠️ URL inválida (tipo: {type(image_url)})")
        logger.warning(f"URL não é string: {type(image_url)}")
        return
    
    image_url = image_url.strip()
    
    if not image_url or image_url == '' or image_url == 'None':
        st.info("📷 Nenhuma imagem disponível.")
        return
    
    try:
        # Método 1: Tentar exibir diretamente (mais rápido)
        try:
            st.image(image_url, caption=caption, width=width)
            logger.info(f"✅ Imagem exibida diretamente: {image_url[:60]}...")
            return
        except Exception as direct_error:
            logger.warning(f"Falha na exibição direta, tentando download: {direct_error}")
        
        # Método 2: Download e exibição (fallback)
        try:
            # Faz download da imagem
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # Abre a imagem com PIL
            img = Image.open(BytesIO(response.content))
            
            # Exibe a imagem
            st.image(img, caption=caption, width=width)
            logger.info(f"✅ Imagem carregada via download: {image_url[:60]}...")
            
        except requests.exceptions.RequestException as req_error:
            logger.error(f"❌ Erro ao baixar imagem: {req_error}")
            st.error("❌ Não foi possível carregar a imagem (erro de rede)")
            
            # Mostra link como fallback
            st.markdown(f"🔗 [Abrir imagem em nova aba]({image_url})")
            
        except Exception as img_error:
            logger.error(f"❌ Erro ao processar imagem: {img_error}")
            st.error("❌ Formato de imagem não suportado ou corrompido")
            
            # Mostra link como fallback
            st.markdown(f"🔗 [Abrir imagem em nova aba]({image_url})")
    
    except Exception as e:
        logger.error(f"❌ Erro crítico ao exibir imagem: {e}")
        st.error(f"❌ Erro ao exibir imagem: {e}")
        
        # Última tentativa: mostrar link
        if image_url.startswith('http'):
            st.markdown(f"🔗 [Abrir imagem em nova aba]({image_url})")


def download_file_from_storage(file_url: str) -> bytes:
    """
    Faz download de um arquivo do Supabase Storage e retorna os bytes.
    
    Args:
        file_url: URL pública do arquivo
        
    Returns:
        bytes: Conteúdo do arquivo ou None se falhar
    """
    if not file_url:
        logger.warning("Tentativa de download sem URL")
        return None
    
    try:
        response = requests.get(file_url, timeout=30)
        response.raise_for_status()
        
        logger.info(f"✅ Arquivo baixado: {file_url[:60]}... ({len(response.content)} bytes)")
        return response.content
        
    except requests.exceptions.RequestException as e:
        logger.error(f"❌ Erro ao baixar arquivo: {e}")
        st.error(f"Erro ao baixar arquivo: {e}")
        return None


def get_file_info(file_path: str) -> dict:
    """
    Obtém informações sobre um arquivo no Supabase Storage.
    
    Args:
        file_path: Caminho do arquivo no bucket
        
    Returns:
        dict: Informações do arquivo (nome, tamanho, tipo, etc.)
    """
    try:
        db_client = get_supabase_client()
        storage = db_client.client.storage
        
        # Lista arquivos no caminho especificado
        files = storage.from_(BUCKET_NAME).list(path=file_path)
        
        if files and len(files) > 0:
            file_info = files[0]
            logger.info(f"✅ Informações obtidas para: {file_path}")
            return file_info
        
        logger.warning(f"⚠️ Arquivo não encontrado: {file_path}")
        return None
        
    except Exception as e:
        logger.error(f"❌ Erro ao obter informações do arquivo: {e}")
        return None


def delete_file_from_storage(file_path: str) -> bool:
    """
    Remove um arquivo do Supabase Storage.
    
    Args:
        file_path: Caminho do arquivo no bucket
        
    Returns:
        bool: True se removido com sucesso, False caso contrário
    """
    try:
        db_client = get_supabase_client()
        storage = db_client.client.storage
        
        storage.from_(BUCKET_NAME).remove([file_path])
        
        logger.info(f"✅ Arquivo removido: {file_path}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Erro ao remover arquivo: {e}")
        st.error(f"Erro ao remover arquivo: {e}")
        return False


def list_files_in_folder(folder: str) -> list:
    """
    Lista todos os arquivos em uma pasta do bucket.
    
    Args:
        folder: Nome da pasta
        
    Returns:
        list: Lista de arquivos
    """
    try:
        db_client = get_supabase_client()
        storage = db_client.client.storage
        
        files = storage.from_(BUCKET_NAME).list(path=folder)
        
        logger.info(f"✅ {len(files)} arquivos encontrados em '{folder}'")
        return files
        
    except Exception as e:
        logger.error(f"❌ Erro ao listar arquivos: {e}")
        return []


# ============================================================================
# ALIASES PARA COMPATIBILIDADE COM CÓDIGO ANTIGO
# ============================================================================
upload_evidence_photo = upload_file_to_storage