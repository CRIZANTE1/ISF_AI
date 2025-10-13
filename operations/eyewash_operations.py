import streamlit as st
import json
from supabase.client import get_supabase_client
from datetime import date
from dateutil.relativedelta import relativedelta
from storage.client import upload_evidence_photo
from utils.auditoria import log_action

CHECKLIST_QUESTIONS = {
    "Condições Gerais": [
        "A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?",
        "A PRESSÃO ESTÁ ADEQUADA?",
        "A PINTURA ESTA ÍNTEGRA?",
        "OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?",
        "O ACESSO ESTÁ LIVRE?",
        "NIVELAMENTO POSSUI DESNÍVEL?",
        "A DRENAGEM DE ÁGUA FUNCIONA?",
        "O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?",
        "O FILTRO ESTÁ LIMPO?",
        "O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?",
        "O PISO POSSUI ADERÊNCIA?",
        "OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?",
        "O EQUIPAMENTO POSSUI CORROSÃO?",
        "EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?",
        "OS ESGUICHOS POSSUEM DEFEITOS?",
        "O PISO ESTÁ DANIFICADO?"
    ]
}
ACTION_PLAN_MAP = {
    "A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?": "Verificar e desobstruir a linha de suprimento ou ajustar a válvula de vazão.",
    "A PRESSÃO ESTÁ ADEQUADA?": "Verificar a pressão na linha de entrada e ajustar o regulador de pressão, se aplicável.",
    "A PINTURA ESTA ÍNTEGRA?": "Programar serviço de lixamento e repintura do equipamento.",
    "OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?": "Substituir as gaxetas ou o reparo da válvula com vazamento.",
    "O ACESSO ESTÁ LIVRE?": "Remover obstruções e garantir corredor de acesso livre conforme norma.",
    "NIVELAMENTO POSSUI DESNÍVEL?": "Realinhar e fixar a base do equipamento para garantir o nivelamento correto.",
    "A DRENAGEM DE ÁGUA FUNCIONA?": "Desobstruir o ralo ou a tubulação de drenagem.",
    "O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?": "Realizar a limpeza do crivo e reapertar suas fixações.",
    "O FILTRO ESTÁ LIMPO?": "Remover, limpar e reinstalar o filtro da linha de água.",
    "O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?": "Testar e, se necessário, substituir o regulador de pressão.",
    "O PISO POSSUI ADERÊNCIA?": "Aplicar tratamento antiderrapante ou substituir o revestimento do piso.",
    "OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?": "Incluir treinamento sobre o uso do equipamento no próximo DDS ou treinamento da CIPA.",
    "O EQUIPAMENTO POSSUI CORROSÃO?": "Avaliar a extensão da corrosão. Programar serviço de tratamento e repintura.",
    "EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?": "Programar a pintura de demarcação do piso conforme norma.",
    "OS ESGUICHOS POSSUEM DEFEITOS?": "Limpar ou substituir os esguichos/bocais do lava-olhos.",
    "O PISO ESTÁ DANIFICADO?": "Programar o reparo ou a substituição da área danificada do piso."
}


def save_eyewash_inspection(equipment_id, overall_status, results_dict, photo_file, inspector_name):
    """
    Salva uma nova inspeção de chuveiro/lava-olhos no Supabase.
    """
    try:
        db_client = get_supabase_client()
        today = date.today()
        next_inspection_date = (today + relativedelta(months=1)).isoformat()

        photo_link = None
        if photo_file:
            st.info("Fazendo upload da foto de evidência...")
            photo_link = upload_evidence_photo(
                photo_file,
                equipment_id,
                "nao_conformidade_chuveiro"
            )
            if not photo_link:
                st.error(
                    "Falha crítica: Não foi possível obter o link da foto após o upload. A inspeção não foi salva.")
                return False

        non_conformities = [
            q for q, status in results_dict.items() if status == "Não Conforme"]
        action_plan = generate_eyewash_action_plan(non_conformities)

        results_json = json.dumps(results_dict, ensure_ascii=False)

        inspection_record = {
            "data_inspecao": today.isoformat(),
            "id_equipamento": equipment_id,
            "status_geral": overall_status,
            "plano_de_acao": action_plan,
            "resultados_json": results_json,
            "link_foto_nao_conformidade": photo_link,
            "inspetor": inspector_name,
            "data_proxima_inspecao": next_inspection_date
        }

        db_client.append_data(
            "inspecoes_chuveiros_lava_olhos", inspection_record)
        log_action("SALVOU_INSPECAO_CHUVEIRO",
                   f"ID do equipamento: {equipment_id}, Status: {overall_status}")
        return True

    except Exception as e:
        st.error(
            f"Ocorreu um erro inesperado ao salvar a inspeção para o equipamento {equipment_id}:")
        st.error(f"Detalhes do erro: {e}")
        return False


def save_new_eyewash_station(equipment_id, location, brand, model):
    """Salva um novo chuveiro/lava-olhos na tabela de inventário."""
    try:
        db_client = get_supabase_client()

        # Verifica se o ID já existe para evitar duplicatas
        df_inventory = db_client.get_data("inventario_chuveiros_lava_olhos")
        if not df_inventory.empty and equipment_id in df_inventory['id_equipamento'].values:
            st.error(f"Erro: O ID '{equipment_id}' já está cadastrado.")
            return False

        new_record = {
            "id_equipamento": equipment_id,
            "localizacao": location,
            "marca": brand,
            "modelo": model,
            "data_cadastro": date.today().isoformat()
        }

        db_client.append_data("inventario_chuveiros_lava_olhos", new_record)
        log_action("CADASTROU_CHUVEIRO_LAVA_OLHOS", f"ID: {equipment_id}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo equipamento: {e}")
        return False


def generate_eyewash_action_plan(non_conformities):
    """Gera um plano de ação consolidado para uma lista de não conformidades."""
    if not non_conformities:
        return "Manter em monitoramento periódico."

    # Pega o plano de ação da primeira não conformidade encontrada
    first_issue = non_conformities[0]
    return ACTION_PLAN_MAP.get(first_issue, "Corrigir a não conformidade reportada.")


def save_eyewash_action_log(equipment_id, problem, action_taken, responsible, photo_file):
    """Salva um registro de ação corretiva para um chuveiro/lava-olhos no log."""
    try:
        db_client = get_supabase_client()

        photo_link = upload_evidence_photo(
            photo_file, equipment_id, "acao_corretiva_chuveiro")

        log_record = {
            "data_acao": date.today().isoformat(),
            "id_equipamento": equipment_id,
            "problema_identificado": problem,
            "acao_realizada": action_taken,
            "responsavel": responsible,
            "link_foto_evidencia": photo_link
        }

        db_client.append_data("log_acoes_chuveiros", log_record)
        return True
    except Exception as e:
        st.error(
            f"Erro ao salvar log de ação para o equipamento {equipment_id}: {e}")
        return False
