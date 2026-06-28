/**
 * Utilitário para geração de relatórios em PDF no formato ABNT
 * Cores: branco, cinza e preto
 */

import jsPDF from 'jspdf';
import { applyPlugin } from 'jspdf-autotable';
import { format, parse } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { parseInspectionDate } from './dateUtils';
import { logger } from './logger';
import { fetchPhotoBlobForEmbed } from './photoUrlUtils';
import {
  generateMultigasActionPlan,
  resolveGasTolerances,
  verifyBumpTest,
  type CylinderValues,
  type GasTolerances,
  type MultigasDetector,
} from './multigasOperations';
import type { MonthlyExtinguisherReportRow } from './monthlyExtinguisherReport';
import { formatCapacityDisplay } from './monthlyExtinguisherReport';
import {
  flattenChecklistResults,
  groupChecklistBySection,
  extractNonConformities,
  hasSectionedChecklist,
  resolveChecklistSections,
} from './pdf/checklistPdfUtils';
import type { ChecklistSection } from './pdf/types';
import { mapInspectionForPdf as mapInspectionForPdfImpl, mapWaterReservoirInspectionForPdf } from './pdf/inspectionMapper';
export { mapWaterReservoirInspectionForPdf };
import { getEquipmentTypeName as getTypeNameFromRegistry, getPdfConfig, getCustomPdfConfig } from './pdf/pdfConfigRegistry';
import { formatInventoryExtraInfo as formatInventoryExtraFromRegistry,
  buildInventoryTableRow,
  getInventoryTableHead,
  getInventoryColumnStyles,
  shouldShowInventoryDetails,
  formatInventoryInspectionSummary,
} from './pdf/inventoryPdfUtils';
import type { MonthlyReportRow } from './pdf/types';
import type { MonthlyColumnDef } from './pdf/types';

// jspdf-autotable v5 não aplica o plugin via side-effect em bundlers ESM (Vite/Capacitor)
applyPlugin(jsPDF);

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

type MultigasGasKey = 'LEL' | 'O2' | 'H2S' | 'CO';

const MULTIGAS_GAS_CONFIG: Array<{
  key: MultigasGasKey;
  label: string;
  unit: string;
  cylinderUnit: string;
  decimals: number;
  toleranceKey: keyof GasTolerances;
  refKeys: string[];
  foundKeys: string[];
  cylinderKeys: string[];
}> = [
  {
    key: 'LEL',
    label: 'LEL',
    unit: '% LIE',
    cylinderUnit: '% LIE',
    decimals: 2,
    toleranceKey: 'LEL',
    refKeys: ['lel_referencia', 'LEL_referencia'],
    foundKeys: ['lel_encontrado', 'LEL_encontrado'],
    cylinderKeys: ['lel_cilindro', 'LEL_cilindro'],
  },
  {
    key: 'O2',
    label: 'O²',
    unit: '% vol',
    cylinderUnit: '% vol',
    decimals: 2,
    toleranceKey: 'O2',
    refKeys: ['o2_referencia', 'O2_referencia'],
    foundKeys: ['o2_encontrado', 'O2_encontrado'],
    cylinderKeys: ['o2_cilindro', 'O2_cilindro'],
  },
  {
    key: 'H2S',
    label: 'H²S',
    unit: 'ppm',
    cylinderUnit: 'ppm',
    decimals: 0,
    toleranceKey: 'H2S',
    refKeys: ['h2s_referencia', 'H2S_referencia'],
    foundKeys: ['h2s_encontrado', 'H2S_encontrado'],
    cylinderKeys: ['h2s_cilindro', 'H2S_cilindro'],
  },
  {
    key: 'CO',
    label: 'CO',
    unit: 'ppm',
    cylinderUnit: 'ppm',
    decimals: 0,
    toleranceKey: 'CO',
    refKeys: ['co_referencia', 'CO_referencia'],
    foundKeys: ['co_encontrado', 'CO_encontrado'],
    cylinderKeys: ['co_cilindro', 'CO_cilindro'],
  },
];

/** @see mapInspectionForPdfImpl em ./pdf/inspectionMapper.ts */
export function mapInspectionForPdf(
  inspectionData: Record<string, unknown>,
  equipmentType?: string
): InspectionData {
  return mapInspectionForPdfImpl(inspectionData, equipmentType);
}

function ensurePageSpace(doc: jsPDF, yPos: number, needed = 40): number {
  if (yPos > PAGE_HEIGHT - needed) {
    doc.addPage();
    return PAGE_MARGINS.TOP;
  }
  return yPos;
}

function readMultigasNumber(source: Record<string, unknown>, ...keys: string[]): number | undefined {
  for (const key of keys) {
    const value = source[key];
    if (value !== null && value !== undefined && value !== '') {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
  }
  return undefined;
}

function formatMultigasNumber(value: number | undefined, decimals: number): string {
  if (value === undefined) return '-';
  return decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
}

/**
 * Converte uma imagem (blob) para PNG via Canvas.
 * Necessário para formatos que o jsPDF não suporta nativamente (WebP, AVIF).
 * Retorna um data URL PNG + o formato 'PNG'.
 */
async function convertImageToPng(blob: Blob): Promise<{ dataUrl: string; format: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Não foi possível criar canvas context'));
        return;
      }
      ctx.drawImage(img, 0, 0);
      // Converte para PNG (formato universalmente suportado pelo jsPDF)
      const dataUrl = canvas.toDataURL('image/png');
      resolve({ dataUrl, format: 'PNG' });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Falha ao carregar imagem para conversão'));
    };

    img.src = url;
  });
}

/**
 * Converte uma URL de imagem para PNG embutível no jsPDF.
 * WebP/AVIF (compressão do storage) e JPEG/PNG passam pelo canvas para garantir compatibilidade.
 */
async function imageUrlToBase64WithFormat(url: string): Promise<{ dataUrl: string; format: string } | null> {
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error('Timeout ao carregar imagem')), 15000);
  });

  try {
    const blob = await Promise.race([fetchPhotoBlobForEmbed(url), timeoutPromise]);

    if (!blob) {
      logger.warn('Foto não pôde ser baixada para o PDF', 'pdf', { url });
      return null;
    }

    if (blob.size > 5 * 1024 * 1024) {
      logger.warn('Imagem muito grande, pode causar problemas de memória no Android', 'pdf', {
        size: blob.size,
      });
    }

    return await convertImageToPng(blob);
  } catch (error) {
    logger.error('Erro ao converter imagem para base64', 'pdf', { error, url });
    return null;
  }
}

/**
 * Converte uma URL de imagem para base64 (mantida para compatibilidade).
 * @deprecated Use imageUrlToBase64WithFormat para obter o formato correto.
 */
async function imageUrlToBase64(url: string): Promise<string> {
  const result = await imageUrlToBase64WithFormat(url);
  return result?.dataUrl ?? '';
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
function getEquipmentTypeName(type: string, customLabel?: string): string {
  return getTypeNameFromRegistry(type, customLabel);
}

function renderChecklistSections(
  doc: jsPDF,
  yPos: number,
  sections: ChecklistSection[],
  compact = false
): number {
  if (sections.length === 0) return yPos;

  for (const section of sections) {
    if (yPos > PAGE_HEIGHT - 60) {
      doc.addPage();
      yPos = PAGE_MARGINS.TOP;
    }
    if (section.title) {
      doc.setFontSize(compact ? 9 : 10);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(COLORS.BLACK);
      doc.text(section.title, PAGE_MARGINS.LEFT, yPos);
      yPos += compact ? 6 : 8;
    }
    const tableData = section.rows
      .filter((r) => r.item !== 'Observações')
      .map((r) => [r.item, r.status]);
    if (tableData.length > 0) {
      doc.autoTable({
        startY: yPos,
        head: [['Item Verificado', 'Status']],
        body: tableData,
        theme: 'striped',
        headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
        bodyStyles: { textColor: [0, 0, 0] },
        alternateRowStyles: { fillColor: [224, 224, 224] },
        margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT },
        styles: { fontSize: compact ? 8 : 9, cellPadding: compact ? 2 : 3 },
      });
      yPos = (doc as any).lastAutoTable.finalY + 5;
    }
    const obs = section.rows.find((r) => r.item === 'Observações');
    if (obs?.status) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'italic');
      doc.text(`Observações: ${obs.status}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 8;
    }
  }

  return yPos;
}

function renderChecklistTable(
  doc: jsPDF,
  yPos: number,
  resultados: Record<string, any>,
  options?: {
    compact?: boolean;
    sectioned?: boolean;
    equipmentType?: string;
    equipment?: Record<string, unknown>;
    inspection?: Record<string, unknown>;
  }
): number {
  const compact = options?.compact ?? false;

  if (options?.equipmentType && (options.equipmentType === 'camara_espuma' || options.equipmentType === 'canhao_monitor')) {
    const sections = resolveChecklistSections(
      options.equipmentType,
      resultados,
      options.equipment,
      options.inspection
    );
    return renderChecklistSections(doc, yPos, sections, compact);
  }

  const useSections = options?.sectioned ?? hasSectionedChecklist(resultados);
  const flatRows = flattenChecklistResults(resultados);

  if (flatRows.length === 0) return yPos;

  if (useSections) {
    return renderChecklistSections(doc, yPos, groupChecklistBySection(flatRows), compact);
  }

  const tableData = flatRows
    .filter((r) => r.item !== 'Observações')
    .map((r) => [r.item, r.status]);

  if (tableData.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Item Verificado', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [0, 0, 0], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [224, 224, 224] },
      margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT },
      styles: { fontSize: compact ? 8 : 9, cellPadding: compact ? 2 : 3 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 5;
  }

  return yPos;
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
  } else if (equipment.type === 'camara_espuma') {
    if (equipment.tipo_camara) {
      doc.text(`Tipo de Câmara: ${equipment.tipo_camara}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.modelo) {
      doc.text(`Modelo: ${equipment.modelo}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.numero_mcs) {
      doc.text(`Número MCS: ${equipment.numero_mcs}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.tamanho_especifico) {
      doc.text(`Tamanho: ${equipment.tamanho_especifico}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.marca) {
      doc.text(`Marca: ${equipment.marca}`, PAGE_MARGINS.LEFT, yPos);
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
  } else if (equipment.type === 'reserva_tecnica') {
    if (equipment.name) {
      doc.text(`Nome: ${equipment.name}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.code) {
      doc.text(`Código: ${equipment.code}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.reservoir_type) {
      doc.text(`Tipo de Reservatório: ${equipment.reservoir_type}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.product_type) {
      doc.text(`Tipo de Produto: ${equipment.product_type}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.capacity_m3 != null) {
      doc.text(`Capacidade: ${equipment.capacity_m3} m³`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.inspection_periodicity) {
      doc.text(`Periodicidade: ${equipment.inspection_periodicity}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
  } else if (equipment.type?.startsWith('custom-') && equipment.custom_fields) {
    const fields = equipment.custom_fields as Record<string, unknown>;
    for (const [key, value] of Object.entries(fields)) {
      if (value != null && value !== '') {
        doc.text(`${key}: ${String(value)}`, PAGE_MARGINS.LEFT, yPos);
        yPos += 7;
      }
    }
    if (equipment.marca) {
      doc.text(`Marca: ${equipment.marca}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
    }
    if (equipment.modelo) {
      doc.text(`Modelo: ${equipment.modelo}`, PAGE_MARGINS.LEFT, yPos);
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
function addInspectionInfo(
  doc: jsPDF,
  yPos: number,
  inspection: InspectionData,
  equipmentType?: string
): number {
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
    const tipoLabel =
      equipmentType === 'camara_espuma' || equipmentType === 'canhao_monitor'
        ? 'Tipo de Inspeção'
        : 'Tipo de Serviço';
    doc.text(`${tipoLabel}: ${inspection.tipo_servico || inspection.tipo_inspecao}`, PAGE_MARGINS.LEFT, yPos);
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

  const inspAny = inspection as Record<string, unknown>;
  if (inspAny.data_proxima_manutencao_2_nivel) {
    doc.text(
      `Próxima Manutenção 2º Nível: ${formatDateShort(String(inspAny.data_proxima_manutencao_2_nivel))}`,
      PAGE_MARGINS.LEFT,
      yPos
    );
    yPos += 7;
  }
  if (inspAny.data_proxima_manutencao_3_nivel) {
    doc.text(
      `Próxima Manutenção 3º Nível: ${formatDateShort(String(inspAny.data_proxima_manutencao_3_nivel))}`,
      PAGE_MARGINS.LEFT,
      yPos
    );
    yPos += 7;
  }
  if (inspAny.data_ultimo_ensaio_hidrostatico) {
    doc.text(
      `Último Ensaio Hidrostático: ${formatDateShort(String(inspAny.data_ultimo_ensaio_hidrostatico))}`,
      PAGE_MARGINS.LEFT,
      yPos
    );
    yPos += 7;
  }
  if (inspAny.resultado) {
    doc.text(`Resultado: ${inspAny.resultado}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;
  }

  if (inspection.latitude != null && inspection.longitude != null) {
    doc.text(
      `Coordenadas GPS: ${Number(inspection.latitude).toFixed(6)}, ${Number(inspection.longitude).toFixed(6)}`,
      PAGE_MARGINS.LEFT,
      yPos
    );
    yPos += 7;
  }

  yPos += 8;
  return yPos;
}

function addWaterReservoirInspectionSection(
  doc: jsPDF,
  yPos: number,
  inspection: InspectionData
): number {
  const insp = inspection as Record<string, unknown>;
  if (!insp.level_reading && !insp.condition) return yPos;

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('3. RESULTADOS NFPA 25', PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  const rows: string[][] = [];
  if (insp.inspection_type) rows.push(['Tipo de Inspeção', String(insp.inspection_type)]);
  if (insp.level_reading) rows.push(['Leitura de Nível', String(insp.level_reading)]);
  if (insp.condition) rows.push(['Condição', String(insp.condition)]);
  if (insp.suction_clean !== undefined) {
    rows.push(['Sucção Limpa', insp.suction_clean ? 'Sim' : 'Não']);
  }
  if (insp.overflow_clear !== undefined) {
    rows.push(['Transbordo Desobstruído', insp.overflow_clear ? 'Sim' : 'Não']);
  }
  if (insp.corrective_action_needed !== undefined) {
    rows.push(['Ação Corretiva Necessária', insp.corrective_action_needed ? 'Sim' : 'Não']);
  }

  if (rows.length > 0) {
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
  }

  return yPos;
}

/**
 * Adiciona resultados do checklist (se houver)
 */
function addChecklistResults(
  doc: jsPDF,
  yPos: number,
  resultados: Record<string, any>,
  equipmentType?: string,
  equipment?: Record<string, unknown>,
  inspection?: InspectionData
): number {
  if (!resultados || Object.keys(resultados).length === 0) {
    return yPos;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('4. RESULTADOS DA INSPEÇÃO', PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  const config = equipmentType ? getPdfConfig(equipmentType) : null;
  return renderChecklistTable(doc, yPos, resultados, {
    sectioned: config?.sectionedChecklist ?? hasSectionedChecklist(resultados),
    equipmentType,
    equipment,
    inspection: inspection as Record<string, unknown> | undefined,
  });
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
 * Adiciona resultados detalhados de medição multigas (formato completo)
 */
function addMultigasValues(doc: jsPDF, yPos: number, inspection: InspectionData, equipment: EquipmentData): number {
  if (equipment.type !== 'multigas') {
    return yPos;
  }

  const inspectionAny = inspection as Record<string, unknown>;
  const equipmentAny = equipment as Record<string, unknown>;
  const tolerances = resolveGasTolerances(equipment as MultigasDetector);

  const referenceValues: CylinderValues = {
    LEL: readMultigasNumber(inspectionAny, 'lel_referencia', 'LEL_referencia') ?? 0,
    O2: readMultigasNumber(inspectionAny, 'o2_referencia', 'O2_referencia') ?? 0,
    H2S: readMultigasNumber(inspectionAny, 'h2s_referencia', 'H2S_referencia') ?? 0,
    CO: readMultigasNumber(inspectionAny, 'co_referencia', 'CO_referencia') ?? 0,
  };

  const foundValues: CylinderValues = {
    LEL: readMultigasNumber(inspectionAny, 'lel_encontrado', 'LEL_encontrado') ?? 0,
    O2: readMultigasNumber(inspectionAny, 'o2_encontrado', 'O2_encontrado') ?? 0,
    H2S: readMultigasNumber(inspectionAny, 'h2s_encontrado', 'H2S_encontrado') ?? 0,
    CO: readMultigasNumber(inspectionAny, 'co_encontrado', 'CO_encontrado') ?? 0,
  };

  const hasReference = MULTIGAS_GAS_CONFIG.some(
    (gas) => readMultigasNumber(inspectionAny, ...gas.refKeys) !== undefined
  );
  if (!hasReference) {
    return yPos;
  }

  const tipoTeste =
    (inspectionAny.tipo_teste as string) ||
    inspection.tipo_servico ||
    inspection.tipo_inspecao ||
    'Periódico';
  const tipoTitulo = tipoTeste.toUpperCase();

  yPos = ensurePageSpace(doc, yPos, 120);
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text(`3. RESULTADOS DAS MEDIÇÕES — ${tipoTitulo}`, PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  // Valores cadastrados no cilindro
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Valores cadastrados no cilindro de calibração:', PAGE_MARGINS.LEFT, yPos);
  yPos += 6;

  const cylinderRows: string[][] = [];
  for (const gas of MULTIGAS_GAS_CONFIG) {
    const cylinderValue =
      readMultigasNumber(equipmentAny, ...gas.cylinderKeys) ??
      readMultigasNumber(inspectionAny, ...gas.refKeys);
    if (cylinderValue !== undefined) {
      cylinderRows.push([
        gas.label,
        `${formatMultigasNumber(cylinderValue, gas.decimals)} ${gas.cylinderUnit}`,
      ]);
    }
  }

  if (cylinderRows.length > 0) {
    doc.autoTable({
      startY: yPos,
      head: [['Gás', 'Valor de referência (cadastro)']],
      body: cylinderRows,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
      },
      bodyStyles: { textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [224, 224, 224] },
      margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT },
      styles: { fontSize: 9, cellPadding: 2 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  // Tabela de medições do teste
  const measurementRows: string[][] = [];
  for (const gas of MULTIGAS_GAS_CONFIG) {
    const ref = readMultigasNumber(inspectionAny, ...gas.refKeys);
    const found = readMultigasNumber(inspectionAny, ...gas.foundKeys);
    if (ref === undefined) continue;

    const tolerance = tolerances[gas.toleranceKey];
    const absDiff = found !== undefined ? found - ref : undefined;
    const pctDiff =
      found !== undefined && ref !== 0 ? ((found - ref) / ref) * 100 : undefined;
    const approved =
      found !== undefined && ref !== 0
        ? Math.abs(((found - ref) / ref) * 100) <= tolerance
        : false;

    const absText =
      absDiff === undefined
        ? '-'
        : absDiff >= 0
          ? `+${formatMultigasNumber(absDiff, gas.decimals)}`
          : formatMultigasNumber(absDiff, gas.decimals);
    const pctText =
      pctDiff === undefined
        ? '-'
        : pctDiff >= 0
          ? `+${pctDiff.toFixed(1)}%`
          : `${pctDiff.toFixed(1)}%`;

    measurementRows.push([
      gas.label,
      gas.unit,
      formatMultigasNumber(ref, gas.decimals),
      found !== undefined ? formatMultigasNumber(found, gas.decimals) : '-',
      absText,
      pctText,
      `±${tolerance}%`,
      approved ? 'Aprovado' : 'Reprovado',
    ]);
  }

  if (measurementRows.length > 0) {
    yPos = ensurePageSpace(doc, yPos, 80);
    doc.autoTable({
      startY: yPos,
      head: [['Gás', 'Unid.', 'Ref. teste', 'Leitura', 'Abs.', '%', 'Margem', 'Resultado']],
      body: measurementRows,
      theme: 'striped',
      headStyles: {
        fillColor: [0, 0, 0],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 7,
      },
      bodyStyles: { textColor: [0, 0, 0], fontSize: 7 },
      alternateRowStyles: { fillColor: [224, 224, 224] },
      margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT },
      styles: { fontSize: 7, cellPadding: 2 },
      columnStyles: {
        0: { cellWidth: 12 },
        1: { cellWidth: 14 },
        2: { cellWidth: 18 },
        3: { cellWidth: 18 },
        4: { cellWidth: 14 },
        5: { cellWidth: 14 },
        6: { cellWidth: 16 },
        7: { cellWidth: 22 },
      },
    });
    yPos = (doc as any).lastAutoTable.finalY + 8;
  }

  const bumpResult = verifyBumpTest(referenceValues, foundValues, tolerances);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Resumo por sensor:', PAGE_MARGINS.LEFT, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  for (const line of bumpResult.observations) {
    yPos = ensurePageSpace(doc, yPos, 20);
    const wrapped = doc.splitTextToSize(`• ${line}`, CONTENT_WIDTH);
    doc.text(wrapped, PAGE_MARGINS.LEFT, yPos);
    yPos += wrapped.length * 5 + 2;
  }

  const resultadoGeral =
    (inspectionAny.resultado_teste as string) ||
    inspection.status_geral ||
    (bumpResult.isApproved ? 'Aprovado' : 'Reprovado');
  yPos += 4;
  doc.setFont('helvetica', 'bold');
  doc.text(`Resultado geral do teste: ${resultadoGeral.toUpperCase()}`, PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  const plano =
    inspection.plano_de_acao ||
    generateMultigasActionPlan(resultadoGeral, tipoTeste);
  doc.text('Plano de ação:', PAGE_MARGINS.LEFT, yPos);
  yPos += 6;
  doc.setFont('helvetica', 'normal');
  const planoLines = doc.splitTextToSize(plano, CONTENT_WIDTH);
  doc.text(planoLines, PAGE_MARGINS.LEFT, yPos);
  yPos += planoLines.length * 5 + 10;

  return yPos;
}

/**
 * Adiciona seção de não conformidades identificadas
 */
function addNonConformities(doc: jsPDF, yPos: number, inspection: InspectionData): number {
  if (!inspection.resultados_json || Object.keys(inspection.resultados_json).length === 0) {
    return yPos;
  }

  const nonConformities = extractNonConformities(inspection.resultados_json);

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
function addObservations(
  doc: jsPDF,
  yPos: number,
  inspection: InspectionData,
  options?: { skipPlano?: boolean }
): number {
  const skipPlano = options?.skipPlano ?? false;
  let hasContent = false;

  if (inspection.observacoes_gerais || (!skipPlano && inspection.plano_de_acao)) {
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

  if (!skipPlano && inspection.plano_de_acao) {
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
 * Placeholder quando foto era esperada mas não foi anexada.
 */
function addPhotoPlaceholder(doc: jsPDF, yPos: number, message: string): number {
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('EVIDÊNCIAS FOTOGRÁFICAS', PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(COLORS.GRAY);
  doc.text(message, PAGE_MARGINS.LEFT, yPos);
  yPos += 12;

  return yPos;
}

/**
 * Adiciona foto da inspeção
 */
async function addPhoto(doc: jsPDF, yPos: number, photoUrl: string): Promise<number> {
  try {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.BLACK);
    doc.text('EVIDÊNCIAS FOTOGRÁFICAS', PAGE_MARGINS.LEFT, yPos);
    yPos += 8;

    // Verifica se há espaço na página
    if (yPos > PAGE_HEIGHT - 80) {
      doc.addPage();
      yPos = PAGE_MARGINS.TOP;
    }

    // Converte imagem para base64 com detecção de formato
    const imageData = await imageUrlToBase64WithFormat(photoUrl);
    if (!imageData || !imageData.dataUrl) {
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(COLORS.GRAY);
      doc.text('Foto não disponível', PAGE_MARGINS.LEFT, yPos);
      return yPos + 10;
    }

    // Dimensões da imagem (máximo 150mm de largura, proporção mantida)
    const maxWidth = 150;
    const maxHeight = 100;

    // Adiciona a imagem com o formato correto detectado
    try {
      doc.addImage(imageData.dataUrl, imageData.format, PAGE_MARGINS.LEFT, yPos, maxWidth, maxHeight);
    } catch (imgError) {
      logger.error('Erro ao adicionar imagem ao PDF', 'pdf', { error: imgError, format: imageData.format });
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
  yPos = addInspectionInfo(doc, yPos, data.inspection, data.equipment.type);

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

  // Resultados NFPA 25 (reserva técnica)
  if (data.equipment.type === 'reserva_tecnica') {
    yPos = addWaterReservoirInspectionSection(doc, yPos, data.inspection);
    if (yPos > PAGE_HEIGHT - 100) {
      doc.addPage();
      yPos = PAGE_MARGINS.TOP;
    }
  }

  // Resultados do checklist (se houver)
  if (data.inspection.resultados_json) {
    yPos = addChecklistResults(
      doc,
      yPos,
      data.inspection.resultados_json,
      data.equipment.type,
      data.equipment as Record<string, unknown>,
      data.inspection
    );
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

  // Observações e plano de ação (plano multigas fica na seção 3)
  yPos = addObservations(doc, yPos, data.inspection, {
    skipPlano: data.equipment.type === 'multigas',
  });

  // Foto (se houver) - otimizado para Android
  const inspAny = data.inspection as Record<string, unknown>;
  const requiresPhotoEvidence =
    data.equipment.type === 'camara_espuma' && inspAny.tipo_inspecao === 'Funcional Anual';

  if (data.inspection.link_foto_nao_conformidade) {
    yPos = await addPhoto(doc, yPos, data.inspection.link_foto_nao_conformidade);
  } else if (requiresPhotoEvidence) {
    yPos = addPhotoPlaceholder(doc, yPos, 'Foto do teste funcional não anexada à inspeção.');
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

    if (data.equipment.type === 'multigas') {
      yPos = addMultigasValues(doc, yPos, inspection, data.equipment);
    }

    if (data.equipment.type === 'extintor') {
      yPos = addCo2WeighingSection(doc, yPos, inspection);
    }

    if (data.equipment.type === 'reserva_tecnica') {
      yPos = addWaterReservoirInspectionSection(doc, yPos, inspection);
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

    if (!data.equipment.type || data.equipment.type !== 'multigas') {
      if (inspection.plano_de_acao) {
        doc.setFont('helvetica', 'bold');
        doc.text('Plano de Ação:', PAGE_MARGINS.LEFT, yPos);
        yPos += 7;
        doc.setFont('helvetica', 'normal');
        const planoLines = doc.splitTextToSize(inspection.plano_de_acao, CONTENT_WIDTH);
        doc.text(planoLines, PAGE_MARGINS.LEFT, yPos);
        yPos += planoLines.length * 6 + 8;
      }
    }

    // Resultados do checklist (se houver)
    if (inspection.resultados_json && Object.keys(inspection.resultados_json).length > 0) {
      doc.setFont('helvetica', 'bold');
      doc.text('Resultados:', PAGE_MARGINS.LEFT, yPos);
      yPos += 7;
      doc.setFont('helvetica', 'normal');
      yPos = renderChecklistTable(doc, yPos, inspection.resultados_json, {
        compact: true,
        sectioned:
          getPdfConfig(data.equipment.type)?.sectionedChecklist ??
          hasSectionedChecklist(inspection.resultados_json),
        equipmentType: data.equipment.type,
        equipment: data.equipment as Record<string, unknown>,
        inspection: inspection as Record<string, unknown>,
      });
    }

    const inspMulti = inspection as Record<string, unknown>;
    const requiresPhotoEvidence =
      data.equipment.type === 'camara_espuma' && inspMulti.tipo_inspecao === 'Funcional Anual';

    // Foto (se houver) - otimizado para Android
    if (inspection.link_foto_nao_conformidade) {
      if (yPos > PAGE_HEIGHT - 100) {
        doc.addPage();
        yPos = PAGE_MARGINS.TOP;
      }
      yPos = await addPhoto(doc, yPos, inspection.link_foto_nao_conformidade);
    } else if (requiresPhotoEvidence) {
      if (yPos > PAGE_HEIGHT - 100) {
        doc.addPage();
        yPos = PAGE_MARGINS.TOP;
      }
      yPos = addPhotoPlaceholder(doc, yPos, 'Foto do teste funcional não anexada à inspeção.');
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
  _equipmentType?: string;
  _has_last_inspection?: boolean;
  _last_inspection_date?: string | null;
  _last_inspection_status?: string | null;
  _last_inspection_type?: string | null;
  _last_inspector?: string | null;
  resultados_json?: Record<string, unknown> | null;
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
  tipo_inspecao?: string;
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

function formatInventoryExtraInfo(item: EquipmentListReportItem, equipmentType?: string): string {
  if (equipmentType) {
    return formatInventoryExtraFromRegistry(item, equipmentType);
  }
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

  const imageData = await imageUrlToBase64WithFormat(photoUrl);
  if (!imageData || !imageData.dataUrl) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text('Foto não disponível', PAGE_MARGINS.LEFT, yPos);
    return yPos + 10;
  }

  const maxWidth = 120;
  const maxHeight = 80;

  try {
    doc.addImage(imageData.dataUrl, imageData.format, PAGE_MARGINS.LEFT, yPos, maxWidth, maxHeight);
    yPos += maxHeight + 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text(`Evidência fotográfica - ${equipmentId}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 8;
  } catch (imgError) {
    logger.error('Erro ao adicionar imagem ao relatório de inventário', 'pdf', { error: imgError, format: imageData.format });
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
  equipmentList: EquipmentListReportItem[],
  equipmentType: string
): Promise<number> {
  const itemsWithDetails = equipmentList.filter((item) => shouldShowInventoryDetails(item));

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

    const summaryLines = formatInventoryInspectionSummary(item);
    if (summaryLines.length > 0) {
      doc.setFontSize(9);
      doc.setFont('helvetica', 'normal');
      for (const line of summaryLines) {
        doc.text(line, PAGE_MARGINS.LEFT, yPos);
        yPos += 5;
      }
      yPos += 3;
    }

    if (item.resultados_json && typeof item.resultados_json === 'object') {
      const config = equipmentType.startsWith('custom-')
        ? getCustomPdfConfig(equipmentType)
        : getPdfConfig(equipmentType);
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('Checklist da última inspeção:', PAGE_MARGINS.LEFT, yPos);
      yPos += 6;
      yPos = renderChecklistTable(doc, yPos, item.resultados_json as Record<string, any>, {
        compact: true,
        sectioned: config?.sectionedChecklist,
        equipmentType,
        equipment: item,
        inspection: {
          tipo_inspecao: item._last_inspection_type || item.tipo_inspecao,
        },
      });
      yPos += 4;
    }

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

  const tableData = equipmentList.map((item, index) =>
    buildInventoryTableRow({ ...item, _equipmentType: equipmentType }, index, equipmentType)
  );

  doc.autoTable({
    startY: yPos,
    head: [getInventoryTableHead(equipmentType)],
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
    columnStyles: getInventoryColumnStyles(equipmentType),
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;
  await addInventoryDetailsAndEvidence(doc, yPos, equipmentList, equipmentType);

  return doc.output('blob');
}

const LANDSCAPE_PAGE_WIDTH = 297;
const LANDSCAPE_PAGE_HEIGHT = 210;
const LANDSCAPE_CONTENT_WIDTH =
  LANDSCAPE_PAGE_WIDTH - PAGE_MARGINS.LEFT - PAGE_MARGINS.RIGHT;

function addMonthlyExtinguisherHeader(
  doc: jsPDF,
  monthYYYYMM: string
): number {
  let yPos = PAGE_MARGINS.TOP;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  const title = 'RELATÓRIO MENSAL DE INSPEÇÕES - EXTINTORES';
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, PAGE_MARGINS.LEFT + (LANDSCAPE_CONTENT_WIDTH - titleWidth) / 2, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const generatedAt = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const generatedText = `Gerado em: ${generatedAt}`;
  const generatedWidth = doc.getTextWidth(generatedText);
  doc.text(generatedText, PAGE_MARGINS.LEFT + (LANDSCAPE_CONTENT_WIDTH - generatedWidth) / 2, yPos);
  yPos += 6;

  const monthLabel = format(
    parse(`${monthYYYYMM}-01`, 'yyyy-MM-dd', new Date()),
    "MMMM 'de' yyyy",
    { locale: ptBR }
  );
  const periodText = `Inspeções realizadas em ${monthLabel}`;
  const periodWidth = doc.getTextWidth(periodText);
  doc.text(periodText, PAGE_MARGINS.LEFT + (LANDSCAPE_CONTENT_WIDTH - periodWidth) / 2, yPos);
  yPos += 8;

  doc.setDrawColor(COLORS.GRAY);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGINS.LEFT, yPos, PAGE_MARGINS.LEFT + LANDSCAPE_CONTENT_WIDTH, yPos);
  yPos += 10;

  return yPos;
}

function addMonthlyExtinguisherSignature(
  doc: jsPDF,
  yPos: number,
  responsibleName?: string
): number {
  if (yPos > LANDSCAPE_PAGE_BOTTOM - 40) {
    doc.addPage();
    yPos = PAGE_MARGINS.TOP;
  }

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('ASSINATURA DO RESPONSÁVEL', PAGE_MARGINS.LEFT, yPos);
  yPos += 10;

  doc.setDrawColor(COLORS.BLACK);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGINS.LEFT, yPos, PAGE_MARGINS.LEFT + 80, yPos);
  yPos += 8;

  if (responsibleName) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(responsibleName, PAGE_MARGINS.LEFT, yPos);
    yPos += 6;
  }

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(COLORS.GRAY);
  const today = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  doc.text(`Data: ${today}`, PAGE_MARGINS.LEFT, yPos);
  yPos += 12;

  return yPos;
}

const LANDSCAPE_PAGE_BOTTOM = LANDSCAPE_PAGE_HEIGHT - PAGE_MARGINS.BOTTOM;

function ensureLandscapeSpace(doc: jsPDF, yPos: number, requiredHeight: number): number {
  if (yPos + requiredHeight > LANDSCAPE_PAGE_BOTTOM) {
    doc.addPage();
    return PAGE_MARGINS.TOP;
  }
  return yPos;
}

function addMonthlyEvidenceTextBlock(
  doc: jsPDF,
  yPos: number,
  label: string,
  text: string
): number {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const lines = doc.splitTextToSize(text, LANDSCAPE_CONTENT_WIDTH);
  const blockHeight = 5 + lines.length * 4 + 4;
  yPos = ensureLandscapeSpace(doc, yPos, blockHeight);

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text(`${label}:`, PAGE_MARGINS.LEFT, yPos);
  yPos += 5;

  doc.setFont('helvetica', 'normal');
  doc.text(lines, PAGE_MARGINS.LEFT, yPos);
  yPos += lines.length * 4 + 4;

  return yPos;
}

function hasMonthlyEvidenceDetails(row: MonthlyExtinguisherReportRow): boolean {
  return Boolean(
    row.link_foto_nao_conformidade ||
      row.observacoes?.trim() ||
      row.plano_de_acao?.trim()
  );
}

async function addMonthlyExtinguisherDetailsAndEvidence(
  doc: jsPDF,
  yPos: number,
  rows: MonthlyExtinguisherReportRow[]
): Promise<number> {
  const itemsWithDetails = rows.filter(hasMonthlyEvidenceDetails);
  if (itemsWithDetails.length === 0) return yPos;

  yPos = ensureLandscapeSpace(doc, yPos, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('DETALHES E EVIDÊNCIAS', PAGE_MARGINS.LEFT, yPos);
  yPos += 10;

  for (const row of itemsWithDetails) {
    yPos = ensureLandscapeSpace(doc, yPos, 40);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.BLACK);
    doc.text(`Equipamento: ${row.numero_identificacao}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;

    if (row.observacoes?.trim()) {
      yPos = addMonthlyEvidenceTextBlock(doc, yPos, 'Observações', row.observacoes.trim());
    }

    if (row.plano_de_acao?.trim()) {
      yPos = addMonthlyEvidenceTextBlock(doc, yPos, 'Plano de Ação', row.plano_de_acao.trim());
    }

    if (row.link_foto_nao_conformidade) {
      yPos = await addMonthlyReportPhoto(
        doc,
        yPos,
        row.link_foto_nao_conformidade,
        row.numero_identificacao
      );
    }

    yPos += 4;
    doc.setDrawColor(COLORS.LIGHT_GRAY);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGINS.LEFT, yPos, PAGE_MARGINS.LEFT + LANDSCAPE_CONTENT_WIDTH, yPos);
    yPos += 8;
  }

  return yPos;
}

async function addMonthlyReportPhoto(
  doc: jsPDF,
  yPos: number,
  photoUrl: string,
  equipmentId: string
): Promise<number> {
  const maxWidth = 120;
  const maxHeight = 80;
  const blockHeight = maxHeight + 14;

  yPos = ensureLandscapeSpace(doc, yPos, blockHeight);

  const imageData = await imageUrlToBase64WithFormat(photoUrl);
  if (!imageData || !imageData.dataUrl) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text('Foto não disponível', PAGE_MARGINS.LEFT, yPos);
    return yPos + 10;
  }

  try {
    doc.addImage(imageData.dataUrl, imageData.format, PAGE_MARGINS.LEFT, yPos, maxWidth, maxHeight);
    yPos += maxHeight + 4;
    doc.setFontSize(8);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text(`Evidência fotográfica - ${equipmentId}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 8;
  } catch (imgError) {
    logger.error('Erro ao adicionar foto ao relatório mensal', 'pdf', { error: imgError, format: imageData.format });
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text('Foto não pôde ser adicionada', PAGE_MARGINS.LEFT, yPos);
    yPos += 10;
  }

  return yPos;
}

function hasMonthlyRowEvidence(row: MonthlyReportRow | MonthlyExtinguisherReportRow): boolean {
  return Boolean(
    row.link_foto_nao_conformidade ||
      row.observacoes?.trim() ||
      row.plano_de_acao?.trim()
  );
}

function getMonthlyRowEquipmentId(row: MonthlyReportRow | MonthlyExtinguisherReportRow): string {
  if ('equipmentId' in row) return row.equipmentId;
  return (row as MonthlyExtinguisherReportRow).numero_identificacao;
}

async function addGenericMonthlyDetailsAndEvidence(
  doc: jsPDF,
  yPos: number,
  rows: Array<MonthlyReportRow | MonthlyExtinguisherReportRow>
): Promise<number> {
  const itemsWithDetails = rows.filter(hasMonthlyRowEvidence);
  if (itemsWithDetails.length === 0) return yPos;

  yPos = ensureLandscapeSpace(doc, yPos, 20);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text('DETALHES E EVIDÊNCIAS', PAGE_MARGINS.LEFT, yPos);
  yPos += 10;

  for (const row of itemsWithDetails) {
    yPos = ensureLandscapeSpace(doc, yPos, 40);

    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.BLACK);
    doc.text(`Equipamento: ${getMonthlyRowEquipmentId(row)}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 7;

    if (row.observacoes?.trim()) {
      yPos = addMonthlyEvidenceTextBlock(doc, yPos, 'Observações', row.observacoes.trim());
    }

    if (row.plano_de_acao?.trim()) {
      yPos = addMonthlyEvidenceTextBlock(doc, yPos, 'Plano de Ação', row.plano_de_acao.trim());
    }

    if (row.link_foto_nao_conformidade) {
      yPos = await addMonthlyReportPhoto(
        doc,
        yPos,
        row.link_foto_nao_conformidade,
        getMonthlyRowEquipmentId(row)
      );
    }

    yPos += 4;
    doc.setDrawColor(COLORS.LIGHT_GRAY);
    doc.setLineWidth(0.3);
    doc.line(PAGE_MARGINS.LEFT, yPos, PAGE_MARGINS.LEFT + LANDSCAPE_CONTENT_WIDTH, yPos);
    yPos += 8;
  }

  return yPos;
}

function addGenericMonthlyHeader(doc: jsPDF, typeName: string, monthYYYYMM: string): number {
  let yPos = PAGE_MARGINS.TOP;

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  const title = `RELATÓRIO MENSAL DE INSPEÇÕES - ${typeName.toUpperCase()}`;
  const titleWidth = doc.getTextWidth(title);
  doc.text(title, PAGE_MARGINS.LEFT + (LANDSCAPE_CONTENT_WIDTH - titleWidth) / 2, yPos);
  yPos += 10;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const generatedAt = format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
  const generatedText = `Gerado em: ${generatedAt}`;
  const generatedWidth = doc.getTextWidth(generatedText);
  doc.text(generatedText, PAGE_MARGINS.LEFT + (LANDSCAPE_CONTENT_WIDTH - generatedWidth) / 2, yPos);
  yPos += 6;

  const monthLabel = format(
    parse(`${monthYYYYMM}-01`, 'yyyy-MM-dd', new Date()),
    "MMMM 'de' yyyy",
    { locale: ptBR }
  );
  const periodText = `Inspeções realizadas em ${monthLabel}`;
  const periodWidth = doc.getTextWidth(periodText);
  doc.text(periodText, PAGE_MARGINS.LEFT + (LANDSCAPE_CONTENT_WIDTH - periodWidth) / 2, yPos);
  yPos += 8;

  doc.setDrawColor(COLORS.GRAY);
  doc.setLineWidth(0.5);
  doc.line(PAGE_MARGINS.LEFT, yPos, PAGE_MARGINS.LEFT + LANDSCAPE_CONTENT_WIDTH, yPos);
  yPos += 10;

  return yPos;
}

function buildMonthlyColumnStyles(columns: MonthlyColumnDef[]): Record<number, { cellWidth: number | 'auto' }> {
  const styles: Record<number, { cellWidth: number | 'auto' }> = { 0: { cellWidth: 8 } };
  columns.forEach((col, index) => {
    styles[index + 1] = { cellWidth: col.width ?? 'auto' };
  });
  return styles;
}

/**
 * Gera relatório mensal genérico (A4 paisagem, ABNT) para qualquer tipo configurado.
 */
export async function generateMonthlyReport(
  rows: MonthlyReportRow[],
  columns: MonthlyColumnDef[],
  typeName: string,
  monthYYYYMM: string,
  responsibleName?: string
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true,
  });

  let yPos = addGenericMonthlyHeader(doc, typeName, monthYYYYMM);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text(
    `INSPEÇÕES DO PERÍODO (${rows.length} equipamento(s) inspecionado(s))`,
    PAGE_MARGINS.LEFT,
    yPos
  );
  yPos += 8;

  const tableData = rows.map((row, index) => [String(index + 1), ...row.cells]);

  doc.autoTable({
    startY: yPos,
    head: [['#', ...columns.map((c) => c.header)]],
    body: tableData,
    theme: 'striped',
    headStyles: {
      fillColor: [0, 0, 0],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
    },
    bodyStyles: { textColor: [0, 0, 0] },
    alternateRowStyles: { fillColor: [224, 224, 224] },
    margin: { left: PAGE_MARGINS.LEFT, right: PAGE_MARGINS.RIGHT },
    styles: { fontSize: 7, cellPadding: 2, overflow: 'linebreak' },
    columnStyles: buildMonthlyColumnStyles(columns),
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;
  yPos = await addGenericMonthlyDetailsAndEvidence(doc, yPos, rows);
  addMonthlyExtinguisherSignature(doc, yPos, responsibleName);

  return doc.output('blob');
}

/**
 * Gera relatório mensal de inspeções de extintores (A4 paisagem, ABNT).
 */
export async function generateMonthlyExtinguisherReport(
  rows: MonthlyExtinguisherReportRow[],
  monthYYYYMM: string,
  responsibleName?: string
): Promise<Blob> {
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
    putOnlyUsedFonts: true,
    compress: true,
  });

  let yPos = addMonthlyExtinguisherHeader(doc, monthYYYYMM);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.BLACK);
  doc.text(
    `INSPEÇÕES DO PERÍODO (${rows.length} extintor(es) inspecionado(s))`,
    PAGE_MARGINS.LEFT,
    yPos
  );
  yPos += 8;

  const tableData = rows.map((row, index) => [
    String(index + 1),
    row.numero_identificacao,
    row.tipo_agente || '—',
    formatCapacityDisplay(row.tipo_agente, row.capacidade),
    row.localizacao,
    formatDateShort(row.data_servico),
    row.status,
    row.pesoCo2Display,
    row.inspetor,
  ]);

  doc.autoTable({
    startY: yPos,
    head: [['#', 'ID', 'Agente', 'Cap.', 'Localização', 'Data', 'Status', 'Peso CO₂', 'Inspetor']],
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
      fontSize: 7,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 22 },
      2: { cellWidth: 22 },
      3: { cellWidth: 14 },
      4: { cellWidth: 38 },
      5: { cellWidth: 18 },
      6: { cellWidth: 22 },
      7: { cellWidth: 28 },
      8: { cellWidth: 'auto' },
    },
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;
  yPos = await addMonthlyExtinguisherDetailsAndEvidence(doc, yPos, rows);
  addMonthlyExtinguisherSignature(doc, yPos, responsibleName);

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

