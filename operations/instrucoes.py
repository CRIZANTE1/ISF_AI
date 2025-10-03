import streamlit as st


import streamlit as st

def instru_eyewash():
    """Instruções para o Dashboard de Chuveiros e Lava-Olhos"""
    st.header("📖 Guia de Uso - Sistema de Inspeção de Chuveiros e Lava-Olhos")
    
    # Alerta de importância
    st.info(
        "🚨 **Importante:** Chuveiros e lava-olhos de emergência são equipamentos críticos. Inspeções periódicas são um **requisito normativo** para garantir seu funcionamento em uma emergência."
    )
    
    st.markdown("---")
    
    # Comparação de métodos
    st.subheader("🎯 Métodos Disponíveis de Inspeção")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        ### 📋 Inspeção Completa (Checklist)
        **⚡ RECOMENDADO PARA ROTINA**
        
        **Tempo:** ~3-5 minutos por equipamento
        
        **Ideal para:**
        - ✅ Inspeções periódicas obrigatórias (semanais/mensais)
        - ✅ Auditorias e fiscalizações (NR 20, Bombeiros)
        - ✅ Verificação completa de todos os itens
        - ✅ Documentação detalhada para conformidade
        
        **Como funciona:**
        1. Selecione o equipamento no sistema.
        2. Responda ao checklist completo.
        3. Marque Conforme/Não Conforme/N/A.
        4. Tire fotos se houver não conformidades.
        5. Sistema salva e calcula a próxima inspeção.
        
        **Vantagens:**
        - 📋 Checklist completo e estruturado
        - 🔍 Cobertura total de itens críticos
        - 📸 Registro fotográfico obrigatório para NCs
        - 📅 Cálculo automático de vencimentos
        - 📊 Histórico completo e rastreável
        """)
    
    with col2:
        st.markdown("""
        ### ➕ Cadastro de Equipamento
        **🆕 PARA NOVOS EQUIPAMENTOS**
        
        **Tempo:** ~2 minutos (rápido) ou ~5 minutos (completo)
        
        **Ideal para:**
        - 🆕 Novos equipamentos instalados
        - 📝 Atualização de inventário
        - 🔧 Após substituições ou manutenções
        
        **Dois métodos disponíveis:**
        
        **1. Cadastro Completo:**
        - Todos os dados técnicos
        - Especificações detalhadas
        - Informações de instalação
        - Observações adicionais
        
        **2. Cadastro Rápido:**
        - Apenas dados essenciais
        - ID e localização
        - Tipo e marca comum
        - Ideal para inventário inicial
        
        **Vantagens:**
        - 🚀 Cadastro rápido disponível
        - 📝 Opção completa para detalhes
        - 🏷️ Marcas comuns pré-cadastradas
        - ⚡ Interface intuitiva
        """)
    
    st.markdown("---")
    
    # Fluxo de trabalho recomendado
    st.subheader("🎯 Fluxo de Trabalho Recomendado")
    
    st.info("""
    **Para Máxima Eficiência, Siga Esta Ordem:**
    
    1️⃣ **Primeira Vez no Sistema?**
    → Cadastre todos os equipamentos usando **Cadastro Rápido** ou **Cadastro Completo**.
    
    2️⃣ **Inspeção Periódica Obrigatória?**
    → Use **Realizar Inspeção** com o checklist completo.
    
    3️⃣ **Novos Equipamentos Instalados?**
    → Use **Cadastrar Novo Equipamento** antes de realizar a primeira inspeção.
    """)
    
    st.markdown("---")
    
    # Guia detalhado de inspeção
    st.subheader("📋 Guia Completo: Inspeção com Checklist")
    
    with st.expander("🚀 Passo a Passo Detalhado", expanded=True):
        st.markdown("""
        #### **Antes de Começar:**
        - 📱 Tenha um **celular ou tablet** para tirar fotos se necessário.
        - 🔦 Verifique se há **boa iluminação** no local.
        - 🪣 Tenha um balde ou acesso a um ralo para o teste de ativação.
        - 📊 Tenha acesso ao **histórico do equipamento** (o sistema mostra automaticamente).
        
        ---
        
        #### **Passo 1: Selecione o Equipamento** 🔍
        
        1. Vá para a aba **"📋 Realizar Inspeção"**.
        2. No menu dropdown, selecione o equipamento a ser inspecionado.
        3. O sistema mostrará automaticamente:
           - 📍 **Localização** do equipamento
           - 📊 **Status atual** e última inspeção
           - ⏰ **Data de vencimento** da próxima inspeção
        
        💡 **Dica:** Se o equipamento não aparecer na lista, primeiro cadastre-o nas abas de cadastro.
        
        ---
        
        #### **Passo 2: Responda ao Checklist Completo** ✅
        
        O checklist é baseado em requisitos normativos e está dividido em categorias:
        
        **🔧 1. Condições Físicas do Equipamento**
        - Estrutura sem danos, corrosão ou vazamentos?
        - Pintura e identificação em bom estado?
        - Ausência de obstruções físicas?
        
        **💧 2. Sistema Hidráulico**
        - Válvulas operando corretamente (abertura em 1 segundo)?
        - Conexões sem vazamentos?
        - Pressão da água parece adequada durante o teste?
        
        **🚰 3. Funcionalidade e Testes**
        - Chuveiro aciona e fornece fluxo contínuo?
        - Lava-olhos aciona e os jatos são suaves e simétricos?
        - Tampas protetoras dos bocais (se houver) abrem automaticamente?
        
        **📍 4. Acessibilidade e Sinalização (NR 26)**
        - O caminho até o equipamento está totalmente desobstruído?
        - A sinalização de segurança está visível e em bom estado?
        - O local é bem iluminado?
        - Localizado a no máximo 10 segundos de caminhada do risco?
        
        **Para cada pergunta, marque:**
        - ✅ **Conforme** - Item está OK
        - ❌ **Não Conforme** - Item tem problema
        - ⚠️ **N/A** - Não se aplica a este equipamento
        
        ---
        
        #### **Passo 3: Registre Não Conformidades (Se Houver)** 📸
        
        **Quando marcar algum item como "Não Conforme":**
        
        1. O sistema **automaticamente exigirá** uma foto.
        2. Você verá um aviso: *"Foram encontradas X não conformidades"*.
        3. Use o campo de upload para anexar foto como evidência.
        
        ⚠️ **IMPORTANTE:** Não é possível salvar inspeção com não conformidades SEM foto! Isso é crucial para a rastreabilidade e para comprovar a necessidade de manutenção.
        
        ---
        
        #### **Passo 4: Revise e Salve** 💾
        
        1. Revise todas as respostas do checklist.
        2. Verifique se as fotos (se houver) foram anexadas.
        3. Clique em **"✅ Salvar Inspeção"**.
        4. Aguarde a confirmação de salvamento.
        5. 🎉 Sistema mostrará mensagem de sucesso!
        
        **O sistema automaticamente:**
        - ✅ Calcula a **próxima data de inspeção** (30 dias)
        - 📊 Atualiza o **status do equipamento**
        - 📝 Registra no **histórico completo**
        - 🔔 Gera **alertas** se houver problemas críticos
        """)
    
    st.markdown("---")
    
    # Requisitos legais
    st.subheader("⚖️ Requisitos Legais e Normas")
    
    with st.expander("📜 Normas e Legislação Aplicável", expanded=True):
        st.markdown("""
        #### **Principais Normas e Regulamentações:**
        
        **NR 20 - Segurança e Saúde no Trabalho com Inflamáveis e Combustíveis**
        - **Exigência Legal:** Determina a obrigatoriedade da instalação de chuveiros e lava-olhos em áreas onde trabalhadores possam ser atingidos por produtos químicos ou inflamáveis.
        - **Fiscalização:** O não cumprimento é uma infração grave perante o Ministério do Trabalho.
        
        **ABNT NBR 16291:2014 - Chuveiro e lava-olhos de emergência — Requisitos gerais**
        - **Norma Técnica Brasileira:** Define os requisitos para instalação, desempenho (vazão, pressão), materiais e testes dos equipamentos.
        - **Principais Pontos:** Localização (rota desobstruída), altura de instalação e diâmetro do fluxo de água.
        
        **ANSI/ISEA Z358.1-2014 - Emergency Eyewash and Shower Equipment**
        - **Padrão Internacional de Referência:** É a norma mais completa e utilizada mundialmente, servindo de base para a NBR 16291.
        - **Requisitos Críticos:**
            - ⏱️ **Localização:** A no máximo 10 segundos de caminhada do risco.
            - 🌡️ **Temperatura da Água:** Deve ser "morna" (entre 16°C e 38°C).
            - 💧 **Ativação Semanal:** Recomenda a ativação funcional de todos os equipamentos semanalmente para verificar o fluxo e limpar a tubulação.
            -  yıllık **Inspeção Anual:** Exige uma inspeção completa anual para conformidade total com a norma.

        **NR 26 - Sinalização de Segurança**
        - **Obrigatoriedade:** Exige a sinalização clara da localização dos equipamentos de segurança, incluindo chuveiros e lava-olhos.
        
        **IT do Corpo de Bombeiros (São Paulo e outros estados)**
        - **Fiscalização para AVCB:** Para a obtenção ou renovação do AVCB (Auto de Vistoria do Corpo de Bombeiros) em plantas de risco (especialmente as regidas pela NR 20), o Corpo de Bombeiros verifica a existência, o acesso desobstruído e as condições de funcionamento dos equipamentos de segurança exigidos por outras normas. A falta ou o mau estado podem ser um impeditivo para a liberação do alvará.
        
        ---
        
        #### **Documentação Obrigatória:**
        
        📁 **Este sistema gera automaticamente a documentação necessária para:**
        - ✅ Comprovar as inspeções periódicas em auditorias do Ministério do Trabalho (NR 20).
        - ✅ Evidenciar a manutenção e o bom estado dos equipamentos para o Corpo de Bombeiros.
        - ✅ Manter um histórico detalhado para processos de certificação (ISO 45001, etc.).
        - ✅ Fornecer defesa documentada em caso de acidentes.
        """)
    
    st.markdown("---")
    
    # Critérios de aprovação/reprovação
    st.subheader("🎯 Critérios de Aprovação e Reprovação")
    
    with st.expander("✅ Quando Aprovar um Equipamento"):
        st.markdown("""
        **Um equipamento está APROVADO quando:**
        
        ✅ **Estrutura Física:**
        - Sem danos, corrosão ou desgaste significativo
        - Pintura e identificação legíveis
        - Suportes e fixações firmes
        
        ✅ **Sistema Hidráulico:**
        - Válvulas operam sem esforço excessivo
        - Sem vazamentos visíveis
        - Conexões firmes e sem corrosão
        
        ✅ **Funcionalidade:**
        - Acionamento imediato (< 1 segundo)
        - Fluxo de água adequado
        - Cobertura completa (chuveiro)
        - Jatos centralizados (lava-olhos)
        
        ✅ **Acessibilidade:**
        - Caminho livre de obstáculos
        - Sinalização visível
        - Iluminação adequada
        - Distância conforme norma (< 10 segundos de caminhada)
        """)
    
    with st.expander("❌ Quando Reprovar um Equipamento"):
        st.markdown("""
        **Um equipamento deve ser REPROVADO quando:**
        
        ❌ **Problemas CRÍTICOS (ação imediata):**
        - 🚨 Não há fluxo de água
        - 🚨 Válvula não aciona ou trava
        - 🚨 Vazamento significativo
        - 🚨 Acesso completamente bloqueado
        - 🚨 Estrutura comprometida (risco de queda)
        
        ⚠️ **Problemas GRAVES (correção urgente):**
        - Pressão insuficiente
        - Acionamento difícil ou lento
        - Bocais parcialmente obstruídos
        - Corrosão avançada
        - Sinalização ausente ou ilegível
        
        📋 **Problemas MODERADOS (programar correção):**
        - Pintura descascada (sem corrosão)
        - Tampa protetora danificada
        - Acesso parcialmente obstruído
        - Iluminação deficiente
        - Sinalização desbotada
        
        **IMPORTANTE:** 
        - Equipamento com problema CRÍTICO deve ser **interditado** imediatamente
        - Providencie equipamento **substituto temporário** se necessário
        - Notifique **imediatamente** o responsável pela manutenção
        """)
    
    st.markdown("---")
    
    # Perguntas frequentes
    st.subheader("❓ Perguntas Frequentes")
    
    with st.expander("📅 Com que frequência devo inspecionar?"):
        st.markdown("""
        As normas de referência estabelecem uma rotina clara:
        
        - 🏃 **SEMANALMENTE:** Ativação funcional. É uma verificação rápida para garantir que há fluxo de água e limpar a linha de sedimentos. Embora o sistema peça uma inspeção completa mensal, recomendamos fortemente realizar esta ativação visual toda semana.
        
        - 📋 **MENSALMENTE:** Inspeção visual e funcional registrada. É o que você faz neste sistema. Garante uma verificação documentada de todos os componentes.
        
        -  yıllık **ANUALMENTE:** Inspeção completa de conformidade com a norma (NBR 16291 / ANSI Z358.1), geralmente realizada por equipe técnica qualificada para verificar vazão, temperatura e todos os requisitos de instalação.
        
        O sistema está configurado para um ciclo de **30 dias**, garantindo a conformidade com a inspeção documentada mensal.
        """)
    
    with st.expander("💧 Como testar se o fluxo de água está adequado?"):
        st.markdown("""
        Você não precisa de equipamentos complexos para a inspeção mensal. Use uma avaliação visual baseada nos requisitos das normas:
        
        **Para CHUVEIROS:**
        - **Vazão Mínima:** 75,7 litros/minuto (NBR 16291).
        - **Teste Visual:** Ao acionar, o fluxo deve ser abundante e formar um cone de água que cubra completamente uma pessoa. O centro do cone deve estar a pelo menos 40 cm de qualquer obstrução.
        
        **Para LAVA-OLHOS:**
        - **Vazão Mínima:** 1,5 litros/minuto (NBR 16291).
        - **Teste Visual:** Os jatos de ambos os bocais devem ser suaves, simétricos, formar arcos e ter altura suficiente para lavar ambos os olhos simultaneamente. A água não deve sair com pressão que possa ferir os olhos.
        
        **Duração do Teste:** Para a verificação mensal, acione por tempo suficiente para garantir que a água saia limpa e o fluxo seja constante (geralmente 15-30 segundos). A norma exige que o equipamento seja capaz de fornecer fluxo por **15 minutos contínuos**.
        """)
    
    with st.expander("📸 Preciso tirar foto em TODAS as inspeções?"):
        st.markdown("""
        **NÃO - Apenas quando houver não conformidade.**
        
        **Quando a foto é OBRIGATÓRIA:**
        - ❌ Qualquer item marcado como **"Não Conforme"**
        - 🚨 Para evidenciar o problema encontrado
        - 📋 Obrigatório para auditoria e rastreabilidade
        
        **Quando a foto é OPCIONAL:**
        - ✅ Inspeção 100% conforme
        - ⚠️ Item marcado como N/A
        - 📊 Para documentação adicional (boas práticas)
        
        **Dicas para fotos eficientes:**
        - 🎯 Foque no **problema específico**
        - 📏 Inclua **referência de tamanho** (ex: régua)
        - 🔦 Ilumine bem o local
        - 📐 Tire de **múltiplos ângulos** se necessário
        
        **Resolução recomendada:**
        - 📱 Qualidade média do celular já é suficiente
        - 💾 Sistema aceita até 10MB por foto
        - 🖼️ Formatos: JPG, JPEG, PNG
        """)
    
    with st.expander("🔧 O que fazer quando encontro um problema?"):
        st.markdown("""
        **Fluxo de Ação Recomendado:**
        
        **1. Durante a Inspeção:**
        - ✅ Marque como **"Não Conforme"** no checklist
        - 📸 Tire **foto** evidenciando o problema
        - 📝 Descreva em **observações** se necessário
        - 💾 **Salve** a inspeção no sistema
        
        **2. Classificação de Urgência:**
        
        **🚨 CRÍTICO (Ação Imediata - Mesmo Dia):**
        - Sem fluxo de água
        - Válvula travada
        - Acesso totalmente bloqueado
        - Estrutura com risco de queda
        
        **⚠️ URGENTE (Até 7 dias):**
        - Pressão muito baixa
        - Vazamento significativo
        - Acionamento difícil
        - Sinalização ausente
        
        **📋 IMPORTANTE (Até 30 dias):**
        - Pintura danificada
        - Iluminação deficiente
        - Obstrução parcial de acesso
        
        **3. Após a Inspeção:**
        - 🔔 O sistema gera **automaticamente** um plano de ação
        - 📧 Notifique o **responsável pela manutenção**
        - 📊 Acompanhe no **Dashboard** até correção
        - ✅ Faça **nova inspeção** após correção
        
        **4. Registro de Correção:**
        - Use a aba **"Histórico e Logs"** para registrar ações tomadas
        - Anexe foto **após a correção** como evidência
        - Sistema mantém **rastreabilidade completa**
        """)
    
    with st.expander("🆕 Como cadastrar um equipamento novo?"):
        st.markdown("""
        **Você tem DUAS opções de cadastro:**
        
        ---
        
        **🚀 Opção 1: CADASTRO RÁPIDO**
        *(Use para adicionar rapidamente ao inventário)*
        
        1. Vá para aba **"✍️ Cadastro Rápido"**
        2. Preencha apenas:
           - ID do equipamento (ex: CLO-001)
           - Localização (ex: Laboratório - Setor A)
           - Tipo (Chuveiro / Lava-olhos / Combinado)
           - Marca (lista pré-definida ou digite)
        3. Clique em **"Cadastrar Rápido"**
        4. ✅ Pronto! Equipamento já está no sistema
        
        **Tempo:** ~1-2 minutos
        
        ---
        
        **📋 Opção 2: CADASTRO COMPLETO**
        *(Use quando tiver todas as informações técnicas)*
        
        1. Vá para aba **"➕ Cadastrar Novo Equipamento (Completo)"**
        2. Preencha todos os campos:
           - **Básico:** ID e localização (obrigatórios)
           - **Técnico:** Marca, modelo, tamanho
           - **Instalação:** Data de instalação
           - **Especificações:** Pressão, vazão, etc.
           - **Observações:** Informações adicionais
        3. Clique em **"➕ Cadastrar Equipamento Completo"**
        4. ✅ Equipamento cadastrado com todos os detalhes
        
        **Tempo:** ~3-5 minutos
        
        ---
        
        **💡 Qual escolher?**
        
        - 🚀 **Rápido:** Para fazer inventário inicial de muitos equipamentos
        - 📋 **Completo:** Quando tiver projeto/documentação técnica
        - ✏️ **Dica:** Use rápido primeiro, depois edite para completar dados
        
        **Depois de cadastrar:**
        - ✅ Equipamento aparece na lista de inspeções
        - 📊 É incluído nos relatórios e dashboards
        - 🔔 Sistema começa a monitorar vencimentos
        """)
    
    st.markdown("---")
    
    # Call-to-action
    st.success("""
    ### 🚀 Pronto para Começar?
    
    **Siga este checklist rápido:**
    
    ✅ **Já tem equipamentos cadastrados?**
    → Vá para aba **"📋 Realizar Inspeção"**
    
    ❌ **Ainda não tem nenhum equipamento cadastrado?**
    → Comece pela aba **"✍️ Cadastro Rápido"** para adicionar ao inventário
    
    📚 **Dúvidas sobre algum item do checklist?**
    → Revise a seção **"Critérios de Aprovação e Reprovação"** acima
    
    ---
    
    **Lembre-se:** Manter os registros de inspeção em dia é a sua melhor evidência de conformidade com a NR 20 e outras normas de segurança. ⚡
    """)
    
def instru_alarms():
    """Instruções para Sistemas de Alarme de Emergência"""
    st.header("📖 Guia de Uso - Gestão de Sistemas de Alarme de Emergência")

    # Alerta de priorização
    st.success(
        "⚡ **Recomendação:** Para as verificações de rotina, utilize a aba **'📋 Realizar Inspeção'**! "
        "Ela segue um checklist completo, guiado e garante a conformidade com as normas técnicas."
    )

    st.markdown("---")

    # Comparação de métodos
    st.subheader("🎯 Escolha o Melhor Método para Sua Situação")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("""
        ### 📋 Realizar Inspeção
        **⚡ PARA USO REGULAR - RECOMENDADA**

        **Tempo:** ~5-10 minutos por sistema

        **Ideal para:**
        - ✅ Inspeções semanais/periódicas obrigatórias
        - ✅ Verificações de conformidade
        - ✅ Geração de histórico e rastreabilidade
        - ✅ Checklist completo e guiado

        **Como funciona:**
        1. Selecione o sistema de alarme da lista
        2. Responda ao checklist de verificação
        3. Se houver não conformidade, anexe uma foto
        4. O sistema gera status e salva a inspeção

        **O que inclui:**
        - 🔍 Inspeção de componentes físicos (painel, fiação)
        - 🔊 Testes de funcionamento (sirenes, luzes)
        - 🔥 Verificação de sensores e detectores
        - 📋 Análise de documentação e sinalização

        **Vantagens:**
        - ⚡ Rápida e eficiente
        - 📋 Checklist guiado e padronizado
        - 📸 Exigência de evidência para falhas
        - 📊 Rastreabilidade completa
        """)

    with col2:
        st.markdown("""
        ### ➕ Cadastro Completo
        **📋 PARA EQUIPAMENTOS NOVOS**

        **Tempo:** ~5 minutos

        **Ideal para:**
        - 🆕 Sistemas recém-instalados
        - 📝 Documentação técnica detalhada
        - 🔧 Registro de marca, modelo e especificações
        - 📊 Gestão completa do inventário

        **Como funciona:**
        1. Preencha o ID único do sistema (ex: AL-01)
        2. Informe a localização detalhada
        3. Adicione marca, modelo e data de instalação
        4. Insira especificações como tipo e área de cobertura

        **Vantagens:**
        - 📋 Documentação completa
        - 🔧 Registro de especificações técnicas
        - 📊 Base para um histórico detalhado
        - ✅ Facilita futuras manutenções
        """)

    with col3:
        st.markdown("""
        ### ✍️ Cadastro Rápido
        **🚀 PARA ADICIONAR EM LOTE**

        **Tempo:** ~1-2 minutos

        **Ideal para:**
        - 🆕 Adicionar múltiplos sistemas rapidamente
        - ⚡ Criar um inventário inicial
        - 📝 Apenas informações essenciais
        - 🔄 Atualizar com detalhes depois

        **Como funciona:**
        1. Insira o ID do sistema
        2. Informe a localização
        3. Selecione o tipo de sistema
        4. Escolha a marca de uma lista (ou digite)

        **Vantagens:**
        - ⚡ Extremamente rápido
        - 📝 Apenas dados essenciais
        - 🔧 Marcas pré-cadastradas
        - ✏️ Permite completar os detalhes posteriormente
        """)

    st.markdown("---")

    # Fluxo de trabalho recomendado
    st.subheader("🎯 Fluxo de Trabalho Recomendado")

    st.info("""
    **Para Máxima Eficiência, Siga Esta Ordem:**

    1️⃣ **Primeira Vez no Sistema?**
    → Cadastre todos os seus sistemas de alarme usando o **Cadastro Rápido** ou **Cadastro Completo**.

    2️⃣ **Inspeção Periódica?**
    → Vá para **"📋 Realizar Inspeção"** e siga o checklist para cada sistema.

    3️⃣ **Precisa de um Relatório para Auditoria?**
    → Na aba de inspeção, use a função **"📄 Gerar Relatório Mensal de Inspeções"** para criar e imprimir um relatório consolidado do mês.
    """)

    st.markdown("---")

    # Guia detalhado de inspeção
    st.subheader("📋 Guia Completo: Realizando uma Inspeção")

    with st.expander("🚀 Passo a Passo Detalhado", expanded=True):
        st.markdown("""
        #### **Antes de Começar:**
        - 📋 Tenha acesso físico ao painel e componentes do sistema de alarme.
        - 🔑 Chaves de acesso ao painel, se necessário.
        - 📱 Celular com câmera para registrar não conformidades.
        - 📊 Acesso ao sistema (computador ou tablet).

        ---

        #### **Passo 1: Selecione o Sistema** 🔍

        1. Vá para a aba **"📋 Realizar Inspeção"**.
        2. Na caixa de seleção, escolha o sistema que você irá inspecionar (identificado pelo seu ID).
        3. O sistema exibirá automaticamente a **Localização**, **Marca** e **Modelo** para confirmação.

        ---

        #### **Passo 2: Responda ao Checklist de Verificação** ✅

        O checklist é dividido em quatro categorias para uma inspeção completa e organizada. Para cada item, marque uma das três opções:

        - ✅ **Conforme** - O item está em perfeitas condições e funcionando como esperado.
        - ❌ **Não Conforme** - Foi encontrado um problema, defeito ou irregularidade.
        - ⚠️ **N/A** - O item não se aplica a este sistema de alarme específico.

        **Categorias do Checklist:**

        **1. Componentes Físicos:**
           - Avalia o estado do painel de controle, fiação, sirenes, luzes e baterias.
           - *Exemplo de item: "Painel de controle sem danos físicos".*

        **2. Funcionamento:**
           - Verifica se o sistema opera corretamente, incluindo testes de sirenes, luzes e comunicação com a central (se houver).
           - *Exemplo de item: "Sirenes funcionam corretamente durante teste".*

        **3. Sensores e Detectores:**
           - Testa a resposta dos detectores (fumaça, calor), acionadores manuais e a cobertura dos sensores no ambiente.
           - *Exemplo de item: "Detectores de fumaça respondem ao teste".*

        **4. Documentação e Sinalização:**
           - Confere se as instruções, planos de evacuação e contatos de emergência estão visíveis, atualizados e corretos.
           - *Exemplo de item: "Plano de evacuação atualizado e visível".*

        💡 **Dica:** Seja criterioso. Marcar "Não Conforme" indica que uma ação corretiva é necessária.

        ---

        #### **Passo 3: Registre Não Conformidades (Se Houver)** 📸

        **Se você marcar QUALQUER item como "Não Conforme":**

        1. O sistema exibirá um aviso: *"Foi encontrada pelo menos uma não conformidade. Por favor, anexe uma foto como evidência."*
        2. O campo para upload de foto se tornará **obrigatório**.
        3. Use a câmera do seu dispositivo para tirar uma foto clara do problema.

        **Boas práticas para fotos:**
        - 🔦 Ilumine bem o problema.
        - 🎯 Foque no componente com defeito.
        - 📏 Mostre o contexto para fácil identificação da localização do problema.

        ⚠️ **IMPORTANTE:** Não é possível salvar uma inspeção com não conformidades **SEM** anexar uma foto. Isso garante a rastreabilidade e a evidência para auditorias.

        ---

        #### **Passo 4: Revise e Salve a Inspeção** 💾

        1. Após preencher todo o checklist e anexar fotos (se necessário), clique no botão **"✅ Salvar Inspeção"**.
        2. O sistema processará as informações e fará o seguinte automaticamente:
           - **Calcula o Status Geral:**
             - 🟢 Tudo "Conforme" → Status **"Aprovado"**.
             - 🔴 Pelo menos um "Não Conforme" → Status **"Reprovado com Pendências"**.
           - **Gera um Plano de Ação (se houver pendências):** Baseado nos itens não conformes, o sistema sugere ações corretivas.
           - **Calcula a Próxima Inspeção:** A data da próxima inspeção é agendada para **7 dias** após a data atual.
           - **Registra no Histórico:** Todos os dados são salvos para consultas e relatórios futuros.

        🎉 Se a inspeção for salva com sucesso e o status for "Aprovado", uma animação de balões aparecerá como comemoração!

        ---
        """)

    st.markdown("---")

    # Requisitos legais
    st.subheader("⚖️ Requisitos Legais e Normas")

    with st.expander("📜 Normas e Legislação Aplicável"):
        st.markdown("""
        A inspeção e manutenção de sistemas de alarme de incêndio são regidas por normas técnicas rigorosas para garantir sua eficácia.

        #### **Principais Normas:**

        **ABNT NBR 17240 - Sistemas de detecção e alarme de incêndio – Projeto, instalação, comissionamento e manutenção de sistemas de detecção e alarme de incêndio**
        - 🇧🇷 É a principal norma brasileira que estabelece os requisitos para todo o ciclo de vida do sistema.
        - ⏰ Define as frequências de testes e inspeções (diárias, mensais, trimestrais, anuais).
        - 🔧 Exige que a manutenção seja realizada por profissionais qualificados.

        **NFPA 72 - National Fire Alarm and Signaling Code**
        - 🇺🇸 A norma internacional mais reconhecida para sistemas de alarme.
        - 📅 Estabelece rotinas de inspeção visual e testes funcionais com periodicidades bem definidas.
        - 📋 Exige a manutenção de registros detalhados de todas as inspeções, testes e manutenções.

        **Instruções Técnicas (IT) do Corpo de Bombeiros:**
        - 🔥 Cada estado brasileiro possui suas próprias ITs, que são de cumprimento obrigatório para a obtenção e renovação do AVCB (Auto de Vistoria do Corpo de Bombeiros).
        - 🚨 Geralmente são baseadas na NBR 17240, mas podem incluir requisitos específicos.

        ---

        #### **Frequências de Inspeção Recomendadas pelas Normas:**

        | Frequência | Atividade | Responsável |
        |------------|-----------|-------------|
        | **Semanal** | Inspeção visual dos painéis para verificar status normal | Equipe Interna (Usuário) |
        | **Mensal** | Teste funcional de baterias e fontes de alimentação | Equipe Interna Qualificada |
        | **Trimestral**| Teste de acionadores manuais e detectores (amostragem) | Equipe Interna Qualificada |
        | **Anual** | Teste completo de todos os dispositivos e componentes | Empresa Especializada |

        💡 **Observação:** O sistema está configurado com uma periodicidade de **7 dias** para a próxima inspeção, incentivando uma verificação visual constante e garantindo um nível de segurança acima do mínimo exigido por norma para inspeções visuais.

        ---
        """)

    st.markdown("---")

    # Critérios de aprovação/reprovação
    st.subheader("🎯 Critérios de Aprovação e Reprovação")

    with st.expander("✅ Quando um Sistema é APROVADO"):
        st.markdown("""
        **Um sistema de alarme é considerado APROVADO quando:**

        ✅ **Todos os itens do checklist** são marcados como **"Conforme"** ou **"N/A"**.
        ✅ **Componentes Físicos:** O painel, fiação, sirenes e luzes estão íntegros, sem danos, corrosão ou obstruções.
        ✅ **Funcionamento:** O painel indica estado "Normal". As sirenes e luzes estroboscópicas são ativadas corretamente durante os testes. A comunicação com a central (se houver) está ativa.
        ✅ **Sensores e Detectores:** Todos os dispositivos respondem adequadamente aos testes e não apresentam danos ou sujeira excessiva.
        ✅ **Documentação:** O plano de evacuação e os contatos de emergência estão atualizados e visíveis.
        """)

    with st.expander("❌ Quando um Sistema é REPROVADO (Com Pendências)"):
        st.markdown("""
        **Um sistema é REPROVADO se pelo menos UM item for marcado como "Não Conforme".**

        ❌ **Problemas CRÍTICOS (Ação Imediata):**
        - 🚨 Painel de controle indicando falha ("Falha", "Fogo", "Avaria") que não pode ser rearmado.
        - 🚨 Sirenes ou luzes estroboscópicas não funcionam durante o teste.
        - 🚨 Detectores de fumaça ou acionadores manuais não respondem ao teste.
        - 🚨 Baterias de backup danificadas ou com vazamento.
        - 🚨 Fiação exposta, rompida ou com sinais de curto-circuito.

        📋 **Problemas MODERADOS (Programar Correção):**
        - Painel com danos físicos que não afetam o funcionamento.
        - Detectores sujos que precisam de limpeza.
        - Plano de evacuação ou contatos de emergência desatualizados.
        - Sinalização de rotas de fuga danificada ou obstruída.

        **IMPORTANTE:**
        - Um sistema com pendências **CRÍTICAS** deve ser sinalizado como **INOPERANTE** e a manutenção deve ser acionada **IMEDIATAMENTE**.
        - Medidas compensatórias (como vigilância por brigadistas) devem ser adotadas até a correção do problema.
        """)

    st.markdown("---")

    # Perguntas frequentes
    st.subheader("❓ Perguntas Frequentes")

    with st.expander("📅 Com que frequência devo usar este sistema para inspecionar?"):
        st.markdown("""
        **O sistema agenda a próxima inspeção para 7 dias após a última realizada.**

        Esta frequência é ideal para **inspeções visuais de rotina**, que garantem a verificação constante do estado do sistema.

        **Recomendação de Rotina:**
        -  weekly **Inspeção via Sistema (Checklist Visual):** Realize semanalmente para garantir que não há falhas aparentes no painel e nos componentes. Isso cria um histórico robusto.
        - monthly **Testes Funcionais:** Conforme a NBR 17240, realize testes mais aprofundados mensalmente ou trimestralmente (como teste de baterias e acionadores).
        - annually **Manutenção por Especialistas:** Pelo menos uma vez por ano, contrate uma empresa especializada para realizar um teste completo em todos os componentes do sistema.
        """)

    with st.expander("📸 Preciso tirar foto em TODAS as inspeções?"):
        st.markdown("""
        **NÃO.**

        A foto é **OBRIGATÓRIA** apenas quando um ou mais itens são marcados como **"Não Conforme"**.

        - ✅ **Inspeção 100% Conforme:** Nenhuma foto é necessária.
        - ❌ **Inspeção com Não Conformidade:** A foto é exigida pelo sistema para servir como evidência clara do problema, facilitando a ação corretiva e servindo como registro para auditorias.
        """)

    with st.expander("🆘 O que fazer quando encontro um problema crítico?"):
        st.markdown("""
        Problemas críticos são aqueles que comprometem a capacidade do sistema de funcionar em uma emergência (ex: sirene não toca, painel em falha geral).

        ### **Protocolo de Ação Imediata:**

        **1. REGISTRE no Sistema:**
           - Marque o item como **"Não Conforme"**.
           - Tire uma foto clara e detalhada do problema.
           - **Salve a inspeção imediatamente** para que fique registrada.

        **2. COMUNIQUE Imediatamente (Verbalmente e por E-mail):**
           - Seu supervisor direto.
           - A equipe de Segurança do Trabalho (SESMT) / Brigada de Incêndio.
           - O responsável pela manutenção.

        **3. SINALIZE o Risco:**
           - Se possível, coloque uma etiqueta ou aviso no painel de controle indicando "SISTEMA EM MANUTENÇÃO / INOPERANTE".

        **4. ACIONE a Manutenção Corretiva:**
           - Abra um chamado de manutenção de **emergência**. Não espere pela rotina normal.

        **5. IMPLEMENTE Medidas Compensatórias:**
           - Aumente as rondas da vigilância ou da brigada na área desprotegida.
           - Disponibilize extintores adicionais na área, se necessário.
           - Avalie a necessidade de paralisar atividades de alto risco até a correção do sistema.

        **Lembre-se:** A omissão diante de uma falha crítica pode ter consequências graves. A documentação no sistema é sua principal evidência de que a falha foi identificada e reportada corretamente.
        """)

    st.markdown("---")

    # Call-to-action
    st.success("""
    ### 🚀 Pronto para Começar?

    **Siga este checklist rápido:**

    ✅ **Já tem sistemas cadastrados?**
    → Vá direto para a aba **"📋 Realizar Inspeção"**.

    ❌ **Ainda não tem sistemas no inventário?**
    → Comece pela aba **"✍️ Cadastro Rápido"** para adicionar os equipamentos essenciais.

    📚 **Dúvidas sobre algum item do checklist?**
    → Revise a seção **"Critérios de Aprovação e Reprovação"** acima.

    ---

    **Lembre-se:**
    - Inspeções **SEMANAIS** criam um histórico robusto e confiável.
    - O registro fotográfico de falhas é **ESSENCIAL** para auditorias.
    - Um sistema de alarme bem mantido salva vidas e patrimônio.

    Este sistema foi projetado para facilitar a conformidade e manter sua documentação sempre organizada e acessível! ⚡
    """)

    # Footer informativo
    st.markdown("---")
    st.caption("""
    📌 **Normas de Referência:**
    - ABNT NBR 17240 (Sistemas de detecção e alarme de incêndio)
    - NFPA 72 (National Fire Alarm and Signaling Code)
    - Instruções Técnicas (IT) do Corpo de Bombeiros local.

    🔄 **Última Atualização das Instruções:** Janeiro/2025
    📖 **Versão do Guia:** 1.0
    """)
def instru_foam_chamber():
    """Instruções para Câmaras de Espuma"""
    st.header("📖 Guia de Uso - Sistema de Câmaras de Espuma")

    # Alerta de priorização
    st.success(
        "⚡ **Recomendação:** Para inspeções regulares, use a **Inspeção Visual Periódica**! "
        "É completa, guiada por modelo e garante conformidade com as normas técnicas."
    )

    st.markdown("---")

    # Comparação de métodos
    st.subheader("🎯 Escolha o Melhor Método para Sua Situação")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("""
        ### 📋 Inspeção Visual/Funcional
        **⚡ PARA USO REGULAR - RECOMENDADA**

        **Tempo:** ~10-15 minutos por câmara

        **Ideal para:**
        - ✅ Inspeções semestrais obrigatórias
        - ✅ Testes funcionais anuais
        - ✅ Verificações de conformidade
        - ✅ Checklist guiado por modelo

        **Como funciona:**
        1. Selecione a câmara da lista
        2. Escolha tipo: Visual ou Funcional
        3. Responda checklist específico do modelo
        4. Tire foto se houver não conformidade
        5. Sistema gera plano de ação automaticamente

        **O que inclui:**
        - 🔍 Inspeção de estrutura e pintura
        - 🔧 Verificação de componentes internos
        - 💧 Verificação de válvulas e conexões
        - 🧪 Teste funcional (se anual)
        - 📋 Checklist completo guiado

        **Vantagens:**
        - ⚡ Rápida e eficiente
        - 📋 Guiada por modelo específico
        - 🤖 Plano de ação automático
        - 📊 Rastreabilidade completa
        - ✅ Verifica compatibilidade de placa de orifício
        """)

    with col2:
        st.markdown("""
        ### ➕ Cadastro Completo
        **📋 PARA EQUIPAMENTOS NOVOS**

        **Tempo:** ~5 minutos

        **Ideal para:**
        - 🆕 Câmaras recém-instaladas
        - 📝 Documentação detalhada
        - 🔧 Especificações técnicas completas
        - 📊 Gestão de inventário

        **Como funciona:**
        1. Preencha ID único da câmara
        2. Informe localização detalhada
        3. Selecione modelo (MCS/TF/MLS)
        4. **CRÍTICO:** Informe tamanho específico
        5. Adicione marca e observações

        **Campos obrigatórios:**
        - 🏷️ ID da câmara
        - 📍 Localização
        - 🔧 Modelo (MCS/TF/MLS)
        - 📏 **Tamanho específico** (ex: MCS-17)

        **Vantagens:**
        - 📋 Documentação completa
        - 🔧 Especificações técnicas
        - 📊 Histórico desde instalação
        - ✅ Base para inspeções futuras
        """)

    with col3:
        st.markdown("""
        ### ✍️ Cadastro Rápido
        **🚀 PARA ADICIONAR RAPIDAMENTE**

        **Tempo:** ~2 minutos

        **Ideal para:**
        - 🆕 Adicionar múltiplas câmaras
        - ⚡ Inventário inicial rápido
        - 📝 Dados essenciais apenas
        - 🔄 Atualizar depois com detalhes

        **Como funciona:**
        1. ID da câmara
        2. Localização
        3. Tipo (3 opções pré-definidas)
        4. **Tamanho específico**
        5. Marca (lista pré-definida)

        **Vantagens:**
        - ⚡ Extremamente rápido
        - 📝 Apenas dados essenciais
        - 🔧 Marcas pré-cadastradas
        - ✏️ Pode completar depois
        """)

    st.markdown("---")

    # Fluxo de trabalho recomendado
    st.subheader("🎯 Fluxo de Trabalho Recomendado")

    st.info("""
    **Para Máxima Eficiência, Siga Esta Ordem:**

    1️⃣ **Primeira Vez no Sistema?**
    → Cadastre todas as câmaras usando **Cadastro Rápido** ou **Cadastro Completo**

    2️⃣ **Inspeção Semestral Obrigatória?**
    → Use **Inspeção Visual Periódica** com o checklist guiado

    3️⃣ **Inspeção Funcional Anual?**
    → Use **Inspeção Funcional Anual** (inclui teste funcional completo)

    4️⃣ **Relatório para Auditoria?**
    → Gere **Relatório Consolidado em PDF** na última aba
    """)

    st.markdown("---")

    # Guia detalhado de inspeção
    st.subheader("📋 Guia Completo: Inspeção Visual e Funcional")

    with st.expander("🚀 Passo a Passo Detalhado", expanded=True):
        st.markdown("""
        #### **Antes de Começar:**
        - 📋 Tenha acesso físico à câmara de espuma
        - 🔧 Ferramentas básicas para abrir/fechar câmara
        - 📱 Celular para tirar fotos se necessário
        - 🧰 Kit de limpeza (se necessário)
        - 📊 Acesso ao sistema (computador ou tablet)

        ---

        #### **Passo 1: Selecione a Câmara** 🔍

        1. Vá para aba **"📋 Realizar Inspeção"**
        2. No dropdown, selecione a câmara a ser inspecionada
        3. O sistema mostrará automaticamente:
           - 📍 **Localização** da câmara
           - 🔧 **Modelo** (MCS/TF/MLS)
           - 📏 **Tamanho específico** cadastrado

        ⚠️ **ATENÇÃO:** Se o tamanho específico não estiver cadastrado, aparecerá um alerta amarelo.
        Neste caso, você não poderá verificar a compatibilidade da placa de orifício durante a inspeção.

        💡 **Dica:** Se o tamanho não estiver cadastrado, atualize o cadastro primeiro antes de inspecionar.

        ---

        #### **Passo 2: Escolha o Tipo de Inspeção** 📅

        **Visual Semestral:**
        - 📅 Obrigatória a cada **6 meses**
        - ⏱️ Tempo: ~10 minutos
        - 🔍 Verificação externa e componentes visíveis
        - 📋 Checklist sem teste funcional

        **Funcional Anual:**
        - 📅 Obrigatória **anualmente**
        - ⏱️ Tempo: ~15-20 minutos
        - 🔍 Inclui TUDO da visual + teste funcional
        - 💧 Teste de fluxo de água/espuma
        - 📋 Checklist completo

        💡 **Quando fazer cada uma:**
        - **Semestral:** Meses 1, 7 do ano
        - **Anual:** Substituir uma das semestrais por funcional

        ---

        #### **Passo 3: Responda ao Checklist Específico do Modelo** ✅

        O checklist é **automaticamente gerado** baseado no modelo da câmara:

        **📋 Para MCS - Selo de Vidro:**

        **1. Condições Gerais**
        - Pintura e estrutura sem corrosão?
        - Sem vazamentos visíveis?
        - Válvulas em bom estado?

        **2. Componentes da Câmara**
        - Câmara de espuma íntegra?
        - Selo de vidro limpo e íntegro?
        - Junta de vedação em boas condições?
        - Defletor e barragem íntegros?

        **3. Linhas e Conexões**
        - Tomadas de solução sem obstrução?
        - Drenos livres e estanques?
        - Ejetores desobstruídos?
        - Placa de orifício íntegra?
        - ✅ **NOVO:** Placa compatível com modelo?

        **4. Teste Funcional (apenas anual)**
        - Fluxo de água/espuma OK?
        - Estanqueidade da linha?
        - Sistema funciona corretamente?

        ---

        **📋 Para TF - Tubo de Filme:**

        Similar ao MCS, mas substitui:
        - Selo de vidro → Tubo de projeção
        - Junta de vedação → Defletor de projeção

        ---

        **📋 Para MLS - Membrana Low Shear:**

        Similar ao MCS, mas substitui:
        - Selo de vidro → Membrana de elastômero
        - Verifica ressecamento da membrana

        ---

        #### **Para Cada Item do Checklist:**

        Marque uma das 3 opções:
        - ✅ **Conforme** - Item está OK
        - ❌ **Não Conforme** - Item tem problema
        - ⚠️ **N/A** - Não se aplica (ex: se não tiver)

        💡 **Dica:** Seja criterioso - **Não Conforme** significa que há um problema real que precisa correção.

        ---

        #### **Passo 4: Registre Não Conformidades (Se Houver)** 📸

        **Quando marcar algum item como "Não Conforme":**

        1. O sistema **automaticamente exigirá** uma foto
        2. Você verá um aviso: *"Foi encontrada não conformidade"*
        3. Use o campo de upload para anexar foto como evidência

        **Opções de foto:**
        - 📷 **Tirar foto na hora** (mais rápido)
        - 📁 **Enviar da galeria** (melhor qualidade)

        **Boas práticas para fotos:**
        - 🔦 Ilumine bem o problema
        - 📏 Mostre contexto (onde fica)
        - 🎯 Foque no item não conforme
        - 📐 Mostre detalhes (corrosão, trinca, etc.)

        ⚠️ **IMPORTANTE:** Não é possível salvar inspeção com não conformidades SEM foto!

        ---

        #### **Passo 5: Sistema Gera Plano de Ação Automaticamente** 🤖

        Ao salvar, o sistema **automaticamente:**

        1. **Calcula o status geral:**
           - 🟢 Tudo Conforme → **Aprovado**
           - 🔴 Algo Não Conforme → **Reprovado com Pendências**

        2. **Gera plano de ação específico:**

        Exemplos de planos automáticos:

        **Se: Pintura e estrutura com corrosão**
        → *"Programar serviço de tratamento de corrosão, reparo e repintura."*

        **Se: Selo de vidro trincado**
        → *"Realizar a limpeza ou substituição do selo de vidro."*

        **Se: Placa de orifício incompatível**
        → *"CRÍTICO: Substituir por placa compatível. A placa incorreta compromete vazão e eficiência."*

        **Se: Vazamento nas conexões**
        → *"Substituir juntas/vedações ou reparar a conexão."*

        3. **Calcula próxima inspeção:**
        - Visual Semestral → +6 meses
        - Funcional Anual → +12 meses

        ---

        #### **Passo 6: Revise e Salve** 💾

        1. Revise todas as respostas
        2. Confirme que fotos (se houver) foram anexadas
        3. Clique em **"✅ Salvar Inspeção"**
        4. 🎉 Sistema confirma salvamento!

        **O sistema automaticamente:**
        - ✅ Registra no histórico
        - 📅 Agenda próxima inspeção
        - 🚨 Gera alertas se crítico
        - 📊 Atualiza Dashboard

        ---

        #### **⚡ Dicas para Inspeções Mais Eficientes:**

        **Preparação:**
        - 📋 Imprima lista de todas as câmaras
        - 🗺️ Planeje rota lógica (por área)
        - 🔋 Celular com bateria suficiente
        - 🧰 Kit de ferramentas básico

        **Durante a inspeção:**
        - 🔍 Faça inspeção visual completa antes de abrir
        - 📸 Tire fotos ANTES de corrigir problemas simples
        - 📝 Seja específico nas não conformidades
        - 🧹 Aproveite para limpar se necessário

        **Após a inspeção:**
        - 🔧 Corrija imediatamente problemas simples
        - 🚨 Reporte URGENTEMENTE problemas críticos
        - 📊 Revise relatório no sistema
        - 📅 Programe correções necessárias

        ---

        #### **❓ Problemas Comuns e Soluções:**

        **"Câmara não aparece na lista"**
        - ✅ Cadastre nas abas de cadastro primeiro
        - ✅ Confirme se está no ambiente correto

        **"Não sei qual é o tamanho específico"**
        - ✅ Verifique placa de identificação na câmara
        - ✅ Consulte projeto de instalação
        - ✅ Entre em contato com fabricante

        **"Como sei se a placa de orifício está correta?"**
        - ✅ Compare com especificação do fabricante
        - ✅ Verifique projeto original
        - ✅ Consulte manual da câmara

        **"Foto não anexa / Upload falha"**
        - ✅ Reduza tamanho da foto (<10MB)
        - ✅ Use formato JPG ou PNG
        - ✅ Verifique conexão internet

        **"Inspeção não salva"**
        - ✅ Responda TODAS as perguntas
        - ✅ Anexe foto se houver NC
        - ✅ Verifique conexão
        - ✅ Tente novamente após alguns segundos
        """)

    st.markdown("---")

    # Tipos de câmaras
    st.subheader("🔧 Entendendo os Tipos de Câmaras de Espuma")

    with st.expander("📚 Guia Completo dos Modelos"):
        st.markdown("""
        ### **MCS - Membrana Com Selo de Vidro**

        **Como funciona:**
        - Solução entra pela base
        - Passa pelo selo de vidro
        - Defletor gera a espuma
        - Barragem distribui uniformemente

        **Componentes críticos:**
        - 🔴 **Selo de vidro** - Deve estar limpo e íntegro
        - 🔧 **Junta de vedação** - Não pode estar ressecada
        - 📏 **Defletor** - Essencial para qualidade da espuma
        - 📊 **Barragem** - Distribui espuma uniformemente

        **Principais problemas:**
        - Selo de vidro sujo/trincado
        - Junta ressecada
        - Defletor danificado
        - Placa de orifício incompatível

        **Manutenção típica:**
        - Limpeza semestral do selo
        - Substituição de juntas (a cada 2-3 anos)
        - Verificação de corrosão

        ---

        ### **TF - Tubo de Filme (Type II)**

        **Como funciona:**
        - Solução entra em alta velocidade
        - Jato atinge defletor de projeção
        - Forma película fina (filme)
        - Espuma de alta expansão

        **Componentes críticos:**
        - 🔧 **Tubo de projeção** - Não pode ter corrosão interna
        - 📊 **Defletor de projeção** - Deve estar bem fixado
        - 📏 **Placa de orifício** - Define vazão

        **Principais problemas:**
        - Corrosão no tubo interno
        - Defletor desalinhado
        - Obstrução no orifício
        - Placa de orifício errada

        **Manutenção típica:**
        - Inspeção visual do tubo
        - Verificação de alinhamento
        - Limpeza de orifícios

        ---

        ### **MLS - Membrana Low Shear**

        **Como funciona:**
        - Solução entra suavemente
        - Passa por membrana de elastômero
        - Baixo cisalhamento (preserva espuma)
        - Espuma de alta qualidade

        **Componentes críticos:**
        - 🔴 **Membrana de elastômero** - Não pode ressecar
        - 🔧 **Junta de vedação** - Vedação perfeita
        - 📊 **Câmara de espuma** - Integridade estrutural
        - 📏 **Defletor/Barragem** - Distribuição uniforme

        **Principais problemas:**
        - Ressecamento da membrana
        - Perda de elasticidade
        - Junta danificada
        - Placa de orifício incompatível

        **Manutenção típica:**
        - Verificação da membrana (elasticidade)
        - Substituição periódica da membrana (5-7 anos)
        - Verificação de vedações

        ---

        ### **📏 Importância do Tamanho Específico**

        **Por que o tamanho é CRÍTICO?**

        1. **Placa de Orifício Correta:**
           - Cada tamanho tem uma placa específica
           - Placa errada = vazão errada
           - Vazão errada = espuma inadequada
           - Espuma inadequada = proteção comprometida

        2. **Compatibilidade de Peças:**
        - Selos de vidro têm tamanhos diferentes
        - Membranas são específicas por modelo
        - Defletores não são universais

        3. **Especificações Técnicas:**
        - Vazão nominal (L/min)
        - Pressão de trabalho (bar)
        - Taxa de aplicação (L/min/m²)
        - Capacidade de descarga

        **Exemplos de tamanhos comuns:**

        **MCS:**
        - MCS-17: 17 GPM (64 L/min)
        - MCS-33: 33 GPM (125 L/min)
        - MCS-50: 50 GPM (189 L/min)

        **TF:**
        - TF-22: 22 GPM (83 L/min)
        - TF-44: 44 GPM (167 L/min)

        **MLS:**
        - MLS-30: 30 GPM (114 L/min)
        - MLS-45: 45 GPM (170 L/min)

        💡 **Como descobrir o tamanho:**
        1. Placa de identificação na câmara
        2. Projeto de instalação original
        3. Manual do fabricante
        4. Consultoria técnica especializada
        """)

    st.markdown("---")

    # Requisitos legais
    st.subheader("⚖️ Requisitos Legais e Normas")

    with st.expander("📜 Normas e Legislação Aplicável"):
        st.markdown("""
        #### **Principais Normas:**

        **NFPA 11 - Standard for Low-, Medium-, and High-Expansion Foam**
        - 📅 Inspeções **semestrais** obrigatórias
        - 🔧 Testes funcionais **anuais**
        - 📋 Documentação obrigatória
        - 🔍 Critérios de aprovação/reprovação

        **NFPA 25 - Standard for the Inspection, Testing, and Maintenance of Water-Based Fire Protection Systems**
        - ⏰ Frequências de inspeção
        - 📊 Procedimentos de teste
        - 📝 Registros obrigatórios

        **NBR 15511 - Sistemas de Espuma**
        - 🏭 Requisitos brasileiros
        - 📋 Compatibilidade de equipamentos
        - 🔧 Manutenção periódica

        **IT 23 (Corpo de Bombeiros - SP)**
        - 🚨 Sistemas de chuveiros automáticos
        - 📍 Aplicação específica para cada risco
        - ⏰ Prazos de adequação

        ---

        #### **Responsabilidades Legais:**

        **Proprietário/Responsável pela Instalação:**
        - ✅ Manter equipamentos em **condições de uso**
        - ✅ Realizar **inspeções periódicas**
        - ✅ Manter **registros documentados**
        - ✅ Corrigir **não conformidades**
        - ✅ Contratar empresa especializada para manutenção

        **Empresa de Manutenção:**
        - ✅ Executar serviços conforme normas
        - ✅ Emitir laudos técnicos
        - ✅ Usar peças originais/homologadas
        - ✅ Responsabilidade técnica (ART/TRT)

        **SESMT/Segurança:**
        - ✅ Supervisionar programa de inspeções
        - ✅ Auditar conformidade
        - ✅ Reportar não conformidades críticas
        - ✅ Manter documentação

        ---

        #### **Frequências Obrigatórias:**

        | Tipo de Inspeção | Frequência | Responsável |
        |-----------------|------------|-------------|
        | Visual | Semestral | Interno |
        | Funcional | Anual | Interno ou Externo |
        | Teste Completo | Anual | Empresa Especializada |
        | Manutenção Preventiva | Anual | Empresa Especializada |
        | Substituição de Componentes | Conforme Vida Útil | Empresa Especializada |

        ---

        #### **Documentação Obrigatória:**

        📁 **Este sistema gera automaticamente:**
        - ✅ Registro de todas as inspeções
        - ✅ Histórico completo de cada câmara
        - ✅ Evidências fotográficas de NC
        - ✅ Relatórios de conformidade
        - ✅ Planos de ação para correções
        - ✅ Rastreabilidade completa

        💡 **Essencial para:**
        - Auditorias internas e externas
        - Fiscalizações do Corpo de Bombeiros
        - Processos de certificação (ISO, etc.)
        - Defesa em processos judiciais
        - Renovação de AVCB/CLCB
        """)

    st.markdown("---")

    # Critérios de aprovação/reprovação
    st.subheader("🎯 Critérios de Aprovação e Reprovação")

    with st.expander("✅ Quando Aprovar uma Câmara"):
        st.markdown("""
        **Uma câmara está APROVADA quando:**

        ✅ **Estrutura Física:**
        - Sem corrosão significativa
        - Pintura em bom estado
        - Suportes firmes e alinhados
        - Identificação legível

        ✅ **Componentes Internos:**
        - Selo/Membrana/Tubo íntegro
        - Juntas de vedação em boas condições
        - Defletor/Barragem sem danos
        - Câmara de espuma sem trincas

        ✅ **Sistema Hidráulico:**
        - Sem vazamentos visíveis
        - Válvulas operando corretamente
        - Conexões firmes
        - Drenos livres e estanques

        ✅ **Linhas e Orifícios:**
        - Tomadas de solução desobstruídas
        - Ejetores limpos
        - **Placa de orifício compatível com modelo**
        - Sem corrosão interna significativa

        ✅ **Teste Funcional (se anual):**
        - Fluxo de água/espuma adequado
        - Linha estanque (sem vazamentos)
        - Sistema funciona conforme especificação
        - Qualidade da espuma adequada
        """)

    with st.expander("❌ Quando Reprovar uma Câmara"):
        st.markdown("""
        **Uma câmara deve ser REPROVADA quando:**

        ❌ **Problemas CRÍTICOS (Interdição Imediata):**
        - 🚨 Estrutura comprometida (risco de colapso)
        - 🚨 Vazamento significativo
        - 🚨 Não há fluxo de espuma
        - 🚨 Placa de orifício completamente incompatível
        - 🚨 Selo/Membrana completamente danificado

        ⚠️ **Problemas GRAVES (Correção Urgente < 7 dias):**
        - Corrosão avançada em componentes críticos
        - Selo de vidro trincado/sujo (MCS)
        - Membrana ressecada/danificada (MLS)
        - Tubo de projeção com corrosão interna (TF)
        - Defletor/Barragem danificado
        - Junta de vedação comprometida
        - Placa de orifício parcialmente obstruída

        📋 **Problemas MODERADOS (Programar Correção < 30 dias):**
        - Pintura descascada (corrosão superficial)
        - Válvulas com operação difícil
        - Drenos parcialmente obstruídos
        - Identificação ilegível
        - Tampa/Cobertura danificada

        **IMPORTANTE:**
        - Câmara com problema CRÍTICO → **INTERDITAR**
        - Providencie **proteção alternativa temporária**
        - Notifique **imediatamente** Corpo de Bombeiros
        - Contrate empresa especializada URGENTE
        """)

    st.markdown("---")

    # Perguntas frequentes
    st.subheader("❓ Perguntas Frequentes")

    with st.expander("📅 Com que frequência devo inspecionar?"):
        st.markdown("""
        **Frequência Obrigatória:**

        - 📋 **Visual Semestral:** A cada 6 meses
        - 🔧 **Funcional Anual:** 1 vez por ano
        - 🚨 **Extraordinária:** Após incidentes

        **Calendário Sugerido:**
    Janeiro     → Visual Semestral
    Julho       → Funcional Anual (substitui visual)

        **Inspeções Extraordinárias:**
        - Após acionamento real (incêndio)
        - Após obras/modificações próximas
        - Após eventos climáticos extremos
        - Se houver suspeita de problema
        - Antes/depois de paradas programadas

        **Manutenção Especializada:**
        - Anual por empresa certificada
        - Substitui ou complementa funcional interna
        - Emite laudo técnico
        """)

    with st.expander("🔧 Como fazer o teste funcional anual?"):
        st.markdown("""
        **Procedimento Completo:**

        **1. Preparação (15 minutos):**
        - Avise área de segurança/bombeiros
        - Desligue alarmes se necessário
        - Prepare recipiente para coletar espuma
        - Separe cronômetro
        - Prepare medidor de vazão (se tiver)

        **2. Teste de Fluxo de Água (5 minutos):**
        - Abra válvula lentamente
        - Verifique se há fluxo
        - Observe vazamentos
        - Cronometre enchimento do recipiente
        - Calcule vazão aproximada

        **3. Teste de Espuma (10 minutos):**
        - Adicione LGE (Líquido Gerador de Espuma)
        - Proporcione conforme especificação (geralmente 3% ou 6%)
        - Observe formação da espuma
        - Verifique qualidade (expansão, drenagem)
        - Confirme cobertura uniforme
        - Teste drenagem de 25% em 2-4 minutos

        **4. Verificação de Estanqueidade (5 minutos):**
        - Inspecione todas as conexões
        - Procure por vazamentos
        - Verifique vedações
        - Teste válvulas de drenagem

        **5. Limpeza e Finalização (10 minutos):**
        - Drene sistema completamente
        - Limpe resíduos de espuma
        - Feche válvulas
        - Reative alarmes
        - Documente resultados

        **Critérios de Aprovação:**
        - ✅ Vazão dentro de ±10% do nominal
        - ✅ Espuma formada adequadamente
        - ✅ Expansão conforme especificação
        - ✅ Drenagem de 25% em 2-4 min
        - ✅ Sem vazamentos
        - ✅ Sistema responde rapidamente

        **⚠️ Quando Reprovar:**
        - ❌ Vazão < 90% do nominal
        - ❌ Espuma não se forma adequadamente
        - ❌ Vazamentos significativos
        - ❌ Drenagem muito rápida ou muito lenta
        - ❌ Sistema não responde

        **💡 Dica Importante:**
        Se não tem experiência em testes funcionais,
        **CONTRATE EMPRESA ESPECIALIZADA**.
        Teste mal feito pode danificar equipamento
        ou dar falso positivo/negativo.
        """)

    with st.expander("🔍 Como saber se a placa de orifício está correta?"):
        st.markdown("""
        ### **Por que a Placa de Orifício é CRÍTICA?**

        A placa de orifício é um componente pequeno, mas **ESSENCIAL**:

        - 📏 Define a **vazão** do sistema
        - 💧 Controla a **pressão** de descarga
        - ☁️ Determina a **qualidade** da espuma
        - 🎯 Garante a **eficiência** da proteção

        **Se a placa estiver ERRADA:**
        - 🚨 Vazão insuficiente = Proteção inadequada
        - 🚨 Vazão excessiva = Dano ao equipamento
        - 🚨 Pressão incorreta = Espuma de má qualidade
        - 🚨 **RESULTADO: Sistema não protege como deveria!**

        ---

        ### **Como Verificar a Compatibilidade:**

        **1. Identificação da Placa:**
        - Procure por marcação gravada
        - Geralmente em GPM ou L/min
        - Pode ter código do fabricante
        - Exemplo: "33 GPM" ou "125 LPM"

        **2. Especificação da Câmara:**
        - Verifique placa de identificação
        - Ex: "MCS-33" = 33 GPM nominal
        - Consulte manual do fabricante
        - Projeto de instalação original

        **3. Comparação:**
    Câmara: MCS-33
    Placa: 33 GPM
    ✅ COMPATÍVEL!

    Câmara: MCS-33
    Placa: 17 GPM
    ❌ INCOMPATÍVEL! (vazão 50% menor)

    Câmara: MCS-33
    Placa: Sem marcação visível
    ⚠️ SUBSTITUIR por segurança

        **4. Verificação Prática (Teste Funcional):**
        - Meça vazão real durante teste
        - Compare com especificação
        - Margem aceitável: ±10%
        - Se fora da margem → Placa errada

        ---

        ### **Tabela de Referência Rápida:**

        | Modelo da Câmara | Vazão Nominal | Placa Correta |
        |------------------|---------------|---------------|
        | MCS-17 | 64 L/min | 17 GPM |
        | MCS-33 | 125 L/min | 33 GPM |
        | MCS-50 | 189 L/min | 50 GPM |
        | TF-22 | 83 L/min | 22 GPM |
        | TF-44 | 167 L/min | 44 GPM |
        | MLS-30 | 114 L/min | 30 GPM |
        | MLS-45 | 170 L/min | 45 GPM |

        **💡 Conversão rápida:** 1 GPM ≈ 3,785 L/min

        ---

        ### **O que Fazer se a Placa Estiver Errada:**

        **CRÍTICO - AÇÃO IMEDIATA:**

        1. ✅ **Reprove a inspeção**
        2. ✅ **Anexe foto** da placa incorreta
        3. ✅ **Notifique** responsável pela manutenção
        4. ✅ **Contrate** empresa especializada
        5. ✅ **Substitua** por placa correta
        6. ✅ **Teste** sistema após substituição
        7. ✅ **Documente** a correção

        **Até a correção:**
        - 🚨 Sistema **NÃO está protegendo adequadamente**
        - 📋 Considere **proteção alternativa temporária**
        - 🔔 **Aumente frequência** de inspeções
        - 📊 **Notifique** Corpo de Bombeiros se exigido

        ---

        ### **Fontes de Informação:**

        **1. Placa de Identificação da Câmara:**
        - Fixada no corpo da câmara
        - Contém modelo e especificações

        **2. Projeto Original:**
        - Memorial de cálculo
        - Especificações técnicas
        - Desenhos de instalação

        **3. Manual do Fabricante:**
        - Especificações por modelo
        - Tabelas de vazão
        - Peças de reposição

        **4. Consultoria Especializada:**
        - Empresas de manutenção certificadas
        - Fabricantes/representantes
        - Engenheiros de proteção contra incêndio
        """)

    with st.expander("🔄 Qual a vida útil dos componentes?"):
        st.markdown("""
        ### **Expectativa de Vida Útil:**

        **Componentes com Desgaste Regular:**

        **Selo de Vidro (MCS):**
        - 🕐 **Vida útil:** 5-10 anos
        - 🔍 **Inspecionar:** Semestralmente
        - 🔧 **Trocar se:** Trincado, sujo irremovível, riscado
        - 💡 **Dica:** Limpe regularmente para prolongar vida

        **Membrana de Elastômero (MLS):**
        - 🕐 **Vida útil:** 5-7 anos
        - 🔍 **Inspecionar:** Semestralmente
        - 🔧 **Trocar se:** Ressecada, perdeu elasticidade, rasgada
        - 💡 **Dica:** Vida útil varia com clima/temperatura

        **Juntas de Vedação:**
        - 🕐 **Vida útil:** 2-5 anos
        - 🔍 **Inspecionar:** Semestralmente
        - 🔧 **Trocar se:** Ressecada, endurecida, vazando
        - 💡 **Dica:** Sempre troque ao abrir a câmara

        **Tubo de Projeção (TF):**
        - 🕐 **Vida útil:** 10-15 anos
        - 🔍 **Inspecionar:** Anualmente (interno)
        - 🔧 **Trocar se:** Corrosão interna significativa
        - 💡 **Dica:** Qualidade da água afeta vida útil

        **Defletor/Barragem:**
        - 🕐 **Vida útil:** 10-20 anos
        - 🔍 **Inspecionar:** Anualmente
        - 🔧 **Trocar se:** Deformado, corroído, danificado
        - 💡 **Dica:** Raramente precisa troca completa

        **Válvulas:**
        - 🕐 **Vida útil:** 10-15 anos
        - 🔍 **Inspecionar:** Semestralmente
        - 🔧 **Trocar se:** Travando, vazando, corroída
        - 💡 **Dica:** Manutenção preventiva prolonga vida

        **Estrutura/Corpo da Câmara:**
        - 🕐 **Vida útil:** 20-30 anos
        - 🔍 **Inspecionar:** Anualmente (estrutural)
        - 🔧 **Trocar se:** Corrosão estrutural, trincas
        - 💡 **Dica:** Pintura adequada prolonga muito

        **Placa de Orifício:**
        - 🕐 **Vida útil:** Indefinida se mantida
        - 🔍 **Inspecionar:** Anualmente
        - 🔧 **Trocar se:** Deformada, obstruída, errada
        - 💡 **Dica:** Limpeza regular é essencial

        ---

        ### **Fatores que Afetam Vida Útil:**

        **Reduzem a Vida Útil:**
        - ❌ Ambiente corrosivo (marítimo, químico)
        - ❌ Temperaturas extremas
        - ❌ Falta de manutenção
        - ❌ Qualidade de água ruim
        - ❌ Exposição a intempéries
        - ❌ Uso de peças não originais

        **Prolongam a Vida Útil:**
        - ✅ Manutenção preventiva regular
        - ✅ Pintura de proteção adequada
        - ✅ Ambiente controlado
        - ✅ Tratamento de água
        - ✅ Inspeções frequentes
        - ✅ Uso de peças originais

        ---

        ### **Programa de Substituição Recomendado:**

        **A cada 2 anos:**
        - Juntas de vedação (preventivo)
        - Lubrificação de válvulas

        **A cada 5 anos:**
        - Selo de vidro (MCS)
        - Membrana (MLS)
        - Revisão completa de válvulas

        **A cada 10 anos:**
        - Tubo de projeção (se corrosão)
        - Defletor/Barragem (se desgastado)
        - Repintura completa

        **A cada 15-20 anos:**
        - Considerar substituição completa
        - Avaliar custo x benefício
        - Verificar disponibilidade de peças

        **💡 Importante:**
        Estes são valores **médios/recomendados**.
        A vida útil real depende de:
        - Condições de operação
        - Qualidade da manutenção
        - Ambiente de instalação
        - Frequência de acionamento

        **Sempre consulte fabricante para recomendações específicas!**
        """)

    with st.expander("📸 Preciso tirar foto em TODAS as inspeções?"):
        st.markdown("""
        **NÃO - Apenas quando houver não conformidade.**

        **Quando a foto é OBRIGATÓRIA:**
        - ❌ Qualquer item marcado como **"Não Conforme"**
        - 🚨 Para evidenciar o problema encontrado
        - 📋 Obrigatório para auditoria e rastreabilidade
        - ⚖️ Essencial para defesa legal

        **Quando a foto é OPCIONAL:**
        - ✅ Inspeção 100% conforme
        - ⚠️ Item marcado como N/A
        - 📊 Para documentação adicional

        **Quando a foto é RECOMENDADA (mas não obrigatória):**
        - 📍 Estado geral da câmara
        - 🔧 Após manutenção/substituição de peças
        - 📋 Placa de identificação (documentação)
        - 🏷️ Número de série de componentes novos

        ---

        ### **Dicas para Fotos Eficientes:**

        **Composição:**
        - 🎯 Foque no **problema específico**
        - 📏 Inclua **referência de tamanho** (régua, caneta)
        - 🔦 **Ilumine bem** o local
        - 📐 Tire de **múltiplos ângulos** se necessário
        - 🏷️ Inclua placa de identificação quando possível

        **Qualidade:**
        - 📱 Qualidade média do celular já é suficiente
        - 💾 Sistema aceita até 10MB por foto
        - 🖼️ Formatos: JPG, JPEG, PNG
        - 🔍 Foque bem antes de tirar
        - ☀️ Evite contraluz

        **O que Fotografar:**

        **Para Corrosão:**
        - Vista geral mostrando extensão
        - Close-up da área afetada
        - Detalhe da profundidade

        **Para Trincas/Danos:**
        - Vista geral da peça
        - Close-up da trinca/dano
        - Régua ao lado para dimensão

        **Para Vazamentos:**
        - Ponto de vazamento
        - Área molhada/manchada
        - Conexão/junta afetada

        **Para Sujeira/Obstrução:**
        - Estado atual
        - Componente afetado
        - Comparação com área limpa (se possível)

        **Para Incompatibilidade:**
        - Placa de identificação da câmara
        - Marcação da placa de orifício
        - Ambas juntas se possível

        ---

        ### **Erros Comuns a Evitar:**

        ❌ **Foto muito escura**
        → Use flash ou lanterna

        ❌ **Foto tremida/desfocada**
        → Apoie o celular, respire fundo

        ❌ **Foto muito longe**
        → Aproxime-se do problema

        ❌ **Foto sem contexto**
        → Mostre onde fica o problema

        ❌ **Foto de ângulo ruim**
        → Posicione-se adequadamente

        ---

        ### **Armazenamento e Segurança:**

        **Sistema ISF IA:**
        - ✅ Fotos salvas no Google Drive
        - ✅ Backup automático
        - ✅ Vinculadas à inspeção
        - ✅ Acesso controlado
        - ✅ Mantidas permanentemente

        **Recomendações:**
        - 📱 Tire backup local também
        - 📁 Organize por câmara/data
        - 🔒 Não compartilhe publicamente
        - 📋 Mantenha por 5+ anos
        """)

    with st.expander("🆘 O que fazer quando encontro um problema crítico?"):
        st.markdown("""
        ### **Definição de Problema CRÍTICO:**

        🚨 **É CRÍTICO quando:**
        - Estrutura com risco de colapso
        - Vazamento significativo incontrolável
        - Sistema não funciona (sem fluxo)
        - Placa de orifício completamente incompatível
        - Componente essencial totalmente danificado
        - Risco imediato à segurança

        **EM RESUMO:** Se o sistema **NÃO protegeria** em caso de incêndio → É CRÍTICO

        ---

        ### **AÇÃO IMEDIATA (Primeiros 30 minutos):**

        **1. INTERROMPA a inspeção** 🛑
        - Não continue com outras câmaras
        - Foque na situação crítica

        **2. DOCUMENTE o problema** 📸
        - Tire múltiplas fotos
        - Anote detalhes
        - Registre no sistema (marque como NC)

        **3. AVISE imediatamente:** 📞
        - ✅ Seu supervisor direto
        - ✅ Responsável pela segurança (SESMT)
        - ✅ Gerente da área protegida
        - ✅ Corpo de Bombeiros (se legalmente exigido)

        **4. SINALIZE o equipamento** ⚠️
        - Coloque placa: "EQUIPAMENTO COM DEFEITO"
        - Isole área se necessário
        - Impeça uso/acionamento

        ---

        ### **CURTO PRAZO (Mesmo Dia):**

        **5. AVALIE alternativas temporárias** 🔄

        **Opções possíveis:**
        - Extintores portáteis adicionais na área
        - Brigada de incêndio em alerta
        - Vigia de incêndio (ronda constante)
        - Restrição de atividades de risco
        - Isolamento de área crítica

        **6. CONTATE empresa especializada** 🔧
        - Empresa de manutenção certificada
        - Solicite visita URGENTE
        - Explique a criticidade
        - Peça prazo de atendimento

        **7. NOTIFIQUE autoridades** 📋
        - Corpo de Bombeiros (se exigido por lei)
        - Informe situação e prazo de correção
        - Documente a notificação

        ---

        ### **MÉDIO PRAZO (Até Correção):**

        **8. ACOMPANHE a correção** 👁️
        - Cobre prazos da empresa
        - Solicite cronograma detalhado
        - Exija uso de peças originais
        - Peça ART/TRT do serviço

        **9. MANTENHA medidas temporárias** ⚠️
        - Até sistema ser testado e aprovado
        - Não remova proteções alternativas prematuramente

        **10. TESTE após correção** ✅
        - Realize teste funcional completo
        - Não confie apenas no laudo da empresa
        - Documente que sistema voltou a funcionar

        ---

        ### **Exemplos de Problemas CRÍTICOS:**

        **Problema: Câmara trincada, vazando constantemente**

        **Ações:**
        1. ✅ Foto detalhada da trinca
        2. ✅ Avisar SESMT/supervisor
        3. ✅ Placa "NÃO FUNCIONA"
        4. ✅ 10 extintores portáteis na área
        5. ✅ Contatar fabricante/manutenção
        6. ✅ Notificar Bombeiros
        7. ✅ Prazo máximo: 48h para solução

        ---

        **Problema: Placa de orifício 50% menor que deveria**

        **Ações:**
        1. ✅ Foto da placa errada
        2. ✅ Avisar gerência imediatamente
        3. ✅ Solicitar substituição urgente
        4. ✅ Placa correta: < 24h
        5. ✅ Testar vazão após troca
        6. ✅ Documentar correção

        ---

        **Problema: Selo de vidro completamente destruído**

        **Ações:**
        1. ✅ Foto dos cacos
        2. ✅ Verificar se há reposição em estoque
        3. ✅ Se não houver: medidas temporárias
        4. ✅ Comprar selo original urgente
        5. ✅ Instalação por técnico habilitado
        6. ✅ Teste completo após instalação

        ---

        ### **Responsabilidades Legais:**

        ⚖️ **IMPORTANTE:**
        - Ignorar problema crítico = **Negligência**
        - Não comunicar = **Omissão**
        - Não corrigir rapidamente = **Imprudência**
        - Sistema inoperante em incêndio = **Responsabilização**

        **Documentar TUDO:**
        - Data/hora da descoberta
        - Quem foi avisado e quando
        - Medidas tomadas
        - Prazos de correção
        - Comprovantes de notificações

        **Esta documentação pode te proteger legalmente!**

        ---

        ### **Checklist de Ação em Emergência:**
    ☐ Problema identificado e documentado
    ☐ Fotos tiradas (múltiplos ângulos)
    ☐ Supervisor avisado
    ☐ SESMT avisado
    ☐ Gerente da área avisado
    ☐ Equipamento sinalizado
    ☐ Medidas temporárias implementadas
    ☐ Empresa de manutenção contatada
    ☐ Prazo de correção definido
    ☐ Bombeiros notificados (se exigido)
    ☐ Correção acompanhada
    ☐ Teste realizado após correção
    ☐ Sistema aprovado e liberado
    ☐ Documentação completa arquivada

        **💡 Lembre-se:**
        Câmara de espuma crítica inoperante =
        **RISCO DE VIDA** + **RISCO PATRIMONIAL** + **RESPONSABILIDADE LEGAL**

        **NÃO HESITE EM INTERDITAR E TOMAR MEDIDAS DRÁSTICAS!**
        """)

    st.markdown("---")

    # Relatório consolidado
    st.subheader("📊 Gerando Relatório Consolidado")

    with st.expander("📄 Como Usar o Relatório PDF"):
        st.markdown("""
        ### **O que é o Relatório Consolidado?**

        É um documento PDF profissional que **consolida TODAS as câmaras**
        inspecionadas, com formato pronto para impressão e apresentação em auditorias.

        ---

        ### **O que o Relatório Inclui:**

        **1. Resumo Geral (Primeira Página):**
        - 📊 Total de câmaras no sistema
        - ✅ Quantidade aprovadas
        - ❌ Quantidade com pendências
        - 📈 Estatísticas gerais

        **2. Para Cada Câmara:**

        **Cabeçalho Individual:**
        - 🏷️ ID da câmara
        - 📍 Localização
        - 🔧 Modelo e tamanho
        - 🏭 Marca
        - 📅 Data da última inspeção
        - 📅 Próxima inspeção prevista
        - ✅/❌ Status geral (colorido)

        **Dados Técnicos:**
        - Tipo de inspeção (Visual/Funcional)
        - Inspetor responsável
        - Data de realização

        **Checklist Completo:**
        - ✓ Todos os itens verificados
        - ✓ Resultado de cada item
        - ✓ Identificação visual de NCs
        - ✓ Tabela formatada e legível

        **Plano de Ação:**
        - 📋 Ações corretivas geradas automaticamente
        - 🎯 Específicas para cada problema
        - 📝 Orientações técnicas

        **Evidências:**
        - 📸 Link para fotos de não conformidades
        - 🔗 Acesso direto ao Google Drive

        ---

        ### **Como Gerar o Relatório:**

        **Passo 1:** Vá para aba **"📊 Relatório Consolidado"**

        **Passo 2:** Revise as estatísticas mostradas na tela
        - Total de câmaras
        - Total de inspeções
        - Aprovadas na última inspeção

        **Passo 3:** Clique em **"📄 Gerar Relatório PDF Consolidado"**

        **Passo 4:** Aguarde processamento (10-30 segundos)
        - Sistema busca todas as inspeções
        - Consolida dados
        - Gera PDF formatado

        **Passo 5:** Baixe o arquivo gerado
        - Nome automático: `Relatorio_Camaras_Espuma_YYYYMMDD_HHMM.pdf`
        - Salve em local seguro
        - Faça backup

        ---

        ### **Para Que Usar o Relatório:**

        **✅ Auditorias Internas:**
        - Apresentação para gerência
        - Reuniões de segurança
        - Análise de conformidade

        **✅ Auditorias Externas:**
        - Fiscalização do Corpo de Bombeiros
        - Auditorias de certificação (ISO, etc.)
        - Inspeções de segurança
        - Perícias técnicas

        **✅ Gestão:**
        - Planejamento de manutenções
        - Orçamento de correções
        - Histórico de conformidade
        - Tomada de decisão

        **✅ Documentação Legal:**
        - Comprovação de inspeções
        - Defesa em processos
        - Renovação de AVCB/CLCB
        - Atendimento a normas

        ---

        ### **Dicas para Apresentação:**

        **Para Auditorias:**
        - 📄 Imprima frente e verso
        - 📎 Use pasta ou espiral
        - 📋 Inclua capa com logo da empresa
        - ✍️ Espaço para assinatura e carimbo

        **Para Arquivo Digital:**
        - 💾 Salve em pasta organizada
        - 📁 Estrutura: `Relatorios/Camaras_Espuma/2025/`
        - ☁️ Backup na nuvem
        - 🔒 Controle de acesso

        **Para Apresentações:**
        - 📊 Destaque resumo geral
        - 🎯 Foque em não conformidades
        - 📈 Mostre evolução ao longo do tempo
        - 💡 Apresente planos de ação

        ---

        ### **Frequência Recomendada:**

        **Gere relatório:**
        - 📅 **Mensalmente:** Para acompanhamento interno
        - 📅 **Semestralmente:** Para auditorias regulares
        - 📅 **Anualmente:** Para renovação de AVCB
        - 🚨 **Sob demanda:** Para fiscalizações

        ---

        ### **Personalizações Futuras:**

        💡 **Em breve no sistema:**
        - Filtro por período
        - Filtro por localização
        - Comparativo entre períodos
        - Gráficos de tendências
        - Exportação para Excel

        Por enquanto, o relatório inclui **todas as câmaras**
        com suas **últimas inspeções**.
        """)

    st.markdown("---")

    # Call-to-action
    st.success("""
    ### 🚀 Pronto para Começar?

    **Siga este checklist rápido:**

    ✅ **Já tem câmaras cadastradas?**
    → Vá para aba **"📋 Realizar Inspeção"**

    ❌ **Ainda não tem câmaras cadastradas?**
    → Comece pela aba **"✍️ Cadastro Rápido"** para adicionar ao inventário

    ⚠️ **Tamanho específico não está cadastrado?**
    → Atualize o cadastro com **Cadastro Completo** antes de inspecionar

    📚 **Dúvidas sobre algum item do checklist?**
    → Revise a seção **"Entendendo os Tipos de Câmaras"** acima

    ---

    **Lembre-se:**
    - Inspeções **SEMESTRAIS** são obrigatórias
    - Testes **FUNCIONAIS ANUAIS** são críticos
    - **Placa de orifício** incompatível = Sistema não funciona adequadamente

    Este sistema facilita a conformidade e mantém sua documentação sempre em dia! ⚡
    """)

    # Footer informativo
    st.markdown("---")
    st.caption("""
    📌 **Normas Aplicáveis:**
    - NFPA 11 (Low, Medium, and High-Expansion Foam)
    - NFPA 25 (Inspection, Testing, and Maintenance)
    - NBR 15511 (Sistemas de Espuma)
    - IT 23 (Chuveiros Automáticos - SP)

    🔄 **Última Atualização das Instruções:** Janeiro/2025
    📖 **Versão do Guia:** 1.0
    """)

def instru_mangueiras():
    """Instruções para Mangueiras e Abrigos"""
    st.header("📖 Guia de Uso - Sistema de Mangueiras e Abrigos de Incêndio")

    # Alerta de priorização
    st.success(
        "⚡ **Recomendação:** Para cadastro de múltiplas mangueiras de uma vez, "
        "use o **Processamento por IA com PDF**! Para cadastros individuais, use o **Cadastro Manual**."
    )

    st.markdown("---")

    # Comparação de métodos - MANGUEIRAS
    st.subheader("🎯 Gestão de Mangueiras - Escolha o Melhor Método")

    col1, col2 = st.columns(2)

    with col1:
        st.markdown("""
        ### 🤖 Processamento por IA
        **📄 PARA MÚLTIPLAS MANGUEIRAS**

        **Tempo:** ~2-3 minutos (processo completo)

        **Ideal para:**
        - 📋 Certificados de teste hidrostático
        - 🏢 Relatórios de empresas terceirizadas
        - 📊 Processar 10, 20, 50+ mangueiras de uma vez
        - 📄 Manter PDF anexado ao registro

        **Como funciona:**
        1. Faça upload do certificado PDF
        2. IA extrai todos os dados automaticamente
        3. Revise a tabela com todas as mangueiras
        4. Confirme e salve tudo de uma vez
        5. PDF fica anexado aos registros

        **Vantagens:**
        - 🤖 IA processa tudo sozinha
        - ⚡ Múltiplas mangueiras em segundos
        - 📄 Certificado anexado
        - 📅 Calcula próximo teste automaticamente
        - 🎯 Identifica aprovadas/reprovadas/condenadas

        **Requer:** Plano Premium IA
        """)

    with col2:
        st.markdown("""
        ### ✍️ Cadastro Manual
        **🆕 PARA MANGUEIRAS INDIVIDUAIS**

        **Tempo:** ~1-2 minutos por mangueira

        **Ideal para:**
        - 🆕 Cadastrar mangueira nova individual
        - 🔧 Mangueiras de reposição
        - ✏️ Correções pontuais
        - 📝 Quando não tem certificado PDF

        **Como funciona:**
        1. Preencha os dados básicos
        2. Selecione diâmetro, tipo e comprimento
        3. Informe ano de fabricação
        4. Opcionalmente, empresa fornecedora
        5. Salve - Pronto! ✅

        **Vantagens:**
        - 🚀 Rápido para 1 mangueira
        - 📝 Controle total dos dados
        - 🆕 Não precisa de certificado
        - ⚙️ Campos pré-definidos facilitam

        **Disponível em:** Todos os planos Pro e Premium IA
        """)

    st.markdown("---")

    # Comparação de métodos - ABRIGOS
    st.subheader("🧯 Gestão de Abrigos - Escolha o Melhor Método")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("""
        ### 🤖 Inventário por IA
        **📄 PARA MÚLTIPLOS ABRIGOS**

        **Tempo:** ~2-3 minutos (lote completo)

        **Ideal para:**
        - 📋 Inventários completos em PDF
        - 🏢 Levantamentos de empresas
        - 📊 Cadastrar 5, 10, 20+ abrigos
        - 🗂️ Primeira implantação

        **Como funciona:**
        1. Upload do inventário PDF
        2. IA extrai todos os abrigos
        3. Revise ID, local e itens
        4. Salve tudo de uma vez

        **Vantagens:**
        - 🤖 IA identifica itens automaticamente
        - ⚡ Múltiplos abrigos em minutos
        - 📊 Mantém estrutura organizada

        **Requer:** Plano Premium IA
        """)

    with col2:
        st.markdown("""
        ### ➕ Cadastro Manual
        **🆕 PARA ABRIGO INDIVIDUAL**

        **Tempo:** ~2-4 minutos por abrigo

        **Ideal para:**
        - 🆕 Abrigo novo individual
        - 📝 Não tem inventário PDF
        - ✏️ Correções de dados
        - 🔧 Atualizações pontuais

        **Como funciona:**
        1. Informe ID e localização
        2. Selecione itens padrão
        3. Adicione itens personalizados
        4. Defina quantidades
        5. Salve o abrigo

        **Vantagens:**
        - 📋 Lista de itens padrão
        - ➕ Adicione itens customizados
        - 🎯 Controle total do inventário

        **Disponível em:** Todos os planos
        """)

    with col3:
        st.markdown("""
        ### 🔍 Inspeção de Abrigo
        **📅 USO PERIÓDICO**

        **Tempo:** ~3-5 minutos por abrigo

        **Ideal para:**
        - 📅 Inspeções mensais obrigatórias
        - ✅ Verificação de conformidade
        - 🔧 Identificar itens faltantes
        - 📊 Manter histórico

        **Como funciona:**
        1. Selecione o abrigo
        2. Checklist item por item
        3. Marque OK/Avariado/Faltando
        4. Verifique condições gerais
        5. Salve a inspeção

        **Vantagens:**
        - 📋 Checklist guiado
        - 🎯 Baseado no inventário real
        - 🔔 Identifica pendências
        - 📊 Histórico rastreável
        """)

    st.markdown("---")

    # Fluxo de trabalho recomendado
    st.subheader("🎯 Fluxo de Trabalho Recomendado")

    st.info("""
    **Para Máxima Eficiência, Siga Esta Ordem:**

    ### 🔧 MANGUEIRAS:

    1️⃣ **Recebeu Certificado de TH com Múltiplas Mangueiras?**
    → Use **"Inspeção de Mangueiras com IA"** (IA processa tudo!)

    2️⃣ **Comprou 1 ou 2 Mangueiras Novas?**
    → Use **"Cadastro Manual de Mangueiras"** (mais rápido para poucas)

    3️⃣ **Primeira Implantação do Sistema?**
    → Use **Cadastro Manual** uma a uma OU peça inventário em PDF para IA processar

    ---

    ### 🧯 ABRIGOS:

    1️⃣ **Tem Inventário Completo em PDF?**
    → Use **"Cadastro de Abrigos com IA"** (múltiplos de uma vez!)

    2️⃣ **Cadastrar 1 Abrigo Novo?**
    → Use **"Cadastro Manual"** no expansível da aba de inspeção

    3️⃣ **Fazer Inspeção Mensal?**
    → Use **"Inspeção de Abrigos"** (checklist guiado!)
    """)

    st.markdown("---")

    # Guia detalhado - MANGUEIRAS
    st.subheader("💧 Guia Completo: Gestão de Mangueiras")

    with st.expander("📋 Tipos de Teste e Validade", expanded=True):
        st.markdown("""
        ### 🔬 Teste Hidrostático de Mangueiras

        **O que é?**
        - Teste obrigatório que verifica a integridade da mangueira
        - Mangueira é submetida a alta pressão de água
        - Identifica vazamentos, pontos fracos e desgaste

        ---

        ### ⏰ Frequência Obrigatória

        **Norma NBR 12779:**
        - ✅ **Teste a cada 12 meses** (anual obrigatório)
        - ⚠️ Sistema calcula automaticamente o próximo vencimento
        - 🚨 Mangueira com teste vencido não pode ser usada

        **Quando fazer teste extraordinário:**
        - Após qualquer reparo ou recondicionamento
        - Após exposição a produtos químicos
        - Se houver suspeita de dano interno
        - Após longos períodos sem uso (>2 anos)

        ---

        ### 🎯 Resultados Possíveis

        **✅ APROVADA:**
        - Suportou a pressão de teste sem vazamentos
        - Está apta para uso por mais 12 meses
        - Sistema agenda próximo teste automaticamente

        **⚠️ REPROVADA:**
        - Apresentou vazamento ou falha no teste
        - **NÃO pode ser usada** até reparo
        - Deve ser reparada e testada novamente
        - Se não for possível reparar → CONDENAR

        **🗑️ CONDENADA:**
        - Falha estrutural irreparável
        - Deve ser **descartada imediatamente**
        - Substituir por mangueira nova
        - Sistema não agenda próximo teste (item baixado)

        ---

        ### 📊 Pressões de Teste por Tipo

        | Tipo | Pressão de Trabalho | Pressão de Teste |
        |------|---------------------|------------------|
        | Tipo 1 | 980 kPa (10 kgf/cm²) | 1.960 kPa (20 kgf/cm²) |
        | Tipo 2 | 1.370 kPa (14 kgf/cm²) | 2.740 kPa (28 kgf/cm²) |
        | Tipo 3 | 1.520 kPa (15,5 kgf/cm²) | 3.040 kPa (31 kgf/cm²) |
        | Tipo 4 | 1.960 kPa (20 kgf/cm²) | 3.920 kPa (40 kgf/cm²) |
        | Tipo 5 | 2.740 kPa (28 kgf/cm²) | 5.480 kPa (56 kgf/cm²) |
        """)

    with st.expander("🤖 Como Usar o Processamento por IA"):
        st.markdown("""
        ### 📄 Passo a Passo: Processamento de Certificado PDF

        #### **Passo 1: Prepare o Certificado** 📋

        **Formatos aceitos:**
        - ✅ PDF de empresas certificadas de teste hidrostático
        - ✅ Certificados padrão do mercado
        - ✅ Relatórios técnicos com dados estruturados

        **O certificado deve conter:**
        - ID/número de cada mangueira
        - Marca e especificações (diâmetro, tipo, comprimento)
        - Data do teste
        - Resultado (Aprovado/Reprovado/Condenado)
        - Empresa executante e responsável técnico

        ---

        #### **Passo 2: Faça o Upload** 📤

        1. Vá para aba **"Inspeção de Mangueiras com IA"**
        2. Clique em **"Choose file"** ou arraste o PDF
        3. Aguarde o upload completar
        4. Clique em **"🔎 Analisar Certificado com IA"**

        ---

        #### **Passo 3: Aguarde o Processamento** 🤖

        **A IA fará automaticamente:**
        - 📖 Leitura completa do certificado
        - 🔍 Identificação de todas as mangueiras
        - 📊 Extração dos dados técnicos
        - 📅 Cálculo da próxima data de teste
        - ✅ Classificação de resultado

        **Tempo médio:** 20-40 segundos

        💡 **Dica:** Quanto melhor a qualidade do PDF, melhor a precisão!

        ---

        #### **Passo 4: Revise os Dados Extraídos** 🔍

        Sistema mostrará uma **tabela** com todos os dados:

        | Campo | O que verificar |
        |-------|----------------|
        | **ID Mangueira** | ID correto e único |
        | **Marca** | Fabricante correto |
        | **Diâmetro** | Em polegadas (1, 1½, 2, 2½, 3) |
        | **Tipo** | Tipo correto (1 a 5) |
        | **Comprimento** | Em metros (15, 20, 25, 30) |
        | **Ano Fabricação** | Ano realista |
        | **Data Inspeção** | Data do teste hidrostático |
        | **Próximo Teste** | Deve ser +12 meses (se aprovada) |
        | **Resultado** | Aprovado/Reprovado/Condenado |
        | **Empresa** | Nome da empresa certificadora |
        | **Responsável** | Nome do responsável técnico |

        **⚠️ Se houver erro:**
        - Você pode editar depois via Dashboard
        - Ou processar novamente com PDF melhor qualidade

        ---

        #### **Passo 5: Confirme e Salve** 💾

        1. Revise todos os dados na tabela
        2. Clique em **"💾 Confirmar e Salvar Registros"**
        3. Aguarde o salvamento em lote
        4. 🎉 Pronto! Todas as mangueiras salvas de uma vez!

        **O sistema automaticamente:**
        - ✅ Salva todas as mangueiras na planilha
        - 📄 Anexa o PDF do certificado ao registro
        - 📅 Agenda próximos testes (se aprovadas)
        - 🚨 Marca mangueiras condenadas como inativas
        - 📊 Atualiza o Dashboard
        - 🔔 Gera alertas de vencimento

        ---

        #### **📊 Exemplo Prático**

        **Certificado com 25 mangueiras:**
        - ⏱️ Processamento por IA: ~3 minutos (tudo)
        - ⏱️ Cadastro manual: ~50 minutos (2min × 25)

        **💰 Economia de tempo: ~94%!**
        """)

    with st.expander("✍️ Como Usar o Cadastro Manual de Mangueiras"):
        st.markdown("""
        ### 📝 Passo a Passo: Cadastro Manual

        #### **Quando usar o cadastro manual?**

        ✅ **Use quando:**
        - Comprou 1 ou 2 mangueiras novas
        - Não tem certificado de teste ainda
        - Precisa fazer cadastro inicial rápido
        - Quer corrigir dados de uma mangueira específica

        ❌ **NÃO use quando:**
        - Tem certificado PDF com 5+ mangueiras (use IA!)
        - Precisa cadastrar inventário completo (use IA!)

        ---

        #### **Passo 1: Acesse o Formulário** 📋

        1. Vá para aba **"Cadastro Manual de Mangueiras"**
        2. Formulário já estará pronto para preenchimento

        ---

        #### **Passo 2: Preencha os Dados Obrigatórios** ✏️

        **🏷️ ID da Mangueira (OBRIGATÓRIO):**
        - Identificação única da mangueira
        - Exemplos: MG-001, MANG-A-15, H2-025
        - **Importante:** Não pode haver ID duplicado!

        **📝 Marca/Fabricante:**
        - Nome do fabricante da mangueira
        - Exemplos: Mangotex, Boa Vista, Taurus

        **📏 Diâmetro (polegadas):**
        - Selecione da lista: 1, 1½, 2, 2½, 3
        - Mais comum: **1½** (residencial/comercial)
        - Industrial: **2½** ou **3**

        **🔢 Tipo:**
        - Selecione de 1 a 5 (quanto maior, mais resistente)
        - Tipo 1: Uso leve
        - Tipo 2-3: Uso médio (mais comum)
        - Tipo 4-5: Uso pesado/industrial

        **📐 Comprimento (metros):**
        - Selecione: 15, 20, 25, 30 metros
        - Mais comum: **15m** ou **30m**

        **📅 Ano de Fabricação:**
        - Ano em que a mangueira foi fabricada
        - Sistema valida: entre 30 anos atrás e ano atual
        - **Importante:** Mangueiras >10 anos requerem atenção especial

        ---

        #### **Passo 3: Dados Opcionais** ➕

        **🏢 Empresa Fornecedora (Opcional):**
        - Nome da empresa que forneceu a mangueira
        - Útil para rastreabilidade e garantia

        ---

        #### **Passo 4: Cadastre!** 🚀

        1. Revise todos os dados preenchidos
        2. Clique em **"Cadastrar Nova Mangueira"**
        3. Aguarde a confirmação
        4. ✅ Mangueira cadastrada com sucesso!

        **O que acontece após cadastrar:**
        - Mangueira aparece no Dashboard
        - Status inicial: "Pendente" (sem teste ainda)
        - Sistema aguarda primeiro teste hidrostático
        - Você pode cadastrar outra mangueira (formulário limpa automaticamente)

        ---

        #### **⚠️ Erros Comuns e Soluções**

        **"ID da Mangueira já existe"**
        - ✅ Escolha outro ID único
        - ✅ Verifique se não cadastrou antes
        - ✅ Use padrão: MG-001, MG-002, etc.

        **"Dados não salvaram"**
        - ✅ Verifique conexão com internet
        - ✅ Confirme que preencheu ID (obrigatório)
        - ✅ Tente novamente após alguns segundos

        ---

        #### **💡 Dicas para Cadastro Eficiente**

        **Crie um padrão de ID:**    MG-001, MG-002, MG-003...
    ou
    MANG-15M-001, MANG-15M-002... (inclui comprimento)
    ou
    H2-A-001, H2-A-002... (H2 = 2½", A = Área A)

        **Organize por setor/área:**
        - Use prefixos: ADM-001, PROD-001, EST-001
        - Facilita localização física
        - Ajuda em inspeções por área

        **Mantenha planilha auxiliar:**
        - Excel com IDs, locais e datas de compra
        - Ajuda a não duplicar IDs
        - Facilita planejamento de testes
        """)

    st.markdown("---")

    # Guia detalhado - ABRIGOS
    st.subheader("🧯 Guia Completo: Gestão de Abrigos de Emergência")

    with st.expander("📋 O que são Abrigos e Por que Inspecionar?", expanded=True):
        st.markdown("""
        ### 🧯 O que é um Abrigo de Emergência?

        **Definição:**
        - Caixa ou armário instalado na parede
        - Contém equipamentos de combate a incêndio
        - Geralmente pintado de vermelho
        - Identificado com placa/sinalização

        **Componentes típicos:**
        - 💧 Mangueiras de incêndio (1½" ou 2½")
        - 🚿 Esguichos reguláveis
        - 🔧 Chaves de mangueira e hidrante
        - 🔌 Adaptadores e redutores
        - 📦 Derivantes (divisores de linha)

        ---

        ### ⚖️ Por que Inspecionar Regularmente?

        **Requisitos legais:**
        - ✅ NBR 13714: Inspeção **mensal** obrigatória
        - ✅ NR-23: Manutenção dos equipamentos de combate
        - ✅ Código de Incêndio estadual

        **Riscos de não inspecionar:**
        - 🚨 Equipamento faltante na hora da emergência
        - 🔴 Mangueiras danificadas ou ressecadas
        - ⚠️ Acessórios incompatíveis ou errados
        - 📋 Multas em fiscalização do Corpo de Bombeiros
        - 💼 Responsabilização civil e criminal

        **Benefícios da inspeção:**
        - ✅ Conformidade legal garantida
        - 🔒 Segurança dos ocupantes
        - 📊 Rastreabilidade completa
        - 🔧 Identificação precoce de problemas
        - 💰 Economia com reparos preventivos

        ---

        ### 📅 Frequência de Inspeção

        **Mensal (Obrigatório):**
        - Verificação visual de todos os itens
        - Conferência de quantidades
        - Estado de conservação
        - Lacre de segurança
        - Sinalização

        **Extraordinária (Quando Necessário):**
        - Após uso do abrigo em emergência
        - Após manutenção ou substituição de itens
        - Após identificação de violação
        - Antes de auditorias/fiscalizações
        """)

    with st.expander("🤖 Como Usar o Cadastro de Abrigos por IA"):
        st.markdown("""
        ### 📄 Passo a Passo: Cadastro em Lote com IA

        #### **Passo 1: Prepare o Inventário PDF** 📋

        **Formato ideal do documento:**
        - ✅ Inventário completo em PDF
        - ✅ Lista de abrigos com IDs
        - ✅ Localização de cada abrigo
        - ✅ Itens e quantidades por abrigo

        **Estrutura recomendada do PDF:**
    ABRIGO: ABR-01
    Local: Corredor A - Térreo
    Itens:
    - Mangueira 1½": 2 unidades
    - Esguicho 1½": 1 unidade
    - Chave de mangueira: 1 unidade

    ABRIGO: ABR-02
    Local: Escada B - 1º Andar
    Itens:
    - Mangueira 2½": 1 unidade
    ...

        ---

        #### **Passo 2: Faça o Upload** 📤

        1. Vá para aba **"Cadastro de Abrigos com IA"**
        2. Clique em **"Choose file"** ou arraste o PDF
        3. Aguarde upload completar
        4. Clique em **"🔎 Analisar Inventário com IA"**

        ---

        #### **Passo 3: IA Processa o Documento** 🤖

        **A IA extrairá automaticamente:**
        - 🏷️ ID de cada abrigo
        - 📍 Localização descrita
        - 📦 Lista completa de itens
        - 🔢 Quantidade de cada item
        - 🏢 Cliente/Unidade (se mencionado)

        **Tempo:** 30-60 segundos

        ---

        #### **Passo 4: Revise os Dados** 🔍

        Sistema mostra **expansores** com cada abrigo:
    ▼ ABRIGO ID: ABR-01 | Cliente: Empresa X
      Local: Corredor A - Térreo
      Itens:
      {
        "Mangueira 1½\"": 2,
        "Esguicho 1½\"": 1,
        "Chave de mangueira": 1
      }

        **Clique em cada expansor** para ver detalhes completos

        **⚠️ Se algo estiver errado:**
        - Você pode editar depois via Dashboard
        - Ou cadastrar manualmente apenas os abrigos com erro

        ---

        #### **Passo 5: Confirme e Salve Tudo** 💾

        1. Revise todos os abrigos
        2. Clique em **"💾 Confirmar e Salvar Abrigos"**
        3. Sistema salva **todos de uma vez**
        4. 🎉 Pronto! Inventário completo cadastrado!

        **O que acontece após salvar:**
        - ✅ Todos os abrigos salvos na planilha
        - 📊 Aparecem no Dashboard
        - 🔍 Prontos para inspeção
        - 📋 Checklist gerado automaticamente baseado no inventário

        ---

        #### **💡 Dicas para IA processar melhor:**

        **✅ FAÇA:**
        - Use PDFs com texto (não imagens escaneadas)
        - Mantenha estrutura clara (ID → Local → Itens)
        - Liste itens em bullets ou numerados
        - Use nomes claros (ex: "Mangueira 1½\"" ao invés de "Mang.")

        **❌ EVITE:**
        - PDFs muito complexos ou desorganizados
        - Imagens escaneadas de baixa qualidade
        - Documentos sem estrutura clara
        - Múltiplos formatos misturados
        """)

    with st.expander("➕ Como Usar o Cadastro Manual de Abrigos"):
        st.markdown("""
        ### 📝 Passo a Passo: Cadastro Individual

        #### **Quando usar cadastro manual?**

        ✅ **Use quando:**
        - Instalou 1 abrigo novo
        - Não tem inventário em PDF
        - Precisa fazer cadastro rápido
        - Quer controlar item por item

        ---

        #### **Passo 1: Acesse o Formulário** 📋

        1. Vá para aba **"Inspeção de Abrigos"**
        2. No topo, clique em **"➕ Cadastrar Novo Abrigo Manualmente"**
        3. Expansor abrirá com o formulário

        ---

        #### **Passo 2: Dados Básicos** ✏️

        **🏷️ ID do Abrigo (OBRIGATÓRIO):**
        - Identificação única do abrigo
        - Exemplos: ABR-01, ABRIGO-A-1, CECI-02
        - **Importante:** Não pode duplicar ID!

        **🏢 Cliente/Unidade:**
        - Nome da empresa/unidade
        - Campo preenchido automaticamente (se houver)
        - Pode editar se necessário

        **📍 Localização (OBRIGATÓRIO):**
        - Descrição detalhada do local
        - Exemplos:
          - "Corredor A - Térreo - Próximo à recepção"
          - "Escada B - 2º Andar - Saída de emergência"
          - "Garagem - Subsolo - Pilar 15"

        **💡 Dica:** Quanto mais específico, melhor para localizar!

        ---

        #### **Passo 3: Inventário de Itens** 📦

        **Seção 1: Itens Padrão**

        Sistema mostra lista de itens comuns:
        - Mangueira de 1½"
        - Mangueira de 2½"
        - Esguicho de 1½"
        - Esguicho de 2½"
        - Chave de Mangueira
        - Chave de Hidrante
        - Chave Storz
        - Derivante/Divisor
        - Redutor
        - Adaptador

        **Para cada item:**
        1. Veja o nome do item
        2. Digite a **quantidade** (0 se não tiver)
        3. Apenas itens com quantidade > 0 serão salvos

        **Seção 2: Item Personalizado**

        Se tiver item não listado:
        1. Digite o **nome do item** (ex: "Mangueira de 3 polegadas")
        2. Digite a **quantidade**
        3. Sistema incluirá no inventário

        **💡 Dica:** Pode adicionar múltiplos itens personalizados salvando e cadastrando novamente!

        ---

        #### **Passo 4: Cadastre o Abrigo** 🚀

        1. Revise todos os dados
        2. Verifique se marcou pelo menos 1 item com quantidade > 0
        3. Clique em **"Cadastrar Novo Abrigo"**
        4. Aguarde confirmação
        5. ✅ Abrigo cadastrado com sucesso!

        **O que acontece após cadastrar:**
        - Abrigo aparece na lista de seleção
        - Pronto para ser inspecionado
        - Checklist gerado automaticamente
        - Inventário salvo como JSON

        ---

        #### **⚠️ Validações do Sistema**

        Sistema valida automaticamente:
        - ✅ ID é obrigatório e único
        - ✅ Localização é obrigatória
        - ✅ Pelo menos 1 item com quantidade > 0

        **Mensagens de erro comuns:**

        **"ID do Abrigo é obrigatório"**
        → Preencha o campo ID

        **"Localização é obrigatória"**
        → Descreva onde o abrigo está instalado

        **"É necessário adicionar pelo menos um item"**
        → Marque quantidade > 0 em algum item
        """)

    with st.expander("🔍 Como Realizar Inspeção de Abrigos"):
        st.markdown("""
        ### 📋 Passo a Passo: Inspeção Mensal

        #### **Preparação para Inspeção** 🧰

        **Antes de começar:**
        - 📱 Celular/tablet com acesso ao sistema
        - 🔦 Lanterna (se necessário)
        - 📋 Checklist mental dos itens
        - 🔑 Chave do abrigo (se for trancado)

        ---

        #### **Passo 1: Selecione o Abrigo** 🔍

        1. Vá para aba **"Inspeção de Abrigos"**
        2. Role até **"Inspeção de Abrigo Existente"**
        3. No dropdown, selecione o abrigo
        4. Sistema carregará o inventário cadastrado

        ---

        #### **Passo 2: Inspecione Item por Item** 📦

        **Para cada item do inventário:**

        Sistema mostra:
        - 📦 **Nome do item**
        - 🔢 **Quantidade prevista** (cadastrada)

        Você deve marcar:

        **Status (escolha um):**
        - ✅ **OK** - Item presente, em bom estado, quantidade correta
        - ⚠️ **Avariado** - Item presente, mas danificado/desgastado
        - ❌ **Faltando** - Item ausente ou quantidade menor que prevista

        **Observação (opcional mas recomendada):**
        - Descreva o problema se status ≠ OK
        - Exemplos:
          - "Mangueira com ressecamento visível"
          - "Falta 1 esguicho (previsto 2, encontrado 1)"
          - "Chave de mangueira enferrujada"

        ---

        #### **Passo 3: Condições Gerais** 🔍

        Após verificar todos os itens, inspecione:

        **🔒 Lacre de segurança intacto?**
        - Sim → Abrigo não foi violado
        - Não → Lacre rompido, danificado ou ausente

        **🪧 Sinalização visível e correta?**
        - Sim → Placa presente, legível e bem posicionada
        - Não → Placa ausente, ilegível ou escondida

        **🚪 Acesso desobstruído?**
        - Sim → Nada bloqueando o abrigo
        - Não → Objetos, móveis ou entulho na frente

        ---

        #### **Passo 4: Salve a Inspeção** 💾

        1. Revise todas as respostas
        2. Clique em **"✅ Salvar Inspeção"**
        3. Sistema calcula status geral automaticamente:
           - 🟢 **Aprovado** - Tudo OK
           - 🔴 **Reprovado com Pendências** - Algum item não conforme

        4. 🎉 Inspeção salva com sucesso!

        ---

        #### **🤖 O que o Sistema Faz Automaticamente**

        **Após salvar:**
        - ✅ Registra inspeção no histórico
        - 📅 Agenda próxima inspeção (30 dias)
        - 🚨 Gera alerta se houver pendências
        - 📊 Atualiza Dashboard
        - 🔔 Notifica sobre itens faltantes/avariados

        **Se aprovado (tudo OK):**
        - 🎈 Balões de comemoração!
        - Status verde no Dashboard

        **Se reprovado (pendências):**
        - 📋 Gera plano de ação automaticamente
        - Sugere correções
        - Prioriza itens críticos

        ---

        #### **💡 Dicas para Inspeção Eficiente**

        **Organize por área:**
        - Inspecione todos os abrigos de uma área de uma vez
        - Crie rota lógica para economizar tempo

        **Padronize o dia:**
        - Faça sempre no mesmo dia do mês (ex: todo dia 1º)
        - Cria rotina e não esquece

        **Tire fotos (opcional mas bom):**
        - Foto do abrigo fechado
        - Foto do abrigo aberto mostrando itens
        - Foto de não conformidades
        - Anexe no sistema ou guarde para auditoria

        **Aja imediatamente em problemas críticos:**
        - Item faltante essencial → Repor HOJE
        - Lacre violado → Investigar HOJE
        - Acesso bloqueado → Liberar AGORA
        """)

    st.markdown("---")

    # Perguntas frequentes
    st.subheader("❓ Perguntas Frequentes")

    with st.expander("💧 Posso usar a mesma mangueira por quantos anos?"):
        st.markdown("""
        **Não há prazo de validade fixo para mangueiras**, mas:

        ### 📋 Critérios de Substituição

        **Substitua quando:**
        - ❌ **Reprovada no teste hidrostático** 2x seguidas
        - 🗑️ **Condenada** em teste (vazamento irreparável)
        - 👴 **Idade > 10 anos** (mesmo aprovada, considere substituir)
        - 👁️ **Desgaste visível** (ressecamento, rachaduras, deformações)
        - 🔧 **Custo de reparo > 70%** do valor de nova

        ### ⏰ Vida Útil Esperada

        **Com manutenção adequada:**
        - 🟢 **Uso interno protegido:** 8-12 anos
        - 🟡 **Uso externo coberto:** 5-8 anos
        - 🔴 **Uso externo exposto:** 3-5 anos

        **Fatores que reduzem vida útil:**
        - ☀️ Exposição direta ao sol
        - 🌡️ Temperaturas extremas
        - 🧪 Contato com produtos químicos
        - 🚗 Tráfego de veículos sobre a mangueira
        - 📦 Armazenamento inadequado

        ### 💡 Dica de Ouro

        **Não espere falhar no teste!**
        - Inspecione visualmente a cada 3 meses
        - Substitua preventivamente se >8 anos
        - Melhor gastar R$ 200-400 em mangueira nova
        - Do que R$ 5.000+ em teste + perda de tempo
        """)

    with st.expander("🤖 A IA sempre extrai os dados corretamente?"):
        st.markdown("""
        ### 🎯 Taxa de Acerto da IA

        **Em documentos bem estruturados:**
        - ✅ **95-98%** de precisão
        - ✅ Raramente erra dados críticos (ID, resultado)
        - ✅ Pode confundir campos menos importantes

        **Em documentos problemáticos:**
        - ⚠️ **70-85%** de precisão
        - ⚠️ Pode errar quantidades ou datas
        - ⚠️ Pode misturar dados entre equipamentos

        ---

        ### 🔍 Como Garantir Melhor Precisão

        **✅ FAÇA:**
        1. Use PDFs nativos (gerados digitalmente)
        2. Mantenha estrutura clara e organizada
        3. **SEMPRE revise os dados** antes de salvar
        4. Corrija erros manualmente na tabela de revisão

        **❌ EVITE:**
        1. PDFs escaneados de baixa qualidade
        2. Documentos manuscritos ou rascunhos
        3. Certificados muito antigos ou fora de padrão
        4. Salvar sem revisar (confiança cega na IA)

        ---

        ### ⚠️ Importante: Sempre Revise!

        **A IA é uma FERRAMENTA de AUXÍLIO, não substitui revisão humana.**

        **Passo crítico:**
        1. IA extrai os dados (economiza 90% do tempo)
        2. **VOCÊ revisa** a tabela (gasta 10% do tempo)
        3. Corrige erros se necessário
        4. **Só então salva**

        **💡 Mesmo com 5% de erro, você economiza 85% do tempo!**
        """)

    with st.expander("🧯 Quantos abrigos preciso ter no meu prédio?"):
        st.markdown("""
        ### 📏 Cálculo de Quantidade de Abrigos

        **Regra geral (NBR 13714):**
    Quantidade de Abrigos = Área Total / Raio de Alcance²

        **Raio de alcance depende da classe de risco:**
        - 🟢 **Risco Leve:** Raio de 30m → 1 abrigo a cada ~2.800m²
        - 🟡 **Risco Médio:** Raio de 25m → 1 abrigo a cada ~1.960m²
        - 🔴 **Risco Alto:** Raio de 20m → 1 abrigo a cada ~1.250m²

        ---

        ### 🏢 Exemplos Práticos

        **Prédio Comercial (Risco Leve):**
        - 5.000m² de área
        - Raio: 30m
        - **Mínimo:** 2 abrigos
        - **Recomendado:** 3 abrigos (1 por andar se tiver 3+ andares)

        **Indústria (Risco Médio):**
        - 8.000m² de galpão
        - Raio: 25m
        - **Mínimo:** 5 abrigos
        - **Recomendado:** 6-8 abrigos estrategicamente posicionados

        **Depósito Químico (Risco Alto):**
        - 3.000m²
        - Raio: 20m
        - **Mínimo:** 3 abrigos
        - **Recomendado:** 4-5 abrigos + extintores adicionais

        ---

        ### 📍 Posicionamento Estratégico

        **Locais obrigatórios:**
        - ✅ Próximo a **saídas de emergência**
        - ✅ Em **rotas de fuga**
        - ✅ Próximo a **escadas** (em prédios)
        - ✅ Em **corredores principais**
        - ✅ Áreas de **maior circulação**

        **Evite:**
        - ❌ Cantos escondidos
        - ❌ Atrás de portas
        - ❌ Áreas com obstrução frequente
        - ❌ Locais de difícil acesso

        ---

        ### 💡 Consultoria Profissional

        **Recomendamos:**
        - Consultar **Projeto de Prevenção contra Incêndio (PPCI)**
        - Contratar **engenheiro de segurança** para cálculo preciso
        - Seguir **exigências do Corpo de Bombeiros** da sua região

        **Cada estado/município pode ter regras específicas!**
        """)

    with st.expander("📊 Como faço backup dos meus dados?"):
        st.markdown("""
        ### ☁️ Backup Automático

        **Seus dados estão seguros!**

        **Sistema faz backup automaticamente:**
        - ✅ Google Sheets → Backup automático do Google
        - ✅ Versionamento automático (últimas 30 versões)
        - ✅ Google Drive → Certificados e PDFs salvos
        - ✅ Redundância em múltiplos data centers

        ---

        ### 💾 Como Fazer Backup Manual (Recomendado Mensal)

        **Opção 1: Exportar Planilha**
        1. Acesse sua planilha no Google Sheets
        2. Menu: **Arquivo → Fazer download → Excel (.xlsx)**
        3. Salve em local seguro (computador + nuvem)

        **Opção 2: Gerar Relatórios PDF**
        1. Use o sistema para gerar relatórios mensais
        2. Salve os PDFs em pasta organizada
        3. Estrutura sugerida:
    Backup_ISF_IA/
    ├── 2024/
    │   ├── 01_Janeiro/
    │   │   ├── Relatorio_Mangueiras_Jan2024.pdf
    │   │   ├── Relatorio_Abrigos_Jan2024.pdf
    │   ├── 02_Fevereiro/
    │   ...

        **Opção 3: Cópia da Planilha**
        1. Acesse sua planilha no Google Sheets
        2. Menu: **Arquivo → Fazer uma cópia**
        3. Nomeie: "BACKUP_2024_12_31_Mangueiras"
        4. Guarde em pasta separada no Drive

        ---

        ### 🔒 Segurança dos Dados

        **Proteções do sistema:**
        - 🔐 Acesso via login Google (seguro)
        - 👥 Cada usuário vê apenas seus dados
        - 📝 Log de auditoria de todas as ações
        - 🚫 Impossível deletar dados acidentalmente
        - ♻️ Histórico preservado permanentemente

        **Conformidade:**
        - ✅ LGPD (Lei Geral de Proteção de Dados)
        - ✅ Dados armazenados no Brasil (Google Cloud BR)
        - ✅ Criptografia em trânsito e em repouso
        """)

    st.markdown("---")

    # Call-to-action
    st.success("""
    ### 🚀 Pronto para Começar?

    **Escolha sua situação:**

    #### 💧 Para MANGUEIRAS:

    ✅ **Tenho certificado PDF com várias mangueiras**
    → Vá para **"Inspeção de Mangueiras com IA"** e deixe a IA fazer o trabalho!

    ✅ **Preciso cadastrar 1 ou 2 mangueiras**
    → Use **"Cadastro Manual de Mangueiras"** - rápido e fácil!

    ---

    #### 🧯 Para ABRIGOS:

    ✅ **Tenho inventário completo em PDF**
    → Use **"Cadastro de Abrigos com IA"** e processe tudo de uma vez!

    ✅ **Preciso cadastrar 1 abrigo**
    → Vá para **"Inspeção de Abrigos"** → Expansível de cadastro manual

    ✅ **Já tenho abrigos cadastrados e quero inspecionar**
    → Use **"Inspeção de Abrigos"** com checklist guiado!

    ---

    **💡 Lembre-se:**
    - Mangueiras: Teste hidrostático **ANUAL** obrigatório
    - Abrigos: Inspeção **MENSAL** obrigatória

    O sistema automatiza tudo e mantém você sempre em conformidade! ⚡
    """)

    # Footer informativo
    st.markdown("---")
    st.caption("""
    📌 **Normas Aplicáveis:**
    - NBR 12779 (Mangueiras de incêndio)
    - NBR 13714 (Sistemas de hidrantes e mangotinhos)
    - NR-23 (Proteção contra incêndios)

    🔄 **Última Atualização das Instruções:** Dezembro/2024
    📖 **Versão do Guia:** 1.0
    """)


def instru_dash():
    """Instruções para o Dashboard"""
    st.header("📘 Guia Completo da Dashboard")
    st.markdown("""
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                padding: 25px; border-radius: 10px; color: white; margin-bottom: 20px;">
        <h2 style="margin: 0; color: white;">🎯 Bem-vindo ao Centro de Controle</h2>
        <p style="margin: 10px 0 0 0; font-size: 1.1em;">
            Esta dashboard é o seu painel central para monitorar, gerenciar e manter todos os 
            equipamentos de emergência em conformidade. Aqui você tem visão completa e controle total!
        </p>
    </div>
    """, unsafe_allow_html=True)
    
    # ===================================================================
    # SEÇÃO 1: VISÃO GERAL
    # ===================================================================
    st.markdown("---")
    st.subheader("📊 O que é a Dashboard?")
    
    col1, col2 = st.columns(2)
    
    with col1:
        st.markdown("""
        ### 🎯 Propósito Principal
        
        A dashboard **consolida automaticamente** todos os dados de inspeções e testes, 
        apresentando uma visão unificada do status atual de cada equipamento.
        
        **Benefícios:**
        - ✅ **Visão 360°** de todos os equipamentos
        - ⏰ **Alertas automáticos** de vencimentos
        - 📊 **Métricas em tempo real** de conformidade
        - 🚨 **Identificação imediata** de problemas
        - 📄 **Geração rápida** de relatórios
        """)
    
    with col2:
        st.markdown("""
        ### 📋 Equipamentos Monitorados
        
        A dashboard rastreia **8 categorias** de equipamentos:
        
        1. 🔥 **Extintores** - Inspeções e manutenções N1/N2/N3
        2. 💧 **Mangueiras** - Testes hidrostáticos
        3. 🧯 **Abrigos** - Status de inventário
        4. 💨 **SCBA** - Testes Posi3 e inspeções visuais
        5. 🚿 **Chuveiros/Lava-Olhos** - Inspeções mensais
        6. ☁️ **Câmaras de Espuma** - Inspeções periódicas
        7. 💨 **Multigás** - Calibrações e bump tests
        8. 🔔 **Alarmes** - Inspeções de sistemas
        """)
    
    # ===================================================================
    # SEÇÃO 2: ENTENDENDO OS STATUS
    # ===================================================================
    st.markdown("---")
    st.subheader("🟢🟠🔴🔵 Decifrando os Indicadores de Status")
    
    st.info("**IMPORTANTE:** Os status são calculados automaticamente pelo sistema com base nas datas e resultados das inspeções mais recentes.")
    
    # Cards visuais para cada status
    col1, col2, col3, col4 = st.columns(4)
    
    with col1:
        st.markdown("""
        <div style="background-color: #d4edda; border-left: 5px solid #28a745; 
                    padding: 15px; border-radius: 5px; height: 100%;">
            <h3 style="color: #155724; margin-top: 0;">🟢 OK</h3>
            <p style="color: #155724; margin-bottom: 0;">
                <strong>Significado:</strong> Equipamento em dia e conforme.<br><br>
                <strong>Ação:</strong> Nenhuma ação necessária. Continue o monitoramento regular.
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col2:
        st.markdown("""
        <div style="background-color: #fff3cd; border-left: 5px solid #ffc107; 
                    padding: 15px; border-radius: 5px; height: 100%;">
            <h3 style="color: #856404; margin-top: 0;">🟠 PENDÊNCIAS</h3>
            <p style="color: #856404; margin-bottom: 0;">
                <strong>Significado:</strong> Equipamento reprovado em inspeção.<br><br>
                <strong>Ação:</strong> <strong style="color: #d39e00;">URGENTE</strong> - 
                Registre ação corretiva ou substitua o equipamento.
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col3:
        st.markdown("""
        <div style="background-color: #f8d7da; border-left: 5px solid #dc3545; 
                    padding: 15px; border-radius: 5px; height: 100%;">
            <h3 style="color: #721c24; margin-top: 0;">🔴 VENCIDO</h3>
            <p style="color: #721c24; margin-bottom: 0;">
                <strong>Significado:</strong> Prazo de inspeção/manutenção expirado.<br><br>
                <strong>Ação:</strong> <strong style="color: #c82333;">CRÍTICO</strong> - 
                Realize inspeção/manutenção imediatamente.
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    with col4:
        st.markdown("""
        <div style="background-color: #d1ecf1; border-left: 5px solid #17a2b8; 
                    padding: 15px; border-radius: 5px; height: 100%;">
            <h3 style="color: #0c5460; margin-top: 0;">🔵 PENDENTE</h3>
            <p style="color: #0c5460; margin-bottom: 0;">
                <strong>Significado:</strong> Nenhuma inspeção registrada ainda.<br><br>
                <strong>Ação:</strong> Programe e realize primeira inspeção do equipamento.
            </p>
        </div>
        """, unsafe_allow_html=True)
    
    # ===================================================================
    # SEÇÃO 3: NAVEGAÇÃO E USO
    # ===================================================================
    st.markdown("---")
    st.subheader("🧭 Como Navegar pela Dashboard")
    
    with st.expander("📌 Passo 1: Escolha a Aba do Equipamento", expanded=True):
        st.markdown("""
        **No topo da página, você verá 9 abas:**
        
        ```
        📘 Como Usar | 🔥 Extintores | 💧 Mangueiras | 🧯 Abrigos | 💨 C. Autônomo | 
        🚿 Chuveiros/Lava-Olhos | ☁️ Câmaras de Espuma | 💨 Multigás | 🔔 Alarmes
        ```
        
        **Dica:** Clique na aba correspondente ao tipo de equipamento que deseja monitorar.
        
        ---
        
        **📊 Cada aba mostra:**
        1. **Métricas Resumidas** - Totais e contadores por status (topo da aba)
        2. **Filtros** - Para refinar a visualização
        3. **Lista de Equipamentos** - Com expansores para ver detalhes
        4. **Ações Rápidas** - Botões para registrar correções ou gerar relatórios
        """)
    
    with st.expander("🔍 Passo 2: Use os Filtros e Métricas"):
        st.markdown("""
        ### 📊 Entendendo as Métricas do Topo
        
        Todas as abas mostram **4 métricas principais** no topo:
        
        | Métrica | Significado | Para que serve |
        |---------|-------------|----------------|
        | **✅ Total Ativo** | Número total de equipamentos monitorados | Visão geral do inventário |
        | **🟢 OK** | Equipamentos em dia | Ver quantos estão conformes |
        | **🔴 VENCIDO** | Equipamentos com prazo expirado | Identificar prioridades críticas |
        | **🟠 NÃO CONFORME** | Equipamentos reprovados | Ver itens que precisam de ação |
        
        ---
        
        ### 🎚️ Usando os Filtros
        
        **Logo abaixo das métricas, você encontra filtros:**
        
        ```
        Filtrar por Status:  [🟢 OK] [🔴 VENCIDO] [🟠 NÃO CONFORME] [🔵 PENDENTE]
        ```
        
        **Como usar:**
        1. Por padrão, **todos os status** estão selecionados
        2. Clique para **desmarcar** os status que não quer ver
        3. A lista abaixo atualiza automaticamente
        
        **💡 Casos de uso comuns:**
        - Ver **apenas vencidos** → Desmarque 🟢, 🟠 e 🔵
        - Ver **apenas problemas** → Deixe apenas 🔴 e 🟠
        - Ver **tudo que precisa atenção** → Desmarque apenas 🟢
        """)
    
    with st.expander("📂 Passo 3: Explore os Detalhes de Cada Equipamento"):
        st.markdown("""
        ### 🔽 Expansores Interativos
        
        Cada equipamento aparece como uma **linha expansível**:
        
        ```
        🟠 ID: EXT-001 | Tipo: ABC | Status: NÃO CONFORME | Local: ✅ Corredor A
        ```
        
        **Clique na linha** para expandir e ver:
        
        ---
        
        #### 📋 O que aparece ao expandir:
        
        1. **Plano de Ação Sugerido**
           - Sistema gera automaticamente recomendações
           - Baseado no problema identificado
           - Exemplo: *"Equipamento reprovado. Realizar manutenção N2 ou substituir."*
        
        2. **Próximos Vencimentos**
           - Datas calculadas automaticamente
           - Divididas por tipo de serviço
           - Exemplo: Inspeção (01/12/2025), Manutenção N2 (15/01/2026)
        
        3. **Informações Técnicas**
           - Selo INMETRO, marca, capacidade
           - Última inspeção realizada
           - Histórico de ações corretivas
        
        4. **Botão de Ação** (se necessário)
           - Aparece automaticamente para status 🔴 ou 🟠
           - Permite registrar correção direto da dashboard
        
        5. **Fotos e Evidências** (quando disponível)
           - Fotos de não conformidades
           - Certificados de testes
           - Evidências de ações realizadas
        """)
    
    with st.expander("✍️ Passo 4: Registre Ações Corretivas"):
        st.markdown("""
        ### 🛠️ Quando Registrar uma Ação?
        
        **Registre sempre que:**
        - ✅ Corrigiu um problema identificado
        - 🔄 Substituiu um equipamento
        - 🗑️ Deu baixa em equipamento condenado
        - 🔧 Realizou manutenção não programada
        
        ---
        
        ### 📝 Como Registrar?
        
        **1. Localize o equipamento com problema na dashboard**
        - Ele terá status 🔴 ou 🟠
        
        **2. Expanda os detalhes clicando na linha**
        
        **3. Clique no botão `✍️ Registrar Ação Corretiva`**
        
        **4. Preencha o formulário que aparece:**
        
        #### Para **Ação Corretiva**:
        - Descrição detalhada da correção realizada
        - Responsável pela ação
        - Foto de evidência (opcional, mas recomendado)
        
        #### Para **Substituição**:
        - Descrição da substituição
        - **ID do equipamento substituto** (obrigatório)
        - Responsável e foto
        
        #### Para **Baixa Definitiva**:
        - Motivo da condenação (lista pré-definida)
        - **ID do equipamento substituto** (obrigatório)
        - **Foto de evidência** (obrigatória)
        - Observações adicionais
        - Confirmações de segurança
        
        **5. Clique em `💾 Salvar Ação`**
        
        ---
        
        ### ✨ O que acontece após salvar?
        
        **Automaticamente:**
        1. ✅ Sistema registra a ação no log de auditoria
        2. 📸 Foto é enviada para o Google Drive (se fornecida)
        3. 🟢 Status do equipamento muda para "OK"
        4. 📅 Nova inspeção "aprovada" é registrada
        5. 🔄 Dashboard atualiza imediatamente
        6. 📋 Ação fica documentada no histórico
        
        **Importante:** A ação fica **permanentemente registrada** para auditorias!
        """)
    
    # ===================================================================
    # SEÇÃO 4: RELATÓRIOS
    # ===================================================================
    st.markdown("---")
    st.subheader("📄 Gerando Relatórios da Dashboard")
    
    with st.expander("📋 Tipos de Relatórios Disponíveis", expanded=True):
        st.markdown("""
        Cada aba possui opções de relatórios específicas:
        
        ### 🔥 Extintores
        - **Relatório Mensal Completo** (aba expansível no topo)
        - Inclui todos os extintores inspecionados no mês
        - Formato para impressão oficial
        
        ### 🧯 Abrigos
        - **Relatório de Status em PDF**
        - Status consolidado de todos os abrigos
        - Detalhes de inventário e inspeções
        
        ### 🔔 Alarmes
        - **Relatório Mensal** ou **Semestral**
        - Selecione o período desejado
        - Inclui todas as inspeções do período
        
        ### 💨 Multigás
        - Relatórios de calibração disponíveis na aba de inspeção
        
        ---
        
        ### 📝 Como Gerar um Relatório:
        
        1. **Vá até a aba do equipamento** desejado
        2. **Procure a seção de relatórios** (geralmente no topo, dentro de um expander)
        3. **Selecione o período** (mês/ano ou semestre)
        4. **Clique em "Gerar Relatório"**
        5. **Aguarde** - uma nova janela abrirá automaticamente
        6. **Imprima ou salve** como PDF usando Ctrl+P
        
        ---
        
        ### 💡 Dicas para Relatórios:
        
        - ✅ Relatórios são gerados **em tempo real** com dados atualizados
        - 📅 Você pode gerar relatórios de **períodos passados**
        - 🖨️ Use a opção "Salvar como PDF" do navegador ao invés de imprimir
        - 📊 Relatórios incluem **gráficos e métricas** automaticamente
        - 🔒 Dados dos relatórios são **confiáveis para auditorias**
        """)
    
    # ===================================================================
    # SEÇÃO 5: RECURSOS ESPECIAIS POR EQUIPAMENTO
    # ===================================================================
    st.markdown("---")
    st.subheader("⚙️ Recursos Especiais de Cada Aba")
    
    col1, col2 = st.columns(2)
    
    with col1:
        with st.expander("🔥 Recursos dos Extintores"):
            st.markdown("""
            **Funcionalidades Exclusivas:**
            
            - 📍 **Mapa de Localização**
              - Mostra local físico de cada extintor
              - Integração com coordenadas GPS
            
            - 🔄 **Regularização em Massa** (Admin)
              - Regulariza TODOS os vencidos de uma vez
              - Útil após auditorias
            
            - 📅 **Cálculo Automático de Datas**
              - Sistema calcula N1 (1 mês), N2 (1 ano), N3 (5 anos)
              - Baseado na última manutenção
            
            - 🗑️ **Baixa Definitiva**
              - Remove equipamento condenado
              - Registra substituto obrigatório
              - Mantém histórico completo
            """)
        
        with st.expander("💧 Recursos das Mangueiras"):
            st.markdown("""
            **Funcionalidades Exclusivas:**
            
            - 🔴 **Detecção de Reprovação**
              - Identifica automaticamente mangueiras condenadas
              - Status baseado em palavras-chave no resultado
            
            - 🗑️ **Sistema de Baixa**
              - Registra baixa com substituta
              - Remove do inventário ativo
              - Mantém log de disposição
            
            - 📄 **Links para Certificados**
              - Acesso direto aos PDFs de teste
              - Armazenados no Google Drive
            """)
        
        with st.expander("🧯 Recursos dos Abrigos"):
            st.markdown("""
            **Funcionalidades Exclusivas:**
            
            - 📦 **Gestão de Inventário**
              - Checklist personalizado por abrigo
              - Rastreia cada item individualmente
            
            - 📄 **Relatório Visual**
              - Status consolidado de todos os abrigos
              - Formato para impressão oficial
            
            - 🔍 **Detalhes de Inspeção**
              - Mostra item por item inspecionado
              - Status individual de cada componente
            """)
        
        with st.expander("💨 Recursos do SCBA"):
            st.markdown("""
            **Funcionalidades Exclusivas:**
            
            - 🧪 **Testes Posi3 USB**
              - Importa dados de testes funcionais
              - Valida vazamentos e alarmes
            
            - 👁️ **Inspeções Visuais**
              - Checklist separado para cilindro e máscara
              - Status individual de componentes
            
            - 💨 **Qualidade do Ar**
              - Rastreia validade de laudos
              - Alerta sobre vencimentos
            """)
    
    with col2:
        with st.expander("🚿 Recursos dos Chuveiros/Lava-Olhos"):
            st.markdown("""
            **Funcionalidades Exclusivas:**
            
            - ✅ **Checklist NBR 16071**
              - Checklist completo por categoria
              - Condições físicas, hidráulicas, funcionalidade
            
            - 📸 **Fotos Obrigatórias**
              - Exige foto para não conformidades
              - Evidência visual de problemas
            
            - 🔄 **Regularização Automática**
              - Ao resolver problema, sistema aprova automaticamente
              - Gera nova inspeção conforme
            """)
        
        with st.expander("☁️ Recursos das Câmaras de Espuma"):
            st.markdown("""
            **Funcionalidades Exclusivas:**
            
            - 📍 **Agrupamento por Local**
              - Dashboard agrupa por localização
              - Facilita inspeções em área
            
            - 🔍 **Tipos de Inspeção**
              - Visual mensal
              - Funcional trimestral
              - Completa anual
            
            - 📊 **Status Consolidado**
              - Vê todas de um local de uma vez
              - Identifica problemas por área
            """)
        
        with st.expander("💨 Recursos do Multigás"):
            st.markdown("""
            **Funcionalidades Exclusivas:**
            
            - 📅 **Duplo Monitoramento**
              - Calibração anual (obrigatória)
              - Bump tests periódicos (recomendados)
            
            - 🔴 **Alertas Específicos**
              - Calibração vencida
              - Último bump test reprovado
              - Nunca testado
            
            - 📜 **Certificados de Calibração**
              - Link direto para certificado
              - Rastreamento de validade
            """)
        
        with st.expander("🔔 Recursos dos Alarmes"):
            st.markdown("""
            **Funcionalidades Exclusivas:**
            
            - 📅 **Relatórios Flexíveis**
              - Mensal ou semestral
              - Seleção de período customizada
            
            - 🔍 **Checklist Completo**
              - Central, baterias, sensores, sirenes
              - Teste funcional completo
            
            - 📊 **Dashboard Consolidado**
              - Status geral de todos os sistemas
              - Identifica falhas críticas
            """)
    
    # ===================================================================
    # SEÇÃO 6: DICAS E BOAS PRÁTICAS
    # ===================================================================
    st.markdown("---")
    st.subheader("💡 Dicas e Boas Práticas")
    
    with st.expander("⚡ Para Usar a Dashboard com Máxima Eficiência"):
        st.markdown("""
        ### 🎯 Rotina Diária Recomendada
        
        **1. Início do Dia (5 minutos)**
        - ✅ Acesse a dashboard
        - 🔴 Filtre por "VENCIDO" em todas as abas
        - 📋 Faça lista de prioridades do dia
        
        **2. Ao Longo do Dia**
        - ✍️ Registre ações corretivas conforme resolve problemas
        - 📸 Tire fotos de evidência
        - 🔄 Verifique se status atualizou
        
        **3. Final do Dia (5 minutos)**
        - ✅ Revise o que foi resolvido
        - 📊 Veja métricas atualizadas
        - 📅 Planeje o próximo dia
        
        ---
        
        ### 🗓️ Rotina Semanal
        
        **Segunda-feira:**
        - 🟠 Priorize equipamentos com "PENDÊNCIAS"
        - 📋 Planeje ações corretivas da semana
        
        **Meio da Semana:**
        - 🔍 Revise equipamentos próximos do vencimento
        - 📅 Agende inspeções/manutenções futuras
        
        **Sexta-feira:**
        - 📊 Gere relatórios semanais
        - ✅ Confirme que tudo crítico foi resolvido
        
        ---
        
        ### 📅 Rotina Mensal
        
        **Primeira semana:**
        - 📄 Gere relatórios do mês anterior
        - 📊 Apresente métricas para gestão
        - 🎯 Defina metas do mês
        
        **Durante o mês:**
        - 🔍 Monitore tendências de conformidade
        - 📈 Compare com mês anterior
        
        **Última semana:**
        - ✅ Regularize tudo que for possível
        - 📋 Prepare relatório do mês
        
        ---
        
        ### 🚫 Erros Comuns a Evitar
        
        **❌ NÃO FAÇA:**
        - Deixar equipamentos 🔴 VENCIDOS por muito tempo
        - Ignorar status 🟠 COM PENDÊNCIAS
        - Registrar ações sem descrição detalhada
        - Esquecer de tirar fotos de evidência
        - Não documentar substituições
        
        **✅ FAÇA SEMPRE:**
        - Verificar dashboard diariamente
        - Registrar TODA ação corretiva realizada
        - Tirar fotos de evidência
        - Documentar motivos de baixa
        - Manter dados atualizados
        """)
    
    with st.expander("🔒 Garantindo Conformidade em Auditorias"):
        st.markdown("""
        ### 📋 Preparação para Auditoria
        
        **1 semana antes:**
        - ✅ Regularize TODOS os equipamentos vencidos
        - 🟢 Garanta que maioria está "OK"
        - 📄 Gere todos os relatórios mensais
        - 🗂️ Organize documentação
        
        **Durante a auditoria:**
        - 📊 Use a dashboard para mostrar status em tempo real
        - 📄 Imprima relatórios direto do sistema
        - 📸 Mostre fotos de evidências
        - 📋 Apresente histórico de ações corretivas
        
        ---
        
        ### 📊 Indicadores para Mostrar ao Auditor
        
        **Métricas Positivas:**
        - 🟢 % de equipamentos OK
        - ✅ Total de ações corretivas realizadas
        - 📈 Tendência de melhoria ao longo dos meses
        - 📅 Cumprimento de prazos
        
        **Se Houver Problemas:**
        - 📋 Mostre que estão **documentados**
        - 🗓️ Apresente **plano de ação** com prazos
        - 📸 Exiba **evidências** de correções em andamento
        - 💼 Demonstre **comprometimento** da gestão
        
        ---
        
        ### 🎯 Dicas de Ouro para Auditorias
        
        1. **Transparência Total**
           - Mostre tudo, inclusive problemas
           - Demonstre que problemas estão sob controle
        
        2. **Rastreabilidade Completa**
           - Cada ação tem responsável
           - Cada problema tem histórico
           - Cada correção tem evidência
        
        3. **Conformidade Documentada**
           - Relatórios mensais completos
           - Fotos de todas as não conformidades
           - Registros de todas as ações
        
        4. **Melhoria Contínua**
           - Mostre evolução ao longo do tempo
           - Demonstre redução de problemas
           - Apresente ações preventivas
        """)
    
    # ===================================================================
    # SEÇÃO 7: PROBLEMAS COMUNS
    # ===================================================================
    st.markdown("---")
    st.subheader("🔧 Solucionando Problemas Comuns")
    
    with st.expander("❓ Perguntas Frequentes"):
        st.markdown("""
        ### **P: A dashboard não carregou nenhum dado. O que fazer?**
        
        **R:** Clique no botão "Limpar Cache e Recarregar Dados" no topo da página.
        - Se ainda não funcionar, verifique se há inspeções cadastradas
        - Confirme que você está no ambiente correto (empresa/unidade)
        
        ---
        
        ### **P: O status não atualizou após registrar uma ação. Por quê?**
        
        **R:** Aguarde alguns segundos e atualize a página (F5).
        - O sistema limpa o cache automaticamente, mas pode levar alguns segundos
        - Se persistir, clique em "Limpar Cache"
        
        ---
        
        ### **P: Como sei se um equipamento precisa de ação?**
        
        **R:** Veja a cor do status:
        - 🔴 **VENCIDO** → Ação CRÍTICA necessária
        - 🟠 **PENDÊNCIAS** → Ação URGENTE necessária
        - 🔵 **PENDENTE** → Programe inspeção
        - 🟢 **OK** → Nenhuma ação necessária
        
        ---
        
        ### **P: Posso apagar um registro de inspeção?**
        
        **R:** NÃO. O sistema não permite exclusão por questões de auditoria.
        - Registros são permanentes por rastreabilidade
        - Se houver erro, registre uma nova inspeção correta
        - O sistema sempre considera o registro mais recente
        
        ---
        
        ### **P: O equipamento sumiu da dashboard. O que aconteceu?**
        
        **R:** Pode ter sido:
        - 🗑️ Dado **baixa definitiva** (condenado)
        - 🔄 **Substituído** por outro equipamento
        - Confira no "Histórico e Logs" para ver o que aconteceu
        
        ---
        
        ### **P: Como faço backup dos dados?**
        
        **R:** Os dados estão automaticamente salvos no Google Sheets e Drive.
        - Sistema faz backup automático na nuvem
        - Você pode gerar relatórios PDF para guardar offline
        - Histórico completo fica preservado permanentemente
        
        ---
        
        ### **P: Quantos usuários podem acessar ao mesmo tempo?**
        
        **R:** Ilimitado!
        - Sistema é multi-usuário
        - Dados sincronizam automaticamente
        - Cada usuário vê dados da sua empresa/unidade
        
        ---
        
        ### **P: Como compartilho a dashboard com minha equipe?**
        
        **R:** Envie o link do sistema e oriente sobre login:
        - Cada pessoa deve ter conta Google autorizada
        - Admin cadastra novos usuários no sistema
        - Cada um terá seu próprio nível de acesso
        
        ---
        
        ### **P: Os dados são seguros?**
        
        **R:** SIM! Múltiplas camadas de segurança:
        - ✅ Login obrigatório com Google
        - ✅ Dados isolados por empresa/unidade
        - ✅ Backup automático no Google Cloud
        - ✅ Log de auditoria de todas as ações
        - ✅ Conformidade com LGPD
        """)
    
    with st.expander("🚨 Problemas Técnicos e Soluções"):
        st.markdown("""
        ### ⚠️ "Erro ao carregar dados da planilha"
        
        **Possíveis causas:**
        - Conexão com internet instável
        - Permissões do Google Sheets
        - Cache corrompido
        
        **Soluções:**
        1. Verifique sua conexão com a internet
        2. Clique em "Limpar Cache e Recarregar"
        3. Faça logout e login novamente
        4. Se persistir, contate o administrador
        
        ---
        
        ### ⚠️ "Planilha vazia ou sem dados"
        
        **Possíveis causas:**
        - Ambiente não configurado
        - Primeira vez usando o sistema
        - Filtros muito restritivos
        
        **Soluções:**
        1. Verifique se está no ambiente correto
        2. Remova todos os filtros (selecione todos os status)
        3. Confirme que há inspeções cadastradas
        4. Cadastre equipamentos nas abas de inspeção
        
        ---
        
        ### ⚠️ "Não consigo registrar ação corretiva"
        
        **Possíveis causas:**
        - Campos obrigatórios não preenchidos
        - Foto obrigatória não anexada (para baixa)
        - Falta de permissões de edição
        
        **Soluções:**
        1. Preencha TODOS os campos obrigatórios
        2. Anexe foto quando obrigatório
        3. Verifique seu nível de acesso (precisa ser Editor)
        4. Tente novamente após alguns segundos
        
        ---
        
        ### ⚠️ "Foto não foi enviada / Upload falhou"
        
        **Possíveis causas:**
        - Arquivo muito grande (>10MB)
        - Formato não suportado
        - Problema de conexão
        
        **Soluções:**
        1. Reduza o tamanho da foto (tire com qualidade menor)
        2. Use formatos: JPG, JPEG ou PNG
        3. Verifique sua conexão
        4. Tente tirar foto direto pela câmera ao invés de upload
        
        ---
        
        ### ⚠️ "Relatório não abre / Impressão não funciona"
        
        **Possíveis causas:**
        - Bloqueador de pop-ups ativo
        - Navegador desatualizado
        
        **Soluções:**
        1. **Desabilite o bloqueador de pop-ups** para este site
        2. Atualize seu navegador para última versão
        3. Tente usar Chrome ou Edge
        4. Permita pop-ups temporariamente
        
        ---
        
        ### ⚠️ "Dashboard está lenta / Travando"
        
        **Possíveis causas:**
        - Muito equipamentos carregados
        - Cache acumulado
        - Muitas abas abertas
        
        **Soluções:**
        1. Clique em "Limpar Cache e Recarregar"
        2. Feche outras abas do navegador
        3. Use filtros para reduzir dados exibidos
        4. Atualize a página (F5)
        """)
    
    # ===================================================================
    # SEÇÃO 8: RECURSOS AVANÇADOS
    # ===================================================================
    st.markdown("---")
    st.subheader("🎓 Recursos Avançados")
    
    with st.expander("🔐 Para Administradores: Funcionalidades Exclusivas"):
        st.markdown("""
        ### 👑 Poderes de Administrador
        
        Se você tem perfil de **Administrador**, verá recursos extras:
        
        ---
        
        #### 🔥 Extintores - Regularização em Massa
        
        **Localização:** Aba Extintores → Expander "⚙️ Ações de Administrador"
        
        **O que faz:**
        - Identifica TODOS os extintores com inspeção mensal vencida
        - Cria automaticamente uma inspeção "Aprovada" para cada um
        - Data da inspeção = hoje
        - Recalcula próximos vencimentos
        
        **Quando usar:**
        - Após período sem inspeções (férias, feriados)
        - Pós-auditoria para normalizar sistema
        - Implantação inicial do sistema
        
        **⚠️ CUIDADO:**
        - Usa com responsabilidade - cria registros em massa
        - Confirme que equipamentos estão realmente OK
        - Use apenas se fisicamente verificou os equipamentos
        - Ação é irreversível
        
        ---
        
        #### 👥 Gerenciamento de Usuários
        
        **Localização:** Menu Principal → Super Admin
        
        **Funcionalidades:**
        - Criar novos usuários
        - Definir níveis de acesso (Admin, Editor, Viewer)
        - Atribuir ambientes/unidades
        - Revogar acessos
        - Ver log de auditoria completo
        
        ---
        
        #### 📊 Relatórios Consolidados
        
        **O que você pode fazer:**
        - Gerar relatórios de TODAS as unidades
        - Ver estatísticas gerais da empresa
        - Comparar desempenho entre unidades
        - Exportar dados para análise externa
        
        ---
        
        #### 🔍 Auditoria Avançada
        
        **Acesso total ao log:**
        - Toda ação de todos os usuários
        - Timestamps precisos
        - IP de origem (quando disponível)
        - Antes/depois de alterações
        """)
    
    with st.expander("📊 Análise de Tendências e KPIs"):
        st.markdown("""
        ### 📈 Como Usar a Dashboard para Análise Estratégica
        
        A dashboard não é só operacional - use-a estrategicamente!
        
        ---
        
        #### 🎯 KPIs Principais para Monitorar
        
        **1. Taxa de Conformidade**
        ```
        Conformidade = (Equipamentos OK / Total de Equipamentos) × 100
        ```
        - **Meta:** Mínimo 95%
        - **Ideal:** 98-100%
        - **Crítico:** Abaixo de 90%
        
        **2. Tempo Médio de Resposta**
        ```
        Tempo = Data de Correção - Data de Identificação
        ```
        - **Meta:** Máximo 7 dias
        - **Ideal:** 1-3 dias
        - **Crítico:** Acima de 15 dias
        
        **3. Taxa de Reincidência**
        ```        Reincidência = (Problemas Repetidos / Total de Problemas) × 100
        ```
        - **Meta:** Máximo 5%
        - **Ideal:** 0-2%
        - **Crítico:** Acima de 10%
        
        ---
        
        #### 📊 Análises Mensais Recomendadas
        
        **Compare mês a mês:**
        - Número de equipamentos vencidos
        - Ações corretivas realizadas
        - Equipamentos substituídos
        - Não conformidades encontradas
        
        **Identifique padrões:**
        - Quais equipamentos têm mais problemas?
        - Quais locais precisam mais atenção?
        - Há sazonalidade nos problemas?
        - Fornecedores mais confiáveis?
        
        **Ações preventivas:**
        - Substitua proativamente equipamentos problemáticos
        - Reforce inspeções em locais críticos
        - Treine equipe em pontos fracos
        - Ajuste frequência de manutenções
        
        ---
        
        #### 💡 Insights Avançados
        
        **Análise de Custo-Benefício:**
        - Compare custo de manutenção vs substituição
        - Identifique equipamentos "caros" de manter
        - Planeje renovação de frota
        
        **Gestão de Estoque:**
        - Quantos extintores de cada tipo?
        - Há redundância suficiente?
        - Precisa aumentar inventário?
        
        **Conformidade Legal:**
        - % de atendimento às normas
        - Documentação completa?
        - Pronto para auditoria?
        """)
    
    # ===================================================================
    # SEÇÃO 9: INTEGRAÇÃO COM OUTROS MÓDULOS
    # ===================================================================
    st.markdown("---")
    st.subheader("🔗 Integração com Outros Módulos do Sistema")
    
    with st.expander("🧭 Como a Dashboard se Conecta com Outras Áreas"):
        st.markdown("""
        ### 🎯 Fluxo Completo do Sistema
        
        A dashboard é o **centro de controle**, mas faz parte de um sistema maior:
        
        ---
        
        #### 📱 1. Inspeções → 📊 Dashboard → 📄 Relatórios
        
        **Fluxo:**
        1. **Inspetor** realiza inspeção (aba de inspeção específica)
        2. Dados salvos automaticamente no Google Sheets
        3. **Dashboard atualiza** instantaneamente
        4. **Gestor** vê status e toma decisões
        5. **Sistema gera** relatórios automáticos
        
        ---
        
        #### 🔥 Exemplo Prático - Extintores:
        
        ```
        📱 Aba "Inspeção de Extintores"
           ↓ (Inspetor usa QR Code ou manual)
           
        💾 Dados salvos no Google Sheets
           ↓ (Automático)
           
        📊 Dashboard de Extintores
           ↓ (Calcula status e vencimentos)
           
        👀 Gestor vê problema
           ↓ (Registra ação corretiva)
           
        ✅ Status atualiza para OK
           ↓ (Histórico preservado)
           
        📄 Relatório mensal inclui tudo
        ```
        
        ---
        
        #### 🗂️ Módulos Relacionados:
        
        **1. Histórico e Logs**
        - Acesse pelo menu principal
        - Veja linha do tempo completa
        - Rastreie cada ação realizada
        
        **2. Utilitários**
        - Ferramentas auxiliares
        - Boletins de remessa
        - Consultas especiais
        
        **3. Super Admin**
        - Configurações gerais
        - Gestão de usuários
        - Cadastros globais
        
        ---
        
        #### 💾 Onde Ficam os Dados?
        
        **Google Sheets (Tabelas):**
        - Inventário de equipamentos
        - Histórico de inspeções
        - Log de ações corretivas
        - Usuários e permissões
        
        **Google Drive (Arquivos):**
        - Fotos de não conformidades
        - PDFs de certificados
        - Relatórios de manutenção
        - Documentos anexados
        
        **Sistema (Processamento):**
        - Cálculo de status
        - Geração de alertas
        - Consolidação de dados
        - Geração de relatórios
        """)
    
    # ===================================================================
    # SEÇÃO 10: CALL TO ACTION E PRÓXIMOS PASSOS
    # ===================================================================
    st.markdown("---")
    st.success("""
    ### 🚀 Pronto para Usar a Dashboard?
    
    **Você já aprendeu:**
    - ✅ O que é a dashboard e para que serve
    - ✅ Como interpretar os status e métricas
    - ✅ Como navegar e filtrar equipamentos
    - ✅ Como registrar ações corretivas
    - ✅ Como gerar relatórios profissionais
    - ✅ Dicas de boas práticas e análises
    
    ---
    
    ### 📋 Próximos Passos Recomendados:
    
    **1. Explore uma Aba**
    - Comece pela aba **🔥 Extintores** (mais usada)
    - Clique em alguns equipamentos para ver detalhes
    - Familiarize-se com a interface
    
    **2. Gere um Relatório de Teste**
    - Escolha um mês passado
    - Gere o relatório
    - Veja como fica formatado
    
    **3. Pratique Registrar uma Ação**
    - Se houver algum equipamento 🟠 ou 🔴
    - Tente registrar uma ação corretiva fictícia
    - Veja como o status atualiza
    
    **4. Estabeleça uma Rotina**
    - Defina horário fixo para verificar dashboard
    - Configure alertas/lembretes
    - Compartilhe com sua equipe
    
    ---
    
    ### 💬 Precisa de Ajuda?
    
    - 📧 **Email:** suporte@sistema.com.br
    - 💬 **Chat:** Use o botão de suporte no canto da tela
    - 📚 **Documentação:** Menu Principal → Documentação
    - 🎥 **Vídeos:** Canal no YouTube (em breve)
    
    ---
    
    **Lembre-se:** A dashboard só é útil se você usar regularmente! 
    
    Faça dela parte da sua rotina diária de segurança. 💪
    """)
    
    # ===================================================================
    # FOOTER COM INFORMAÇÕES ADICIONAIS
    # ===================================================================
    st.markdown("---")
    st.caption("""
    📌 **Versão do Sistema:** 3.2  
    🔄 **Última Atualização:** Outubro/2025  
    📖 **Documentação Completa:** Acesse o menu "Documentação" no sistema  
    🆘 **Suporte Técnico:** Disponível de Segunda a Sexta, 8h às 18h  
    """)
    
    # Dica visual final
    st.info("""
    💡 **Dica Final:** Adicione esta página aos favoritos do seu navegador! 
    Volte aqui sempre que tiver dúvidas sobre como usar a dashboard.
    """, icon="💡")
   
    
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
    st.header("📖 Guia de Uso - Sistema de Conjuntos Autônomos (SCBA)")
    
    # Alerta de priorização
    st.success(
        "⚡ **Recomendação:** Para inspeções regulares, use a **Inspeção Visual Periódica**! "
        "É completa, guiada e não requer upload de arquivos."
    )
    
    st.markdown("---")
    
    # Comparação de métodos
    st.subheader("🎯 Escolha o Melhor Método para Sua Situação")
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        st.markdown("""
        ### 🔍 Inspeção Visual
        **⚡ PARA USO REGULAR - RECOMENDADA**
        
        **Tempo:** ~5-10 minutos por SCBA
        
        **Ideal para:**
        - ✅ Inspeções mensais obrigatórias
        - ✅ Verificações antes do uso
        - ✅ Inspeções após treinamento
        - ✅ Checklist completo e guiado
        
        **Como funciona:**
        1. Selecione o SCBA da lista
        2. Realize os 3 testes funcionais
        3. Faça a inspeção visual de cada componente
        4. Sistema gera status automático
        5. Salve - Pronto! ✅
        
        **O que inclui:**
        - 🧪 Teste de Estanqueidade
        - 🔔 Teste do Alarme Sonoro
        - 😷 Teste de Vedação da Máscara
        - 👁️ Inspeção Visual Completa
        - 📋 Checklist de 13+ itens
        
        **Vantagens:**
        - ⚡ Rápida e eficiente
        - 📋 Guiada passo a passo
        - 🤖 Avaliação automática
        - 📊 Rastreabilidade completa
        """)
    
    with col2:
        st.markdown("""
        ### 🤖 Testes Posi3 (IA)
        **🔬 INTELIGÊNCIA ARTIFICIAL**
        
        **Tempo:** ~2-3 minutos (múltiplos SCBAs)
        
        **Ideal para:**
        - 📅 Testes anuais obrigatórios
        - 🏢 Serviços de empresas certificadas
        - 📄 Processar relatórios Posi3 USB
        - 📋 Registro de laudos técnicos
        
        **Como funciona:**
        1. Receba relatório Posi3 da empresa
        2. Faça upload do PDF
        3. IA extrai todos os dados automaticamente
        4. Revise os testes extraídos
        5. Confirme e salve com PDF anexado
        
        **Vantagens:**
        - 🤖 IA processa tudo sozinha
        - 📄 PDF fica anexado ao registro
        - 📊 Múltiplos equipamentos de uma vez
        - ⏱️ Economiza tempo de digitação
        - 🔬 Dados técnicos precisos
        
        **Requer:** Plano Premium IA
        """)
    
    with col3:
        st.markdown("""
        ### 💨 Qualidade do Ar
        **🧪 ANÁLISE DE COMPRESSOR**
        
        **Tempo:** ~2-3 minutos
        
        **Ideal para:**
        - 📅 Análise trimestral obrigatória
        - 🏭 Laudo do compressor
        - 🔬 Análise laboratorial
        - 📋 Conformidade NBR 12543
        
        **Como funciona:**
        - **Com IA:** Upload do laudo PDF
        - **Manual:** Digite resultado e cilindros
        
        Sistema registra para todos os cilindros analisados automaticamente.
        
        **Vantagens:**
        - 🤖 IA extrai dados do laudo (Premium IA)
        - 📄 PDF anexado ao registro
        - 🔢 Registra múltiplos cilindros de uma vez
        - 📊 Rastreabilidade do ar comprimido
        """)
    
    st.markdown("---")
    
    # Fluxo de trabalho recomendado
    st.subheader("🎯 Fluxo de Trabalho Recomendado")
    
    st.info("""
    **Para Máxima Eficiência, Siga Esta Ordem:**
    
    1️⃣ **Inspeções Mensais/Pré-uso** → Use **"Inspeção Visual Periódica"** (mais completa!)
    
    2️⃣ **Recebeu Relatório Posi3 Anual** → Use **"Teste de Equipamentos (IA)"** (IA processa)
    
    3️⃣ **Recebeu Laudo de Qualidade do Ar** → Use **"Laudo de Qualidade do Ar (IA)"**
    
    4️⃣ **Cadastrar SCBA Novo** → Use **"Cadastrar Novo SCBA"**
    """)
    
    st.markdown("---")
    
    # Perguntas frequentes
    st.subheader("❓ Perguntas Frequentes")
    
    with st.expander("🔍 Qual a diferença entre Inspeção Visual e Teste Posi3?"):
        st.markdown("""
        **Inspeção Visual Periódica:**
        - 📅 Feita **mensalmente** ou antes de cada uso
        - 👤 **Você mesmo faz** no local
        - ⏱️ Tempo: 5-10 minutos
        - 🔧 **Testes básicos** (estanqueidade, alarme, vedação)
        - 👁️ Verificação visual de componentes
        - 💰 Custo: Zero
        - 🎯 Objetivo: Verificar se está **seguro para uso**
        
        **Teste Posi3 Anual:**
        - 📅 Feito **anualmente** (obrigatório)
        - 🏢 **Empresa especializada** faz em laboratório
        - ⏱️ Equipamento fica fora alguns dias
        - 🔬 **Testes de precisão** com equipamento Posi3 USB
        - 📋 Gera laudo técnico com validade
        - 💰 Custo: R$ 150-300 por equipamento
        - 🎯 Objetivo: **Certificação oficial** de conformidade
        
        **Analogia:**
        - Inspeção Visual = Você verificar o carro antes de viajar
        - Teste Posi3 = Revisão anual na concessionária com certificado
        
        **Ambos são obrigatórios e complementares!**
        """)
    
    with st.expander("⏰ Com que frequência devo fazer cada inspeção?"):
        st.markdown("""
        **Calendário Obrigatório:**
        
        📅 **Mensal:**
        - Inspeção Visual Periódica completa
        - Todos os 3 testes funcionais
        - Checklist visual de todos os componentes
        
        📅 **Antes de Cada Uso (Situações Críticas):**
        - Inspeção Visual simplificada
        - Teste de vedação da máscara
        - Verificação rápida de pressão
        
        📅 **Anual:**
        - Teste Posi3 por empresa certificada
        - Laudos técnicos com validade de 1 ano
        
        📅 **Extraordinária:**
        - Após quedas ou impactos
        - Após exposição a produtos químicos
        - Após longos períodos sem uso
        - Quando houver qualquer suspeita de problema
        
        **💡 Dica:** Configure lembretes mensais no sistema!
        """)
    
    with st.expander("😷 Como faço a limpeza e manutenção básica do SCBA?"):
        st.markdown("""
        ### **Limpeza Após Cada Uso**
        - 🧼 Lave a **máscara facial** com água morna e sabão neutro
        - 💦 Enxágue abundantemente em **água corrente**
        - 🌬️ Seque naturalmente em local arejado e à sombra
        - 🚫 Não utilize solventes, álcool, cloro ou produtos abrasivos
        - ✅ Se necessário, aplique desinfetante aprovado pelo fabricante

        ### **Cuidados Semanais**
        - 🔎 Verifique a integridade de mangueiras e conexões
        - 📊 Confirme a pressão do cilindro
        - 👓 Inspecione visor/lente contra riscos, rachaduras ou manchas
        - ⚙️ Teste a válvula de demanda (inalação/exalação suave)

        ### **Manutenção Mensal**
        - 🧰 Realize inspeção funcional completa:
            - Teste de estanqueidade
            - Teste de alarme sonoro
            - Teste de vedação da máscara
        - 📝 Registre os resultados no sistema para rastreabilidade
        - 🔄 Troque filtros ou componentes conforme manual do fabricante

        ### **Armazenamento Correto**
        - 📦 Guarde o SCBA em armário fechado, limpo e seco
        - 🌡️ Evite calor excessivo, umidade e exposição direta ao sol
        - 🪛 Mantenha pressão residual no cilindro (~30 bar)
        - 🧯 Nunca armazene próximo a óleo, graxa ou contaminantes
        - 🚫 Não deixe o equipamento jogado no chão ou sujeito a impactos

        ### **Boas Práticas**
        - 👥 Apenas pessoal treinado deve higienizar e inspecionar
        - 📋 Registre cada inspeção e limpeza em planilha ou sistema
        - ⏰ Nunca ultrapasse os prazos de inspeção periódica
        - 💡 Crie rotina: limpeza e checklist sempre após cada uso
        """)



def instru_multigas():
    """Instruções para Multigás"""
    st.header("📖 Guia de Uso - Sistema de Detectores Multigás")

    # Alerta de priorização
    st.success(
        "⚡ **Recomendação:** Para testes de resposta (Bump Test) diários, "
        "use o **Registro Teste de Resposta**! É rápido, prático e não requer upload de arquivos."
    )

    st.markdown("---")

    # Comparação de métodos
    st.subheader("🎯 Escolha o Melhor Método para Sua Situação")

    col1, col2, col3 = st.columns(3)

    with col1:
        st.markdown("""
        ### 📋 Teste de Resposta
        **⚡ PARA USO DIÁRIO - RECOMENDADO**
        
        **Tempo:** ~1-2 minutos por detector
        
        **Ideal para:**
        - ✅ Bump tests diários/semanais
        - ✅ Verificações rápidas de resposta
        - ✅ Testes periódicos de rotina
        - ✅ Testes extraordinários (após quedas)
        
        **Como funciona:**
        1. Selecione o detector da lista
        2. Veja os valores de referência do cilindro
        3. Insira os valores encontrados no teste
        4. Sistema aprova/reprova automaticamente
        5. Salve - Pronto! ✅
        
        **Vantagens:**
        - ⚡ Extremamente rápido
        - 🤖 Avaliação automática
        - 📊 Gera relatório mensal
        - 🔄 Permite atualizar valores do cilindro
        """)

    with col2:
        st.markdown("""
        ### 📄 Calibração Anual (IA)
        **🤖 INTELIGÊNCIA ARTIFICIAL**
        
        **Tempo:** ~2-3 minutos
        
        **Ideal para:**
        - 📅 Calibrações anuais obrigatórias
        - 📄 Processar certificados externos
        - 🏢 Serviços de empresas terceirizadas
        - 📋 Manter conformidade legal
        
        **Como funciona:**
        1. Faça upload do certificado PDF
        2. IA extrai todos os dados automaticamente
        3. Revise as informações extraídas
        4. Se for detector novo, cadastre na hora
        5. Confirme e salve com PDF anexado
        
        **Vantagens:**
        - 🤖 IA processa tudo sozinha
        - 📄 PDF fica anexado ao registro
        - 🆕 Cadastra detectores novos automaticamente
        - ⏱️ Economiza tempo de digitação
        
        **Requer:** Plano Premium IA
        """)

    with col3:
        st.markdown("""
        ### ✍️ Cadastro Manual
        **🆕 PARA EQUIPAMENTOS NOVOS**
        
        **Tempo:** ~2-3 minutos
        
        **Ideal para:**
        - 🆕 Cadastrar detector novo
        - 🔧 Configurar valores do cilindro
        - ✏️ Ajustes e correções
        - 📝 Primeira configuração
        
        **Como funciona:**
        - **Completo:** Preenche todos os campos
        - **Simplificado:** Apenas dados essenciais
        
        Valores padrão do cilindro:
        - LEL: 50% LEL
        - O²: 18% Vol
        - H²S: 25 ppm
        - CO: 100 ppm
        
        **Vantagens:**
        - 🆕 Para equipamentos novos
        - 🔧 Controle total dos dados
        - ⚙️ Configura valores de referência
        """)

    st.markdown("---")

    # Fluxo de trabalho recomendado
    st.subheader("🎯 Fluxo de Trabalho Recomendado")

    st.info("""
    **Para Máxima Eficiência, Siga Esta Ordem:**
    
    1️⃣ **Testes Diários/Semanais (Bump Test)** → Use **"Registrar Teste de Resposta"** (mais rápido!)
    
    2️⃣ **Recebeu Certificado de Calibração Anual** → Use **"Calibração Anual (PDF)"** (IA processa)
    
    3️⃣ **Cadastrar Detector Novo** → Use **"Cadastro Manual"** (completo ou simplificado)
    
    4️⃣ **Relatório Mensal** → Gere na própria aba de "Registrar Teste de Resposta"
    """)

    st.markdown("---")

    # Guia detalhado de Teste de Resposta
    st.subheader("📋 Guia Completo: Registro de Teste de Resposta")

    with st.expander("🚀 Passo a Passo Detalhado", expanded=True):
        st.markdown("""
        #### **O que é o Bump Test (Teste de Resposta)?**
        
        É um teste rápido que verifica se o detector está **respondendo corretamente** aos gases.
        Você expõe o detector a concentrações conhecidas de gás (do cilindro de referência) e 
        verifica se as leituras do equipamento estão dentro da margem de erro aceitável.
        
        ---
        
        #### **Quando fazer o Bump Test?**
        
        ✅ **Testes Periódicos (Recomendado):**
        - 📅 **Diariamente:** Antes de cada uso em ambientes críticos
        - 📅 **Semanalmente:** Para uso regular
        - 📅 **Mensalmente:** Mínimo obrigatório
        
        ⚠️ **Testes Extraordinários (Obrigatórios):**
        - Após quedas ou impactos no equipamento
        - Após exposição a concentrações extremas de gás
        - Após manutenção ou reparo
        - Se o equipamento apresentar comportamento anormal
        
        ---
        
        #### **Passo 1: Selecione o Detector** 🔍
        
        1. Na aba **"📋 Registrar Teste de Resposta"**
        2. No dropdown, escolha o detector que será testado
        3. O sistema mostrará:
           - Marca, Modelo e Número de Série
           - **Valores de Referência do Cilindro** (os valores esperados)
        
        💡 **Dica:** Os valores de referência são as concentrações do seu cilindro de gás padrão.
        
        ---
        
        #### **Passo 2: Configure Data/Hora e Tipo de Teste** ⏰
        
        - **Data e Hora:** Por padrão, usa o momento atual
        - **Tipo de Teste:**
          - 📅 **Periódico:** Testes de rotina regular
          - ⚠️ **Extraordinário:** Após eventos especiais (quedas, manutenção, etc.)
        
        ---
        
        #### **Passo 3: Realize o Teste Físico** 🧪
        
        **No equipamento físico:**
        1. Ligue o detector e aguarde estabilização
        2. Conecte o cilindro de gás de referência
        3. Exponha o detector ao gás por tempo suficiente
        4. Anote os valores exibidos no display do detector para cada gás:
           - **LEL** (% LEL) - Limite Explosivo Inferior
           - **O²** (% Vol) - Oxigênio
           - **H²S** (ppm) - Sulfeto de Hidrogênio
           - **CO** (ppm) - Monóxido de Carbono
        
        ---
        
        #### **Passo 4: Insira os Valores no Sistema** 📝
        
        Digite os valores que o detector mostrou durante o teste:
        - Se o detector não possui sensor para algum gás, deixe em branco
        - Digite exatamente o valor que apareceu no display
        - Não arredonde - use o valor preciso
        
        ---
        
        #### **Passo 5: Sistema Avalia Automaticamente** 🤖
        
        Ao clicar em **"💾 Salvar Teste"**, o sistema:
        
        1. **Compara** os valores encontrados com os de referência
        2. **Calcula** o erro percentual para cada gás
        3. **Aprova** se o erro for ≤ 10% (margem padrão do manual)
        4. **Reprova** se qualquer gás exceder a margem de erro
        5. **Gera observações automáticas** explicando o resultado
        
        **Exemplo de Avaliação:**
        Cilindro LEL: 50% → Detector mostrou: 52%
        Erro: 4% → ✅ APROVADO (dentro da margem de 10%)
        
        Cilindro CO: 100 ppm → Detector mostrou: 89 ppm
        Erro: 11% → ❌ REPROVADO (fora da margem de 10%)
        ---
        
        #### **Passo 6: Informe o Responsável** 👤
        
        - **Nome:** Quem realizou o teste
        - **Matrícula:** Identificação do operador
        
        Esses dados são importantes para rastreabilidade e auditoria.
        
        ---
        
        #### **🔄 Quando Atualizar Valores do Cilindro?**
        
        Use o toggle **"Atualizar valores de referência do cilindro?"** quando:
        
        ✅ **Você trocou o cilindro de gás** por um novo com concentrações diferentes
        ✅ **Recebeu um novo lote** de cilindros com valores atualizados
        ✅ **Os valores no rótulo do cilindro** são diferentes dos cadastrados
        
        ⚠️ **Atenção:** Os novos valores serão salvos **permanentemente** para este detector!
        
        ---
        
        #### **📊 Gerar Relatório Mensal**
        
        Ao topo da aba, há um expansível **"📄 Gerar Relatório Mensal de Bump Tests"**:
        
        1. Selecione o **Mês** e **Ano** desejado
        2. Sistema filtra todos os testes do período
        3. Clique em **"Gerar e Imprimir Relatório do Mês"**
        4. Relatório abre em nova janela pronto para impressão
        
        **O relatório inclui:**
        - Data e hora de cada teste
        - Equipamento testado (marca, modelo, série)
        - Valores encontrados (LEL, O², H²S, CO)
        - Tipo de teste (Periódico/Extraordinário)
        - Resultado (Aprovado/Reprovado)
        - Responsável pelo teste
        
        💡 **Ideal para:** Auditorias, inspeções, comprovação de conformidade
        
        ---
        
        #### **⚡ Dicas para Testes Mais Rápidos:**
        
        - 📋 Tenha uma **lista impressa** de todos os detectores para não esquecer nenhum
        - 🔢 **Anote os valores** em papel primeiro, depois digite todos de uma vez
        - ⏰ Faça os testes no **mesmo horário** todos os dias (cria rotina)
        - 🎯 Organize por **área** - teste todos os detectores de um setor por vez
        - 🔄 Mantenha o **cilindro de referência sempre acessível**
        - 📱 Use tablet ou celular em campo (sistema é responsivo)
        """)





