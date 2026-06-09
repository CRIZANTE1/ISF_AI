/**
 * Utilitário para geração de relatórios em PDF no formato ABNT
 * Cores: branco, cinza e preto
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseInspectionDate } from './dateUtils';
import { logger } from './logger';

// Extensão do autoTable para jsPDF
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

// Cores ABNT: branco, cinza e preto
const COLORS = {
  BLACK: '#000000',
  GRAY: '#808080',
  LIGHT_GRAY: '#E0E0E0',
  WHITE: '#FFFFFF',
};

// Configurações de página ABNT
const PAGE_MARGINS = {
  TOP: 30,
  BOTTOM: 30,
  LEFT: 30,
  RIGHT: 30,
};

const PAGE_WIDTH = 210; // A4 width in mm
const PAGE_HEIGHT = 297; // A4 height in mm
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGINS.LEFT - PAGE_MARGINS.RIGHT;

export interface InspectionData {
  id: number;
  data_inspecao: string;
  status_geral?: string;
  tipo_servico?: string;
  tipo_inspecao?: string;
  inspetor?: string;
  observacoes_gerais?: string;
  plano_de_acao?: string;
  link_foto_nao_conformidade?: string;
  resultados_json?: Record<string, any>;
  latitude?: number;
  longitude?: number;
  data_proxima_inspecao?: string;
}

export interface EquipmentData {
  id: string;
  name: string;
  type: string;
  location?: string;
  [key: string]: any;
}

export interface ReportData {
  equipment: EquipmentData;
  inspection: InspectionData;
  companyName?: string;
  responsibleName?: string;
}

/**
 * Converte uma URL de imagem para base64
 * Melhoria para Android: adicione tratamento de timeout e limitação de tamanho
 */
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    // Adiciona timeout para evitar congelamentos em dispositivos lentos
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Timeout ao carregar imagem')), 10000); // 10 segundos
    });

    // Faz a requisição com timeout
    const response = await Promise.race([
      fetch(url),
      timeoutPromise
    ]);

    if (!response.ok) {
      throw new Error(`Falha ao carregar imagem: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();

    // Verifica o tamanho da imagem para evitar problemas de memória no Android
    if (blob.size > 5 * 1024 * 1024) { // 5MB
      logger.warn('Imagem muito grande, pode causar problemas de memória no Android', 'pdf', { url, size: blob.size });
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    logger.error('Erro ao converter imagem para base64', 'pdf', { error });
    return '';
  }
}

/**
 * Formata data no padrão brasileiro
 */
function formatDate(dateString: string): string {
  try {
    const date = parseInspectionDate(dateString);
    return format(date, "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  } catch {
    return dateString;
  }
}

/**
 * Formata data curta
 */
function formatDateShort(dateString: string): string {
  try {
    const date = parseInspectionDate(dateString);
    return format(date, 'dd/MM/yyyy', { locale: ptBR });
  } catch {
    return dateString;
  }
}

/**
 * Obtém o nome do tipo de equipamento em português
 */
function getEquipmentTypeName(type: string): string {
  const typeMap: Record<string, string> = {
    extintor: 'Extintor de Incêndio',
    mangueira: 'Mangueira de Incêndio',
    scba: 'Conjunto Autônomo de Respiração (SCBA)',
    multigas: 'Medidor Multigás',
    camara_espuma: 'Câmara de Espuma',
    canhao_monitor: 'Canhão Monitor',
    chuveiro_lavaolhos: 'Chuveiro/Lava-olhos',
    alarme: 'Sistema de Alarme',
    abrigo: 'Abrigo de Emergência',
  };
  return typeMap[type] || type;
}

/**
 * Gera o cabeçalho do relatório
 */
function addHeader(doc: jsPDF, companyName?: string): number {
  let yPos = PAGE_MARGINS.TOP;

  // Título principal
  doc.setFontSize(16);
  doc.setTextColor(COLORS.BLACK);
  doc.setFont('helvetica', 'bold');
  const title = 'RELATÓRIO DE INSPEÇÃO DE EQUIPAMENTO';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, PAGE_MARGINS.LEFT + (CONTENT_WIDTH - titleWidth) / 2, yPos);
  yPos += 10;

  // Nome da empresa (se fornecido)
  if (companyName) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    const companyWidth = doc.getTextWidth(companyName);
    doc.text(companyName, PAGE_MARGINS.LEFT + (CONTENT_WIDTH - companyWidth) / 2, yPos);
    yPos += 8;
  }

  // Linha separadora
  doc.setDrawColor(COLORS.GRAY);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGINS.LEFT, yPos, PAGE_MARGINS.LEFT + CONTENT_WIDTH, yPos);
  yPos += 10;

  return yPos;
}

/**
 * Adiciona informações do equipamento
 */
function addEquipmentInfo(doc: jsPDF, yPos: number, equipment: EquipmentData): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('1. DETALHES DO EQUIPAMENTO', PAGE_MARGINS.LEFT, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  // ID do Equipamento (sempre presente)
  const equipmentId = equipment.id || equipment.name || equipment.numero_identificacao || 
                      equipment.id_equipamento || equipment.id_mangueira || 
                      equipment.id_camara || equipment.id_sistema || equipment.id_abrigo ||
                      equipment.numero_serie_equipamento || 'N/A';
  doc.text(`ID: ${equipmentId}`, PAGE_MARGINS.LEFT, yPos);
  yPos += 7;

  const equipmentType = getEquipmentTypeName(equipment.type);
  doc.text(`Tipo: ${equipmentType}`, PAGE_MARGINS.LEFT, yPos);
  yPos += 7;

  // Informações específicas por tipo de equipamento
  if (equipment.type === 'multigas') {
    if (equipment.marca) {
      doc.text(`Marca: ${equipment.marca}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.modelo) {
      doc.text(`Modelo: ${equipment.modelo}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.numero_serie) {
      doc.text(`Nº de Série: ${equipment.numero_serie}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.data_cadastro) {
      doc.text(`Data de Cadastro: ${formatDateShort(equipment.data_cadastro)}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    const eqAny = equipment as Record<string, unknown>;
    const hasPerGas =
      eqAny.margem_erro_lel != null ||
      eqAny.margem_erro_o2 != null ||
      eqAny.margem_erro_h2s != null ||
      eqAny.margem_erro_co != null;
    if (hasPerGas) {
      doc.text(
        `Margens: LEL ${eqAny.margem_erro_lel ?? equipment.margem_erro_cilindro ?? 20}% | O² ${eqAny.margem_erro_o2 ?? equipment.margem_erro_cilindro ?? 20}% | H²S ${eqAny.margem_erro_h2s ?? equipment.margem_erro_cilindro ?? 20}% | CO ${eqAny.margem_erro_co ?? equipment.margem_erro_cilindro ?? 20}%`,
        PAGE_MARGINS.LEFT,
        yPos
      );
      yPos += 7;
    } else if (equipment.margem_erro_cilindro !== undefined && equipment.margem_erro_cilindro !== null) {
      doc.text(`Margem de Erro: ${equipment.margem_erro_cilindro}%`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
  } else if (equipment.type === 'extintor') {
    if (equipment.marca_fabricante) {
      doc.text(`Marca: ${equipment.marca_fabricante}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.tipo_agente) {
      doc.text(`Agente Extintor: ${equipment.tipo_agente}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.capacidade) {
      doc.text(`Capacidade: ${equipment.capacidade} kg`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.numero_serie) {
      doc.text(`Nº de Série: ${equipment.numero_serie}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.numero_selo_inmetro) {
      doc.text(`Selo Inmetro: ${equipment.numero_selo_inmetro}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.ano_fabricacao) {
      doc.text(`Ano de Fabricação: ${equipment.ano_fabricacao}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
  } else if (equipment.type === 'scba') {
    if (equipment.marca) {
      doc.text(`Marca: ${equipment.marca}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.modelo) {
      doc.text(`Modelo: ${equipment.modelo}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.numero_serie_equipamento) {
      doc.text(`Nº de Série do Equipamento: ${equipment.numero_serie_equipamento}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.numero_serie_mascara) {
      doc.text(`Nº de Série da Máscara: ${equipment.numero_serie_mascara}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.numero_serie_segundo_estagio) {
      doc.text(`Nº de Série do Segundo Estágio: ${equipment.numero_serie_segundo_estagio}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
  } else if (equipment.type === 'mangueira') {
    if (equipment.marca) {
      doc.text(`Marca: ${equipment.marca}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.diametro) {
      doc.text(`Diâmetro: ${equipment.diametro} mm`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.comprimento) {
      doc.text(`Comprimento: ${equipment.comprimento} m`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.numero_serie) {
      doc.text(`Nº de Série: ${equipment.numero_serie}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.ano_fabricacao) {
      doc.text(`Ano de Fabricação: ${equipment.ano_fabricacao}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
  } else {
    // Para outros tipos (chuveiro_lavaolhos, camara_espuma, canhao_monitor, alarme, abrigo)
    if (equipment.marca) {
      doc.text(`Marca: ${equipment.marca}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.modelo) {
      doc.text(`Modelo: ${equipment.modelo}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.numero_serie) {
      doc.text(`Nº de Série: ${equipment.numero_serie}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.data_cadastro) {
      doc.text(`Data de Cadastro: ${formatDateShort(equipment.data_cadastro)}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
  }

  if (equipment.location || equipment.localizacao || equipment.local) {
    const location = equipment.location || equipment.localizacao || equipment.local;
    doc.text(`Localização: ${location}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;
  }

  yPos += 8; // Espaço extra antes da próxima seção
  return yPos;
}

/**
 * Adiciona informações da inspeção
 */
function addInspectionInfo(doc: jsPDF, yPos: number, inspection: InspectionData): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('2. DADOS DA INSPEÇÃO', PAGE_MARGINS.LEFT, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (inspection.data_inspecao) {
    doc.text(`Data da Inspeção: ${formatDate(inspection.data_inspecao)}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;
  }

  if (inspection.tipo_servico || inspection.tipo_inspecao) {
    doc.text(`Tipo de Serviço: ${inspection.tipo_servico || inspection.tipo_inspecao}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;
  }

  if (inspection.inspetor) {
    doc.text(`Inspetor Responsável: ${inspection.inspetor}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;
  }

  if (inspection.status_geral) {
    doc.setFont('helvetica', 'bold');
    const statusText = `Status: ${inspection.status_geral.toUpperCase()}`;
    doc.text(statusText, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;
    doc.setFont('helvetica', 'normal');
  }

  if (inspection.data_proxima_inspecao) {
    doc.text(`Próxima Inspeção: ${formatDate(inspection.data_proxima_inspecao)}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;
  }

  yPos += 8; // Espaço extra antes da próxima seção
  return yPos;
}

/**
 * Adiciona resultados do checklist (se houver)
 */
function addChecklistResults(doc: jsPDF, yPos: number, resultados: Record<string, any>): number {
  if (!resultados || Object.keys(resultados).length === 0) {
    return yPos;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('4. RESULTADOS DA INSPEÇÃO', PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  // Prepara dados para tabela com ícones visuais
  const tableData: string[][] = [];
  for (const [key, value] of Object.entries(resultados)) {
    const isConforme = value === true || value === 'sim' || value === 'Sim';
    const isNaoConforme = value === false || value === 'não' || value === 'Não';
    const status = isConforme ? '✓ Conforme' : 
                   isNaoConforme ? '✗ Não Conforme' : 
                   String(value);
    tableData.push([key, status]);
  }

  if (tableData.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Item Verificado', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 0, 0], // Preto
        textColor: [255, 255, 255], // Branco
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [0, 0, 0], // Preto
      },
      alternateRowStyles: {
        fillColor: [224, 224, 224], // Cinza claro
      },
      margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 5;
  }

  return yPos;
}

/**
 * Adiciona seção de Pesagem Semestral CO₂ (apenas para extintores CO₂ com pesagem)
 */
function addCo2WeighingSection(doc: jsPDF, yPos: number, inspection: InspectionData): number {
  const insp = inspection as any;
  if (!insp.peso_medido_conjunto_kg) return yPos;

  const pc = insp.peso_cheio_placa_snapshot_kg ?? insp.peso_cheio_placa_kg;
  const medido = insp.peso_medido_conjunto_kg;
  const carga = insp.carga_nominal_kg;
  const perda = insp.perda_kg;
  const proxima = insp.data_proxima_pesagem_co2;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('3. PESAGEM SEMESTRAL CO₂', PAGE_MARGINS.LEFT, yPos);
  yPos += 6;

  doc.setDrawColor(COLORS.GRAY);
  doc.line(PAGE_MARGINS.LEFT, yPos, PAGE_WIDTH - PAGE_MARGINS.RIGHT, yPos);
  yPos += 8;

  const rows: string[][] = [];
  if (pc !== undefined && pc !== null) rows.push(['Peso Cheio (placa)', `${pc} kg`]);
  if (medido !== undefined && medido !== null) rows.push(['Peso Medido (conjunto)', `${medido} kg`]);
  if (carga !== undefined && carga !== null) rows.push(['Carga Nominal', `${carga} kg`]);
  if (perda !== undefined && perda !== null) {
    const limite = carga ? (carga * 0.1).toFixed(3) : '-';
    const aprovado = carga ? perda <= carga * 0.1 : true;
    rows.push(['Perda Apurada', `${perda} kg (limite: ${limite} kg) — ${aprovado ? 'APROVADO' : 'REPROVADO'}`]);
  }
  if (proxima) rows.push(['Próxima Pesagem', format(new Date(proxima), 'dd/MM/yyyy', { locale: ptBR })]);

  doc.autoTable({
    startY: yPos,
    body: rows,
    theme: 'plain',
    styles: { fontSize: 10, textColor: COLORS.BLACK },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70, fillColor: COLORS.LIGHT_GRAY },
      1: { cellWidth: CONTENT_WIDTH - 70 },
    },
    margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT },
  });

  yPos = (doc as any).lastAutoTable.finalY + 10;
  return yPos;
}

/**
 * Adiciona valores de medição multigas (apenas para equipamentos multigas)
 */
function addMultigasValues(doc: jsPDF, yPos: number, inspection: InspectionData, equipment: EquipmentData): number {
  // Verifica se é multigas e se há dados de medição
  if (equipment.type !== 'multigas') {
    return yPos;
  }

  // Acessa campos de multigas do objeto inspection (que pode ter campos extras)
  const inspectionAny = inspection as any;
  const lelRef = inspectionAny.lel_referencia ?? inspectionAny.LEL_referencia;
  const o2Ref = inspectionAny.o2_referencia ?? inspectionAny.O2_referencia;
  const h2sRef = inspectionAny.h2s_referencia ?? inspectionAny.H2S_referencia;
  const coRef = inspectionAny.co_referencia ?? inspectionAny.CO_referencia;
  const lelEncontrado = inspectionAny.lel_encontrado ?? inspectionAny.LEL_encontrado;
  const o2Encontrado = inspectionAny.o2_encontrado ?? inspectionAny.O2_encontrado;
  const h2sEncontrado = inspectionAny.h2s_encontrado ?? inspectionAny.H2S_encontrado;
  const coEncontrado = inspectionAny.co_encontrado ?? inspectionAny.CO_encontrado;

  // Verifica se há pelo menos um valor de referência
  if (lelRef === undefined && o2Ref === undefined && h2sRef === undefined && coRef === undefined) {
    return yPos;
  }

  const eqAny = equipment as Record<string, unknown>;
  const fallback = equipment.margem_erro_cilindro ?? 20.0;
  const getMargem = (gas: 'lel' | 'o2' | 'h2s' | 'co') =>
    (eqAny[`margem_erro_${gas}`] as number | undefined) ?? fallback;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('3. VALORES DE MEDIÇÃO MULTIGAS', PAGE_MARGINS.LEFT, yPos);
  yPos += 10;

  // Prepara dados para tabela
  const tableData: string[][] = [];
  
  // Função auxiliar para calcular diferença percentual
  const calcularDiferenca = (ref: number | undefined, encontrado: number | undefined): string => {
    if (ref === undefined || encontrado === undefined) return '-';
    const diff = ((encontrado - ref) / ref) * 100;
    return diff >= 0 ? `+${diff.toFixed(2)}%` : `${diff.toFixed(2)}%`;
  };

  const estaDentroMargem = (
    ref: number | undefined,
    encontrado: number | undefined,
    margem: number
  ): boolean => {
    if (ref === undefined || encontrado === undefined) return false;
    const diffPercent = Math.abs(((encontrado - ref) / ref) * 100);
    return diffPercent <= margem;
  };

  // LEL
  if (lelRef !== undefined) {
    const status = estaDentroMargem(lelRef, lelEncontrado, getMargem('lel')) ? 'Dentro da margem' : 'Fora da margem';
    tableData.push([
      'LEL',
      lelRef.toFixed(2),
      lelEncontrado !== undefined ? lelEncontrado.toFixed(2) : '-',
      calcularDiferenca(lelRef, lelEncontrado),
      status
    ]);
  }

  // O2
  if (o2Ref !== undefined) {
    const status = estaDentroMargem(o2Ref, o2Encontrado, getMargem('o2')) ? 'Dentro da margem' : 'Fora da margem';
    tableData.push([
      'O2',
      o2Ref.toFixed(2),
      o2Encontrado !== undefined ? o2Encontrado.toFixed(2) : '-',
      calcularDiferenca(o2Ref, o2Encontrado),
      status
    ]);
  }

  // H2S
  if (h2sRef !== undefined) {
    const status = estaDentroMargem(h2sRef, h2sEncontrado, getMargem('h2s')) ? 'Dentro da margem' : 'Fora da margem';
    tableData.push([
      'H2S',
      h2sRef.toString(),
      h2sEncontrado !== undefined ? h2sEncontrado.toString() : '-',
      calcularDiferenca(h2sRef, h2sEncontrado),
      status
    ]);
  }

  // CO
  if (coRef !== undefined) {
    const status = estaDentroMargem(coRef, coEncontrado, getMargem('co')) ? 'Dentro da margem' : 'Fora da margem';
    tableData.push([
      'CO',
      coRef.toString(),
      coEncontrado !== undefined ? coEncontrado.toString() : '-',
      calcularDiferenca(coRef, coEncontrado),
      status
    ]);
  }

  if (tableData.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Gás', 'Referência', 'Medido', 'Diferença (%)', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 0, 0], // Preto
        textColor: [255, 255, 255], // Branco
        fontStyle: 'bold',
      },
      bodyStyles: {
        textColor: [0, 0, 0], // Preto
      },
      alternateRowStyles: {
        fillColor: [224, 224, 224], // Cinza claro
      },
      margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT },
      styles: {
        fontSize: 9,
        cellPadding: 3,
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 12; // Melhor espaçamento
  }

  return yPos;
}

/**
 * Adiciona seção de não conformidades identificadas
 */
function addNonConformities(doc: jsPDF, yPos: number, inspection: InspectionData): number {
  if (!inspection.resultados_json || Object.keys(inspection.resultados_json).length === 0) {
    return yPos;
  }

  // Extrai não conformidades do resultados_json
  const nonConformities: string[] = [];
  for (const [key, value] of Object.entries(inspection.resultados_json)) {
    const isNaoConforme = value === false || value === 'não' || value === 'Não' || value === 'Não Conforme';
    if (isNaoConforme) {
      nonConformities.push(key);
    }
  }

  // Se não houver não conformidades, não adiciona a seção
  if (nonConformities.length === 0) {
    return yPos;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('5. NÃO CONFORMIDADES IDENTIFICADAS', PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  // Contador
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${nonConformities.length} não conformidade(s) encontrada(s):`, PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  // Lista de não conformidades com fundo destacado
  const startY = yPos;
  let currentY = yPos;
  
  for (let i = 0; i < nonConformities.length; i++) {
    const item = nonConformities[i];
    
    // Verifica se precisa de nova página
    if (currentY > PAGE_HEIGHT - 40) {
      doc.addPage();
      currentY = PAGE_MARGINS.TOP;
    }

    // Desenha fundo cinza claro para destacar
    doc.setFillColor(240, 240, 240);
    doc.rect(PAGE_MARGINS.LEFT, currentY - 3, CONTENT_WIDTH, 7, 'F');
    
    // Texto da não conformidade
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.BLACK);
    doc.text(`• ${item}`, PAGE_MARGINS.LEFT + 2, currentY);
    currentY += 8;
  }

  yPos = currentY + 8; // Espaço extra após a lista

  return yPos;
}

/**
 * Adiciona observações e plano de ação
 */
function addObservations(doc: jsPDF, yPos: number, inspection: InspectionData): number {
  let hasContent = false;

  if (inspection.observacoes_gerais || inspection.plano_de_acao) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.BLACK);
    doc.text('6. OBSERVAÇÕES E PLANO DE AÇÃO', PAGE_MARGINS.LEFT, yPos);
    yPos += 12; // Melhor espaçamento
    hasContent = true;
  }

  if (inspection.observacoes_gerais) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações Gerais:', PAGE_MARGINS.LEFT, yPos);
    yPos += 7;

    // Adiciona borda sutil em torno das observações
    const startY = yPos - 2;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(inspection.observacoes_gerais, CONTENT_WIDTH - 4);
    const textHeight = lines.length * 6;
    
    // Desenha retângulo sutil
    doc.setDrawColor(COLORS.LIGHT_GRAY);
    doc.setLineWidth(0.3);
    doc.rect(PAGE_MARGINS.LEFT, startY, CONTENT_WIDTH, textHeight + 4);
    
    doc.text(lines, PAGE_MARGINS.LEFT + 2, yPos);
    yPos += textHeight + 8;
  }

  if (inspection.plano_de_acao) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Plano de Ação:', PAGE_MARGINS.LEFT, yPos);
    yPos += 7;

    // Adiciona borda sutil em torno do plano de ação
    const startY = yPos - 2;
    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(inspection.plano_de_acao, CONTENT_WIDTH - 4);
    const textHeight = lines.length * 6;
    
    // Desenha retângulo sutil
    doc.setDrawColor(COLORS.LIGHT_GRAY);
    doc.setLineWidth(0.3);
    doc.rect(PAGE_MARGINS.LEFT, startY, CONTENT_WIDTH, textHeight + 4);
    
    doc.text(lines, PAGE_MARGINS.LEFT + 2, yPos);
    yPos += textHeight + 8;
  }

  return hasContent ? yPos : yPos - 10;
}

/**
 * Adiciona foto da inspeção
 */
async function addPhoto(doc: jsPDF, yPos: number, photoUrl: string): Promise<number> {
  try {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.BLACK);
    doc.text('6. EVIDÊNCIAS FOTOGRÁFICAS', PAGE_MARGINS.LEFT, yPos);
    yPos += 8;

    // Verifica se há espaço na página
    if (yPos > PAGE_HEIGHT - 80) {
      doc.addPage();
      yPos = PAGE_MARGINS.TOP;
    }

    // Converte imagem para base64
    const base64Image = await imageUrlToBase64(photoUrl);
    if (!base64Image) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.GRAY);
      doc.text('Foto não disponível', PAGE_MARGINS.LEFT, yPos);
      return yPos + 10;
    }

    // Dimensões da imagem (máximo 150mm de largura, proporção mantida)
    const maxWidth = 150;
    const maxHeight = 100;

    // Adiciona a imagem com tratamento de erro para dispositivos Android
    try {
      doc.addImage(base64Image, 'JPEG', PAGE_MARGINS.LEFT, yPos, maxWidth, maxHeight);
    } catch (imgError) {
      logger.error('Erro ao adicionar imagem ao PDF', 'pdf', { error: imgError });
      // Se não conseguir adicionar a imagem, apenas mostra mensagem
      doc.setFontSize(10);
      doc.setFont('helvetica', 'italic');
      doc.setTextColor(COLORS.GRAY);
      doc.text('Foto não pôde ser adicionada', PAGE_MARGINS.LEFT, yPos + 10);
      yPos += 15;
      return yPos;
    }

    yPos += maxHeight + 10;

    // Legenda
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text('Foto de evidência da inspeção', PAGE_MARGINS.LEFT, yPos);
    yPos += 8;

    return yPos;
  } catch (error) {
    logger.error('Erro ao adicionar foto', 'pdf', { error });
    return yPos;
  }
}

/**
 * Adiciona campo de assinatura
 */
function addSignature(doc: jsPDF, yPos: number, responsibleName?: string): number {
  // Verifica se há espaço na página
  if (yPos > PAGE_HEIGHT - 60) {
    doc.addPage();
    yPos = PAGE_MARGINS.TOP;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('7. ASSINATURA DO RESPONSÁVEL', PAGE_MARGINS.LEFT, yPos);
  yPos += 10;

  // Linha para assinatura
  const signatureY = yPos;
  doc.setDrawColor(COLORS.BLACK);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGINS.LEFT, signatureY, PAGE_MARGINS.LEFT + 80, signatureY);
  yPos += 8;

  // Nome do responsável (se fornecido)
  if (responsibleName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(responsibleName, PAGE_MARGINS.LEFT, yPos);
    yPos += 6;
  } else {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text('Nome do responsável', PAGE_MARGINS.LEFT, yPos);
    yPos += 6;
  }

  // Data
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.GRAY);
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Data: ${today}`, PAGE_MARGINS.LEFT, yPos);
  yPos += 15;

  return yPos;
}

/**
 * Gera relatório em PDF no formato ABNT
 */
export async function generateInspectionReport(data: ReportData): Promise<Blob> {
  // Configuração otimizada para dispositivos Android
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    // Otimizações para melhor performance e menor uso de memória
    putOnlyUsedFonts: true,
    compress: true,
  });

  let yPos = PAGE_MARGINS.TOP;

  // Cabeçalho
  yPos = addHeader(doc, data.companyName);

  // Informações do equipamento
  yPos = addEquipmentInfo(doc, yPos, data.equipment);

  // Verifica se precisa de nova página
  if (yPos > PAGE_HEIGHT - 100) {
    doc.addPage();
    yPos = PAGE_MARGINS.TOP;
  }

  // Informações da inspeção
  yPos = addInspectionInfo(doc, yPos, data.inspection);

  // Verifica se precisa de nova página
  if (yPos > PAGE_HEIGHT - 100) {
    doc.addPage();
    yPos = PAGE_MARGINS.TOP;
  }

  // Valores de medição multigas (apenas para multigas)
  if (data.equipment.type === 'multigas') {
    yPos = addMultigasValues(doc, yPos, data.inspection, data.equipment);
    
    // Verifica se precisa de nova página
    if (yPos > PAGE_HEIGHT - 100) {
      doc.addPage();
      yPos = PAGE_MARGINS.TOP;
    }
  }

  // Pesagem CO₂ (apenas para extintores CO₂ com pesagem realizada)
  if (data.equipment.type === 'extintor') {
    yPos = addCo2WeighingSection(doc, yPos, data.inspection);
    if (yPos > PAGE_HEIGHT - 100) {
      doc.addPage();
      yPos = PAGE_MARGINS.TOP;
    }
  }

  // Resultados do checklist (se houver)
  if (data.inspection.resultados_json) {
    yPos = addChecklistResults(doc, yPos, data.inspection.resultados_json);
  }

  // Verifica se precisa de nova página
  if (yPos > PAGE_HEIGHT - 100) {
    doc.addPage();
    yPos = PAGE_MARGINS.TOP;
  }

  // Não conformidades identificadas
  yPos = addNonConformities(doc, yPos, data.inspection);

  // Verifica se precisa de nova página
  if (yPos > PAGE_HEIGHT - 100) {
    doc.addPage();
    yPos = PAGE_MARGINS.TOP;
  }

  // Observações e plano de ação
  yPos = addObservations(doc, yPos, data.inspection);

  // Foto (se houver) - otimizado para Android
  if (data.inspection.link_foto_nao_conformidade) {
    yPos = await addPhoto(doc, yPos, data.inspection.link_foto_nao_conformidade);
  }

  // Assinatura
  yPos = addSignature(doc, yPos, data.responsibleName);

  // Gera o blob do PDF
  const pdfBlob = doc.output('blob');

  // jsPDF gerencia sua própria memória internamente
  // O objeto doc será coletado pelo garbage collector automaticamente
  // Não é necessário fazer cleanup manual

  return pdfBlob;
}

export interface MultipleInspectionReportData {
  equipment: EquipmentData;
  inspections: InspectionData[];
  companyName?: string;
  responsibleName?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}

/**
 * Gera relatório de múltiplas inspeções de um equipamento
 */
export async function generateMultipleInspectionReport(
  data: MultipleInspectionReportData
): Promise<Blob> {
  // Configuração otimizada para dispositivos Android
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    // Otimizações para melhor performance e menor uso de memória
    putOnlyUsedFonts: true,
    compress: true,
  });

  let yPos = PAGE_MARGINS.TOP;

  // Cabeçalho
  yPos = addHeader(doc, data.companyName);

  // Informações do equipamento (completo)
  yPos = addEquipmentInfo(doc, yPos, data.equipment);

  // Verifica se precisa de nova página
  if (yPos > PAGE_HEIGHT - 100) {
    doc.addPage();
    yPos = PAGE_MARGINS.TOP;
  }

  // Informações do intervalo de datas (se fornecido)
  if (data.dateRange) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.BLACK);
    doc.text('PERÍODO DE INSPEÇÕES', PAGE_MARGINS.LEFT, yPos);
    yPos += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`De: ${formatDate(data.dateRange.start)}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;
    doc.text(`Até: ${formatDate(data.dateRange.end)}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 10;
  }

  // Lista de inspeções
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text(`INSPEÇÕES (${data.inspections.length})`, PAGE_MARGINS.LEFT, yPos);
  yPos += 10;

  // Processa cada inspeção
  for (let i = 0; i < data.inspections.length; i++) {
    const inspection = data.inspections[i];

    // Verifica se precisa de nova página
    if (yPos > PAGE_HEIGHT - 150) {
      doc.addPage();
      yPos = PAGE_MARGINS.TOP;
    }

    // Título da inspeção
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(`Inspeção ${i + 1} de ${data.inspections.length}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 8;

    // Dados da inspeção
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');

    if (inspection.data_inspecao) {
      doc.text(`Data: ${formatDate(inspection.data_inspecao)}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }

    if (inspection.tipo_servico || inspection.tipo_inspecao) {
      doc.text(`Tipo: ${inspection.tipo_servico || inspection.tipo_inspecao}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }

    if (inspection.status_geral) {
      doc.setFont('helvetica', 'bold');
      doc.text(`Status: ${inspection.status_geral.toUpperCase()}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
    }

    if (inspection.inspetor) {
      doc.text(`Inspetor: ${inspection.inspetor}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }

    if (inspection.observacoes_gerais) {
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const obsLines = doc.splitTextToSize(inspection.observacoes_gerais, CONTENT_WIDTH);
      doc.text(obsLines, PAGE_MARGINS.LEFT, yPos);
      yPos += obsLines.length * 6 + 8;
    }

    if (inspection.plano_de_acao) {
      doc.setFont('helvetica', 'bold');
      doc.text('Plano de Ação:', PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      const planoLines = doc.splitTextToSize(inspection.plano_de_acao, CONTENT_WIDTH);
      doc.text(planoLines, PAGE_MARGINS.LEFT, yPos);
      yPos += planoLines.length * 6 + 8;
    }

    // Resultados do checklist (se houver)
    if (inspection.resultados_json && Object.keys(inspection.resultados_json).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Resultados:', PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');

      const tableData: string[][] = [];
      for (const [key, value] of Object.entries(inspection.resultados_json)) {
        const status = value === true || value === 'sim' || value === 'Sim' ? 'Conforme' :
                       value === false || value === 'não' || value === 'Não' ? 'Não Conforme' :
                       String(value);
        tableData.push([key, status]);
      }

      if (tableData.length > 0) {
        doc.autoTable({
          startY: yPos,
          head: [['Item', 'Status']],
          body: tableData,
          theme: 'striped',
          headStyles: {
            fillColor: [0, 0, 0],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
          },
          bodyStyles: {
            textColor: [0, 0, 0],
          },
          alternateRowStyles: {
            fillColor: [224, 224, 224],
          },
          margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT },
          styles: {
            fontSize: 8,
            cellPadding: 2,
          },
        });
        yPos = (doc as any).lastAutoTable.finalY + 5;
      }
    }

    // Foto (se houver) - otimizado para Android
    if (inspection.link_foto_nao_conformidade) {
      if (yPos > PAGE_HEIGHT - 100) {
        doc.addPage();
        yPos = PAGE_MARGINS.TOP;
      }
      yPos = await addPhoto(doc, yPos, inspection.link_foto_nao_conformidade);
    }

    // Linha separadora entre inspeções
    if (i < data.inspections.length - 1) {
      yPos += 5;
      doc.setDrawColor(COLORS.LIGHT_GRAY);
      doc.setLineWidth(0.3);
      doc.line(PAGE_MARGINS.LEFT, yPos, PAGE_MARGINS.LEFT + CONTENT_WIDTH, yPos);
      yPos += 10;
    }
  }

  // Assinatura final
  yPos = addSignature(doc, yPos, data.responsibleName);

  const pdfBlob = doc.output('blob');

  // jsPDF gerencia sua própria memória internamente
  // O objeto doc será coletado pelo garbage collector automaticamente
  // Não é necessário fazer cleanup manual

  return pdfBlob;
}

export interface EquipmentListReportItem {
  _reportId: string;
  latitude?: number | null;
  longitude?: number | null;
  link_foto_nao_conformidade?: string | null;
  observacoes?: string | null;
  plano_de_acao?: string | null;
  localizacao?: string;
  local?: string;
  location?: string;
  status_geral?: string;
  aprovado_inspecao?: string;
  resultado?: string;
  marca?: string;
  marca_fabricante?: string;
  modelo?: string;
  tipo_agente?: string;
  [key: string]: any;
}

export interface EquipmentListReportData {
  equipmentList: EquipmentListReportItem[];
  equipmentType: string;
  typeName: string;
  companyName?: string;
}

function formatInventoryLocation(item: EquipmentListReportItem): string {
  if (item.latitude != null && item.longitude != null) {
    return `${Number(item.latitude).toFixed(6)}, ${Number(item.longitude).toFixed(6)}`;
  }
  return item.localizacao || item.local || item.location || '-';
}

function formatInventoryExtraInfo(item: EquipmentListReportItem): string {
  const parts: string[] = [];

  if (item.status_geral) {
    parts.push(`Status: ${item.status_geral}`);
  } else if (item.aprovado_inspecao) {
    parts.push(`Status: ${item.aprovado_inspecao}`);
  } else if (item.resultado) {
    parts.push(`Resultado: ${item.resultado}`);
  }

  if (item.tipo_agente) parts.push(item.tipo_agente);
  if (item.marca_fabricante) parts.push(item.marca_fabricante);
  else if (item.marca) parts.push(item.marca);
  if (item.modelo) parts.push(item.modelo);

  return parts.length > 0 ? parts.join(' | ') : '-';
}

function addInventoryHeader(doc: jsPDF, typeName: string): number {
  let yPos = PAGE_MARGINS.TOP;

  doc.setFontSize(16);
  doc.setTextColor(COLORS.BLACK);
  doc.setFont('helvetica', 'bold');
  const title = `RELATÓRIO DE INVENTÁRIO - ${typeName.toUpperCase()}`;
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, PAGE_MARGINS.LEFT + (CONTENT_WIDTH - titleWidth) / 2, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const dateText = `Gerado em: ${today}`;
  const dateWidth = doc.getTextWidth(dateText);
  doc.text(dateText, PAGE_MARGINS.LEFT + (CONTENT_WIDTH - dateWidth) / 2, yPos);
  yPos += 8;

  doc.setDrawColor(COLORS.GRAY);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGINS.LEFT, yPos, PAGE_MARGINS.LEFT + CONTENT_WIDTH, yPos);
  yPos += 10;

  return yPos;
}

async function addInventoryPhoto(
  doc: jsPDF,
  yPos: number,
  photoUrl: string,
  equipmentId: string
): Promise<number> {
  if (yPos > PAGE_HEIGHT - 80) {
    doc.addPage();
    yPos = PAGE_MARGINS.TOP;
  }

  const base64Image = await imageUrlToBase64(photoUrl);
  if (!base64Image) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text('Foto não disponível', PAGE_MARGINS.LEFT, yPos);
    return yPos + 10;
  }

  const maxWidth = 120;
  const maxHeight = 80;

  try {
    doc.addImage(base64Image, 'JPEG', PAGE_MARGINS.LEFT, yPos, maxWidth, maxHeight);
    yPos += maxHeight + 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text(`Evidência fotográfica - ${equipmentId}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 8;
  } catch (imgError) {
    logger.error('Erro ao adicionar imagem ao relatório de inventário', 'pdf', { error: imgError });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text('Foto não pôde ser adicionada', PAGE_MARGINS.LEFT, yPos);
    yPos += 10;
  }

  return yPos;
}

async function addInventoryDetailsAndEvidence(
  doc: jsPDF,
  yPos: number,
  equipmentList: EquipmentListReportItem[]
): Promise<number> {
  const itemsWithDetails = equipmentList.filter(
    (item) => item.link_foto_nao_conformidade || item.observacoes || item.plano_de_acao
  );

  if (itemsWithDetails.length === 0) {
    return yPos;
  }

  if (yPos > PAGE_HEIGHT - 60) {
    doc.addPage();
    yPos = PAGE_MARGINS.TOP;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('DETALHES E EVIDÊNCIAS', PAGE_MARGINS.LEFT, yPos);
  yPos += 10;

  for (const item of itemsWithDetails) {
    if (yPos > PAGE_HEIGHT - 80) {
      doc.addPage();
      yPos = PAGE_MARGINS.TOP;
    }

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text(`Equipamento: ${item._reportId}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;

    if (item.observacoes) {
      doc.setFont('helvetica', 'bold');
      doc.text('Observações:', PAGE_MARGINS.LEFT, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      const obsLines = doc.splitTextToSize(item.observacoes, CONTENT_WIDTH);
      doc.text(obsLines, PAGE_MARGINS.LEFT, yPos);
      yPos += obsLines.length * 5 + 4;
    }

    if (item.plano_de_acao) {
      doc.setFont('helvetica', 'bold');
      doc.text('Plano de Ação:', PAGE_MARGINS.LEFT, yPos);
      yPos += 6;
      doc.setFont('helvetica', 'normal');
      const planLines = doc.splitTextToSize(item.plano_de_acao, CONTENT_WIDTH);
      doc.text(planLines, PAGE_MARGINS.LEFT, yPos);
      yPos += planLines.length * 5 + 4;
    }

    if (item.link_foto_nao_conformidade) {
      yPos = await addInventoryPhoto(doc, yPos, item.link_foto_nao_conformidade, item._reportId);
    }

    yPos += 4;
    doc.setDrawColor(COLORS.LIGHT_GRAY);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGINS.LEFT, yPos, PAGE_MARGINS.LEFT + CONTENT_WIDTH, yPos);
    yPos += 8;
  }

  return yPos;
}

/**
 * Gera relatório PDF de inventário de equipamentos no formato ABNT
 */
export async function generateEquipmentListReport(
  equipmentList: EquipmentListReportItem[],
  equipmentType: string,
  typeName: string
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true,
  });

  let yPos = addInventoryHeader(doc, typeName);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text(`INVENTÁRIO (${equipmentList.length} equipamento(s))`, PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  const tableData = equipmentList.map((item, index) => [
    String(index + 1),
    item._reportId,
    formatInventoryLocation(item),
    formatInventoryExtraInfo(item),
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['#', 'ID', 'Localização', 'Info extras']],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    bodyStyles: {
      textColor: [0, 0, 0],
    },
    alternateRowStyles: {
      fillColor: [224, 224, 224],
    },
    margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT },
    styles: {
      fontSize: 8,
      cellPadding: 3,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 10 },
      1: { cellWidth: 35 },
      2: { cellWidth: 50 },
      3: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;
  await addInventoryDetailsAndEvidence(doc, yPos, equipmentList);

  return doc.output('blob');
}

/**
 * Converte ArrayBuffer para base64 de forma eficiente (evita problemas com arquivos grandes)
 * Processa em chunks para evitar problemas de memória no Android
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 16384; // Chunks de 16KB para melhor performance
  
  // Processa em chunks para evitar problemas com apply() e limites de argumentos
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, Math.min(i + chunkSize, bytes.length));
    // Usa apply com slice do chunk para evitar problemas de memória
    // Limita a 8KB por vez dentro do apply para segurança
    const applyChunkSize = 8192;
    for (let j = 0; j < chunk.length; j += applyChunkSize) {
      const applyChunk = chunk.subarray(j, Math.min(j + applyChunkSize, chunk.length));
      const chunkArray = Array.from(applyChunk);
      binary += String.fromCharCode.apply(null, chunkArray);
    }
  }
  
  return btoa(binary);
}

/**
 * Salva o PDF no dispositivo (Android/iOS)
 */
export async function savePdfToDevice(pdfBlob: Blob, filename: string): Promise<void> {
  try {
    const { Filesystem, Directory } = await import('@capacitor/filesystem');
    const { Share } = await import('@capacitor/share');
    const { Capacitor } = await import('@capacitor/core');
    const { logger } = await import('./logger');

    if (Capacitor.isNativePlatform() && Filesystem && Share) {
      try {
        // Converte blob para base64 de forma eficiente
        const arrayBuffer = await pdfBlob.arrayBuffer();
        const base64 = arrayBufferToBase64(arrayBuffer);

        // Limpa o nome do arquivo (remove caracteres inválidos)
        const cleanFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');

        // Salva o arquivo
        // IMPORTANTE: Para dados binários base64 (PDFs), NÃO usar encoding UTF8
        // O Capacitor Filesystem trata base64 como dados binários quando não especificamos encoding
        let result;
        try {
          // Primeira tentativa: sem encoding (recomendado para binários)
          result = await Filesystem.writeFile({
            path: cleanFilename,
            data: base64,
            directory: Directory.Documents,
            // Não especificar encoding para dados binários
          });
        } catch (writeError: any) {
          // Se falhar, pode ser problema de permissão ou caminho
          // NÃO usar Encoding.UTF8 pois isso corrompe arquivos binários (PDFs)
          logger.error('Erro ao salvar PDF - não usar encoding UTF8 para binários', 'pdf', writeError);
          throw writeError; // Propaga o erro para tratamento no nível superior
        }

        logger.info('PDF salvo com sucesso', 'pdf', { uri: result.uri, filename: cleanFilename });

        // Tenta compartilhar o arquivo
        try {
          // Primeira tentativa: usar o URI retornado
          await Share.share({
            title: 'Relatório de Inspeção',
            text: 'Relatório de inspeção gerado',
            url: result.uri,
            dialogTitle: 'Compartilhar relatório',
          });
        } catch (shareError: any) {
          // Se falhar, tenta obter o URI novamente usando getUri
          try {
            const fileUri = await Filesystem.getUri({
              path: cleanFilename,
              directory: Directory.Documents,
            });
            
            await Share.share({
              title: 'Relatório de Inspeção',
              text: 'Relatório de inspeção gerado',
              url: fileUri.uri,
              dialogTitle: 'Compartilhar relatório',
            });
          } catch (shareError2: any) {
            // Se ainda falhar, apenas loga (arquivo já foi salvo)
            logger.warn('PDF salvo mas não foi possível compartilhar', 'pdf', { 
              error: shareError2?.message || shareError?.message,
              uri: result.uri 
            });
          }
        }
      } catch (nativeError: any) {
        logger.error('Erro ao salvar PDF no dispositivo nativo', 'pdf', nativeError);
        
        // Se falhar completamente no nativo, tenta fallback web
        // Mas apenas se não for um erro de permissão ou sistema
        if (!nativeError.message?.includes('permission') && 
            !nativeError.message?.includes('Permission') &&
            !nativeError.message?.includes('EACCES')) {
          logger.warn('Tentando fallback web para salvar PDF', 'pdf');
          try {
            const url = URL.createObjectURL(pdfBlob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            return; // Sucesso no fallback
          } catch (webError) {
            logger.error('Fallback web também falhou', 'pdf', webError);
          }
        }
        
        throw nativeError;
      }
    } else {
      // Fallback para navegador
      const url = URL.createObjectURL(pdfBlob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    const { logger } = await import('./logger');
    logger.error('Erro ao salvar PDF', 'pdf', error);
    throw error;
  }
}

