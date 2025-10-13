import streamlit as st
from datetime import date
from .extinguisher_operations import save_inspection, calculate_next_dates, generate_action_plan
from supabase.client import get_supabase_client
from utils.auditoria import log_action


def save_corrective_action(original_record, substitute_last_record, action_details, user_name):
    """
    Salva a ação corretiva, lidando com a substituição de equipamentos.
    """
    try:
        db_client = get_supabase_client()
        id_substituto = action_details.get('id_substituto')
        equipamento_original = original_record.get('numero_identificacao')

        # --- Cenário 1: Substituição de Equipamento ---
        if id_substituto:
            # 1. "Aposenta" o equipamento original
            retirement_record = original_record.copy()
            retirement_record.update({
                'tipo_servico': "Substituição",
                'data_servico': date.today().isoformat(),
                'inspetor_responsavel': user_name,
                'aprovado_inspecao': "N/A",
                'observacoes_gerais': f"Removido para ação: '{action_details['acao_realizada']}'. Substituído pelo ID: {id_substituto}",
                'plano_de_acao': "FORA DE OPERAÇÃO (SUBSTITUÍDO)",
                'latitude': None,
                'longitude': None,
                'link_relatorio_pdf': None,
                'data_proxima_inspecao': None,
                'data_proxima_manutencao_2_nivel': None,
                'data_proxima_manutencao_3_nivel': None
            })
            save_inspection(retirement_record)

            # 2. "Ativa" o equipamento substituto
            new_equip_record = {
                'numero_identificacao': id_substituto,
                'numero_selo_inmetro': substitute_last_record.get('numero_selo_inmetro'),
                'tipo_agente': substitute_last_record.get('tipo_agente', original_record.get('tipo_agente')),
                'capacidade': substitute_last_record.get('capacidade', original_record.get('capacidade')),
                'marca_fabricante': substitute_last_record.get('marca_fabricante'),
                'ano_fabricacao': substitute_last_record.get('ano_fabricacao'),
                'tipo_servico': "Inspeção",
                'data_servico': date.today().isoformat(),
                'inspetor_responsavel': user_name,
                'aprovado_inspecao': "Sim",
                'observacoes_gerais': f"Instalado em substituição ao ID: {original_record.get('numero_identificacao')}",
                'link_relatorio_pdf': None,
                'latitude': original_record.get('latitude'),
                'longitude': original_record.get('longitude')
            }
            new_equip_record['plano_de_acao'] = generate_action_plan(
                new_equip_record)

            existing_dates_substitute = {
                'data_proxima_inspecao': substitute_last_record.get('data_proxima_inspecao'),
                'data_proxima_manutencao_2_nivel': substitute_last_record.get('data_proxima_manutencao_2_nivel'),
                'data_proxima_manutencao_3_nivel': substitute_last_record.get('data_proxima_manutencao_3_nivel'),
                'data_ultimo_ensaio_hidrostatico': substitute_last_record.get('data_ultimo_ensaio_hidrostatico'),
            }
            new_equip_record.update(calculate_next_dates(
                service_date_str=new_equip_record['data_servico'],
                service_level='Inspeção',
                existing_dates=existing_dates_substitute
            ))

            save_inspection(new_equip_record)

            log_action(
                "SUBSTITUIU_EXTINTOR",
                f"Original: {equipamento_original} → Substituto: {id_substituto}, Responsável: {action_details['responsavel_acao']}"
            )

        # --- Cenário 2: Ação Corretiva Simples (sem substituição) ---
        else:
            resolved_inspection = original_record.copy()
            resolved_inspection.update({
                'tipo_servico': "Inspeção",
                'data_servico': date.today().isoformat(),
                'inspetor_responsavel': user_name,
                'aprovado_inspecao': "Sim",
                'observacoes_gerais': f"Ação Corretiva Aplicada: {action_details['acao_realizada']}",
                'latitude': original_record.get('latitude'),
                'longitude': original_record.get('longitude'),
                'link_relatorio_pdf': None
            })

            existing_dates_original = {
                'data_proxima_inspecao': original_record.get('data_proxima_inspecao'),
                'data_proxima_manutencao_2_nivel': original_record.get('data_proxima_manutencao_2_nivel'),
                'data_proxima_manutencao_3_nivel': original_record.get('data_proxima_manutencao_3_nivel'),
                'data_ultimo_ensaio_hidrostatico': original_record.get('data_ultimo_ensaio_hidrostatico'),
            }
            resolved_inspection.update(calculate_next_dates(
                service_date_str=resolved_inspection['data_servico'],
                service_level='Inspeção',
                existing_dates=existing_dates_original
            ))

            resolved_inspection['plano_de_acao'] = generate_action_plan(
                resolved_inspection)
            save_inspection(resolved_inspection)

            log_action(
                "APLICOU_ACAO_CORRETIVA",
                f"ID: {equipamento_original}, Ação: {action_details['acao_realizada'][:100]}..., Responsável: {action_details['responsavel_acao']}"
            )

        # Registra a ação no log para ambos os cenários
        log_record = {
            "data_acao": date.today().isoformat(),
            "id_equipamento": original_record.get('numero_identificacao'),
            "problema_identificado": original_record.get('plano_de_acao'),
            "acao_realizada": action_details['acao_realizada'],
            "responsavel": action_details['responsavel_acao'],
            "id_substituto": action_details.get('id_substituto'),
            "link_foto_evidencia": action_details.get('photo_link', None)
        }

        db_client.append_data("log_acoes", log_record)

        action_type = "substituição" if id_substituto else "correção simples"
        log_action(
            "SALVOU_ACAO_CORRETIVA",
            f"Tipo: {action_type}, ID: {equipamento_original}, Responsável: {action_details['responsavel_acao']}"
        )

        return True

    except Exception as e:
        log_action(
            "FALHA_ACAO_CORRETIVA",
            f"ID: {original_record.get('numero_identificacao', 'N/A')}, Erro: {str(e)[:200]}"
        )
        st.error(f"Erro ao salvar a ação corretiva: {e}")
        return False
