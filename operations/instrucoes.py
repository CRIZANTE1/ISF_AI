import streamlit as st


def instru_dash():
    """Instruções para o Dashboard"""
    st.header("📖 Guia de Uso - Dashboard")
    st.info("Instruções do Dashboard serão adicionadas em breve.")


def instru_extinguisher():
    """Instruções para Inspeção de Extintores"""
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
        - ✅ Uso em campo com celular ou tablet
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


def instru_scba():
    """Instruções para SCBA"""
    st.header("📖 Guia de Uso - Conjuntos Autônomos (SCBA)")
    st.info("Instruções de SCBA serão adicionadas em breve.")


def instru_multigas():
    """Instruções para Multigás"""
    st.header("📖 Guia de Uso - Detectores Multigás")
    st.info("Instruções de Multigás serão adicionadas em breve.")
