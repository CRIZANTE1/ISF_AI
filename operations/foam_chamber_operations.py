import streamlit as st
import json
from supabase.client import get_supabase_client
from datetime import date
from dateutil.relativedelta import relativedelta
from utils.auditoria import log_action
from storage.client import upload_evidence_photo

# --- ALTERAÇÃO AQUI: Checklist agora é um dicionário de modelos ---
CHECKLIST_QUESTIONS = {
    "MCS - Selo de Vidro": {
        "Condições Gerais": [
            "Pintura e estrutura sem corrosão ou amassados",
            "Sem vazamentos visíveis no tanque e conexões",
            "Válvulas em bom estado e lubrificadas"
        ],
        "Componentes da Câmara": [
            "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)",
            "Selo de vidro limpo, íntegro e bem fixado",
            "Junta de vedação em boas condições",
            "Defletor e barragem de espuma íntegros"
        ],
        "Linhas e Conexões": [
            "Tomadas de solução e linhas sem obstrução",
            "Drenos livres e estanques",
            "Ejetores e orifícios desobstruídos",
            "Placa de orifício íntegra e sem obstruções",
            "Placa de orifício compatível com o modelo da câmara"  # ✅ NOVO ITEM
        ],
        "Teste Funcional": [
            "Verificação de fluxo de água/espuma",
            "Verificação de estanqueidade da linha",
            "Funcionamento do sistema confirmado"
        ]
    },
    "TF - Tubo de Filme": {
        "Condições Gerais": [
            "Pintura e estrutura sem corrosão ou amassados",
            "Sem vazamentos visíveis no tanque e conexões",
            "Válvulas em bom estado e lubrificadas"
        ],
        "Componentes da Câmara": [
            "Tubo de projeção íntegro (sem corrosão ou danos)",
            "Defletor de projeção íntegro e bem fixado"
        ],
        "Linhas e Conexões": [
            "Tomadas de solução e linhas sem obstrução",
            "Drenos livres e estanques",
            "Ejetores e orifícios desobstruídos",
            "Placa de orifício íntegra e sem obstruções",
            "Placa de orifício compatível com o modelo da câmara"  # ✅ NOVO ITEM
        ],
        "Teste Funcional": [
            "Verificação de fluxo de água/espuma",
            "Verificação de estanqueidade da linha",
            "Funcionamento do sistema confirmado"
        ]
    },
    "MLS - Membrana Low Shear": {
        "Condições Gerais": [
            "Pintura e estrutura sem corrosão ou amassados",
            "Sem vazamentos visíveis no tanque e conexões",
            "Válvulas em bom estado e lubrificadas"
        ],
        "Componentes da Câmara": [
            "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)",
            "Membrana de elastômero sem ressecamento ou danos visíveis",
            "Junta de vedação em boas condições",
            "Defletor e barragem de espuma íntegros"
        ],
        "Linhas e Conexões": [
            "Tomadas de solução e linhas sem obstrução",
            "Drenos livres e estanques",
            "Ejetores e orifícios desobstruídos",
            "Placa de orifício íntegra e sem obstruções",
            "Placa de orifício compatível com o modelo da câmara"  # ✅ NOVO ITEM
        ],
        "Teste Funcional": [
            "Verificação de fluxo de água/espuma",
            "Verificação de estanqueidade da linha",
            "Funcionamento do sistema confirmado"
        ]
    }
}

ACTION_PLAN_MAP = {
    "Pintura e estrutura sem corrosão ou amassados": "Programar serviço de tratamento de corrosão, reparo e repintura.",
    "Sem vazamentos visíveis no tanque e conexões": "Identificar ponto de vazamento, substituir juntas/vedações ou reparar a conexão.",
    "Válvulas em bom estado e lubrificadas": "Realizar a limpeza, lubrificação ou substituição da válvula defeituosa.",
    "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)": "Avaliar a integridade estrutural. Se comprometida, programar a substituição da câmara.",
    "Selo de vidro limpo, íntegro e bem fixado": "Realizar a limpeza ou substituição do selo de vidro caso esteja sujo ou trincado.",
    "Junta de vedação em boas condições": "Substituir a junta de vedação ressecada ou danificada.",
    "Defletor e barragem de espuma íntegros": "Reparar ou substituir o defletor/barragem de espuma danificado.",
    "Tomadas de solução e linhas sem obstrução": "Realizar a desobstrução e limpeza completa das linhas de solução.",
    "Drenos livres e estanques": "Desobstruir e verificar a estanqueidade dos drenos.",
    "Ejetores e orifícios desobstruídos": "Realizar a limpeza e desobstrução dos ejetores e orifícios.",
    "Placa de orifício íntegra e sem obstruções": "Inspecionar, limpar ou substituir a placa de orifício conforme necessário.",
    "Placa de orifício compatível com o modelo da câmara": "CRÍTICO: Substituir a placa de orifício por uma compatível com o modelo da câmara. A placa incorreta compromete a vazão e eficiência do sistema.",  # ✅ NOVO
    "Tubo de projeção íntegro (sem corrosão ou danos)": "Avaliar a integridade do tubo. Programar reparo ou substituição se necessário.",
    "Defletor de projeção íntegro e bem fixado": "Reapertar ou substituir o defletor de projeção.",
    "Membrana de elastômero sem ressecamento ou danos visíveis": "Substituir a membrana de elastômero.",
    "Verificação de fluxo de água/espuma": "Investigar a causa da falha de fluxo (obstrução, problema na bomba, etc.) e corrigir.",
    "Verificação de estanqueidade da linha": "Localizar e reparar o vazamento na linha.",
    "Funcionamento do sistema confirmado": "Realizar diagnóstico completo para identificar e corrigir a falha funcional."
}


def save_new_foam_chamber(chamber_id, location, brand, model, specific_size=None):
    """Salva uma nova câmara de espuma no inventário."""
    try:
        db_client = get_supabase_client()

        # Verifica se o ID já existe
        df_inventory = db_client.get_data("inventario_camaras_espuma")
        if not df_inventory.empty and chamber_id in df_inventory['id_camara'].values:
            st.error(f"Erro: O ID '{chamber_id}' já está cadastrado.")
            return False

        new_record = {
            "id_camara": chamber_id,
            "localizacao": location,
            "marca": brand,
            "modelo": model,
            "tamanho_especifico": specific_size if specific_size else "",
            "data_cadastro": date.today().isoformat()
        }

        db_client.append_data("inventario_camaras_espuma", new_record)
        log_action("CADASTROU_CAMARA_ESPUMA",
                   f"ID: {chamber_id}, Modelo: {model}, Tamanho: {specific_size}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar nova câmara de espuma: {e}")
        return False


def generate_foam_chamber_action_plan(non_conformities):
    """Gera um plano de ação consolidado para as não conformidades."""
    if not non_conformities:
        return "Manter em monitoramento periódico."
    first_issue = non_conformities[0]
    return ACTION_PLAN_MAP.get(first_issue, "Corrigir a não conformidade reportada.")


def save_foam_chamber_inspection(chamber_id, inspection_type, overall_status, results_dict, photo_file, inspector_name):
    """
    Salva uma nova inspeção de câmara de espuma no Supabase.
    """
    try:
        db_client = get_supabase_client()
        today = date.today()

        photo_link = None
        if photo_file:
            st.info("Fazendo upload da foto de evidência...")
            photo_link = upload_evidence_photo(
                photo_file,
                chamber_id,
                "nao_conformidade_camara_espuma"
            )
            if not photo_link:
                st.error(
                    "Falha crítica: Não foi possível obter o link da foto após o upload. A inspeção não foi salva.")
                return False

        if inspection_type == "Funcional Anual":
            next_inspection_date = (today + relativedelta(years=1)).isoformat()
        else:
            next_inspection_date = (
                today + relativedelta(months=6)).isoformat()

        non_conformities = [
            q for q, status in results_dict.items() if status == "Não Conforme"]
        action_plan = generate_foam_chamber_action_plan(non_conformities)

        results_json = json.dumps(results_dict, ensure_ascii=False)

        inspection_record = {
            "data_inspecao": today.isoformat(),
            "id_camara": chamber_id,
            "tipo_inspecao": inspection_type,
            "status_geral": overall_status,
            "plano_de_acao": action_plan,
            "resultados_json": results_json,
            "link_foto_nao_conformidade": photo_link if photo_link else "",
            "inspetor": inspector_name,
            "data_proxima_inspecao": next_inspection_date
        }

        db_client.append_data("inspecoes_camaras_espuma", inspection_record)

        log_action("SALVOU_INSPECAO_CAMARA_ESPUMA",
                   f"ID: {chamber_id}, Tipo: {inspection_type}, Status: {overall_status}")

        return True

    except Exception as e:
        st.error(f"Erro ao salvar a inspeção para a câmara {chamber_id}: {e}")
        return False


def save_foam_chamber_action_log(chamber_id, problem, action_taken, responsible):
    """Salva um registro de ação corretiva para uma câmara de espuma."""
    try:
        db_client = get_supabase_client()
        log_record = {
            "data_acao": date.today().isoformat(),
            "id_camara": chamber_id,
            "problema_identificado": problem,
            "acao_realizada": action_taken,
            "responsavel": responsible
        }
        db_client.append_data("log_acoes_camaras_espuma", log_record)
        return True
    except Exception as e:
        st.error(f"Erro ao salvar log de ação para a câmara {chamber_id}: {e}")
        return False
