/**
 * Utilitário para geração de relatórios em PDF no formato ABNT
 * Cores: branco, cinza e preto
 */

import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

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
 */
async function imageUrlToBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
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
    console.error('Erro ao converter imagem para base64:', error);
    return '';
  }
}

/**
 * Formata data no padrão brasileiro
 */
function formatDate(dateString: string): string {
  try {
    const date = new Date(dateString);
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
    const date = new Date(dateString);
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
  doc.text('1. DADOS DO EQUIPAMENTO', PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  
  const equipmentType = getEquipmentTypeName(equipment.type);
  doc.text(`Tipo: ${equipmentType}`, PAGE_MARGINS.LEFT, yPos);
  yPos += 6;

  doc.text(`Identificação: ${equipment.name}`, PAGE_MARGINS.LEFT, yPos);
  yPos += 6;

  if (equipment.location) {
    doc.text(`Localização: ${equipment.location}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 6;
  }

  // Informações adicionais específicas por tipo
  if (equipment.type === 'extintor') {
    if (equipment.tipo_agente) {
      doc.text(`Agente Extintor: ${equipment.tipo_agente}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 6;
    }
    if (equipment.capacidade) {
      doc.text(`Capacidade: ${equipment.capacidade} kg`, PAGE_MARGINS.LEFT, yPos);
      yPos += 6;
    }
    if (equipment.numero_selo_inmetro) {
      doc.text(`Selo Inmetro: ${equipment.numero_selo_inmetro}`, PAGE_MARGINS.LEFT, yPos);
      yPos += 6;
    }
  }

  yPos += 5;
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
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  if (inspection.data_inspecao) {
    doc.text(`Data da Inspeção: ${formatDate(inspection.data_inspecao)}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 6;
  }

  if (inspection.tipo_servico || inspection.tipo_inspecao) {
    doc.text(`Tipo de Serviço: ${inspection.tipo_servico || inspection.tipo_inspecao}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 6;
  }

  if (inspection.inspetor) {
    doc.text(`Inspetor Responsável: ${inspection.inspetor}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 6;
  }

  if (inspection.status_geral) {
    doc.setFont('helvetica', 'bold');
    const statusText = `Status: ${inspection.status_geral.toUpperCase()}`;
    doc.text(statusText, PAGE_MARGINS.LEFT, yPos);
    yPos += 6;
    doc.setFont('helvetica', 'normal');
  }

  if (inspection.data_proxima_inspecao) {
    doc.text(`Próxima Inspeção: ${formatDate(inspection.data_proxima_inspecao)}`, PAGE_MARGINS.LEFT, yPos);
    yPos += 6;
  }

  yPos += 5;
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
  doc.text('3. RESULTADOS DA INSPEÇÃO', PAGE_MARGINS.LEFT, yPos);
  yPos += 8;

  // Prepara dados para tabela
  const tableData: string[][] = [];
  for (const [key, value] of Object.entries(resultados)) {
    const status = value === true || value === 'sim' || value === 'Sim' ? 'Conforme' : 
                   value === false || value === 'não' || value === 'Não' ? 'Não Conforme' : 
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
 * Adiciona observações e plano de ação
 */
function addObservations(doc: jsPDF, yPos: number, inspection: InspectionData): number {
  let hasContent = false;

  if (inspection.observacoes_gerais || inspection.plano_de_acao) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.BLACK);
    doc.text('4. OBSERVAÇÕES E PLANO DE AÇÃO', PAGE_MARGINS.LEFT, yPos);
    yPos += 8;
    hasContent = true;
  }

  if (inspection.observacoes_gerais) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Observações Gerais:', PAGE_MARGINS.LEFT, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(inspection.observacoes_gerais, CONTENT_WIDTH);
    doc.text(lines, PAGE_MARGINS.LEFT, yPos);
    yPos += lines.length * 5 + 5;
  }

  if (inspection.plano_de_acao) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Plano de Ação:', PAGE_MARGINS.LEFT, yPos);
    yPos += 6;

    doc.setFont('helvetica', 'normal');
    const lines = doc.splitTextToSize(inspection.plano_de_acao, CONTENT_WIDTH);
    doc.text(lines, PAGE_MARGINS.LEFT, yPos);
    yPos += lines.length * 5 + 5;
  }

  return hasContent ? yPos : yPos - 8;
}

/**
 * Adiciona foto da inspeção
 */
async function addPhoto(doc: jsPDF, yPos: number, photoUrl: string): Promise<number> {
  try {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.BLACK);
    doc.text('5. EVIDÊNCIAS FOTOGRÁFICAS', PAGE_MARGINS.LEFT, yPos);
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

    // Adiciona a imagem
    doc.addImage(base64Image, 'JPEG', PAGE_MARGINS.LEFT, yPos, maxWidth, maxHeight);
    yPos += maxHeight + 10;

    // Legenda
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(COLORS.GRAY);
    doc.text('Foto de evidência da inspeção', PAGE_MARGINS.LEFT, yPos);
    yPos += 8;

    return yPos;
  } catch (error) {
    console.error('Erro ao adicionar foto:', error);
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
  doc.text('6. ASSINATURA DO RESPONSÁVEL', PAGE_MARGINS.LEFT, yPos);
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
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
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

  // Resultados do checklist (se houver)
  if (data.inspection.resultados_json) {
    yPos = addChecklistResults(doc, yPos, data.inspection.resultados_json);
  }

  // Verifica se precisa de nova página
  if (yPos > PAGE_HEIGHT - 100) {
    doc.addPage();
    yPos = PAGE_MARGINS.TOP;
  }

  // Observações e plano de ação
  yPos = addObservations(doc, yPos, data.inspection);

  // Foto (se houver)
  if (data.inspection.link_foto_nao_conformidade) {
    yPos = await addPhoto(doc, yPos, data.inspection.link_foto_nao_conformidade);
  }

  // Assinatura
  yPos = addSignature(doc, yPos, data.responsibleName);

  // Gera o blob do PDF
  const pdfBlob = doc.output('blob');
  return pdfBlob;
}

/**
 * Salva o PDF no dispositivo (Android/iOS)
 */
export async function savePdfToDevice(pdfBlob: Blob, filename: string): Promise<void> {
  try {
    const { Filesystem, Directory, Encoding, Share } = await import('@capacitor/filesystem');
    const { Capacitor } = await import('@capacitor/core');

    if (Capacitor.isNativePlatform() && Filesystem && Share) {
      // Converte blob para base64
      const arrayBuffer = await pdfBlob.arrayBuffer();
      const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));

      // Salva o arquivo
      const result = await Filesystem.writeFile({
        path: filename,
        data: base64,
        directory: Directory.Documents,
        encoding: Encoding.UTF8,
      });

      // Tenta compartilhar o arquivo
      try {
        await Share.share({
          title: 'Relatório de Inspeção',
          text: 'Relatório de inspeção gerado',
          url: result.uri,
          dialogTitle: 'Compartilhar relatório',
        });
      } catch (shareError) {
        // Se não conseguir compartilhar, apenas salva
        console.log('Arquivo salvo em:', result.uri);
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
    console.error('Erro ao salvar PDF:', error);
    throw error;
  }
}

