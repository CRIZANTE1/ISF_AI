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
  guide?: InstructionSection[];
  faq?: Array<{
    question: string;
    answer: string;
  }>;
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
