import streamlit as st
from streamlit_js_eval import streamlit_js_eval
import json


def get_user_location():
    """
    Captura a geolocalização do usuário usando JavaScript.

    Returns:
        dict: {
            'latitude': float,
            'longitude': float,
            'accuracy': float (em metros),
            'error': str (se houver erro)
        }
    """
    try:
        # JavaScript para capturar geolocalização
        js_code = """
        new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                resolve({error: 'Geolocalização não suportada pelo navegador'});
                return;
            }
            
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                        accuracy: position.coords.accuracy
                    });
                },
                (error) => {
                    let errorMsg = 'Erro desconhecido';
                    switch(error.code) {
                        case error.PERMISSION_DENIED:
                            errorMsg = 'Permissão negada pelo usuário';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMsg = 'Localização indisponível';
                            break;
                        case error.TIMEOUT:
                            errorMsg = 'Tempo esgotado para obter localização';
                            break;
                    }
                    resolve({
                        error: errorMsg,
                        code: error.code
                    });
                },
                {
                    enableHighAccuracy: true,
                    timeout: 15000,
                    maximumAge: 0
                }
            );
        });
        """

        result = streamlit_js_eval(
            js_expressions=js_code,
            want_output=True,
            key=f"geoloc_{st.session_state.get('geo_key', 0)}"
        )

        if result and isinstance(result, dict):
            if 'error' in result:
                return {
                    'latitude': None,
                    'longitude': None,
                    'accuracy': None,
                    'error': result['error']
                }

            return {
                'latitude': round(result.get('latitude'), 6) if result.get('latitude') else None,
                'longitude': round(result.get('longitude'), 6) if result.get('longitude') else None,
                'accuracy': round(result.get('accuracy'), 1) if result.get('accuracy') else None,
                'error': None
            }

        return {
            'latitude': None,
            'longitude': None,
            'accuracy': None,
            'error': 'Nenhum resultado retornado'
        }

    except Exception as e:
        return {
            'latitude': None,
            'longitude': None,
            'accuracy': None,
            'error': str(e)
        }


def format_coordinates(lat, lon):
    """
    Formata coordenadas para exibição.

    Args:
        lat: Latitude
        lon: Longitude

    Returns:
        str: Coordenadas formatadas
    """
    if lat is None or lon is None:
        return "Não disponível"

    lat_dir = "N" if lat >= 0 else "S"
    lon_dir = "E" if lon >= 0 else "W"

    return f"{abs(lat):.6f}°{lat_dir}, {abs(lon):.6f}°{lon_dir}"


def get_accuracy_warning(accuracy_meters):
    """
    Retorna aviso apropriado baseado na precisão.

    Args:
        accuracy_meters: Precisão em metros

    Returns:
        tuple: (tipo_alerta, mensagem)
    """
    if accuracy_meters is None:
        return ("info", "⚠️ Precisão desconhecida")

    if accuracy_meters <= 10:
        return ("success", f"✅ Boa precisão: ±{accuracy_meters:.1f} metros")
    elif accuracy_meters <= 50:
        return ("warning", f"⚠️ Precisão moderada: ±{accuracy_meters:.1f} metros")
    else:
        return ("error", f"❌ Baixa precisão: ±{accuracy_meters:.1f} metros - Considere mover-se para área aberta")


def get_google_maps_link(lat, lon):
    """
    Gera link do Google Maps para as coordenadas.

    Args:
        lat: Latitude
        lon: Longitude

    Returns:
        str: URL do Google Maps ou None
    """
    if lat is None or lon is None:
        return None

    return f"https://www.google.com/maps?q={lat},{lon}"


def show_geolocation_widget_optional(form_key="default"):
    """
    Widget opcional de geolocalização com toggle.
    Retorna None, None se o usuário não quiser usar geolocalização.

    Args:
        form_key: Chave única para o formulário

    Returns:
        tuple: (latitude, longitude) ou (None, None)
    """
    # Chaves de sessão únicas
    toggle_key = f"geo_toggle_{form_key}"
    lat_key = f"geo_lat_{form_key}"
    lon_key = f"geo_lon_{form_key}"
    accuracy_key = f"geo_accuracy_{form_key}"

    # Inicializa estado
    if toggle_key not in st.session_state:
        st.session_state[toggle_key] = False
    if lat_key not in st.session_state:
        st.session_state[lat_key] = None
    if lon_key not in st.session_state:
        st.session_state[lon_key] = None
    if accuracy_key not in st.session_state:
        st.session_state[accuracy_key] = None

    # Toggle principal
    usar_geo = st.toggle(
        "📍 Registrar localização GPS do equipamento (Opcional)",
        value=st.session_state[toggle_key],
        key=f"toggle_geo_{form_key}",
        help="Ative para registrar a localização geográfica exata do equipamento"
    )

    st.session_state[toggle_key] = usar_geo

    if not usar_geo:
        # Se desativou, limpa os dados
        st.session_state[lat_key] = None
        st.session_state[lon_key] = None
        st.session_state[accuracy_key] = None
        return None, None

    # Aviso importante sobre precisão
    st.warning(
        "⚠️ **Importante sobre a precisão GPS:**\n\n"
        "A localização obtida pelo navegador pode ter uma margem de erro que varia de "
        "**5 a 50 metros** ou mais, dependendo de:\n"
        "- 📱 Tipo de dispositivo (celular tem GPS, computador usa WiFi/IP)\n"
        "- 🏢 Ambiente (áreas abertas têm melhor precisão que ambientes fechados)\n"
        "- 📶 Qualidade do sinal GPS/WiFi disponível\n\n"
        "Para maior precisão, use dispositivos móveis em áreas abertas."
    )

    # Botão para capturar
    col1, col2 = st.columns([3, 1])

    with col2:
        if st.button(
            "📡 Capturar GPS",
            key=f"btn_capture_{form_key}",
            use_container_width=True,
            type="primary"
        ):
            # Incrementa key para forçar nova captura
            if 'geo_key' not in st.session_state:
                st.session_state.geo_key = 0
            st.session_state.geo_key += 1

            with st.spinner("🛰️ Obtendo localização GPS..."):
                result = get_user_location()

                if result['error']:
                    st.error(f"❌ Erro: {result['error']}")
                    st.info(
                        "💡 **Possíveis soluções:**\n"
                        "- Permita o acesso à localização no navegador\n"
                        "- Verifique se o GPS está ativado no dispositivo\n"
                        "- Tente usar um dispositivo móvel\n"
                        "- Considere inserir coordenadas manualmente"
                    )
                else:
                    st.session_state[lat_key] = result['latitude']
                    st.session_state[lon_key] = result['longitude']
                    st.session_state[accuracy_key] = result['accuracy']
                    st.rerun()

    # Exibe coordenadas capturadas
    with col1:
        if st.session_state[lat_key] and st.session_state[lon_key]:
            lat = st.session_state[lat_key]
            lon = st.session_state[lon_key]
            accuracy = st.session_state[accuracy_key]

            # Mostra coordenadas
            st.success(
                f"✅ **Localização capturada:** {format_coordinates(lat, lon)}")

            # Mostra precisão
            if accuracy:
                alert_type, alert_msg = get_accuracy_warning(accuracy)
                if alert_type == "success":
                    st.success(alert_msg)
                elif alert_type == "warning":
                    st.warning(alert_msg)
                else:
                    st.error(alert_msg)

            # Link para Google Maps
            maps_link = get_google_maps_link(lat, lon)
            if maps_link:
                st.markdown(
                    f"[🗺️ Verificar localização no Google Maps]({maps_link})")
        else:
            st.info("📍 Clique no botão 'Capturar GPS' para obter a localização atual")

    # Opção para entrada manual (sempre disponível)
    with st.expander("✏️ Ou inserir coordenadas manualmente"):
        st.info(
            "💡 Use esta opção se:\n"
            "- O GPS não está disponível ou não funciona corretamente\n"
            "- Você tem coordenadas exatas de outra fonte\n"
            "- Deseja maior precisão usando equipamento profissional"
        )

        col_lat, col_lon = st.columns(2)

        with col_lat:
            manual_lat = st.number_input(
                "Latitude",
                min_value=-90.0,
                max_value=90.0,
                value=st.session_state[lat_key] if st.session_state[lat_key] else 0.0,
                format="%.6f",
                key=f"input_lat_{form_key}",
                help="Valores negativos para Sul, positivos para Norte"
            )

        with col_lon:
            manual_lon = st.number_input(
                "Longitude",
                min_value=-180.0,
                max_value=180.0,
                value=st.session_state[lon_key] if st.session_state[lon_key] else 0.0,
                format="%.6f",
                key=f"input_lon_{form_key}",
                help="Valores negativos para Oeste, positivos para Leste"
            )

        if st.button("💾 Usar coordenadas manuais", key=f"save_manual_{form_key}"):
            if manual_lat != 0.0 and manual_lon != 0.0:
                st.session_state[lat_key] = manual_lat
                st.session_state[lon_key] = manual_lon
                st.session_state[accuracy_key] = None  # Precisão desconhecida
                st.success("✅ Coordenadas salvas manualmente!")
                st.rerun()
            else:
                st.warning("⚠️ Insira valores válidos diferentes de zero")

    return st.session_state[lat_key], st.session_state[lon_key]
