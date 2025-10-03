import streamlit as st
import sys
import os
import pandas as pd
from datetime import date

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from operations.eyewash_operations import (
    save_eyewash_inspection, 
    save_new_eyewash_station, 
    CHECKLIST_QUESTIONS
)
from auth.auth_utils import (
    get_user_display_name, check_user_access, can_edit, has_ai_features
)
from config.page_config import set_page_config
from operations.history import load_sheet_data
from gdrive.config import EYEWASH_INVENTORY_SHEET_NAME

set_page_config()

def show_page():
    st.title("🚿 Gestão de Chuveiros e Lava-Olhos de Emergência")

    # Check if user has at least viewer permissions
    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return
        
    # ADICIONAR ESTA NOVA ABA NO INÍCIO
    tab_instrucoes, tab_inspection, tab_register, tab_quick_register = st.tabs([
        "📖 Como Usar",
        "📋 Realizar Inspeção", 
        "➕ Cadastrar Novo Equipamento (Completo)",
        "✍️ Cadastro Rápido"
    ])

    with tab_instrucoes:
        st.header("📖 Guia de Uso - Sistema de Inspeção de Chuveiros e Lava-Olhos")
        
        # Alerta de importância
        st.info(
            "🚨 **Importante:** Chuveiros de emergência e lava-olhos são equipamentos críticos de segurança. "
            "Inspeções mensais são OBRIGATÓRIAS conforme NBR 16071 e normas de saúde ocupacional."
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
            - ✅ Inspeções mensais obrigatórias
            - ✅ Auditorias e fiscalizações
            - ✅ Verificação completa de todos os itens
            - ✅ Documentação detalhada
            
            **Como funciona:**
            1. Selecione o equipamento no sistema
            2. Responda ao checklist completo
            3. Marque Conforme/Não Conforme/N/A
            4. Tire fotos se houver não conformidades
            5. Sistema salva e calcula próxima inspeção
            
            **Vantagens:**
            - 📋 Checklist completo e estruturado
            - 🔍 Cobertura total de itens críticos
            - 📸 Registro fotográfico obrigatório para NCs
            - 📅 Cálculo automático de vencimentos
            - 📊 Histórico completo rastreável
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
        → Cadastre todos os equipamentos usando **Cadastro Rápido** ou **Cadastro Completo**
        
        2️⃣ **Inspeção Mensal Obrigatória?**
        → Use **Realizar Inspeção** com o checklist completo
        
        3️⃣ **Novos Equipamentos Instalados?**
        → Use **Cadastrar Novo Equipamento** antes de inspecionar
        """)
        
        st.markdown("---")
        
        # Guia detalhado de inspeção
        st.subheader("📋 Guia Completo: Inspeção com Checklist")
        
        with st.expander("🚀 Passo a Passo Detalhado", expanded=True):
            st.markdown("""
            #### **Antes de Começar:**
            - 📱 Tenha um **celular ou tablet** para tirar fotos se necessário
            - 🔦 Verifique se há **boa iluminação** no local
            - 🧰 Leve ferramentas básicas para testar acionamento
            - 📊 Tenha acesso ao **histórico do equipamento** (sistema mostra automaticamente)
            
            ---
            
            #### **Passo 1: Selecione o Equipamento** 🔍
            
            1. Vá para a aba **"📋 Realizar Inspeção"**
            2. No menu dropdown, selecione o equipamento a ser inspecionado
            3. O sistema mostrará automaticamente:
               - 📍 **Localização** do equipamento
               - 📊 **Status atual** e última inspeção
               - ⏰ **Data de vencimento** da próxima inspeção
            
            💡 **Dica:** Se o equipamento não aparecer na lista, primeiro cadastre-o nas abas de cadastro.
            
            ---
            
            #### **Passo 2: Responda ao Checklist Completo** ✅
            
            O checklist está dividido em **categorias técnicas**:
            
            **🔧 1. Condições Físicas do Equipamento**
            - Estrutura sem danos, corrosão ou vazamentos?
            - Pintura e identificação em bom estado?
            - Ausência de obstruções físicas?
            
            **💧 2. Sistema Hidráulico**
            - Válvulas operando corretamente?
            - Conexões sem vazamentos?
            - Pressão da água adequada?
            
            **🚰 3. Funcionalidade e Testes**
            - Chuveiro aciona corretamente?
            - Lava-olhos funciona sem obstruções?
            - Fluxo de água adequado?
            - Tampa protetora (se houver) em bom estado?
            
            **📍 4. Acessibilidade e Sinalização**
            - Equipamento facilmente acessível?
            - Sinalização visível e em bom estado?
            - Área ao redor livre de obstáculos?
            - Iluminação adequada no local?
            
            **Para cada pergunta, marque:**
            - ✅ **Conforme** - Item está OK
            - ❌ **Não Conforme** - Item tem problema
            - ⚠️ **N/A** - Não se aplica a este equipamento
            
            ---
            
            #### **Passo 3: Registre Não Conformidades (Se Houver)** 📸
            
            **Quando marcar algum item como "Não Conforme":**
            
            1. O sistema **automaticamente exigirá** uma foto
            2. Você verá um aviso: *"Foram encontradas X não conformidades"*
            3. Use o campo de upload para anexar foto como evidência
            
            **Opções de foto:**
            - 📷 **Tirar foto na hora** (mais rápido, qualidade menor)
            - 📁 **Enviar da galeria** (melhor qualidade, mais detalhes)
            
            **Boas práticas para fotos:**
            - 🔦 Ilumine bem o problema
            - 📏 Mostre contexto (onde fica o problema)
            - 🎯 Foque no item não conforme
            - 📐 Tire de ângulos que evidenciem o problema
            
            ⚠️ **IMPORTANTE:** Não é possível salvar inspeção com não conformidades SEM foto!
            
            ---
            
            #### **Passo 4: Revise e Salve** 💾
            
            1. Revise todas as respostas do checklist
            2. Verifique se as fotos (se houver) foram anexadas
            3. Clique em **"✅ Salvar Inspeção"**
            4. Aguarde a confirmação de salvamento
            5. 🎉 Sistema mostrará mensagem de sucesso!
            
            **O sistema automaticamente:**
            - ✅ Calcula a **próxima data de inspeção** (30 dias)
            - 📊 Atualiza o **status do equipamento**
            - 📝 Registra no **histórico completo**
            - 🔔 Gera **alertas** se houver problemas críticos
            
            ---
            
            #### **⚡ Dicas para Inspeções Mais Eficientes:**
            
            **Preparação:**
            - 📋 Planeje uma **rota lógica** para inspecionar todos os equipamentos
            - 🗺️ Agrupe equipamentos por **área/setor** para economizar tempo
            - 🔋 Garanta que seu celular/tablet tenha **bateria suficiente**
            
            **Durante a inspeção:**
            - 💧 **Teste sempre o acionamento** - não confie apenas na aparência
            - 🕐 Faça inspeções no **mesmo dia do mês** para criar rotina
            - 📸 Tire fotos **antes de corrigir** qualquer problema simples
            - 📝 Seja **específico** nas observações
            
            **Após a inspeção:**
            - 🔧 Corrija **imediatamente** problemas simples (ex: limpar bocais)
            - 🚨 Reporte **urgentemente** problemas críticos (ex: sem água)
            - 📊 Revise o **relatório gerencial** para ver status geral
            - 📅 Agende correções para **não conformidades** identificadas
            
            ---
            
            #### **❓ Problemas Comuns e Soluções:**
            
            **"Equipamento não aparece na lista"**
            - ✅ Verifique se foi cadastrado nas abas de cadastro
            - ✅ Use **Cadastro Rápido** para adicionar ao sistema
            - ✅ Confirme se está no ambiente/empresa correto
            
            **"Não consigo anexar foto"**
            - ✅ Verifique o formato (JPG, JPEG, PNG)
            - ✅ Reduza o tamanho da foto se muito grande (>10MB)
            - ✅ Tente usar "Tirar foto" em vez de "Enviar da galeria"
            - ✅ Verifique sua conexão com a internet
            
            **"Inspeção não salva"**
            - ✅ Verifique se respondeu TODAS as perguntas
            - ✅ Confirme se anexou foto quando há não conformidades
            - ✅ Verifique sua conexão com a internet
            - ✅ Tente novamente após alguns segundos
            
            **"Como sei se o equipamento está vencido?"**
            - ✅ O sistema mostra automaticamente na lista de seleção
            - ✅ Equipamentos vencidos aparecem destacados
            - ✅ Veja o Dashboard para visão geral de vencimentos
            - ✅ Relatórios mensais listam todos os vencidos
            """)
        
        st.markdown("---")
        
        # Requisitos legais
        st.subheader("⚖️ Requisitos Legais e Normas")
        
        with st.expander("📜 Normas e Legislação Aplicável"):
            st.markdown("""
            #### **Principais Normas:**
            
            **NBR 16071:2020** - Chuveiros de emergência e lava-olhos
            - 📅 Inspeções **mensais** obrigatórias
            - 🔧 Testes de acionamento periódicos
            - 📋 Registro documental obrigatório
            - 💧 Requisitos de pressão e vazão
            
            **ANSI/ISEA Z358.1-2014** - Emergency Eyewash and Shower Equipment
            - 🚿 Padrões internacionais de referência
            - ⏱️ Requisitos de tempo de resposta
            - 🌡️ Temperatura da água (16-38°C)
            - 📏 Distâncias máximas de acesso
            
            **NR-32** - Segurança em Serviços de Saúde (quando aplicável)
            - 🏥 Requisitos específicos para área da saúde
            - 📍 Localização estratégica
            - 🚨 Sinalização obrigatória
            
            ---
            
            #### **Responsabilidades Legais:**
            
            **Empregador/Responsável pela Instalação:**
            - ✅ Garantir equipamentos em **condições de uso**
            - ✅ Realizar **inspeções periódicas** (mensais)
            - ✅ Manter **registros documentados**
            - ✅ Corrigir **não conformidades** identificadas
            - ✅ Treinar colaboradores no **uso correto**
            
            **SESMT/Segurança do Trabalho:**
            - ✅ Supervisionar programa de inspeções
            - ✅ Auditar conformidade legal
            - ✅ Reportar não conformidades críticas
            - ✅ Manter documentação atualizada
            
            ---
            
            #### **Documentação Obrigatória:**
            
            📁 **Este sistema gera automaticamente:**
            - ✅ Registro de todas as inspeções realizadas
            - ✅ Histórico completo de cada equipamento
            - ✅ Evidências fotográficas de não conformidades
            - ✅ Relatórios mensais de conformidade
            - ✅ Planos de ação para correções
            - ✅ Rastreabilidade completa (quem, quando, onde)
            
            💡 **Esta documentação é essencial para:**
            - Auditorias internas e externas
            - Fiscalizações do Ministério do Trabalho
            - Processos de certificação (ISO, etc.)
            - Defesa em processos trabalhistas
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
            **Frequência Obrigatória: MENSAL**
            
            - 📋 NBR 16071 exige inspeções **mensais**
            - 📅 Recomenda-se fazer no **mesmo dia de cada mês**
            - 🔔 O sistema alerta quando a inspeção está vencida
            
            **Inspeções Adicionais:**
            - 🔧 Após qualquer manutenção
            - 🏗️ Após obras ou modificações próximas
            - 🚨 Após qualquer incidente/acidente
            - ☔ Após eventos climáticos extremos (tempestades, etc.)
            
            **Prazos de vencimento:**
            - ⏰ 30 dias após última inspeção
            - 🚨 Sistema mostra equipamentos vencidos em destaque
            """)
        
        with st.expander("💧 Como testar se o fluxo de água está adequado?"):
            st.markdown("""
            **Testes Práticos Recomendados:**
            
            **Para CHUVEIROS:**
            - 🚿 Acione por **15-20 segundos completos**
            - 💧 Verifique se a água cobre **área de 50-60 cm de diâmetro**
            - 📏 A 1,5-2m de altura do piso
            - 🎯 Jatos devem ser **uniformes** (não falhados)
            
            **Para LAVA-OLHOS:**
            - 👀 Acione e observe os **dois jatos simultâneos**
            - 🎯 Jatos devem ser **suaves e convergentes**
            - 📐 Altura ideal: **10-15 cm** acima da bacia
            - ⏱️ Fluxo contínuo por **pelo menos 15 minutos** (teste completo)
            
            **Teste de PRESSÃO (opcional):**
            - 📊 Use manômetro para medir pressão
            - ✅ Ideal: 2,5 a 4,0 bar (chuveiro)
            - ✅ Ideal: 0,3 a 1,0 bar (lava-olhos)
            
            💡 **Importante:** Sempre deixe a água escoar até sair **limpa** antes de avaliar.
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
        
        **Lembre-se:** Inspeções mensais são OBRIGATÓRIAS por norma. 
        Este sistema facilita a conformidade e mantém sua documentação sempre em dia! ⚡
        """)

    with tab_inspection:

        st.header("Realizar Inspeção Periódica")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para realizar inspeções.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            df_inventory = load_sheet_data(EYEWASH_INVENTORY_SHEET_NAME)
            
            if df_inventory.empty:
                st.warning("Nenhum equipamento cadastrado. Vá para as abas de cadastro para começar.")
            else:
                equipment_options = df_inventory['id_equipamento'].tolist()
                options = ["Selecione um equipamento..."] + sorted(equipment_options)
                
                selected_equipment_id = st.selectbox("Selecione o Equipamento para Inspecionar", options)

                if selected_equipment_id != "Selecione um equipamento...":
                    location = df_inventory[df_inventory['id_equipamento'] == selected_equipment_id].iloc[0].get('localizacao', 'N/A')
                    st.info(f"**Localização:** {location}")
                    
                    st.markdown("---")
                    
                    with st.form(key=f"inspection_form_{selected_equipment_id}"):
                        inspection_results = {}
                        non_conformities_found = []
                        
                        for category, questions in CHECKLIST_QUESTIONS.items():
                            st.subheader(category)
                            for question in questions:
                                key = f"{selected_equipment_id}_{question}".replace(" ", "_").replace("?", "")
                                answer = st.radio(
                                    label=question, options=["Conforme", "Não Conforme", "N/A"],
                                    key=key, horizontal=True
                                )
                                inspection_results[question] = answer
                                if answer == "Não Conforme":
                                    non_conformities_found.append(question)
                        
                        st.markdown("---")
                        
                        photo_file = None
                        if non_conformities_found:
                            st.warning(f"Foram encontradas {len(non_conformities_found)} não conformidades. Por favor, anexe uma foto como evidência.")
                            photo_file = st.file_uploader("Anexar foto da não conformidade", type=["jpg", "jpeg", "png"], key=f"photo_{selected_equipment_id}")

                        submitted = st.form_submit_button("✅ Salvar Inspeção", type="primary", use_container_width=True)

                        if submitted:
                            if non_conformities_found and not photo_file:
                                st.error("É obrigatório anexar uma foto quando há não conformidades.")
                            else:
                                overall_status = "Reprovado com Pendências" if non_conformities_found else "Aprovado"
                                with st.spinner("Salvando inspeção..."):
                                    if save_eyewash_inspection(selected_equipment_id, overall_status, inspection_results, photo_file, get_user_display_name()):
                                        st.success(f"Inspeção para '{selected_equipment_id}' salva com sucesso!")
                                        st.balloons() if not non_conformities_found else None
                                        st.cache_data.clear()
                                        st.rerun()
                                    else:
                                        st.error("Ocorreu um erro ao salvar a inspeção.")

    # --- ABA DE CADASTRO COMPLETO ---
    with tab_register:
        st.header("Cadastrar Novo Chuveiro / Lava-Olhos (Completo)")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novos equipamentos.")
        else:        
            with st.form("new_eyewash_form", clear_on_submit=True):
                st.info("Preencha os dados completos do novo equipamento a ser adicionado ao sistema.")
                
                col1, col2 = st.columns(2)
                new_id = col1.text_input("**ID do Equipamento (Obrigatório)**", help="Use um código único, ex: CLO-01")
                new_location = col2.text_input("**Localização (Obrigatório)**", help="Descrição da localização física, ex: Ao lado do Laboratório Químico")
                
                col3, col4 = st.columns(2)
                new_brand = col3.text_input("Marca")
                new_model = col4.text_input("Modelo")
                
                # Informações adicionais
                st.markdown("---")
                st.subheader("Especificações Técnicas (Opcional)")
                
                col5, col6 = st.columns(2)
                equipment_type = col5.selectbox(
                    "Tipo de Equipamento",
                    ["", "Chuveiro de Emergência", "Lava-Olhos", "Chuveiro + Lava-Olhos Combinado", "Chuveiro Portátil", "Lava-Olhos Portátil"]
                )
                installation_date = col6.date_input("Data de Instalação", value=None)
                
                water_pressure = st.text_input("Pressão da Água (opcional)", placeholder="Ex: 2,5 bar")
                flow_rate = st.text_input("Taxa de Fluxo (opcional)", placeholder="Ex: 76 L/min (chuveiro), 5,7 L/min (lava-olhos)")
                
                additional_notes = st.text_area(
                    "Observações Adicionais",
                    placeholder="Informações sobre instalação, manutenções anteriores, etc."
                )
                
                submit_register = st.form_submit_button("➕ Cadastrar Equipamento Completo", type="primary", use_container_width=True)
                
                if submit_register:
                    if not new_id or not new_location:
                        st.error("Os campos 'ID do Equipamento' e 'Localização' são obrigatórios.")
                    else:
                        with st.spinner("Cadastrando novo equipamento..."):
                            if save_new_eyewash_station(new_id, new_location, new_brand, new_model):
                                st.success(f"Equipamento '{new_id}' cadastrado com sucesso!")
                                if additional_notes:
                                    st.info(f"Observações registradas: {additional_notes}")
                                st.cache_data.clear()

    # --- NOVA ABA DE CADASTRO RÁPIDO ---
    with tab_quick_register:
        st.header("Cadastro Rápido de Equipamento")
        
        # Check for edit permissions
        if not can_edit():
            st.warning("Você precisa de permissões de edição para cadastrar novos equipamentos.")
        else:
            st.info("Use este formulário simplificado para cadastrar rapidamente um chuveiro/lava-olhos com informações básicas.")
            
            with st.form("quick_eyewash_form", clear_on_submit=True):
                st.subheader("Dados Essenciais")
                
                quick_id = st.text_input("ID do Equipamento*", placeholder="CLO-001")
                quick_location = st.text_input("Localização*", placeholder="Laboratório - Setor A")
                
                # Tipo pré-definido
                quick_type = st.selectbox(
                    "Tipo de Equipamento",
                    ["Chuveiro de Emergência", "Lava-Olhos", "Chuveiro + Lava-Olhos Combinado"]
                )
                
                # Marca comum
                common_brands = ["", "HAWS", "BRADLEY", "SPEAKMAN", "GUARDIAN", "ENWARE", "OUTRO"]
                quick_brand = st.selectbox("Marca (opcional)", common_brands)
                
                if quick_brand == "OUTRO":
                    custom_brand = st.text_input("Digite a marca:")
                    final_brand = custom_brand
                else:
                    final_brand = quick_brand
                
                quick_submit = st.form_submit_button("Cadastrar Rápido", type="primary", use_container_width=True)
                
                if quick_submit:
                    if not quick_id or not quick_location:
                        st.error("ID e Localização são obrigatórios.")
                    else:
                        # Usa o tipo selecionado como modelo se não houver marca específica
                        model_to_use = quick_type if not final_brand else ""
                        
                        with st.spinner("Cadastrando..."):
                            if save_new_eyewash_station(quick_id, quick_location, final_brand, model_to_use):
                                st.success(f"Equipamento '{quick_id}' ({quick_type}) cadastrado rapidamente!")
                                st.balloons()
                                st.cache_data.clear()
                            else:
                                st.error("Erro ao cadastrar. Verifique se o ID já não existe.")
