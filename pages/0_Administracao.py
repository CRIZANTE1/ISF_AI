# FILE: pages/0_Administracao.py

import streamlit as st
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.login_page import show_login_page, show_user_header, show_logout_button
from auth.auth_utils import get_user_info
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import UNITS_SHEET_NAME
from operations.demo_page import show_demo_page
from config.page_config import set_page_config 

set_page_config()

# Define a estrutura padrão para uma nova planilha de UO
DEFAULT_SHEETS_CONFIG = {
    "extintores": ["data_servico", "numero_identificacao", "tipo_servico", "aprovado_inspecao", "plano_de_acao", "link_relatorio_pdf", "latitude", "longitude", "link_foto_nao_conformidade"],
    "mangueiras": ["id_mangueira", "marca", "diametro", "tipo", "comprimento", "ano_fabricacao", "data_inspecao", "data_proximo_teste", "resultado", "link_certificado_pdf", "registrado_por", "empresa_executante", "resp_tecnico_certificado"],
    "abrigos": ["id_abrigo", "cliente", "local", "itens_json"],
    "inspecoes_abrigos": ["data_inspecao", "id_abrigo", "status_geral", "resultados_json", "inspetor", "data_proxima_inspecao"],
    "conjuntos_autonomos": ["data_teste", "data_validade", "numero_serie_equipamento", "marca", "modelo", "numero_serie_mascara", "numero_serie_segundo_estagio", "resultado_final", "vazamento_mascara_resultado", "vazamento_mascara_valor", "vazamento_pressao_alta_resultado", "vazamento_pressao_alta_valor", "pressao_alarme_resultado", "pressao_alarme_valor", "link_relatorio_pdf", "registrado_por", "empresa_executante", "resp_tecnico_certificado", "data_qualidade_ar", "status_qualidade_ar", "obs_qualidade_ar", "link_laudo_ar"],
    "inspecoes_scba": ["data_inspecao", "numero_serie_equipamento", "status_geral", "resultados_json", "inspetor", "data_proxima_inspecao"],
    "log_acoes": ["data_correcao", "id_equipamento", "problema_original", "acao_realizada", "responsavel_acao", "id_equipamento_substituto", "link_foto_evidencia"],
    "log_abrigos": ["data_acao", "id_abrigo", "problema_original", "acao_realizada", "responsavel"],
    "log_scba": ["data_acao", "numero_serie_equipamento", "problema_original", "acao_realizada", "responsavel"],
    "log_remessas_th": ["data_remessa", "id_mangueira", "ano_remessa", "numero_boletim"],
    "log_remessas_extintores": ["data_remessa", "numero_identificacao", "ano_remessa", "numero_boletim"]
}

def show_admin_page():
    st.title("⚙️ Administração do Sistema")
    
    st.subheader("Provisionar Nova Unidade Operacional")
    st.info("Esta ferramenta automatiza a criação de toda a infraestrutura necessária para uma nova UO.")
    
    new_unit_name = st.text_input("Nome da Nova UO (ex: Santos)")
    
    # Adicione aqui um campo opcional para um ID de pasta pai, se desejar organizar as pastas das UOs
    # parent_folder_id = st.text_input("ID da Pasta Pai no Google Drive (Opcional)")

    if st.button(f"🚀 Criar Estrutura Completa para a UO '{new_unit_name}'", type="primary"):
        if not new_unit_name:
            st.error("O nome da Unidade Operacional não pode ser vazio.")
        else:
            with st.spinner(f"Criando infraestrutura para '{new_unit_name}'... Este processo pode levar um minuto."):
                try:
                    # Uploader genérico para criar os novos itens
                    uploader = GoogleDriveUploader()

                    # 1. Cria a nova planilha e obtém seu ID
                    new_sheet_id = uploader.create_new_spreadsheet(f"ISF IA - {new_unit_name}")

                    # 2. Cria todas as abas e cabeçalhos na nova planilha
                    uploader.setup_sheets_in_new_spreadsheet(new_sheet_id, DEFAULT_SHEETS_CONFIG)

                    # 3. Cria a nova pasta no Google Drive e obtém seu ID
                    new_folder_id = uploader.create_drive_folder(f"SFIA - Arquivos UO {new_unit_name}")

                    # 4. Registra a nova UO na Planilha Matriz
                    matrix_uploader = GoogleDriveUploader(is_matrix=True)
                    new_unit_row = [new_unit_name, new_sheet_id, new_folder_id]
                    matrix_uploader.append_data_to_sheet(UNITS_SHEET_NAME, new_unit_row)

                    st.success(f"Unidade Operacional '{new_unit_name}' criada e configurada com sucesso!")
                    st.balloons()
                    st.cache_data.clear() # Limpa o cache para que as listas de UO sejam atualizadas

                except Exception as e:
                    st.error("Ocorreu um erro durante o provisionamento. Verifique os logs.")
                    st.exception(e)


# --- Boilerplate de Autenticação e Permissão ---
if not show_login_page():
    st.stop()

show_user_header()
show_logout_button()

role, assigned_unit = get_user_info()

# Acesso a esta página é restrito a administradores globais
if role == 'admin' and assigned_unit == '*':
    st.sidebar.success("👑 Acesso de Super Admin")
    show_admin_page()
else:
    st.sidebar.error("🔒 Acesso Negado")
    st.error("Você não tem permissão para acessar esta página.")
    st.info("Apenas administradores globais podem gerenciar as Unidades Operacionais.")
    show_demo_page()
