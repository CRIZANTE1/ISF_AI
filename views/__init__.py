
from . import (
    administracao,
    dashboard,
    inspecao_extintores,
    inspecao_mangueiras,
    inspecao_scba,
    inspecao_chuveiros,
    inspecao_camaras_espuma,
    historico,
    utilitarios,
    resumo_gerencial,
    inspecao_multigas,
    inspecao_alarmes,
    demo_page,
    trial_expired_page
)

# Módulo opcional - perfil do usuário
try:
    from . import perfil_usuario
    _PERFIL_DISPONIVEL = True
except ImportError:
    _PERFIL_DISPONIVEL = False

# Lista de módulos sempre disponíveis
__all__ = [
    "administracao",
    "dashboard",
    "inspecao_extintores",
    "inspecao_mangueiras",
    "inspecao_scba",
    "inspecao_chuveiros",
    "inspecao_camaras_espuma",
    "historico",
    "utilitarios",
    "resumo_gerencial",
    "inspecao_multigas",
    "inspecao_alarmes",
    "demo_page",
    "trial_expired_page"
]

# Adiciona perfil_usuario à lista se disponível
if _PERFIL_DISPONIVEL:
    __all__.append("perfil_usuario")

# Função utilitária para verificar se o perfil está disponível
def is_perfil_available():
    return _PERFIL_DISPONIVEL



