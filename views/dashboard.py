import streamlit as st
import pandas as pd
from datetime import date
from dateutil.relativedelta import relativedelta
import sys
import os
import numpy as np
import json
from streamlit_js_eval import streamlit_js_eval

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from operations.history import load_sheet_data, find_last_record
from auth.login_page import show_login_page, show_user_header, show_logout_button
from auth.auth_utils import can_edit, setup_sidebar, is_admin, can_view, get_user_display_name
from config.page_config import set_page_config
from operations.eyewash_operations import CHECKLIST_QUESTIONS
from gdrive.config import (
    HOSE_SHEET_NAME, SHELTER_SHEET_NAME, INSPECTIONS_SHELTER_SHEET_NAME,
    LOG_SHELTER_SHEET_NAME, SCBA_SHEET_NAME, SCBA_VISUAL_INSPECTIONS_SHEET_NAME,
    EYEWASH_INSPECTIONS_SHEET_NAME,
    FOAM_CHAMBER_INVENTORY_SHEET_NAME,
    FOAM_CHAMBER_INSPECTIONS_SHEET_NAME,
    HOSE_DISPOSAL_LOG_SHEET_NAME,
    LOG_FOAM_CHAMBER_SHEET_NAME,
    MULTIGAS_INVENTORY_SHEET_NAME, 
    MULTIGAS_INSPECTIONS_SHEET_NAME
)
from reports.reports_pdf import generate_shelters_html
from operations.shelter_operations import save_shelter_action_log, save_shelter_inspection
from operations.corrective_actions import save_corrective_action
from reports.reports_pdf import generate_shelters_html 
from operations.photo_operations import upload_evidence_photo
from reports.monthly_report_ui import show_monthly_report_interface
from operations.scba_operations import save_scba_visual_inspection, save_scba_action_log
from operations.eyewash_operations import save_eyewash_inspection, save_eyewash_action_log
from operations.foam_chamber_operations import save_foam_chamber_inspection, save_foam_chamber_action_log



set_page_config()


def get_multigas_status_df(df_inventory, df_inspections):
    if df_inventory.empty:
        return pd.DataFrame()

    # Começa com o inventário
    dashboard_df = df_inventory.copy()

    # Se não houver inspeções, define todos como pendentes e retorna
    # Esta parte garante que a estrutura de colunas seja sempre a mesma
    if df_inspections.empty:
        dashboard_df['status_calibracao'] = '🔵 PENDENTE'
        dashboard_df['status_bump_test'] = '🔵 PENDENTE'
        dashboard_df['proxima_calibracao'] = pd.NaT
        dashboard_df['resultado_ultimo_bump_test'] = 'N/A'
        dashboard_df['data_ultimo_bump_test'] = pd.NaT
        dashboard_df['link_certificado'] = None
        return dashboard_df

    # Converte a coluna de data para o formato datetime uma única vez
    df_inspections['data_teste'] = pd.to_datetime(df_inspections['data_teste'], errors='coerce')

    # Cria as colunas de resultados no DataFrame principal com valores padrão
    dashboard_df['proxima_calibracao'] = pd.NaT
    dashboard_df['link_certificado'] = None
    dashboard_df['resultado_ultimo_bump_test'] = 'N/A'
    dashboard_df['data_ultimo_bump_test'] = pd.NaT

    # Itera sobre cada equipamento do inventário para encontrar seus últimos testes
    for index, row in dashboard_df.iterrows():
        equip_id = row['id_equipamento']
        # Filtra as inspeções apenas para o equipamento atual
        equip_inspections = df_inspections[df_inspections['id_equipamento'] == equip_id]

        if not equip_inspections.empty:
            # Encontra a última calibração anual
            calibrations = equip_inspections[equip_inspections['tipo_teste'] == 'Calibração Anual']
            if not calibrations.empty:
                last_calib = calibrations.sort_values('data_teste', ascending=False).iloc[0]
                dashboard_df.loc[index, 'proxima_calibracao'] = last_calib.get('proxima_calibracao')
                dashboard_df.loc[index, 'link_certificado'] = last_calib.get('link_certificado')

            # Encontra o último bump test (qualquer teste que não seja calibração anual)
            bump_tests = equip_inspections[equip_inspections['tipo_teste'] != 'Calibração Anual']
            if not bump_tests.empty:
                last_bump = bump_tests.sort_values('data_teste', ascending=False).iloc[0]
                dashboard_df.loc[index, 'resultado_ultimo_bump_test'] = last_bump.get('resultado_teste')
                dashboard_df.loc[index, 'data_ultimo_bump_test'] = last_bump.get('data_teste')

    # Agora que os dados estão consolidados, calcula os status
    today = pd.Timestamp(date.today())
    
    # Status da Calibração
    dashboard_df['proxima_calibracao'] = pd.to_datetime(dashboard_df['proxima_calibracao'], errors='coerce')
    dashboard_df['status_calibracao'] = np.where(
        dashboard_df['proxima_calibracao'].isna(), '🔵 PENDENTE',
        np.where(dashboard_df['proxima_calibracao'] < today, '🔴 VENCIDO', '🟢 OK')
    )

    # Status do Bump Test
    dashboard_df['status_bump_test'] = np.where(
        dashboard_df['resultado_ultimo_bump_test'].isin(['N/A', None, '']), '🔵 PENDENTE',
        np.where(dashboard_df['resultado_ultimo_bump_test'] == 'Reprovado', '🟠 REPROVADO', '🟢 OK')
    )
    
    return dashboard_df

def get_foam_chamber_status_df(df_inspections):
    if df_inspections.empty:
        return pd.DataFrame()

    df_inspections['data_inspecao'] = pd.to_datetime(df_inspections['data_inspecao'], errors='coerce')
    latest_inspections = df_inspections.sort_values('data_inspecao', ascending=False).drop_duplicates(subset='id_camara', keep='first').copy()
    
    today = pd.Timestamp(date.today())
    latest_inspections['data_proxima_inspecao'] = pd.to_datetime(latest_inspections['data_proxima_inspecao'], errors='coerce')
    
    conditions = [
        (latest_inspections['data_proxima_inspecao'] < today),
        (latest_inspections['status_geral'] == 'Reprovado com Pendências')
    ]
    choices = ['🔴 VENCIDO', '🟠 COM PENDÊNCIAS']
    latest_inspections['status_dashboard'] = np.select(conditions, choices, default='🟢 OK')
    
    return latest_inspections


def get_eyewash_status_df(df_inspections):
    if df_inspections.empty:
        return pd.DataFrame()

    # Garante que a coluna de data é do tipo datetime
    df_inspections['data_inspecao'] = pd.to_datetime(df_inspections['data_inspecao'], errors='coerce')
    
    # Pega o último registro para cada equipamento
    latest_inspections = df_inspections.sort_values('data_inspecao', ascending=False).drop_duplicates(subset='id_equipamento', keep='first').copy()
    
    today = pd.Timestamp(date.today())
    latest_inspections['data_proxima_inspecao'] = pd.to_datetime(latest_inspections['data_proxima_inspecao'], errors='coerce')
    
    conditions = [
        (latest_inspections['data_proxima_inspecao'] < today),
        (latest_inspections['status_geral'] == 'Reprovado com Pendências')
    ]
    choices = ['🔴 VENCIDO', '🟠 COM PENDÊNCIAS']
    latest_inspections['status_dashboard'] = np.select(conditions, choices, default='🟢 OK')
    
    return latest_inspections

def get_scba_status_df(df_scba_main, df_scba_visual):
    if df_scba_main.empty:
        return pd.DataFrame()

    equipment_tests = df_scba_main.dropna(subset=['numero_serie_equipamento', 'data_teste']).copy()
    if equipment_tests.empty:
        return pd.DataFrame()
        
    latest_tests = equipment_tests.sort_values('data_teste', ascending=False).drop_duplicates(subset='numero_serie_equipamento', keep='first')
    
    if not df_scba_visual.empty:
        df_scba_visual['data_inspecao'] = pd.to_datetime(df_scba_visual['data_inspecao'], errors='coerce')
        latest_visual = df_scba_visual.sort_values('data_inspecao', ascending=False).drop_duplicates(subset='numero_serie_equipamento', keep='first')
        dashboard_df = pd.merge(latest_tests, latest_visual, on='numero_serie_equipamento', how='left', suffixes=('_teste', '_visual'))
    else:
        dashboard_df = latest_tests
        for col in ['data_inspecao', 'data_proxima_inspecao', 'status_geral', 'resultados_json']:
            dashboard_df[col] = None

    today = pd.Timestamp(date.today())
    dashboard_df['data_validade'] = pd.to_datetime(dashboard_df['data_validade'], errors='coerce')
    dashboard_df['data_proxima_inspecao'] = pd.to_datetime(dashboard_df['data_proxima_inspecao'], errors='coerce')
    
    conditions = [
        (dashboard_df['data_validade'] < today),
        (dashboard_df['data_proxima_inspecao'] < today),
        (dashboard_df['status_geral'] == 'Reprovado com Pendências')
    ]
    choices = ['🔴 VENCIDO (Teste Posi3)', '🔴 VENCIDO (Insp. Periódica)', '🟠 COM PENDÊNCIAS']
    dashboard_df['status_consolidado'] = np.select(conditions, choices, default='🟢 OK')
    
    return dashboard_df
    
def get_hose_status_df(df_hoses, df_disposals):
    if df_hoses.empty:
        return pd.DataFrame()
    
    # Garante que as colunas de data existam e sejam do tipo datetime
    for col in ['data_inspecao', 'data_proximo_teste']:
        if col not in df_hoses.columns:
            df_hoses[col] = pd.NaT
        df_hoses[col] = pd.to_datetime(df_hoses[col], errors='coerce')

    # Pega apenas o último registro de cada mangueira
    latest_hoses = df_hoses.sort_values('data_inspecao', ascending=False).drop_duplicates(subset='id_mangueira', keep='first').copy()
    
    # Remove mangueiras que já foram baixadas
    if not df_disposals.empty and 'id_mangueira' in df_disposals.columns:
        disposed_ids = df_disposals['id_mangueira'].astype(str).unique()
        latest_hoses = latest_hoses[~latest_hoses['id_mangueira'].astype(str).isin(disposed_ids)]

    if latest_hoses.empty:
        return pd.DataFrame()

    today = pd.Timestamp(date.today())
    
    if 'resultado' not in latest_hoses.columns:
        latest_hoses['resultado'] = ''
    latest_hoses['resultado'] = latest_hoses['resultado'].fillna('').str.lower()
    
    rejection_keywords = ['reprovado', 'condenada', 'rejeitado', 'condenado']
    
    is_rejected = latest_hoses['resultado'].str.contains('|'.join(rejection_keywords), na=False)

    conditions = [
        is_rejected,  # 1. Prioridade máxima: se o resultado for negativo
        (latest_hoses['data_proximo_teste'] < today) # 2. Segunda prioridade: se a data estiver vencida
    ]
    choices = ['🟠 REPROVADA', '🔴 VENCIDO']
    latest_hoses['status'] = np.select(conditions, choices, default='🟢 OK')
    
    latest_hoses['data_inspecao'] = latest_hoses['data_inspecao'].dt.strftime('%d/%m/%Y')
    latest_hoses['data_proximo_teste'] = latest_hoses['data_proximo_teste'].dt.strftime('%d/%m/%Y')
    
    display_columns = [
        'id_mangueira', 'status', 'marca', 'diametro', 'tipo',
        'comprimento', 'ano_fabricacao', 'data_inspecao',
        'data_proximo_teste', 'link_certificado_pdf', 'registrado_por'
    ]
    
    existing_display_columns = [col for col in display_columns if col in latest_hoses.columns]
    
    return latest_hoses[existing_display_columns]

@st.dialog("Registrar Baixa e Substituição de Mangueira")
def dispose_hose_dialog(hose_id):
    st.warning(f"Você está registrando a baixa da mangueira **ID: {hose_id}**.")
    st.info("Esta ação irá remover a mangueira da lista de equipamentos ativos.")
    
    reason = st.selectbox(
        "Motivo da Baixa:",
        ["Reprovada no Teste Hidrostático", "Dano Irreparável", "Fim da Vida Útil", "Outro"]
    )
    substitute_id = st.text_input("ID da Mangueira Substituta (Opcional)")
    
    if st.button("Confirmar Baixa", type="primary"):
        with st.spinner("Registrando..."):
            log_row = [
                date.today().isoformat(),
                hose_id,
                reason,
                get_user_display_name(),
                substitute_id if substitute_id else None
            ]
            try:
                uploader = GoogleDriveUploader()
                uploader.append_data_to_sheet(HOSE_DISPOSAL_LOG_SHEET_NAME, [log_row])
                st.success(f"Baixa da mangueira {hose_id} registrada com sucesso!")
                st.cache_data.clear()
                st.rerun()
            except Exception as e:
                st.error(f"Ocorreu um erro ao registrar a baixa: {e}")



def get_shelter_status_df(df_shelters_registered, df_inspections):
    if df_shelters_registered.empty:
        return pd.DataFrame()

    latest_inspections_list = []
    if not df_inspections.empty:
        df_inspections['data_inspecao'] = pd.to_datetime(df_inspections['data_inspecao'], errors='coerce').dt.date

        for shelter_id in df_shelters_registered['id_abrigo'].unique():
            shelter_inspections = df_inspections[df_inspections['id_abrigo'] == shelter_id].copy()
            if not shelter_inspections.empty:
                shelter_inspections = shelter_inspections.sort_values(by='data_inspecao', ascending=False)
                
        
                latest_date = shelter_inspections['data_inspecao'].iloc[0]
                inspections_on_latest_date = shelter_inspections[shelter_inspections['data_inspecao'] == latest_date]
                
                approved_on_latest = inspections_on_latest_date[inspections_on_latest_date['status_geral'] != 'Reprovado com Pendências']
                
                if not approved_on_latest.empty:
                    latest_inspections_list.append(approved_on_latest.iloc[0])
                else:
                    latest_inspections_list.append(inspections_on_latest_date.iloc[0])

    latest_inspections = pd.DataFrame(latest_inspections_list)

    if not latest_inspections.empty:
        dashboard_df = pd.merge(df_shelters_registered[['id_abrigo', 'cliente', 'local']], latest_inspections, on='id_abrigo', how='left')
    else:

        dashboard_df = df_shelters_registered.copy()
        for col in ['data_inspecao', 'data_proxima_inspecao', 'status_geral', 'inspetor', 'resultados_json']:
            dashboard_df[col] = None

    today = pd.to_datetime(date.today()).date()
    dashboard_df['data_proxima_inspecao'] = pd.to_datetime(dashboard_df['data_proxima_inspecao'], errors='coerce').dt.date

    conditions = [
        (dashboard_df['data_inspecao'].isna()),
        (dashboard_df['data_proxima_inspecao'] < today),
        (dashboard_df['status_geral'] == 'Reprovado com Pendências')
    ]
    choices = ['🔵 PENDENTE (Nova Inspeção)', '🔴 VENCIDO', '🟠 COM PENDÊNCIAS']
    dashboard_df['status_dashboard'] = np.select(conditions, choices, default='🟢 OK')

    dashboard_df['data_inspecao_str'] = dashboard_df['data_inspecao'].apply(lambda x: x.strftime('%d/%m/%Y') if pd.notna(x) else 'N/A')
    dashboard_df['data_proxima_inspecao_str'] = dashboard_df['data_proxima_inspecao'].apply(lambda x: x.strftime('%d/%m/%Y') if pd.notna(x) else 'N/A')
    dashboard_df['inspetor'] = dashboard_df['inspetor'].fillna('N/A')
    dashboard_df['resultados_json'] = dashboard_df['resultados_json'].fillna('{}')

    display_columns = ['id_abrigo', 'status_dashboard', 'data_inspecao_str', 'data_proxima_inspecao_str', 'status_geral', 'inspetor', 'resultados_json', 'local']
    existing_columns = [col for col in display_columns if col in dashboard_df.columns]
    
    return dashboard_df[existing_columns]


def get_consolidated_status_df(df_full, df_locais):
    if df_full.empty: 
        return pd.DataFrame()
    
    consolidated_data = []
    df_copy = df_full.copy()
    df_copy['data_servico'] = pd.to_datetime(df_copy['data_servico'], errors='coerce')
    df_copy = df_copy.dropna(subset=['data_servico'])
    
    unique_ids = df_copy['numero_identificacao'].unique()

    for ext_id in unique_ids:
        ext_df = df_copy[df_copy['numero_identificacao'] == ext_id].sort_values(by='data_servico')
        if ext_df.empty: 
            continue
        
        latest_record_info = ext_df.iloc[-1]
        
        last_insp_date = ext_df['data_servico'].max()
        last_maint2_date = ext_df[ext_df['tipo_servico'] == 'Manutenção Nível 2']['data_servico'].max()
        last_maint3_date = ext_df[ext_df['tipo_servico'] == 'Manutenção Nível 3']['data_servico'].max()
        
        next_insp = (last_insp_date + relativedelta(months=1)) if pd.notna(last_insp_date) else pd.NaT
        next_maint2 = (last_maint2_date + relativedelta(months=12)) if pd.notna(last_maint2_date) else pd.NaT
        next_maint3 = (last_maint3_date + relativedelta(years=5)) if pd.notna(last_maint3_date) else pd.NaT
        
        vencimentos = [d for d in [next_insp, next_maint2, next_maint3] if pd.notna(d)]
        if not vencimentos: 
            continue
        proximo_vencimento_real = min(vencimentos)
        
        today_ts = pd.Timestamp(date.today())
        status_atual = "OK"
        
        if latest_record_info.get('plano_de_acao') == "FORA DE OPERAÇÃO (SUBSTITUÍDO)":
            status_atual = "FORA DE OPERAÇÃO"
        elif latest_record_info.get('aprovado_inspecao') == 'Não': 
            status_atual = "NÃO CONFORME (Aguardando Ação)"
        elif proximo_vencimento_real < today_ts: 
            status_atual = "VENCIDO"

        if status_atual == "FORA DE OPERAÇÃO":
            continue

        consolidated_data.append({
            'numero_identificacao': ext_id,
            'numero_selo_inmetro': latest_record_info.get('numero_selo_inmetro'),
            'tipo_agente': latest_record_info.get('tipo_agente'),
            'status_atual': status_atual,
            'proximo_vencimento_geral': proximo_vencimento_real.strftime('%d/%m/%Y'),
            'prox_venc_inspecao': next_insp.strftime('%d/%m/%Y') if pd.notna(next_insp) else "N/A",
            'prox_venc_maint2': next_maint2.strftime('%d/%m/%Y') if pd.notna(next_maint2) else "N/A",
            'prox_venc_maint3': next_maint3.strftime('%d/%m/%Y') if pd.notna(next_maint3) else "N/A",
            'plano_de_acao': latest_record_info.get('plano_de_acao'),
        })

    if not consolidated_data:
        return pd.DataFrame()

    dashboard_df = pd.DataFrame(consolidated_data)
    if not df_locais.empty:
        df_locais = df_locais.rename(columns={'id': 'numero_identificacao'})
        df_locais['numero_identificacao'] = df_locais['numero_identificacao'].astype(str)
        dashboard_df = pd.merge(dashboard_df, df_locais[['numero_identificacao', 'local']], on='numero_identificacao', how='left')
        dashboard_df['status_instalacao'] = dashboard_df['local'].apply(lambda x: f"✅ {x}" if pd.notna(x) and str(x).strip() != '' else "⚠️ Local não definido")
    else:
        dashboard_df['status_instalacao'] = "⚠️ Local não definido"
        
    return dashboard_df


@st.dialog("Registrar Ação Corretiva para Câmara de Espuma")
def action_dialog_foam_chamber(item_row):
    chamber_id = item_row['id_camara']
    problem = item_row['plano_de_acao']
    
    st.write(f"**Câmara ID:** `{chamber_id}`")
    st.write(f"**Problema Identificado:** `{problem}`")
    
    action_taken = st.text_area("Descreva a ação corretiva realizada:")
    responsible = st.text_input("Responsável pela ação:", value=get_user_display_name())
    
    if st.button("Salvar Ação e Regularizar Status", type="primary"):
        if not action_taken:
            st.error("Por favor, descreva a ação realizada.")
            return

        with st.spinner("Registrando ação e regularizando status..."):
            log_saved = save_foam_chamber_action_log(chamber_id, problem, action_taken, responsible)
            
            if not log_saved:
                st.error("Falha ao salvar o log da ação."); return

            # Salva uma nova inspeção "Visual" aprovada para regularizar o status
            mock_results = {q: "Conforme" for q_list in CHECKLIST_QUESTIONS.values() for q in q_list}
            inspection_saved = save_foam_chamber_inspection(
                chamber_id=chamber_id,
                inspection_type="Visual Mensal",
                overall_status="Aprovado",
                results_dict=mock_results,
                inspector_name=get_user_display_name()
            )
            
            if inspection_saved:
                st.success("Ação registrada e status do equipamento regularizado com sucesso!")
                st.cache_data.clear()
                st.rerun()
            else:
                st.error("Log salvo, mas falha ao registrar a nova inspeção de regularização.")
                
@st.dialog("Registrar Ação Corretiva para Chuveiro / Lava-Olhos")
def action_dialog_eyewash(item_row):
    equipment_id = item_row['id_equipamento']
    problem = item_row['plano_de_acao']
    
    st.write(f"**Equipamento ID:** `{equipment_id}`")
    st.write(f"**Problema Identificado:** `{problem}`")
    
    action_taken = st.text_area("Descreva a ação corretiva realizada:")
    responsible = st.text_input("Responsável pela ação:", value=get_user_display_name())
    
    st.markdown("---")
    st.write("Opcional: Anexe uma foto como evidência da ação concluída.")
    photo_evidence = st.file_uploader("Foto da Evidência", type=["jpg", "jpeg", "png"])
    
    if st.button("Salvar Ação e Regularizar Status", type="primary"):
        if not action_taken:
            st.error("Por favor, descreva a ação realizada.")
            return

        with st.spinner("Registrando ação e regularizando status..."):
            log_saved = save_eyewash_action_log(equipment_id, problem, action_taken, responsible, photo_evidence)
            
            if not log_saved:
                st.error("Falha ao salvar o log da ação. O status não foi atualizado.")
                return

            mock_results = {q: "Conforme" for q_list in CHECKLIST_QUESTIONS.values() for q in q_list}
            
            inspection_saved = save_eyewash_inspection(
                equipment_id=equipment_id,
                overall_status="Aprovado",
                results_dict=mock_results,
                photo_file=None, # Não há foto de não conformidade, pois está tudo OK
                inspector_name=get_user_display_name()
            )
            
            if inspection_saved:
                st.success("Ação registrada e status do equipamento regularizado com sucesso!")
                st.cache_data.clear()
                st.rerun()
            else:
                st.error("Log salvo, mas falha ao registrar a nova inspeção de regularização. O status pode continuar pendente.")


@st.dialog("Registrar Ação Corretiva para SCBA")
def action_dialog_scba(equipment_id, problem):
    st.write(f"**Equipamento S/N:** `{equipment_id}`")
    st.write(f"**Problema Identificado:** `{problem}`")
    action_taken = st.text_area("Descreva a ação corretiva realizada:")
    responsible = st.text_input("Responsável pela ação:", value=get_user_display_name())
    
    if st.button("Salvar Ação e Regularizar", type="primary"):
        if not action_taken: st.error("Por favor, descreva a ação."); return
        with st.spinner("Registrando..."):
            save_scba_action_log(equipment_id, problem, action_taken, responsible)
            results = {"Info": {"Status": "Regularizado via Ação Corretiva", "Ação": action_taken}}
            save_scba_visual_inspection(equipment_id, "Aprovado", results, get_user_display_name())
            st.success("Ação registrada e status regularizado!")
            st.cache_data.clear()
            st.rerun()


@st.dialog("Registrar Plano de Ação para Abrigo")
def action_dialog_shelter(shelter_id, problem):
    st.write(f"**Abrigo ID:** `{shelter_id}`")
    st.write(f"**Problema Identificado:** `{problem}`")
    
    action_taken = st.text_area("Descreva a ação corretiva realizada:")
    responsible = st.text_input("Responsável pela ação:", value=get_user_display_name())
    
    st.markdown("---")
    
    if st.button("Salvar Ação e Regularizar Status", type="primary"):
        if not action_taken:
            st.error("Por favor, descreva a ação realizada.")
            return

        with st.spinner("Registrando ação e regularizando status..."):
            log_saved = save_shelter_action_log(shelter_id, problem, action_taken, responsible)
            
            if not log_saved:
                st.error("Falha ao salvar o log da ação. O status não foi atualizado.")
                return

            
            df_shelters = load_sheet_data(SHELTER_SHEET_NAME)
            shelter_inventory_row = df_shelters[df_shelters['id_abrigo'] == shelter_id]
            
            if shelter_inventory_row.empty:
                st.error(f"Não foi possível encontrar o inventário original para o abrigo {shelter_id}. A regularização falhou.")
                return

            try:
                items_dict = json.loads(shelter_inventory_row.iloc[0]['itens_json'])
                
                inspection_results = {item: {"status": "OK", "observacao": "Regularizado via ação corretiva"} for item in items_dict}
                
                inspection_results["Condições Gerais"] = {
                    "Lacre": "Sim", "Sinalização": "Sim", "Acesso": "Sim"
                }
                
            except (json.JSONDecodeError, TypeError):
                st.error(f"O inventário do abrigo {shelter_id} está corrompido na planilha. A regularização falhou.")
                return

            inspection_saved = save_shelter_inspection(
                shelter_id=shelter_id,
                overall_status="Aprovado",
                inspection_results=inspection_results,
                inspector_name=get_user_display_name()
            )
            
            if inspection_saved:
                st.success("Plano de ação registrado e status do abrigo regularizado com sucesso!")
                st.cache_data.clear()
                st.rerun()
            else:
                st.error("Log salvo, mas falha ao registrar a nova inspeção de regularização. O status pode continuar pendente.")


@st.dialog("Registrar Ação Corretiva")
def action_form(item, df_full_history, location):
    st.write(f"**Equipamento ID:** `{item['numero_identificacao']}`")
    st.write(f"**Problema Identificado:** `{item['plano_de_acao']}`")
    
    acao_realizada = st.text_area("Descreva a ação corretiva realizada:")
    responsavel_acao = st.text_input("Responsável pela ação:", value=get_user_display_name())
    
    st.markdown("---")
    id_substituto = st.text_input("ID do Equipamento Substituto (Opcional)")

    st.markdown("---")
    st.write("Opcional: Anexe uma foto como evidência da ação concluída.")
    photo_evidence = None
    if st.toggle("📷 Anexar foto de evidência da correção", key=f"toggle_photo_{item['numero_identificacao']}"):
        st.write("**Opção 1: Tirar Foto Agora (Qualidade Menor)**")
        camera_photo = st.camera_input("Câmera", label_visibility="collapsed", key=f"ac_camera_{item['numero_identificacao']}")
        
        st.markdown("---")
        st.write("**Opção 2: Enviar da Galeria (Qualidade Alta)**")
        gallery_photo = st.file_uploader("Galeria", type=["jpg", "jpeg", "png"], label_visibility="collapsed", key=f"ac_uploader_{item['numero_identificacao']}")
        
        if gallery_photo:
            photo_evidence = gallery_photo
        else:
            photo_evidence = camera_photo
       
    if st.button("Salvar Ação", type="primary"):
        if not acao_realizada:
            st.error("Por favor, descreva a ação realizada.")
            return

        original_record = find_last_record(df_full_history, item['numero_identificacao'], 'numero_identificacao')
        if id_substituto:
            df_locais = load_sheet_data("locais")
            if not df_locais.empty:
                df_locais['id'] = df_locais['id'].astype(str)
                original_location_info = df_locais[df_locais['id'] == original_record['numero_identificacao']]
                if original_location_info.empty or pd.isna(original_location_info.iloc[0]['local']):
                     st.error("Erro: O equipamento original não tem um local definido na aba 'locais', portanto a substituição não pode ser concluída.")
                     return
            else:
                st.error("Erro: A aba 'locais' não foi encontrada ou está vazia.")
                return

        with st.spinner("Processando ação..."):
            photo_link_evidence = upload_evidence_photo(
                photo_evidence, 
                item['numero_identificacao'],
                "acao_corretiva"
            )

            substitute_last_record = {}
            if id_substituto:
                substitute_last_record = find_last_record(df_full_history, id_substituto, 'numero_identificacao') or {}
                if not substitute_last_record:
                    st.info(f"Aviso: Equipamento substituto com ID '{id_substituto}' não tem histórico. Será criado um novo registro.")

            action_details = {
                'acao_realizada': acao_realizada,
                'responsavel_acao': responsavel_acao,
                'id_substituto': id_substituto if id_substituto else None,
                'location': location,
                'photo_link': photo_link_evidence
            }
            
            if save_corrective_action(original_record, substitute_last_record, action_details, get_user_display_name()):
                st.success("Ação corretiva registrada com sucesso!")
                st.cache_data.clear() 
                st.rerun()
            else:
                st.error("Falha ao registrar a ação.")

def show_page():

    
        
    st.title("Situação Atual dos Equipamentos de Emergência")
      
    if st.button("Limpar Cache e Recarregar Dados"):
        st.cache_data.clear()
        st.rerun()

    tab_extinguishers, tab_hoses, tab_shelters, tab_scba, tab_eyewash, tab_foam, tab_multigas = st.tabs([
        "🔥 Extintores", "💧 Mangueiras", "🧯 Abrigos", "💨 C. Autônomo", "🚿 Chuveiros/Lava-Olhos", "☁️ Câmaras de Espuma", "💨 Multigás"
    ])

    location = streamlit_js_eval(js_expressions="""
        new Promise(function(resolve, reject) {
            navigator.geolocation.getCurrentPosition(
                function(position) { resolve({ latitude: position.coords.latitude, longitude: position.coords.longitude }); },
                function(error) { resolve(null); }
            );
        });
    """)

    with tab_extinguishers:
        st.header("Dashboard de Extintores")

        with st.expander("📄 Gerar Relatório Mensal..."):
            show_monthly_report_interface()
        st.markdown("---")
        
        df_full_history = load_sheet_data("extintores")
        df_locais = load_sheet_data("locais") 

        if df_full_history.empty:
            st.warning("Ainda não há registros de inspeção para exibir."); return

        with st.spinner("Analisando o status de todos os extintores..."):
            dashboard_df = get_consolidated_status_df(df_full_history, df_locais)
        
        if dashboard_df.empty:
            st.warning("Não foi possível gerar o dashboard ou não há equipamentos ativos."); return

        status_counts = dashboard_df['status_atual'].value_counts()
        col1, col2, col3, col4 = st.columns(4)
        col1.metric("✅ Total Ativo", len(dashboard_df))
        col2.metric("🟢 OK", status_counts.get("OK", 0))
        col3.metric("🔴 VENCIDO", status_counts.get("VENCIDO", 0))
        col4.metric("🟠 NÃO CONFORME", status_counts.get("NÃO CONFORME (Aguardando Ação)", 0))
        st.markdown("---")
        
        status_filter = st.multiselect("Filtrar por Status:", options=sorted(dashboard_df['status_atual'].unique()), default=sorted(dashboard_df['status_atual'].unique()))
        filtered_df = dashboard_df[dashboard_df['status_atual'].isin(status_filter)]
        
        st.subheader("Lista de Equipamentos")
        
        if filtered_df.empty:
            st.info("Nenhum item corresponde ao filtro selecionado.")
        else:
            for index, row in filtered_df.iterrows():
                status_icon = "🟢" if row['status_atual'] == 'OK' else ('🔴' if row['status_atual'] == 'VENCIDO' else '🟠')
                
                expander_title = f"{status_icon} **ID:** {row['numero_identificacao']} | **Tipo:** {row['tipo_agente']} | **Status:** {row['status_atual']} | **Localização:** {row['status_instalacao']}"
                
                with st.expander(expander_title):
                    st.markdown(f"**Plano de Ação Sugerido:** {row['plano_de_acao']}")
                    st.markdown("---")
                    st.subheader("Próximos Vencimentos:")
                    
                    col_venc1, col_venc2, col_venc3 = st.columns(3)
                    col_venc1.metric("Inspeção Mensal", value=row['prox_venc_inspecao'])
                    col_venc2.metric("Manutenção Nível 2", value=row['prox_venc_maint2'])
                    col_venc3.metric("Manutenção Nível 3", value=row['prox_venc_maint3'])

                    st.caption(f"Último Selo INMETRO registrado: {row.get('numero_selo_inmetro', 'N/A')}")
                    
                    if row['status_atual'] != 'OK':
                        st.markdown("---")
                        if st.button("✍️ Registrar Ação Corretiva", key=f"action_ext_{index}", width='stretch'):
                            action_form(row.to_dict(), df_full_history, location)
                            
                           

    with tab_hoses:
        st.header("Dashboard de Mangueiras de Incêndio")
        
        df_hoses_history = load_sheet_data(HOSE_SHEET_NAME)
        df_disposals = load_sheet_data(HOSE_DISPOSAL_LOG_SHEET_NAME) 

        if df_hoses_history.empty:
            st.warning("Ainda não há registros de inspeção de mangueiras para exibir no dashboard.")
        else:
            dashboard_df_hoses = get_hose_status_df(df_hoses_history, df_disposals)
            
            status_counts = dashboard_df_hoses['status'].value_counts()
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("✅ Total Ativas", len(dashboard_df_hoses))
            col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
            col3.metric("🔴 VENCIDO", status_counts.get("🔴 VENCIDO", 0))
            col4.metric("🟠 REPROVADA", status_counts.get("🟠 REPROVADA", 0)) # Nova métrica
            
            st.markdown("---")
            
            st.subheader("Lista de Mangueiras Ativas")
            
            # Itera sobre o dataframe para adicionar o botão de ação
            for _, row in dashboard_df_hoses.iterrows():
                if row['status'] == '🟠 REPROVADA':
                    with st.container(border=True):
                        cols = st.columns([5, 2])
                        with cols[0]:
                            st.markdown(f"**ID:** {row['id_mangueira']} | **Status:** {row['status']} | **Próx. Teste:** {row['data_proximo_teste']}")
                        with cols[1]:
                            if st.button("🗑️ Registrar Baixa", key=f"dispose_{row['id_mangueira']}", use_container_width=True):
                                dispose_hose_dialog(row['id_mangueira'])
                else:
                    st.text(f"ID: {row['id_mangueira']} | Status: {row['status']} | Próx. Teste: {row['data_proximo_teste']}")
            
            with st.expander("Ver tabela completa de mangueiras ativas"):
                st.dataframe(
                    dashboard_df_hoses,
                    column_config={
                        "id_mangueira": "ID", "status": "Status", "marca": "Marca",
                        "diametro": "Diâmetro", "tipo": "Tipo", "comprimento": "Comprimento",
                        "ano_fabricacao": "Ano Fab.", "data_inspecao": "Último Teste",
                        "data_proximo_teste": "Próximo Teste", "registrado_por": "Registrado Por",
                        "link_certificado_pdf": st.column_config.LinkColumn(
                            "Certificado", display_text="🔗 Ver PDF"
                        )
                    },
                    hide_index=True,
                    use_container_width=True
                )
    
    with tab_shelters:
        st.header("Dashboard de Status dos Abrigos de Emergência")
        
        df_shelters_registered = load_sheet_data(SHELTER_SHEET_NAME)
        df_inspections_history = load_sheet_data(INSPECTIONS_SHELTER_SHEET_NAME)
        df_action_log = load_sheet_data(LOG_SHELTER_SHEET_NAME)

        if df_shelters_registered.empty:
            st.warning("Nenhum abrigo de emergência cadastrado.")
        else:
            st.info("Aqui está o status de todos os abrigos. Gere um relatório de status completo para impressão ou registre ações corretivas.")
            if st.button("📄 Gerar Relatório de Status em PDF", type="primary"):
                report_html = generate_shelters_html(df_shelters_registered, df_inspections_history, df_action_log)
                js_code = f"""
                    const reportHtml = {json.dumps(report_html)};
                    const printWindow = window.open('', '_blank');
                    if (printWindow) {{
                        printWindow.document.write(reportHtml);
                        printWindow.document.close();
                        printWindow.focus();
                        setTimeout(() => {{ printWindow.print(); printWindow.close(); }}, 500);
                    }} else {{
                        alert('Por favor, desabilite o bloqueador de pop-ups para este site.');
                    }}
                """
                streamlit_js_eval(js_expressions=js_code, key="print_shelters_js")
                st.success("Relatório de status enviado para impressão!")
            st.markdown("---")

            dashboard_df_shelters = get_shelter_status_df(df_shelters_registered, df_inspections_history)
            
            status_counts = dashboard_df_shelters['status_dashboard'].value_counts()
            ok_count = status_counts.get("🟢 OK", 0) + status_counts.get("🟢 OK (Ação Realizada)", 0)
            pending_count = status_counts.get("🟠 COM PENDÊNCIAS", 0) + status_counts.get("🔵 PENDENTE (Nova Inspeção)", 0)
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("✅ Total de Abrigos", len(dashboard_df_shelters))
            col2.metric("🟢 OK", ok_count)
            col3.metric("🟠 Pendentes", pending_count)
            col4.metric("🔴 Vencido", status_counts.get("🔴 VENCIDO", 0))
            st.markdown("---")
            
            st.subheader("Lista de Abrigos e Status")
            for _, row in dashboard_df_shelters.iterrows():
                status = row['status_dashboard']
                prox_inspecao_str = row['data_proxima_inspecao_str']
                local_info = row.get('local', 'N/A') 
                expander_title = f"{status} | **ID:** {row['id_abrigo']} | **Local:** {local_info} | **Próx. Inspeção:** {prox_inspecao_str}"
                
                with st.expander(expander_title):
                    data_inspecao_str = row['data_inspecao_str']
                    st.write(f"**Última inspeção:** {data_inspecao_str} por **{row['inspetor']}**")
                    st.write(f"**Resultado da última inspeção:** {row.get('status_geral', 'N/A')}")
                    
                    if status not in ["🟢 OK", "🟢 OK (Ação Realizada)"]:
                        problem_description = status.replace("🔴 ", "").replace("🟠 ", "").replace("🔵 ", "")
                        if st.button("✍️ Registrar Ação", key=f"action_{row['id_abrigo']}", use_container_width=True):
                            action_dialog_shelter(row['id_abrigo'], problem_description)
                    
                    st.markdown("---")
                    st.write("**Detalhes da Última Inspeção:**")

                    try:
                        results_dict = json.loads(row['resultados_json'])
                        
                        if results_dict:                
                            general_conditions = results_dict.pop('Condições Gerais', {})
                           
                            if results_dict: 
                                st.write("**Itens do Inventário:**")
                                items_df = pd.DataFrame.from_dict(results_dict, orient='index')
                                st.table(items_df)
                            
                            if general_conditions:
                                st.write("**Condições Gerais do Abrigo:**")
                                cols = st.columns(len(general_conditions))
                                for i, (key, value) in enumerate(general_conditions.items()):
                                    with cols[i]:
                                        st.metric(label=key, value=value)
                            
                        else:
                            st.info("Nenhum detalhe de inspeção disponível.")
                            
                    except (json.JSONDecodeError, TypeError):
                        st.error("Não foi possível carregar os detalhes desta inspeção (formato inválido).")
    
    with tab_scba:
        st.header("Dashboard de Status dos Conjuntos Autônomos")
        
        # Carrega os dados diretamente como DataFrames
        df_scba_main = load_sheet_data(SCBA_SHEET_NAME)
        df_scba_visual = load_sheet_data(SCBA_VISUAL_INSPECTIONS_SHEET_NAME)

        # A VERIFICAÇÃO AGORA USA .empty
        if df_scba_main.empty:
            st.warning("Nenhum teste de equipamento (Posi3) registrado.")
        else:
            dashboard_df = get_scba_status_df(df_scba_main, df_scba_visual)
            
            if dashboard_df.empty:
                st.info("Não há equipamentos SCBA para exibir no dashboard.")
            else:
                status_counts = dashboard_df['status_consolidado'].value_counts()
                col1, col2, col3, col4 = st.columns(4)
                col1.metric("✅ Total", len(dashboard_df))
                col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
                col3.metric("🟠 Pendências", status_counts.get("🟠 COM PENDÊNCIAS", 0))
                col4.metric("🔴 Vencidos", status_counts.get("🔴 VENCIDO (Teste Posi3)", 0) + status_counts.get("🔴 VENCIDO (Insp. Periódica)", 0))
                st.markdown("---")
                
                for _, row in dashboard_df.iterrows():
                    val_teste_str = pd.to_datetime(row['data_validade']).strftime('%d/%m/%Y') if pd.notna(row['data_validade']) else 'N/A'
                    prox_insp_str = pd.to_datetime(row['data_proxima_inspecao']).strftime('%d/%m/%Y') if pd.notna(row['data_proxima_inspecao']) else 'N/A'
                    status = row['status_consolidado']
                    expander_title = f"{status} | **S/N:** {row['numero_serie_equipamento']} | **Val. Teste:** {val_teste_str} | **Próx. Insp.:** {prox_insp_str}"
                    
                    with st.expander(expander_title):
                        data_insp_str = pd.to_datetime(row.get('data_inspecao')).strftime('%d/%m/%Y') if pd.notna(row.get('data_inspecao')) else 'N/A'
                        st.write(f"**Última Inspeção Periódica:** {data_insp_str} - **Status:** {row.get('status_geral', 'N/A')}")
                        
                        if status != "🟢 OK":
                            if st.button("✍️ Registrar Plano de Ação", key=f"action_scba_{row['numero_serie_equipamento']}", use_container_width=True):
                                action_dialog_scba(row['numero_serie_equipamento'], status)
                        
                        st.markdown("**Detalhes da Última Inspeção Periódica:**")
                    try:
                        results_json = row.get('resultados_json')
                        if results_json and pd.notna(results_json):
                            results = json.loads(results_json)
                            
                            with st.expander("Ver detalhes da inspeção"):
                                
                                st.markdown("""
                                <style>
                                .small-font {
                                    font-size:0.9rem;
                                    line-height: 1.2;
                                }
                                </style>
                                """, unsafe_allow_html=True)

                                # 1. Testes Funcionais (agora dentro de colunas menores)
                                st.markdown("<p class='small-font' style='font-weight: bold;'>Testes Funcionais</p>", unsafe_allow_html=True)
                                testes = results.get("Testes Funcionais", {})
                                if testes:
                                    cols_testes = st.columns(len(testes))
                                    for i, (teste, resultado) in enumerate(testes.items()):
                                        icon = "✅" if resultado == "Aprovado" else "❌"
                                        # Usando markdown para controlar o tamanho
                                        cols_testes[i].markdown(f"<p class='small-font'><b>{teste}</b><br>{icon} {resultado}</p>", unsafe_allow_html=True)
                                
                                # 2. Checklist Visual
                                st.markdown("<p class='small-font' style='font-weight: bold; margin-top: 10px;'>Checklist Visual</p>", unsafe_allow_html=True)
                                col_cilindro, col_mascara = st.columns(2)

                                with col_cilindro:
                                    st.markdown("<p class='small-font'><b>Cilindro de Ar</b></p>", unsafe_allow_html=True)
                                    cilindro_itens = results.get("Cilindro", {})
                                    obs_cilindro = cilindro_itens.pop("Observações", "")
                                    for item, status in cilindro_itens.items():
                                        icon = "✔️" if status == "C" else ("❌" if status == "N/C" else "➖")
                                        st.markdown(f"<p class='small-font'>{icon} {item}</p>", unsafe_allow_html=True)
                                    if obs_cilindro:
                                        st.markdown(f"<p class='small-font' style='font-style: italic;'>Obs: {obs_cilindro}</p>", unsafe_allow_html=True)

                                with col_mascara:
                                    st.markdown("<p class='small-font'><b>Máscara Facial</b></p>", unsafe_allow_html=True)
                                    mascara_itens = results.get("Mascara", {})
                                    obs_mascara = mascara_itens.pop("Observações", "")
                                    for item, status in mascara_itens.items():
                                        icon = "✔️" if status == "C" else ("❌" if status == "N/C" else "➖")
                                        st.markdown(f"<p class='small-font'>{icon} {item}</p>", unsafe_allow_html=True)
                                    if obs_mascara:
                                        st.markdown(f"<p class='small-font' style='font-style: italic;'>Obs: {obs_mascara}</p>", unsafe_allow_html=True)

                        else:
                            st.info("Nenhum detalhe de inspeção periódica encontrado.")
                    except (json.JSONDecodeError, TypeError, AttributeError):
                        st.info("Nenhum detalhe de inspeção periódica encontrado.")

    with tab_eyewash:
        st.header("Dashboard de Chuveiros e Lava-Olhos")
        
        df_eyewash_history = load_sheet_data(EYEWASH_INSPECTIONS_SHEET_NAME)
        
        if df_eyewash_history.empty:
            st.warning("Nenhuma inspeção de chuveiro/lava-olhos registrada.")
        else:
            dashboard_df = get_eyewash_status_df(df_eyewash_history)
            
            status_counts = dashboard_df['status_dashboard'].value_counts()
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("✅ Total de Equipamentos", len(dashboard_df))
            col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
            col3.metric("🟠 Com Pendências", status_counts.get("🟠 COM PENDÊNCIAS", 0))
            col4.metric("🔴 Vencido", status_counts.get("🔴 VENCIDO", 0))
            st.markdown("---")

            st.subheader("Lista de Equipamentos e Status")
            for _, row in dashboard_df.iterrows():
                status = row['status_dashboard']
                prox_inspecao = pd.to_datetime(row['data_proxima_inspecao']).strftime('%d/%m/%Y')
                expander_title = f"{status} | **ID:** {row['id_equipamento']} | **Próx. Inspeção:** {prox_inspecao}"
                
                with st.expander(expander_title):
                    st.write(f"**Última inspeção:** {pd.to_datetime(row['data_inspecao']).strftime('%d/%m/%Y')} por **{row['inspetor']}**")
                    st.write(f"**Plano de Ação Sugerido:** {row['plano_de_acao']}")
                    
                    if status == "🟠 COM PENDÊNCIAS":
                        if st.button("✍️ Registrar Ação Corretiva", key=f"action_eyewash_{row['id_equipamento']}"):
                            action_dialog_eyewash(row.to_dict())

                    st.markdown("---")
                    st.write("**Detalhes da Última Inspeção:**")
                    try:
                        results = json.loads(row['resultados_json'])
                        non_conformities = {q: status for q, status in results.items() if status == "Não Conforme"}
                        if non_conformities:
                            st.table(pd.DataFrame.from_dict(non_conformities, orient='index', columns=['Status']))
                        else:
                            st.success("Todos os itens estavam conformes na última inspeção.")
                        
                        photo_link = row.get('link_foto_nao_conformidade')
                        if pd.notna(photo_link):
                            st.image(photo_link, caption="Foto da Não Conformidade", width=300)

                    except (json.JSONDecodeError, TypeError):
                        st.error("Não foi possível carregar os detalhes da inspeção.")

    
    with tab_foam:
        st.header("Dashboard de Câmaras de Espuma")
        
        df_foam_inventory = load_sheet_data(FOAM_CHAMBER_INVENTORY_SHEET_NAME)
        df_foam_history = load_sheet_data(FOAM_CHAMBER_INSPECTIONS_SHEET_NAME)
        
        if df_foam_history.empty:
            st.warning("Nenhuma inspeção de câmara de espuma registrada.")
        else:
            dashboard_df = get_foam_chamber_status_df(df_foam_history)
            
            if not df_foam_inventory.empty:
                dashboard_df = pd.merge(
                    dashboard_df, 
                    df_foam_inventory[['id_camara', 'localizacao', 'modelo']], 
                    on='id_camara', 
                    how='left'
                )
            else:
                dashboard_df['localizacao'] = 'Localização não definida'
                dashboard_df['modelo'] = 'N/A'
            
            dashboard_df['localizacao'] = dashboard_df['localizacao'].fillna('Localização não definida')

            status_counts = dashboard_df['status_dashboard'].value_counts()
            col1, col2, col3, col4 = st.columns(4)
            col1.metric("✅ Total de Câmaras", len(dashboard_df))
            col2.metric("🟢 OK", status_counts.get("🟢 OK", 0))
            col3.metric("🟠 Com Pendências", status_counts.get("🟠 COM PENDÊNCIAS", 0))
            col4.metric("🔴 Vencido", status_counts.get("🔴 VENCIDO", 0))
            st.markdown("---")

            st.subheader("Status dos Equipamentos por Localização")
            
            grouped_by_location = dashboard_df.groupby('localizacao')

            for location, group_df in grouped_by_location:
                location_status_counts = group_df['status_dashboard'].value_counts()
                ok_count = location_status_counts.get("🟢 OK", 0)
                pending_count = location_status_counts.get("🟠 COM PENDÊNCIAS", 0)
                expired_count = location_status_counts.get("🔴 VENCIDO", 0)

                expander_title = f"📍 **Local:** {location}  |  (🟢{ok_count} OK, 🟠{pending_count} Pendente, 🔴{expired_count} Vencido)"
                
                with st.expander(expander_title):
                    for _, row in group_df.iterrows():
                        status = row['status_dashboard']
                        modelo = row.get('modelo', 'N/A')
                        ultima_inspecao_str = pd.to_datetime(row['data_inspecao']).strftime('%d/%m/%Y') if pd.notna(row['data_inspecao']) else "N/A"
                        prox_inspecao_str = pd.to_datetime(row['data_proxima_inspecao']).strftime('%d/%m/%Y') if pd.notna(row['data_proxima_inspecao']) else "N/A"
                        
                        with st.container(border=True):
                            st.markdown(f"##### {status} | **ID:** {row['id_camara']} | **Modelo:** {modelo}")
                            
                            cols = st.columns(3)
                            cols[0].metric("Última Inspeção", pd.to_datetime(row['data_inspecao']).strftime('%d/%m/%Y'))
                            cols[1].metric("Próxima Inspeção", prox_inspecao)
                            cols[2].metric("Tipo da Última Insp.", row.get('tipo_inspecao', 'N/A'))
                            
                            st.write(f"**Plano de Ação Sugerido:** {row['plano_de_acao']}")
                            
                            if status == "🟠 COM PENDÊNCIAS":
                                if st.button("✍️ Registrar Ação Corretiva", key=f"action_foam_{row['id_camara']}", use_container_width=True):
                                    action_dialog_foam_chamber(row.to_dict())

                            with st.expander("Ver detalhes da última inspeção"):
                                try:
                                    results = json.loads(row['resultados_json'])
                                    non_conformities = {q: status_item for q, status_item in results.items() if status_item == "Não Conforme"}
                                    if non_conformities:
                                        st.table(pd.DataFrame.from_dict(non_conformities, orient='index', columns=['Status']))
                                    else:
                                        st.success("Todos os itens estavam conformes na última inspeção.")
                                    
                                    photo_link = row.get('link_foto_nao_conformidade')
                                    if pd.notna(photo_link):
                                        st.markdown(f"**[🔗 Ver Foto da Evidência]({photo_link})**", unsafe_allow_html=True)

                                except (json.JSONDecodeError, TypeError):
                                    st.error("Não foi possível carregar os detalhes da inspeção.")

    with tab_multigas:
        st.header("Dashboard de Detectores Multigás")
        df_inventory = load_sheet_data(MULTIGAS_INVENTORY_SHEET_NAME)
        df_inspections = load_sheet_data(MULTIGAS_INSPECTIONS_SHEET_NAME)

        if df_inventory.empty:
            st.warning("Nenhum detector multigás cadastrado.")
        else:
            dashboard_df = get_multigas_status_df(df_inventory, df_inspections)
            
            # --- LÓGICA DE MÉTRICAS ATUALIZADA ---
            total_equip = len(dashboard_df)
            calib_ok = (dashboard_df['status_calibracao'] == '🟢 OK').sum()
            bump_ok = (dashboard_df['status_bump_test'] == '🟢 OK').sum()
            
            col1, col2, col3 = st.columns(3)
            col1.metric("✅ Total de Detectores", total_equip)
            col2.metric("🗓️ Calibração Anual OK", f"{calib_ok} / {total_equip}")
            col3.metric("💨 Bump Test OK", f"{bump_ok} / {total_equip}")
            st.markdown("---")

            st.subheader("Lista de Detectores e Status")
            for _, row in dashboard_df.iterrows():
                
                # --- LÓGICA DE EXIBIÇÃO ATUALIZADA ---
                status_calibracao = row['status_calibracao']
                status_bump = row['status_bump_test']
                
                # Define um ícone de status geral (a pior condição prevalece)
                geral_icon = "🟢"
                if "🔴" in status_calibracao or "🟠" in status_bump:
                    geral_icon = "🔴" if "🔴" in status_calibracao else "🟠"
                elif "🔵" in status_calibracao or "🔵" in status_bump:
                    geral_icon = "🔵"
                
                prox_calibracao_str = pd.to_datetime(row['proxima_calibracao']).strftime('%d/%m/%Y') if pd.notna(row['proxima_calibracao']) else "N/A"
                
                expander_title = f"{geral_icon} **ID:** {row['id_equipamento']} | **S/N:** {row['numero_serie']}"
                
                with st.expander(expander_title):
                    st.write(f"**Marca/Modelo:** {row.get('marca', 'N/A')} / {row.get('modelo', 'N/A')}")
                    
                    cols = st.columns(2)
                    with cols[0]:
                        st.subheader("Status da Calibração Anual")
                        st.markdown(f"**Status:** {status_calibracao}")
                        st.markdown(f"**Próxima Calibração:** {prox_calibracao_str}")
                        if status_calibracao != '🟢 OK':
                            st.warning(f"**Ação:** Realizar calibração anual do equipamento.")

                    with cols[1]:
                        st.subheader("Status do Último Bump Test")
                        ultimo_bump_str = pd.to_datetime(row['data_ultimo_bump_test']).strftime('%d/%m/%Y') if pd.notna(row['data_ultimo_bump_test']) else "N/A"
                        st.markdown(f"**Status:** {status_bump}")
                        st.markdown(f"**Data do Último Teste:** {ultimo_bump_str}")
                        if status_bump == '🟠 REPROVADO':
                            st.error(f"**Ação:** Equipamento reprovado. Enviar para manutenção/calibração.")
                        elif status_bump == '🔵 PENDENTE':
                             st.info(f"**Ação:** Realizar novo teste de resposta.")

                    # Opcional: Mostrar detalhes da última calibração (se houver)
                    if pd.notna(row.get('link_certificado')):
                        st.markdown(f"**[🔗 Ver Último Certificado de Calibração]({row.get('link_certificado')})**")

