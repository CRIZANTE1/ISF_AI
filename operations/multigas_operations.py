import streamlit as st
import pandas as pd
import numpy as np
from datetime import date
from gdrive.gdrive_upload import GoogleDriveUploader
from gdrive.config import MULTIGAS_INVENTORY_SHEET_NAME, MULTIGAS_INSPECTIONS_SHEET_NAME
from utils.auditoria import log_action
from AI.api_Operation import PDFQA
from utils.prompts import get_multigas_calibration_prompt

def to_safe_cell(value):
    """Converte None ou NaN para string vazia para garantir a escrita correta na planilha."""
    if value is None or (isinstance(value, float) and np.isnan(value)):
        return ''
    return value

def save_new_multigas_detector(detector_id, brand, model, serial_number, cylinder_values):
    """Salva um novo detector multigás no inventário, tratando valores nulos."""
    try:
        uploader = GoogleDriveUploader()
        inventory_data = uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)

        expected_columns = 9
        if inventory_data and len(inventory_data[0]) != expected_columns:
            st.error(f"Erro de Configuração: O cabeçalho da planilha 'multigas_inventario' tem {len(inventory_data[0])} colunas, mas o sistema espera {expected_columns}. Por favor, corrija os cabeçalhos.")
            return False

        if inventory_data and len(inventory_data) > 1:
            headers = inventory_data[0]
            rows = [row for row in inventory_data[1:] if any(cell for cell in row)]
            if rows:
                df_inv = pd.DataFrame(rows, columns=headers)
                if detector_id in df_inv['id_equipamento'].values:
                    st.error(f"Erro: O ID de equipamento '{detector_id}' já existe.")
                    return False
        
        data_row = [
            to_safe_cell(detector_id),
            to_safe_cell(brand),
            to_safe_cell(model),
            to_safe_cell(serial_number),
            to_safe_cell(date.today().isoformat()),
            to_safe_cell(cylinder_values.get('LEL')),
            to_safe_cell(cylinder_values.get('O2')),
            to_safe_cell(cylinder_values.get('H2S')),
            to_safe_cell(cylinder_values.get('CO'))
        ]
        
        uploader.append_data_to_sheet(MULTIGAS_INVENTORY_SHEET_NAME, [data_row])
        log_action("CADASTROU_MULTIGAS", f"ID: {detector_id}, S/N: {serial_number}")
        return True
    except Exception as e:
        st.error(f"Erro ao salvar novo detector: {e}")
        return False

def save_multigas_inspection(data):
    """Salva um novo registro de teste (bump test ou calibração), tratando valores nulos."""
    try:
        uploader = GoogleDriveUploader()
        
        data_row = [
            to_safe_cell(data.get('data_teste')),
            to_safe_cell(data.get('hora_teste')),
            to_safe_cell(data.get('id_equipamento')),
            to_safe_cell(data.get('LEL_encontrado')),
            to_safe_cell(data.get('O2_encontrado')),
            to_safe_cell(data.get('H2S_encontrado')),
            to_safe_cell(data.get('CO_encontrado')),
            to_safe_cell(data.get('tipo_teste')),
            to_safe_cell(data.get('resultado_teste')),
            to_safe_cell(data.get('responsavel_nome')),
            to_safe_cell(data.get('responsavel_matricula')),
            to_safe_cell(data.get('proxima_calibracao')),
            to_safe_cell(data.get('numero_certificado')),
            to_safe_cell(data.get('link_certificado')),
            to_safe_cell(data.get('observacoes')) 
        ]
        
        uploader.append_data_to_sheet(MULTIGAS_INSPECTIONS_SHEET_NAME, [data_row])
        log_action("SALVOU_INSPECAO_MULTIGAS", f"ID: {data.get('id_equipamento')}, Resultado: {data.get('resultado_teste')}")
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
        st.error("A IA não conseguiu extrair os dados do certificado no formato esperado.")
        st.json(extracted_data)
        return None, "error"

    calib_data = extracted_data["calibracao"]
    serial_number = calib_data.get('numero_serie')
    if not serial_number:
        st.error("Não foi possível identificar o Número de Série no certificado.")
        return None, "error"
        
    uploader = GoogleDriveUploader()
    inventory_data = uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)
    detector_id = None
    status = "new_detector"
    
    if inventory_data and len(inventory_data) > 1:
        headers = inventory_data[0]
        rows = inventory_data[1:]
        num_columns = len(headers)
        cleaned_rows = []
        for row in rows:
            if any(cell for cell in row):
                row.extend([None] * (num_columns - len(row)))
                cleaned_rows.append(row[:num_columns])
        
        if cleaned_rows:
            df_inventory = pd.DataFrame(cleaned_rows, columns=headers)
            existing_detector = df_inventory[df_inventory['numero_serie'] == serial_number]
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
    ✅ FUNÇÃO CORRIGIDA - Atualiza os valores de referência do cilindro para um detector específico no inventário.
    
    CORREÇÕES APLICADAS:
    - Validação robusta de entrada
    - Uso de .get() para acessar valores do dicionário
    - Melhor tratamento de erros
    - Validação de tipos de dados
    - Logs detalhados para debug
    
    Args:
        detector_id (str): ID único do detector no inventário
        new_cylinder_values (dict): Dicionário com novos valores de referência
                                   Formato esperado: {'LEL': float, 'O2': float, 'H2S': int, 'CO': int}
    
    Returns:
        bool: True se a atualização foi bem-sucedida, False caso contrário
    """
    try:
        # Validação de entrada
        if not detector_id or not isinstance(detector_id, str):
            st.error("Erro: ID do detector deve ser uma string não vazia.")
            return False
        
        if not isinstance(new_cylinder_values, dict):
            st.error("Erro: Valores do cilindro devem ser fornecidos como um dicionário.")
            return False
        
        if not new_cylinder_values:
            st.error("Erro: Dicionário de valores do cilindro não pode estar vazio.")
            return False
        
        # Valida se todos os gases necessários estão presentes
        required_gases = ['LEL', 'O2', 'H2S', 'CO']
        missing_gases = [gas for gas in required_gases if gas not in new_cylinder_values]
        
        if missing_gases:
            st.error(f"Erro: Valores ausentes para os gases: {', '.join(missing_gases)}")
            return False
        
        # Validação dos valores (devem ser numéricos e positivos)
        for gas, value in new_cylinder_values.items():
            if gas in required_gases:
                try:
                    float_value = float(value)
                    if float_value < 0:
                        st.error(f"Erro: Valor para {gas} deve ser positivo. Valor fornecido: {value}")
                        return False
                except (ValueError, TypeError):
                    st.error(f"Erro: Valor inválido para {gas}: '{value}'. Deve ser um número.")
                    return False
        
        # Inicializa o uploader
        uploader = GoogleDriveUploader()
        
        # Carrega dados do inventário
        inventory_data = uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)
        
        if not inventory_data or len(inventory_data) < 2:
            st.error("Erro: Inventário de detectores não encontrado ou vazio. Não foi possível atualizar.")
            return False

        # Cria DataFrame do inventário
        headers = inventory_data[0]
        rows = inventory_data[1:]
        
        # Verifica se há pelo menos uma linha de dados
        if not rows:
            st.error("Erro: Inventário não contém dados de detectores.")
            return False
        
        # Limpa linhas vazias
        clean_rows = []
        for row in rows:
            # Verifica se a linha tem conteúdo válido
            if row and any(cell and str(cell).strip() for cell in row):
                # Garante que a linha tenha o mesmo número de colunas que o cabeçalho
                while len(row) < len(headers):
                    row.append('')
                clean_rows.append(row[:len(headers)])
        
        if not clean_rows:
            st.error("Erro: Nenhuma linha válida encontrada no inventário.")
            return False
        
        try:
            df_inventory = pd.DataFrame(clean_rows, columns=headers)
        except Exception as e:
            st.error(f"Erro ao criar DataFrame do inventário: {e}")
            return False
        
        # Verifica se a coluna id_equipamento existe
        if 'id_equipamento' not in df_inventory.columns:
            st.error("Erro: Coluna 'id_equipamento' não encontrada no inventário.")
            st.info(f"Colunas disponíveis: {list(df_inventory.columns)}")
            return False
        
        # Encontra o detector no inventário
        detector_mask = df_inventory['id_equipamento'] == detector_id
        target_indices = df_inventory.index[detector_mask].tolist()
        
        if not target_indices:
            st.error(f"Erro: Detector com ID '{detector_id}' não encontrado no inventário.")
            
            # Lista detectores disponíveis para ajudar no debug
            available_detectors = df_inventory['id_equipamento'].dropna().unique()
            if len(available_detectors) > 0:
                st.info(f"Detectores disponíveis: {', '.join(map(str, available_detectors[:10]))}")
                if len(available_detectors) > 10:
                    st.info(f"... e mais {len(available_detectors) - 10} detectores")
            
            return False
        
        # Usa o primeiro índice encontrado (deveria ser único)
        row_index = target_indices[0]
        
        # Converte para índice da planilha (base 1 + cabeçalho)
        sheet_row_index = row_index + 2
        
        # Define o range de atualização (colunas F a I conforme especificação original)
        range_to_update = f"F{sheet_row_index}:I{sheet_row_index}"
        
        # ✅ CORREÇÃO CRÍTICA: Uso de .get() com valores padrão para evitar KeyError
        # Converte valores para tipos apropriados e aplica to_safe_cell
        try:
            lel_value = float(new_cylinder_values.get('LEL', 0))
            o2_value = float(new_cylinder_values.get('O2', 0))
            h2s_value = int(float(new_cylinder_values.get('H2S', 0)))  # Converte para int via float primeiro
            co_value = int(float(new_cylinder_values.get('CO', 0)))    # Converte para int via float primeiro
        except (ValueError, TypeError) as e:
            st.error(f"Erro na conversão de valores: {e}")
            return False
        
        values_to_update = [[
            to_safe_cell(lel_value),
            to_safe_cell(o2_value),
            to_safe_cell(h2s_value),
            to_safe_cell(co_value)
        ]]

        # Executa a atualização
        try:
            uploader.update_cells(MULTIGAS_INVENTORY_SHEET_NAME, range_to_update, values_to_update)
            
            # Log da ação bem-sucedida
            log_action("ATUALIZOU_CILINDRO_MULTIGAS", 
                      f"ID: {detector_id}, LEL: {lel_value}, O2: {o2_value}, H2S: {h2s_value}, CO: {co_value}")
            
            # Log de debug detalhado
            import logging
            logging.info(f"Valores do cilindro atualizados para detector {detector_id}: "
                        f"LEL={lel_value}, O2={o2_value}, H2S={h2s_value}, CO={co_value}")
            
            return True
            
        except Exception as update_error:
            st.error(f"Erro ao executar atualização na planilha: {update_error}")
            return False
        
    except Exception as e:
        # Log detalhado do erro para debug
        import logging
        logging.error(f"Erro crítico em update_cylinder_values: {e}", exc_info=True)
        
        st.error(f"Ocorreu um erro inesperado ao atualizar os valores do cilindro: {e}")
        st.error("Entre em contato com o suporte se o problema persistir.")
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
    ✅ FUNÇÃO AUXILIAR - Recupera os valores atuais do cilindro para um detector
    
    Args:
        detector_id (str): ID do detector
        
    Returns:
        dict or None: Valores atuais do cilindro ou None se não encontrado
    """
    try:
        uploader = GoogleDriveUploader()
        inventory_data = uploader.get_data_from_sheet(MULTIGAS_INVENTORY_SHEET_NAME)
        
        if not inventory_data or len(inventory_data) < 2:
            return None
        
        df_inventory = pd.DataFrame(inventory_data[1:], columns=inventory_data[0])
        detector_row = df_inventory[df_inventory['id_equipamento'] == detector_id]
        
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
    
    # Mapeia os nomes dos gases para uma exibição mais amigável
    gas_map = {
        'LEL': 'LEL', 'O2': 'O²', 'H2S': 'H²S', 'CO': 'CO'
    }

    # ✅ CORREÇÃO: Uso de .get() para evitar KeyError e melhor tratamento de erros
    for gas_key in ['LEL', 'O2', 'H2S', 'CO']:
        ref_val_str = reference_values.get(gas_key)  # ✅ .get() em vez de acesso direto
        found_val_str = found_values.get(gas_key)    # ✅ .get() em vez de acesso direto
        
        # ✅ VERIFICAÇÃO: Se algum valor não existe, pula para o próximo gás
        if ref_val_str is None or found_val_str is None:
            print(f"[WARNING] Valores ausentes para {gas_key}: ref={ref_val_str}, found={found_val_str}")
            continue
        
        try:
            ref_val = float(ref_val_str)
            found_val = float(found_val_str)
        except (ValueError, TypeError) as e:
            # ✅ MELHORIA: Log da falha em vez de falha silenciosa
            print(f"[ERROR] Erro de conversão para {gas_key}: ref='{ref_val_str}', found='{found_val_str}', erro={e}")
            st.warning(f"Valores inválidos para {gas_key}: referência='{ref_val_str}', encontrado='{found_val_str}'")
            continue # Pula para o próximo gás se os valores não forem numéricos

        # Não verifica gases com referência 0
        if ref_val == 0:
            continue

        # Calcula a variação percentual
        difference = found_val - ref_val
        variation_percent = (difference / ref_val) * 100
        
        gas_name = gas_map.get(gas_key, gas_key)

        # Verifica se a variação excede a tolerância
        if abs(variation_percent) > tolerance_percent:
            is_approved = False
            observations.append(
                f"Sensor de {gas_name} REPROVADO. "
                f"Leitura: {found_val}, Referência: {ref_val} (Variação: {variation_percent:.1f}%)."
            )
        # Verifica se está no limite (entre 10% e 20% de variação)
        elif abs(variation_percent) > 10:
            observations.append(
                f"Sensor de {gas_name} com resposta baixa/alta. "
                f"Leitura: {found_val}, Referência: {ref_val} (Variação: {variation_percent:.1f}%). "
                f"Calibração preventiva recomendada."
            )

    # Define o resultado e a observação final
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
        st.warning("Valores do cilindro não são um dicionário válido. Usando valores padrão.")
        return default_values
        
    validated_values = {}
    
    for gas in ['LEL', 'O2', 'H2S', 'CO']:
        value = cylinder_values.get(gas)
        
        if value is None or value == '':
            # Usa valor padrão se estiver ausente
            validated_values[gas] = default_values[gas]
            st.info(f"Valor padrão usado para {gas}: {default_values[gas]}")
        else:
            try:
                # Tenta converter para float
                validated_values[gas] = float(value)
            except (ValueError, TypeError):
                # Se falhar, usa valor padrão
                validated_values[gas] = default_values[gas]
                st.warning(f"Valor inválido para {gas}: '{value}'. Usando valor padrão: {default_values[gas]}")
                
    return validated_values


def safe_get_detector_info(df_inventory, detector_id):
    """
    ✅ FUNÇÃO ADICIONAL - Recupera informações do detector de forma segura.
    
    Retorna um dicionário com informações do detector ou None se não encontrado.
    """
    try:
        if df_inventory.empty:
            return None
            
        detector_row = df_inventory[df_inventory['id_equipamento'] == detector_id]
        
        if detector_row.empty:
            return None
            
        # Converte para dicionário usando .get() para segurança
        detector_info = detector_row.iloc[0].to_dict()
        
        # Garante que valores críticos existam
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
        st.error(f"Erro ao recuperar informações do detector {detector_id}: {e}")
        return None


def get_all_detector_ids(df_inventory):
    """
    ✅ FUNÇÃO ADICIONAL - Retorna lista segura de todos os IDs de detectores.
    """
    try:
        if df_inventory.empty:
            return []
            
        # Remove valores nulos e vazios
        detector_ids = df_inventory['id_equipamento'].dropna().astype(str).str.strip()
        detector_ids = detector_ids[detector_ids != ''].tolist()
        
        return sorted(detector_ids)
        
    except Exception as e:
        st.error(f"Erro ao recuperar lista de detectores: {e}")
        return []
