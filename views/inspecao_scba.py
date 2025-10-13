from utils.prompts import get_scba_inspection_prompt, get_air_quality_prompt
from operations.instrucoes import instru_scba
from utils.auditoria import log_action
from operations.history import load_sheet_data
from config.page_config import set_page_config
from auth.auth_utils import (
    get_user_display_name, check_user_access, can_edit, has_ai_features
)
from AI.api_Operation import PDFQA
from storage.client import upload_evidence_photo
from supabase.client import get_supabase_client
from operations.scba_operations import save_scba_inspection, save_scba_visual_inspection, save_manual_scba
import streamlit as st
import sys
import os
from datetime import date, timedelta
import pandas as pd

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))


set_page_config()
pdf_qa = PDFQA()


def save_manual_air_quality_record(air_data):
    """
    Salva um registro manual de qualidade do ar.
    """
    try:
        db_client = get_supabase_client()

        cilindros = [c.strip()
                     for c in air_data['cilindros_text'].split(',') if c.strip()]

        if not cilindros:
            st.error(
                "É necessário informar pelo menos um número de série de cilindro.")
            return False

        records = []
        for cilindro_sn in cilindros:
            record = {
                'numero_serie_equipamento': cilindro_sn,
                'data_ensaio_ar': air_data['data_ensaio'],
                'resultado_ensaio_ar': air_data['resultado_geral'],
                'observacoes_ensaio_ar': air_data.get('observacoes', 'Registro manual'),
                'link_laudo_ar': None
            }
            records.append(record)

        db_client.append_data("qualidade_ar_scba", records)

        log_action("REGISTROU_QUALIDADE_AR_MANUAL",
                   f"Cilindros: {', '.join(cilindros)}, Resultado: {air_data['resultado_geral']}")
        return True

    except Exception as e:
        st.error(f"Erro ao salvar registro de qualidade do ar: {e}")
        return False


def show_page():
    st.title("💨 Inspeção de Conjuntos Autônomos (SCBA)")

    if not check_user_access("viewer"):
        st.warning("Você não tem permissão para acessar esta página.")
        return

    tab_instrucoes, tab_visual_insp, tab_test_scba, tab_manual_test, tab_quality_air, tab_manual_air, tab_manual_scba = st.tabs([
        "📖 Como Usar",
        "🔍 Inspeção Visual Periódica",
        "🤖 Teste de Equipamentos (IA)",
        "✍️ Cadastro Manual de Teste",
        "💨 Laudo de Qualidade do Ar (IA)",
        "📝 Registro Manual de Qualidade do Ar",
        "➕ Cadastrar Novo SCBA"
    ])

    with tab_instrucoes:
        instru_scba()

    with tab_test_scba:
        st.header("Registrar Teste de SCBA com IA")

        if not can_edit():
            st.warning(
                "Você precisa de permissões de edição para registrar testes.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            if not has_ai_features():
                st.info("✨ **Este recurso de IA** está disponível no plano **Premium IA**. Faça o upgrade para automatizar seu trabalho ou use as abas de cadastro manual!", icon="🚀")
            else:
                st.session_state.setdefault('scba_step', 'start')
                st.session_state.setdefault('scba_processed_data', None)
                st.session_state.setdefault('scba_uploaded_pdf', None)

                st.subheader("1. Faça o Upload do Relatório de Teste Posi3")
                st.info(
                    "O sistema analisará o PDF, extrairá os dados de todos os equipamentos listados e preparará os registros para salvamento.")

                uploaded_pdf = st.file_uploader("Escolha o relatório PDF", type=[
                                                "pdf"], key="scba_pdf_uploader")
                if uploaded_pdf:
                    st.session_state.scba_uploaded_pdf = uploaded_pdf

                if st.session_state.scba_uploaded_pdf and st.button("🔎 Analisar Relatório com IA"):
                    with st.spinner("Analisando o documento com IA..."):
                        prompt = get_scba_inspection_prompt()
                        extracted_data = pdf_qa.extract_structured_data(
                            st.session_state.scba_uploaded_pdf, prompt)

                        if extracted_data and "scbas" in extracted_data and isinstance(extracted_data["scbas"], list):
                            st.session_state.scba_processed_data = extracted_data["scbas"]
                            st.session_state.scba_step = 'confirm'
                            st.rerun()
                        else:
                            st.error(
                                "A IA não conseguiu extrair os dados no formato esperado. Verifique o documento.")
                            st.json(extracted_data)

                if st.session_state.scba_step == 'confirm' and st.session_state.scba_processed_data:
                    st.subheader(
                        "2. Confira os Dados Extraídos e Salve no Sistema")
                    st.dataframe(pd.DataFrame(
                        st.session_state.scba_processed_data))

                    if st.button("💾 Confirmar e Salvar Registros", type="primary", use_container_width=True):
                        with st.spinner("Salvando registros..."):
                            pdf_name = f"Relatorio_SCBA_{date.today().isoformat()}_{st.session_state.scba_uploaded_pdf.name}"
                            pdf_link = upload_evidence_photo(
                                st.session_state.scba_uploaded_pdf, pdf_name, "relatorios_scba")

                            if not pdf_link:
                                st.error(
                                    "Falha ao fazer o upload do relatório. Os dados não foram salvos.")
                                st.stop()

                            total_count = len(
                                st.session_state.scba_processed_data)
                            progress_bar = st.progress(0, "Salvando...")

                            for i, record in enumerate(st.session_state.scba_processed_data):
                                save_scba_inspection(
                                    record=record, pdf_link=pdf_link, user_name=get_user_display_name())
                                progress_bar.progress((i + 1) / total_count)

                            st.success(
                                f"{total_count} registros de SCBA salvos com sucesso!")

                            st.session_state.scba_step = 'start'
                            st.session_state.scba_processed_data = None
                            st.session_state.scba_uploaded_pdf = None
                            st.cache_data.clear()
                            st.rerun()

    with tab_manual_test:
        st.header("Cadastrar Teste de SCBA Manualmente")

        if not can_edit():
            st.warning(
                "Você precisa de permissões de edição para registrar testes.")
        else:
            st.info("Use este formulário para registrar manualmente um teste de equipamento SCBA (Posi3) sem necessidade de processar um relatório PDF.")

            with st.form("manual_scba_test_form", clear_on_submit=True):
                st.subheader("Dados do Teste")

                col1, col2 = st.columns(2)
                data_teste = col1.date_input(
                    "Data do Teste", value=date.today())
                data_validade = col2.date_input(
                    "Data de Validade do Laudo", value=date.today() + timedelta(days=365))

                st.subheader("Identificação do Equipamento")
                col3, col4 = st.columns(2)
                numero_serie = col3.text_input(
                    "Número de Série do Equipamento (Obrigatório)*")
                marca = col4.text_input("Marca")

                col5, col6 = st.columns(2)
                modelo = col5.text_input("Modelo")
                numero_serie_mascara = col6.text_input(
                    "Número de Série da Máscara")
                numero_serie_segundo_estagio = st.text_input(
                    "Número de Série do Segundo Estágio")

                st.subheader("Resultados dos Testes")
                resultado_final = st.selectbox(
                    "Resultado Final", ["APTO PARA USO", "NÃO APTO PARA USO"])

                col7, col8 = st.columns(2)
                vazamento_mascara_resultado = col7.selectbox(
                    "Vazamento de Máscara", ["Aprovado", "Reprovado"])
                vazamento_mascara_valor = col8.text_input(
                    "Valor (mbar)", value="0,2 mbar")

                col9, col10 = st.columns(2)
                vazamento_pressao_alta_resultado = col9.selectbox(
                    "Vazamento Pressão Alta", ["Aprovado", "Reprovado"])
                vazamento_pressao_alta_valor = col10.text_input(
                    "Valor (bar)", value="0,7 bar")

                col11, col12 = st.columns(2)
                pressao_alarme_resultado = col11.selectbox(
                    "Pressão de Alarme", ["Aprovado", "Reprovado"])
                pressao_alarme_valor = col12.text_input(
                    "Valor de Disparo (bar)", value="57,0 bar")

                st.subheader("Informações da Empresa")
                empresa_executante = st.text_input("Empresa Executante")
                responsavel_tecnico = st.text_input("Responsável Técnico")

                submitted = st.form_submit_button(
                    "Registrar Teste", type="primary", use_container_width=True)

                if submitted:
                    if not numero_serie:
                        st.error(
                            "O número de série do equipamento é obrigatório.")
                    else:
                        record = {
                            'data_teste': data_teste.isoformat(),
                            'data_validade': data_validade.isoformat(),
                            'numero_serie_equipamento': numero_serie,
                            'marca': marca,
                            'modelo': modelo,
                            'numero_serie_mascara': numero_serie_mascara,
                            'numero_serie_segundo_estagio': numero_serie_segundo_estagio,
                            'resultado_final': resultado_final,
                            'vazamento_mascara_resultado': vazamento_mascara_resultado,
                            'vazamento_mascara_valor': vazamento_mascara_valor,
                            'vazamento_pressao_alta_resultado': vazamento_pressao_alta_resultado,
                            'vazamento_pressao_alta_valor': vazamento_pressao_alta_valor,
                            'pressao_alarme_resultado': pressao_alarme_resultado,
                            'pressao_alarme_valor': pressao_alarme_valor,
                            'empresa_executante': empresa_executante,
                            'responsavel_tecnico': responsavel_tecnico
                        }

                        if save_scba_inspection(record=record, pdf_link=None, user_name=get_user_display_name()):
                            st.success(
                                f"Teste para o SCBA '{numero_serie}' registrado com sucesso!")
                            #st.balloons()
                            st.cache_data.clear()

    with tab_quality_air:
        st.header("Registrar Laudo de Qualidade do Ar com IA")

        if not can_edit():
            st.warning(
                "Você precisa de permissões de edição para registrar laudos.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            if not has_ai_features():
                st.info("✨ **Este recurso de IA** está disponível no plano **Premium IA**. Faça o upgrade para automatizar seu trabalho ou use a aba de registro manual!", icon="🚀")
            else:
                st.session_state.setdefault('airq_step', 'start')
                st.session_state.setdefault('airq_processed_data', None)
                st.session_state.setdefault('airq_uploaded_pdf', None)

                st.subheader("1. Faça o Upload do Laudo PDF")
                st.info(
                    "A IA analisará o laudo, extrairá os dados e criará um registro para cada cilindro mencionado.")

                uploaded_pdf_airq = st.file_uploader("Escolha o laudo de qualidade do ar", type=[
                                                     "pdf"], key="airq_pdf_uploader")
                if uploaded_pdf_airq:
                    st.session_state.airq_uploaded_pdf = uploaded_pdf_airq

                if st.session_state.airq_uploaded_pdf and st.button("🔎 Analisar Laudo de Ar com IA"):
                    with st.spinner("Analisando o laudo com IA..."):
                        prompt = get_air_quality_prompt()
                        extracted_data = pdf_qa.extract_structured_data(
                            st.session_state.airq_uploaded_pdf, prompt)
                        if extracted_data and "laudo" in extracted_data:
                            st.session_state.airq_processed_data = extracted_data["laudo"]
                            st.session_state.airq_step = 'confirm'
                            st.rerun()
                        else:
                            st.error(
                                "A IA não conseguiu extrair os dados do laudo.")

                if st.session_state.airq_step == 'confirm' and st.session_state.airq_processed_data:
                    data = st.session_state.airq_processed_data
                    st.subheader("2. Confira os Dados e Salve")
                    st.metric("Resultado do Laudo", data.get(
                        'resultado_geral', 'N/A'))
                    cilindros = data.get('cilindros', [])
                    st.info(
                        f"O laudo será aplicado aos seguintes cilindros: {', '.join(cilindros)}")

                    if st.button("💾 Confirmar e Registrar Laudo", type="primary", use_container_width=True):
                        with st.spinner("Processando e salvando..."):
                            pdf_name = f"Laudo_Ar_{data.get('data_ensaio')}_{st.session_state.airq_uploaded_pdf.name}"
                            pdf_link = upload_evidence_photo(
                                st.session_state.airq_uploaded_pdf, pdf_name, "laudos_ar")

                            if pdf_link:
                                cilindros = data.get('cilindros', [])
                                if not cilindros:
                                    st.error(
                                        "Não é possível salvar, pois nenhum cilindro foi identificado no laudo.")
                                else:
                                    records = []
                                    for cilindro_sn in cilindros:
                                        record = {
                                            'numero_serie_equipamento': cilindro_sn,
                                            'data_ensaio_ar': data.get('data_ensaio'),
                                            'resultado_ensaio_ar': data.get('resultado_geral'),
                                            'observacoes_ensaio_ar': data.get('observacoes'),
                                            'link_laudo_ar': pdf_link
                                        }
                                        records.append(record)

                                    db_client = get_supabase_client()
                                    db_client.append_data(
                                        "qualidade_ar_scba", records)

                                    st.success(
                                        f"Laudo de qualidade do ar registrado com sucesso para {len(cilindros)} cilindros!")

                                    st.session_state.airq_step = 'start'
                                    st.session_state.airq_processed_data = None
                                    st.session_state.airq_uploaded_pdf = None
                                    st.cache_data.clear()
                                    st.rerun()
                            else:
                                st.error(
                                    "Falha no upload do PDF. Nenhum dado foi salvo.")

    with tab_manual_air:
        st.header("Registrar Qualidade do Ar Manualmente")

        if not can_edit():
            st.warning(
                "Você precisa de permissões de edição para registrar laudos de qualidade do ar.")
        else:
            st.info(
                "Use este formulário para registrar manualmente um laudo de qualidade do ar sem necessidade de processar um PDF.")

            with st.form("manual_air_quality_form", clear_on_submit=True):
                st.subheader("Dados do Laudo")

                col1, col2 = st.columns(2)
                data_ensaio = col1.date_input(
                    "Data do Ensaio", value=date.today())
                resultado_geral = col2.selectbox(
                    "Resultado Geral", ["Aprovado", "Reprovado"])

                observacoes = st.text_area("Observações/Metodologia",
                                           placeholder="Descreva a metodologia utilizada ou outras observações relevantes")

                st.subheader("Cilindros Analisados")
                cilindros_text = st.text_area("Números de Série dos Cilindros",
                                              placeholder="Digite os números de série separados por vírgula\nEx: 1807087005, 1807087148, 1807087200",
                                              help="Informe todos os números de série dos cilindros que foram analisados no laudo, separados por vírgula")

                submitted = st.form_submit_button(
                    "Registrar Laudo de Qualidade do Ar", type="primary", use_container_width=True)

                if submitted:
                    if not cilindros_text.strip():
                        st.error(
                            "É obrigatório informar pelo menos um número de série de cilindro.")
                    else:
                        air_data = {
                            'data_ensaio': data_ensaio.isoformat(),
                            'resultado_geral': resultado_geral,
                            'observacoes': observacoes or "Registro manual",
                            'cilindros_text': cilindros_text
                        }

                        if save_manual_air_quality_record(air_data):
                            cilindros_count = len(
                                [c.strip() for c in cilindros_text.split(',') if c.strip()])
                            st.success(
                                f"Laudo de qualidade do ar registrado com sucesso para {cilindros_count} cilindro(s)!")
                            #st.balloons()
                            st.cache_data.clear()

    with tab_visual_insp:
        st.header("Realizar Inspeção Periódica de SCBA")

        if not can_edit():
            st.warning(
                "Você precisa de permissões de edição para realizar inspeções.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            st.info(
                "Esta inspeção inclui a verificação visual dos componentes e os testes funcionais de vedação e alarme.")

            df_scba = load_sheet_data("conjuntos_autonomos")
            if not df_scba.empty:
                equipment_list = df_scba.dropna(subset=['numero_serie_equipamento'])[
                    'numero_serie_equipamento'].unique().tolist()
            else:
                equipment_list = []

            if not equipment_list:
                st.warning(
                    "Nenhum equipamento SCBA cadastrado. Registre um teste nas abas anteriores para começar.")
            else:
                options = ["Selecione um equipamento..."] + \
                    sorted(equipment_list)
                selected_scba_id = st.selectbox(
                    "Selecione o Equipamento para Inspecionar", options, key="scba_visual_select")

                if selected_scba_id != "Selecione um equipamento...":
                    cilindro_items = ["Integridade Cilindro", "Registro e Valvulas", "Manômetro do Cilindro",
                                      "Pressão Manômetro", "Mangueiras e Conexões", "Correias/ Tirantes e Alças"]
                    mascara_items = ["Integridade da Máscara", "Visor ou Lente", "Borrachas de Vedação",
                                     "Conector da válvula de Inalação", "Correias/ Tirantes", "Fivelas e Alças", "Válvula de Exalação"]

                    with st.form(key=f"visual_insp_{selected_scba_id}", clear_on_submit=True):
                        results = {"Cilindro": {}, "Mascara": {},
                                   "Testes Funcionais": {}}
                        has_issues = False

                        st.subheader("Testes Funcionais")

                        with st.expander("Ver instruções para o Teste de Estanqueidade"):
                            st.markdown("""
                            1.  **Trave** a válvula de demanda (bypass).
                            2.  **Abra e feche** completamente a válvula do cilindro.
                            3.  **Monitore** os manômetros por **1 minuto**.
                            4.  **Critério:** A queda de pressão deve ser **menor que 10 bar**.
                            """)
                        teste_estanqueidade = st.radio("1. Teste de Estanqueidade (Vedação Alta Pressão)", [
                                                       "Aprovado", "Reprovado"], horizontal=True, key="teste_estanqueidade")
                        results["Testes Funcionais"]["Estanqueidade Alta Pressão"] = teste_estanqueidade
                        if teste_estanqueidade == "Reprovado":
                            has_issues = True

                        with st.expander("Ver instruções para o Teste do Alarme Sonoro"):
                            st.markdown("""
                            1.  Com o sistema ainda pressurizado, **libere o ar lentamente** pelo botão de purga.
                            2.  **Observe** o manômetro.
                            3.  **Critério:** O alarme sonoro deve disparar entre **50-55 bar**.
                            """)
                        teste_alarme = st.radio("2. Teste do Alarme Sonoro de Baixa Pressão", [
                                                "Aprovado", "Reprovado"], horizontal=True, key="teste_alarme")
                        results["Testes Funcionais"]["Alarme de Baixa Pressão"] = teste_alarme
                        if teste_alarme == "Reprovado":
                            has_issues = True

                        with st.expander("Ver instruções para o Teste de Vedação da Máscara"):
                            st.markdown("""
                            1.  **Vista** a máscara e **ajuste** os tirantes.
                            2.  **Cubra** a entrada da válvula de demanda com a mão.
                            3.  **Inspire suavemente**.
                            4.  **Critério:** A máscara deve ser **sugada contra o rosto** e permanecer assim, sem vazamentos.
                            """)
                        teste_vedacao_mascara = st.radio("3. Teste de Vedação da Peça Facial (Pressão Negativa)", [
                                                         "Aprovado", "Reprovado"], horizontal=True, key="teste_vedacao_mascara")
                        results["Testes Funcionais"]["Vedação da Máscara"] = teste_vedacao_mascara
                        if teste_vedacao_mascara == "Reprovado":
                            has_issues = True

                        st.markdown("---")

                        st.subheader("Inspeção Visual dos Componentes")

                        st.markdown("**Item 1.0 - Cilindro de Ar**")
                        for item in cilindro_items:
                            cols = st.columns([3, 2])
                            with cols[0]:
                                st.write(item)
                            with cols[1]:
                                status = st.radio("Status", [
                                                  "C", "N/C", "N/A"], key=f"cil_{item}", horizontal=True, label_visibility="collapsed")
                                results["Cilindro"][item] = status
                                if status == "N/C":
                                    has_issues = True
                        results["Cilindro"]["Observações"] = st.text_area(
                            "Observações - Cilindro de Ar", key="obs_cilindro")

                        st.markdown("**Item 2.0 - Máscara Facial**")
                        for item in mascara_items:
                            cols = st.columns([3, 2])
                            with cols[0]:
                                st.write(item)
                            with cols[1]:
                                status = st.radio("Status", [
                                                  "C", "N/C", "N/A"], key=f"masc_{item}", horizontal=True, label_visibility="collapsed")
                                results["Mascara"][item] = status
                                if status == "N/C":
                                    has_issues = True
                        results["Mascara"]["Observações"] = st.text_area(
                            "Observações - Máscara Facial", key="obs_mascara")

                        submitted = st.form_submit_button(
                            "✅ Salvar Inspeção Completa", type="primary", use_container_width=True)

                        if submitted:
                            overall_status = "Reprovado com Pendências" if has_issues else "Aprovado"
                            with st.spinner("Salvando inspeção..."):
                                if save_scba_visual_inspection(
                                    equipment_id=selected_scba_id,
                                    overall_status=overall_status,
                                    results_dict=results,
                                    inspector_name=get_user_display_name()
                                ):
                                    st.success(
                                        f"Inspeção periódica para o SCBA '{selected_scba_id}' salva com sucesso!")
                                    st.cache_data.clear()
                                    st.rerun()
                                else:
                                    st.error(
                                        "Ocorreu um erro ao salvar a inspeção.")

    with tab_manual_scba:
        st.header("Cadastrar Novo SCBA Manualmente")

        if not can_edit():
            st.warning(
                "Você precisa de permissões de edição para cadastrar novos equipamentos.")
            st.info("Os dados abaixo são somente para visualização.")
        else:
            st.info("Use este formulário para cadastrar um novo conjunto autônomo (SCBA) sem necessidade de processar um relatório de teste Posi3.")

            with st.form("manual_scba_form", clear_on_submit=True):
                st.subheader("Dados do Equipamento SCBA")

                col1, col2 = st.columns(2)

                numero_serie = col1.text_input(
                    "Número de Série do Equipamento (Obrigatório)*")
                marca = col2.text_input("Marca")

                col3, col4 = st.columns(2)
                modelo = col3.text_input("Modelo")
                data_teste = col4.date_input(
                    "Data do Teste/Cadastro", value=date.today())

                st.markdown("---")
                st.subheader("Dados Complementares (Opcional)")

                col5, col6 = st.columns(2)
                numero_serie_mascara = col5.text_input(
                    "Número de Série da Máscara")
                numero_serie_segundo_estagio = col6.text_input(
                    "Número de Série do Segundo Estágio")

                empresa_executante = st.text_input(
                    "Empresa Fornecedora/Executante")

                submitted = st.form_submit_button(
                    "Cadastrar Novo SCBA", type="primary", use_container_width=True)

                if submitted:
                    if not numero_serie:
                        st.error(
                            "O número de série do equipamento é obrigatório.")
                    else:
                        scba_data = {
                            'numero_serie_equipamento': numero_serie,
                            'marca': marca,
                            'modelo': modelo,
                            'data_teste': data_teste.isoformat(),
                            'numero_serie_mascara': numero_serie_mascara,
                            'numero_serie_segundo_estagio': numero_serie_segundo_estagio,
                            'empresa_executante': empresa_executante
                        }

                        if save_manual_scba(scba_data):
                            st.success(
                                f"SCBA com número de série '{numero_serie}' cadastrado com sucesso!")
                            st.cache_data.clear()
