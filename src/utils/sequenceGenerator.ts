import { LabelElement, SequentialConfig, DataRow } from '@/types/label';

export interface SequenceData {
  numero: string;
  prefixo: string;
  sufixo: string;
  csvValue?: string; // Valor do CSV quando dataSourceType é 'csv'
}

/**
 * Gera dados de sequência para um elemento específico
 * Suporta: sequential, csv, fixed
 */
export function generateElementSequenceData(
  element: LabelElement,
  labelIndex: number,
  defaultSequence: SequentialConfig,
  csvRow?: DataRow // Linha do CSV quando dataSourceType é 'csv'
): SequenceData {
  // Se o elemento usa sequência personalizada
  if (element.dataSourceType === 'sequential' && element.customSequence) {
    const customSeq = element.customSequence;
    const num = customSeq.start + labelIndex * customSeq.step;
    return {
      numero: num.toString().padStart(customSeq.padLength, '0'),
      prefixo: customSeq.prefix,
      sufixo: customSeq.suffix,
    };
  }
  
  // Se o elemento usa CSV
  if (element.dataSourceType === 'csv' && csvRow && element.csvColumn) {
    return {
      numero: csvRow[element.csvColumn] || '',
      prefixo: '',
      sufixo: '',
      csvValue: csvRow[element.csvColumn] || '',
    };
  }
  
  // Se o elemento usa valor fixo ou não tem configuração, retorna valores padrão
  // (o valor fixo será usado diretamente no campo qrValue/barcodeValue)
  return {
    numero: '',
    prefixo: '',
    sufixo: '',
  };
}

/**
 * Gera o valor final para um elemento (QR Code ou Barcode)
 */
export function getElementValue(
  element: LabelElement,
  labelIndex: number,
  defaultSequence: SequentialConfig,
  csvRow?: DataRow
): string {
  const baseValue = element.type === 'qrcode' ? element.qrValue : element.barcodeValue;
  
  if (!baseValue) return '';
  
  // Se for valor fixo, retorna direto
  if (element.dataSourceType === 'fixed' || !element.dataSourceType) {
    return baseValue;
  }
  
  // Gera dados de sequência
  const seqData = generateElementSequenceData(element, labelIndex, defaultSequence, csvRow);
  
  // Substitui campos dinâmicos
  let result = baseValue;
  result = result.replace(/{NUMERO}/g, seqData.numero);
  result = result.replace(/{PREFIXO}/g, seqData.prefixo);
  result = result.replace(/{SUFIXO}/g, seqData.sufixo);
  
  // Se for CSV, substitui a coluna específica
  if (element.dataSourceType === 'csv' && element.csvColumn && csvRow) {
    result = result.replace(new RegExp(`\\{${element.csvColumn}\\}`, 'g'), csvRow[element.csvColumn] || '');
  }
  
  // Substitui outras colunas do CSV se existirem
  if (csvRow) {
    Object.keys(csvRow).forEach((key) => {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), csvRow[key] || '');
    });
  }
  
  return result;
}

