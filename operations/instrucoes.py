import streamlit as st

import streamlit as st

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
    st.header("📖 Guia de Uso - Conjuntos Autônomos (SCBA)")
    st.info("Instruções de SCBA serão adicionadas em breve.")


def instru_multigas():
    """Instruções para Multigás"""
    st.header("📖 Guia de Uso - Detectores Multigás")
    st.info("Instruções de Multigás serão adicionadas em breve.")
