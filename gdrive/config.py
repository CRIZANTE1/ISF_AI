# FILE: gdrive/config.py (VERSÃO MULTI-TENANT)

import os
import json
import streamlit as st

# --- CONFIGURAÇÃO DA PLANILHA MATRIZ ---
# Este é o ID da sua planilha principal, que contém as abas 'adm' e 'unidades'.
MATRIX_SHEETS_ID = "1N4UHZ9cF8kS2wNedy9UKRHuuiq-pTrkG_gnH-OuQcgk" # Mantenha o seu ID da planilha matriz
CENTRAL_DRIVE_FOLDER_ID = "1KrbupdHZArB3KGDnijprXVRCRFr-WCcO" 


# --- Nomes das Abas na Planilha MATRIZ ---
ADMIN_SHEET_NAME = "adm"
UNITS_SHEET_NAME = "unidades"

# --- Nomes das Abas nas Planilhas DAS UNIDADES (permanecem os mesmos) ---
LOCAIS_SHEET_NAME = "locais"
EXTINGUISHER_SHEET_NAME = "extintores"
HOSE_SHEET_NAME = "mangueiras"
SHELTER_SHEET_NAME = "abrigos"
INSPECTIONS_SHELTER_SHEET_NAME = "inspecoes_abrigos"
SCBA_SHEET_NAME = "conjuntos_autonomos"
EYEWASH_INSPECTIONS_SHEET_NAME = "inspecoes_chuveiros_lava_olhos"
SCBA_VISUAL_INSPECTIONS_SHEET_NAME = "inspecoes_scba"
LOG_ACTIONS = "log_acoes"
LOG_SHELTER_SHEET_NAME = "log_abrigos"
LOG_SCBA_SHEET_NAME = "log_scba"
TH_SHIPMENT_LOG_SHEET_NAME = "log_remessas_th"
EXTINGUISHER_SHIPMENT_LOG_SHEET_NAME = "log_remessas_extintores"

def get_credentials_dict():
    """Retorna as credenciais do serviço do Google, seja do arquivo local ou do Streamlit Cloud."""
    if st.runtime.exists():
        try:
            return {
                "type": st.secrets.connections.gsheets.type,
                "project_id": st.secrets.connections.gsheets.project_id,
                "private_key_id": st.secrets.connections.gsheets.private_key_id,
                "private_key": st.secrets.connections.gsheets.private_key,
                "client_email": st.secrets.connections.gsheets.client_email,
                "client_id": st.secrets.connections.gsheets.client_id,
                "auth_uri": st.secrets.connections.gsheets.auth_uri,
                "token_uri": st.secrets.connections.gsheets.token_uri,
                "auth_provider_x509_cert_url": st.secrets.connections.gsheets.auth_provider_x509_cert_url,
                "client_x509_cert_url": st.secrets.connections.gsheets.client_x509_cert_url,
                "universe_domain": st.secrets.connections.gsheets.universe_domain
            }
        except Exception as e:
            st.error("Erro ao carregar credenciais do Google do Streamlit Secrets. Certifique-se de que as credenciais estão configuradas corretamente em [connections.gsheets].")
            raise e
    else:
        credentials_path = os.path.join(os.path.dirname(__file__), 'credentials.json')
        try:
            with open(credentials_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            st.error(f"Erro ao carregar credenciais do arquivo local: {str(e)}")
            raise e
