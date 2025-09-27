import streamlit as st
import sys
import os
import pandas as pd
from datetime import date, timedelta
from functools import reduce
from datetime import datetime, timedelta
import json

# Adiciona o diretório atual ao path para garantir que os módulos sejam encontrados
current_dir = os.path.dirname(os.path.abspath(__file__))
if current_dir not in sys.path:
    sys.path.insert(0, current_dir)

from auth.auth_utils import (
    is_user_logged_in, setup_sidebar, get_user_email, get_users_data,
    get_effective_user_status, get_effective_user_plan, get_user_role, 
    is_admin, is_superuser, get_user_info, get_user_display_name
)
from auth.login_page import show_login_page, show_user_header, show_logout_button
from utils.auditoria import log_action
from config.page_config import set_page_config
from streamlit_option_menu import option_menu

# Import com tratamento de erro para módulos opcionais
try:
    from views import (
        administracao, dashboard, resumo_gerencial, inspecao_extintores, 
        inspecao_mangueiras, inspecao_scba, inspecao_chuveiros,
        inspecao_camaras_espuma, inspecao_multigas, historico, inspecao_alarmes,
        utilitarios, demo_page, trial_expired_page
    )
    
    # Import condicional do perfil_usuario
    try:
        from views import perfil_usuario
        PERFIL_DISPONIVEL = True
    except ImportError as e:
        PERFIL_DISPONIVEL = False
        st.error(f"Módulo perfil_usuario não encontrado: {e}. Algumas funcionalidades podem não estar disponíveis.")
        
except ImportError as e:
    st.error(f"Erro ao importar módulos: {e}")
    st.stop()

set_page_config()

# Páginas base (sempre disponíveis)
PAGES = {
    "Dashboard": dashboard.show_page, 
    "Resumo Gerencial": resumo_gerencial.show_page, 
    "Inspeção de Extintores": inspecao_extintores.show_page, 
    "Inspeção de Mangueiras": inspecao_mangueiras.show_page,
    "Inspeção de SCBA": inspecao_scba.show_page, 
    "Inspeção de Chuveiros/LO": inspecao_chuveiros.show_page,
    "Inspeção de Câmaras de Espuma": inspecao_camaras_espuma.show_page, 
    "Inspeção Multigás": inspecao_multigas.show_page,
    "Inspeção de Alarmes": inspecao_alarmes.show_page,
    "Histórico e Logs": historico.show_page, 
    "Utilitários": utilitarios.show_page, 
    "Super Admin": administracao.show_page,
}

# Adiciona perfil apenas se disponível
if PERFIL_DISPONIVEL:
    PAGES["Meu Perfil"] = perfil_usuario.show_page

@st.cache_data(ttl=300, show_spinner=False)
def get_equipment_alerts():
    """
    Carrega alertas de equipamentos de forma otimizada.
    Retorna contadores de equipamentos com problemas.
    """
    try:
        from operations.history import load_sheet_data
        from gdrive.config import (
            EXTINGUISHER_SHEET_NAME, HOSE_SHEET_NAME, 
            INSPECTIONS_SHELTER_SHEET_NAME, SCBA_SHEET_NAME,
            EYEWASH_INSPECTIONS_SHEET_NAME, FOAM_CHAMBER_INSPECTIONS_SHEET_NAME,
            MULTIGAS_INVENTORY_SHEET_NAME, ALARM_INSPECTIONS_SHEET_NAME
        )
        
        alerts = {}
        today = pd.Timestamp(date.today())
        
        # Extintores vencidos
        try:
            df_ext = load_sheet_data(EXTINGUISHER_SHEET_NAME, silent_mode=True)
            if not df_ext.empty:
                df_ext['data_proxima_inspecao'] = pd.to_datetime(df_ext['data_proxima_inspecao'], errors='coerce')
                vencidos = df_ext[df_ext['data_proxima_inspecao'] < today]
                alerts['extintores'] = len(vencidos)
        except:
            alerts['extintores'] = 0
        
        # Mangueiras vencidas
        try:
            df_hoses = load_sheet_data(HOSE_SHEET_NAME, silent_mode=True)
            if not df_hoses.empty:
                df_hoses['data_proximo_teste'] = pd.to_datetime(df_hoses['data_proximo_teste'], errors='coerce')
                vencidos = df_hoses[df_hoses['data_proximo_teste'] < today]
                alerts['mangueiras'] = len(vencidos)
        except:
            alerts['mangueiras'] = 0
        
        # Abrigos com pendências
        try:
            df_abrigos = load_sheet_data(INSPECTIONS_SHELTER_SHEET_NAME, silent_mode=True)
            if not df_abrigos.empty:
                pendentes = df_abrigos[df_abrigos['status_geral'] == 'Reprovado com Pendências']
                alerts['abrigos'] = len(pendentes)
        except:
            alerts['abrigos'] = 0
        
        # SCBAs vencidos
        try:
            df_scba = load_sheet_data(SCBA_SHEET_NAME, silent_mode=True)
            if not df_scba.empty:
                df_scba['data_validade'] = pd.to_datetime(df_scba['data_validade'], errors='coerce')
                vencidos = df_scba[df_scba['data_validade'] < today]
                alerts['scba'] = len(vencidos)
        except:
            alerts['scba'] = 0
        
        return alerts
        
    except Exception as e:
        return {}

def get_navigation_with_badges():
    """
    Retorna itens de navegação com badges de notificação baseados em alertas reais.
    """
    alerts = get_equipment_alerts()
    user_role = get_user_role()
    user_plan = get_effective_user_plan()
    
    navigation_items = []
    
    # Dashboard (sempre disponível)
    navigation_items.append({
        "label": "Dashboard",
        "icon": "speedometer2",
        "badge": None,
        "available": True
    })
    
    # Resumo Gerencial (sempre disponível)
    navigation_items.append({
        "label": "Resumo Gerencial", 
        "icon": "clipboard-data",
        "badge": None,
        "available": True
    })
    
    # Páginas baseadas no plano
    if user_plan in ['pro', 'premium_ia']:
        if user_role != 'viewer':
            # Extintores
            ext_badge = alerts.get('extintores', 0)
            navigation_items.append({
                "label": "Inspeção de Extintores",
                "icon": "fire", 
                "badge": ext_badge if ext_badge > 0 else None,
                "available": True
            })
            
            # Mangueiras
            mang_badge = alerts.get('mangueiras', 0)
            navigation_items.append({
                "label": "Inspeção de Mangueiras",
                "icon": "droplet",
                "badge": mang_badge if mang_badge > 0 else None,
                "available": True
            })
            
            # SCBA
            scba_badge = alerts.get('scba', 0)
            navigation_items.append({
                "label": "Inspeção de SCBA",
                "icon": "lungs",
                "badge": scba_badge if scba_badge > 0 else None,
                "available": True
            })
            
            # Chuveiros/Lava-Olhos
            navigation_items.append({
                "label": "Inspeção de Chuveiros/LO",
                "icon": "droplet-half",
                "badge": None,
                "available": True
            })
            
            # Câmaras de Espuma
            navigation_items.append({
                "label": "Inspeção de Câmaras de Espuma",
                "icon": "cloud-rain-heavy",
                "badge": None,
                "available": True
            })
            
            # Multigás
            navigation_items.append({
                "label": "Inspeção Multigás",
                "icon": "wind",
                "badge": None,
                "available": True
            })
            
            # Alarmes
            navigation_items.append({
                "label": "Inspeção de Alarmes",
                "icon": "bell",
                "badge": None,
                "available": True
            })
            
            # Utilitários
            navigation_items.append({
                "label": "Utilitários",
                "icon": "tools",
                "badge": None,
                "available": True
            })
        
        # Histórico (disponível para viewer também)
        navigation_items.append({
            "label": "Histórico e Logs",
            "icon": "clock-history",
            "badge": None,
            "available": True
        })
    
    # Perfil (sempre disponível se o módulo existir)
    if PERFIL_DISPONIVEL:
        navigation_items.append({
            "label": "Meu Perfil",
            "icon": "person-circle",
            "badge": None,
            "available": True
        })
    
    # Admin
    if is_admin():
        navigation_items.append({
            "label": "Super Admin",
            "icon": "person-badge",
            "badge": None,
            "available": True
        })
    
    return navigation_items

def show_sidebar_alerts():
    """
    Mostra alertas resumidos na sidebar.
    """
    alerts = get_equipment_alerts()
    
    # Conta total de alertas
    total_alerts = sum(count for count in alerts.values() if count > 0)
    
    if total_alerts > 0:
        st.markdown("### 🚨 Alertas Ativos")
        
        # Mostra até 3 alertas mais críticos
        alert_items = []
        for equipment, count in alerts.items():
            if count > 0:
                friendly_names = {
                    'extintores': 'Extintores vencidos',
                    'mangueiras': 'Mangueiras vencidas', 
                    'abrigos': 'Abrigos pendentes',
                    'scba': 'SCBAs vencidos'
                }
                
                alert_items.append({
                    'name': friendly_names.get(equipment, equipment),
                    'count': count,
                    'severity': 'critical' if count >= 5 else 'warning'
                })
        
        # Ordena por severidade e quantidade
        alert_items.sort(key=lambda x: (x['severity'] == 'critical', x['count']), reverse=True)
        
        # Mostra os 3 principais alertas
        for alert in alert_items[:3]:
            if alert['severity'] == 'critical':
                st.error(f"🔴 {alert['count']} {alert['name']}")
            else:
                st.warning(f"🟡 {alert['count']} {alert['name']}")
        
        if len(alert_items) > 3:
            st.info(f"➕ Mais {len(alert_items) - 3} tipos de alertas...")
    else:
        st.success("✅ Nenhum alerta ativo!")

def setup_enhanced_sidebar():
    """
    Configura sidebar aprimorada com navegação inteligente.
    """
    with st.sidebar:
        # Header personalizado do usuário
        user_info = get_user_info()
        user_name = get_user_display_name()
        
        if user_info:
            # Card do usuário com design moderno
            st.markdown(f"""
            <div style="
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 20px;
                border-radius: 15px;
                color: white;
                margin-bottom: 25px;
                text-align: center;
                box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
                backdrop-filter: blur(4px);
                border: 1px solid rgba(255, 255, 255, 0.18);
            ">
                <div style="font-size: 2.5em; margin-bottom: 10px;">👋</div>
                <h3 style="margin: 0; font-weight: 600;">Olá, {user_name.split()[0] if user_name else 'Usuário'}!</h3>
                <p style="margin: 8px 0 0 0; opacity: 0.9; font-size: 0.9em;">Bem-vindo de volta</p>
            </div>
            """, unsafe_allow_html=True)
        
        # Status da conta com indicadores visuais
        status = get_effective_user_status()
        plan = get_effective_user_plan()
        
        # Cards de status
        status_colors = {
            "ativo": {"color": "#28a745", "icon": "🟢", "text": "Ativo"},
            "trial_expirado": {"color": "#dc3545", "icon": "🔴", "text": "Trial Expirado"},
            "inativo": {"color": "#ffc107", "icon": "🟡", "text": "Inativo"}
        }
        
        plan_colors = {
            "basico": {"color": "#6c757d", "icon": "🥉", "text": "Básico"},
            "pro": {"color": "#007bff", "icon": "🥈", "text": "Pro"},
            "premium_ia": {"color": "#fd7e14", "icon": "🥇", "text": "Premium IA"}
        }
        
        status_info = status_colors.get(status, {"color": "#6c757d", "icon": "⚪", "text": status.title()})
        plan_info = plan_colors.get(plan, {"color": "#6c757d", "icon": "💎", "text": plan.title()})
        
        # Cards de status lado a lado
        col1, col2 = st.columns(2)
        
        with col1:
            st.markdown(f"""
            <div style="
                background: {status_info['color']}15;
                border: 2px solid {status_info['color']};
                border-radius: 10px;
                padding: 10px;
                text-align: center;
                margin-bottom: 15px;
            ">
                <div style="font-size: 1.2em;">{status_info['icon']}</div>
                <div style="font-size: 0.8em; font-weight: 600; color: {status_info['color']};">
                    {status_info['text']}
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        with col2:
            st.markdown(f"""
            <div style="
                background: {plan_info['color']}15;
                border: 2px solid {plan_info['color']};
                border-radius: 10px;
                padding: 10px;
                text-align: center;
                margin-bottom: 15px;
            ">
                <div style="font-size: 1.2em;">{plan_info['icon']}</div>
                <div style="font-size: 0.8em; font-weight: 600; color: {plan_info['color']};">
                    {plan_info['text']}
                </div>
            </div>
            """, unsafe_allow_html=True)
        
        st.markdown("---")
        
        # Menu de navegação com badges
        navigation_items = get_navigation_with_badges()
        available_items = [item for item in navigation_items if item['available']]
        
        # Prepara labels com badges
        menu_labels = []
        for item in available_items:
            label = item['label']
            if item['badge'] and item['badge'] > 0:
                if item['badge'] > 99:
                    badge = "99+"
                else:
                    badge = str(item['badge'])
                label += f" 🔴{badge}"
            menu_labels.append(label)
        
        # Menu de navegação principal
        selected_page = option_menu(
            menu_title="🧭 Navegação",
            options=menu_labels,
            icons=[item['icon'] for item in available_items],
            menu_icon="compass-fill",
            default_index=0,
            styles={
                "container": {
                    "padding": "0!important", 
                    "background-color": "transparent"
                },
                "icon": {
                    "color": "inherit", 
                    "font-size": "18px"
                },
                "nav-link": {
                    "font-size": "14px",
                    "text-align": "left",
                    "margin": "4px 0",
                    "padding": "12px 16px",
                    "--hover-color": "rgba(102, 126, 234, 0.1)",
                    "border-radius": "12px",
                    "transition": "all 0.3s ease",
                    "border": "1px solid transparent"
                },
                "nav-link-selected": {
                    "background": "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    "color": "white",
                    "transform": "translateX(5px)",
                    "box-shadow": "0 4px 15px rgba(102, 126, 234, 0.4)",
                    "border": "1px solid rgba(255, 255, 255, 0.2)"
                },
            }
        )
        
        # Remove badges do nome da página selecionada para comparação
        clean_selected_page = selected_page.split(" 🔴")[0] if " 🔴" in selected_page else selected_page
        
        st.markdown("---")
        
        # Alertas na sidebar
        show_sidebar_alerts()
        
        st.markdown("---")
        
        # Botão de logout estilizado
        logout_html = """
        <style>
        .logout-button {
            display: block;
            width: 100%;
            padding: 12px 20px;
            background: linear-gradient(135deg, #ff6b6b 0%, #ee5a6f 100%);
            color: white;
            text-decoration: none;
            border-radius: 10px;
            text-align: center;
            font-weight: 600;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            margin-top: 10px;
        }
        
        .logout-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(255, 107, 107, 0.4);
            text-decoration: none;
            color: white;
        }
        </style>
        """
        st.markdown(logout_html, unsafe_allow_html=True)
        
        # Botão de logout
        if st.button("🚪 Sair do Sistema", key="logout_button", use_container_width=True):
            # Limpa o cache
            st.cache_data.clear()
            
            # Limpa sessões
            for key in list(st.session_state.keys()):
                del st.session_state[key]
            
            # Logout
            try:
                st.logout()
            except:
                st.rerun()
    
    return clean_selected_page

def main():
    """Função principal do aplicativo com navegação aprimorada"""
    try:
        # Verifica se o usuário está logado
        if not is_user_logged_in():
            show_login_page()
            st.stop()

        # Log de login (apenas uma vez por sessão)
        if 'user_logged_in' not in st.session_state:
            user_email = get_user_email()
            log_action("LOGIN_SUCCESS", f"Email: {user_email}")
            
            if is_superuser():
                log_action("SUPERUSER_LOGIN_SUCCESS", f"Email: {user_email}")
            
            st.session_state['user_logged_in'] = True

        # Carrega dados do usuário
        try:
            users_df = get_users_data()
            user_email = get_user_email()
        except Exception as e:
            st.error(f"Erro ao carregar dados do usuário: {e}")
            show_logout_button()
            st.stop()

        # Verifica autorização do usuário
        is_authorized = False
        if user_email is not None:
            # Superuser sempre tem acesso
            if is_superuser():
                is_authorized = True
            # Usuário comum deve estar na lista de usuários autorizados
            elif not users_df.empty and user_email in users_df['email'].values:
                is_authorized = True

        if not is_authorized:
            log_action("ACCESS_DENIED_UNAUTHORIZED", f"Tentativa de acesso pelo email: {user_email}")
            show_user_header()
            demo_page.show_page()
            st.stop()

        # Verifica status do usuário
        effective_status = get_effective_user_status()

        # Usuário com trial expirado
        if effective_status == 'trial_expirado':
            log_action("ACCESS_DENIED_TRIAL_EXPIRED", f"Usuário: {user_email}")
            show_user_header()
            trial_expired_page.show_page()
            st.stop()

        # Usuário inativo (exceto admins)
        if effective_status == 'inativo' and not is_admin():
            log_action("ACCESS_DENIED_INACTIVE_ACCOUNT", f"Usuário: {user_email}")
            show_user_header()
            st.warning("🔒 Sua conta está atualmente inativa. Por favor, entre em contato com o suporte para reativá-la.")
            show_logout_button()
            st.stop()
        
        # Mostra cabeçalho do usuário
        show_user_header()
        
        # Configura sidebar aprimorada e obtém página selecionada
        selected_page = setup_enhanced_sidebar()
        
        # Verifica se o ambiente foi carregado
        is_user_environment_loaded = setup_sidebar()

        # Lógica de renderização de páginas
        try:
            # Lógica especial para "Meu Perfil" - sempre permite acesso se disponível
            if selected_page == "Meu Perfil" and PERFIL_DISPONIVEL:
                PAGES[selected_page]()
            # Verifica se ambiente está carregado ou se é admin acessando Super Admin
            elif is_user_environment_loaded or (is_admin() and selected_page == "Super Admin"):
                if selected_page in PAGES:
                    PAGES[selected_page]()
                else:
                    # Fallback para Dashboard
                    st.error(f"Página '{selected_page}' não encontrada. Redirecionando para Dashboard...")
                    PAGES["Dashboard"]()
            else:
                # Mensagens para ambiente não carregado
                if is_admin(): 
                    st.info("👈 Como Administrador, seu ambiente de dados não é carregado. Para gerenciar o sistema, acesse o painel de Super Admin.")
                else: 
                    st.warning("👈 Seu ambiente de dados não pôde ser carregado. Verifique o status da sua conta ou contate o administrador.")
                    
        except Exception as e:
            st.error(f"Erro ao carregar a página '{selected_page}': {e}")
            st.error("Tente recarregar a página ou entre em contato com o suporte.")
            
            # Fallback para Dashboard em caso de erro
            try:
                PAGES["Dashboard"]()
            except:
                st.error("Erro crítico. Por favor, faça logout e tente novamente.")
            
    except Exception as e:
        st.error(f"Erro crítico na aplicação: {e}")
        st.error("Entre em contato com o suporte técnico.")
        st.stop()

if __name__ == "__main__":
    main()
