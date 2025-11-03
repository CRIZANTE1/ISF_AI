/**
 * Constantes de checklists para cada tipo de equipamento
 * Baseado nas views Python do projeto ISF_IA_SUP
 */

export const EYEWASH_CHECKLIST = {
  "Condições Gerais": [
    "A VAZÃO DO CHUVEIRO ESTÁ ADEQUADA?",
    "A PRESSÃO ESTÁ ADEQUADA?",
    "A PINTURA ESTA ÍNTEGRA?",
    "OPERAÇÃO DAS VÁLVULAS – ACIONAMENTO POSSUI VAZAMENTO?",
    "O ACESSO ESTÁ LIVRE?",
    "NIVELAMENTO POSSUI DESNÍVEL?",
    "A DRENAGEM DE ÁGUA FUNCIONA?",
    "O CRIVO ESTÁ DESOBISTRUIDO E BEM FIXADO?",
    "O FILTRO ESTÁ LIMPO?",
    "O REGULADOR DE PRESSÃO FUNCIONA CORRETAMENTE?",
    "O PISO POSSUI ADERÊNCIA?",
    "OS EMPREGADOS SÃO CAPACITADOS PARA UTILIZÁ-LOS?",
    "O EQUIPAMENTO POSSUI CORROSÃO?",
    "EXISTE PINTURA DO PISO SOB/EM VOLTA DA ESTAÇÃO?",
    "OS ESGUICHOS POSSUEM DEFEITOS?",
    "O PISO ESTÁ DANIFICADO?",
  ],
};

export const FOAM_CHAMBER_CHECKLIST: Record<string, Record<string, string[]>> = {
  "MCS - Selo de Vidro": {
    "Condições Gerais": [
      "Pintura e estrutura sem corrosão ou amassados",
      "Sem vazamentos visíveis no tanque e conexões",
      "Válvulas em bom estado e lubrificadas",
    ],
    "Componentes da Câmara": [
      "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)",
      "Selo de vidro limpo, íntegro e bem fixado",
      "Junta de vedação em boas condições",
      "Defletor e barragem de espuma íntegros",
    ],
    "Linhas e Conexões": [
      "Tomadas de solução e linhas sem obstrução",
      "Drenos livres e estanques",
      "Ejetores e orifícios desobstruídos",
      "Placa de orifício íntegra e sem obstruções",
      "Placa de orifício compatível com o modelo da câmara",
    ],
    "Teste Funcional": [
      "Verificação de fluxo de água/espuma",
      "Verificação de estanqueidade da linha",
      "Funcionamento do sistema confirmado",
    ],
  },
  "TF - Tubo de Filme": {
    "Condições Gerais": [
      "Pintura e estrutura sem corrosão ou amassados",
      "Sem vazamentos visíveis no tanque e conexões",
      "Válvulas em bom estado e lubrificadas",
    ],
    "Componentes da Câmara": [
      "Tubo de projeção íntegro (sem corrosão ou danos)",
      "Defletor de projeção íntegro e bem fixado",
    ],
    "Linhas e Conexões": [
      "Tomadas de solução e linhas sem obstrução",
      "Drenos livres e estanques",
      "Ejetores e orifícios desobstruídos",
      "Placa de orifício íntegra e sem obstruções",
      "Placa de orifício compatível com o modelo da câmara",
    ],
    "Teste Funcional": [
      "Verificação de fluxo de água/espuma",
      "Verificação de estanqueidade da linha",
      "Funcionamento do sistema confirmado",
    ],
  },
  "MLS - Membrana Low Shear": {
    "Condições Gerais": [
      "Pintura e estrutura sem corrosão ou amassados",
      "Sem vazamentos visíveis no tanque e conexões",
      "Válvulas em bom estado e lubrificadas",
    ],
    "Componentes da Câmara": [
      "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)",
      "Membrana de elastômero sem ressecamento ou danos visíveis",
      "Junta de vedação em boas condições",
      "Defletor e barragem de espuma íntegros",
    ],
    "Linhas e Conexões": [
      "Tomadas de solução e linhas sem obstrução",
      "Drenos livres e estanques",
      "Ejetores e orifícios desobstruídos",
      "Placa de orifício íntegra e sem obstruções",
      "Placa de orifício compatível com o modelo da câmara",
    ],
    "Teste Funcional": [
      "Verificação de fluxo de água/espuma",
      "Verificação de estanqueidade da linha",
      "Funcionamento do sistema confirmado",
    ],
  },
  // Modelos Ansuul e Naffco
  "FOAM-200": {
    "Condições Gerais": [
      "Pintura e estrutura sem corrosão ou amassados",
      "Sem vazamentos visíveis no tanque e conexões",
      "Válvulas em bom estado e lubrificadas",
    ],
    "Componentes da Câmara": [
      "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)",
      "Selo de vedação íntegro e bem fixado",
      "Junta de vedação em boas condições",
      "Defletor e barragem de espuma íntegros",
    ],
    "Linhas e Conexões": [
      "Tomadas de solução e linhas sem obstrução",
      "Drenos livres e estanques",
      "Ejetores e orifícios desobstruídos",
      "Placa de orifício íntegra e sem obstruções",
      "Placa de orifício compatível com o modelo da câmara",
    ],
    "Teste Funcional": [
      "Verificação de fluxo de água/espuma",
      "Verificação de estanqueidade da linha",
      "Funcionamento do sistema confirmado",
    ],
  },
  "FOAM-300": {
    "Condições Gerais": [
      "Pintura e estrutura sem corrosão ou amassados",
      "Sem vazamentos visíveis no tanque e conexões",
      "Válvulas em bom estado e lubrificadas",
    ],
    "Componentes da Câmara": [
      "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)",
      "Selo de vedação íntegro e bem fixado",
      "Junta de vedação em boas condições",
      "Defletor e barragem de espuma íntegros",
    ],
    "Linhas e Conexões": [
      "Tomadas de solução e linhas sem obstrução",
      "Drenos livres e estanques",
      "Ejetores e orifícios desobstruídos",
      "Placa de orifício íntegra e sem obstruções",
      "Placa de orifício compatível com o modelo da câmara",
    ],
    "Teste Funcional": [
      "Verificação de fluxo de água/espuma",
      "Verificação de estanqueidade da linha",
      "Funcionamento do sistema confirmado",
    ],
  },
  "FOAM-500": {
    "Condições Gerais": [
      "Pintura e estrutura sem corrosão ou amassados",
      "Sem vazamentos visíveis no tanque e conexões",
      "Válvulas em bom estado e lubrificadas",
    ],
    "Componentes da Câmara": [
      "Câmara de espuma íntegra (sem trincas, deformações ou corrosão)",
      "Selo de vedação íntegro e bem fixado",
      "Junta de vedação em boas condições",
      "Defletor e barragem de espuma íntegros",
    ],
    "Linhas e Conexões": [
      "Tomadas de solução e linhas sem obstrução",
      "Drenos livres e estanques",
      "Ejetores e orifícios desobstruídos",
      "Placa de orifício íntegra e sem obstruções",
      "Placa de orifício compatível com o modelo da câmara",
    ],
    "Teste Funcional": [
      "Verificação de fluxo de água/espuma",
      "Verificação de estanqueidade da linha",
      "Funcionamento do sistema confirmado",
    ],
  },
};

export const ALARM_CHECKLIST = {
  "Componentes Físicos": [
    "Painel de controle sem danos físicos",
    "Fiação e conexões em bom estado",
    "Dispositivos de alarme (sirenes, luzes) intactos",
    "Baterias de backup em bom estado",
    "Detectores de fumaça/calor limpos e sem danos",
  ],
  "Funcionamento": [
    "Painel de controle em estado normal (sem indicação de falhas)",
    "Sirenes funcionam corretamente durante teste",
    "Luzes estroboscópicas funcionam corretamente",
    "Sistema comunica com central de monitoramento (se aplicável)",
    "Bateria de backup carrega corretamente",
  ],
  "Sensores e Detectores": [
    "Detectores de fumaça respondem ao teste",
    "Detectores de calor funcionam corretamente",
    "Acionadores manuais respondem quando ativados",
    "Sensores de fluxo de água (se aplicável) funcionam",
    "Cobertura de sensores adequada para o ambiente",
  ],
  "Documentação e Sinalização": [
    "Instruções de operação visíveis e legíveis",
    "Plano de evacuação atualizado e visível",
    "Registros de manutenção anteriores disponíveis",
    "Contatos de emergência atualizados",
    "Sinalização de rotas de fuga adequada",
  ],
};

export const CANNON_MONITOR_CHECKLIST_VISUAL = {
  "Estrutura e Suporte": [
    "Base e suporte íntegros",
    "Sem corrosão ou amassados",
    "Fixação adequada",
  ],
  "Componentes": [
    "Canhão monitor íntegro",
    "Válvulas funcionando",
    "Mangueiras sem vazamentos",
  ],
};

export const CANNON_MONITOR_CHECKLIST_FUNCIONAL = {
  "Estrutura e Suporte": [
    "Base e suporte íntegros",
    "Sem corrosão ou amassados",
    "Fixação adequada",
  ],
  "Componentes": [
    "Canhão monitor íntegro",
    "Válvulas funcionando",
    "Mangueiras sem vazamentos",
  ],
  "Teste Funcional": [
    "Fluxo de água adequado",
    "Controle de direção funcionando",
    "Sistema de elevação funcionando",
  ],
};

