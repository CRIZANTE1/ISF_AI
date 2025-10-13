# views/administracao.py
import streamlit as st
import pandas as pd
from datetime import date, timedelta, datetime
import altair as alt

# Imports do projeto
from database.supabase_client import get_supabase_client
from auth.auth_utils import get_users_data
from config.page_config import set_page_config
from config.table_names import (
    USERS_SHEET_NAME,
    SOLICITACOES_ACESSO_SHEET_NAME,
    LOG_AUDITORIA_SHEET_NAME,
    SOLICITACOES_SUPORTE_SHEET_NAME
)
from utils.auditoria import log_action
from AI.api_key_manager import get_api_key_manager
from AI.api_Operation import PDFQA

set_page_config()


# Funções da Tab de API Keys (sem alteração, pois não usa gdrive)
def show_api_key_management():
    """Interface de gerenciamento de chaves API (apenas para desenvolvedor)"""
    st.header("🔑 Gestão de Chaves API do Gemini")
    st.warning("⚠️ **Acesso Restrito:** Esta seção é visível apenas para o desenvolvedor/superusuário.")
    subtab_stats, subtab_test = st.tabs(["📊 Estatísticas", "🧪 Testes"])
    with subtab_stats:
        show_api_key_statistics()
    with subtab_test:
        show_api_key_tests()

def show_api_key_statistics():
    """Mostra estatísticas de uso das chaves API"""
    st.subheader("📊 Estatísticas de Chaves API do Gemini")
    try:
        key_manager = get_api_key_manager()
        stats = key_manager.get_statistics()
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("Total de Chaves", stats['total_keys'])
        col2.metric("Chaves Disponíveis", stats['available_keys'])
        col3.metric("Chaves em Cooldown", stats['keys_in_cooldown'])
        col4.metric("Estratégia", stats['strategy'])
        st.markdown("---")
        if stats['usage_count']:
            st.markdown("### 📈 Uso Detalhado por Chave")
            usage_data = []
            for i, key in enumerate(key_manager.keys, 1):
                masked_key = key_manager._mask_key(key)
                usage = stats['usage_count'].get(key, 0)
                failures = stats['failure_count'].get(key, 0)
                in_cooldown = "🔴 Sim" if key in key_manager.key_cooldown else "🟢 Não"
                total_requests = usage
                success_rate = ((total_requests - failures) / total_requests * 100) if total_requests > 0 else 0
                usage_data.append({
                    "Chave": f"Chave #{i}", "ID Mascarado": masked_key, "Usos Totais": usage,
                    "Falhas": failures, "Taxa de Sucesso": f"{success_rate:.1f}%", "Em Cooldown": in_cooldown
                })
            df_usage = pd.DataFrame(usage_data)
            st.dataframe(df_usage, use_container_width=True, hide_index=True)
            if len(usage_data) > 1:
                st.markdown("### 📊 Distribuição de Uso")
                chart_data = pd.DataFrame({'Chave': [d['Chave'] for d in usage_data], 'Usos': [d['Usos Totais'] for d in usage_data]})
                chart = alt.Chart(chart_data).mark_bar().encode(
                    x=alt.X('Chave:N', title='Chave API'), y=alt.Y('Usos:Q', title='Número de Usos'),
                    color=alt.condition(alt.datum.Usos > 0, alt.value('#1f77b4'), alt.value('#d62728')),
                    tooltip=['Chave', 'Usos']
                ).properties(height=300)
                st.altair_chart(chart, use_container_width=True)
        else:
            st.info("ℹ️ Nenhuma chave foi utilizada ainda.")
        if stats['keys_in_cooldown'] > 0:
            st.markdown("### ⏱️ Chaves em Cooldown")
            cooldown_data = []
            for key, cooldown_until in key_manager.key_cooldown.items():
                masked_key = key_manager._mask_key(key)
                remaining_time = (cooldown_until - datetime.now()).total_seconds() / 60
                cooldown_data.append({
                    "Chave": masked_key, "Disponível em": f"{remaining_time:.1f} minutos",
                    "Horário de Liberação": cooldown_until.strftime("%H:%M:%S")
                })
            st.dataframe(pd.DataFrame(cooldown_data), use_container_width=True, hide_index=True)
        st.markdown("---")
        col_reset1, col_reset2 = st.columns([3, 1])
        with col_reset2:
            if st.button("🔄 Resetar Estatísticas", type="secondary"):
                key_manager.key_usage_count.clear()
                key_manager.key_failures.clear()
                key_manager.key_last_used.clear()
                st.success("✅ Estatísticas resetadas!")
                st.rerun()
    except Exception as e:
        st.error(f"❌ Erro ao carregar estatísticas: {e}")

def show_api_key_tests():
    """Interface de testes de chaves API"""
    st.subheader("🧪 Testes de Rotação de Chaves API")
    st.info("💡 Use esta seção para testar o sistema de rotação de chaves e simular cenários de falha.")
    try:
        key_manager = get_api_key_manager()
        st.write(f"**Total de chaves carregadas:** {len(key_manager.keys)}")
        st.write(f"**Estratégia de rotação:** {key_manager.rotation_strategy}")
        st.write(f"**Tentativas máximas:** {key_manager.max_retries}")
        st.write(f"**Delay entre tentativas:** {key_manager.retry_delay}s")
        st.markdown("---")
        st.markdown("### 🔄 Teste 1: Rotação de Chaves")
        st.write("Simula 10 requisições para observar o padrão de rotação das chaves.")
        num_tests = st.slider("Número de requisições a testar:", 5, 20, 10)
        if st.button("▶️ Executar Teste de Rotação", key="test_rotation"):
            with st.spinner("Testando rotação..."):
                rotation_results = []
                for i in range(num_tests):
                    key = key_manager.get_next_key()
                    masked = key_manager._mask_key(key)
                    rotation_results.append({"Requisição": f"#{i+1}", "Chave Selecionada": masked, "Índice": key_manager.keys.index(key) + 1})
                st.dataframe(pd.DataFrame(rotation_results), use_container_width=True, hide_index=True)
                st.success(f"✅ Teste concluído! {num_tests} chaves foram rotacionadas.")
        st.markdown("---")
        st.markdown("### ⚠️ Teste 2: Simulação de Rate Limit")
        st.write("Simula um erro de rate limit para colocar uma chave em cooldown.")
        col_sim1, col_sim2 = st.columns([2, 1])
        with col_sim1:
            keys_list = [f"Chave #{i+1} ({key_manager._mask_key(k)})" for i, k in enumerate(key_manager.keys)]
            selected_key_idx = st.selectbox("Selecione uma chave para simular falha:", range(len(keys_list)), format_func=lambda x: keys_list[x])
        with col_sim2:
            if st.button("🚫 Simular Rate Limit", type="secondary"):
                selected_key = key_manager.keys[selected_key_idx]
                key_manager.report_key_failure(selected_key, "429 Too Many Requests - Rate limit exceeded")
                st.warning(f"⚠️ Rate limit simulado para: {key_manager._mask_key(selected_key)}")
                st.info("A chave foi colocada em cooldown por 5 minutos.")
                st.rerun()
        st.markdown("---")
        st.markdown("### 🤖 Teste 3: Requisição Real à API")
        st.write("Testa uma requisição real ao Gemini para validar uma chave específica.")
        test_prompt = st.text_input("Prompt de teste:", "Responda apenas: OK")
        if st.button("📡 Testar Requisição Real", type="primary"):
            with st.spinner("Enviando requisição ao Gemini..."):
                try:
                    pdf_qa = PDFQA()
                    response = pdf_qa.model.generate_content(test_prompt)
                    if response and response.text:
                        st.success("✅ Requisição bem-sucedida!")
                        st.write(f"**Resposta da API:** {response.text}")
                        current_key = key_manager.keys[key_manager.current_key_index]
                        st.info(f"🔑 Chave utilizada: {key_manager._mask_key(current_key)}")
                    else:
                        st.error("❌ Resposta vazia da API")
                except Exception as e:
                    st.error(f"❌ Erro na requisição: {str(e)}")
        st.markdown("---")
        st.markdown("### 🔓 Teste 4: Gerenciamento de Cooldown")
        if key_manager.key_cooldown:
            st.write(f"**Chaves atualmente em cooldown:** {len(key_manager.key_cooldown)}")
            if st.button("🔓 Remover Todos os Cooldowns", type="secondary"):
                key_manager.key_cooldown.clear()
                st.success("✅ Todos os cooldowns foram removidos!")
                st.rerun()
        else:
            st.info("ℹ️ Nenhuma chave está em cooldown no momento.")
    except Exception as e:
        st.error(f"❌ Erro ao executar testes: {e}")
        st.exception(e)

def show_page():
    st.title("👑 Painel de Controle do Super Administrador")

    db_client = get_supabase_client()

    tab_dashboard, tab_requests, tab_users, tab_audit, tab_support_admin, tab_api_keys = st.tabs([
        "📊 Dashboard Global", "📬 Solicitações", "👤 Usuários e Planos",
        "🛡️ Auditoria", "🎫 Gerenciar Solicitações de Suporte", "🔑 Gestão de API Keys"
    ])

    with tab_dashboard:
        st.header("Visão Geral do Status de Todos os Usuários Ativos")
        if st.button("Recarregar Dados Globais"):
            st.cache_data.clear()
            st.rerun()

        users_df = get_users_data()
        df_requests = db_client.get_data(SOLICITACOES_ACESSO_SHEET_NAME)

        if users_df.empty:
            st.warning("Nenhum usuário cadastrado para exibir métricas.")
        else:
            st.subheader("📊 Métricas Principais")
            active_users_df = users_df[users_df['status'] == 'ativo']
            users_df['data_cadastro'] = pd.to_datetime(users_df['data_cadastro'], errors='coerce')
            thirty_days_ago = datetime.now() - timedelta(days=30)
            new_users_last_30_days = users_df[users_df['data_cadastro'] >= thirty_days_ago].shape[0]
            pending_requests_count = df_requests[df_requests['status'] == 'Pendente'].shape[0] if not df_requests.empty else 0

            col1, col2, col3, col4 = st.columns(4)
            col1.metric("Usuários Ativos Totais", "{}".format(active_users_df.shape[0]))
            col2.metric("Novos Usuários (30d)", "+{}".format(new_users_last_30_days))
            col3.metric("Conversão de Trial (Em breve)", "N/A")
            col4.metric("Solicitações Pendentes", "{}".format(pending_requests_count), delta_color="inverse")
            st.markdown("---")

            st.subheader("📈 Distribuição de Usuários")
            col_chart1, col_chart2 = st.columns(2)
            with col_chart1:
                st.write("**Distribuição por Plano**")
                plan_counts = active_users_df['plano'].value_counts().reset_index()
                plan_counts.columns = ['plano', 'contagem']
                chart = alt.Chart(plan_counts).mark_arc(innerRadius=50).encode(
                    theta=alt.Theta(field="contagem", type="quantitative"),
                    color=alt.Color(field="plano", type="nominal", title="Plano"),
                    tooltip=['plano', 'contagem']
                ).properties(title='Planos dos Usuários Ativos')
                st.altair_chart(chart, use_container_width=True)
            with col_chart2:
                st.write("**Atividade Recente (Novos Cadastros)**")
                new_users_df = users_df.dropna(subset=['data_cadastro']).copy()
                if not new_users_df.empty:
                    new_users_df['semana_cadastro'] = new_users_df['data_cadastro'].dt.to_period('W').apply(lambda r: r.start_time).dt.date
                    weekly_signups = new_users_df.groupby('semana_cadastro').size().reset_index(name='novos_cadastros')
                    line_chart = alt.Chart(weekly_signups).mark_line(point=True).encode(
                        x=alt.X('semana_cadastro:T', title='Semana'),
                        y=alt.Y('novos_cadastros:Q', title='Novos Usuários'),
                        tooltip=['semana_cadastro', 'novos_cadastros']
                    ).properties(title='Novos Cadastros por Semana')
                    st.altair_chart(line_chart, use_container_width=True)
                else:
                    st.info("Nenhum dado de cadastro para gerar gráfico de atividade.")
            st.markdown("---")

            st.subheader("🩺 Saúde da Plataforma")
            st.write("**Últimos Erros Registrados na Auditoria**")
            df_log = db_client.get_data(LOG_AUDITORIA_SHEET_NAME)
            if df_log.empty:
                st.info("Nenhum log de auditoria encontrado.")
            else:
                error_logs = df_log[df_log['action'].str.contains("FALHA|ERRO", case=False, na=False)].copy()
                if error_logs.empty:
                    st.success("✅ Nenhum erro recente registrado.")
                else:
                    error_logs = error_logs.sort_values(by='timestamp', ascending=False)
                    st.warning(f"Encontrados {len(error_logs)} logs de erro.")
                    st.dataframe(error_logs.head(5)[['timestamp', 'user_email', 'action', 'details']], use_container_width=True)

    with tab_requests:
        st.header("Gerenciar Solicitações de Acesso Pendentes")
        df_requests = db_client.get_data(SOLICITACOES_ACESSO_SHEET_NAME)
        pending_requests = df_requests[df_requests['status'] == 'Pendente'] if not df_requests.empty else pd.DataFrame()

        if pending_requests.empty:
            st.success("✅ Nenhuma solicitação de acesso pendente.")
        else:
            st.info(f"Você tem {len(pending_requests)} solicitação(ões) para avaliar.")
            for index, request in pending_requests.iterrows():
                with st.container(border=True):
                    st.write(f"**Usuário:** {request['nome_usuario']} (`{request['email_usuario']}`)")
                    cols = st.columns([2, 1, 1])
                    role = cols[0].selectbox("Atribuir Perfil:", ["editor", "viewer"], key=f"role_{request['id']}")
                    
                    if cols[1].button("Aprovar e Iniciar Trial", key=f"approve_{request['id']}", type="primary"):
                        with st.spinner(f"Processando aprovação para {request['nome_usuario']}..."):
                            today = date.today()
                            trial_end = today + timedelta(days=14)
                            new_user_data = {
                                "email": request['email_usuario'], "nome": request['nome_usuario'], "role": role,
                                "plano": 'premium_ia', "status": 'ativo',
                                "data_cadastro": today.isoformat(), "trial_end_date": trial_end.isoformat()
                            }
                            
                            # Adiciona novo usuário e atualiza status da solicitação
                            db_client.append_data(USERS_SHEET_NAME, new_user_data)
                            db_client.update_data(SOLICITACOES_ACESSO_SHEET_NAME, {'status': 'Aprovado'}, 'id', request['id'])
                            
                            log_action("APROVOU_ACESSO_COM_TRIAL", f"Email: {request['email_usuario']}")
                            
                            try:
                                from utils.github_notifications import notify_access_approved
                                notification_sent = notify_access_approved(
                                    user_email=request['email_usuario'], user_name=request['nome_usuario'], trial_days=14)
                                if notification_sent:
                                    st.success(f"✅ Usuário {request['nome_usuario']} aprovado e notificado por email!")
                                else:
                                    st.success(f"✅ Usuário {request['nome_usuario']} aprovado!")
                                    st.warning("⚠️ Notificação por email falhou, mas o acesso foi liberado.")
                            except Exception as e:
                                st.success(f"✅ Usuário {request['nome_usuario']} aprovado!")
                                st.warning(f"⚠️ Erro na notificação: {e}")
                            
                            st.cache_data.clear()
                            st.rerun()
                    
                    if cols[2].button("Rejeitar", key=f"reject_{request['id']}"):
                        rejection_reason = st.text_input(f"Motivo da rejeição (opcional):", key=f"reason_{request['id']}")
                        db_client.update_data(SOLICITACOES_ACESSO_SHEET_NAME, {'status': 'Rejeitado'}, 'id', request['id'])
                        log_action("REJEITOU_ACESSO", f"Email: {request['email_usuario']}")
                        
                        try:
                            from utils.github_notifications import notify_access_denied
                            notify_access_denied(user_email=request['email_usuario'], user_name=request['nome_usuario'], reason=rejection_reason)
                            st.warning(f"Solicitação de {request['nome_usuario']} rejeitada e usuário notificado.")
                        except:
                            st.warning(f"Solicitação de {request['nome_usuario']} rejeitada.")
                        
                        st.cache_data.clear()
                        st.rerun()

    with tab_users:
        st.header("Gerenciar Usuários e Planos")
        users_df = get_users_data()
        if users_df.empty:
            st.info("Nenhum usuário cadastrado.")
        else:
            st.dataframe(users_df.drop(columns=['spreadsheet_id', 'folder_id'], errors='ignore'), use_container_width=True)
            st.markdown("---")
            st.subheader("Ações de Gerenciamento")
            
            user_list = users_df['email'].tolist()
            selected_email = st.selectbox("Selecione um usuário para gerenciar:", options=[""] + user_list)
            
            if selected_email:
                user_data = users_df[users_df['email'] == selected_email].iloc[0]
                st.write(f"**Gerenciando:** {user_data['nome']} (`{user_data['email']}`)")

                col1, col2, col3 = st.columns(3)
                with col1:
                    plan_options = ["basico", "pro", "premium_ia"]
                    new_plan = st.selectbox("Plano:", plan_options, index=plan_options.index(user_data['plano']))
                with col2:
                    status_options = ["ativo", "inativo", "cancelado"]
                    new_status = st.selectbox("Status da Conta:", status_options, index=status_options.index(user_data['status']))
                with col3:
                    role_options = ["editor", "viewer", "admin"]
                    new_role = st.selectbox("Perfil de Acesso:", role_options, index=role_options.index(user_data['role']))

                if st.button("Salvar Alterações", type="primary"):
                    updates = {'role': new_role, 'plano': new_plan, 'status': new_status}
                    if new_plan != user_data['plano'] or new_status != user_data['status']:
                        updates['trial_end_date'] = None # Limpa a data do trial
                    
                    db_client.update_data(USERS_SHEET_NAME, updates, 'email', selected_email)
                    log_action("ALTEROU_USUARIO", f"Email: {selected_email}, Plano: {new_plan}, Status: {new_status}, Perfil: {new_role}")
                    st.success("Usuário atualizado com sucesso!")
                    st.cache_data.clear()
                    st.rerun()

    with tab_audit:
        st.header("Log de Auditoria do Sistema")
        df_log = db_client.get_data(LOG_AUDITORIA_SHEET_NAME)
        if df_log.empty:
            st.warning("Nenhum registro de auditoria encontrado.")
        else:
            df_log_sorted = df_log.sort_values(by='timestamp', ascending=False)
            st.dataframe(df_log_sorted, use_container_width=True, hide_index=True)

    with tab_support_admin:
        st.header("🎫 Gerenciar Solicitações de Suporte")
        df_support = db_client.get_data(SOLICITACOES_SUPORTE_SHEET_NAME)
        if df_support.empty:
            st.info("📭 Nenhuma solicitação de suporte encontrada.")
        else:
            col1, col2, col3 = st.columns(3)
            with col1:
                status_filter = st.selectbox("Status:", ["Todos", "Pendente", "Em Andamento", "Resolvido"])
            with col2:
                type_filter = st.selectbox("Tipo:", ["Todos"] + df_support['tipo_solicitacao'].unique().tolist())
            with col3:
                priority_filter = st.selectbox("Prioridade:", ["Todos", "Normal", "Alta", "Crítica"])
            
            filtered_df = df_support.copy()
            if status_filter != "Todos": filtered_df = filtered_df[filtered_df['status'] == status_filter]
            if type_filter != "Todos": filtered_df = filtered_df[filtered_df['tipo_solicitacao'] == type_filter]
            if priority_filter != "Todos": filtered_df = filtered_df[filtered_df['prioridade'] == priority_filter]
            
            st.dataframe(
                filtered_df[['data_solicitacao', 'email_usuario', 'tipo_solicitacao', 'assunto', 'prioridade', 'status']],
                use_container_width=True
            )
            
            if not filtered_df.empty:
                st.markdown("---")
                selected_ticket_id = st.selectbox(
                    "Selecionar ticket para responder:",
                    options=[""] + filtered_df['id'].tolist(),
                    format_func=lambda x: f"#{x} - {filtered_df.loc[filtered_df['id'] == x, 'assunto'].iloc[0]}" if x != "" else "Selecione um ticket"
                )
                
                if selected_ticket_id != "":
                    ticket_data = filtered_df[filtered_df['id'] == selected_ticket_id].iloc[0]
                    with st.form(f"response_form_{ticket_data['id']}"):
                        st.write(f"**Respondendo:** {ticket_data['assunto']}")
                        st.write(f"**De:** {ticket_data['nome_usuario']} ({ticket_data['email_usuario']})")
                        new_status = st.selectbox("Status:", ["Pendente", "Em Andamento", "Resolvido"], key=f"status_{ticket_data['id']}")
                        response_text = st.text_area("Resposta:", height=150, key=f"text_{ticket_data['id']}")
                        
                        if st.form_submit_button("Enviar Resposta"):
                            if response_text.strip():
                                updates = {
                                    'status': new_status,
                                    'data_resposta': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                                    'resposta': response_text
                                }
                                db_client.update_data(SOLICITACOES_SUPORTE_SHEET_NAME, updates, 'id', ticket_data['id'])
                                st.success("✅ Resposta enviada!")
                                st.cache_data.clear()
                                st.rerun()

    with tab_api_keys:
        show_api_key_management()

if __name__ == "__main__":
    # Para testar a página isoladamente
    # Certifique-se de que as credenciais do Streamlit e Supabase estão configuradas
    show_page()
