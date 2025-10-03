import google.generativeai as genai
from AI.api_load import load_api
from AI.api_key_manager import get_api_key_manager
import time
import streamlit as st
import logging

logger = logging.getLogger('api_operation')

class PDFQA:
    def __init__(self):
        load_api()  # Carrega a API
        self.model = genai.GenerativeModel('gemini-2.5-flash-exp')
        self.key_manager = get_api_key_manager()

    def ask_gemini(self, pdf_files, question):
        """Faz pergunta ao Gemini com retry automático e rotação de chaves"""
        max_retries = self.key_manager.max_retries
        retry_delay = self.key_manager.retry_delay
        
        for attempt in range(max_retries):
            try:
                progress_bar = st.progress(0)
                
                # Prepara inputs
                inputs = []
                progress_bar.progress(20)
                
                for pdf_file in pdf_files:
                    if hasattr(pdf_file, 'read'):
                        pdf_bytes = pdf_file.read()
                        pdf_file.seek(0)
                    else:
                        with open(pdf_file, 'rb') as f:
                            pdf_bytes = f.read()
                    
                    part = {"mime_type": "application/pdf", "data": pdf_bytes}
                    inputs.append(part)
                
                progress_bar.progress(40)
                inputs.append({"text": question})
                progress_bar.progress(60)
                
                # Tenta gerar resposta
                response = self.model.generate_content(inputs)
                progress_bar.progress(100)
                
                # Sucesso! Registra e retorna
                current_key = self.key_manager.keys[self.key_manager.current_key_index]
                self.key_manager.report_key_success(current_key)
                
                st.success("✅ Resposta gerada com sucesso!")
                return response.text
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Tentativa {attempt + 1}/{max_retries} falhou: {error_msg}")
                
                # Registra falha da chave atual
                current_key = self.key_manager.keys[self.key_manager.current_key_index]
                self.key_manager.report_key_failure(current_key, error_msg)
                
                # Se não é a última tentativa, troca de chave e tenta novamente
                if attempt < max_retries - 1:
                    st.warning(f"⚠️ Erro na chave atual. Tentando com outra chave... ({attempt + 1}/{max_retries})")
                    
                    # Aguarda antes de tentar novamente
                    time.sleep(retry_delay)
                    
                    # Recarrega API com nova chave
                    load_api()
                    self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
                else:
                    # Última tentativa falhou
                    st.error(f"❌ Erro após {max_retries} tentativas com diferentes chaves: {error_msg}")
                    
                    # Mostra estatísticas
                    stats = self.key_manager.get_statistics()
                    st.warning(f"📊 Chaves disponíveis: {stats['available_keys']}/{stats['total_keys']}")
                    
                    return None
        
        return None

    def extract_structured_data(self, pdf_file, prompt):
        """Extrai dados estruturados com retry e rotação de chaves"""
        max_retries = self.key_manager.max_retries
        retry_delay = self.key_manager.retry_delay
        
        for attempt in range(max_retries):
            try:
                with st.spinner(f"🤖 Analisando '{pdf_file.name}' com IA (tentativa {attempt + 1})..."):
                    pdf_bytes = pdf_file.read()
                    pdf_file.seek(0)

                    part_pdf = {"mime_type": "application/pdf", "data": pdf_bytes}
                    
                    generation_config = genai.types.GenerationConfig(
                        response_mime_type="application/json"
                    )

                    response = self.model.generate_content(
                        [prompt, part_pdf],
                        generation_config=generation_config
                    )
                    
                    # Processa resposta
                    import json
                    cleaned_response = self._clean_json_string(response.text)
                    extracted_data = json.loads(cleaned_response)
                    
                    # Sucesso!
                    current_key = self.key_manager.keys[self.key_manager.current_key_index]
                    self.key_manager.report_key_success(current_key)
                    
                    st.success(f"✅ Dados extraídos com sucesso de '{pdf_file.name}'!")
                    return extracted_data
                    
            except json.JSONDecodeError as je:
                st.error("❌ A IA não retornou JSON válido")
                st.text_area("Resposta recebida:", value=response.text, height=150)
                return None
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Tentativa {attempt + 1}/{max_retries} falhou na extração: {error_msg}")
                
                # Registra falha
                current_key = self.key_manager.keys[self.key_manager.current_key_index]
                self.key_manager.report_key_failure(current_key, error_msg)
                
                if attempt < max_retries - 1:
                    st.warning(f"⚠️ Erro na chave atual. Tentando novamente... ({attempt + 1}/{max_retries})")
                    time.sleep(retry_delay)
                    
                    # Recarrega com nova chave
                    load_api()
                    self.model = genai.GenerativeModel('gemini-2.0-flash-exp')
                else:
                    st.error(f"❌ Falha após {max_retries} tentativas: {e}")
                    return None
        
        return None

    def _clean_json_string(self, text):
        """Limpa o texto da resposta da IA para extrair apenas o JSON."""
        import re
        match = re.search(r'```(json)?\s*({.*?})\s*```', text, re.DOTALL)
        if match:
            return match.group(2)
        return text.strip()

    def answer_question(self, pdf_files, question):
        """Responde pergunta com tratamento de erros aprimorado"""
        start_time = time.time()
        try:
            answer = self.ask_gemini(pdf_files, question)
            if answer:
                return answer, time.time() - start_time
            else:
                st.error("❌ Não foi possível obter resposta após múltiplas tentativas.")
                return None, 0
        except Exception as e:
            st.error(f"❌ Erro inesperado: {str(e)}")
            st.exception(e)
            return None, 0
