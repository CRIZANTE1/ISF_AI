import streamlit as st
import pandas as pd
from datetime import date
import sys
import os
from streamlit_js_eval import streamlit_js_eval

# Adiciona o diretório raiz ao path para encontrar os outros módulos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from operations.extinguisher_operations import (
    process_extinguisher_pdf, calculate_next_dates, save_inspection, generate_action_plan, clean_and_prepare_ia_data
)
from operations.history import load_sheet_data, find_last_record
from operations.qr_inspection_utils import decode_qr_from_image
from operations.photo_operations import upload_evidence_photo
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import AUDIT_LOG_SHEET_NAME, EXTINGUISHER_SHEET_NAME
from auth.login_page import show_login_page, show_user_header, show_logout_button
from auth.auth_utils import can_edit, setup_sidebar, is_admin, can_view, get_user_display_name, get_user_email, get_user_role
from utils.auditoria import get_sao_paulo_time_str
from config.page_config import set_page_config 

set_page_config()

def show_page():
    
        
    st.title("Gerenciamento de Inspeções de Extintores")
    tab_batch, tab_qr = st.tabs(["🗂️ Registro em Lote por PDF", "📱 Inspeção Rápida"])
    
    with tab_batch:
        st.header("Processar Relatório de Inspeção/Manutenção")
        st.session_state.setdefault('batch_step', 'start')
        st.session_state.setdefault('processed_data', None)
        st.session_state.setdefault('uploaded_pdf_file', None)

        st.subheader("1. Faça o Upload do Relatório")
        st.info("O sistema analisará o PDF, buscará o histórico de cada equipamento e atualizará as datas de vencimento conforme o serviço realizado.")
        
        uploaded_pdf = st.file_uploader("Escolha o relatório PDF", type=["pdf"], key="batch_pdf_uploader")
        if uploaded_pdf: 
            st.session_state.uploaded_pdf_file = uploaded_pdf
        
        if st.session_state.uploaded_pdf_file and st.button("🔎 Analisar Dados do PDF com IA"):
            with st.spinner("Analisando o documento e cruzando com histórico..."):
                extracted_list = process_extinguisher_pdf(st.session_state.uploaded_pdf_file)
                if extracted_list:
                    
                    df_history = load_sheet_data("extintores")
                    processed_list = []
                    
                    for item in extracted_list:
                        
                        item = clean_and_prepare_ia_data(item)
                        
                        if isinstance(item, dict):
                            service_level = item.get('tipo_servico', 'Inspeção')
                            ext_id = item.get('numero_identificacao')
                            
                            last_record = find_last_record(df_history, ext_id, 'numero_identificacao')
                            
                            existing_dates = {}
                            if last_record:
                                existing_dates = {
                                    'data_proxima_inspecao': last_record.get('data_proxima_inspecao'),
                                    'data_proxima_manutencao_2_nivel': last_record.get('data_proxima_manutencao_2_nivel'),
                                    'data_proxima_manutencao_3_nivel': last_record.get('data_proxima_manutencao_3_nivel'),
                                    'data_ultimo_ensaio_hidrostatico': last_record.get('data_ultimo_ensaio_hidrostatico'),
                                }

                            updated_dates = calculate_next_dates(
                                service_date_str=item.get('data_servico'),
                                service_level=service_level,
                                existing_dates=existing_dates
                            )
                            
                            # Copia o item original (agora limpo) e atualiza com as datas calculadas
                            final_item = item.copy()
                            final_item.update(updated_dates)
                            final_item['plano_de_acao'] = generate_action_plan(final_item)

                            processed_list.append(final_item)

                    st.session_state.processed_data = processed_list
                    st.session_state.batch_step = 'confirm'
                    st.rerun()
                else: 
                    st.error("Não foi possível extrair dados do arquivo.")
        
        if st.session_state.batch_step == 'confirm' and st.session_state.processed_data:
            st.subheader("2. Confira os Dados e Confirme o Registro")
            st.dataframe(pd.DataFrame(st.session_state.processed_data))
            if st.button("💾 Confirmar e Salvar no Sistema", type="primary"):
                with st.spinner("Preparando e salvando dados..."):
                    pdf_link = None
                    # Faz o upload do PDF apenas uma vez, se necessário
                    if any(rec.get('tipo_servico') in ["Manutenção Nível 2", "Manutenção Nível 3"] for rec in st.session_state.processed_data):
                        st.session_state.uploaded_pdf_file.seek(0)
                        uploader = GoogleDriveUploader()
                        pdf_name = f"Relatorio_Manutencao_{date.today().isoformat()}_{st.session_state.uploaded_pdf_file.name}"
                        pdf_link = uploader.upload_file(st.session_state.uploaded_pdf_file, novo_nome=pdf_name)
                    
                    inspection_rows = []
                    audit_log_rows = []
                    
                    # Prepara todas as linhas de dados antes de enviar
                    for record in st.session_state.processed_data:
                        # Adiciona o link do PDF, se aplicável
                        if record.get('tipo_servico') in ["Manutenção Nível 2", "Manutenção Nível 3"]:
                            record['link_relatorio_pdf'] = pdf_link
                        else:
                            record['link_relatorio_pdf'] = None
                        
                        # Prepara a linha de inspeção
                        lat = record.get('latitude')
                        lon = record.get('longitude')
                        lat_str = str(lat).replace('.', ',') if lat is not None else None
                        lon_str = str(lon).replace('.', ',') if lon is not None else None

                        inspection_row = [
                            record.get('numero_identificacao'), record.get('numero_selo_inmetro'),
                            record.get('tipo_agente'), record.get('capacidade'), record.get('marca_fabricante'),
                            record.get('ano_fabricacao'), record.get('tipo_servico'), record.get('data_servico'),
                            record.get('inspetor_responsavel'), record.get('empresa_executante'),
                            record.get('data_proxima_inspecao'), record.get('data_proxima_manutencao_2_nivel'),
                            record.get('data_proxima_manutencao_3_nivel'), record.get('data_ultimo_ensaio_hidrostatico'),
                            record.get('aprovado_inspecao'), record.get('observacoes_gerais'),
                            record.get('plano_de_acao'), record.get('link_relatorio_pdf'),
                            lat_str, lon_str, record.get('link_foto_nao_conformidade')
                        ]
                        inspection_rows.append(inspection_row)
                        
                        # Prepara a linha de log de auditoria
                        audit_log_row = [
                            get_sao_paulo_time_str(),
                            get_user_email() or "não logado",
                            get_user_role(),
                            "SALVOU_INSPECAO_EXTINTOR_LOTE",
                            f"ID: {record.get('numero_identificacao')}, Status: {record.get('aprovado_inspecao')}",
                            st.session_state.get('current_unit_name', 'N/A')
                        ]
                        audit_log_rows.append(audit_log_row)

                    # Salva os dados em lote
                    try:
                        uploader = GoogleDriveUploader()
                        uploader.append_data_to_sheet(EXTINGUISHER_SHEET_NAME, inspection_rows)
                        
                        matrix_uploader = GoogleDriveUploader(is_matrix=True)
                        matrix_uploader.append_data_to_sheet(AUDIT_LOG_SHEET_NAME, audit_log_rows)
                        
                        st.success("Registros salvos com sucesso!")
                        st.balloons()
                        st.session_state.batch_step = 'start'
                        st.session_state.processed_data = None
                        st.session_state.uploaded_pdf_file = None
                        st.cache_data.clear()
                        st.rerun()
                    except Exception as e:
                        st.error(f"Ocorreu um erro durante o salvamento em lote: {e}")



    with tab_qr:
        st.header("Verificação Rápida de Equipamento")
        st.session_state.setdefault('qr_step', 'start')
        st.session_state.setdefault('qr_id', None)
        st.session_state.setdefault('last_record', None)
        st.session_state.setdefault('location', None)
        
        if st.session_state.qr_step == 'start' and st.session_state.location is None:
            with st.spinner("Aguardando permissão e localização de alta precisão..."):
                loc = streamlit_js_eval(js_expressions="""
                    new Promise(function(resolve, reject) {
                        const options = { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 };
                        navigator.geolocation.getCurrentPosition(
                            function(p) { resolve({latitude: p.coords.latitude, longitude: p.coords.longitude, accuracy: p.coords.accuracy}); },
                            function(e) { resolve(null); },
                            options
                        );
                    });
                """)
                if loc:
                    st.session_state.location = loc
                    st.rerun()
        
        if st.session_state.qr_step == 'start':
            location = st.session_state.location
            is_location_ok = False
            if location:
                accuracy = location.get('accuracy', 999)
                PRECISION_THRESHOLD = 30
                if accuracy <= PRECISION_THRESHOLD:
                    st.success(f"📍 Localização pronta! (Precisão: {accuracy:.1f} metros)")
                    is_location_ok = True
                else:
                    st.warning(f"⚠️ Localização com baixa precisão ({accuracy:.1f}m). Tente ir para um local mais aberto ou usar a digitação manual.")
                    is_location_ok = True
            else:
                st.error("⚠️ A geolocalização é necessária para continuar.")

            st.subheader("1. Identifique o Equipamento")
            col1, col2, col3 = st.columns([2, 0.5, 2])
            with col1:
                st.info("Opção A: Leitura Rápida")
                if st.button("📷 Escanear QR Code", type="primary", use_container_width=True, disabled=not location):
                    st.session_state.qr_step = 'scan'
                    st.rerun()
            with col3:
                st.info("Opção B: Digitação Manual")
                manual_id = st.text_input("ID do Equipamento", key="manual_id", label_visibility="collapsed")
                if st.button("🔍 Buscar por ID", use_container_width=True, disabled=not location):
                    if manual_id:
                        st.session_state.qr_id = manual_id
                        st.session_state.last_record = find_last_record(load_sheet_data("extintores"), manual_id, 'numero_identificacao')
                        st.session_state.qr_step = 'inspect'
                        st.rerun()
                    else:
                        st.warning("Digite um ID.")
            
            if not location:
                if st.button("🔄 Tentar Obter Localização Novamente"):
                    st.session_state.location = None
                    st.rerun()
        
        if st.session_state.qr_step == 'scan':
            st.subheader("2. Aponte a câmera para o QR Code")
            qr_image = st.camera_input("Câmera", key="qr_camera", label_visibility="collapsed")
            if qr_image:
                with st.spinner("Processando..."):
                    decoded_id, _ = decode_qr_from_image(qr_image)
                    if decoded_id:
                        st.session_state.qr_id = decoded_id
                        st.session_state.last_record = find_last_record(load_sheet_data("extintores"), decoded_id, 'numero_identificacao')
                        st.session_state.qr_step = 'inspect'
                        st.rerun()
                    else:
                        st.warning("QR Code não detectado.")
            if st.button("Cancelar"):
                st.session_state.qr_step = 'start'
                st.rerun()
        
        if st.session_state.qr_step == 'inspect':
            if st.session_state.last_record:
                last_record = st.session_state.last_record
                st.success(f"Equipamento Encontrado! ID: **{st.session_state.qr_id}**")
                
                with st.container(border=True):
                    col1, col2, col3 = st.columns(3)
                    col1.metric("Último Selo Registrado", last_record.get('numero_selo_inmetro', 'N/A'))
                    col2.metric("Tipo", last_record.get('tipo_agente', 'N/A'))
                    vencimentos = [pd.to_datetime(last_record.get(d), errors='coerce') for d in ['data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 'data_proxima_manutencao_3_nivel']]
                    valid_vencimentos = [d for d in vencimentos if pd.notna(d)]
                    proximo_vencimento = min(valid_vencimentos) if valid_vencimentos else None
                    vencimento_str = proximo_vencimento.strftime('%d/%m/%Y') if proximo_vencimento else 'N/A'
                    col3.metric("Próximo Vencimento", vencimento_str)
                
                st.subheader("3. Registrar Nova Inspeção (Nível 1)")
                status = st.radio("Status do Equipamento:", ["Conforme", "Não Conforme"], horizontal=True)
                
                issues = []
                photo_non_compliance = None
                if status == "Não Conforme":
                    issue_options = ["Lacre Violado", "Manômetro Fora de Faixa", "Dano Visível", "Obstrução", "Sinalização Inadequada", "Suporte Danificado/Faltando", "Pintura Danificada"]
                    issues = st.multiselect("Selecione as não conformidades:", issue_options)
                    st.warning("Opcional: Registre uma foto da não conformidade.")
                    if st.toggle("📷 Anexar foto da não conformidade", key="toggle_nc_photo"):
                        st.write("**Opção 1: Tirar Foto Agora (Qualidade Menor)**")
                        camera_photo = st.camera_input("Câmera", label_visibility="collapsed", key="nc_camera")
                        
                        st.markdown("---")
                        st.write("**Opção 2: Enviar da Galeria (Qualidade Alta)**")
                        gallery_photo = st.file_uploader("Galeria", type=["jpg", "jpeg", "png"], label_visibility="collapsed", key="nc_uploader")

                        if gallery_photo:
                            photo_non_compliance = gallery_photo
                        else:
                            photo_non_compliance = camera_photo
                
                with st.form("quick_inspection_form"):
                    location = st.session_state.location
                    if location:
                        accuracy = location.get('accuracy', 999)
                        st.info(f"📍 Localização a ser registrada (Precisão: {accuracy:.1f}m)")
                    else:
                        st.warning("⚠️ Localização não obtida.")
                    
                    submitted = st.form_submit_button("✅ Confirmar e Registrar Inspeção", type="primary", disabled=not location)
                    if submitted:
                        with st.spinner("Salvando..."):
                            photo_link_nc = upload_evidence_photo(
                                photo_non_compliance, 
                                st.session_state.qr_id,
                                "nao_conformidade"
                            )
                            
                            last_record = st.session_state.last_record
                            new_record = last_record.copy()
                            
                            existing_dates = {
                                'data_proxima_inspecao': last_record.get('data_proxima_inspecao'),
                                'data_proxima_manutencao_2_nivel': last_record.get('data_proxima_manutencao_2_nivel'),
                                'data_proxima_manutencao_3_nivel': last_record.get('data_proxima_manutencao_3_nivel'),
                                'data_ultimo_ensaio_hidrostatico': last_record.get('data_ultimo_ensaio_hidrostatico'),
                            }
                            
                            updated_dates = calculate_next_dates(
                                service_date_str=date.today().isoformat(), 
                                service_level="Inspeção", 
                                existing_dates=existing_dates
                            )
                            
                            observacoes = "Inspeção de rotina OK." if status == "Conforme" else ", ".join(issues)
                            temp_plan_record = {'aprovado_inspecao': "Sim" if status == "Conforme" else "Não", 'observacoes_gerais': observacoes}
                            
                            new_record.update({
                                'tipo_servico': "Inspeção",
                                'data_servico': date.today().isoformat(),
                                'inspetor_responsavel': get_user_display_name(),
                                'aprovado_inspecao': temp_plan_record['aprovado_inspecao'],
                                'observacoes_gerais': observacoes,
                                'plano_de_acao': generate_action_plan(temp_plan_record),
                                'link_relatorio_pdf': None,
                                'latitude': location['latitude'],
                                'longitude': location['longitude'],
                                'link_foto_nao_conformidade': photo_link_nc
                            })
                            
                            new_record.update(updated_dates)
                            
                            if save_inspection(new_record):
                                st.success("Inspeção registrada!")
                                st.balloons()
                                st.session_state.qr_step = 'start'
                                st.session_state.location = None
                                st.cache_data.clear()
                                st.rerun()
            else:
                st.error(f"Nenhum registro encontrado para o ID '{st.session_state.qr_id}'.")
            
            if st.button("Inspecionar Outro Equipamento"):
                st.session_state.qr_step = 'start'
                st.session_state.location = None
                st.rerun()


