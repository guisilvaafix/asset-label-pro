import JsBarcode from 'jsbarcode';
import QRCode from 'qrcode';
import { BarcodeType } from '@/types/label';

// Map our barcode types to JsBarcode format
const JSBARCODE_FORMAT_MAP: Record<string, string> = {
  CODE128: 'CODE128',
  CODE128A: 'CODE128A',
  CODE128B: 'CODE128B',
  CODE128C: 'CODE128C',
  CODE39: 'CODE39',
  CODE39EXT: 'CODE39',
  CODE93: 'CODE93',
  EAN13: 'EAN13',
  EAN8: 'EAN8',
  UPCA: 'UPC',
  UPCE: 'UPCE',
  ITF14: 'ITF14',
  ITF: 'ITF',
  CODABAR: 'codabar',
  PHARMACODE: 'pharmacode',
  MSI: 'MSI',
};

export async function generateBarcode(
  value: string,
  type: BarcodeType,
  options: {
    width?: number;
    height?: number;
    displayValue?: boolean;
    fontSize?: number;
    background?: string;
    lineColor?: string;
  } = {}
): Promise<string> {
  const {
    width = 2,
    height = 100,
    displayValue = true,
    fontSize = 12,
    background = '#ffffff',
    lineColor = '#000000',
  } = options;

  // Handle DataMatrix with canvas fallback
  if (type === 'DATAMATRIX') {
    return generateDataMatrixFallback(value, { width: width * 50, height: height });
  }

  // Handle PDF417 with canvas fallback
  if (type === 'PDF417') {
    return generatePDF417Fallback(value, { width: width * 50, height: height });
  }

  // Use JsBarcode for standard 1D barcodes
  const format = JSBARCODE_FORMAT_MAP[type] || 'CODE128';
  
  // Create a canvas element
  const canvas = document.createElement('canvas');
  
  try {
    // Validate and generate barcode
    let barcodeValue = value;
    
    // Special handling for specific barcode types
    switch (type) {
      case 'EAN13':
        // EAN-13 needs exactly 12 or 13 digits
        barcodeValue = value.replace(/\D/g, '').padStart(12, '0').slice(0, 13);
        break;
      case 'EAN8':
        // EAN-8 needs exactly 7 or 8 digits
        barcodeValue = value.replace(/\D/g, '').padStart(7, '0').slice(0, 8);
        break;
      case 'UPCA':
        // UPC-A needs exactly 11 or 12 digits
        barcodeValue = value.replace(/\D/g, '').padStart(11, '0').slice(0, 12);
        break;
      case 'UPCE':
        // UPC-E needs 6, 7 or 8 digits
        barcodeValue = value.replace(/\D/g, '').padStart(6, '0').slice(0, 8);
        break;
      case 'ITF14':
        // ITF-14 needs exactly 13 or 14 digits
        barcodeValue = value.replace(/\D/g, '').padStart(13, '0').slice(0, 14);
        break;
      case 'ITF':
        // ITF needs even number of digits
        barcodeValue = value.replace(/\D/g, '');
        if (barcodeValue.length % 2 !== 0) {
          barcodeValue = '0' + barcodeValue;
        }
        break;
      case 'PHARMACODE':
        // Pharmacode needs numeric value between 3 and 131070
        const num = parseInt(value.replace(/\D/g, ''), 10) || 123;
        barcodeValue = Math.min(131070, Math.max(3, num)).toString();
        break;
      case 'CODE128C':
        // CODE128C needs even number of digits
        barcodeValue = value.replace(/\D/g, '');
        if (barcodeValue.length % 2 !== 0) {
          barcodeValue = '0' + barcodeValue;
        }
        if (barcodeValue.length === 0) barcodeValue = '00';
        break;
    }

    JsBarcode(canvas, barcodeValue, {
      format,
      width,
      height,
      displayValue,
      fontSize,
      background,
      lineColor,
      margin: 2,
    });

    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Error generating barcode:', error);
    // Return a placeholder on error
    return generatePlaceholderBarcode(value, type);
  }
}

function generateDataMatrixFallback(
  value: string,
  options: { width?: number; height?: number } = {}
): string {
  const { width = 100, height = 100 } = options;
  const canvas = document.createElement('canvas');
  const size = Math.min(width, height);
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    // Generate a simple 2D pattern that resembles DataMatrix
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    
    const moduleSize = Math.floor(size / 16);
    const pattern = generateDataMatrixPattern(value);
    
    ctx.fillStyle = '#000000';
    
    // Draw finder pattern (L-shape border)
    for (let i = 0; i < 16; i++) {
      // Left edge - solid
      ctx.fillRect(0, i * moduleSize, moduleSize, moduleSize);
      // Bottom edge - solid
      ctx.fillRect(i * moduleSize, (15) * moduleSize, moduleSize, moduleSize);
      // Right edge - alternating
      if (i % 2 === 0) {
        ctx.fillRect((15) * moduleSize, i * moduleSize, moduleSize, moduleSize);
      }
      // Top edge - alternating
      if (i % 2 === 0) {
        ctx.fillRect(i * moduleSize, 0, moduleSize, moduleSize);
      }
    }
    
    // Fill data area with pattern
    for (let row = 1; row < 15; row++) {
      for (let col = 1; col < 15; col++) {
        if (pattern[(row - 1) * 14 + (col - 1)] === 1) {
          ctx.fillRect(col * moduleSize, row * moduleSize, moduleSize, moduleSize);
        }
      }
    }
  }
  
  return canvas.toDataURL('image/png');
}

function generatePDF417Fallback(
  value: string,
  options: { width?: number; height?: number } = {}
): string {
  const { width = 200, height = 80 } = options;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    
    // Generate PDF417-like pattern
    const rows = 4;
    const cols = Math.floor(width / 4);
    const rowHeight = Math.floor(height / rows);
    const moduleWidth = 2;
    
    ctx.fillStyle = '#000000';
    
    // Start pattern for each row
    for (let row = 0; row < rows; row++) {
      const y = row * rowHeight + 2;
      const h = rowHeight - 4;
      
      // Start quiet zone
      let x = 4;
      
      // Start pattern
      ctx.fillRect(x, y, moduleWidth * 4, h);
      x += moduleWidth * 8;
      
      // Data codewords (pseudo-random based on value)
      const seed = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      for (let i = 0; i < 20; i++) {
        const pattern = ((seed * (i + 1) * (row + 1)) % 17);
        for (let j = 0; j < 4; j++) {
          if ((pattern >> j) & 1) {
            ctx.fillRect(x, y, moduleWidth, h);
          }
          x += moduleWidth;
        }
        x += moduleWidth;
      }
      
      // Stop pattern
      ctx.fillRect(x, y, moduleWidth * 4, h);
    }
  }
  
  return canvas.toDataURL('image/png');
}

function generateDataMatrixPattern(value: string): number[] {
  // Generate pseudo-random pattern based on value
  const pattern: number[] = [];
  const seed = value.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  for (let i = 0; i < 196; i++) {
    pattern.push(((seed * (i + 1)) % 7) > 3 ? 1 : 0);
  }
  
  return pattern;
}

export async function generateQRCode(
  value: string,
  options: {
    width?: number;
    errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
    color?: { dark: string; light: string };
  } = {}
): Promise<string> {
  const {
    width = 150,
    errorCorrectionLevel = 'M',
    color = { dark: '#000000', light: '#ffffff' },
  } = options;

  try {
    const dataUrl = await QRCode.toDataURL(value || 'SAMPLE', {
      width,
      errorCorrectionLevel,
      color,
      margin: 1,
    });
    return dataUrl;
  } catch (error) {
    console.error('Error generating QR code:', error);
    return generatePlaceholder2D('QR', value);
  }
}

function generatePlaceholderBarcode(value: string, type: BarcodeType): string {
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 80;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 200, 80);
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`[${type}]`, 100, 35);
    ctx.fillText(value.substring(0, 20), 100, 55);
  }
  return canvas.toDataURL('image/png');
}

function generatePlaceholder2D(type: string, value: string): string {
  const canvas = document.createElement('canvas');
  canvas.width = 100;
  canvas.height = 100;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 100, 100);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(5, 5, 90, 90);
    ctx.fillStyle = '#000000';
    ctx.font = '10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`[${type}]`, 50, 45);
    ctx.font = '8px Arial';
    ctx.fillText(value.substring(0, 12), 50, 60);
  }
  return canvas.toDataURL('image/png');
}

export function replaceDynamicFields(
  template: string,
  data: {
    numero?: string;
    prefixo?: string;
    sufixo?: string;
    custom?: Record<string, string>;
  }
): string {
  let result = template;
  
  const now = new Date();
  const replacements: Record<string, string> = {
    '{NUMERO}': data.numero || '000001',
    '{PREFIXO}': data.prefixo || '',
    '{SUFIXO}': data.sufixo || '',
    '{DATA}': now.toLocaleDateString('pt-BR'),
    '{ANO}': now.getFullYear().toString(),
    '{MES}': (now.getMonth() + 1).toString().padStart(2, '0'),
    ...Object.fromEntries(
      Array.from({ length: 10 }, (_, i) => [
        `{CUSTOM${i + 1}}`,
        data.custom?.[`CUSTOM${i + 1}`] || '',
      ])
    ),
  };

  // Also handle CSV column mappings
  if (data.custom) {
    Object.entries(data.custom).forEach(([key, value]) => {
      replacements[`{${key}}`] = value;
    });
  }

  Object.entries(replacements).forEach(([placeholder, value]) => {
    result = result.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
  });

  return result;
}
