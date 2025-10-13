import streamlit as st
import pandas as pd
from supabase.client import get_supabase_client
from utils.auditoria import log_action


def get_all_locations():
    """
    Retorna todos os locais cadastrados.
    """
    try:
        db_client = get_supabase_client()
        df = db_client.get_data("locais")

        if df.empty:
            return pd.DataFrame(columns=['id', 'local'])

        df = df[(df['id'].notna()) & (df['id'] != '')]

        return df

    except Exception as e:
        st.error(f"Erro ao carregar locais: {e}")
        return pd.DataFrame(columns=['id', 'local'])


def get_location_name_by_id(location_id):
    """
    Retorna o nome de um local pelo ID.
    """
    if not location_id or pd.isna(location_id):
        return None

    df_locations = get_all_locations()

    if df_locations.empty:
        return None

    location = df_locations[df_locations['id'] == str(location_id)]

    if not location.empty:
        return location.iloc[0]['local']

    return None


def save_new_location(location_id, location_name):
    """
    Salva um novo local na tabela 'locais'.
    """
    try:
        db_client = get_supabase_client()

        df_locations = get_all_locations()

        if not df_locations.empty and location_id in df_locations['id'].values:
            st.error(f"❌ Erro: O ID '{location_id}' já existe.")
            return False

        new_record = {
            "id": location_id,
            "local": location_name
        }

        db_client.append_data("locais", new_record)

        log_action("CADASTROU_LOCAL",
                   f"ID: {location_id}, Nome: {location_name}")

        return True

    except Exception as e:
        st.error(f"Erro ao salvar local: {e}")
        return False


def update_location(location_id, new_location_name):
    """
    Atualiza o nome de um local existente.
    """
    try:
        db_client = get_supabase_client()

        updates = {
            "local": new_location_name
        }

        db_client.update_data("locais", updates, "id", location_id)

        log_action("ATUALIZOU_LOCAL",
                   f"ID: {location_id}, Novo nome: {new_location_name}")

        return True

    except Exception as e:
        st.error(f"Erro ao atualizar local: {e}")
        return False


def delete_location(location_id):
    """
    Deleta um local.
    """
    try:
        db_client = get_supabase_client()
        # This is a placeholder for checking for associated equipment.
        # This should be implemented based on the database schema.
        # For now, we assume that if a location is in use, it should not be deleted.
        df_extinguishers = db_client.get_data("extintores")

        if not df_extinguishers.empty:
            equipments = df_extinguishers[df_extinguishers['local']
                                          == location_id]
            if not equipments.empty:
                st.warning(
                    f"⚠️ Não é possível remover este local pois há {len(equipments)} "
                    f"equipamento(s) associado(s) a ele."
                )
                return False

        db_client.delete_data("locais", "id", location_id)

        log_action("REMOVEU_LOCAL", f"ID: {location_id}")

        return True

    except Exception as e:
        st.error(f"Erro ao remover local: {e}")
        return False


def show_location_selector(key_suffix="", required=False, current_value=None):
    """
    Widget para seleção de local com opção de criar novo.
    """
    df_locations = get_all_locations()

    if df_locations.empty:
        st.warning("📍 Nenhum local cadastrado ainda.")

        with st.expander("➕ Cadastrar primeiro local"):
            with st.form(f"new_location_form_{key_suffix}"):
                new_id = st.text_input(
                    "ID do Local*", help="Ex: SALA-01, CORREDOR-A, etc.")
                new_name = st.text_input(
                    "Nome/Descrição do Local*", help="Ex: Sala de Máquinas, Corredor Principal")

                submitted = st.form_submit_button("💾 Salvar Local")

                if submitted:
                    if new_id and new_name:
                        if save_new_location(new_id, new_name):
                            st.success(f"✅ Local '{new_name}' cadastrado!")
                            st.cache_data.clear()
                            st.rerun()
                    else:
                        st.error("Preencha todos os campos obrigatórios.")

        return None

    location_options = df_locations.apply(
        lambda row: f"{row['id']} - {row['local']}",
        axis=1
    ).tolist()

    if not required:
        location_options.insert(0, "Nenhum / Não informado")

    default_index = 0
    if current_value and not df_locations.empty:
        try:
            matching_location = df_locations[df_locations['id'] == str(
                current_value)]
            if not matching_location.empty:
                location_text = f"{matching_location.iloc[0]['id']} - {matching_location.iloc[0]['local']}"
                if location_text in location_options:
                    default_index = location_options.index(location_text)
        except:
            pass

    selected_option = st.selectbox(
        "📍 Local do Equipamento" + (" *" if required else " (Opcional)"),
        options=location_options,
        index=default_index,
        key=f"location_select_{key_suffix}",
        help="Selecione onde o equipamento está localizado"
    )

    selected_id = None
    if selected_option and selected_option != "Nenhum / Não informado":
        selected_id = selected_option.split(" - ")[0]

    col1, col2 = st.columns([3, 1])

    with col2:
        if st.button("➕ Novo Local", key=f"btn_new_location_{key_suffix}", use_container_width=True):
            st.session_state[f'show_new_location_form_{key_suffix}'] = True

    if st.session_state.get(f'show_new_location_form_{key_suffix}', False):
        with st.expander("➕ Cadastrar Novo Local", expanded=True):
            with st.form(f"new_location_inline_form_{key_suffix}"):
                st.info("💡 Cadastre um novo local para usar imediatamente")

                new_id = st.text_input(
                    "ID do Local*",
                    help="Ex: SALA-01, CORREDOR-A, DEPOSITO-03"
                )
                new_name = st.text_input(
                    "Nome/Descrição*",
                    help="Ex: Sala de Máquinas, Corredor Principal"
                )

                col_save, col_cancel = st.columns(2)

                with col_save:
                    submitted = st.form_submit_button(
                        "💾 Salvar", use_container_width=True, type="primary")

                with col_cancel:
                    cancelled = st.form_submit_button(
                        "❌ Cancelar", use_container_width=True)

                if submitted:
                    if new_id and new_name:
                        if save_new_location(new_id, new_name):
                            st.success(
                                f"✅ Local '{new_name}' cadastrado com sucesso!")
                            st.session_state[f'show_new_location_form_{key_suffix}'] = False
                            st.cache_data.clear()
                            st.rerun()
                    else:
                        st.error("❌ Preencha todos os campos obrigatórios.")

                if cancelled:
                    st.session_state[f'show_new_location_form_{key_suffix}'] = False
                    st.rerun()

    return selected_id


def show_location_management_interface():
    """
    Interface completa para gerenciamento de locais.
    """
    st.subheader("📍 Gerenciamento de Locais")

    df_locations = get_all_locations()

    col1, col2 = st.columns(2)
    with col1:
        st.metric("Total de Locais", len(df_locations))

    with st.expander("➕ Cadastrar Novo Local", expanded=df_locations.empty):
        with st.form("new_location_admin_form"):
            st.info("💡 Cadastre locais para facilitar a organização dos equipamentos")

            col_id, col_name = st.columns(2)

            with col_id:
                new_id = st.text_input(
                    "ID do Local*",
                    help="Identificador único. Ex: SALA-01, CORREDOR-A"
                )

            with col_name:
                new_name = st.text_input(
                    "Nome/Descrição*",
                    help="Descrição clara do local"
                )

            submitted = st.form_submit_button(
                "💾 Cadastrar Local", type="primary")

            if submitted:
                if new_id and new_name:
                    if save_new_location(new_id, new_name):
                        st.success(f"✅ Local '{new_name}' cadastrado!")
                        st.cache_data.clear()
                        st.rerun()
                else:
                    st.error("Preencha todos os campos obrigatórios.")

    st.markdown("---")

    if not df_locations.empty:
        st.subheader("📋 Locais Cadastrados")

        st.dataframe(
            df_locations,
            use_container_width=True,
            hide_index=True,
            column_config={
                "id": st.column_config.TextColumn("ID", width="small"),
                "local": st.column_config.TextColumn("Nome/Descrição", width="large")
            }
        )

        st.markdown("---")

        with st.expander("✏️ Editar Local Existente"):
            location_to_edit = st.selectbox(
                "Selecione o local para editar:",
                options=df_locations['id'].tolist(),
                format_func=lambda x: f"{x} - {get_location_name_by_id(x)}",
                key="edit_location_select"
            )

            if location_to_edit:
                current_name = get_location_name_by_id(location_to_edit)

                with st.form("edit_location_form"):
                    st.info(f"Editando local: **{location_to_edit}**")

                    new_name = st.text_input(
                        "Novo Nome/Descrição:",
                        value=current_name,
                        key="edit_location_name"
                    )

                    submitted = st.form_submit_button(
                        "💾 Salvar Alterações", type="primary")

                    if submitted:
                        if new_name and new_name != current_name:
                            if update_location(location_to_edit, new_name):
                                st.success(f"✅ Local atualizado!")
                                st.cache_data.clear()
                                st.rerun()
                        elif new_name == current_name:
                            st.info("Nenhuma alteração detectada.")
                        else:
                            st.error("O nome não pode estar vazio.")

        with st.expander("🗑️ Remover Local"):
            st.warning(
                "⚠️ **Atenção:** Locais com equipamentos associados não podem ser removidos. "
                "Primeiro realoque os equipamentos para outro local."
            )

            location_to_delete = st.selectbox(
                "Selecione o local para remover:",
                options=df_locations['id'].tolist(),
                format_func=lambda x: f"{x} - {get_location_name_by_id(x)}",
                key="delete_location_select"
            )

            if location_to_delete:
                if st.button("🗑️ Remover Local '{}'".format(location_to_delete), type="secondary"):
                    if delete_location(location_to_delete):
                        st.success("✅ Local removido com sucesso!")
                        st.cache_data.clear()
                        st.rerun()
    else:
        st.info("📍 Nenhum local cadastrado ainda. Use o formulário acima para começar.")
