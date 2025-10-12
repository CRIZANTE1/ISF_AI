# supabase/client.py

import streamlit as st
from supabase import create_client, Client
import pandas as pd
import logging

logger = logging.getLogger(__name__)

class SupabaseClient:
    """
    Classe central para interagir com a API do Supabase.
    Substitui a lógica do GoogleDriveUploader para operações de banco de dados.
    """
    def __init__(self):
        self.client: Client = self._initialize_client()

    def _initialize_client(self) -> Client:
        """Inicializa o cliente Supabase usando as credenciais dos secrets."""
        try:
            url = st.secrets["supabase"]["url"]
            key = st.secrets["supabase"]["key"]
            logger.info("Inicializando cliente Supabase...")
            return create_client(url, key)
        except Exception as e:
            logger.error(f"Erro fatal ao inicializar o cliente Supabase: {e}")
            st.error(f"Erro fatal ao conectar ao banco de dados. Verifique as credenciais do Supabase. Detalhes: {e}")
            st.stop()

    def get_data(self, table_name: str) -> pd.DataFrame:
        """Busca todos os dados de uma tabela e retorna como um DataFrame."""
        try:
            response = self.client.table(table_name).select("*").execute()
            if response.data:
                logger.info(f"Dados lidos com sucesso da tabela '{table_name}': {len(response.data)} registros.")
                return pd.DataFrame(response.data)
            logger.warning(f"Nenhum dado encontrado na tabela '{table_name}'.")
            return pd.DataFrame()
        except Exception as e:
            logger.error(f"Erro ao ler dados da tabela '{table_name}': {e}")
            st.error(f"Erro ao ler dados da tabela '{table_name}': {e}")
            return pd.DataFrame()

    def append_data(self, table_name: str, data: dict or list[dict]):
        """Adiciona um ou mais registros a uma tabela."""
        if not data:
            logger.warning(f"Tentativa de inserir dados vazios na tabela '{table_name}'. Operação ignorada.")
            return None
        try:
            response = self.client.table(table_name).insert(data).execute()
            logger.info(f"Dados inseridos com sucesso na tabela '{table_name}'.")
            return response
        except Exception as e:
            logger.error(f"Erro ao adicionar dados à tabela '{table_name}': {e}")
            st.error(f"Erro ao adicionar dados à tabela '{table_name}': {e}")
            raise

    def update_data(self, table_name: str, data: dict, filter_column: str, filter_value):
        """Atualiza registros que correspondem a um filtro."""
        try:
            response = self.client.table(table_name).update(data).eq(filter_column, filter_value).execute()
            logger.info(f"Dados atualizados na tabela '{table_name}' onde '{filter_column}' = '{filter_value}'.")
            return response
        except Exception as e:
            logger.error(f"Erro ao atualizar dados na tabela '{table_name}': {e}")
            st.error(f"Erro ao atualizar dados na tabela '{table_name}': {e}")
            raise

    def delete_data(self, table_name: str, filter_column: str, filter_value):
        """Deleta registros que correspondem a um filtro."""
        try:
            response = self.client.table(table_name).delete().eq(filter_column, filter_value).execute()
            logger.info(f"Dados deletados da tabela '{table_name}' onde '{filter_column}' = '{filter_value}'.")
            return response
        except Exception as e:
            logger.error(f"Erro ao deletar dados da tabela '{table_name}': {e}")
            st.error(f"Erro ao deletar dados da tabela '{table_name}': {e}")
            raise

# Singleton para o cliente, para evitar múltiplas conexões
@st.cache_resource
def get_supabase_client() -> SupabaseClient:
    return SupabaseClient()