import streamlit as st
import pandas as pd
from datetime import date
import sys
import os
from streamlit_js_eval import streamlit_js_eval

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from operations.extinguisher_operations import process_extinguisher_pdf, calculate_next_dates, save_inspection, generate_action_plan, clean_and_prepare_ia_data, save_new_extinguisher
from operations.history import find_last_record
from operations.qr_inspection_utils import decode_qr_from_image
from operations.photo_operations import upload_evidence_photo
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import EXTINGUISHER_SHEET_NAME
from auth.auth_utils import (
    check_user_access, can_edit, has_ai_features, 
    get_user_display_name
)
from utils.auditoria import log_action
from config.page_config import set_page_config 

set_page_config()

@st.cache_data(ttl=300)
def load_page_data():
    uploader = GoogleDriveUploader()
    ext_data = uploader.get_data_from_sheet(EXTINGUISHER_SHEET_NAME)
    df_ext = pd.DataFrame(ext_data[1:], columns=ext_data[0]) if ext_data and len(ext_data) > 1 else pd.DataFrame()
    return df_ext

def show_upgrade_callout(feature_name="Esta funcionalidade", required_plan="Premium IA"):
    st.info(f"✨ **{feature_name}** está disponível no plano **{required_plan}**. Faça o upgrade para automatizar seu trabalho!", icon="🚀")

def show_page():
    st.title("🔥 Gestão e Inspeção de Extintores")

    # Check if user has at least viewer permissions
    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return

    if 'current_spreadsheet_id' not in st.session_state:
        st.warning("Ambiente de dados não carregado. Verifique o status da sua conta na barra lateral.")
        st.stop()

    try:
        df_extintores = load_page_data()
    except Exception as e:
        st.error(f"Não foi possível carregar o inventário de extintores. Erro: {e}")
        st.stop()

    tab_batch, tab_qr, tab_cadastro, tab_manual = st.tabs([
        "🗂️ Registro em Lote (PDF)", 
        "📱 Inspeção Rápida (QR Code)", 
        "➕ Cadastrar / Editar",
        "📝 Cadastro Manual"
    ])
    
    with tab_batch:
        st.header("Processar Relatório de Manutenção em Lote")

        # Check for AI features for this tab
        if not has_ai_features():
            show_upgrade_callout("Processamento de PDF com IA")
        # Check for edit permissions
        elif not can_edit():
            st.warning("Você precisa de permissões de edição para registrar inspeções.")
            st.info("Somente usuários com nível 'editor' ou superior podem adicionar dados.")
        else:
            st.info("O sistema analisará o PDF, buscará o histórico de cada equipamento e atualizará as datas de vencimento.")
            st.session_state.setdefault('batch_step', 'start')
            st.session_state.setdefault('processed_data', None)
            uploaded_pdf = st.file_uploader("Escolha o relatório PDF", type=["pdf"], key="batch_pdf_uploader")
            if uploaded_pdf and st.button("🔎 Analisar Dados do PDF com IA"):
                with st.spinner("Analisando o documento e cruzando com o histórico..."):
                    extracted_list = process_extinguisher_pdf(uploaded_pdf)
                    if extracted_list:
                        processed_list = []
                        for item in extracted_list:
                            item = clean_and_prepare_ia_data(item)
                            if isinstance(item, dict):
                                last_record = find_last_record(df_extintores, item.get('numero_identificacao'), 'numero_identificacao')
                                existing_dates = {k: last_record.get(k) for k in ['data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 'data_proxima_manutencao_3_nivel', 'data_ultimo_ensaio_hidrostatico']} if last_record is not None else {}
                                updated_dates = calculate_next_dates(item.get('data_servico'), item.get('tipo_servico', 'Inspeção'), existing_dates)
                                final_item = {**item, **updated_dates, 'plano_de_acao': generate_action_plan(item)}
                                processed_list.append(final_item)
                        st.session_state.processed_data = processed_list
                        st.session_state.batch_step = 'confirm'
                        st.rerun()
                    else: st.error("Não foi possível extrair dados do arquivo.")

            if st.session_state.batch_step == 'confirm' and st.session_state.processed_data:
                st.subheader("Confira os Dados e Confirme o Registro")
                st.dataframe(pd.DataFrame(st.session_state.processed_data))
                if st.button("💾 Confirmar e Salvar no Sistema", type="primary"):
                    with st.spinner("Preparando e salvando dados..."):
                        uploader = GoogleDriveUploader()
                        pdf_link = uploader.upload_file(uploaded_pdf, f"Relatorio_Manutencao_{date.today().isoformat()}_{uploaded_pdf.name}") if any(r.get('tipo_servico') in ["Manutenção Nível 2", "Manutenção Nível 3"] for r in st.session_state.processed_data) else None
                        inspection_rows = []
                        for record in st.session_state.processed_data:
                            record['link_relatorio_pdf'] = pdf_link if record.get('tipo_servico') in ["Manutenção Nível 2", "Manutenção Nível 3"] else None
                            inspection_rows.append(list(record.values())) # Garanta que a ordem e colunas correspondem
                            log_action("SALVOU_INSPECAO_EXTINTOR_LOTE", f"ID: {record.get('numero_identificacao')}, Status: {record.get('aprovado_inspecao')}")
                        uploader.append_data_to_sheet(EXTINGUISHER_SHEET_NAME, inspection_rows)
                        st.success("Registros salvos com sucesso!"); st.balloons()
                        st.session_state.batch_step = 'start'; st.session_state.processed_data = None; st.cache_data.clear(); st.rerun()

    with tab_qr:
        st.header("Verificação Rápida de Equipamento")

        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para registrar inspeções.")
            st.info("Somente usuários com nível 'editor' ou superior podem adicionar dados.")
        else:
            st.session_state.setdefault('qr_step', 'start')
            st.session_state.setdefault('qr_id', None)
            st.session_state.setdefault('last_record', None)
            
            if st.session_state.qr_step == 'start':
                st.subheader("1. Identifique o Equipamento")
                col1, col2, col3 = st.columns([2, 0.5, 2])
                with col1:
                    if st.button("📷 Escanear QR Code", type="primary", use_container_width=True):
                        st.session_state.qr_step = 'scan'; st.rerun()
                with col3:
                    manual_id = st.text_input("Ou digite o ID do Equipamento")
                    if st.button("🔍 Buscar por ID", use_container_width=True):
                        if manual_id:
                            st.session_state.qr_id = manual_id
                            st.session_state.last_record = find_last_record(df_extintores, manual_id, 'numero_identificacao')
                            st.session_state.qr_step = 'inspect'; st.rerun()
                        else: st.warning("Digite um ID.")
            
            if st.session_state.qr_step == 'scan':
                st.subheader("2. Aponte a câmera para o QR Code")
                qr_image = st.camera_input("Câmera", key="qr_camera", label_visibility="collapsed")
                if qr_image:
                    with st.spinner("Processando..."):
                        decoded_id, _ = decode_qr_from_image(qr_image)
                        if decoded_id:
                            st.session_state.qr_id = decoded_id
                            st.session_state.last_record = find_last_record(df_extintores, decoded_id, 'numero_identificacao')
                            st.session_state.qr_step = 'inspect'; st.rerun()
                        else: st.warning("QR Code não detectado. Tente novamente.")
                if st.button("Cancelar"):
                    st.session_state.qr_step = 'start'; st.rerun()
            
            if st.session_state.qr_step == 'inspect':
                last_record = st.session_state.last_record
                if last_record is not None:
                    st.success(f"Equipamento Encontrado! ID: **{st.session_state.qr_id}**")
                    st.dataframe(pd.DataFrame([last_record]), use_container_width=True, hide_index=True)
                    
                    st.subheader("3. Registrar Nova Inspeção (Nível 1)")
                    with st.form("quick_inspection_form"):
                        status = st.radio("Status do Equipamento:", ["Conforme", "Não Conforme"], horizontal=True)
                        observacoes = st.text_area("Observações (se 'Não Conforme', descreva os problemas)")
                        photo_non_compliance = st.camera_input("Anexar foto da não conformidade (Opcional)")
                        
                        submitted = st.form_submit_button("✅ Confirmar e Registrar Inspeção", type="primary")
                        if submitted:
                            with st.spinner("Salvando..."):
                                photo_link_nc = upload_evidence_photo(photo_non_compliance, st.session_state.qr_id, "nao_conformidade") if photo_non_compliance else None
                                existing_dates = {k: last_record.get(k) for k in ['data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 'data_proxima_manutencao_3_nivel', 'data_ultimo_ensaio_hidrostatico']}
                                updated_dates = calculate_next_dates(date.today().isoformat(), "Inspeção", existing_dates)
                                aprovado_str = "Sim" if status == "Conforme" else "Não"
                                
                                new_record = last_record.copy()
                                new_record.update({
                                    'tipo_servico': "Inspeção", 'data_servico': date.today().isoformat(),
                                    'inspetor_responsavel': get_user_display_name(), 'aprovado_inspecao': aprovado_str,
                                    'observacoes_gerais': observacoes or ("Inspeção de rotina OK." if status == "Conforme" else ""),
                                    'plano_de_acao': generate_action_plan({'aprovado_inspecao': aprovado_str, 'observacoes_gerais': observacoes}),
                                    'link_relatorio_pdf': None, 'link_foto_nao_conformidade': photo_link_nc
                                })
                                new_record.update(updated_dates)
                                
                                if save_inspection(new_record):
                                    log_action("INSPECIONOU_EXTINTOR_QR", f"ID: {st.session_state.qr_id}, Status: {status}")
                                    st.success("Inspeção registrada!"); st.balloons()
                                    st.session_state.qr_step = 'start'; st.cache_data.clear(); st.rerun()
                else:
                    st.error(f"Nenhum registro encontrado para o ID '{st.session_state.qr_id}'. Verifique se o extintor está cadastrado na aba 'Cadastrar / Editar'.")
                
                if st.button("Inspecionar Outro Equipamento"):
                    st.session_state.qr_step = 'start'; st.rerun()

    with tab_cadastro:
        if not can_edit():
            st.warning("Você não tem permissão para cadastrar ou editar extintores. Contate um administrador.")
        else:
            st.header("Gerenciar Inventário de Extintores")
            with st.expander("➕ Cadastrar Novo Extintor", expanded=False):
                with st.form("new_extinguisher_form", clear_on_submit=True):
                    st.subheader("Dados do Novo Equipamento")
                    cols = st.columns(2)
                    numero_id = cols[0].text_input("Número de Identificação*", help="O ID único do extintor.")
                    selo_inmetro = cols[1].text_input("Nº Selo INMETRO")
                    tipo_agente = cols[0].selectbox("Tipo de Agente", ["AP", "BC", "ABC", "CO2", "Espuma Mecânica"])
                    capacidade = cols[1].number_input("Capacidade (ex: 6, 10)", step=1.0, format="%.2f")
                    marca = cols[0].text_input("Marca/Fabricante")
                    ano_fab = cols[1].number_input("Ano de Fabricação", min_value=1980, max_value=date.today().year, step=1)
                    submitted_new = st.form_submit_button("Salvar Novo Extintor", type="primary")
                    if submitted_new:
                        if not numero_id:
                            st.error("O campo 'Número de Identificação' é obrigatório.")
                        else:
                            new_row = [numero_id, selo_inmetro, tipo_agente, capacidade, marca, ano_fab] + [None] * 15 # Adapte o número de colunas vazias
                            try:
                                uploader = GoogleDriveUploader()
                                uploader.append_data_to_sheet(EXTINGUISHER_SHEET_NAME, [new_row])
                                log_action("CADASTROU_EXTINTOR", f"ID: {numero_id}")
                                st.success(f"Extintor '{numero_id}' cadastrado com sucesso!"); st.cache_data.clear(); st.rerun()
                            except Exception as e: st.error(f"Erro ao salvar: {e}")

            st.markdown("---")
            with st.expander("✏️ Atualizar Extintor Existente"):
                if df_extintores.empty:
                    st.info("Nenhum extintor cadastrado para atualizar.")
                else:
                    ext_id_to_edit = st.selectbox("Selecione o extintor para atualizar:", options=[""] + df_extintores['numero_identificacao'].tolist())
                    if ext_id_to_edit:
                        ext_data = df_extintores[df_extintores['numero_identificacao'] == ext_id_to_edit].iloc[0]
                        with st.form("edit_extinguisher_form"):
                            st.info(f"Editando dados do extintor **{ext_id_to_edit}**")
                            edit_selo_inmetro = st.text_input("Nº Selo INMETRO", value=ext_data.get('numero_selo_inmetro', ''))
                            # Adicione outros campos para edição aqui
                            submitted_edit = st.form_submit_button("Salvar Alterações")
                            if submitted_edit:
                                try:
                                    row_index_sheet = df_extintores[df_extintores['numero_identificacao'] == ext_id_to_edit].index[0] + 2
                                    range_to_update = f"B{row_index_sheet}" # Exemplo: Atualiza a partir da coluna B
                                    values_to_update = [[edit_selo_inmetro]] # Adicione outras variáveis aqui
                                    uploader = GoogleDriveUploader()
                                    uploader.update_cells(EXTINGUISHER_SHEET_NAME, range_to_update, values_to_update)
                                    log_action("ATUALIZOU_EXTINTOR", f"ID: {ext_id_to_edit}")
                                    st.success(f"Extintor '{ext_id_to_edit}' atualizado com sucesso!"); st.cache_data.clear(); st.rerun()
                                except Exception as e: st.error(f"Erro ao atualizar: {e}")

    with tab_manual:
        st.header("Cadastro Manual de Inspeção")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para registrar inspeções.")
        else:
            st.info("Use este formulário para cadastrar manualmente uma inspeção de extintor, sem necessidade de processamento IA.")
            
            with st.form("manual_inspection_form", clear_on_submit=True):
                st.subheader("Dados da Inspeção")
                
                # Dados básicos do equipamento
                col1, col2 = st.columns(2)
                numero_identificacao = col1.text_input("Número de Identificação*", help="O ID único do extintor.")
                numero_selo_inmetro = col2.text_input("Nº Selo INMETRO")
                
                col3, col4 = st.columns(2)
                tipo_agente = col3.selectbox("Tipo de Agente", ["AP", "BC", "ABC", "CO2", "Espuma Mecânica"])
                capacidade = col4.number_input("Capacidade", step=1.0, format="%.2f")
                
                col5, col6 = st.columns(2)
                marca_fabricante = col5.text_input("Marca/Fabricante")
                ano_fabricacao = col6.number_input("Ano de Fabricação", min_value=1980, max_value=date.today().year, step=1)
                
                # Dados da inspeção
                st.markdown("---")
                st.subheader("Informações da Inspeção")
                
                col7, col8 = st.columns(2)
                tipo_servico = col7.selectbox("Tipo de Serviço", ["Inspeção", "Manutenção Nível 2", "Manutenção Nível 3"])
                data_servico = col8.date_input("Data do Serviço", value=date.today())
                
                col9, col10 = st.columns(2)
                aprovado = col9.radio("Aprovado na Inspeção?", ["Sim", "Não"], horizontal=True)
                empresa_executante = col10.text_input("Empresa Executante (opcional)")
                
                observacoes_gerais = st.text_area("Observações", help="Descreva problemas encontrados, se houver.")
                
                # NOVO: Seção de Localização
                st.markdown("---")
                st.subheader("📍 Localização (Opcional)")
                
                from operations.location_operations import show_location_selector
                
                # Widget de seleção de local
                selected_location = show_location_selector(
                    key_suffix="manual_inspection",
                    required=False,
                    current_value=None
                )
                
                # Campo de geolocalização
                st.markdown("#### 🗺️ Coordenadas GPS (Opcional)")
                st.info("💡 **Dica:** Use o botão abaixo do formulário para capturar automaticamente sua localização atual.")
                
                col_geo1, col_geo2 = st.columns(2)
                
                with col_geo1:
                    manual_latitude = st.number_input(
                        "Latitude", 
                        value=None, 
                        format="%.6f",
                        help="Ex: -23.550520",
                        key="manual_lat_input"
                    )
                
                with col_geo2:
                    manual_longitude = st.number_input(
                        "Longitude", 
                        value=None, 
                        format="%.6f",
                        help="Ex: -46.633308",
                        key="manual_lon_input"
                    )
                
                submitted = st.form_submit_button("💾 Salvar Inspeção", type="primary", use_container_width=True)
                
                if submitted:
                    if not numero_identificacao:
                        st.error("O campo 'Número de Identificação' é obrigatório.")
                    else:
                        # Busca o último registro para preservar datas existentes
                        last_record = find_last_record(df_extintores, numero_identificacao, 'numero_identificacao')
                        
                        # Define datas existentes para preservar
                        existing_dates = {}
                        if last_record:
                            existing_dates = {
                                k: last_record.get(k) 
                                for k in ['data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 
                                         'data_proxima_manutencao_3_nivel', 'data_ultimo_ensaio_hidrostatico']
                            }
                        
                        # Calcula as novas datas com base no tipo de serviço
                        updated_dates = calculate_next_dates(data_servico.isoformat(), tipo_servico, existing_dates)
                        
                        # Gera plano de ação
                        inspection_data = {
                            'aprovado_inspecao': aprovado,
                            'observacoes_gerais': observacoes_gerais
                        }
                        plano_acao = generate_action_plan(inspection_data)
                        
                        # Dados completos da inspeção
                        new_record = {
                            'numero_identificacao': numero_identificacao,
                            'numero_selo_inmetro': numero_selo_inmetro,
                            'tipo_agente': tipo_agente,
                            'capacidade': capacidade,
                            'marca_fabricante': marca_fabricante,
                            'ano_fabricacao': ano_fabricacao,
                            'tipo_servico': tipo_servico,
                            'data_servico': data_servico.isoformat(),
                            'inspetor_responsavel': get_user_display_name(),
                            'empresa_executante': empresa_executante,
                            'aprovado_inspecao': aprovado,
                            'observacoes_gerais': observacoes_gerais,
                            'plano_de_acao': plano_acao,
                            'link_relatorio_pdf': None,
                            'link_foto_nao_conformidade': None,
                            'latitude': manual_latitude,  # NOVO
                            'longitude': manual_longitude  # NOVO
                        }
                        
                        # Adiciona as datas calculadas
                        new_record.update(updated_dates)
                        
                        try:
                            if save_inspection(new_record):
                                # NOVO: Salva o local na aba 'locais' se foi informado
                                if selected_location:
                                    from operations.extinguisher_operations import update_extinguisher_location
                                    from operations.history import load_sheet_data as load_locations_data
                                    
                                    df_locais = load_locations_data("locais")
                                    
                                    # Busca o nome do local selecionado
                                    if not df_locais.empty:
                                        location_row = df_locais[df_locais['id'] == selected_location]
                                        if not location_row.empty:
                                            location_name = location_row.iloc[0]['local']
                                            update_extinguisher_location(numero_identificacao, location_name)
                                
                                log_action("SALVOU_INSPECAO_EXTINTOR_MANUAL", f"ID: {numero_identificacao}, Status: {aprovado}")
                                st.success(f"✅ Inspeção para o extintor '{numero_identificacao}' registrada com sucesso!")
                                
                                if selected_location:
                                    st.success(f"📍 Local '{selected_location}' associado ao equipamento.")
                                
                                if manual_latitude and manual_longitude:
                                    st.success(f"🗺️ Coordenadas GPS salvas: ({manual_latitude:.6f}, {manual_longitude:.6f})")
                                
                                st.balloons()
                                st.cache_data.clear()
                                st.rerun()
                        except Exception as e:
                            st.error(f"❌ Erro ao salvar a inspeção: {e}")
                            import traceback
                            st.error(traceback.format_exc())
            
            # Botão de geolocalização FORA do formulário (para não resetar os campos)
            st.markdown("---")
            st.subheader("🌐 Capturar Localização Atual")
            
            col_btn1, col_btn2 = st.columns([3, 1])
            
            with col_btn1:
                st.info("Clique no botão ao lado para capturar automaticamente as coordenadas GPS do seu dispositivo.")
            
            with col_btn2:
                capture_location = st.button("📍 Capturar GPS", use_container_width=True, type="secondary")
            
            if capture_location:
                # Armazena um flag para indicar que deve capturar localização
                st.session_state['capture_geo_manual'] = True
                st.rerun()
            
            # Captura a localização se o flag estiver ativo
            if st.session_state.get('capture_geo_manual', False):
                location_js = streamlit_js_eval(js_expressions="""
                    new Promise(function(resolve, reject) {
                        navigator.geolocation.getCurrentPosition(
                            function(position) { 
                                resolve({ 
                                    latitude: position.coords.latitude, 
                                    longitude: position.coords.longitude 
                                }); 
                            },
                            function(error) { 
                                resolve({ error: error.message }); 
                            }
                        );
                    });
                """, key="manual_inspection_geolocation")
                
                if location_js:
                    st.session_state['capture_geo_manual'] = False  # Reset flag
                    
                    if 'error' in location_js:
                        st.error(f"❌ Erro ao capturar localização: {location_js['error']}")
                        st.info("Verifique se você permitiu o acesso à localização no seu navegador.")
                    else:
                        lat = location_js['latitude']
                        lon = location_js['longitude']
                        
                        st.success(f"✅ Localização capturada com sucesso!")
                        
                        # Exibe as coordenadas em formato copiável
                        col_display1, col_display2 = st.columns(2)
                        
                        with col_display1:
                            st.code(f"{lat:.6f}", language=None)
                            st.caption("👆 Copie esta Latitude")
                        
                        with col_display2:
                            st.code(f"{lon:.6f}", language=None)
                            st.caption("👆 Copie esta Longitude")
                        
                        st.info("💡 Cole estes valores nos campos de coordenadas no formulário acima e clique em 'Salvar Inspeção'.")
                        
                        # Link para o Google Maps
                        maps_url = f"https://www.google.com/maps?q={lat},{lon}"
                        st.markdown(f"🗺️ [Ver localização no Google Maps]({maps_url})")
