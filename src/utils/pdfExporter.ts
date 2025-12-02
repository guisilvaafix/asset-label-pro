import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SheetConfig, LabelElement, ExportConfig, PAPER_SIZES } from '@/types/label';
import { generateBarcode, generateQRCode, replaceDynamicFields } from './barcodeGenerator';

const MM_TO_PT = 2.83465; // millimeters to points conversion

interface LabelData {
  numero: string;
  prefixo: string;
  sufixo: string;
  custom: Record<string, string>;
}

export async function exportToPDF(
  sheetConfig: SheetConfig,
  elements: LabelElement[],
  labelDataList: LabelData[],
  exportConfig: ExportConfig
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const paper = PAPER_SIZES[sheetConfig.paperSize] || {
    width: sheetConfig.customWidth,
    height: sheetConfig.customHeight,
  };
  
  const pageWidth = paper.width * MM_TO_PT;
  const pageHeight = paper.height * MM_TO_PT;
  
  const labelsPerPage = sheetConfig.columns * sheetConfig.rows;
  const totalPages = Math.ceil(labelDataList.length / labelsPerPage);
  
  for (let pageIndex = 0; pageIndex < totalPages; pageIndex++) {
    const page = pdfDoc.addPage([pageWidth, pageHeight]);
    
    // Add crop marks if enabled
    if (exportConfig.includeCropMarks) {
      addCropMarks(page, sheetConfig, paper);
    }
    
    for (let labelIndex = 0; labelIndex < labelsPerPage; labelIndex++) {
      const dataIndex = pageIndex * labelsPerPage + labelIndex;
      if (dataIndex >= labelDataList.length) break;
      
      const data = labelDataList[dataIndex];
      const col = labelIndex % sheetConfig.columns;
      const row = Math.floor(labelIndex / sheetConfig.columns);
      
      const labelX = (sheetConfig.marginLeft + col * (sheetConfig.labelWidth + sheetConfig.spacingHorizontal)) * MM_TO_PT;
      const labelY = pageHeight - (sheetConfig.marginTop + row * (sheetConfig.labelHeight + sheetConfig.spacingVertical) + sheetConfig.labelHeight) * MM_TO_PT;
      
      // Draw each element
      for (const element of elements.sort((a, b) => a.zIndex - b.zIndex)) {
        await drawElement(page, pdfDoc, element, labelX, labelY, data, font, fontBold, sheetConfig);
      }
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const filename = generateFilename('etiquetas', 'pdf', labelDataList.length);
  saveAs(blob, filename);
}

export async function exportToPDFSingle(
  sheetConfig: SheetConfig,
  elements: LabelElement[],
  labelDataList: LabelData[],
  exportConfig: ExportConfig
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  
  const labelWidth = sheetConfig.labelWidth * MM_TO_PT;
  const labelHeight = sheetConfig.labelHeight * MM_TO_PT;
  
  for (const data of labelDataList) {
    const page = pdfDoc.addPage([labelWidth, labelHeight]);
    
    for (const element of elements.sort((a, b) => a.zIndex - b.zIndex)) {
      await drawElement(page, pdfDoc, element, 0, 0, data, font, fontBold, sheetConfig);
    }
  }
  
  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes as unknown as BlobPart], { type: 'application/pdf' });
  const filename = generateFilename('etiquetas-individual', 'pdf', labelDataList.length);
  saveAs(blob, filename);
}

export async function exportToPNG(
  sheetConfig: SheetConfig,
  elements: LabelElement[],
  labelDataList: LabelData[],
  exportConfig: ExportConfig
): Promise<void> {
  const zip = new JSZip();
  const dpi = exportConfig.dpi;
  const scale = dpi / 96; // 96 DPI is the base
  
  const labelWidthPx = Math.round(sheetConfig.labelWidth * scale * 3.78); // mm to px at given DPI
  const labelHeightPx = Math.round(sheetConfig.labelHeight * scale * 3.78);
  
  for (let i = 0; i < labelDataList.length; i++) {
    const data = labelDataList[i];
    const canvas = document.createElement('canvas');
    canvas.width = labelWidthPx;
    canvas.height = labelHeightPx;
    const ctx = canvas.getContext('2d');
    
    if (!ctx) continue;
    
    // White background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, labelWidthPx, labelHeightPx);
    
    // Draw elements
    for (const element of elements.sort((a, b) => a.zIndex - b.zIndex)) {
      await drawElementCanvas(ctx, element, data, sheetConfig, scale);
    }
    
    const blob = await new Promise<Blob>((resolve) => {
      canvas.toBlob((b) => resolve(b!), 'image/png');
    });
    
    const paddedNumber = data.numero.padStart(6, '0');
    zip.file(`etiqueta-${data.prefixo}${paddedNumber}${data.sufixo}.png`, blob);
  }
  
  const zipBlob = await zip.generateAsync({ type: 'blob' });
  const filename = generateFilename('etiquetas', 'zip', labelDataList.length);
  saveAs(zipBlob, filename);
}

async function drawElement(
  page: ReturnType<PDFDocument['addPage']>,
  pdfDoc: PDFDocument,
  element: LabelElement,
  labelX: number,
  labelY: number,
  data: LabelData,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  sheetConfig: SheetConfig
): Promise<void> {
  const x = labelX + element.x * MM_TO_PT;
  const y = labelY + (sheetConfig.labelHeight - element.y - element.height) * MM_TO_PT;
  const width = element.width * MM_TO_PT;
  const height = element.height * MM_TO_PT;
  
  switch (element.type) {
    case 'text': {
      let text = element.text || '';
      if (element.isDynamic) {
        text = replaceDynamicFields(text, data);
      }
      
      const selectedFont = element.fontWeight === 'bold' ? fontBold : font;
      const fontSize = (element.fontSize || 12) * 0.75;
      const color = hexToRgb(element.fill || '#000000');
      
      page.drawText(text, {
        x: x,
        y: y + height / 2 - fontSize / 3,
        size: fontSize,
        font: selectedFont,
        color: rgb(color.r, color.g, color.b),
        opacity: element.opacity,
      });
      break;
    }
    
    case 'qrcode': {
      let value = element.qrValue || '';
      if (element.isDynamic) {
        value = replaceDynamicFields(value, data);
      }
      
      const qrDataUrl = await generateQRCode(value, {
        width: Math.round(width * 2),
        errorCorrectionLevel: element.qrErrorLevel || 'M',
        color: {
          dark: element.qrForeground || '#000000',
          light: element.qrBackground || '#ffffff',
        },
      });
      
      const qrImageBytes = await fetch(qrDataUrl).then((res) => res.arrayBuffer());
      const qrImage = await pdfDoc.embedPng(qrImageBytes);
      
      page.drawImage(qrImage, {
        x,
        y,
        width,
        height,
        opacity: element.opacity,
      });
      break;
    }
    
    case 'barcode': {
      let value = element.barcodeValue || '';
      if (element.isDynamic) {
        value = replaceDynamicFields(value, data);
      }
      
      const barcodeDataUrl = await generateBarcode(value, element.barcodeType || 'CODE128', {
        width: 2,
        height: Math.round(height * 0.8),
        displayValue: element.displayValue !== false,
      });
      
      const barcodeImageBytes = await fetch(barcodeDataUrl).then((res) => res.arrayBuffer());
      const barcodeImage = await pdfDoc.embedPng(barcodeImageBytes);
      
      page.drawImage(barcodeImage, {
        x,
        y,
        width,
        height,
        opacity: element.opacity,
      });
      break;
    }
    
    case 'datamatrix':
    case 'pdf417': {
      let value = element.barcodeValue || '';
      if (element.isDynamic) {
        value = replaceDynamicFields(value, data);
      }
      
      const barcodeDataUrl = await generateBarcode(
        value,
        element.type === 'datamatrix' ? 'DATAMATRIX' : 'PDF417',
        { width: Math.round(width), height: Math.round(height) }
      );
      
      const barcodeImageBytes = await fetch(barcodeDataUrl).then((res) => res.arrayBuffer());
      const barcodeImage = await pdfDoc.embedPng(barcodeImageBytes);
      
      page.drawImage(barcodeImage, {
        x,
        y,
        width,
        height,
        opacity: element.opacity,
      });
      break;
    }
    
    case 'rectangle': {
      const fillColor = hexToRgb(element.shapeFill || '#ffffff');
      const strokeColor = hexToRgb(element.shapeStroke || '#000000');
      
      page.drawRectangle({
        x,
        y,
        width,
        height,
        color: element.shapeFill ? rgb(fillColor.r, fillColor.g, fillColor.b) : undefined,
        borderColor: element.shapeStroke ? rgb(strokeColor.r, strokeColor.g, strokeColor.b) : undefined,
        borderWidth: element.shapeStrokeWidth || 1,
        opacity: element.opacity,
      });
      break;
    }
    
    case 'circle': {
      const centerX = x + width / 2;
      const centerY = y + height / 2;
      const fillColor = hexToRgb(element.shapeFill || '#ffffff');
      const strokeColor = hexToRgb(element.shapeStroke || '#000000');
      
      page.drawEllipse({
        x: centerX,
        y: centerY,
        xScale: width / 2,
        yScale: height / 2,
        color: element.shapeFill ? rgb(fillColor.r, fillColor.g, fillColor.b) : undefined,
        borderColor: element.shapeStroke ? rgb(strokeColor.r, strokeColor.g, strokeColor.b) : undefined,
        borderWidth: element.shapeStrokeWidth || 1,
        opacity: element.opacity,
      });
      break;
    }
    
    case 'line': {
      const strokeColor = hexToRgb(element.shapeStroke || '#000000');
      
      page.drawLine({
        start: { x, y: y + height / 2 },
        end: { x: x + width, y: y + height / 2 },
        thickness: element.shapeStrokeWidth || 1,
        color: rgb(strokeColor.r, strokeColor.g, strokeColor.b),
        opacity: element.opacity,
      });
      break;
    }
    
    case 'image': {
      if (element.src) {
        try {
          const imageBytes = await fetch(element.src).then((res) => res.arrayBuffer());
          let image;
          if (element.src.includes('png') || element.src.includes('image/png')) {
            image = await pdfDoc.embedPng(imageBytes);
          } else {
            image = await pdfDoc.embedJpg(imageBytes);
          }
          
          page.drawImage(image, {
            x,
            y,
            width,
            height,
            opacity: element.opacity,
          });
        } catch (error) {
          console.error('Error embedding image:', error);
        }
      }
      break;
    }
  }
}

async function drawElementCanvas(
  ctx: CanvasRenderingContext2D,
  element: LabelElement,
  data: LabelData,
  sheetConfig: SheetConfig,
  scale: number
): Promise<void> {
  const pxPerMm = scale * 3.78;
  const x = element.x * pxPerMm;
  const y = element.y * pxPerMm;
  const width = element.width * pxPerMm;
  const height = element.height * pxPerMm;
  
  ctx.globalAlpha = element.opacity;
  
  switch (element.type) {
    case 'text': {
      let text = element.text || '';
      if (element.isDynamic) {
        text = replaceDynamicFields(text, data);
      }
      
      const fontSize = (element.fontSize || 12) * scale;
      const fontWeight = element.fontWeight === 'bold' ? 'bold' : 'normal';
      const fontStyle = element.fontStyle === 'italic' ? 'italic' : 'normal';
      
      ctx.font = `${fontStyle} ${fontWeight} ${fontSize}px ${element.fontFamily || 'Arial'}`;
      ctx.fillStyle = element.fill || '#000000';
      ctx.textAlign = (element.textAlign as CanvasTextAlign) || 'left';
      ctx.textBaseline = 'middle';
      
      const textX = element.textAlign === 'center' ? x + width / 2 : 
                    element.textAlign === 'right' ? x + width : x;
      ctx.fillText(text, textX, y + height / 2);
      break;
    }
    
    case 'qrcode': {
      let value = element.qrValue || '';
      if (element.isDynamic) {
        value = replaceDynamicFields(value, data);
      }
      
      const qrDataUrl = await generateQRCode(value, {
        width: Math.round(width * 2),
        errorCorrectionLevel: element.qrErrorLevel || 'M',
        color: {
          dark: element.qrForeground || '#000000',
          light: element.qrBackground || '#ffffff',
        },
      });
      
      const img = await loadImage(qrDataUrl);
      ctx.drawImage(img, x, y, width, height);
      break;
    }
    
    case 'barcode':
    case 'datamatrix':
    case 'pdf417': {
      let value = element.barcodeValue || element.qrValue || '';
      if (element.isDynamic) {
        value = replaceDynamicFields(value, data);
      }
      
      const barcodeType = element.type === 'datamatrix' ? 'DATAMATRIX' :
                         element.type === 'pdf417' ? 'PDF417' :
                         element.barcodeType || 'CODE128';
      
      const barcodeDataUrl = await generateBarcode(value, barcodeType, {
        width: 2,
        height: Math.round(height * 0.8),
        displayValue: element.displayValue !== false,
      });
      
      const img = await loadImage(barcodeDataUrl);
      ctx.drawImage(img, x, y, width, height);
      break;
    }
    
    case 'rectangle': {
      if (element.shapeFill) {
        ctx.fillStyle = element.shapeFill;
        ctx.fillRect(x, y, width, height);
      }
      if (element.shapeStroke) {
        ctx.strokeStyle = element.shapeStroke;
        ctx.lineWidth = (element.shapeStrokeWidth || 1) * scale;
        ctx.strokeRect(x, y, width, height);
      }
      break;
    }
    
    case 'circle': {
      ctx.beginPath();
      ctx.ellipse(x + width / 2, y + height / 2, width / 2, height / 2, 0, 0, Math.PI * 2);
      if (element.shapeFill) {
        ctx.fillStyle = element.shapeFill;
        ctx.fill();
      }
      if (element.shapeStroke) {
        ctx.strokeStyle = element.shapeStroke;
        ctx.lineWidth = (element.shapeStrokeWidth || 1) * scale;
        ctx.stroke();
      }
      break;
    }
    
    case 'line': {
      ctx.beginPath();
      ctx.moveTo(x, y + height / 2);
      ctx.lineTo(x + width, y + height / 2);
      ctx.strokeStyle = element.shapeStroke || '#000000';
      ctx.lineWidth = (element.shapeStrokeWidth || 1) * scale;
      ctx.stroke();
      break;
    }
    
    case 'image': {
      if (element.src) {
        try {
          const img = await loadImage(element.src);
          ctx.drawImage(img, x, y, width, height);
        } catch (error) {
          console.error('Error drawing image:', error);
        }
      }
      break;
    }
  }
  
  ctx.globalAlpha = 1;
}

function addCropMarks(
  page: ReturnType<PDFDocument['addPage']>, 
  sheetConfig: SheetConfig, 
  paper: { width: number; height: number }
): void {
  const markLength = 5 * MM_TO_PT;
  const markOffset = 3 * MM_TO_PT;
  
  const pageHeight = paper.height * MM_TO_PT;
  
  for (let col = 0; col <= sheetConfig.columns; col++) {
    for (let row = 0; row <= sheetConfig.rows; row++) {
      const x = (sheetConfig.marginLeft + col * (sheetConfig.labelWidth + sheetConfig.spacingHorizontal) - 
                 (col === sheetConfig.columns ? sheetConfig.spacingHorizontal : 0)) * MM_TO_PT;
      const y = pageHeight - (sheetConfig.marginTop + row * (sheetConfig.labelHeight + sheetConfig.spacingVertical) -
                 (row === sheetConfig.rows ? sheetConfig.spacingVertical : 0)) * MM_TO_PT;
      
      // Horizontal marks
      if (row === 0 || row === sheetConfig.rows) {
        page.drawLine({
          start: { x: x - markLength - markOffset, y },
          end: { x: x - markOffset, y },
          thickness: 0.25,
          color: rgb(0, 0, 0),
        });
      }
      
      // Vertical marks
      if (col === 0 || col === sheetConfig.columns) {
        page.drawLine({
          start: { x, y: y - markLength - markOffset },
          end: { x, y: y - markOffset },
          thickness: 0.25,
          color: rgb(0, 0, 0),
        });
      }
    }
  }
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16) / 255,
        g: parseInt(result[2], 16) / 255,
        b: parseInt(result[3], 16) / 255,
      }
    : { r: 0, g: 0, b: 0 };
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function generateFilename(prefix: string, extension: string, count: number): string {
  const now = new Date();
  const date = now.toISOString().split('T')[0];
  const time = now.toTimeString().split(' ')[0].replace(/:/g, '-');
  return `${prefix}_${count}un_${date}_${time}.${extension}`;
}
