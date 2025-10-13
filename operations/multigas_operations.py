import streamlit as st
import numpy as np
from datetime import date
from supabase.client import get_supabase_client
from utils.auditoria import log_action
from AI.api_Operation import PDFQA
from utils.prompts import get_multigas_calibration_prompt
from storage.client import upload_evidence_photo


def to_safe_cell(value):
    """Converte None ou NaN para string vazia para garantir a escrita correta na planilha."""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return ''
    return value


def save_new_multigas_detector(detector_id, brand, model, serial_number, cylinder_values):
    """Salva um novo detector multigás no inventário."""
    try:
        db_client = get_supabase_client()

        # Verifica se o ID já existe
        df_inventory = db_client.get_data("inventario_multigas")
        if not df_inventory.empty and detector_id in df_inventory['id_equipamento'].values:
            st.error(f"Erro: O ID de equipamento '{detector_id}' já existe.")
            return False

        new_record = {
            "id_equipamento": detector_id,
            "marca": brand,
            "modelo": model,
            "numero_serie": serial_number,
            "data_cadastro": date.today().isoformat(),
            "LEL_cilindro": cylinder_values.get('LEL'),
            "O2_cilindro": cylinder_values.get('O2'),
            "H2S_cilindro": cylinder_values.get('H2S'),
            "CO_cilindro": cylinder_values.get('CO')
        }

        db_client.append_data("inventario_multigas", new_record)
        log_action("CADASTROU_MULTIGAS",
                   f"ID: {detector_id}, S/N: {serial_number}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo detector: {e}")
        return False


def generate_multigas_action_plan(resultado_teste, tipo_teste):
    if resultado_teste == 'Aprovado':
        return "Manter em monitoramento periódico."
    if tipo_teste == 'Calibração Anual':
        return "Equipamento reprovado na calibração. Enviar para manutenção especializada ou substituir."
    else:  # Bump Test
        return "Equipamento reprovado no teste de resposta (Bump Test). Realizar calibração completa."


def save_multigas_inspection(data):
    """Salva um novo registro de teste (bump test ou calibração)."""
    try:
        db_client = get_supabase_client()

        action_plan = generate_multigas_action_plan(
            data.get('resultado_teste'), data.get('tipo_teste'))
        data['plano_de_acao'] = action_plan

        db_client.append_data("inspecoes_multigas", data)
        log_action("SALVOU_INSPECAO_MULTIGAS",
                   f"ID: {data.get('id_equipamento')}, Resultado: {data.get('resultado_teste')}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar inspeção: {e}")
        return False


def process_calibration_pdf_analysis(pdf_file):
    """
    Analisa o PDF, extrai dados e verifica a existência do detector.
    """
    pdf_qa = PDFQA()
    prompt = get_multigas_calibration_prompt()
    extracted_data = pdf_qa.extract_structured_data(pdf_file, prompt)

    if not extracted_data or "calibracao" not in extracted_data:
        st.error(
            "A IA não conseguiu extrair os dados do certificado no formato esperado.")
        st.json(extracted_data)
        return None, "error"

    calib_data = extracted_data["calibracao"]
    serial_number = calib_data.get('numero_serie')
    if not serial_number:
        st.error("Não foi possível identificar o Número de Série no certificado.")
        return None, "error"

    db_client = get_supabase_client()
    inventory_data = db_client.get_data("inventario_multigas")
    detector_id = None
    status = "new_detector"

    if not inventory_data.empty:
        existing_detector = inventory_data[inventory_data['numero_serie']
                                           == serial_number]
        if not existing_detector.empty:
            detector_id = existing_detector.iloc[0]['id_equipamento']
            status = "exists"

    if status == "exists":
        calib_data['id_equipamento'] = detector_id
    else:
        calib_data['id_equipamento'] = f"MG-{serial_number[-4:]}"

    return calib_data, status


def update_cylinder_values(detector_id, new_cylinder_values):
    """
    Atualiza os valores de referência do cilindro para um detector específico no inventário.
    """
    try:
        db_client = get_supabase_client()

        updates = {
            'LEL_cilindro': new_cylinder_values.get('LEL'),
            'O2_cilindro': new_cylinder_values.get('O2'),
            'H2S_cilindro': new_cylinder_values.get('H2S'),
            'CO_cilindro': new_cylinder_values.get('CO')
        }

        db_client.update_data("inventario_multigas",
                              updates, 'id_equipamento', detector_id)

        log_action("ATUALIZOU_CILINDRO_MULTIGAS",
                   f"ID: {detector_id}, LEL: {updates['LEL_cilindro']}, O2: {updates['O2_cilindro']}, H2S: {updates['H2S_cilindro']}, CO: {updates['CO_cilindro']}")

        return True

    except Exception as e:
        st.error(
            f"Ocorreu um erro inesperado ao atualizar os valores do cilindro: {e}")
        return False


def validate_cylinder_values_input(cylinder_values):
    """
    ✅ FUNÇÃO AUXILIAR - Valida e sanitiza valores de entrada do cilindro

    Args:
        cylinder_values (dict): Valores brutos de entrada

    Returns:
        tuple: (is_valid: bool, sanitized_values: dict, error_message: str)
    """
    try:
        if not isinstance(cylinder_values, dict):
            return False, {}, "Valores devem ser fornecidos como dicionário"

        required_gases = ['LEL', 'O2', 'H2S', 'CO']
        sanitized = {}

        for gas in required_gases:
            raw_value = cylinder_values.get(gas)

            if raw_value is None or raw_value == '':
                return False, {}, f"Valor ausente para {gas}"

            try:
                # Tenta converter para float primeiro
                float_value = float(raw_value)

                # Validações específicas por gás
                if gas in ['LEL', 'O2']:
                    # LEL e O2 são percentuais (float)
                    if float_value < 0 or float_value > 100:
                        return False, {}, f"Valor para {gas} deve estar entre 0 e 100%"
                    sanitized[gas] = float_value
                else:
                    # H2S e CO são ppm (inteiros)
                    if float_value < 0 or float_value > 10000:
                        return False, {}, f"Valor para {gas} deve estar entre 0 e 10000 ppm"
                    sanitized[gas] = int(float_value)

            except (ValueError, TypeError):
                return False, {}, f"Valor inválido para {gas}: '{raw_value}'"

        return True, sanitized, ""

    except Exception as e:
        return False, {}, f"Erro na validação: {str(e)}"


def get_detector_cylinder_values(detector_id):
    """
    Recupera os valores atuais do cilindro para um detector.
    """
    try:
        db_client = get_supabase_client()
        df_inventory = db_client.get_data("inventario_multigas")

        if df_inventory.empty:
            return None

        detector_row = df_inventory[df_inventory['id_equipamento']
                                    == detector_id]

        if detector_row.empty:
            return None

        row_data = detector_row.iloc[0]

        return {
            'LEL': row_data.get('LEL_cilindro', 0),
            'O2': row_data.get('O2_cilindro', 0),
            'H2S': row_data.get('H2S_cilindro', 0),
            'CO': row_data.get('CO_cilindro', 0)
        }

    except Exception as e:
        st.error(f"Erro ao recuperar valores do cilindro: {e}")
        return None


def verify_bump_test(reference_values, found_values, tolerance_percent=20):
    """
    ✅ FUNÇÃO MELHORADA - Verifica os resultados de um bump test em relação aos valores de referência.

    MELHORIAS APLICADAS: 
    - Melhor tratamento de erros na conversão de valores
    - Logging de falhas silenciosas  
    - Uso de .get() para acessar valores dos dicionários

    Retorna o resultado geral e uma lista de observações.
    """
    observations = []
    is_approved = True

    gas_map = {
        'LEL': 'LEL', 'O2': 'O²', 'H2S': 'H²S', 'CO': 'CO'
    }

    for gas_key in ['LEL', 'O2', 'H2S', 'CO']:
        ref_val_str = reference_values.get(gas_key)
        found_val_str = found_values.get(gas_key)

        if ref_val_str is None or found_val_str is None:
            print(
                f"[WARNING] Valores ausentes para {gas_key}: ref={ref_val_str}, found={found_val_str}")
            continue

        try:
            ref_val = float(ref_val_str)
            found_val = float(found_val_str)
        except (ValueError, TypeError) as e:
            print(
                f"[ERROR] Erro de conversão para {gas_key}: ref='{ref_val_str}', found='{found_val_str}', erro={e}")
            st.warning(
                f"Valores inválidos para {gas_key}: referência='{ref_val_str}', encontrado='{found_val_str}'")
            continue

        if ref_val == 0:
            continue

        difference = found_val - ref_val
        variation_percent = (difference / ref_val) * 100

        gas_name = gas_map.get(gas_key, gas_key)

        if abs(variation_percent) > tolerance_percent:
            is_approved = False
            observations.append(
                f"Sensor de {gas_name} REPROVADO. "
                f"Leitura: {found_val}, Referência: {ref_val} (Variação: {variation_percent:.1f}%)."
            )
        elif abs(variation_percent) > 10:
            observations.append(
                f"Sensor de {gas_name} com resposta baixa/alta. "
                f"Leitura: {found_val}, Referência: {ref_val} (Variação: {variation_percent:.1f}%). "
                f"Calibração preventiva recomendada."
            )

    final_result = "Aprovado" if is_approved else "Reprovado"

    if not observations and is_approved:
        final_observation = "Todos os sensores responderam corretamente."
    else:
        final_observation = " | ".join(observations)

    return final_result, final_observation


def validate_cylinder_values(cylinder_values):
    """
    ✅ FUNÇÃO ADICIONAL - Valida se o dicionário de valores do cilindro está completo e correto.

    Retorna um dicionário validado com valores padrão se necessário.
    """
    default_values = {
        'LEL': 50.0,
        'O2': 18.0,
        'H2S': 25,
        'CO': 100
    }

    if not isinstance(cylinder_values, dict):
        st.warning(
            "Valores do cilindro não são um dicionário válido. Usando valores padrão.")
        return default_values

    validated_values = {}

    for gas in ['LEL', 'O2', 'H2S', 'CO']:
        value = cylinder_values.get(gas)

        if value is None or value == '':
            validated_values[gas] = default_values[gas]
            st.info(f"Valor padrão usado para {gas}: {default_values[gas]}")
        else:
            try:
                validated_values[gas] = float(value)
            except (ValueError, TypeError):
                validated_values[gas] = default_values[gas]
                st.warning(
                    f"Valor inválido para {gas}: '{value}'. Usando valor padrão: {default_values[gas]}")

    return validated_values


def safe_get_detector_info(df_inventory, detector_id):
    """
    ✅ FUNÇÃO ADICIONAL - Recupera informações do detector de forma segura.

    Retorna um dicionário com informações do detector ou None se não encontrado.
    """
    try:
        if df_inventory.empty:
            return None

        detector_row = df_inventory[df_inventory['id_equipamento']
                                    == detector_id]

        if detector_row.empty:
            return None

        detector_info = detector_row.iloc[0].to_dict()

        safe_info = {
            'id_equipamento': detector_info.get('id_equipamento', detector_id),
            'marca': detector_info.get('marca', 'N/A'),
            'modelo': detector_info.get('modelo', 'N/A'),
            'numero_serie': detector_info.get('numero_serie', 'N/A'),
            'LEL_cilindro': detector_info.get('LEL_cilindro', 0),
            'O2_cilindro': detector_info.get('O2_cilindro', 0),
            'H2S_cilindro': detector_info.get('H2S_cilindro', 0),
            'CO_cilindro': detector_info.get('CO_cilindro', 0)
        }

        return safe_info

    except Exception as e:
        st.error(
            f"Erro ao recuperar informações do detector {detector_id}: {e}")
        return None


def get_all_detector_ids(df_inventory):
    """
    ✅ FUNÇÃO ADICIONAL - Retorna lista segura de todos os IDs de detectores.
    """
    try:
        if df_inventory.empty:
            return []

        detector_ids = df_inventory['id_equipamento'].dropna().astype(
            str).str.strip()
        detector_ids = detector_ids[detector_ids != ''].tolist()

        return sorted(detector_ids)

    except Exception as e:
        st.error(f"Erro ao recuperar lista de detectores: {e}")
        return []


def save_multigas_action_log(detector_id, problem, action_taken, responsible, photo_file=None):
    """
    Salva um registro de ação corretiva para um detector de multigás no log.
    """
    try:
        db_client = get_supabase_client()

        photo_link = None
        if photo_file:
            try:
                photo_link = upload_evidence_photo(
                    photo_file,
                    detector_id,
                    "acao_corretiva_multigas"
                )
            except Exception as photo_error:
                st.warning(
                    f"Erro no upload da foto: {photo_error}. Continuando sem foto...")

        log_record = {
            "data_acao": date.today().isoformat(),
            "id_equipamento": detector_id,
            "problema_identificado": problem,
            "acao_realizada": action_taken,
            "responsavel": responsible,
            "link_foto_evidencia": photo_link or ""
        }

        db_client.append_data("log_acoes_multigas", log_record)
        log_action("REGISTROU_ACAO_MULTIGAS",
                   f"ID: {detector_id}, Ação: {action_taken[:50]}...")
        return True

    except Exception as e:
        st.error(
            f"Erro ao salvar log de ação para o detector {detector_id}: {e}")
        return False
