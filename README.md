# ISF IA - Sistema Integrado de Segurança contra Incêndio com IA
### Plataforma Completa para Gestão de Equipamentos de Combate a Incêndio

![Status](https://img.shields.io/badge/Status-Ativo-brightgreen)
![Versão](https://img.shields.io/badge/Versão-3.2-blue)
![Python](https://img.shields.io/badge/Python-3.12+-blue)
![Streamlit](https://img.shields.io/badge/Streamlit-1.28+-red)

Este é um sistema web desenvolvido com Streamlit para revolucionar o processo de gestão, inspeção e manutenção de equipamentos de combate a incêndio. A plataforma utiliza Inteligência Artificial (Google Gemini) para automatizar processos, centraliza dados em Google Sheets e oferece dashboards interativos para gestão visual e proativa da segurança contra incêndio.

## 🌟 Funcionalidades Principais

### 🔐 **Sistema de Autenticação Seguro**
- Login nativo via Google (OIDC) integrado ao Streamlit
- Gestão de permissões por níveis: Admin, Editor, Viewer
- Sistema de trial de 14 dias para novos usuários
- Ambientes isolados por usuário/organização

### 🤖 **Inteligência Artificial Integrada**
- **Extração Automática de PDFs**: IA analisa relatórios e extrai dados automaticamente
- **Processamento em Lote**: Upload de um PDF processa múltiplos equipamentos
- **Análise Inteligente**: Validação e cruzamento de dados históricos
- **Suporte a Múltiplos Formatos**: Relatórios de manutenção, certificados, laudos

### 📱 **Inspeção Digital Avançada**
- **QR Code Scanner**: Escaneia equipamentos via câmera do celular
- **Geolocalização GPS**: Captura automática de coordenadas
- **Registro Fotográfico**: Upload de fotos de não conformidades
- **Inspeções Offline**: Funciona sem conexão constante

### 🎯 **Gestão Completa de Equipamentos**

#### 🔥 **Extintores de Incêndio**
- Registro por IA ou manual de inspeções e manutenções
- Cálculo automático de vencimentos (N1, N2, N3)
- QR Code para inspeções rápidas
- Controle de substituições e baixas

#### 💧 **Mangueiras de Incêndio**
- Processamento de certificados de teste hidrostático
- Registro de aprovações/reprovações/condenações
- Controle de baixas e substituições
- Rastreamento de ciclo de vida

#### 🧯 **Abrigos de Emergência**
- Inventário automático via IA ou manual
- Checklists de inspeção personalizados
- Controle de itens faltantes/avariados
- Histórico de manutenções

#### 💨 **Conjuntos Autônomos (SCBA)**
- Processamento de relatórios Posi3 USB
- Inspeções visuais periódicas
- Controle de validade de testes
- Gestão de qualidade do ar comprimido

#### 🚿 **Chuveiros e Lava-Olhos**
- Checklists técnicos detalhados
- Inspeções mensais obrigatórias
- Controle de pressão e vazão
- Gestão de não conformidades

#### ☁️ **Câmaras de Espuma**
- Suporte a múltiplos modelos (MCS, TF, MLS)
- Inspeções visuais e funcionais
- Checklists específicos por tipo
- Controle de vencimentos

#### 💨 **Detectores Multigás**
- Registro de calibrações anuais
- Controle de bump tests
- Gestão de cilindros de referência
- Relatórios de conformidade

### 📊 **Dashboards e Relatórios**
- **Dashboard Executivo**: Visão geral do status de todos os equipamentos
- **Mapas Interativos**: Localização GPS de equipamentos
- **Relatórios Mensais**: Geração automática para impressão
- **Indicadores KPI**: Métricas de conformidade e pendências
- **Histórico Completo**: Rastreabilidade de todas as ações

### ⚡ **Automações Inteligentes**
- **Cálculo de Vencimentos**: Automático baseado em tipos de serviço
- **Planos de Ação**: Sugestões automáticas para não conformidades
- **Regularizações em Massa**: Correção de inspeções vencidas
- **Boletins de Remessa**: Geração automática para manutenções

## 🏗️ Arquitetura Tecnológica

### **Frontend & Interface**
- **Framework**: Streamlit 1.28+
- **UI Components**: Streamlit-option-menu, Custom CSS
- **Interatividade**: JavaScript integration, Camera input, GPS
- **Design**: Responsive design, Print-friendly layouts

### **Backend & Processamento**
- **Linguagem**: Python 3.12+
- **IA**: Google Generative AI (Gemini 2.5 Flash)
- **Processamento**: Pandas, NumPy para análise de dados
- **Validação**: Custom validation rules, Data integrity checks

### **Banco de Dados & Armazenamento**
- **Principal**: Google Sheets (API v4)
- **Arquivos**: Google Drive (API v3)
- **Backup**: Automatic cloud backup
- **Estrutura**: Normalized data structure, YAML configurations

### **Autenticação & Segurança**
- **Auth Provider**: Google OIDC
- **Permissions**: Role-based access control (RBAC)
- **Data Isolation**: Multi-tenant architecture
- **Audit**: Complete action logging

### **Integrações**
- **Computer Vision**: OpenCV para QR Code
- **Geolocalização**: Browser Geolocation API
- **PDF Processing**: PyPDF2, AI-powered extraction
- **Image Processing**: Pillow, automatic optimization

## 📦 Estrutura do Projeto

```
ISF_IA/
├── 📁 AI/                          # Módulos de Inteligência Artificial
│   ├── api_Operation.py            # Operações com Gemini AI
│   ├── api_load.py                 # Carregamento de credenciais IA
│   └── __init__.py
├── 📁 auth/                        # Sistema de Autenticação
│   ├── auth_utils.py               # Utilities de autenticação
│   ├── login_page.py               # Interface de login
│   └── __init__.py
├── 📁 config/                      # Configurações do Sistema
│   ├── page_config.py              # Configuração de páginas
│   └── sheets_config.yaml          # Estrutura das planilhas
├── 📁 gdrive/                      # Integração Google Drive/Sheets
│   ├── config.py                   # Configurações das APIs
│   └── gdrive_upload.py            # Upload e manipulação
├── 📁 operations/                  # Lógica de Negócio
│   ├── corrective_actions.py       # Ações corretivas
│   ├── extinguisher_operations.py  # Operações de extintores
│   ├── hose_operations.py          # Operações de mangueiras
│   ├── scba_operations.py          # Operações de SCBAs
│   ├── eyewash_operations.py       # Operações de chuveiros
│   ├── foam_chamber_operations.py  # Operações de câmaras
│   ├── multigas_operations.py      # Operações de multigás
│   ├── shelter_operations.py       # Operações de abrigos
│   ├── photo_operations.py         # Manipulação de fotos
│   ├── qr_inspection_utils.py      # Utilities de QR Code
│   └── history.py                  # Histórico e consultas
├── 📁 reports/                     # Sistema de Relatórios
│   ├── monthly_report_ui.py        # Interface de relatórios mensais
│   ├── multigas_report.py          # Relatórios de multigás
│   ├── reports_pdf.py              # Geração de PDFs
│   └── shipment_report.py          # Boletins de remessa
├── 📁 utils/                       # Utilitários
│   ├── auditoria.py                # Sistema de auditoria
│   └── prompts.py                  # Prompts para IA
├── 📁 views/                       # Interfaces do Usuário
│   ├── dashboard.py                # Dashboard principal
│   ├── resumo_gerencial.py         # Visão gerencial
│   ├── inspecao_extintores.py      # Interface de extintores
│   ├── inspecao_mangueiras.py      # Interface de mangueiras
│   ├── inspecao_scba.py            # Interface de SCBAs
│   ├── inspecao_chuveiros.py       # Interface de chuveiros
│   ├── inspecao_camaras_espuma.py  # Interface de câmaras
│   ├── inspecao_multigas.py        # Interface de multigás
│   ├── historico.py                # Histórico e logs
│   ├── utilitarios.py              # Ferramentas auxiliares
│   ├── administracao.py            # Painel de admin
│   ├── demo_page.py                # Página de demonstração
│   └── trial_expired_page.py       # Página de trial expirado
├── 📁 style/                       # Estilos e CSS
│   └── style.css                   # CSS customizado
├── 📄 Pagina Inicial.py            # Página principal
├── 📄 requirements.txt             # Dependências Python
├── 📄 packages.txt                 # Dependências do sistema
└── 📄 README.md                    # Este arquivo
```

## 🚀 Guia de Instalação

### **Pré-requisitos**
- Python 3.12 ou superior
- Conta Google (para APIs)
- Streamlit Cloud ou servidor web

### **1. Clone o Repositório**
```bash
git clone https://github.com/seu-usuario/isf_ia.git
cd isf_ia
```

### **2. Instale as Dependências**
```bash
pip install -r requirements.txt
```

### **3. Configure as APIs do Google**

#### **Google Sheets & Drive API**
1. Acesse o [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto ou selecione um existente
3. Ative as APIs: Google Sheets API, Google Drive API
4. Crie credenciais de conta de serviço
5. Baixe o arquivo JSON das credenciais

#### **Google Gemini AI**
1. Acesse [Google AI Studio](https://aistudio.google.com/)
2. Gere uma API Key
3. Configure as permissões necessárias

### **4. Configure o arquivo secrets.toml**
```toml
[connections.gsheets]
# Cole aqui o conteúdo do arquivo JSON das credenciais do Google

[google_drive]
matrix_sheets_id = "ID_da_planilha_matriz"
central_drive_folder_id = "ID_da_pasta_central"

[general]
GOOGLE_API_KEY = "sua_api_key_do_gemini"

[superuser]
admin_email = "seu_email_admin@gmail.com"
spreadsheet_id = "ID_planilha_teste"
folder_id = "ID_pasta_teste"
```

### **5. Execute a Aplicação**
```bash
streamlit run "Pagina Inicial.py"
```

## 🎯 Planos e Funcionalidades

### 📊 **Plano Básico**
- ✅ Resumo gerencial
- ✅ Visualização de dados
- ✅ Exportação de relatórios
- ❌ Edição de registros
- ❌ IA para processamento

### 🔧 **Plano Pro**
- ✅ Todas as funcionalidades do Básico
- ✅ Registro e edição completa
- ✅ Inspeções manuais
- ✅ Dashboards interativos
- ✅ QR Code scanning
- ❌ IA para processamento

### 🤖 **Plano Premium IA**
- ✅ Todas as funcionalidades do Pro
- ✅ **Processamento com IA**
- ✅ **Extração automática de PDFs**
- ✅ **Análise inteligente de documentos**
- ✅ **Automações avançadas**
- ✅ **Suporte prioritário**

## 📋 Guia de Uso

### **Para Administradores**
1. **Configuração Inicial**: Configure usuários e permissões no painel admin
2. **Estrutura de Dados**: Defina a estrutura organizacional
3. **Integração**: Configure integrações com sistemas existentes

### **Para Editores**
1. **Cadastro de Equipamentos**: Use formulários manuais ou IA
2. **Inspeções**: Realize via QR Code ou interface web
3. **Manutenções**: Registre serviços e atualize vencimentos

### **Para Visualizadores**
1. **Dashboards**: Acompanhe status em tempo real
2. **Relatórios**: Gere relatórios mensais e anuais
3. **Alertas**: Monitore vencimentos e não conformidades

## 🔒 Segurança e Compliance

### **Proteção de Dados**
- Criptografia em trânsito (HTTPS)
- Autenticação robusta (Google OIDC)
- Isolamento de dados por usuário
- Backup automático em nuvem

### **Auditoria**
- Log completo de todas as ações
- Rastreabilidade de alterações
- Timestamps de São Paulo
- Identificação de usuário

### **Compliance**
- Atende normas NBR e NR
- Histórico imutável
- Relatórios oficiais
- Certificados digitais

## 🛠️ API e Integrações

### **APIs Integradas**
- **Google Sheets API v4**: Banco de dados principal
- **Google Drive API v3**: Armazenamento de arquivos
- **Google Generative AI**: Processamento com IA
- **Browser APIs**: Geolocalização, câmera, QR Code

### **Webhooks e Eventos**
- Notificações de vencimentos
- Alertas de não conformidades
- Relatórios automáticos
- Integrações personalizadas

## 📊 Métricas e Monitoramento

### **KPIs Principais**
- Taxa de conformidade geral
- Equipamentos vencidos
- Ações corretivas pendentes
- Eficiência das inspeções

### **Relatórios Disponíveis**
- Relatório mensal de inspeções
- Boletins de remessa
- Status de abrigos
- Registros de bump test
- Laudos de qualidade do ar

## 🤝 Contribuição

### **Como Contribuir**
1. Fork o repositório
2. Crie uma branch para sua feature
3. Implemente suas alterações
4. Execute os testes
5. Submeta um Pull Request

### **Padrões de Código**
- Siga PEP 8 para Python
- Use type hints quando possível
- Documente funções complexas
- Teste todas as funcionalidades

## 📞 Suporte e Contato

### **Canais de Suporte**
- 📧 **Email**: cristian.ferreira.carlos@gmail.com
- 💼 **LinkedIn**: [Cristian Ferreira Carlos](https://www.linkedin.com/in/cristian-ferreira-carlos-256b19161/)
- 📚 **Documentação**: [Wiki do Projeto](https://github.com/seu-usuario/isf_ia/wiki)

### **Suporte por Plano**
- **Básico**: Documentação e FAQ
- **Pro**: Email support (48h)
- **Premium IA**: Suporte prioritário (24h)

## 📈 Roadmap

### **v3.3 - Próxima Versão**
- [ ] Integração com sistemas ERP
- [ ] App móvel nativo
- [ ] IA para predição de falhas
- [ ] Dashboard de IoT

### **v4.0 - Futuro**
- [ ] Marketplace de integrações
- [ ] API pública
- [ ] Machine Learning avançado
- [ ] Realidade aumentada

## 📄 Licença

```
Copyright 2024, Cristian Ferreira Carlos

Todos os direitos reservados.

Este é um software proprietário. O uso, redistribuição, cópia ou 
modificação deste código é estritamente proibido sem a permissão 
expressa por escrito do autor.

Para licenciamento comercial, entre em contato:
cristian.ferreira.carlos@gmail.com
```

---

## 🏆 Reconhecimentos

Desenvolvido por **Cristian Ferreira Carlos** com foco na inovação e segurança.

**Tecnologias utilizadas**: Streamlit, Google Cloud, Python, IA Generativa.

**Agradecimentos especiais** à comunidade open source e aos early adopters que ajudaram no desenvolvimento e testes da plataforma.

---

*Este README foi gerado automaticamente e está sempre atualizado com as últimas funcionalidades do sistema.*
