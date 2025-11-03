// Instruções completas para cada tipo de equipamento
// Ajustadas para refletir apenas as funcionalidades implementadas no app

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
      title: 'Guia de Uso - Sistema de Inspeção de Extintores',
    },
    alert: {
      type: 'info',
      message: '🚨 **Importante:** Mantenha os extintores sempre em conformidade. Realize inspeções mensais obrigatórias conforme normas técnicas.',
    },
    methods: {
      title: 'Como Realizar Inspeções',
      items: [
        {
          name: 'Registrar Inspeção',
          description: '⚡ MÉTODO PRINCIPAL',
          time: '~3-5 minutos por extintor',
          idealFor: [
            'Inspeções de rotina mensais',
            'Manutenções N2 e N3',
            'Substituições de equipamentos',
            'Verificações periódicas',
          ],
          howItWorks: [
            'Acesse o extintor na lista de equipamentos',
            'Clique no extintor para ver detalhes',
            'Clique em "Registrar Nova Inspeção"',
            'Preencha data, tipo de serviço e status',
            'Adicione observações se necessário',
            'Anexe foto se houver não conformidade',
            'Salve a inspeção',
          ],
          advantages: [
            'Processo simples e direto',
            'Registro completo no histórico',
            'Fotos de evidência quando necessário',
            'Cálculo automático de próximas inspeções',
          ],
        },
        {
          name: 'Cadastrar Novo Extintor',
          description: '🆕 PARA EQUIPAMENTOS NOVOS',
          time: '~3-5 minutos por extintor',
          idealFor: [
            'Primeiro cadastro de extintor novo',
            'Correções de dados',
            'Atualização de informações',
          ],
          howItWorks: [
            'Acesse a lista de extintores',
            'Clique no botão "+" para cadastrar novo',
            'Preencha os dados do equipamento',
            'Informe ID, localização e tipo',
            'Salve o cadastro',
          ],
          advantages: [
            'Controle total dos dados',
            'Flexibilidade para todos os campos',
            'Base de dados para futuras inspeções',
          ],
        },
      ],
    },
    workflow: {
      title: 'Fluxo de Trabalho Recomendado',
      steps: [
        '**Cadastrar Equipamento** → Acesse a lista de extintores e clique no botão "+"',
        '**Realizar Inspeção** → Clique no extintor → "Registrar Nova Inspeção"',
        '**Acompanhar Status** → Use o Dashboard para ver status e vencimentos',
        '**Histórico Completo** → Acesse a página de Histórico para ver todas as inspeções',
      ],
    },
    guide: [
      {
        title: 'Passo a Passo: Realizar uma Inspeção',
        content: `
#### **Antes de Começar:**
- 📱 Tenha acesso ao app
- 🔦 Verifique o extintor fisicamente no local
- 📸 Tenha um celular pronto para tirar fotos (se necessário)

#### **Passo 1: Acesse o Extintor** 🔍

1. Vá para a página **"Inspeções"** no menu inferior
2. Toque em **"Extintores"**
3. Na lista, encontre e clique no extintor que deseja inspecionar
4. Você verá os detalhes do equipamento e histórico de inspeções

#### **Passo 2: Registre a Inspeção** ✅

1. Na página de detalhes do extintor, clique em **"Registrar Nova Inspeção"**
2. Preencha os campos obrigatórios:
   - **Data da Inspeção:** Data em que a inspeção foi realizada
   - **Tipo de Serviço:** Escolha entre Inspeção, Manutenção N2, Manutenção N3 ou Substituição
   - **Aprovado na Inspeção?:** Marque "Sim" ou "Não"

3. Se o equipamento foi reprovado:
   - **Anexe uma foto** da não conformidade (obrigatório)
   - Descreva o problema nas **Observações Gerais**

4. Clique em **"Salvar Inspeção"**

#### **Passo 3: Confirmação** 💾

Após salvar, você será redirecionado para a lista de extintores. A inspeção ficará registrada no histórico.
        `,
        expanded: true,
      },
      {
        title: 'Tipos de Serviço',
        content: `
**Inspeção:**
- Verificação visual mensal obrigatória
- Verifica lacre, manômetro, acesso
- Não requer manutenção

**Manutenção N2:**
- Manutenção anual obrigatória
- Realizada por empresa certificada
- Inclui recarga e substituição de componentes

**Manutenção N3:**
- Manutenção quinquenal (5 anos)
- Realizada por empresa certificada
- Inclui teste hidrostático

**Substituição:**
- Quando o extintor é substituído por outro
- Registra a baixa do equipamento antigo
        `,
      },
    ],
    faq: [
      {
        question: 'Com que frequência devo inspecionar?',
        answer: `
**Frequências obrigatórias:**

- 📅 **Inspeção Mensal:** Todo mês (obrigatória)
- 📅 **Manutenção N2:** Anualmente (obrigatória)
- 📅 **Manutenção N3:** A cada 5 anos (obrigatória)

**💡 Dica:** Configure lembretes no seu calendário para não esquecer!
        `,
      },
      {
        question: 'Quando devo anexar foto?',
        answer: `
**Foto é obrigatória quando:**
- ❌ O equipamento foi reprovado na inspeção
- ❌ Há não conformidade identificada
- 📋 Para documentar problemas encontrados

**Foto é opcional quando:**
- ✅ O equipamento está conforme (aprovado)

**Dica:** Tire fotos claras que mostrem o problema encontrado.
        `,
      },
    ],
    footer: 'Para cadastrar um novo extintor, acesse a lista de extintores e clique no botão "+" no canto inferior direito.',
  },

  // Mangueiras
  mangueira: {
    header: {
      title: 'Guia de Uso - Sistema de Mangueiras',
    },
    alert: {
      type: 'info',
      message: '🚨 **Importante:** Mangueiras devem ser testadas hidrostaticamente anualmente conforme NBR 12779.',
    },
    methods: {
      title: 'Como Gerenciar Mangueiras',
      items: [
        {
          name: 'Cadastrar Mangueira',
          description: '🆕 PARA EQUIPAMENTOS NOVOS',
          time: '~2-3 minutos por mangueira',
          idealFor: [
            'Cadastrar mangueira nova',
            'Mangueiras de reposição',
            'Atualização de inventário',
          ],
          howItWorks: [
            'Acesse a lista de mangueiras',
            'Clique no botão "+" para cadastrar',
            'Preencha ID, diâmetro, tipo, comprimento',
            'Informe ano de fabricação',
            'Salve o cadastro',
          ],
        },
        {
          name: 'Registrar Teste Hidrostático',
          description: '🔬 PARA TESTES ANUAIS',
          time: '~2-3 minutos por teste',
          idealFor: [
            'Após teste hidrostático anual',
            'Registro de resultados de teste',
            'Documentação de conformidade',
          ],
          howItWorks: [
            'Acesse a mangueira na lista',
            'Clique na mangueira para ver detalhes',
            'Clique em "Registrar Nova Inspeção"',
            'Informe data e resultado do teste',
            'Anexe foto do certificado (se disponível)',
            'Salve o registro',
          ],
        },
      ],
    },
    workflow: {
      title: 'Fluxo de Trabalho Recomendado',
      steps: [
        '**Cadastrar Mangueira** → Lista de mangueiras → Botão "+"',
        '**Registrar Teste Hidrostático** → Após teste anual realizado → Registrar inspeção',
        '**Acompanhar Vencimentos** → Dashboard mostra mangueiras próximas do vencimento',
      ],
    },
    faq: [
      {
        question: 'Com que frequência devo testar?',
        answer: `
**Norma NBR 12779:**
- ✅ **Teste a cada 12 meses** (anual obrigatório)
- ⚠️ Sistema calcula automaticamente o próximo vencimento
- 🚨 Mangueira com teste vencido não pode ser usada

**Teste extraordinário:**
- Após qualquer reparo
- Após exposição a produtos químicos
- Se houver suspeita de dano
        `,
      },
    ],
  },

  // Câmaras de Espuma
  camara_espuma: {
    header: {
      title: 'Guia de Uso - Sistema de Câmaras de Espuma',
    },
    alert: {
      type: 'info',
      message: '⚡ **Importante:** Câmaras de espuma requerem inspeções semestrais (visuais) e anuais (funcionais) conforme NFPA 11.',
    },
    methods: {
      title: 'Como Realizar Inspeções',
      items: [
        {
          name: 'Inspeção Visual/Funcional',
          description: '⚡ PARA USO REGULAR - RECOMENDADA',
          time: '~10-15 minutos por câmara',
          idealFor: [
            'Inspeções semestrais obrigatórias',
            'Testes funcionais anuais',
            'Verificações de conformidade',
            'Checklist guiado por modelo',
          ],
          howItWorks: [
            'Acesse a câmara na lista de equipamentos',
            'Clique na câmara para ver detalhes',
            'Clique em "Registrar Nova Inspeção"',
            'Escolha tipo: Visual Semestral ou Funcional Anual',
            'Responda ao checklist completo',
            'Tire foto se houver não conformidade',
            'Sistema gera plano de ação automaticamente',
            'Salve a inspeção',
          ],
        },
        {
          name: 'Cadastrar Nova Câmara',
          description: '🆕 PARA EQUIPAMENTOS NOVOS',
          time: '~3-5 minutos',
          idealFor: [
            'Adicionar novas câmaras ao inventário',
            'Registrar informações básicas',
            'Criar base de dados para inspeções',
          ],
          howItWorks: [
            'Acesse a lista de câmaras',
            'Clique no botão "+" para cadastrar',
            'Preencha ID, localização, modelo e tamanho',
            'Adicione marca e observações (opcional)',
            'Salve o cadastro',
          ],
        },
      ],
    },
    workflow: {
      title: 'Fluxo de Trabalho Recomendado',
      steps: [
        '**Primeira Vez?** → Cadastre todas as câmaras usando o botão "+"',
        '**Inspeção Semestral** → Use "Visual Semestral" com checklist completo',
        '**Teste Anual** → Use "Funcional Anual" (inclui teste funcional)',
      ],
    },
    faq: [
      {
        question: 'Com que frequência devo inspecionar?',
        answer: `
**Frequência Obrigatória:**

- 📋 **Visual Semestral:** A cada 6 meses (obrigatória)
- 🔧 **Funcional Anual:** 1 vez por ano (obrigatória)

**Calendário sugerido:**
- Janeiro → Inspeção Visual Semestral
- Julho → Inspeção Funcional Anual (substitui a visual)
        `,
      },
      {
        question: 'Qual a diferença entre Visual e Funcional?',
        answer: `
**Inspeção Visual Semestral:**
- Verificação externa e componentes visíveis
- Não inclui teste funcional
- Mais rápida (~10 minutos)

**Inspeção Funcional Anual:**
- Inclui TUDO da visual
- **MAIS** teste funcional com água/espuma
- Foto obrigatória (mesmo que aprovada)
- Mais completa (~15 minutos)
        `,
      },
    ],
  },

  // Canhões Monitores
  canhao_monitor: {
    header: {
      title: 'Guia Completo - Gestão de Canhões Monitores',
    },
    alert: {
      type: 'info',
      message: '🚨 **Importante:** Canhões monitores são equipamentos de combate a incêndio de alta capacidade. A manutenção é crítica.',
    },
    methods: {
      title: 'Métodos Disponíveis no Sistema',
      items: [
        {
          name: 'Realizar Inspeção / Teste',
          description: '⚡ PARA USO REGULAR - RECOMENDADO',
          time: '~5-10 minutos por canhão',
          idealFor: [
            'Inspeções visuais trimestrais obrigatórias',
            'Testes funcionais anuais com fluxo de água',
            'Verificações de conformidade para auditorias',
            'Seguir um checklist completo e guiado',
          ],
          howItWorks: [
            'Acesse o canhão na lista de equipamentos',
            'Clique no canhão para ver detalhes',
            'Clique em "Registrar Nova Inspeção"',
            'Escolha o tipo: Visual ou Funcional',
            'Responda ao checklist detalhado',
            '**Anexe foto** (obrigatória para testes funcionais e não conformidades)',
            'O sistema gera o status e o plano de ação automaticamente',
            'Salve a inspeção',
          ],
        },
        {
          name: 'Cadastrar Novo Canhão',
          description: '🆕 PARA EQUIPAMENTOS NOVOS',
          time: '~2 minutos por canhão',
          idealFor: [
            'Adicionar novos canhões ao inventário do sistema',
            'Registrar informações básicas como ID, localização, marca e modelo',
            'Criar a base de dados para futuras inspeções',
          ],
          howItWorks: [
            'Acesse a lista de canhões',
            'Clique no botão "+" para cadastrar',
            'Preencha o ID único do equipamento',
            'Informe a localização detalhada',
            'Adicione marca e modelo (opcional)',
            'Salve o equipamento',
          ],
        },
      ],
    },
    workflow: {
      title: 'Fluxo de Trabalho Recomendado',
      steps: [
        '**Primeira Vez no Sistema?** → Cadastre todos os canhões usando o botão "+"',
        '**Rotina Trimestral?** → Use "Registrar Inspeção" com tipo "Visual"',
        '**Rotina Anual?** → Use "Registrar Inspeção" com tipo "Funcional"',
      ],
    },
    guide: [
      {
        title: 'Critérios de Aprovação e Reprovação',
        content: `
#### **✅ Quando APROVAR um Item (Conforme)**

**O equipamento e seus componentes estão aptos se:**
- **Acesso:** O caminho até o canhão e a área ao redor estão completamente livres de obstruções
- **Estrutura:** Não há corrosão severa, trincas ou danos que possam comprometer a segurança
- **Movimentação:** O giro (horizontal) e a elevação (vertical) são suaves
- **Travamento:** Os manípulos ou volantes de travamento fixam o canhão firmemente
- **Vazamentos:** Não há vazamentos visíveis nas juntas ou conexões
- **Desempenho do Jato (Teste Funcional):** O jato de água é contínuo e atinge a distância esperada

#### **❌ Quando REPROVAR um Item (Não Conforme)**

**Um item deve ser reprovado se apresentar:**
- Movimento travado (impossibilidade de mover)
- Vazamento grave (jato de água saindo pelas juntas)
- Dano estrutural visível (trincas, flange solto)
- Componentes quebrados (volante, manípulo ausentes)
- Obstrução total (não sai água durante teste funcional)
        `,
      },
    ],
  },

  // Chuveiros/Lava-olhos
  chuveiro_lavaolhos: {
    header: {
      title: 'Guia de Uso - Sistema de Inspeção de Chuveiros e Lava-Olhos',
    },
    alert: {
      type: 'info',
      message: '🚨 **Importante:** Chuveiros e lava-olhos de emergência são equipamentos críticos. Inspeções periódicas são um **requisito normativo**.',
    },
    methods: {
      title: 'Métodos Disponíveis de Inspeção',
      items: [
        {
          name: 'Inspeção Completa (Checklist)',
          description: '⚡ RECOMENDADO PARA ROTINA',
          time: '~3-5 minutos por equipamento',
          idealFor: [
            'Inspeções periódicas obrigatórias (semanais/mensais)',
            'Auditorias e fiscalizações (NR 20, Bombeiros)',
            'Verificação completa de todos os itens',
            'Documentação detalhada para conformidade',
          ],
          howItWorks: [
            'Acesse o equipamento na lista',
            'Clique no equipamento para ver detalhes',
            'Clique em "Registrar Nova Inspeção"',
            'Preencha a data da inspeção',
            'Responda ao checklist completo',
            'Marque cada item como Conforme/Não Conforme/N/A',
            'Tire fotos se houver não conformidades (obrigatório)',
            'Sistema salva e calcula a próxima inspeção',
          ],
        },
        {
          name: 'Cadastrar Novo Equipamento',
          description: '🆕 PARA EQUIPAMENTOS NOVOS',
          time: '~2-3 minutos',
          idealFor: [
            'Equipamentos recém-instalados',
            'Atualização de inventário',
            'Após substituições ou manutenções',
          ],
          howItWorks: [
            'Acesse a lista de chuveiros/lava-olhos',
            'Clique no botão "+" para cadastrar',
            'Preencha ID, localização e tipo',
            'Adicione marca e modelo (opcional)',
            'Salve o equipamento',
          ],
        },
      ],
    },
    workflow: {
      title: 'Fluxo de Trabalho Recomendado',
      steps: [
        '**Primeira Vez?** → Cadastre todos os equipamentos usando o botão "+"',
        '**Inspeção Periódica** → Use "Registrar Nova Inspeção" com checklist completo',
        '**Novos Equipamentos** → Cadastre antes de realizar a primeira inspeção',
      ],
    },
    faq: [
      {
        question: 'Com que frequência devo inspecionar?',
        answer: `
As normas de referência estabelecem uma rotina clara:

- 🏃 **SEMANALMENTE:** Ativação funcional rápida (verificação de fluxo de água)
- 📋 **MENSALMENTE:** Inspeção visual e funcional registrada no sistema
- **ANUALMENTE:** Inspeção completa de conformidade com a norma (NBR 16291 / ANSI Z358.1)

O sistema está configurado para um ciclo de **30 dias** para inspeções documentadas.
        `,
      },
      {
        question: 'Quando devo anexar foto?',
        answer: `
**Foto é OBRIGATÓRIA quando:**
- ❌ Qualquer item é marcado como **"Não Conforme"**
- 📋 Para evidenciar o problema encontrado
- ⚖️ Essencial para auditoria e rastreabilidade

**Foto é OPCIONAL quando:**
- ✅ Inspeção 100% conforme

**💡 Dica:** Tire fotos claras focando no problema específico encontrado.
        `,
      },
    ],
  },

  // Sistemas de Alarme
  alarme: {
    header: {
      title: 'Guia de Uso - Gestão de Sistemas de Alarme de Emergência',
    },
    alert: {
      type: 'info',
      message: '⚡ **Importante:** Sistemas de alarme requerem inspeções periódicas conforme NBR 17240 para garantir sua eficácia.',
    },
    methods: {
      title: 'Como Realizar Inspeções',
      items: [
        {
          name: 'Realizar Inspeção',
          description: '⚡ PARA USO REGULAR - RECOMENDADA',
          time: '~5-10 minutos por sistema',
          idealFor: [
            'Inspeções semanais/periódicas obrigatórias',
            'Verificações de conformidade',
            'Geração de histórico e rastreabilidade',
            'Checklist completo e guiado',
          ],
          howItWorks: [
            'Acesse o sistema de alarme na lista',
            'Clique no sistema para ver detalhes',
            'Clique em "Registrar Nova Inspeção"',
            'Preencha a data da inspeção',
            'Responda ao checklist de verificação completo',
            'Verifique componentes físicos, funcionamento, sensores e documentação',
            'Se houver não conformidade, anexe uma foto',
            'O sistema gera status e salva a inspeção',
          ],
        },
        {
          name: 'Cadastrar Novo Sistema',
          description: '🆕 PARA EQUIPAMENTOS NOVOS',
          time: '~3-5 minutos',
          idealFor: [
            'Sistemas recém-instalados',
            'Atualização de inventário',
            'Registro de informações técnicas',
          ],
          howItWorks: [
            'Acesse a lista de sistemas de alarme',
            'Clique no botão "+" para cadastrar',
            'Preencha ID, localização, marca e modelo',
            'Adicione informações técnicas (opcional)',
            'Salve o cadastro',
          ],
        },
      ],
    },
    faq: [
      {
        question: 'Com que frequência devo inspecionar?',
        answer: `
**Frequências recomendadas:**

- 📅 **Semanal:** Inspeção visual rápida do painel
- 📅 **Mensal:** Teste funcional de baterias e fontes
- 📅 **Trimestral:** Teste de acionadores manuais e detectores

**💡 Dica:** Configure lembretes semanais para não esquecer das inspeções visuais!
        `,
      },
      {
        question: 'O que fazer quando encontro um problema crítico?',
        answer: `
**Problemas críticos (ação imediata):**
- 🚨 Painel indicando falha que não pode ser rearmado
- 🚨 Sirenes ou luzes não funcionam
- 🚨 Detectores não respondem ao teste
- 🚨 Baterias danificadas ou com vazamento
- 🚨 Fiação exposta ou com sinais de curto-circuito

**Ação imediata:**
1. Registre a inspeção marcando como não conforme
2. Anexe foto do problema
3. Notifique imediatamente o responsável pela manutenção
4. Sinalize o equipamento como inoperante
5. Implemente medidas compensatórias temporárias
        `,
      },
    ],
  },

  // Multigás
  multigas: {
    header: {
      title: 'Guia de Uso - Sistema de Detectores Multigás',
    },
    alert: {
      type: 'info',
      message: '⚡ **Importante:** Detectores multigás requerem testes de resposta periódicos e calibração anual obrigatória.',
    },
    methods: {
      title: 'Como Realizar Testes',
      items: [
        {
          name: 'Registrar Teste de Resposta (Bump Test)',
          description: '⚡ PARA USO DIÁRIO/SEMANAL - RECOMENDADO',
          time: '~1-2 minutos por detector',
          idealFor: [
            'Bump tests diários/semanais',
            'Verificações rápidas de resposta',
            'Testes periódicos de rotina',
            'Testes extraordinários (após quedas)',
          ],
          howItWorks: [
            'Acesse o detector na lista',
            'Clique no detector para ver detalhes',
            'Clique em "Registrar Nova Inspeção"',
            'Escolha tipo de teste: Periódico ou Extraordinário',
            'Veja os valores de referência do cilindro',
            'Insira os valores encontrados no teste (LEL, O², H²S, CO)',
            'Sistema aprova/reprova automaticamente',
            'Salve o teste',
          ],
        },
        {
          name: 'Registrar Calibração Anual',
          description: '🔬 PARA CALIBRAÇÕES ANUAIS',
          time: '~2-3 minutos',
          idealFor: [
            'Após calibração anual obrigatória',
            'Registro de laudos técnicos',
            'Documentação de conformidade',
          ],
          howItWorks: [
            'Acesse o detector na lista',
            'Clique em "Registrar Nova Inspeção"',
            'Preencha a data da calibração',
            'Informe os valores de calibração',
            'Anexe foto do certificado (se disponível)',
            'Salve o registro',
          ],
        },
        {
          name: 'Cadastrar Novo Detector',
          description: '🆕 PARA EQUIPAMENTOS NOVOS',
          time: '~2-3 minutos',
          idealFor: [
            'Cadastrar detector novo',
            'Configurar valores do cilindro',
            'Primeira configuração',
          ],
          howItWorks: [
            'Acesse a lista de detectores',
            'Clique no botão "+" para cadastrar',
            'Preencha ID, marca, modelo, número de série',
            'Configure valores padrão do cilindro',
            'Salve o cadastro',
          ],
        },
      ],
    },
    workflow: {
      title: 'Fluxo de Trabalho Recomendado',
      steps: [
        '**Testes Diários/Semanais** → Use "Registrar Teste de Resposta"',
        '**Calibração Anual** → Registre após calibração realizada por empresa certificada',
        '**Cadastrar Detector Novo** → Use o botão "+" antes de começar os testes',
      ],
    },
    guide: [
      {
        title: 'Como Realizar o Bump Test',
        content: `
#### **O que é o Bump Test?**
É um teste rápido que verifica se o detector está respondendo corretamente aos gases. Você expõe o detector a concentrações conhecidas de gás (do cilindro de referência) e verifica se as leituras estão dentro da margem de erro aceitável.

#### **Passo a Passo:**

**1. Prepare o Equipamento:**
- Ligue o detector e aguarde estabilização
- Conecte o cilindro de gás de referência

**2. Exponha o Detector ao Gás:**
- Exponha o detector ao gás por tempo suficiente
- Anote os valores exibidos no display para cada gás

**3. Registre no Sistema:**
- Acesse o detector no app
- Insira os valores encontrados (LEL, O², H²S, CO)
- O sistema compara automaticamente com os valores de referência
- Sistema aprova se erro ≤ 10% (padrão)
- Sistema reprova se algum gás exceder a margem

#### **Quando Fazer o Bump Test:**
- 📅 **Diariamente:** Antes de cada uso em ambientes críticos
- 📅 **Semanalmente:** Para uso regular
- 📅 **Mensalmente:** Mínimo obrigatório
- ⚠️ **Extraordinariamente:** Após quedas, impactos ou manutenção
        `,
        expanded: true,
      },
    ],
    faq: [
      {
        question: 'Como sei se o teste foi aprovado?',
        answer: `
O sistema avalia automaticamente comparando os valores encontrados com os de referência.

**✅ APROVADO se:**
- Todos os gases têm erro ≤ 10% (margem padrão)
- Exemplo: Cilindro LEL: 50% → Detector mostrou: 52% (erro 4% = APROVADO)

**❌ REPROVADO se:**
- Qualquer gás exceder a margem de erro de 10%
- Exemplo: Cilindro CO: 100 ppm → Detector mostrou: 89 ppm (erro 11% = REPROVADO)

**Ação:** Se reprovado, o detector deve ser calibrado antes de uso.
        `,
      },
    ],
  },

  // SCBA
  scba: {
    header: {
      title: 'Guia de Uso - Sistema de Conjuntos Autônomos (SCBA)',
    },
    alert: {
      type: 'info',
      message: '⚡ **Importante:** SCBAs requerem inspeção visual mensal e teste Posi3 anual obrigatório para garantir a segurança do usuário.',
    },
    methods: {
      title: 'Como Realizar Inspeções',
      items: [
        {
          name: 'Inspeção Visual Periódica',
          description: '⚡ PARA USO REGULAR - RECOMENDADA',
          time: '~5-10 minutos por SCBA',
          idealFor: [
            'Inspeções mensais obrigatórias',
            'Verificações antes do uso',
            'Inspeções após treinamento',
            'Checklist completo e guiado',
          ],
          howItWorks: [
            'Acesse o SCBA na lista',
            'Clique no SCBA para ver detalhes',
            'Clique em "Registrar Nova Inspeção"',
            'Preencha a data da inspeção',
            'Realize os 3 testes funcionais (estanqueidade, alarme, vedação)',
            'Responda ao checklist visual completo',
            'Faça observações específicas se necessário',
            'Sistema gera status automático',
            'Salve a inspeção',
          ],
        },
        {
          name: 'Cadastrar Novo SCBA',
          description: '🆕 PARA EQUIPAMENTOS NOVOS',
          time: '~3-5 minutos',
          idealFor: [
            'Cadastrar SCBA novo',
            'Registrar número de série',
            'Criar base de dados para inspeções',
          ],
          howItWorks: [
            'Acesse a lista de SCBAs',
            'Clique no botão "+" para cadastrar',
            'Preencha número de série, marca, modelo',
            'Adicione informações técnicas (opcional)',
            'Salve o cadastro',
          ],
        },
      ],
    },
    workflow: {
      title: 'Fluxo de Trabalho Recomendado',
      steps: [
        '**Inspeções Mensais** → Use "Registrar Nova Inspeção" com checklist completo',
        '**Verificação Pré-uso** → Realize inspeção visual simplificada antes de cada uso crítico',
        '**Teste Posi3 Anual** → Após teste realizado por empresa certificada, registre o resultado',
      ],
    },
    guide: [
      {
        title: 'Testes Funcionais Obrigatórios',
        content: `
#### **1. Teste de Estanqueidade**
- Verifique se o cilindro mantém pressão sem vazamentos
- O manômetro deve mostrar pressão estável
- Não deve haver vazamentos audíveis ou sensíveis

#### **2. Teste do Alarme Sonoro**
- Com o equipamento pressurizado, o alarme deve tocar automaticamente
- Geralmente ativa quando a pressão cai para aproximadamente 25% da capacidade
- Verifique se o alarme é audível e claro

#### **3. Teste de Vedação da Máscara**
- Coloque a máscara no rosto sem pressurizar
- Bloqueie a entrada de ar com a mão
- Inspire - a máscara deve "colar" no rosto (pressão negativa)
- Isso garante vedação adequada
        `,
      },
    ],
    faq: [
      {
        question: 'Qual a diferença entre Inspeção Visual e Teste Posi3?',
        answer: `
**Inspeção Visual Periódica:**
- 📅 Feita **mensalmente** ou antes de cada uso
- 👤 **Você mesmo faz** no local
- ⏱️ Tempo: 5-10 minutos
- 🔧 Testes básicos (estanqueidade, alarme, vedação)
- 💰 Custo: Zero

**Teste Posi3 Anual:**
- 📅 Feito **anualmente** (obrigatório)
- 🏢 **Empresa especializada** faz em laboratório
- 🔬 **Testes de precisão** com equipamento Posi3 USB
- 📋 Gera laudo técnico com validade
- 💰 Custo: R$ 150-300 por equipamento

**Ambos são obrigatórios e complementares!**
        `,
      },
      {
        question: 'Como fazer a limpeza básica do SCBA?',
        answer: `
**Limpeza Após Cada Uso:**
- 🧼 Lave a máscara facial com água morna e sabão neutro
- 💦 Enxágue abundantemente em água corrente
- 🌬️ Seque naturalmente em local arejado e à sombra
- 🚫 Não utilize solventes, álcool, cloro ou produtos abrasivos

**Armazenamento Correto:**
- 📦 Guarde em armário fechado, limpo e seco
- 🌡️ Evite calor excessivo, umidade e exposição direta ao sol
- 🪛 Mantenha pressão residual no cilindro (~30 bar)
        `,
      },
    ],
  },

  // Abrigos
  abrigo: {
    header: {
      title: 'Guia de Uso - Sistema de Abrigos de Emergência',
    },
    alert: {
      type: 'info',
      message: '🚨 **Importante:** Abrigos devem ser inspecionados mensalmente conforme NBR 13714 para garantir que todos os itens estejam presentes e em bom estado.',
    },
    methods: {
      title: 'Como Realizar Inspeções',
      items: [
        {
          name: 'Inspeção de Abrigo',
          description: '📅 USO PERIÓDICO OBRIGATÓRIO',
          time: '~3-5 minutos por abrigo',
          idealFor: [
            'Inspeções mensais obrigatórias',
            'Verificação de conformidade',
            'Identificar itens faltantes',
            'Manter histórico completo',
          ],
          howItWorks: [
            'Acesse o abrigo na lista',
            'Clique no abrigo para ver detalhes',
            'Clique em "Registrar Nova Inspeção"',
            'Preencha a data da inspeção',
            'Verifique item por item do inventário',
            'Marque cada item como Aprovado/Reprovado',
            'Verifique condições gerais (lacre, sinalização, acesso)',
            'Anexe foto se houver problemas',
            'Salve a inspeção',
          ],
        },
        {
          name: 'Cadastrar Novo Abrigo',
          description: '🆕 PARA EQUIPAMENTOS NOVOS',
          time: '~3-5 minutos',
          idealFor: [
            'Abrigo recém-instalado',
            'Atualização de inventário',
            'Registro de itens e quantidades',
          ],
          howItWorks: [
            'Acesse a lista de abrigos',
            'Clique no botão "+" para cadastrar',
            'Preencha ID e localização',
            'Informe os itens e quantidades do inventário',
            'Salve o cadastro',
          ],
        },
      ],
    },
    workflow: {
      title: 'Fluxo de Trabalho Recomendado',
      steps: [
        '**Cadastrar Abrigos** → Use o botão "+" para adicionar todos os abrigos',
        '**Inspeção Mensal** → Acesse cada abrigo e registre inspeção completa',
        '**Acompanhar Status** → Use o Dashboard para ver abrigos com problemas',
      ],
    },
    faq: [
      {
        question: 'Com que frequência devo inspecionar?',
        answer: `
**Mensal (Obrigatório):**
- Verificação visual de todos os itens
- Conferência de quantidades
- Estado de conservação
- Lacre de segurança
- Sinalização

**Extraordinária (Quando Necessário):**
- Após uso do abrigo em emergência
- Após manutenção ou substituição de itens
- Após identificação de violação
- Antes de auditorias/fiscalizações
        `,
      },
      {
        question: 'O que verificar em cada inspeção?',
        answer: `
**Itens do Inventário:**
- Mangueiras (presentes e em bom estado)
- Esguichos (presentes e funcionando)
- Chaves (presentes e acessíveis)
- Acessórios (derivantes, redutores, adaptadores)

**Condições Gerais:**
- Lacre de segurança intacto
- Sinalização visível e correta
- Acesso desobstruído
- Abrigo em bom estado de conservação

**Ações:**
- Identificar itens faltantes
- Identificar itens avariados
- Documentar problemas encontrados
- Registrar ações corretivas
        `,
      },
    ],
  },

  // Dashboard
  dashboard: {
    header: {
      title: 'Guia da Dashboard',
      subtitle: 'Visão geral do status de todos os seus equipamentos de emergência',
    },
    guide: [
      {
        title: 'O que você vê na Dashboard?',
        content: `
A Dashboard é sua **tela inicial** onde você tem uma visão rápida e consolidada de todos os equipamentos.

**Métricas Principais (Cards no topo):**
- 📊 **Total:** Quantidade total de equipamentos cadastrados no sistema
- ✅ **OK:** Equipamentos em conformidade e com inspeções em dia
- ⚠️ **Pendente:** Equipamentos que ainda não possuem nenhuma inspeção registrada

**Lista de Alertas (Abaixo dos cards):**
- 🚨 Mostra equipamentos com problemas ou pendências
- 📋 Equipamentos com inspeções vencidas ou reprovadas
- ⚡ Ações que precisam ser tomadas

**Tipos de Equipamentos Monitorados:**
- 🔥 Extintores | 💧 Mangueiras | 🧯 Abrigos | 💨 SCBA
- 🚿 Chuveiros/Lava-Olhos | ☁️ Câmaras de Espuma
- 💨 Multigás | 🔔 Alarmes | 🌊 Canhões Monitores
        `,
        expanded: true,
      },
      {
        title: 'Como interpretar as métricas?',
        content: `
**📊 Total:**
- Mostra quantos equipamentos você tem cadastrados
- Inclui todos os tipos de equipamentos somados
- Use para ter uma visão geral do tamanho do seu inventário

**✅ OK:**
- Equipamentos que estão em conformidade
- Com todas as inspeções em dia
- Sem problemas ou pendências identificadas

**⚠️ Pendente:**
- Equipamentos recém-cadastrados que ainda não foram inspecionados
- Primeira inspeção ainda não foi registrada
- É normal ter pendências quando você cadastra novos equipamentos

**💡 Dica:** O ideal é que todos os equipamentos tenham ao menos uma inspeção registrada.
        `,
      },
      {
        title: 'Como usar a Dashboard?',
        content: `
**Visualização Rápida:**
1. Abra o app → Dashboard é a primeira tela que aparece
2. Veja os cards com as métricas (Total, OK, Pendente)
3. Role para baixo para ver a lista de alertas

**Ações a partir da Dashboard:**

**Para ver detalhes de um equipamento:**
1. Vá para o menu inferior → Toque em **"Inspeções"**
2. Selecione o tipo de equipamento desejado
3. Veja a lista de todos os equipamentos daquele tipo
4. Toque em um equipamento para ver detalhes e histórico

**Para cadastrar um novo equipamento:**
1. Vá para o menu inferior → Toque em **"Inspeções"**
2. Selecione o tipo de equipamento
3. Toque no botão **"+"** no canto inferior direito
4. Preencha o formulário e salve

**Para registrar uma nova inspeção:**
1. Acesse a lista do tipo de equipamento
2. Toque no equipamento desejado
3. Na página de detalhes, toque em **"Registrar Nova Inspeção"**
4. Preencha o formulário e salve

**Para ver o histórico completo:**
- No menu inferior, toque na aba **"Histórico"**
- Veja todas as inspeções de todos os equipamentos
- Filtre por tipo ou status conforme necessário
        `,
      },
    ],
    faq: [
      {
        question: 'Por que o número de "OK" pode ser diferente do "Total"?',
        answer: `
**Razões comuns:**

1. **Equipamentos Pendentes:** Alguns equipamentos ainda não foram inspecionados pela primeira vez
2. **Equipamentos com Problemas:** Alguns equipamentos podem ter inspeções reprovadas ou pendências
3. **Status em Processamento:** Sistema pode estar atualizando os dados

**💡 Dica:** Verifique a lista de alertas para ver quais equipamentos precisam de atenção.
        `,
      },
      {
        question: 'O que fazer quando vejo alertas na Dashboard?',
        answer: `
**Ações recomendadas:**

1. **Leia o alerta:** Veja qual equipamento tem problema e qual é o problema
2. **Acesse o equipamento:** Toque no alerta ou vá para a lista do tipo de equipamento
3. **Verifique os detalhes:** Veja o histórico de inspeções do equipamento
4. **Tome ação:**
   - Se for pendência de inspeção → Registre uma nova inspeção
   - Se for problema identificado → Registre ação corretiva ou substitua o equipamento
   - Se for vencimento → Agende manutenção ou inspeção urgentemente

**🚨 Importante:** Não ignore os alertas! Equipamentos de emergência em mau estado podem não funcionar quando mais precisar.
        `,
      },
      {
        question: 'Como acesso equipamentos específicos a partir da Dashboard?',
        answer: `
**Passo a passo:**

1. **No menu inferior**, toque na aba **"Inspeções"**
2. **Selecione o tipo** de equipamento que deseja ver:
   - Extintores
   - Mangueiras
   - Câmaras de Espuma
   - Canhões Monitores
   - Chuveiros/Lava-olhos
   - Sistemas de Alarme
   - Medidores Multigás
   - Conjuntos Autônomos (SCBA)
   - Abrigos de Emergência
3. **Veja a lista completa** de todos os equipamentos daquele tipo
4. **Toque em um equipamento** para ver detalhes, histórico e registrar novas inspeções
        `,
      },
      {
        question: 'Com que frequência devo verificar a Dashboard?',
        answer: `
**Recomendações:**

- 📅 **Diariamente:** Se você gerencia muitos equipamentos ou tem rotina intensa de inspeções
- 📅 **Semanalmente:** Para acompanhamento geral e planejamento de inspeções
- 📅 **Antes de Auditorias:** Para garantir que tudo está em conformidade

**💡 Dica:** Configure um lembrete semanal no seu celular para verificar a Dashboard e não perder nenhuma pendência importante.
        `,
      },
    ],
  },
};

// Função helper para mapear tipos de URL para tipos de instruções
const mapEquipmentType = (type: string): string => {
  const typeMap: Record<string, string> = {
    'chuveiro_lavaolhos': 'chuveiro_lavaolhos',
    'camara_espuma': 'camara_espuma',
    'canhao_monitor': 'canhao_monitor',
    // Mapeamento direto para outros tipos
  };
  
  return typeMap[type] || type;
};

// Função helper para obter instruções por tipo
export const getInstructions = (type: string): EquipmentInstructions | null => {
  const mappedType = mapEquipmentType(type);
  return instructions[mappedType] || null;
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
