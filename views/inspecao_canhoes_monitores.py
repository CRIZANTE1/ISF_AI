import streamlit as st
from operations.canhao_monitor_operations import (
    save_new_canhao_monitor,
    save_canhao_monitor_inspection,
    CHECKLIST_VISUAL,
    CHECKLIST_FUNCIONAL
)
from auth.auth_utils import get_user_display_name, can_edit
from operations.history import load_sheet_data
from operations.instrucoes import instru_canhoes_monitores


def show_page():
    st.title("🌊 Gestão de Canhões Monitores")

    tab_instructions, tab_inspection, tab_register = st.tabs([
        "📖 Instruções",
        "📋 Realizar Inspeção / Teste",
        "➕ Cadastrar Novo Canhão"
    ])

    with tab_instructions:
        instru_canhoes_monitores()

    with tab_inspection:
        st.header("Realizar Inspeção Periódica / Teste Funcional")

        if not can_edit():
            st.warning(
                "Você precisa de permissões de edição para realizar inspeções.")
        else:
            df_inventory = load_sheet_data("inventario_canhoes_monitores")

            if df_inventory.empty:
                st.warning(
                    "Nenhum canhão monitor cadastrado. Cadastre um na aba 'Cadastrar Novo Canhão'.")
            else:
                equipment_options = ["Selecione..."] + \
                    sorted(df_inventory['id_equipamento'].tolist())
                selected_id = st.selectbox(
                    "Selecione o Canhão Monitor", equipment_options)

                if selected_id != "Selecione...":
                    equip_data = df_inventory[df_inventory['id_equipamento']
                                              == selected_id].iloc[0]
                    st.info(
                        f"**Localização:** {equip_data.get('localizacao', 'N/A')} | **Marca/Modelo:** {equip_data.get('marca', 'N/A')} / {equip_data.get('modelo', 'N/A')}")

                    inspection_type = st.radio(
                        "Selecione o Tipo de Atividade:",
                        ("Inspeção Visual (Trimestral)", "Teste Funcional (Anual)"),
                        horizontal=True
                    )

                    st.markdown("---")

                    with st.form(key=f"inspection_form_{selected_id}"):
                        inspection_results = {}
                        has_issues = False

                        st.subheader("Checklist de Inspeção Visual")
                        for category, questions in CHECKLIST_VISUAL.items():
                            st.markdown(f"**{category}**")
                            for question in questions:
                                key = f"{selected_id}_{question}".replace(
                                    " ", "_")
                                answer = st.radio(
                                    question, ["Conforme", "Não Conforme", "N/A"], key=key, horizontal=True)
                                inspection_results[question] = answer
                                if answer == "Não Conforme":
                                    has_issues = True

                        if inspection_type == "Teste Funcional (Anual)":
                            st.subheader("Checklist de Teste Funcional")
                            for category, questions in CHECKLIST_FUNCIONAL.items():
                                st.markdown(f"**{category}**")
                                for question in questions:
                                    key = f"{selected_id}_{question}".replace(
                                        " ", "_")
                                    answer = st.radio(
                                        question, ["Aprovado", "Reprovado", "N/A"], key=key, horizontal=True)
                                    inspection_results[question] = answer
                                    if answer == "Reprovado":
                                        has_issues = True

                        st.markdown("---")

                        photo_file = None
                        show_photo_uploader = has_issues or (
                            inspection_type == "Teste Funcional (Anual)")

                        if show_photo_uploader:
                            if inspection_type == "Teste Funcional (Anual)":
                                if has_issues:
                                    st.error(
                                        "FOTO OBRIGATÓRIA: Anexe uma foto da não conformidade encontrada durante o teste.")
                                else:
                                    st.info(
                                        "FOTO OBRIGATÓRIA: Para Testes Funcionais, anexe uma foto do equipamento em operação (ex: jato d'água).")
                            else:
                                st.warning(
                                    "FOTO OBRIGATÓRIA: Uma ou mais não conformidades foram encontradas. Anexe uma foto como evidência.")

                            photo_file = st.file_uploader(
                                "Anexar evidência fotográfica",
                                type=["jpg", "jpeg", "png"],
                                key=f"photo_uploader_{selected_id}"
                            )

                        submitted = st.form_submit_button(
                            "✅ Salvar Registro", type="primary", use_container_width=True)

                        if submitted:
                            error_message = ""
                            if has_issues and not photo_file:
                                error_message = "É obrigatório anexar uma foto quando há não conformidades."
                            elif inspection_type == "Teste Funcional (Anual)" and not photo_file:
                                error_message = "É obrigatório anexar uma foto como evidência para o Teste Funcional."

                            if error_message:
                                st.error(error_message)
                            else:
                                overall_status = "Reprovado com Pendências" if has_issues else "Aprovado"
                                with st.spinner("Salvando..."):
                                    success = save_canhao_monitor_inspection(
                                        equip_id=selected_id,
                                        inspection_type=inspection_type,
                                        overall_status=overall_status,
                                        results_dict=inspection_results,
                                        photo_file=photo_file,
                                        inspector_name=get_user_display_name()
                                    )
                                    if success:
                                        st.success(
                                            f"Registro para '{selected_id}' salvo com sucesso!")
                                        if not has_issues:
                                            st.balloons()
                                        st.cache_data.clear()
                                    else:
                                        st.error("Falha ao salvar o registro.")

    with tab_register:
        st.header("Cadastrar Novo Canhão Monitor")
        if not can_edit():
            st.warning(
                "Você precisa de permissões de edição para cadastrar novos equipamentos.")
        else:
            with st.form("new_canhao_form", clear_on_submit=True):
                st.info(
                    "Preencha os dados do novo equipamento a ser adicionado ao inventário.")
                col1, col2 = st.columns(2)
                new_id = col1.text_input(
                    "**ID do Equipamento (Obrigatório)**", help="Use um código único, ex: CM-01")
                new_location = col2.text_input(
                    "**Localização (Obrigatório)**", help="Descrição do local, ex: Dique do Tanque TQ-101")

                col3, col4 = st.columns(2)
                new_brand = col3.text_input("Marca")
                new_model = col4.text_input("Modelo")

                submit_register = st.form_submit_button(
                    "➕ Cadastrar Equipamento", type="primary", use_container_width=True)

                if submit_register:
                    if not new_id or not new_location:
                        st.error(
                            "Os campos 'ID do Equipamento' e 'Localização' são obrigatórios.")
                    else:
                        with st.spinner("Cadastrando..."):
                            if save_new_canhao_monitor(new_id, new_location, new_brand, new_model):
                                st.success(
                                    f"Canhão Monitor '{new_id}' cadastrado com sucesso!")
                                st.cache_data.clear()
