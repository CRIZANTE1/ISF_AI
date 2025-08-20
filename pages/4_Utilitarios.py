import streamlit as st
import pandas as pd
from datetime import date
import json
import sys
import os
import qrcode
from PIL import Image
import io
import zipfile
from streamlit_js_eval import streamlit_js_eval

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from auth.login_page import show_login_page, show_user_header, show_logout_button
from auth.auth_utils import can_edit, setup_sidebar, is_admin, can_view, get_user_display_name
from operations.history import load_sheet_data
from gdrive.config import (
    EXTINGUISHER_SHEET_NAME, HOSE_SHEET_NAME, LOCATIONS_SHEET_NAME,
    EXTINGUISHER_SHIPMENT_LOG_SHEET_NAME, TH_SHIPMENT_LOG_SHEET_NAME
)
from reports.shipment_report import (
    generate_shipment_html_and_pdf, log_shipment, 
    select_extinguishers_for_maintenance, select_hoses_for_th
)
from operations.demo_page import show_demo_page
from config.page_config import set_page_config 
from gdrive.gdrive_upload import GoogleDriveUploader
from operations.extinguisher_operations import save_inspection, calculate_next_dates, generate_action_plan, save_new_extinguisher, save_new_location, update_extinguisher_location


set_page_config()



def generate_qr_code_image(data):
    """
    Gera uma imagem de QR Code a partir de um dado.
    Retorna um objeto de imagem do Pillow.
    """
    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(data)
    qr.make(fit=True)
    img = qr.make_image(fill_color="black", back_color="white")
    return img

def image_to_bytes(img: Image.Image):
    """
    Converte um objeto de imagem do Pillow para bytes no formato PNG.
    """
    buf = io.BytesIO()
    img.save(buf, format="PNG")
    return buf.getvalue()

def show_utilities_page():

    if not setup_sidebar():
        st.warning("👈 Por favor, selecione uma Unidade Operacional na barra lateral para acessar esta página.")
        st.stop()
        
    st.title("🛠️ Utilitários do Sistema")

    tab_qr, tab_shipment, tab_manual_entry = st.tabs(["Gerador de QR Code", "Gerador de Boletim de Remessa", "✍️ Cadastro Manual"])

    with tab_qr:
        st.header("Gerador de QR Codes para Equipamentos")
        st.info(
            "Digite ou cole uma lista de IDs ou números de série, um por linha. "
            "O sistema irá gerar um QR Code para cada item, pronto para download e impressão."
        )
        item_texts = st.text_area("Insira os IDs (um por linha):", height=250, placeholder="ID-001\nID-002\n...")

        if item_texts:
            item_list = [item.strip() for item in item_texts.split('\n') if item.strip()]
            if item_list:
                st.subheader("Pré-visualização dos QR Codes Gerados")
                cols = st.columns(3)
                generated_images_bytes = {}
                for i, item_id in enumerate(item_list):
                    with cols[i % 3]:
                        st.markdown(f"**ID: `{item_id}`**")
                        qr_img_object = generate_qr_code_image(item_id)
                        img_bytes = image_to_bytes(qr_img_object)
                        st.image(img_bytes, width=200)
                        generated_images_bytes[item_id] = img_bytes
                        st.download_button(
                            label="Baixar PNG", data=img_bytes,
                            file_name=f"qrcode_{item_id}.png", mime="image/png", key=f"download_{item_id}"
                        )
                st.markdown("---")
                st.subheader("Baixar Todos os QR Codes")
                zip_buffer = io.BytesIO()
                with zipfile.ZipFile(zip_buffer, "a", zipfile.ZIP_DEFLATED, False) as zip_file:
                    for item_id, img_bytes in generated_images_bytes.items():
                        zip_file.writestr(f"qrcode_{item_id}.png", img_bytes)
                st.download_button(
                    label="📥 Baixar Todos como .ZIP", data=zip_buffer.getvalue(),
                    file_name="qrcodes_gerados.zip", mime="application/zip", use_container_width=True
                )

    with tab_shipment:
        st.header("Gerar Boletim de Remessa para Manutenção/Teste")
        st.info("Selecione o tipo de equipamento, use a sugestão automática ou escolha manualmente os itens para enviar.")

        # Limpa o estado do PDF gerado se o tipo de item mudar
        item_type = st.selectbox(
            "Selecione o Tipo de Equipamento", 
            ["Extintores", "Mangueiras"], 
            key="shipment_item_type", 
            on_change=lambda: st.session_state.pop('pdf_generated_info', None)
        )

        # --- Carregamento de Dados ---
        if item_type == 'Extintores':
            df_all_items = load_sheet_data(EXTINGUISHER_SHEET_NAME)
            df_log_items = load_sheet_data(EXTINGUISHER_SHIPMENT_LOG_SHEET_NAME)
            id_column = 'numero_identificacao'
        elif item_type == 'Mangueiras':
            df_all_items = load_sheet_data(HOSE_SHEET_NAME)
            df_log_items = load_sheet_data(TH_SHIPMENT_LOG_SHEET_NAME)
            id_column = 'id_mangueira'
        
        # --- Lógica de Sugestão Automática ---
        st.subheader("Sugestão Automática")
        if item_type == 'Extintores':
            if st.button("Sugerir ~50% dos Extintores (manutenção mais antiga)"):
                suggested_items = select_extinguishers_for_maintenance(df_all_items, df_log_items)
                if not suggested_items.empty:
                    st.session_state['suggested_ids'] = suggested_items[id_column].tolist()
                    st.rerun()
                else: st.success("Nenhum extintor elegível encontrado.")
        elif item_type == 'Mangueiras':
            if st.button("Sugerir ~50% das Mangueiras (mais antigas)"):
                suggested_items = select_hoses_for_th(df_all_items, df_log_items)
                if not suggested_items.empty:
                    st.session_state['suggested_ids'] = suggested_items[id_column].tolist()
                    st.rerun()
                else: st.success("Nenhuma mangueira elegível encontrada.")
        
        st.markdown("---")

        # --- Seleção Manual e Geração do Boletim ---
        st.subheader("Seleção de Itens e Geração do Boletim")
        if df_all_items.empty:
            st.warning(f"Nenhum registro de {item_type.lower()} encontrado para selecionar.")
        else:
            df_latest = df_all_items.sort_values(by=df_all_items.columns[0], ascending=False).drop_duplicates(subset=[id_column], keep='first')
            options = df_latest[id_column].tolist()
            default_selection = st.session_state.get('suggested_ids', [])
            
            selected_ids = st.multiselect(
                f"Selecione ou edite os IDs dos {item_type} para a remessa:",
                options, default=default_selection, key='selected_shipment_ids'
            )

            if selected_ids:
                df_selected = df_latest[df_latest[id_column].isin(selected_ids)]
                st.write(f"**{len(df_selected)} {item_type} selecionados:**")
                display_cols = [id_column]
                if item_type == 'Extintores':
                    display_cols.extend([col for col in ['tipo_agente', 'capacidade', 'data_servico'] if col in df_selected.columns])
                elif item_type == 'Mangueiras':
                    display_cols.extend([col for col in ['tipo', 'diametro', 'ano_fabricacao'] if col in df_selected.columns])
                st.dataframe(df_selected[display_cols], use_container_width=True)

                st.markdown("---")
                st.subheader("Dados da Remessa")
                
                with st.form("shipment_data_form"):
                    remetente_info = {
                        "razao_social": "VIBRA ENERGIA S.A", "endereco": "Rod Pres Castelo Branco, Km 20 720",
                        "bairro": "Jardim Mutinga", "cidade": "BARUERI", "uf": "SP",
                        "cep": "06463-400", "fone": "2140022040"
                    }
                    st.markdown("**Dados do Destinatário**")
                    dest_razao_social = st.text_input("Razão Social", "TECNO SERVIC DO BRASIL LTDA")
                    dest_cnpj = st.text_input("CNPJ", "01.396.496/0001-27")
                    dest_endereco = st.text_input("Endereço", "AV ANALICE SAKATAUSKAS 1040")
                    col1, col2, col3 = st.columns([4,1,2])
                    dest_cidade = col1.text_input("Município", "SAO PAULO")
                    dest_uf = col2.text_input("UF", "SP")
                    dest_fone = col3.text_input("Telefone", "1135918267")
                    bulletin_number = st.text_input("Número do Boletim/OS", f"REM-{date.today().strftime('%Y%m%d')}")

                    submitted = st.form_submit_button("📄 Gerar e Registrar Boletim de Remessa", type="primary")

                    if submitted:
                        with st.spinner("Gerando boletim e registrando envio..."):
                            destinatario_info = {
                                "razao_social": dest_razao_social, "cnpj": dest_cnpj, "endereco": dest_endereco,
                                "cidade": dest_cidade, "uf": dest_uf, "fone": dest_fone,
                                "responsavel": get_user_display_name()
                            }
                            pdf_bytes = generate_shipment_html_and_pdf(df_selected, item_type, remetente_info, destinatario_info, bulletin_number)
                            log_shipment(df_selected, item_type, bulletin_number)
                            
                            # Armazena os dados do PDF no session_state para exibir o botão de download após o rerun
                            st.session_state['pdf_generated_info'] = {
                                "data": pdf_bytes,
                                "file_name": f"Boletim_Remessa_{bulletin_number}.pdf"
                            }
                            st.cache_data.clear()
                            st.rerun()

            # Exibe o botão de download se um PDF foi gerado
            if st.session_state.get('pdf_generated_info'):
                pdf_info = st.session_state['pdf_generated_info']
                st.success("Boletim de remessa gerado e log de envio registrado com sucesso!")
                st.download_button(
                    label="📥 Baixar Boletim de Remessa (PDF)",
                    data=pdf_info['data'],
                    file_name=pdf_info['file_name'],
                    mime="application/pdf"
                )
                if st.button("Gerar Novo Boletim"):
                    # Limpa todos os estados relevantes para começar de novo
                    st.session_state.pop('pdf_generated_info', None)
                    st.session_state.pop('suggested_ids', None)
                    st.session_state.pop('selected_shipment_ids', None)
                    st.rerun()


    with tab_manual_entry:
        st.header("Cadastro e Atualização Manual")
        
        sub_tab_locais, sub_tab_extintores = st.tabs(["📍 Gerenciar Locais", "🔥 Cadastrar Extintor"])

        # Sub-aba para gerenciar locais
        with sub_tab_locais:
            st.subheader("Cadastrar ou Atualizar Local de um Equipamento")
            st.info("Associe um ID de extintor a uma descrição de local.")

            with st.form("local_form", clear_on_submit=True):
                df_extintores = load_sheet_data(EXTINGUISHER_SHEET_NAME)
                # Garante que só extintores sem local apareçam como sugestão ou todos se a lista for grande
                ext_ids = [""] + sorted(df_extintores['numero_identificacao'].unique().tolist())
                equip_id = st.selectbox("Selecione o ID do Equipamento*", ext_ids)
                
                location_desc = st.text_input("Descrição do Local*", help="Ex: 'Pilar 3, porta de emergência'.")
                submitted = st.form_submit_button("💾 Salvar Local")

                if submitted:
                    if not equip_id or not location_desc:
                        st.error("Ambos os campos são obrigatórios.")
                    else:
                        with st.spinner("Salvando..."):
                            # Chama a função de backend para atualizar/inserir
                            if update_extinguisher_location(equip_id, location_desc):
                                st.success(f"Local para o equipamento '{equip_id}' salvo com sucesso!")
                                st.cache_data.clear()
                            # A função de backend já exibe a mensagem de erro
            
            st.markdown("---")
            st.subheader("Locais Atuais dos Equipamentos")
            st.dataframe(load_sheet_data(LOCATIONS_SHEET_NAME), use_container_width=True)

        # Sub-aba para cadastrar novos extintores
        with sub_tab_extintores:
            st.subheader("Cadastrar um Novo Extintor no Sistema")
            st.info("Cria um registro inicial para um novo extintor.")

            with st.form("new_extinguisher_form", clear_on_submit=True):
                c1, c2 = st.columns(2)
                ext_id = c1.text_input("**ID do Extintor (Obrigatório)**")
                ext_selo = c2.text_input("Número do Selo INMETRO")
                
                c3, c4, c5 = st.columns(3)
                ext_tipo = c3.selectbox("Tipo de Agente", ["PQS BC", "PQS ABC", "CO2", "Água", "Espuma Mecânica"])
                ext_cap = c4.text_input("Capacidade", help="Ex: 6 kg, 10 L")
                ext_ano = c5.text_input("Ano de Fabricação")
                
                ext_marca = st.text_input("Marca / Fabricante")

                if st.form_submit_button("➕ Salvar Novo Extintor", type="primary"):
                    if not ext_id:
                        st.error("O ID do Extintor é obrigatório.")
                    else:
                        details_dict = {
                            "numero_identificacao": ext_id.strip(),
                            "numero_selo_inmetro": ext_selo.strip(),
                            "tipo_agente": ext_tipo,
                            "capacidade": ext_cap.strip(),
                            "ano_fabricacao": ext_ano.strip(),
                            "marca_fabricante": ext_marca.strip()
                        }
                        with st.spinner("Salvando..."):
                            if save_new_extinguisher(details_dict):
                                st.success(f"Extintor '{ext_id}' cadastrado com sucesso!")
                                st.cache_data.clear()
# --- Verificação de Permissão ---
# A autenticação é tratada na Pagina Inicial.py.
if can_edit():
    st.sidebar.success("✅ Acesso completo")
    show_utilities_page()
else:
    st.sidebar.error("🔒 Acesso negado")
    st.info("Você não tem permissão para acessar esta funcionalidade.")
    show_demo_page()
