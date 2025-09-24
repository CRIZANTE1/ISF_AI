import streamlit as st
import pandas as pd
from datetime import date
import io
import zipfile
import qrcode
from PIL import Image

import sys
import os
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


from auth.auth_utils import can_edit, get_user_display_name
from gdrive.config import (
    EXTINGUISHER_SHEET_NAME, HOSE_SHEET_NAME, 
    EXTINGUISHER_SHIPMENT_LOG_SHEET_NAME, TH_SHIPMENT_LOG_SHEET_NAME
)
from reports.shipment_report import (
    generate_shipment_html_and_pdf, log_shipment, 
    select_extinguishers_for_maintenance, select_hoses_for_th
)
from config.page_config import set_page_config 
from gdrive.gdrive_upload import GoogleDriveUploader
from utils.auditoria import log_action

set_page_config()

# <<< AJUSTE 2: PERFORMANCE - FUNÇÃO DE CARREGAMENTO CENTRALIZADA >>>
@st.cache_data(ttl=300)
def load_all_data():
    """Carrega todos os dataframes necessários para esta página de uma vez."""
    uploader = GoogleDriveUploader()
    
    # Carrega dados de extintores
    ext_data = uploader.get_data_from_sheet(EXTINGUISHER_SHEET_NAME)
    df_ext = pd.DataFrame(ext_data[1:], columns=ext_data[0]) if ext_data and len(ext_data) > 1 else pd.DataFrame()
    log_ext_data = uploader.get_data_from_sheet(EXTINGUISHER_SHIPMENT_LOG_SHEET_NAME)
    df_log_ext = pd.DataFrame(log_ext_data[1:], columns=log_ext_data[0]) if log_ext_data and len(log_ext_data) > 1 else pd.DataFrame()

    # Carrega dados de mangueiras
    hose_data = uploader.get_data_from_sheet(HOSE_SHEET_NAME)
    df_hose = pd.DataFrame(hose_data[1:], columns=hose_data[0]) if hose_data and len(hose_data) > 1 else pd.DataFrame()
    log_hose_data = uploader.get_data_from_sheet(TH_SHIPMENT_LOG_SHEET_NAME)
    df_log_hose = pd.DataFrame(log_hose_data[1:], columns=log_hose_data[0]) if log_hose_data and len(log_hose_data) > 1 else pd.DataFrame()

    return {
        "extinguishers": df_ext, "extinguishers_log": df_log_ext,
        "hoses": df_hose, "hoses_log": df_log_hose
    }

# --- Funções do Gerador de QR Code (sem alterações) ---
def generate_qr_code_image(data):
    qr = qrcode.QRCode(version=1, error_correction=qrcode.constants.ERROR_CORRECT_L, box_size=10, border=4)
    qr.add_data(data)
    qr.make(fit=True)
    return qr.make_image(fill_color="black", back_color="white")

def image_to_bytes(img: Image.Image):
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def show_page():
    st.title("🛠️ Utilitários do Sistema")

    # <<< AJUSTE 1: SEGURANÇA - PROTEÇÃO DE ACESSO >>>
    if 'current_spreadsheet_id' not in st.session_state:
        st.warning("Ambiente de dados não carregado. Verifique o status da sua conta na barra lateral.")
        st.stop()
    
    try:
        all_data = load_all_data()
    except Exception as e:
        st.error(f"Não foi possível carregar os dados para os utilitários. Erro: {e}")
        st.stop()

    # <<< AJUSTE 4: UX - REORDENAÇÃO DAS ABAS >>>
    tab_manual_entry, tab_qr, tab_shipment = st.tabs(["✍️ Cadastro Manual Rápido", "Gerador de QR Code", "Gerador de Boletim de Remessa"])

    with tab_manual_entry:
        st.header("Cadastro Manual Rápido de Itens")
        if not can_edit():
            st.warning("Você não tem permissão para cadastrar novos itens. Contate um administrador.")
        else:
            # Aqui você pode adicionar formulários rápidos para cadastrar extintores, mangueiras, locais, etc.
            # Este é um bom lugar para um formulário de "Adicionar Local", por exemplo.
            st.info("Funcionalidade de cadastro manual rápido em desenvolvimento.")
            # Exemplo de formulário (pode ser adaptado da página de extintores)
            with st.form("quick_add_form"):
                item_type = st.selectbox("Tipo de Item a Cadastrar", ["Extintor", "Mangueira", "Local"])
                item_id = st.text_input(f"ID do Novo {item_type}*")
                # Adicione mais campos conforme necessário
                submitted = st.form_submit_button("Salvar Novo Item")
                if submitted:
                    if not item_id:
                        st.error("O ID é obrigatório.")
                    else:
                        st.success(f"{item_type} '{item_id}' salvo com sucesso! (Funcionalidade em desenvolvimento)")
                        log_action(f"CADASTROU_{item_type.upper()}_UTILITARIOS", f"ID: {item_id}")
                        st.cache_data.clear()
                        st.rerun()

    with tab_qr:
        # Lógica do Gerador de QR Code (sem alterações)
        st.header("Gerador de QR Codes para Equipamentos")
        st.info("Digite ou cole uma lista de IDs, um por linha. O sistema irá gerar um QR Code para cada item.")
        item_texts = st.text_area("Insira os IDs (um por linha):", height=250, placeholder="ID-001\nID-002\n...")
        if item_texts:
            item_list = [item.strip() for item in item_texts.split('\n') if item.strip()]
            if item_list:
                st.subheader("Pré-visualização e Download")
                generated_images_bytes = {item_id: image_to_bytes(generate_qr_code_image(item_id)) for item_id in item_list}
                cols = st.columns(3)
                for i, (item_id, img_bytes) in enumerate(generated_images_bytes.items()):
                    with cols[i % 3]:
                        st.markdown(f"**`{item_id}`**"); st.image(img_bytes, width=200)
                        st.download_button("Baixar PNG", img_bytes, f"qrcode_{item_id}.png", "image/png", key=f"dl_{item_id}")
                st.markdown("---")
                zip_buffer = io.BytesIO()
                with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zf:
                    for item_id, img_bytes in generated_images_bytes.items():
                        zf.writestr(f"qrcode_{item_id}.png", img_bytes)
                st.download_button("📥 Baixar Todos como .ZIP", zip_buffer.getvalue(), "qrcodes.zip", "application/zip", use_container_width=True)

    with tab_shipment:
        st.header("Gerar Boletim de Remessa para Manutenção/Teste")
        item_type = st.selectbox("Selecione o Tipo de Equipamento", ["Extintores", "Mangueiras"], key="shipment_item_type", on_change=lambda: st.session_state.pop('pdf_generated_info', None))

        if item_type == 'Extintores':
            df_all_items = all_data["extinguishers"]
            df_log_items = all_data["extinguishers_log"]
            id_column = 'numero_identificacao'
        else: # Mangueiras
            df_all_items = all_data["hoses"]
            df_log_items = all_data["hoses_log"]
            id_column = 'id_mangueira'
        
        st.subheader("Sugestão Automática")
        if st.button(f"Sugerir Itens para {item_type}"):
            suggested_items = select_extinguishers_for_maintenance(df_all_items, df_log_items) if item_type == 'Extintores' else select_hoses_for_th(df_all_items, df_log_items)
            if not suggested_items.empty:
                st.session_state['suggested_ids'] = suggested_items[id_column].tolist(); st.rerun()
            else: st.success(f"Nenhum item elegível encontrado.")
        
        st.markdown("---")
        st.subheader("Seleção e Geração do Boletim")
        if df_all_items.empty:
            st.warning(f"Nenhum registro de {item_type.lower()} encontrado.")
        else:
            df_latest = df_all_items.sort_values(by=df_all_items.columns[0], ascending=False).drop_duplicates(subset=[id_column], keep='first')
            options = df_latest[id_column].tolist()
            selected_ids = st.multiselect(f"Selecione os IDs dos {item_type}:", options, default=st.session_state.get('suggested_ids', []))

            if selected_ids:
                df_selected = df_latest[df_latest[id_column].isin(selected_ids)]
                st.dataframe(df_selected, use_container_width=True)
                
                with st.form("shipment_data_form"):
                    # Seus campos de formulário para remetente e destinatário
                    bulletin_number = st.text_input("Número do Boletim/OS", f"REM-{date.today().strftime('%Y%m%d')}")
                    submitted = st.form_submit_button("📄 Gerar e Registrar Boletim", type="primary")

                    if submitted:
                        with st.spinner("Gerando boletim..."):
                            # A lógica de geração de PDF e log permanece a mesma
                            remetente = {"razao_social": "VIBRA ENERGIA S.A", ...}
                            destinatario = {"razao_social": "TECNO SERVIC", ...}
                            pdf_bytes = generate_shipment_html_and_pdf(df_selected, item_type, remetente, destinatario, bulletin_number)
                            log_shipment(df_selected, item_type, bulletin_number)
                            st.session_state['pdf_generated_info'] = {"data": pdf_bytes, "file_name": f"Boletim_{bulletin_number}.pdf"}
                            st.cache_data.clear(); st.rerun()

            if st.session_state.get('pdf_generated_info'):
                pdf_info = st.session_state['pdf_generated_info']
                st.success("Boletim gerado e log de envio registrado!")
                st.download_button("📥 Baixar Boletim (PDF)", pdf_info['data'], pdf_info['file_name'], "application/pdf")
                if st.button("Gerar Novo Boletim"):
                    st.session_state.pop('pdf_generated_info', None); st.session_state.pop('suggested_ids', None); st.rerun()
   
