# FILE: gdrive/gdrive_upload.py (VERSÃO MULTI-TENANT)

import os
from google.oauth2 import service_account
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
import streamlit as st
import tempfile
from gdrive.config import get_credentials_dict, MATRIX_SHEETS_ID

class GoogleDriveUploader:
    def __init__(self, is_matrix=False):
        self.SCOPES = [
            'https://www.googleapis.com/auth/drive.file',
            'https://www.googleapis.com/auth/spreadsheets'
        ]
        self.credentials = None
        self.drive_service = None
        self.sheets_service = None
        self.initialize_services()
        
        # --- LÓGICA DE SELEÇÃO DE ID ---
        if is_matrix:
            # Se for uma operação na matriz, usa o ID fixo da matriz
            self.spreadsheet_id = MATRIX_SHEETS_ID
            self.folder_id = None # Ações na matriz não devem fazer upload de arquivos
        else:
            # Para operações normais, pega os IDs da sessão do usuário
            self.spreadsheet_id = st.session_state.get('current_spreadsheet_id')
            self.folder_id = st.session_state.get('current_folder_id')

    def initialize_services(self):
        try:
            credentials_dict = get_credentials_dict()
            self.credentials = service_account.Credentials.from_service_account_info(
                credentials_dict,
                scopes=self.SCOPES
            )
            self.drive_service = build('drive', 'v3', credentials=self.credentials)
            self.sheets_service = build('sheets', 'v4', credentials=self.credentials)
        except Exception as e:
            st.error(f"Erro ao inicializar serviços do Google: {str(e)}")
            raise

    def upload_file(self, arquivo, novo_nome=None):
        if not self.folder_id:
            st.error("ID da pasta da Unidade Operacional não definido na sessão.")
            return None
        
        temp_file = None
        try:
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(arquivo.name)[1])
            temp_file.write(arquivo.getbuffer())
            temp_file.close()

            temp_path = temp_file.name

            file_metadata = {'name': novo_nome if novo_nome else arquivo.name, 'parents': [self.folder_id]}
            media = MediaFileUpload(
                temp_path,
                mimetype=arquivo.type,
                resumable=True
            )
            file = self.drive_service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id,webViewLink'
            ).execute()
            return file.get('webViewLink')

        except Exception as e:
            if "HttpError 404" in str(e) and self.folder_id in str(e):
                st.error(f"Erro: A pasta do Google Drive com ID '{self.folder_id}' não foi encontrada ou as permissões estão incorretas.")
            else:
                st.error(f"Erro ao fazer upload do arquivo: {str(e)}")
            raise
        finally:
            if temp_file and os.path.exists(temp_path):
                try:
                    os.remove(temp_path)
                except Exception as e_remove:
                    st.error(f"Erro ao remover arquivo temporário '{temp_path}': {str(e_remove)}")

    def upload_image_and_get_direct_link(self, image_file, novo_nome=None):
        if not self.folder_id:
            st.error("ID da pasta da Unidade Operacional não definido na sessão.")
            return None
        
        if not image_file:
            return None
            
        temp_file = None
        try:
            # Salva o arquivo temporariamente
            temp_file = tempfile.NamedTemporaryFile(delete=False, suffix=os.path.splitext(novo_nome or image_file.name)[1])
            temp_file.write(image_file.getbuffer())
            temp_file.close()
            temp_path = temp_file.name

            file_metadata = {'name': novo_nome if novo_nome else image_file.name, 'parents': [self.folder_id]}
            media = MediaFileUpload(temp_path, mimetype=image_file.type, resumable=True)
            
            # 1. Faz o upload e pede apenas o ID
            file = self.drive_service.files().create(
                body=file_metadata,
                media_body=media,
                fields='id'
            ).execute()
            
            file_id = file.get('id')

            # 2. Define a permissão pública
            self.drive_service.permissions().create(
                fileId=file_id,
                body={'type': 'anyone', 'role': 'reader'}
            ).execute()
            
            # 3. Constrói e retorna o link direto
            direct_link = f"https://drive.google.com/uc?export=view&id={file_id}"
            return direct_link

        except Exception as e:
            st.error(f"Erro ao fazer upload da imagem: {e}")
            raise
        finally:
            if temp_file and os.path.exists(temp_path):
                os.remove(temp_path)

    def append_data_to_sheet(self, sheet_name, data_row):
        if not self.spreadsheet_id:
            st.error("ID da planilha da Unidade Operacional não definido na sessão.")
            return None
        try:
            range_name = f"{sheet_name}!A:Z"
            body = {
                'values': [data_row]
            }
            result = self.sheets_service.spreadsheets().values().append(
                spreadsheetId=self.spreadsheet_id,
                range=range_name,
                valueInputOption='RAW',
                insertDataOption='INSERT_ROWS',
                body=body
            ).execute()
            return result
        except Exception as e:
            st.error(f"Erro ao adicionar dados à planilha '{sheet_name}': {str(e)}")
            raise

    def get_data_from_sheet(self, sheet_name):
        if not self.spreadsheet_id:
            st.error("ID da planilha da Unidade Operacional não definido na sessão.")
            return []
        try:
            range_name = f"{sheet_name}!A:Z"
            result = self.sheets_service.spreadsheets().values().get(
                spreadsheetId=self.spreadsheet_id,
                range=range_name
            ).execute()
            values = result.get('values', [])
            return values
        except Exception as e:
            st.error(f"Erro ao ler dados da planilha '{sheet_name}': {str(e)}")
            raise

    def update_cells(self, sheet_name, range_name, values):
        if not self.spreadsheet_id:
            st.error("ID da planilha da Unidade Operacional não definido na sessão.")
            return None
        try:
            body = {
                'values': values
            }
            result = self.sheets_service.spreadsheets().values().update(
                spreadsheetId=self.spreadsheet_id,
                range=f"{sheet_name}!{range_name}",
                valueInputOption='USER_ENTERED',
                body=body
            ).execute()
            return result
        except Exception as e:
            st.error(f"Erro ao atualizar células na planilha '{sheet_name}': {str(e)}")
            raise
            
    def create_new_spreadsheet(self, name):
        """Cria uma nova Planilha Google e retorna seu ID."""
        try:
            spreadsheet_body = {'properties': {'title': name}}
            spreadsheet = self.sheets_service.spreadsheets().create(body=spreadsheet_body, fields='spreadsheetId').execute()
            st.info(f"Planilha '{name}' criada com sucesso.")
            return spreadsheet.get('spreadsheetId')
        except Exception as e:
            st.error(f"Erro ao criar nova planilha: {e}")
            raise

    def setup_sheets_in_new_spreadsheet(self, spreadsheet_id, sheets_config):
        """Cria as abas e adiciona os cabeçalhos em uma nova planilha."""
        try:
            requests = []
            # Prepara a criação de todas as novas abas
            for sheet_name in sheets_config.keys():
                requests.append({'addSheet': {'properties': {'title': sheet_name}}})
            
            # Adiciona a requisição para deletar a aba padrão "Página1"
            # (Assume que a nova planilha sempre tem uma 'Página1' com sheetId 0)
            requests.append({'deleteSheet': {'sheetId': 0}})

            body = {'requests': requests}
            self.sheets_service.spreadsheets().batchUpdate(spreadsheetId=spreadsheet_id, body=body).execute()
            st.info("Abas padrão criadas e aba inicial removida.")

            # Adiciona os cabeçalhos em cada nova aba
            for sheet_name, headers in sheets_config.items():
                self.sheets_service.spreadsheets().values().append(
                    spreadsheetId=spreadsheet_id, range=f"{sheet_name}!A1",
                    valueInputOption='USER_ENTERED',
                    body={'values': [headers]}
                ).execute()
            st.info("Cabeçalhos adicionados a todas as abas.")
        except Exception as e:
            st.error(f"Erro ao configurar as abas da nova planilha: {e}")
            raise

    def create_drive_folder(self, name, parent_folder_id=None):
        """Cria uma nova pasta no Google Drive e retorna seu ID."""
        try:
            file_metadata = {
                'name': name,
                'mimeType': 'application/vnd.google-apps.folder'
            }
            if parent_folder_id:
                file_metadata['parents'] = [parent_folder_id]
            
            folder = self.drive_service.files().create(body=file_metadata, fields='id').execute()
            st.info(f"Pasta '{name}' criada com sucesso no Google Drive.")
            return folder.get('id')
        except Exception as e:
            st.error(f"Erro ao criar pasta no Google Drive: {e}")
            raise

    def move_file_to_folder(self, file_id, folder_id):
        """Muda um arquivo (como uma planilha) para uma pasta específica no Google Drive."""
        try:
            file = self.drive_service.files().get(fileId=file_id, fields='parents').execute()
            previous_parents = ",".join(file.get('parents'))

            self.drive_service.files().update(
                fileId=file_id,
                addParents=folder_id,
                removeParents=previous_parents,
                fields='id, parents'
            ).execute()
            st.info(f"Planilha movida para a pasta da UO com sucesso.")
        except Exception as e:
            st.error(f"Erro ao mover a planilha para a pasta designada: {e}")
            raise
