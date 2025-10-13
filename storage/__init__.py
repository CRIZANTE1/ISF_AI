# storage/__init__.py
"""
Módulo de gerenciamento de arquivos no Supabase Storage.
Substitui o sistema antigo de Google Drive.
"""

from .client import (
    upload_file_to_storage,
    display_storage_image,
    download_file_from_storage,
    get_file_info,
    delete_file_from_storage,
    list_files_in_folder,
    # Aliases para compatibilidade
    upload_evidence_photo,
    display_drive_image,
    BUCKET_NAME
)

__all__ = [
    'upload_file_to_storage',
    'display_storage_image',
    'download_file_from_storage',
    'get_file_info',
    'delete_file_from_storage',
    'list_files_in_folder',
    'upload_evidence_photo',
    'display_drive_image',
    'BUCKET_NAME'
]