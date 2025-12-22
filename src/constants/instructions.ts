// Instruções simplificadas - apenas o essencial do app

export interface InstructionSection {
  title: string;
  content: string;
  expanded?: boolean;
}

export interface EquipmentInstructions {
  header: {
    title: string;
    subtitle?: string;
  };
  alert?: {
    type: 'info' | 'success' | 'warning';
    message: string;
  };
  methods?: {
    title: string;
    items: Array<{
      name: string;
      description: string;
      time: string;
      idealFor: string[];
      howItWorks: string[];
      advantages?: string[];
      requires?: string;
    }>;
  };
  workflow?: {
    title: string;
    steps: string[];
  };
  guide?: InstructionSection[];
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  footer?: string;
}

export const instructions: Record<string, EquipmentInstructions> = {
  // Extintores
  extintor: {
    header: {
      title: 'Guia - Inspeção de Extintores',
    },
    guide: [
      {
        title: 'Como registrar uma inspeção',
        content: `
1. Vá em **"Inspeções"** → **"Extintores"**
2. Toque no extintor desejado
3. Toque em **"Registrar Nova Inspeção"**
4. Preencha:
   - **Data da Inspeção** (obrigatório)
   - **Tipo de Serviço:** Inspeção, Manutenção N2, Manutenção N3 ou Substituição
   - **Aprovado na Inspeção?:** Sim ou Não
   - **Observações Gerais** (opcional)
5. Se reprovado, anexe foto (obrigatório)
6. Toque em **"Salvar Inspeção"**
        `,
        expanded: true,
      },
      {
        title: 'Como cadastrar novo extintor',
        content: `
1. Vá em **"Inspeções"** → **"Extintores"**
2. Toque no botão **"+"** no canto inferior direito
3. Preencha os dados do equipamento
4. Toque em **"Salvar"**
        `,
      },
    ],
    faq: [
      {
        question: 'Com que frequência inspecionar?',
        answer: 'Mensalmente (inspeção visual) e anualmente (manutenção N2).',
      },
      {
        question: 'Quando anexar foto?',
        answer: 'Sempre que o extintor for reprovado na inspeção (obrigatório).',
      },
    ],
  },

  // Mangueiras
  mangueira: {
    header: {
      title: 'Guia - Mangueiras',
    },
    guide: [
      {
        title: 'Como cadastrar mangueira',
        content: `
1. Vá em **"Inspeções"** → **"Mangueiras"**
2. Toque no botão **"+"** 
3. Preencha: ID, diâmetro, tipo, comprimento, ano de fabricação
4. Toque em **"Salvar"**
        `,
        expanded: true,
      },
    ],
    faq: [
      {
        question: 'Frequência de teste?',
        answer: 'Teste hidrostático anual obrigatório conforme NBR 12779.',
      },
    ],
  },

  // Câmaras de Espuma
  camara_espuma: {
    header: {
      title: 'Guia - Câmaras de Espuma',
    },
    guide: [
      {
        title: 'Como registrar inspeção',
        content: `
1. Vá em **"Inspeções"** → **"Câmaras de Espuma"**
2. Toque na câmara desejada
3. Toque em **"Registrar Nova Inspeção"**
4. Preencha a data
5. Escolha tipo: **Visual Semestral** ou **Funcional Anual**
6. Responda ao checklist completo
7. Se houver não conformidade ou teste funcional, anexe foto
8. Toque em **"Salvar Inspeção"**
        `,
        expanded: true,
      },
    ],
    faq: [
      {
        question: 'Frequência de inspeção?',
        answer: 'Visual semestral (6 meses) e funcional anual obrigatórias.',
      },
    ],
  },

  // Canhões Monitores
  canhao_monitor: {
    header: {
      title: 'Guia - Canhões Monitores',
    },
    guide: [
      {
        title: 'Como registrar inspeção',
        content: `
1. Vá em **"Inspeções"** → **"Canhões Monitores"**
2. Toque no canhão desejado
3. Toque em **"Registrar Nova Inspeção"**
4. Preencha a data
5. Escolha tipo: **Visual** ou **Funcional**
6. Responda ao checklist completo
7. Se houver não conformidade, anexe foto
8. Toque em **"Salvar Inspeção"**
        `,
        expanded: true,
      },
    ],
  },

  // Chuveiros/Lava-olhos
  chuveiro_lavaolhos: {
    header: {
      title: 'Guia - Chuveiros e Lava-Olhos',
    },
    guide: [
      {
        title: 'Como registrar inspeção',
        content: `
1. Vá em **"Inspeções"** → **"Chuveiros/Lava-olhos"**
2. Toque no equipamento desejado
3. Toque em **"Registrar Nova Inspeção"**
4. Preencha a data
5. Responda ao checklist completo
6. Se houver não conformidade, anexe foto (obrigatório)
7. Toque em **"Salvar Inspeção"**
        `,
        expanded: true,
      },
    ],
    faq: [
      {
        question: 'Frequência de inspeção?',
        answer: 'Inspeção mensal obrigatória conforme NR 20.',
      },
    ],
  },

  // Sistemas de Alarme
  alarme: {
    header: {
      title: 'Guia - Sistemas de Alarme',
    },
    guide: [
      {
        title: 'Como registrar inspeção',
        content: `
1. Vá em **"Inspeções"** → **"Sistemas de Alarme"**
2. Toque no sistema desejado
3. Toque em **"Registrar Nova Inspeção"**
4. Preencha a data
5. Responda ao checklist completo
6. Se houver não conformidade, anexe foto
7. Toque em **"Salvar Inspeção"**
        `,
        expanded: true,
      },
    ],
  },

  // Multigás
  multigas: {
    header: {
      title: 'Guia - Detectores Multigás',
    },
    guide: [
      {
        title: 'Como registrar teste',
        content: `
1. Vá em **"Inspeções"** → **"Medidores Multigás"**
2. Toque no detector desejado
3. Toque em **"Registrar Nova Inspeção"**
4. Preencha a data e hora do teste
5. Escolha tipo: **Periódico** ou **Extraordinário**
6. Preencha valores de referência do cilindro (LEL, O², H²S, CO)
7. Preencha valores encontrados no teste
8. Marque se deseja atualizar valores permanentemente
9. Adicione observações (opcional)
10. Toque em **"Salvar Inspeção"**
        `,
        expanded: true,
      },
    ],
    faq: [
      {
        question: 'Frequência de teste?',
        answer: 'Bump test diário/semanal antes do uso em ambientes críticos.',
      },
    ],
  },

  // SCBA
  scba: {
    header: {
      title: 'Guia - Conjuntos Autônomos (SCBA)',
    },
    guide: [
      {
        title: 'Como registrar inspeção',
        content: `
1. Vá em **"Inspeções"** → **"Conjuntos Autônomos (SCBA)"**
2. Toque no SCBA desejado
3. Toque em **"Registrar Nova Inspeção"**
4. Preencha a data
5. Responda ao checklist completo (inclui testes funcionais)
6. Adicione observações se necessário
7. Toque em **"Salvar Inspeção"**
        `,
        expanded: true,
      },
    ],
    faq: [
      {
        question: 'Frequência de inspeção?',
        answer: 'Inspeção visual mensal obrigatória e antes de cada uso.',
      },
    ],
  },

  // Abrigos
  abrigo: {
    header: {
      title: 'Guia - Abrigos de Emergência',
    },
    guide: [
      {
        title: 'Como registrar inspeção',
        content: `
1. Vá em **"Inspeções"** → **"Abrigos de Emergência"**
2. Toque no abrigo desejado
3. Toque em **"Registrar Nova Inspeção"**
4. Preencha a data
5. Marque status: **Aprovado** ou **Reprovado**
6. Adicione observações (opcional)
7. Se reprovado, anexe foto
8. Toque em **"Salvar Inspeção"**
        `,
        expanded: true,
      },
    ],
    faq: [
      {
        question: 'Frequência de inspeção?',
        answer: 'Inspeção mensal obrigatória conforme NBR 13714.',
      },
    ],
  },

  // Inspeção Customizada
  custom: {
    header: {
      title: 'Guia - Inspeção Personalizada',
    },
    guide: [
      {
        title: 'Como registrar inspeção',
        content: `
1. Vá em **"Inspeções"** → Selecione o tipo de equipamento
2. Toque no equipamento desejado
3. Toque em **"Registrar Nova Inspeção"**
4. Responda ao checklist personalizado
5. Se houver não conformidade, anexe foto
6. Toque em **"Salvar Inspeção"**
        `,
        expanded: true,
      },
    ],
  },

  // --- INSTRUÇÕES DE CADASTRO (ADD) ---

  // Cadastro Extintor
  add_extintor: {
    header: {
      title: 'Guia - Cadastrar Extintor',
    },
    guide: [
      {
        title: 'Como preencher',
        content: `
1. **Nº Identificação:** Opcional. Se deixar vazio, o sistema gera um código único automaticamente.
2. **Especificações:** Selecione o tipo de agente (Água, Pó, CO2) e capacidade.
3. **Localização:** Descreva onde o equipamento está instalado.
        `,
        expanded: true,
      },
    ],
  },

  // Cadastro Mangueira
  add_mangueira: {
    header: {
      title: 'Guia - Cadastrar Mangueira',
    },
    guide: [
      {
        title: 'Como preencher',
        content: `
1. **ID Mangueira:** Opcional. Gerado automaticamente se vazio.
2. **Tipo:** I, II, III, IV ou V.
3. **Comprimento:** Em metros (ex: 15, 20, 30).
4. **Diâmetro:** Em milímetros (ex: 40, 65).
5. **Ano Fabricação:** Ano gravado na mangueira.
        `,
        expanded: true,
      },
    ],
  },

  // Cadastro Câmara de Espuma
  add_camara_espuma: {
    header: {
      title: 'Guia - Cadastrar Câmara de Espuma',
    },
    guide: [
      {
        title: 'Como preencher',
        content: `
1. **ID Câmara:** Opcional. Gerado automaticamente se vazio.
2. **Localização:** Tanque ou área protegida.
3. **Modelo:** Modelo da câmara.
4. **Número MCS:** Se aplicável.
        `,
        expanded: true,
      },
    ],
  },

  // Cadastro Canhão Monitor
  add_canhao_monitor: {
    header: {
      title: 'Guia - Cadastrar Canhão Monitor',
    },
    guide: [
      {
        title: 'Como preencher',
        content: `
1. **ID Equipamento:** Opcional. Gerado automaticamente se vazio.
2. **Localização:** Área de instalação.
3. **Modelo:** Modelo do canhão.
4. **Tipo:** Fixo ou Portátil.
5. **Vazão:** Vazão nominal (ex: 1000 gpm).
        `,
        expanded: true,
      },
    ],
  },

  // Cadastro Chuveiro/Lava-olhos
  add_chuveiro_lavaolhos: {
    header: {
      title: 'Guia - Cadastrar Chuveiro/Lava-olhos',
    },
    guide: [
      {
        title: 'Como preencher',
        content: `
1. **ID Equipamento:** Opcional. Gerado automaticamente se vazio.
2. **Localização:** Próximo a qual risco químico/físico.
3. **Modelo:** Modelo do equipamento.
4. **Tipo:** Chuveiro, Lava-olhos ou Combinado.
        `,
        expanded: true,
      },
    ],
  },

  // Cadastro Alarme
  add_alarme: {
    header: {
      title: 'Guia - Cadastrar Sistema de Alarme',
    },
    guide: [
      {
        title: 'Como preencher',
        content: `
1. **ID Sistema:** Opcional. Gerado automaticamente se vazio.
2. **Localização:** Área de cobertura.
3. **Marca/Modelo:** Fabricante e modelo da central/dispositivo.
4. **Tipo:** Central, Botoeira, Sirene, Detector.
        `,
        expanded: true,
      },
    ],
  },

  // Cadastro Multigás
  add_multigas: {
    header: {
      title: 'Guia - Cadastrar Detector Multigás',
    },
    guide: [
      {
        title: 'Como preencher',
        content: `
1. **ID Equipamento:** Opcional. Gerado automaticamente se vazio.
2. **Marca/Modelo:** Fabricante e modelo.
3. **Nº Série:** Número de série do fabricante.
4. **Data Calibração:** Data da última calibração.
5. **Validade Sensores:** Data de validade dos sensores.
        `,
        expanded: true,
      },
    ],
  },

  // Cadastro SCBA
  add_scba: {
    header: {
      title: 'Guia - Cadastrar SCBA',
    },
    guide: [
      {
        title: 'Como preencher',
        content: `
1. **Nº Série:** Opcional. Gerado automaticamente se vazio.
2. **Fabricante/Modelo:** Marca e modelo do equipamento.
3. **Capacidade:** Volume do cilindro (ex: 6.8L).
4. **Pressão Máxima:** Pressão de trabalho (ex: 300 bar).
        `,
        expanded: true,
      },
    ],
  },

  // Cadastro Abrigo
  add_abrigo: {
    header: {
      title: 'Guia - Cadastrar Abrigo',
    },
    guide: [
      {
        title: 'Como preencher',
        content: `
1. **ID Abrigo:** Opcional. Gerado automaticamente se vazio.
2. **Localização:** Onde o abrigo está instalado.
3. **Tipo:** Hidrante ou Extintor.
4. **Itens:** Liste os itens contidos (mangueiras, esguichos, chaves).
        `,
        expanded: true,
      },
    ],
  },

  // Cadastro Customizado
  add_custom: {
    header: {
      title: 'Guia - Cadastrar Equipamento Personalizado',
    },
    guide: [
      {
        title: 'Como preencher',
        content: `
1. **ID:** Opcional. Gerado automaticamente se vazio.
2. **Campos Personalizados:** Preencha os campos específicos definidos para este tipo de equipamento.
3. **Localização:** Se solicitado, informe a localização.
        `,
        expanded: true,
      },
    ],
  },

  // Gerenciamento de Tipos Customizados
  custom_type: {
    header: {
      title: 'Guia - Criar Tipo de Equipamento',
    },
    guide: [
      {
        title: 'Como configurar',
        content: `
1. **Nome do Tipo:** Nome que aparecerá nos menus (ex: Bomba, Gerador).
2. **Slug:** Identificador único gerado a partir do nome.
3. **Campo ID:** Defina como o ID do equipamento será chamado (ex: TAG, Patrimônio).
4. **Localização/GPS:** Marque se deseja rastrear o local ou coordenadas.
        `,
        expanded: true,
      },
    ],
  },

  // Gerenciamento de Checklists Customizados
  custom_checklist: {
    header: {
      title: 'Guia - Criar Checklist',
    },
    guide: [
      {
        title: 'Como configurar',
        content: `
1. **Seções:** Agrupe perguntas por categoria (ex: Elétrica, Mecânica).
2. **Perguntas:** Digite o item a ser verificado.
3. **Ordem:** Os itens aparecerão na ordem em que foram criados.
        `,
        expanded: true,
      },
    ],
  },

  // Gerador de QR Codes
  qr_generator: {
    header: {
      title: 'Guia - Gerador de QR Codes',
    },
    guide: [
      {
        title: 'Como usar',
        content: `
1. **Selecionar:** Escolha equipamentos existentes para gerar códigos automáticos.
2. **Buscar:** Encontre equipamentos específicos por ID ou Série.
3. **Manual:** Digite uma lista de IDs para gerar vários códigos de uma vez.
4. **Download:** Baixe em PNG ou compartilhe o código gerado.
        `,
        expanded: true,
      },
    ],
  },

  // Escaneamento de QR Code
  qr_scan: {
    header: {
      title: 'Guia - Escanear Equipamento',
    },
    guide: [
      {
        title: 'Como escanear',
        content: `
1. **Câmera:** Aponte para o QR code do equipamento.
2. **Foco:** Mantenha o código centralizado e aguarde a leitura.
3. **Manual:** Se o código estiver danificado, use a opção de busca manual.
        `,
        expanded: true,
      },
    ],
  },

  // Dashboard
  dashboard: {
    header: {
      title: 'Guia da Dashboard',
      subtitle: 'Visão geral do status de todos os equipamentos',
    },
    guide: [
      {
        title: 'O que você vê na Dashboard?',
        content: `
**Métricas (cards no topo):**
- 📊 **Total:** Quantidade total de equipamentos cadastrados
- ✅ **OK:** Equipamentos em conformidade
- ⚠️ **Pendente:** Equipamentos sem inspeção registrada

**Lista de Alertas:**
- Equipamentos com problemas ou pendências
- Equipamentos com inspeções vencidas ou reprovadas
        `,
        expanded: true,
      },
      {
        title: 'Como usar',
        content: `
**Para ver detalhes de um equipamento:**
1. Vá em **"Inspeções"** no menu inferior
2. Selecione o tipo de equipamento
3. Toque no equipamento desejado

**Para cadastrar novo equipamento:**
1. Vá em **"Inspeções"**
2. Selecione o tipo de equipamento
3. Toque no botão **"+"** no canto inferior direito

**Para ver histórico:**
- Toque em **"Histórico"** no menu inferior
        `,
      },
    ],
    faq: [
      {
        question: 'Como acesso um equipamento específico?',
        answer: 'Vá em "Inspeções" → Selecione o tipo → Toque no equipamento desejado.',
      },
      {
        question: 'O que fazer com alertas?',
        answer: 'Verifique o equipamento indicado e registre uma nova inspeção ou ação corretiva.',
      },
    ],
  },
};

// Função helper para obter instruções por tipo
export const getInstructions = (type: string): EquipmentInstructions | null => {
  return instructions[type] || null;
};

// Tipos de equipamento disponíveis
export const equipmentTypes = [
  'extintor',
  'mangueira',
  'camara_espuma',
  'canhao_monitor',
  'chuveiro_lavaolhos',
  'alarme',
  'multigas',
  'scba',
  'abrigo',
  'dashboard',
] as const;
