import streamlit as st
import json
import numpy as np
import pandas as pd
from supabase.client import get_supabase_client
from datetime import date, timedelta
from storage.client import upload_evidence_photo
from utils.auditoria import log_action

# Define a estrutura do checklist de inspeção para sistemas de alarme
CHECKLIST_QUESTIONS = {
    "Componentes Físicos": [
        "Painel de controle sem danos físicos",
        "Fiação e conexões em bom estado",
        "Dispositivos de alarme (sirenes, luzes) intactos",
        "Baterias de backup em bom estado",
        "Detectores de fumaça/calor limpos e sem danos"
    ],
    "Funcionamento": [
        "Painel de controle em estado normal (sem indicação de falhas)",
        "Sirenes funcionam corretamente durante teste",
        "Luzes estroboscópicas funcionam corretamente",
        "Sistema comunica com central de monitoramento (se aplicável)",
        "Bateria de backup carrega corretamente"
    ],
    "Sensores e Detectores": [
        "Detectores de fumaça respondem ao teste",
        "Detectores de calor funcionam corretamente",
        "Acionadores manuais respondem quando ativados",
        "Sensores de fluxo de água (se aplicável) funcionam",
        "Cobertura de sensores adequada para o ambiente"
    ],
    "Documentação e Sinalização": [
        "Instruções de operação visíveis e legíveis",
        "Plano de evacuação atualizado e visível",
        "Registros de manutenção anteriores disponíveis",
        "Contatos de emergência atualizados",
        "Sinalização de rotas de fuga adequada"
    ]
}

# Mapeamento de ações corretivas para problemas comuns
ACTION_PLAN_MAP = {
    "Painel de controle sem danos físicos": "Solicitar reparo ou substituição do painel de controle danificado.",
    "Fiação e conexões em bom estado": "Realizar manutenção na fiação danificada e reconectar pontos soltos.",
    "Dispositivos de alarme (sirenes, luzes) intactos": "Substituir sirenes ou luzes estroboscópicas danificadas.",
    "Baterias de backup em bom estado": "Substituir baterias de backup que não estejam mantendo carga.",
    "Detectores de fumaça/calor limpos e sem danos": "Limpar ou substituir detectores danificados ou sujos.",
    "Painel de controle em estado normal (sem indicação de falhas)": "Investigar e corrigir falhas indicadas no painel.",
    "Sirenes funcionam corretamente durante teste": "Substituir ou reparar sirenes que não funcionam durante o teste.",
    "Luzes estroboscópicas funcionam corretamente": "Substituir luzes estroboscópicas defeituosas.",
    "Sistema comunica com central de monitoramento (se aplicável)": "Verificar e restaurar a comunicação com a central de monitoramento.",
    "Bateria de backup carrega corretamente": "Substituir carregador ou bateria que não mantém carga.",
    "Detectores de fumaça respondem ao teste": "Substituir detectores de fumaça que não respondem ao teste.",
    "Detectores de calor funcionam corretamente": "Substituir detectores de calor que não respondem corretamente.",
    "Acionadores manuais respondem quando ativados": "Reparar ou substituir acionadores manuais que não funcionam.",
    "Sensores de fluxo de água (se aplicável) funcionam": "Verificar e reparar sensores de fluxo de água.",
    "Cobertura de sensores adequada para o ambiente": "Adicionar sensores adicionais para garantir cobertura adequada.",
    "Instruções de operação visíveis e legíveis": "Atualizar e reposicionar instruções de operação.",
    "Plano de evacuação atualizado e visível": "Atualizar e exibir corretamente o plano de evacuação.",
    "Registros de manutenção anteriores disponíveis": "Organizar e disponibilizar registros de manutenção anteriores.",
    "Contatos de emergência atualizados": "Atualizar lista de contatos de emergência.",
    "Sinalização de rotas de fuga adequada": "Instalar ou atualizar sinalizações de rota de fuga."
}


def save_new_alarm_system(alarm_id, location, brand=None, model=None):
    """
    Salva um novo sistema de alarme no inventário.
    """
    try:
        if not alarm_id or not str(alarm_id).strip():
            st.error("Erro: ID do sistema é obrigatório.")
            return False

        if not location or not str(location).strip():
            st.error("Erro: Localização é obrigatória.")
            return False

        alarm_id = str(alarm_id).strip()
        location = str(location).strip()
        brand = str(brand).strip() if brand else ""
        model = str(model).strip() if model else ""

        db_client = get_supabase_client()

        df_inventory = db_client.get_data("inventario_alarmes")
        if not df_inventory.empty:
            existing_ids = df_inventory['id_sistema'].astype(
                str).str.strip().str.upper()
            if alarm_id.upper() in existing_ids.values:
                st.error(f"Erro: O ID '{alarm_id}' já está cadastrado.")
                return False

        new_record = {
            "id_sistema": alarm_id,
            "localizacao": location,
            "marca": brand,
            "modelo": model,
            "data_cadastro": date.today().isoformat()
        }

        db_client.append_data("inventario_alarmes", new_record)

        model_info = f", Modelo: {model}" if model else ""
        brand_info = f", Marca: {brand}" if brand else ""
        log_action("CADASTROU_SISTEMA_ALARME",
                   f"ID: {alarm_id}{brand_info}{model_info}")

        return True

    except Exception as e:
        import logging
        logging.error(f"Erro ao salvar sistema de alarme {alarm_id}: {e}")

        st.error(f"Erro ao salvar novo sistema de alarme: {e}")
        return False


def save_alarm_inspection(system_id, overall_status, results_dict, photo_file, inspector_name):
    """
    Salva uma nova inspeção de sistema de alarme no Supabase.
    """
    try:
        if not system_id or not str(system_id).strip():
            st.error("Erro: ID do sistema é obrigatório.")
            return False

        if not overall_status or overall_status not in ["Aprovado", "Reprovado com Pendências"]:
            st.error(
                "Erro: Status geral deve ser 'Aprovado' ou 'Reprovado com Pendências'.")
            return False

        if not isinstance(results_dict, dict):
            st.error("Erro: Resultados da inspeção devem ser um dicionário.")
            return False

        if not inspector_name or not str(inspector_name).strip():
            st.error("Erro: Nome do inspetor é obrigatório.")
            return False

        system_id = str(system_id).strip()
        inspector_name = str(inspector_name).strip()

        db_client = get_supabase_client()

        today = date.today()
        next_inspection_date = (today + timedelta(days=7)).isoformat()

        photo_link = None
        if photo_file:
            st.info("Fazendo upload da foto de evidência...")
            try:
                photo_link = upload_evidence_photo(
                    photo_file,
                    system_id,
                    "nao_conformidade_alarme"
                )

                if photo_link:
                    st.success("Foto de evidência salva com sucesso!")
                else:
                    st.warning(
                        "Não foi possível salvar a foto. Continuando sem foto...")

            except Exception as photo_error:
                st.warning(
                    f"Erro no upload da foto: {photo_error}. Continuando sem foto...")
                photo_link = None

        non_conformities = []
        for category, questions in results_dict.items():
            if isinstance(questions, dict):
                for question, status in questions.items():
                    if status == "Não Conforme":
                        non_conformities.append(question)
            elif questions == "Não Conforme":
                non_conformities.append(category)

        action_plan = generate_alarm_action_plan(non_conformities)

        try:
            results_json = json.dumps(
                results_dict, ensure_ascii=False, indent=2)
        except Exception as json_error:
            st.warning(f"Erro ao converter resultados para JSON: {json_error}")
            results_json = str(results_dict)

        inspection_record = {
            "data_inspecao": today.isoformat(),
            "id_sistema": system_id,
            "status_geral": overall_status,
            "plano_de_acao": action_plan,
            "resultados_json": results_json,
            "link_foto_nao_conformidade": photo_link or "",
            "inspetor": inspector_name,
            "data_proxima_inspecao": next_inspection_date
        }

        db_client.append_data("inspecoes_alarmes", inspection_record)

        non_conf_count = len(non_conformities)
        photo_status = "com foto" if photo_link else "sem foto"
        log_details = f"ID: {system_id}, Status: {overall_status}, Não conformidades: {non_conf_count}, {photo_status}"

        log_action("SALVOU_INSPECAO_ALARME", log_details)

        return True

    except Exception as e:
        import logging
        error_details = f"Sistema: {system_id if 'system_id' in locals() else 'N/A'}, Erro: {str(e)}"
        logging.error(f"Erro ao salvar inspeção de alarme: {error_details}")

        st.error(
            f"Ocorreu um erro inesperado ao salvar a inspeção para o sistema {system_id if 'system_id' in locals() else 'N/A'}:")
        st.error(f"Detalhes do erro: {e}")

        return False


def save_alarm_action_log(system_id, problem, action_taken, responsible, photo_file=None):
    """
    Salva um registro de ação corretiva para um sistema de alarme no log.
    """
    try:
        db_client = get_supabase_client()

        photo_link = None
        if photo_file:
            try:
                photo_link = upload_evidence_photo(
                    photo_file,
                    system_id,
                    "acao_corretiva_alarme"
                )
            except Exception as photo_error:
                st.warning(
                    f"Erro no upload da foto: {photo_error}. Continuando sem foto...")

        log_record = {
            "data_acao": date.today().isoformat(),
            "id_sistema": system_id,
            "problema_identificado": problem,
            "acao_realizada": action_taken,
            "responsavel": responsible,
            "link_foto_evidencia": photo_link or ""
        }

        db_client.append_data("log_acoes_alarmes", log_record)
        log_action("REGISTROU_ACAO_ALARME",
                   f"ID: {system_id}, Ação: {action_taken[:50]}...")
        return True

    except Exception as e:
        st.error(f"Erro ao salvar log de ação para o sistema {system_id}: {e}")
        return False


def get_alarm_status_df(df_inspections):
    """
    Gera DataFrame de status para sistemas de alarme.
    MODIFICADO: Atualizado para periodicidade semanal

    Args:
        df_inspections: DataFrame das inspeções realizadas

    Returns:
        pd.DataFrame: Status dos sistemas de alarme
    """
    if df_inspections.empty:
        return pd.DataFrame()

    df_inspections['data_inspecao'] = pd.to_datetime(
        df_inspections['data_inspecao'], errors='coerce')

    latest_inspections = df_inspections.sort_values(
        'data_inspecao', ascending=False).drop_duplicates(subset='id_sistema', keep='first').copy()

    today = pd.Timestamp(date.today())
    latest_inspections['data_proxima_inspecao'] = pd.to_datetime(
        latest_inspections['data_proxima_inspecao'], errors='coerce')

    conditions = [
        (latest_inspections['data_proxima_inspecao'] < today),
        ((latest_inspections['status_geral'] == 'Reprovado com Pendências') &
         (latest_inspections['data_proxima_inspecao'] >= today))
    ]

    choices = ['🔴 VENCIDO', '🟠 COM PENDÊNCIAS']

    latest_inspections['status_dashboard'] = np.select(
        conditions, choices, default='🟢 OK')

    return latest_inspections


def generate_alarm_action_plan(non_conformities):
    """
    Gera um plano de ação consolidado para uma lista de não conformidades de sistemas de alarme.
    """
    if not non_conformities or len(non_conformities) == 0:
        return "Manter em monitoramento periódico conforme cronograma estabelecido."

    action_priorities = {
        "crítico": [
            "Sistema comunica com central de monitoramento",
            "Sirenes funcionam corretamente durante teste",
            "Detectores de fumaça respondem ao teste",
            "Acionadores manuais respondem quando ativados"
        ],

        "manutenção": [
            "Painel de controle sem danos físicos",
            "Fiação e conexões em bom estado",
            "Baterias de backup em bom estado",
            "Detectores de fumaça/calor limpos e sem danos"
        ],

        "documentação": [
            "Instruções de operação visíveis e legíveis",
            "Plano de evacuação atualizado e visível",
            "Contatos de emergência atualizados",
            "Sinalização de rotas de fuga adequada"
        ]
    }

    critical_issues = []
    maintenance_issues = []
    documentation_issues = []
    other_issues = []

    for issue in non_conformities:
        if any(critical in issue for critical in action_priorities["crítico"]):
            critical_issues.append(issue)
        elif any(maint in issue for maint in action_priorities["manutenção"]):
            maintenance_issues.append(issue)
        elif any(doc in issue for doc in action_priorities["documentação"]):
            documentation_issues.append(issue)
        else:
            other_issues.append(issue)

    if critical_issues:
        return f"AÇÃO IMEDIATA NECESSÁRIA: Corrigir problemas críticos de segurança ({len(critical_issues)} item(s)). Sistema pode estar comprometido. Verificar: {', '.join(critical_issues[:2])}{'...' if len(critical_issues) > 2 else ''}."

    elif maintenance_issues:
        return f"MANUTENÇÃO PREVENTIVA: Realizar manutenção em {len(maintenance_issues)} componente(s). Agendar serviço técnico para: {', '.join(maintenance_issues[:2])}{'...' if len(maintenance_issues) > 2 else ''}."

    elif documentation_issues:
        return f"ATUALIZAÇÃO DE DOCUMENTAÇÃO: Revisar e atualizar {len(documentation_issues)} item(s) de documentação/sinalização. Itens: {', '.join(documentation_issues[:2])}{'...' if len(documentation_issues) > 2 else ''}."

    elif other_issues:
        return f"CORREÇÕES NECESSÁRIAS: Corrigir {len(other_issues)} não conformidade(s) identificada(s): {', '.join(other_issues[:2])}{'...' if len(other_issues) > 2 else ''}."

    else:
        return "Manter em monitoramento periódico conforme cronograma estabelecido."


def validate_alarm_checklist_results(results_dict):
    """
    Valida se o dicionário de resultados está no formato correto.
    """
    try:
        if not isinstance(results_dict, dict):
            return False, "Resultados devem ser um dicionário"

        if len(results_dict) == 0:
            return False, "Resultados não podem estar vazios"

        valid_responses = ["Conforme", "Não Conforme", "N/A"]

        for category, questions in results_dict.items():
            if isinstance(questions, dict):
                for question, response in questions.items():
                    if response not in valid_responses:
                        return False, f"Resposta inválida para '{question}': '{response}'"
            elif isinstance(questions, str):
                if questions not in valid_responses:
                    return False, f"Resposta inválida para '{category}': '{questions}'"
            else:
                return False, f"Formato inválido para categoria '{category}'"

        return True, ""

    except Exception as e:
        return False, f"Erro na validação: {str(e)}"
