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
from utils.geolocation import show_geolocation_widget_optional

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
                        st.markdown("### 1️⃣ Status do Equipamento")
                        col_status1, col_status2 = st.columns(2)
                        
                        with col_status1:
                            conforme = st.checkbox("✅ CONFORME", key="btn_conforme")
                        with col_status2:
                            nao_conforme = st.checkbox("❌ NÃO CONFORME", key="btn_nao_conforme")
                        
                        # Validação de status
                        status = None
                        if conforme and not nao_conforme:
                            status = "Conforme"
                        elif nao_conforme and not conforme:
                            status = "Não Conforme"
                        elif conforme and nao_conforme:
                            st.error("⚠️ Selecione apenas uma opção: Conforme OU Não Conforme")
                        
                        # Campos condicionais baseados no status
                        observacoes = ""
                        photo_non_compliance = None
                        
                        if status == "Não Conforme":
                            st.divider()
                            st.markdown("### 2️⃣ Problemas Identificados")
                            
                            # Checklist de problemas comuns
                            problemas_comuns = {
                                "Pintura descascada ou corrosão": "PINTURA",
                                "Manômetro com defeito": "MANÔMETRO",
                                "Gatilho com problema": "GATILHO",
                                "Mangote danificado": "MANGOTE",
                                "Lacre violado": "LACRE",
                                "Pressão inadequada / Necessita recarga": "RECARGA",
                                "Sinalização inadequada": "SINALIZAÇÃO",
                                "Obstrução de acesso": "OBSTRUÇÃO",
                                "Dano visível no casco": "DANO VISÍVEL",
                                "Outro problema": "OUTRO"
                            }
                            
                            problemas_selecionados = []
                            col1, col2 = st.columns(2)
                            
                            items = list(problemas_comuns.items())
                            mid = len(items) // 2
                            
                            with col1:
                                for problema, codigo in items[:mid]:
                                    if st.checkbox(problema, key=f"prob_{codigo}"):
                                        problemas_selecionados.append(codigo)
                            
                            with col2:
                                for problema, codigo in items[mid:]:
                                    if st.checkbox(problema, key=f"prob_{codigo}"):
                                        problemas_selecionados.append(codigo)
                            
                            # Campo para observações adicionais
                            observacoes = st.text_area(
                                "Detalhes adicionais dos problemas:",
                                placeholder="Descreva detalhadamente os problemas encontrados...",
                                height=100,
                                key="obs_nao_conforme"
                            )
                            
                            # Gera observações automaticamente baseado nos checkboxes se não houver texto
                            if not observacoes and problemas_selecionados:
                                problemas_texto = [k for k, v in problemas_comuns.items() 
                                                 if v in problemas_selecionados]
                                observacoes = "Problemas identificados: " + ", ".join(problemas_texto)
                            
                            st.markdown("### 3️⃣ Evidência Fotográfica")
                            photo_non_compliance = st.camera_input(
                                "Tire uma foto da não conformidade:",
                                key="photo_nc",
                                help="A foto ajuda na análise e planejamento de correção"
                            )
                        
                        elif status == "Conforme":
                            st.success("👍 Equipamento em conformidade! Prossiga com o local e geolocalização.")
                        
                        st.divider()
                        
                        # NOVO: Seleção de Local
                        st.markdown("### 4️⃣ Local do Equipamento")
                        
                        # Import necessário para usar a função
                        from operations.location_operations import show_location_selector
                        
                        location_id = show_location_selector(
                            key_suffix=f"qr_inspection_{st.session_state.qr_id}",
                            required=False,
                            current_value=last_record.get('local_id') if last_record else None
                        )
                        
                        st.divider()
                        
                        # Geolocalização Opcional
                        st.markdown("### 5️⃣ Localização GPS (Opcional)")
                        
                        from utils.geolocation import show_geolocation_widget_optional
                        
                        latitude, longitude = show_geolocation_widget_optional(
                            form_key=f"qr_inspection_{st.session_state.qr_id}"
                        )
                        
                        st.divider()
                        
                        # Botão de confirmação destacado
                        submitted = st.form_submit_button(
                            "✅ CONFIRMAR E REGISTRAR" if status else "⚠️ Selecione o status primeiro",
                            type="primary",
                            disabled=(status is None),
                            use_container_width=True
                        )
                        
                        if submitted and status:
                            with st.spinner("💾 Salvando inspeção..."):
                                # Upload da foto se fornecida
                                photo_link_nc = None
                                if photo_non_compliance:
                                    photo_link_nc = upload_evidence_photo(
                                        photo_non_compliance, 
                                        st.session_state.qr_id, 
                                        "nao_conformidade"
                                    )
                                
                                # Calcula próximas datas
                                existing_dates = {
                                    k: last_record.get(k) 
                                    for k in ['data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 
                                             'data_proxima_manutencao_3_nivel', 'data_ultimo_ensaio_hidrostatico']
                                }
                                
                                updated_dates = calculate_next_dates(
                                    date.today().isoformat(), 
                                    "Inspeção", 
                                    existing_dates
                                )
                                
                                aprovado_str = "Sim" if status == "Conforme" else "Não"
                                
                                # Prepara novo registro
                                new_record = last_record.copy()
                                new_record.update({
                                    'tipo_servico': "Inspeção",
                                    'data_servico': date.today().isoformat(),
                                    'inspetor_responsavel': get_user_display_name(),
                                    'aprovado_inspecao': aprovado_str,
                                    'observacoes_gerais': observacoes or (
                                        "Inspeção de rotina OK." if status == "Conforme" 
                                        else "Não conformidade identificada."
                                    ),
                                    'plano_de_acao': generate_action_plan({
                                        'aprovado_inspecao': aprovado_str, 
                                        'observacoes_gerais': observacoes
                                    }),
                                    'link_relatorio_pdf': None,
                                    'link_foto_nao_conformidade': photo_link_nc,
                                    'local_id': location_id,  # NOVO: Salva o ID do local
                                    'latitude': latitude,
                                    'longitude': longitude
                                })
                                new_record.update(updated_dates)
                                
                                # Salva inspeção
                                if save_inspection(new_record):
                                    # Atualiza também a tabela de locais se necessário
                                    if location_id:
                                        from operations.location_operations import get_location_name_by_id
                                        location_name = get_location_name_by_id(location_id)
                                        
                                        # Atualiza a relação equipamento-local na planilha de locais
                                        # (se você quiser manter um registro separado)
                                        # update_extinguisher_location(st.session_state.qr_id, location_name)
                                    
                                    log_action(
                                        "INSPECIONOU_EXTINTOR_QR", 
                                        f"ID: {st.session_state.qr_id}, Status: {status}, "
                                        f"Local: {location_id or 'N/A'}, GPS: {'Sim' if latitude else 'Não'}"
                                    )
                                    
                                    # Feedback visual de sucesso
                                    st.success("✅ Inspeção registrada com sucesso!")
                                    st.balloons()
                                    
                                    # Mostra resumo da inspeção
                                    with st.expander("📋 Resumo da Inspeção", expanded=True):
                                        st.write(f"**Equipamento:** {st.session_state.qr_id}")
                                        st.write(f"**Status:** {status}")
                                        
                                        if location_id:
                                            from operations.location_operations import get_location_name_by_id
                                            location_name = get_location_name_by_id(location_id)
                                            st.write(f"**Local:** {location_name} ({location_id})")
                                        
                                        st.write(f"**Data:** {date.today().strftime('%d/%m/%Y')}")
                                        st.write(f"**Inspetor:** {get_user_display_name()}")
                                        
                                        if observacoes:
                                            st.write(f"**Observações:** {observacoes}")
                                        
                                        if latitude and longitude:
                                            from utils.geolocation import format_coordinates
                                            st.write(f"**GPS:** {format_coordinates(latitude, longitude)}")
                                    
                                    # Aguarda 2 segundos antes de resetar
                                    import time
                                    time.sleep(2)
                                    
                                    # Limpa session state e reseta
                                    st.session_state.qr_step = 'start'
                                    st.session_state.qr_id = None
                                    st.session_state.last_record = None
                                    
                                    # Limpa também os estados de geolocalização e local
                                    for key in list(st.session_state.keys()):
                                        if 'geo_' in key or 'location_' in key:
                                            del st.session_state[key]
                                    
                                    st.cache_data.clear()
                                    st.rerun()
                                else:
                                    st.error("❌ Erro ao salvar a inspeção. Tente novamente.")

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
        st.header("📝 Cadastro Manual de Inspeção")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para registrar inspeções.")
            st.info("Somente usuários com nível 'editor' ou superior podem adicionar dados.")
        else:
            st.info("💡 Use este formulário para cadastrar manualmente uma inspeção de extintor, sem necessidade de processamento IA.")
            
            with st.form("manual_inspection_form", clear_on_submit=True):
                st.subheader("📋 Dados Básicos do Equipamento")
                
                # Dados básicos do equipamento
                col1, col2 = st.columns(2)
                
                with col1:
                    numero_identificacao = st.text_input(
                        "Número de Identificação*", 
                        help="O ID único do extintor (obrigatório)"
                    )
                    tipo_agente = st.selectbox(
                        "Tipo de Agente*",
                        options=["AP", "BC", "ABC", "CO2", "Espuma Mecânica", "Pó Químico"],
                        help="Tipo de agente extintor"
                    )
                    marca_fabricante = st.text_input(
                        "Marca/Fabricante",
                        help="Fabricante do equipamento"
                    )
                
                with col2:
                    numero_selo_inmetro = st.text_input(
                        "Nº Selo INMETRO",
                        help="Número do selo do INMETRO (se aplicável)"
                    )
                    capacidade = st.number_input(
                        "Capacidade (Litros ou Kg)*",
                        min_value=0.0,
                        step=0.5,
                        format="%.1f",
                        help="Capacidade do extintor"
                    )
                    ano_fabricacao = st.number_input(
                        "Ano de Fabricação",
                        min_value=1980,
                        max_value=date.today().year,
                        value=date.today().year,
                        step=1,
                        help="Ano em que o extintor foi fabricado"
                    )
                
                st.markdown("---")
                st.subheader("🔍 Informações da Inspeção")
                
                col3, col4 = st.columns(2)
                
                with col3:
                    tipo_servico = st.selectbox(
                        "Tipo de Serviço*",
                        options=["Inspeção", "Manutenção Nível 2", "Manutenção Nível 3", "Substituição"],
                        help="Tipo de serviço realizado"
                    )
                    
                    aprovado = st.radio(
                        "Status da Inspeção*",
                        options=["Sim", "Não"],
                        horizontal=True,
                        help="O equipamento foi aprovado?"
                    )
                
                with col4:
                    data_servico = st.date_input(
                        "Data do Serviço*",
                        value=date.today(),
                        max_value=date.today(),
                        help="Data em que o serviço foi realizado"
                    )
                    
                    empresa_executante = st.text_input(
                        "Empresa Executante",
                        help="Nome da empresa que executou o serviço (opcional)"
                    )
                
                # Observações
                st.markdown("### 📝 Observações e Problemas")
                
                if aprovado == "Não":
                    st.warning("⚠️ Equipamento NÃO conforme - Descreva os problemas identificados")
                    
                    # Checklist de problemas comuns
                    st.markdown("**Problemas Comuns (selecione todos que se aplicam):**")
                    
                    problemas_comuns = {
                        "Pintura descascada ou corrosão": "PINTURA",
                        "Manômetro com defeito": "MANÔMETRO",
                        "Gatilho com problema": "GATILHO",
                        "Mangote/Mangueira danificado": "MANGOTE",
                        "Lacre violado": "LACRE",
                        "Pressão inadequada / Necessita recarga": "RECARGA",
                        "Sinalização inadequada": "SINALIZAÇÃO",
                        "Obstrução de acesso": "OBSTRUÇÃO",
                        "Dano visível no casco": "DANO VISÍVEL",
                        "Equipamento vencido": "VENCIDO"
                    }
                    
                    problemas_selecionados = []
                    col_prob1, col_prob2 = st.columns(2)
                    
                    items = list(problemas_comuns.items())
                    mid = len(items) // 2
                    
                    with col_prob1:
                        for problema, codigo in items[:mid]:
                            if st.checkbox(problema, key=f"manual_prob_{codigo}"):
                                problemas_selecionados.append(codigo)
                    
                    with col_prob2:
                        for problema, codigo in items[mid:]:
                            if st.checkbox(problema, key=f"manual_prob_{codigo}"):
                                problemas_selecionados.append(codigo)
                    
                    observacoes_gerais = st.text_area(
                        "Detalhes Adicionais dos Problemas",
                        placeholder="Descreva detalhadamente os problemas encontrados...",
                        height=120,
                        help="Quanto mais detalhes, melhor será o plano de ação"
                    )
                    
                    # Gera observações automaticamente se não houver texto
                    if not observacoes_gerais and problemas_selecionados:
                        problemas_texto = [k for k, v in problemas_comuns.items() 
                                         if v in problemas_selecionados]
                        observacoes_gerais = "Problemas identificados: " + ", ".join(problemas_texto)
                    
                else:
                    st.success("✅ Equipamento conforme")
                    observacoes_gerais = st.text_area(
                        "Observações (Opcional)",
                        placeholder="Adicione observações relevantes sobre a inspeção...",
                        height=100,
                        help="Observações adicionais sobre o equipamento"
                    )
                    problemas_selecionados = []
                
                st.markdown("---")
                st.subheader("📍 Localização do Equipamento")
                
                # Seletor de local
                from operations.location_operations import show_location_selector
                
                location_id = show_location_selector(
                    key_suffix="manual_inspection",
                    required=False,
                    current_value=None
                )
                
                st.markdown("---")
                st.subheader("🗺️ Coordenadas GPS (Opcional)")
                
                # Widget de geolocalização
                from utils.geolocation import show_geolocation_widget_optional
                
                latitude, longitude = show_geolocation_widget_optional(
                    form_key="manual_inspection"
                )
                
                st.markdown("---")
                
                # Botão de submissão
                col_submit, col_info = st.columns([2, 1])
                
                with col_submit:
                    submitted = st.form_submit_button(
                        "💾 SALVAR INSPEÇÃO",
                        type="primary",
                        use_container_width=True
                    )
                
                with col_info:
                    st.info("📌 Campos com * são obrigatórios")
                
                if submitted:
                    # Validação dos campos obrigatórios
                    if not numero_identificacao:
                        st.error("❌ O campo 'Número de Identificação' é obrigatório.")
                    elif not tipo_agente:
                        st.error("❌ O campo 'Tipo de Agente' é obrigatório.")
                    elif capacidade <= 0:
                        st.error("❌ A capacidade deve ser maior que zero.")
                    else:
                        # Busca o último registro para preservar datas existentes
                        last_record = find_last_record(df_extintores, numero_identificacao, 'numero_identificacao')
                        
                        # Define datas existentes para preservar
                        existing_dates = {}
                        if last_record is not None:
                            existing_dates = {
                                k: last_record.get(k) 
                                for k in ['data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 
                                         'data_proxima_manutencao_3_nivel', 'data_ultimo_ensaio_hidrostatico']
                            }
                        
                        # Calcula as novas datas com base no tipo de serviço
                        updated_dates = calculate_next_dates(
                            data_servico.isoformat(), 
                            tipo_servico, 
                            existing_dates
                        )
                        
                        # Gera plano de ação baseado no status e observações
                        inspection_data = {
                            'aprovado_inspecao': aprovado,
                            'observacoes_gerais': observacoes_gerais
                        }
                        plano_acao = generate_action_plan(inspection_data)
                        
                        # Dados completos da inspeção
                        new_record = {
                            'numero_identificacao': numero_identificacao,
                            'numero_selo_inmetro': numero_selo_inmetro if numero_selo_inmetro else None,
                            'tipo_agente': tipo_agente,
                            'capacidade': capacidade,
                            'marca_fabricante': marca_fabricante if marca_fabricante else None,
                            'ano_fabricacao': ano_fabricacao if ano_fabricacao else None,
                            'tipo_servico': tipo_servico,
                            'data_servico': data_servico.isoformat(),
                            'inspetor_responsavel': get_user_display_name(),
                            'empresa_executante': empresa_executante if empresa_executante else None,
                            'aprovado_inspecao': aprovado,
                            'observacoes_gerais': observacoes_gerais if observacoes_gerais else (
                                "Inspeção de rotina - Equipamento OK" if aprovado == "Sim" 
                                else "Não conformidade identificada"
                            ),
                            'plano_de_acao': plano_acao,
                            'link_relatorio_pdf': None,
                            'link_foto_nao_conformidade': None,
                            'local_id': location_id,  # ID do local
                            'latitude': latitude,
                            'longitude': longitude
                        }
                        
                        # Adiciona as datas calculadas
                        new_record.update(updated_dates)
                        
                        # Tenta salvar
                        try:
                            with st.spinner("💾 Salvando inspeção..."):
                                if save_inspection(new_record):
                                    # Log detalhado
                                    log_details = f"ID: {numero_identificacao}, Status: {aprovado}, Tipo: {tipo_servico}"
                                    if location_id:
                                        log_details += f", Local: {location_id}"
                                    if latitude and longitude:
                                        log_details += ", GPS: Sim"
                                    
                                    log_action("SALVOU_INSPECAO_EXTINTOR_MANUAL", log_details)
                                    
                                    # Feedback de sucesso com resumo
                                    st.success("✅ Inspeção registrada com sucesso!")
                                    st.balloons()
                                    
                                    # Exibe resumo da inspeção
                                    with st.expander("📋 Resumo da Inspeção Salva", expanded=True):
                                        col_res1, col_res2 = st.columns(2)
                                        
                                        with col_res1:
                                            st.markdown(f"""
                                            **Equipamento:** {numero_identificacao}  
                                            **Tipo:** {tipo_agente} - {capacidade}L/Kg  
                                            **Status:** {aprovado}  
                                            **Data:** {data_servico.strftime('%d/%m/%Y')}
                                            """)
                                        
                                        with col_res2:
                                            st.markdown(f"""
                                            **Serviço:** {tipo_servico}  
                                            **Inspetor:** {get_user_display_name()}  
                                            **Empresa:** {empresa_executante or 'N/A'}
                                            """)
                                        
                                        if location_id:
                                            from operations.location_operations import get_location_name_by_id
                                            location_name = get_location_name_by_id(location_id)
                                            st.info(f"📍 **Local:** {location_name} ({location_id})")
                                        
                                        if latitude and longitude:
                                            from utils.geolocation import format_coordinates, get_google_maps_link
                                            st.info(f"🗺️ **GPS:** {format_coordinates(latitude, longitude)}")
                                            maps_link = get_google_maps_link(latitude, longitude)
                                            if maps_link:
                                                st.markdown(f"[Ver no Google Maps]({maps_link})")
                                        
                                        if observacoes_gerais:
                                            st.markdown(f"**📝 Observações:**")
                                            st.text(observacoes_gerais)
                                        
                                        st.markdown(f"**🎯 Plano de Ação:**")
                                        st.text(plano_acao)
                                        
                                        # Próximas datas
                                        if updated_dates.get('data_proxima_inspecao'):
                                            st.markdown(f"**📅 Próxima Inspeção:** {updated_dates['data_proxima_inspecao']}")
                                    
                                    # Limpa cache
                                    st.cache_data.clear()
                                    
                                    # Aguarda um pouco para o usuário ver o resumo
                                    import time
                                    time.sleep(3)
                                    
                                    # Oferece opção de continuar ou voltar
                                    st.info("👆 Role para cima para cadastrar outra inspeção ou navegue para outra aba.")
                                    
                        except Exception as e:
                            st.error(f"❌ Erro ao salvar a inspeção: {e}")
                            st.exception(e)
                            st.info("💡 Tente novamente ou contate o suporte se o erro persistir.")
