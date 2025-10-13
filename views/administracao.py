# views/administracao.py - IMPORTS CORRIGIDOS

import streamlit as st
import pandas as pd
from datetime import date, timedelta, datetime
import altair as alt

# Imports do Supabase
from supabase.client import get_supabase_client
from auth.auth_utils import get_users_data
from operations.history import load_sheet_data
from config.page_config import set_page_config
from config.table_names import (
    SOLICITACOES_ACESSO_SHEET_NAME,
    LOG_AUDITORIA_SHEET_NAME
)
from utils.auditoria import log_action

# Imports de IA (mantidos)
from AI.api_key_manager import get_api_key_manager
from AI.api_Operation import PDFQA

set_page_config()