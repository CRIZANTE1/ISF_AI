import streamlit as st
from datetime import date
from .extinguisher_operations import save_inspection, calculate_next_dates, generate_action_plan
from gdrive.gdrive_upload import GoogleDriveUploader
from utils.auditoria import log_action 


def save_corrective_action(original_record, substitute_last_record, action_details, user_name):
    """
    Salva a ação corretiva, lidando com a substituição de equipamentos.
    Esta versão está CORRIGIDA para preservar o histórico de manutenção.

    - original_record: Dicionário com os dados do equipamento com problema.
    - substitute_last_record: Dicionário com o último registro do equipamento substituto.
    - action_details: Dicionário com os detalhes da ação preenchida pelo usuário.
    - user_name: Nome do usuário logado.
    """
    try:
        id_substituto = action_details.get('id_substituto')
        equipamento_original = original_record.get('numero_identificacao')

        # --- Cenário 1: Substituição de Equipamento ---
        if id_substituto:
            # 1. "Aposenta" o equipamento original, removendo sua localização e zerando vencimentos
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

            # 2. "Ativa" o equipamento substituto no local do antigo
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
            new_equip_record['plano_de_acao'] = generate_action_plan(new_equip_record)
            
            # --- INÍCIO DA CORREÇÃO ---
            # Coleta as datas de vencimento existentes do equipamento SUBSTITUTO para preservá-las.
            existing_dates_substitute = {
                'data_proxima_inspecao': substitute_last_record.get('data_proxima_inspecao'),
                'data_proxima_manutencao_2_nivel': substitute_last_record.get('data_proxima_manutencao_2_nivel'),
                'data_proxima_manutencao_3_nivel': substitute_last_record.get('data_proxima_manutencao_3_nivel'),
                'data_ultimo_ensaio_hidrostatico': substitute_last_record.get('data_ultimo_ensaio_hidrostatico'),
            }
            # Passa as datas existentes para a função de cálculo. A nova inspeção atualizará
            # apenas o vencimento mensal, mantendo os vencimentos de N2 e N3.
            new_equip_record.update(calculate_next_dates(
                service_date_str=new_equip_record['data_servico'],
                service_level='Inspeção',
                existing_dates=existing_dates_substitute
            ))
            # --- FIM DA CORREÇÃO ---
            
            save_inspection(new_equip_record)
            
            # ✅ NOVO: Log da substituição
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

            # --- INÍCIO DA CORREÇÃO (Consistência) ---
            # Coleta as datas de vencimento existentes do PRÓPRIO equipamento original.
            existing_dates_original = {
                'data_proxima_inspecao': original_record.get('data_proxima_inspecao'),
                'data_proxima_manutencao_2_nivel': original_record.get('data_proxima_manutencao_2_nivel'),
                'data_proxima_manutencao_3_nivel': original_record.get('data_proxima_manutencao_3_nivel'),
                'data_ultimo_ensaio_hidrostatico': original_record.get('data_ultimo_ensaio_hidrostatico'),
            }
            # Passa as datas existentes para garantir que apenas o vencimento mensal seja atualizado.
            resolved_inspection.update(calculate_next_dates(
                service_date_str=resolved_inspection['data_servico'],
                service_level='Inspeção',
                existing_dates=existing_dates_original
            ))
            # --- FIM DA CORREÇÃO ---

            resolved_inspection['plano_de_acao'] = generate_action_plan(resolved_inspection)
            save_inspection(resolved_inspection)
            
            log_action(
                "APLICOU_ACAO_CORRETIVA", 
                f"ID: {equipamento_original}, Ação: {action_details['acao_realizada'][:100]}..., Responsável: {action_details['responsavel_acao']}"
            )

        # Registra a ação no log para ambos os cenários
        log_row = [
            date.today().isoformat(),
            original_record.get('numero_identificacao'),
            original_record.get('plano_de_acao'),
            action_details['acao_realizada'],
            action_details['responsavel_acao'],
            action_details.get('id_substituto'),
            action_details.get('photo_link', None)
        ]
        
        uploader = GoogleDriveUploader()
        uploader.append_data_to_sheet("log_acoes", log_row)
        
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
