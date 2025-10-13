import google.generativeai as genai
from AI.api_load import load_api
from AI.api_key_manager import get_api_key_manager
import time
import streamlit as st
import logging
import json
import re

logger = logging.getLogger('api_operation')

# Define o modelo de IA como uma constante para garantir consistência
GEMINI_MODEL = 'gemini-1.5-pro-latest'

class PDFQA:
    def __init__(self):
        # Carrega a primeira chave de API na inicialização
        load_api()
        self.model = genai.GenerativeModel(GEMINI_MODEL)
        self.key_manager = get_api_key_manager()

    def ask_gemini(self, pdf_files, question):
        """Faz pergunta ao Gemini com retry, rotação de chaves e گزارش de falha corretos."""
        max_retries = self.key_manager.max_retries
        retry_delay = self.key_manager.retry_delay

        for attempt in range(max_retries):
            current_key = None
            try:
                # 1. Obter a chave ANTES de usar
                current_key = self.key_manager.get_next_key()
                if not current_key:
                    st.error("❌ Nenhuma chave de API disponível para a tentativa.")
                    break # Sai do loop se não houver chaves

                # 2. Configurar a API com a chave específica
                load_api(specific_key=current_key)
                self.model = genai.GenerativeModel(GEMINI_MODEL)

                # Lógica da requisição (mantida)
                progress_bar = st.progress(0, text=f"Tentativa {attempt + 1}/{max_retries}...")
                inputs = []
                progress_bar.progress(20, text="Processando arquivos...")
                for pdf_file in pdf_files:
                    pdf_bytes = pdf_file.read()
                    pdf_file.seek(0)
                    part = {"mime_type": "application/pdf", "data": pdf_bytes}
                    inputs.append(part)
                progress_bar.progress(40, text="Preparando a pergunta...")
                inputs.append({"text": question})
                
                progress_bar.progress(60, text="Enviando para a IA...")
                response = self.model.generate_content(inputs)
                progress_bar.progress(100, text="Resposta recebida!")

                # 3. Sucesso! Reportar na chave correta
                self.key_manager.report_key_success(current_key)
                st.success("✅ Resposta gerada com sucesso!")
                return response.text

            except Exception as e:
                error_msg = str(e)
                logger.error(f"Tentativa {attempt + 1}/{max_retries} com a chave {self.key_manager._mask_key(current_key)} falhou: {error_msg}")

                # 4. Falha! Reportar na chave correta
                if current_key:
                    self.key_manager.report_key_failure(current_key, error_msg)

                if attempt < max_retries - 1:
                    st.warning(f"⚠️ Erro na chave atual. Tentando com outra chave... ({attempt + 2}/{max_retries})")
                    time.sleep(retry_delay)
                else:
                    st.error(f"❌ Erro após {max_retries} tentativas: {error_msg}")
                    stats = self.key_manager.get_statistics()
                    st.warning(f"📊 Chaves disponíveis: {stats['available_keys']}/{stats['total_keys']}")
                    return None
        return None

    def extract_structured_data(self, pdf_file, prompt):
        """Extrai dados estruturados com a mesma lógica de retry e rotação de chaves."""
        max_retries = self.key_manager.max_retries
        retry_delay = self.key_manager.retry_delay

        for attempt in range(max_retries):
            current_key = None
            try:
                with st.spinner(f"🤖 Analisando '{pdf_file.name}' com IA (tentativa {attempt + 1})..."):
                    # 1. Obter a chave ANTES de usar
                    current_key = self.key_manager.get_next_key()
                    if not current_key:
                        st.error("❌ Nenhuma chave de API disponível.")
                        break

                    # 2. Configurar a API com a chave específica
                    load_api(specific_key=current_key)
                    self.model = genai.GenerativeModel(GEMINI_MODEL)

                    # Lógica da requisição
                    pdf_bytes = pdf_file.read()
                    pdf_file.seek(0)
                    part_pdf = {"mime_type": "application/pdf", "data": pdf_bytes}
                    generation_config = genai.types.GenerationConfig(response_mime_type="application/json")
                    
                    response = self.model.generate_content([prompt, part_pdf], generation_config=generation_config)
                    
                    cleaned_response = self._clean_json_string(response.text)
                    extracted_data = json.loads(cleaned_response)

                    # 3. Sucesso! Reportar na chave correta
                    self.key_manager.report_key_success(current_key)
                    st.success(f"✅ Dados extraídos com sucesso de '{pdf_file.name}'!")
                    return extracted_data

            except json.JSONDecodeError as je:
                st.error(f"❌ A IA não retornou um JSON válido. Erro: {je}")
                # A 'response' pode não estar definida aqui, então lidamos com isso
                try:
                    st.text_area("Resposta recebida:", value=response.text, height=150)
                except NameError:
                    st.warning("Nenhuma resposta foi recebida da IA.")
                # Não reporta falha de chave aqui, pois a requisição pode ter sido bem-sucedida
                return None

            except Exception as e:
                error_msg = str(e)
                logger.error(f"Tentativa {attempt + 1}/{max_retries} com a chave {self.key_manager._mask_key(current_key)} falhou na extração: {error_msg}")

                # 4. Falha! Reportar na chave correta
                if current_key:
                    self.key_manager.report_key_failure(current_key, error_msg)

                if attempt < max_retries - 1:
                    st.warning(f"⚠️ Erro na chave atual. Tentando novamente... ({attempt + 2}/{max_retries})")
                    time.sleep(retry_delay)
                else:
                    st.error(f"❌ Falha na extração de dados após {max_retries} tentativas: {e}")
                    return None
        return None

    def _clean_json_string(self, text):
        """Limpa o texto da resposta da IA para extrair apenas o JSON."""
        # Procura por um bloco de código JSON, com ou sem a tag 'json'
        match = re.search(r'```(json)?\s*({.*?})\s*```', text, re.DOTALL)
        if match:
            return match.group(2)
        # Se não encontrar, assume que a resposta inteira é o JSON
        return text.strip()

    def answer_question(self, pdf_files, question):
        """Função wrapper para chamar ask_gemini com medição de tempo."""
        start_time = time.time()
        try:
            answer = self.ask_gemini(pdf_files, question)
            if answer:
                return answer, time.time() - start_time
            else:
                st.error("❌ Não foi possível obter resposta após múltiplas tentativas.")
                return None, 0
        except Exception as e:
            st.error(f"❌ Erro inesperado ao tentar obter resposta: {str(e)}")
            st.exception(e)
            return None, 0