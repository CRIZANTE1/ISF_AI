import streamlit as st
import pandas as pd
from datetime import date
import sys
import os
from streamlit_js_eval import streamlit_js_eval
import json

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from operations.extinguisher_operations import (
    process_extinguisher_pdf, calculate_next_dates, save_inspection, 
    generate_action_plan, clean_and_prepare_ia_data, save_new_extinguisher,
    update_extinguisher_location  
)
from operations.history import find_last_record, load_sheet_data
from operations.qr_inspection_utils import decode_qr_from_image
from operations.photo_operations import upload_evidence_photo
from operations.location_operations import show_location_selector 
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

    tab_instrucoes, tab_qr, tab_batch, tab_cadastro, tab_manual = st.tabs([
        "📖 Como Usar", 
        "📱 Inspeção Rápida (QR Code)", 
        "🗂️ Registro em Lote (PDF)", 
        "➕ Cadastrar / Editar",
        "📝 Cadastro Manual"
    ])
    
    
    
    with tab_instrucoes:
            st.header("📖 Guia de Uso - Sistema de Inspeção de Extintores")
            
            # Alerta de priorização
            st.success(
                "⚡ **Recomendação:** Para inspeções mais rápidas e eficientes, "
                "utilize a **Inspeção Rápida via QR Code**! É o método mais ágil e prático."
            )
            
            st.markdown("---")
            
            # Comparação de métodos
            st.subheader("🎯 Escolha o Melhor Método para Sua Situação")
            
            col1, col2, col3 = st.columns(3)
            
            with col1:
                st.markdown("""
                ### 📱 Inspeção QR Code
                **⚡ MAIS RÁPIDA - RECOMENDADA**
                
                **Tempo:** ~30 segundos por extintor
                
                **Ideal para:**
                - ✅ Inspeções de rotina mensais
                - ✅ Uso em campo com celular
                - ✅ Verificações rápidas
                - ✅ Captura automática de GPS
                
                **Como funciona:**
                1. Permite localização no navegador
                2. Escaneie o QR Code do extintor
                3. Marque "Conforme" ou "Não Conforme"
                4. Tire foto se necessário
                5. Confirme - Pronto! ✅
                
                **Vantagens:**
                - ⚡ Extremamente rápida
                - 📍 GPS automático de alta precisão
                - 📱 Funciona direto no celular
                - 🔍 Sem digitar códigos manualmente
                """)
            
            with col2:
                st.markdown("""
                ### 🗂️ Registro em Lote (PDF)
                **🤖 INTELIGÊNCIA ARTIFICIAL**
                
                **Tempo:** ~2-3 minutos (múltiplos extintores)
                
                **Ideal para:**
                - 📄 Relatórios de empresas terceirizadas
                - 🔧 Manutenções N2 e N3 completas
                - 📊 Processar muitos extintores de uma vez
                
                **Como funciona:**
                1. Faça upload do PDF da empresa
                2. IA extrai dados automaticamente
                3. Revise os dados na tabela
                4. Confirme e salve tudo de uma vez
                
                **Vantagens:**
                - 🤖 IA processa tudo automaticamente
                - 📊 Múltiplos equipamentos de uma vez
                - 📄 Mantém PDF anexado
                - ⏱️ Economiza tempo em lotes grandes
                
                **Requer:** Plano Premium IA
                """)
            
            with col3:
                st.markdown("""
                ### 📝 Cadastro Manual
                **🐌 MAIS LENTA**
                
                **Tempo:** ~3-5 minutos por extintor
                
                **Ideal para:**
                - 🆕 Primeiro cadastro de extintor novo
                - ✏️ Correções e ajustes específicos
                - 📍 Quando não tem QR Code
                - 🔧 Situações especiais
                
                **Como funciona:**
                1. Preencha todos os campos manualmente
                2. Opcionalmente capture GPS
                3. Digite observações
                4. Salve o registro
                
                **Vantagens:**
                - 📝 Controle total dos dados
                - 🔧 Flexibilidade máxima
                - 🆕 Para equipamentos novos
                """)
            
            st.markdown("---")
            
            # Fluxo de trabalho recomendado
            st.subheader("🎯 Fluxo de Trabalho Recomendado")
            
            st.info("""
            **Para Máxima Eficiência, Siga Esta Ordem:**
            
            1️⃣ **Inspeções de Rotina Mensais** → Use **QR Code** (mais rápido!)
            
            2️⃣ **Recebeu Relatório de Manutenção Externa** → Use **Registro em Lote PDF** (IA processa tudo)
            
            3️⃣ **Cadastrar Extintor Novo ou Fazer Correção** → Use **Cadastro Manual**
            """)
            
            st.markdown("---")
            
            # Guia detalhado de QR Code
            st.subheader("📱 Guia Completo: Inspeção Rápida via QR Code")
            
            with st.expander("🚀 Passo a Passo Detalhado", expanded=True):
                st.markdown("""
                #### **Antes de Começar:**
                - 📱 Use um **celular ou tablet** para melhor experiência
                - 📍 **Permita o acesso à localização** quando solicitado pelo navegador
                - 🌐 Tenha **conexão com a internet** (pode ser 3G/4G)
                - 🔦 Verifique se há **boa iluminação** para escanear o QR Code
                
                ---
                
                #### **Passo 1: Permita a Localização** 📍
                - O sistema solicitará permissão para usar sua localização
                - **Clique em "Permitir"** - isso é essencial para rastreabilidade
                - Aguarde alguns segundos enquanto obtemos localização de alta precisão
                - ✅ Você verá "Localização pronta! (Precisão: X metros)"
                
                💡 **Dica:** Quanto menor o número de metros, melhor a precisão!
                
                ---
                
                #### **Passo 2: Escolha Como Identificar o Equipamento** 🔍
                
                **Opção A - Escanear QR Code (RECOMENDADO):**
                1. Clique no botão **"📷 Escanear QR Code"**
                2. Aponte a câmera para o QR Code no extintor
                3. Aguarde o sistema ler automaticamente
                4. ✅ ID será preenchido automaticamente!
                
                **Opção B - Digitar Manualmente:**
                1. Digite o **ID do Equipamento** no campo de texto
                2. Clique em **"🔍 Buscar por ID"**
                3. Sistema localizará o extintor
                
                ---
                
                #### **Passo 3: Registre a Inspeção** ✅
                
                Após identificar o equipamento, você verá:
                - 📊 Informações do último registro (selo, tipo, vencimento)
                - 🎯 Status atual do equipamento
                
                **Marque o status:**
                - **✅ Conforme** - Equipamento está OK
                - **❌ Não Conforme** - Equipamento tem problema
                
                **Se marcar "Não Conforme":**
                1. Selecione os problemas encontrados (lacre violado, manômetro fora de faixa, etc.)
                2. **Opcional:** Tire uma foto da não conformidade
                    - Você pode usar a câmera na hora OU
                    - Enviar uma foto da galeria (maior qualidade)
                
                ---
                
                #### **Passo 4: Confirme e Finalize** 💾
                
                1. Revise as informações de localização GPS exibidas
                2. Clique em **"✅ Confirmar e Registrar Inspeção"**
                3. 🎉 Pronto! Inspeção salva com sucesso!
                4. Pode partir para o próximo extintor
                
                ---
                
                #### **⚡ Dicas para Inspeções Ainda Mais Rápidas:**
                
                - 🏃 Organize sua rota para inspecionar todos os extintores de uma área de uma vez
                - 📋 Mantenha um checklist mental dos pontos principais (lacre, manômetro, acesso)
                - 📱 Mantenha o celular sempre pronto com a câmera desbloqueada
                - 🔦 Use a lanterna do celular se precisar de luz extra para escanear QR Codes
                - 🎯 Em áreas com sinal GPS fraco, vá para perto de uma janela ou área aberta
                
                ---
                
                #### **❓ Problemas Comuns e Soluções:**
                
                **"Não consegui capturar a localização GPS"**
                - ✅ Verifique se permitiu o acesso à localização no navegador
                - ✅ Tente ir para uma área mais aberta ou próxima a janelas
                - ✅ Aguarde alguns segundos - GPS de alta precisão leva um tempo
                - ✅ Se persistir, pode digitar coordenadas manualmente
                
                **"QR Code não está sendo lido"**
                - ✅ Limpe a câmera do celular
                - ✅ Melhore a iluminação (use a lanterna se necessário)
                - ✅ Aproxime ou afaste o celular do QR Code
                - ✅ Se não funcionar, use a opção "Buscar por ID"
                
                **"Equipamento não encontrado"**
                - ✅ Verifique se o ID está correto
                - ✅ Confirme se o extintor foi cadastrado na aba "Cadastrar / Editar"
                - ✅ Entre em contato com o administrador se necessário
                """)
            
            st.markdown("---")
            
            # Perguntas frequentes
            st.subheader("❓ Perguntas Frequentes")
            
            with st.expander("📍 Por que preciso permitir a localização?"):
                st.markdown("""
                A localização GPS é essencial para:
                - ✅ **Rastreabilidade:** Saber exatamente onde cada extintor foi inspecionado
                - ✅ **Auditoria:** Comprovar que a inspeção foi feita no local correto
                - ✅ **Mapa de Equipamentos:** Visualizar distribuição espacial dos extintores
                - ✅ **Conformidade:** Atender requisitos de normas técnicas
                
                **Não se preocupe:** Sua localização só é usada no momento da inspeção e fica vinculada ao equipamento, não a você.
                """)
            
            with st.expander("🤖 Preciso do plano Premium IA para usar QR Code?"):
                st.markdown("""
                **NÃO!** A inspeção via QR Code está disponível para **todos os planos Pro e Premium IA**.
                
                O plano Premium IA adiciona:
                - 🤖 Processamento automático de PDFs com IA
                - 📊 Registro em lote de múltiplos equipamentos
                - 🎯 Automações avançadas
                
                Mas o QR Code já está liberado no seu plano atual! 🎉
                """)
            
            with st.expander("⏱️ Quanto tempo leva cada método?"):
                st.markdown("""
                **Tempos médios por equipamento:**
                
                - 📱 **QR Code:** 30 segundos - 1 minuto (MAIS RÁPIDO!)
                - 🗂️ **PDF em Lote:** 2-3 minutos para 10+ equipamentos
                - 📝 **Cadastro Manual:** 3-5 minutos por equipamento
                
                **Exemplo prático:**
                - Inspecionar 20 extintores via QR Code: ~10-20 minutos
                - Inspecionar 20 extintores manualmente: ~60-100 minutos
                
                **💡 A inspeção QR Code é até 5x mais rápida!**
                """)
            
            with st.expander("📸 Quando devo tirar fotos?"):
                st.markdown("""
                **Tire fotos apenas quando:**
                - ❌ O equipamento for reprovado (não conforme)
                - 🔍 Houver dano visível que precise ser documentado
                - 📋 Para evidenciar a não conformidade em auditorias
                
                **NÃO é necessário tirar foto quando:**
                - ✅ O equipamento está conforme (OK)
                - 📊 É apenas uma inspeção de rotina normal
                
                **Dica:** Use a opção "Enviar da Galeria" para fotos de melhor qualidade.
                """)
            
            with st.expander("🔧 Posso editar uma inspeção depois de salvar?"):
                st.markdown("""
                **Não diretamente, mas você pode:**
                
                1. **Registrar uma nova inspeção** com os dados corretos
                2. O sistema sempre considera o **registro mais recente**
                3. O histórico completo fica preservado para auditoria
                
                **Importante:** Nunca há perda de dados - tudo fica registrado no histórico.
                
                Para correções administrativas, contate um administrador do sistema.
                """)
            
            st.markdown("---")
            
            # Call-to-action
            st.success("""
            ### 🚀 Pronto para Começar?
            
            **Clique na aba "📱 Inspeção Rápida (QR Code)" acima e faça sua primeira inspeção em menos de 1 minuto!**
            
            Lembre-se: Quanto mais você usar, mais rápido e eficiente ficará! ⚡
            """)
    
    
    
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
            # Inicializa session state
            st.session_state.setdefault('qr_step', 'start')
            st.session_state.setdefault('qr_id', None)
            st.session_state.setdefault('last_record', None)
            st.session_state.setdefault('location', None)
            
            # ====================================================================
            # ETAPA: CAPTURA INICIAL DE LOCALIZAÇÃO (HIGH ACCURACY)
            # ====================================================================
            if st.session_state.qr_step == 'start' and st.session_state.location is None:
                with st.spinner("📍 Aguardando permissão e localização de alta precisão..."):
                    loc = streamlit_js_eval(js_expressions="""
                        new Promise(function(resolve, reject) {
                            const options = { 
                                enableHighAccuracy: true, 
                                timeout: 10000, 
                                maximumAge: 0 
                            };
                            navigator.geolocation.getCurrentPosition(
                                function(p) { 
                                    resolve({
                                        latitude: p.coords.latitude, 
                                        longitude: p.coords.longitude, 
                                        accuracy: p.coords.accuracy
                                    }); 
                                },
                                function(e) { resolve(null); },
                                options
                            );
                        });
                    """, key="qr_initial_location")
                    
                    if loc:
                        st.session_state.location = loc
                        st.rerun()
            
            # ====================================================================
            # ETAPA 1: IDENTIFICAÇÃO DO EQUIPAMENTO
            # ====================================================================
            if st.session_state.qr_step == 'start':
                location = st.session_state.location
                is_location_ok = False
                
                # Validação e feedback de localização
                if location:
                    accuracy = location.get('accuracy', 999)
                    PRECISION_THRESHOLD = 30  # metros
                    
                    if accuracy <= PRECISION_THRESHOLD:
                        st.success(f"✅ Localização pronta! (Precisão: {accuracy:.1f} metros)")
                        is_location_ok = True
                    else:
                        st.warning(
                            f"⚠️ Localização com baixa precisão ({accuracy:.1f}m). "
                            f"Tente ir para um local mais aberto ou use a digitação manual."
                        )
                        is_location_ok = True
                else:
                    st.error("❌ A geolocalização é necessária para continuar com a inspeção.")
                    st.info(
                        "💡 **Dica:** Certifique-se de permitir o acesso à localização no seu navegador. "
                        "A inspeção QR Code requer coordenadas GPS para garantir a rastreabilidade."
                    )
    
                st.subheader("1️⃣ Identifique o Equipamento")
                
                col1, col2, col3 = st.columns([2, 0.5, 2])
                
                with col1:
                    st.info("**Opção A: Leitura Rápida**")
                    scan_btn = st.button(
                        "📷 Escanear QR Code", 
                        type="primary", 
                        use_container_width=True, 
                        disabled=not location,
                        help="Aponte a câmera para o QR Code do extintor"
                    )
                    if scan_btn:
                        st.session_state.qr_step = 'scan'
                        st.rerun()
                
                with col3:
                    st.info("**Opção B: Digitação Manual**")
                    manual_id = st.text_input(
                        "ID do Equipamento", 
                        key="manual_id_qr", 
                        label_visibility="collapsed",
                        placeholder="Digite o ID do extintor"
                    )
                    search_btn = st.button(
                        "🔍 Buscar por ID", 
                        use_container_width=True, 
                        disabled=not location,
                        help="Digite o número de identificação do extintor"
                    )
                    if search_btn:
                        if manual_id:
                            st.session_state.qr_id = manual_id
                            st.session_state.last_record = find_last_record(
                                df_extintores, 
                                manual_id, 
                                'numero_identificacao'
                            )
                            st.session_state.qr_step = 'inspect'
                            st.rerun()
                        else:
                            st.warning("⚠️ Digite um ID válido.")
                
                # Botão para tentar obter localização novamente
                if not location:
                    st.markdown("---")
                    if st.button("🔄 Tentar Obter Localização Novamente", use_container_width=True):
                        st.session_state.location = None
                        st.rerun()
            
            # ====================================================================
            # ETAPA 2: ESCANEAMENTO DO QR CODE
            # ====================================================================
            if st.session_state.qr_step == 'scan':
                st.subheader("2️⃣ Aponte a câmera para o QR Code")
                
                qr_image = st.camera_input(
                    "Câmera", 
                    key="qr_camera", 
                    label_visibility="collapsed"
                )
                
                if qr_image:
                    with st.spinner("🔍 Processando QR Code..."):
                        decoded_id, _ = decode_qr_from_image(qr_image)
                        
                        if decoded_id:
                            st.session_state.qr_id = decoded_id
                            st.session_state.last_record = find_last_record(
                                df_extintores, 
                                decoded_id, 
                                'numero_identificacao'
                            )
                            st.session_state.qr_step = 'inspect'
                            st.rerun()
                        else:
                            st.warning("⚠️ QR Code não detectado. Tente novamente com melhor iluminação.")
                
                if st.button("❌ Cancelar", use_container_width=True):
                    st.session_state.qr_step = 'start'
                    st.rerun()
            
            # ====================================================================
            # ETAPA 3: REGISTRO DA INSPEÇÃO
            # ====================================================================
            if st.session_state.qr_step == 'inspect':
                last_record = st.session_state.last_record
                
                if last_record:
                    st.success(f"✅ Equipamento Encontrado! ID: **{st.session_state.qr_id}**")
                    
                    # Card com informações do equipamento
                    with st.container(border=True):
                        col1, col2, col3 = st.columns(3)
                        
                        col1.metric(
                            "🏷️ Último Selo", 
                            last_record.get('numero_selo_inmetro', 'N/A')
                        )
                        
                        col2.metric(
                            "🔥 Tipo", 
                            last_record.get('tipo_agente', 'N/A')
                        )
                        
                        # Calcula próximo vencimento
                        vencimentos = [
                            pd.to_datetime(last_record.get(d), errors='coerce') 
                            for d in ['data_proxima_inspecao', 'data_proxima_manutencao_2_nivel', 'data_proxima_manutencao_3_nivel']
                        ]
                        valid_vencimentos = [d for d in vencimentos if pd.notna(d)]
                        proximo_vencimento = min(valid_vencimentos) if valid_vencimentos else None
                        vencimento_str = proximo_vencimento.strftime('%d/%m/%Y') if proximo_vencimento else 'N/A'
                        
                        # Status visual do vencimento
                        if proximo_vencimento:
                            days_until = (proximo_vencimento - pd.Timestamp(date.today())).days
                            if days_until < 0:
                                col3.metric("⏰ Próximo Vencimento", vencimento_str, delta="VENCIDO", delta_color="inverse")
                            elif days_until <= 7:
                                col3.metric("⏰ Próximo Vencimento", vencimento_str, delta=f"{days_until} dias", delta_color="off")
                            else:
                                col3.metric("⏰ Próximo Vencimento", vencimento_str)
                        else:
                            col3.metric("⏰ Próximo Vencimento", vencimento_str)
                    
                    st.markdown("---")
                    st.subheader("3️⃣ Registrar Nova Inspeção (Nível 1)")
                    
                    # Status do equipamento
                    status = st.radio(
                        "**Status do Equipamento:**", 
                        ["✅ Conforme", "❌ Não Conforme"], 
                        horizontal=True,
                        key="qr_status_radio"
                    )
                    
                    # Lógica de não conformidades
                    issues = []
                    photo_non_compliance = None
                    
                    if status == "❌ Não Conforme":
                        st.warning("⚠️ **Equipamento reprovado!** Selecione os problemas encontrados:")
                        
                        issue_options = [
                            "Lacre Violado",
                            "Manômetro Fora de Faixa",
                            "Dano Visível no Corpo",
                            "Obstrução de Acesso",
                            "Sinalização Inadequada/Faltando",
                            "Suporte Danificado/Faltando",
                            "Pintura Danificada/Corrosão"
                        ]
                        
                        issues = st.multiselect(
                            "Selecione as não conformidades encontradas:",
                            issue_options,
                            key="qr_issues_multiselect"
                        )
                        
                        st.markdown("---")
                        st.info("📸 **Opcional:** Registre uma foto da não conformidade para documentação.")
                        
                        if st.toggle("📷 Anexar foto da não conformidade", key="toggle_nc_photo_qr"):
                            st.write("**Opção 1: Tirar Foto Agora (Qualidade Menor)**")
                            camera_photo = st.camera_input(
                                "Câmera", 
                                label_visibility="collapsed", 
                                key="nc_camera_qr"
                            )
                            
                            st.markdown("---")
                            st.write("**Opção 2: Enviar da Galeria (Qualidade Alta)**")
                            gallery_photo = st.file_uploader(
                                "Galeria", 
                                type=["jpg", "jpeg", "png"], 
                                label_visibility="collapsed", 
                                key="nc_uploader_qr"
                            )
    
                            # Prioriza galeria sobre câmera
                            if gallery_photo:
                                photo_non_compliance = gallery_photo
                            elif camera_photo:
                                photo_non_compliance = camera_photo
                    
                    st.markdown("---")
                    
                    # Formulário de confirmação
                    with st.form("quick_inspection_form"):
                        location = st.session_state.location
                        
                        # Exibe informações de localização
                        if location:
                            accuracy = location.get('accuracy', 999)
                            
                            col_loc1, col_loc2, col_loc3 = st.columns(3)
                            col_loc1.metric("📍 Latitude", f"{location['latitude']:.6f}")
                            col_loc2.metric("📍 Longitude", f"{location['longitude']:.6f}")
                            col_loc3.metric("🎯 Precisão", f"{accuracy:.1f}m")
                            
                            if accuracy <= 30:
                                st.success("✅ Localização de alta precisão registrada.")
                            else:
                                st.info(f"ℹ️ Localização registrada com precisão de {accuracy:.1f} metros.")
                        else:
                            st.warning("⚠️ Localização não obtida. A inspeção não pode ser registrada.")
                        
                        # Botão de submit
                        submitted = st.form_submit_button(
                            "✅ Confirmar e Registrar Inspeção", 
                            type="primary", 
                            disabled=not location,
                            use_container_width=True
                        )
                        
                        if submitted:
                            with st.spinner("💾 Salvando inspeção..."):
                                # Upload de foto se houver
                                photo_link_nc = None
                                if photo_non_compliance:
                                    photo_link_nc = upload_evidence_photo(
                                        photo_non_compliance, 
                                        st.session_state.qr_id,
                                        "nao_conformidade"
                                    )
                                
                                # Prepara novo registro
                                new_record = last_record.copy()
                                
                                # Preserva datas existentes
                                existing_dates = {
                                    'data_proxima_inspecao': last_record.get('data_proxima_inspecao'),
                                    'data_proxima_manutencao_2_nivel': last_record.get('data_proxima_manutencao_2_nivel'),
                                    'data_proxima_manutencao_3_nivel': last_record.get('data_proxima_manutencao_3_nivel'),
                                    'data_ultimo_ensaio_hidrostatico': last_record.get('data_ultimo_ensaio_hidrostatico'),
                                }
                                
                                # Calcula novas datas
                                updated_dates = calculate_next_dates(
                                    service_date_str=date.today().isoformat(), 
                                    service_level="Inspeção", 
                                    existing_dates=existing_dates
                                )
                                
                                # Monta observações
                                aprovado_str = "Sim" if status == "✅ Conforme" else "Não"
                                
                                if status == "✅ Conforme":
                                    observacoes = "Inspeção de rotina OK. Equipamento conforme."
                                else:
                                    observacoes = "Não conformidades: " + ", ".join(issues) if issues else "Equipamento reprovado (detalhes não especificados)"
                                
                                # Gera plano de ação
                                temp_plan_record = {
                                    'aprovado_inspecao': aprovado_str, 
                                    'observacoes_gerais': observacoes
                                }
                                
                                # Atualiza registro
                                new_record.update({
                                    'tipo_servico': "Inspeção",
                                    'data_servico': date.today().isoformat(),
                                    'inspetor_responsavel': get_user_display_name(),
                                    'aprovado_inspecao': aprovado_str,
                                    'observacoes_gerais': observacoes,
                                    'plano_de_acao': generate_action_plan(temp_plan_record),
                                    'link_relatorio_pdf': None,
                                    'latitude': location['latitude'],
                                    'longitude': location['longitude'],
                                    'link_foto_nao_conformidade': photo_link_nc
                                })
                                
                                new_record.update(updated_dates)
                                
                                # Salva inspeção
                                if save_inspection(new_record):
                                    log_action(
                                        "INSPECIONOU_EXTINTOR_QR", 
                                        f"ID: {st.session_state.qr_id}, Status: {status}"
                                    )
                                    
                                    st.success("✅ Inspeção registrada com sucesso!")
                                    
                                    # Exibe resumo
                                    st.info(
                                        f"📋 **Resumo:**\n"
                                        f"- Equipamento: {st.session_state.qr_id}\n"
                                        f"- Status: {status}\n"
                                        f"- Localização: Lat {location['latitude']:.6f}, Lon {location['longitude']:.6f}\n"
                                        f"- Precisão: {location.get('accuracy', 'N/A'):.1f}m"
                                    )
                                    
                                    st.balloons()
                                    
                                    # Reset para próxima inspeção
                                    st.session_state.qr_step = 'start'
                                    st.session_state.location = None
                                    st.cache_data.clear()
                                    st.rerun()
                                else:
                                    st.error("❌ Erro ao salvar inspeção. Tente novamente.")
                    
                    st.markdown("---")
                    
                    if st.button("🔄 Inspecionar Outro Equipamento", use_container_width=True):
                        st.session_state.qr_step = 'start'
                        st.session_state.location = None
                        st.rerun()
                
                else:
                    st.error(
                        f"❌ Nenhum registro encontrado para o ID '{st.session_state.qr_id}'. "
                        f"Verifique se o extintor está cadastrado na aba 'Cadastrar / Editar'."
                    )
                    
                    if st.button("🔙 Voltar", use_container_width=True):
                        st.session_state.qr_step = 'start'
                        st.rerun()

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

    # Nova aba para cadastro manual de inspeções
    with tab_manual:
        st.header("Cadastro Manual de Inspeção")
        
        if not can_edit():
            st.warning("Você precisa de permissões de edição para registrar inspeções.")
        else:
            st.info("Use este formulário para cadastrar manualmente uma inspeção de extintor, sem necessidade de processamento IA.")
            

            st.markdown("---")
            st.subheader("🌐 Passo 1: Capturar Localização GPS (Opcional)")
            
            col_btn1, col_btn2 = st.columns([3, 1])
            
            with col_btn1:
                st.info("Clique no botão ao lado para capturar automaticamente as coordenadas GPS do seu dispositivo.")
            
            with col_btn2:
                capture_location = st.button("📍 Capturar GPS", use_container_width=True, type="secondary", key="btn_capture_gps_manual")
            
            # Inicializa variáveis de sessão para as coordenadas
            if 'manual_lat_captured' not in st.session_state:
                st.session_state['manual_lat_captured'] = None
            if 'manual_lon_captured' not in st.session_state:
                st.session_state['manual_lon_captured'] = None
            
            # Captura a localização quando o botão é clicado
            if capture_location:
                st.session_state['capture_geo_manual'] = True
            
            # Executa a captura se o flag estiver ativo
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
                        # Salva as coordenadas no session_state
                        st.session_state['manual_lat_captured'] = location_js['latitude']
                        st.session_state['manual_lon_captured'] = location_js['longitude']
                        
                        st.success(f"✅ Localização capturada com sucesso!")
                        
                        # Exibe as coordenadas
                        col_display1, col_display2 = st.columns(2)
                        
                        with col_display1:
                            st.metric("📍 Latitude", f"{location_js['latitude']:.6f}")
                        
                        with col_display2:
                            st.metric("📍 Longitude", f"{location_js['longitude']:.6f}")
                        
                        st.info("💡 As coordenadas foram salvas e serão preenchidas automaticamente no formulário abaixo.")
                        
                        # Link para o Google Maps
                        lat = location_js['latitude']
                        lon = location_js['longitude']
                        maps_url = f"https://www.google.com/maps?q={lat},{lon}"
                        st.markdown(f"🗺️ [Ver localização no Google Maps]({maps_url})")
            
            # ====================================================================
            # SEÇÃO 2: SELEÇÃO DE LOCAL (FORA DO FORMULÁRIO)
            # ====================================================================
            st.markdown("---")
            st.subheader("📍 Passo 2: Selecionar Local (Opcional)")
            
            from operations.location_operations import show_location_selector
            
            # Widget de seleção de local - FORA DO FORMULÁRIO
            selected_location = show_location_selector(
                key_suffix="manual_inspection",
                required=False,
                current_value=None
            )
            
            if selected_location:
                st.success(f"✅ Local selecionado: **{selected_location}**")
            
            # ====================================================================
            # SEÇÃO 3: FORMULÁRIO DE INSPEÇÃO (SEM BOTÕES INTERNOS)
            # ====================================================================
            st.markdown("---")
            st.subheader("📝 Passo 3: Preencher Dados da Inspeção")
            
            with st.form("manual_inspection_form", clear_on_submit=True):
                st.write("**Dados do Equipamento**")
                
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
                st.write("**Informações da Inspeção**")
                
                col7, col8 = st.columns(2)
                tipo_servico = col7.selectbox("Tipo de Serviço", ["Inspeção", "Manutenção Nível 2", "Manutenção Nível 3"])
                data_servico = col8.date_input("Data do Serviço", value=date.today())
                
                col9, col10 = st.columns(2)
                aprovado = col9.radio("Aprovado na Inspeção?", ["Sim", "Não"], horizontal=True)
                empresa_executante = col10.text_input("Empresa Executante (opcional)")
                
                observacoes_gerais = st.text_area("Observações", help="Descreva problemas encontrados, se houver.")
                
                # Coordenadas GPS (somente leitura dentro do formulário)
                st.markdown("---")
                st.write("**🗺️ Coordenadas GPS**")
                
                col_geo1, col_geo2 = st.columns(2)
                
                # Pega valores do session_state ou permite entrada manual
                default_lat = st.session_state.get('manual_lat_captured')
                default_lon = st.session_state.get('manual_lon_captured')
                
                with col_geo1:
                    manual_latitude = st.number_input(
                        "Latitude", 
                        value=default_lat,
                        format="%.6f",
                        help="Use o botão 'Capturar GPS' acima ou digite manualmente",
                        key="manual_lat_input"
                    )
                
                with col_geo2:
                    manual_longitude = st.number_input(
                        "Longitude", 
                        value=default_lon,
                        format="%.6f",
                        help="Use o botão 'Capturar GPS' acima ou digite manualmente",
                        key="manual_lon_input"
                    )
                
                # BOTÃO DE SUBMIT DO FORMULÁRIO
                submitted = st.form_submit_button("💾 Salvar Inspeção", type="primary", use_container_width=True)
                
                if submitted:
                    if not numero_identificacao:
                        st.error("❌ O campo 'Número de Identificação' é obrigatório.")
                    else:
                        with st.spinner("Salvando inspeção..."):
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
                            st.info(f"Plano de Ação Gerado: {plano_acao}")
                            
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
                                'latitude': manual_latitude if manual_latitude else None,
                                'longitude': manual_longitude if manual_longitude else None
                            }
                            
                            # Adiciona as datas calculadas
                            new_record.update(updated_dates)
                            
                            try:
                                if save_inspection(new_record):
                                    # Salva o local na aba 'locais' se foi informado
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
                                    
                                    # Limpa as coordenadas capturadas do session_state
                                    st.session_state['manual_lat_captured'] = None
                                    st.session_state['manual_lon_captured'] = None
                                    
                                    st.cache_data.clear()
                                    st.rerun()
                            except Exception as e:
                                st.error(f"❌ Erro ao salvar a inspeção: {e}")
                                import traceback
                                st.error(traceback.format_exc())


    
