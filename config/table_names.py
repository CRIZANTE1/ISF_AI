# config/table_names.py
"""
Nomes das tabelas do Supabase utilizadas no sistema.
Centraliza a nomenclatura para facilitar manutenção.
"""

# Tabelas de Equipamentos
EXTINGUISHER_SHEET_NAME = "extintores"
HOSE_SHEET_NAME = "mangueiras"
SHELTER_SHEET_NAME = "abrigos"
SCBA_SHEET_NAME = "conjuntos_autonomos"
EYEWASH_INVENTORY_SHEET_NAME = "inventario_chuveiros_lava_olhos"
FOAM_CHAMBER_INVENTORY_SHEET_NAME = "inventario_camaras_espuma"
MULTIGAS_INVENTORY_SHEET_NAME = "inventario_multigas"
ALARM_INVENTORY_SHEET_NAME = "inventario_alarmes"
CANHAO_MONITOR_INVENTORY_SHEET_NAME = "inventario_canhoes_monitores"

# Tabelas de Inspeções
INSPECTIONS_SHELTER_SHEET_NAME = "inspecoes_abrigos"
SCBA_VISUAL_INSPECTIONS_SHEET_NAME = "inspecoes_scba"
EYEWASH_INSPECTIONS_SHEET_NAME = "inspecoes_chuveiros_lava_olhos"
FOAM_CHAMBER_INSPECTIONS_SHEET_NAME = "inspecoes_camaras_espuma"
MULTIGAS_INSPECTIONS_SHEET_NAME = "inspecoes_multigas"
ALARM_INSPECTIONS_SHEET_NAME = "inspecoes_alarmes"
CANHAO_MONITOR_INSPECTIONS_SHEET_NAME = "inspecoes_canhoes_monitores"

# Tabelas de Logs e Ações
LOG_ACTIONS = "log_acoes_extintores"
LOG_SHELTER_SHEET_NAME = "log_acoes_abrigos"
LOG_SCBA_SHEET_NAME = "log_acoes_scba"
LOG_EYEWASH_SHEET_NAME = "log_acoes_chuveiros_lava_olhos"
LOG_FOAM_CHAMBER_SHEET_NAME = "log_acoes_camaras_espuma"
LOG_MULTIGAS_SHEET_NAME = "log_acoes_multigas"
LOG_ALARM_SHEET_NAME = "log_acoes_alarmes"
LOG_CANHAO_MONITOR_SHEET_NAME = "log_acoes_canhoes_monitores"

# Tabelas Auxiliares
LOCATIONS_SHEET_NAME = "locais"
HOSE_DISPOSAL_LOG_SHEET_NAME = "baixas_mangueiras"
USERS_SHEET_NAME = "usuarios"

# Tabelas de Sistema
LOG_AUDITORIA_SHEET_NAME = "log_auditoria"
SOLICITACOES_ACESSO_SHEET_NAME = "solicitacoes_acesso"
SOLICITACOES_SUPORTE_SHEET_NAME = "solicitacoes_suporte"

# Storage
BUCKET_NAME = "evidencias"