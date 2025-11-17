/**
 * Utilitários para inspeção por QR Code
 * Suporta:
 * - Formato industrial: '2#7036#EXT#008851#47#31' -> extrai '8851'
 * - Formato apenas número: '8851' ou '008851' -> retorna '8851' (remove zeros à esquerda)
 * - Formato simples: 'ID-EXT-007' -> retorna 'ID-EXT-007'
 */

/**
 * Analisa o conteúdo de um QR Code para extrair o ID principal do equipamento.
 * 
 * - Lida com o formato industrial: '2#7036#EXT#008851#47#31' -> '8851'
 * - Lida com apenas o número: '8851' ou '008851' -> '8851' (remove zeros à esquerda)
 * - Lida com o formato simples: 'ID-EXT-007' -> 'ID-EXT-007'
 * 
 * @param qrString - String lida do QR Code
 * @returns O ID extraído (sem zeros à esquerda) ou a string original em caso de falha
 */
export function parseQrCodeData(qrString: string): string {
  if (!qrString || !qrString.trim()) {
    return '';
  }

  const trimmed = qrString.trim();

  // Verifica se é o formato industrial (contém '#')
  if (trimmed.includes('#')) {
    try {
      const parts = trimmed.split('#');
      
      // O ID do cilindro é o quarto elemento (índice 3)
      if (parts.length >= 4) {
        const cylinderIdWithZeros = parts[3];
        
        // Converte para inteiro para remover os zeros à esquerda
        const parsedNumber = parseInt(cylinderIdWithZeros, 10);
        
        // Verifica se a conversão foi válida (não é NaN)
        if (isNaN(parsedNumber)) {
          // Se não conseguiu converter para número, retorna o dado bruto
          return trimmed;
        }
        
        // Retorna como string sem zeros à esquerda
        return String(parsedNumber);
      } else {
        // Formato inválido, retorna o dado bruto para depuração
        return trimmed;
      }
    } catch (error) {
      // Se a conversão para int falhar ou não houver 4 partes, retorna o dado bruto
      console.warn('Erro ao fazer parsing do QR code:', error);
      return trimmed;
    }
  } else {
    // Se não contém '#', verifica se é apenas um número (com ou sem zeros à esquerda)
    // Exemplos: '8851', '008851', '12345'
    const isOnlyNumbers = /^\d+$/.test(trimmed);
    
    if (isOnlyNumbers) {
      // É apenas números, remove zeros à esquerda
      const parsedNumber = parseInt(trimmed, 10);
      
      if (!isNaN(parsedNumber)) {
        return String(parsedNumber);
      }
    }
    
    // Se não é apenas números, retorna como está (formato simples como 'ID-EXT-007')
    return trimmed;
  }
}

/**
 * Valida se uma string parece ser um QR code no formato industrial
 * @param qrString - String a ser validada
 * @returns true se parece ser formato industrial
 */
export function isIndustrialQrFormat(qrString: string): boolean {
  if (!qrString) return false;
  return qrString.includes('#') && qrString.split('#').length >= 4;
}

/**
 * Interface para dados do extintor usados na geração de QR Code
 */
export interface ExtinguisherQrData {
  numero_identificacao: string;
  tipo_agente?: string;
  capacidade?: number;
  localizacao?: string;
}

/**
 * Constrói a string no formato industrial a partir dos dados de um equipamento.
 * Exemplo de saída: '2#7036#EXT#008851#47#31'
 * 
 * @param equipmentData - Dados do extintor
 * @param locationCode - Código de local/planta (padrão: "7036")
 * @returns A string formatada para ser usada no QR Code
 */
export function buildIndustrialQrString(
  equipmentData: ExtinguisherQrData,
  locationCode: string = "7036"
): string {
  // Campo 1: Tipo de Equipamento (2 = Extintor)
  const typeCode = "2";

  // Campo 2: Código de Local/Planta
  const locCode = locationCode || "7036";

  // Campo 3: Tipo de Agente (primeiras 3 letras, maiúsculas)
  // Exemplos: "ABC", "CO2", "PQS"
  const agentType = equipmentData.tipo_agente
    ? equipmentData.tipo_agente.substring(0, 3).toUpperCase().padEnd(3, 'X')
    : "EXT";

  // Campo 4: ID do Cilindro, com zeros à esquerda para ter 6 dígitos
  const cylinderId = String(equipmentData.numero_identificacao || '0').padStart(6, '0');

  // Campo 5: Capacidade (como inteiro)
  const capacity = String(Math.floor(equipmentData.capacidade || 0));

  // Campo 6: Valor padrão (pode ser customizado no futuro)
  const placeholder2 = "31";

  // Junta todas as partes com o delimitador '#'
  return `${typeCode}#${locCode}#${agentType}#${cylinderId}#${capacity}#${placeholder2}`;
}

