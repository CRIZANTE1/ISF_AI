import streamlit as st
from datetime import date
from dateutil.relativedelta import relativedelta
from supabase.client import get_supabase_client
from utils.auditoria import log_action
from auth.auth_utils import get_user_display_name


def save_new_hose(hose_data: dict) -> bool:
    """
    Salva uma nova mangueira na tabela 'mangueiras' do Supabase.
    """
    try:
        db_client = get_supabase_client()

        # Verifica se o ID já existe para evitar duplicatas
        df_hoses = db_client.get_data("mangueiras")
        if not df_hoses.empty and hose_data['id_mangueira'] in df_hoses['id_mangueira'].values:
            st.error(f"Erro: O ID '{hose_data['id_mangueira']}' já existe.")
            return False

        # Prepara o dicionário para inserção
        new_hose_record = {
            'id_mangueira': hose_data['id_mangueira'],
            'marca': hose_data['marca'],
            'diametro': hose_data['diametro'],
            'tipo': hose_data['tipo'],
            'comprimento': hose_data['comprimento'],
            'ano_fabricacao': hose_data['ano_fabricacao'],
            'data_inspecao': date.today().isoformat(),
            'data_proximo_teste': (date.today() + relativedelta(years=1)).isoformat(),
            'resultado': "Aprovado",
            'link_certificado_pdf': None,
            'registrado_por': get_user_display_name(),
            'empresa_executante': hose_data.get('empresa_executante', "Registro Manual"),
            'resp_tecnico_certificado': hose_data.get('resp_tecnico_certificado', None),
        }

        db_client.append_data("mangueiras", new_hose_record)

        log_action("CADASTROU_MANGUEIRA_MANUAL",
                   f"ID: {hose_data['id_mangueira']}, Marca: {hose_data['marca']}, Tipo: {hose_data['tipo']}")

        return True
    except Exception as e:
        st.error(f"Erro ao salvar nova mangueira: {e}")
        return False
