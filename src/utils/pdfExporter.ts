import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { SheetConfig, LabelElement, ExportConfig, PAPER_SIZES, SequentialConfig } from '@/types/label';
import { generateBarcode, generateQRCode, replaceDynamicFields } from './barcodeGenerator';
import { getElementValue, generateElementSequenceData } from './sequenceGenerator';

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
  exportConfig: ExportConfig,
  defaultSequence?: SequentialConfig
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

  console.log('Export config:', {
    columns: sheetConfig.columns,
    rows: sheetConfig.rows,
    labelWidth: sheetConfig.labelWidth,
    labelHeight: sheetConfig.labelHeight,
    spacingH: sheetConfig.spacingHorizontal,
    spacingV: sheetConfig.spacingVertical,
  });

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
      const globalLabelIndex = pageIndex * labelsPerPage + labelIndex;
      for (const element of elements.sort((a, b) => a.zIndex - b.zIndex)) {
        await drawElement(page, pdfDoc, element, elements, labelX, labelY, data, font, fontBold, sheetConfig, globalLabelIndex, defaultSequence || {
          start: 1,
          end: 100,
          step: 1,
          padLength: 6,
          prefix: '',
          suffix: '',
        }, exportConfig, data.custom);
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
  exportConfig: ExportConfig,
  defaultSequence?: SequentialConfig
): Promise<void> {
  const pdfDoc = await PDFDocument.create();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const labelWidth = sheetConfig.labelWidth * MM_TO_PT;
  const labelHeight = sheetConfig.labelHeight * MM_TO_PT;

  for (let i = 0; i < labelDataList.length; i++) {
    const data = labelDataList[i];
    const page = pdfDoc.addPage([labelWidth, labelHeight]);

    for (const element of elements.sort((a, b) => a.zIndex - b.zIndex)) {
      await drawElement(page, pdfDoc, element, elements, 0, 0, data, font, fontBold, sheetConfig, i, defaultSequence || {
        start: 1,
        end: 100,
        step: 1,
        padLength: 6,
        prefix: '',
        suffix: '',
      }, exportConfig, data.custom);
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
  exportConfig: ExportConfig,
  defaultSequence?: SequentialConfig
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
      await drawElementCanvas(ctx, element, data, sheetConfig, scale, i, defaultSequence || {
        start: 1,
        end: 100,
        step: 1,
        padLength: 6,
        prefix: '',
        suffix: '',
      }, data.custom);
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
  allElements: LabelElement[],
  labelX: number,
  labelY: number,
  data: LabelData,
  font: Awaited<ReturnType<PDFDocument['embedFont']>>,
  fontBold: Awaited<ReturnType<PDFDocument['embedFont']>>,
  sheetConfig: SheetConfig,
  labelIndex: number,
  defaultSequence: SequentialConfig,
  exportConfig: ExportConfig,
  csvRow?: Record<string, string>
): Promise<void> {
  const x = labelX + element.x * MM_TO_PT;
  const y = labelY + (sheetConfig.labelHeight - element.y - element.height) * MM_TO_PT;
  const width = element.width * MM_TO_PT;
  const height = element.height * MM_TO_PT;

  switch (element.type) {
    case 'text': {
      let text = element.text || '';
      if (element.isDynamic) {
        // Resolver referência para dados sequenciais
        let elementData: any = data;

        if (element.sequentialReference) {
          let dataElement = element;
          const refElement = allElements.find(el => el.id === element.sequentialReference);
          if (refElement) {
            dataElement = refElement;
          }

          // Gerar dados específicos para o elemento de referência
          const seqData = generateElementSequenceData(dataElement, labelIndex, defaultSequence, csvRow);

          elementData = {
            ...seqData,
            custom: data.custom || {}
          };
        }

        text = replaceDynamicFields(text, elementData);
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
      const value = getElementValue(element, labelIndex, defaultSequence, csvRow);

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
      const value = getElementValue(element, labelIndex, defaultSequence, csvRow);

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
      const value = getElementValue(element, labelIndex, defaultSequence, csvRow);

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
          let imageBytes: ArrayBuffer;
          let isPng = false;

          // Detectar se é SVG
          if (element.src.includes('.svg') || element.src.includes('svg+xml')) {
            // Converter SVG para PNG em ALTA RESOLUÇÃO para manter qualidade próxima ao vetor
            const img = await loadImage(element.src);
            const canvas = document.createElement('canvas');

            // Usar DPI de exportação para calcular resolução (mínimo 4x para SVG)
            const scaleFactor = Math.max(4, exportConfig.dpi / 96);
            canvas.width = Math.round(width * scaleFactor);
            canvas.height = Math.round(height * scaleFactor);

            const ctx = canvas.getContext('2d');
            if (ctx) {
              // Habilitar suavização para melhor qualidade
              ctx.imageSmoothingEnabled = true;
              ctx.imageSmoothingQuality = 'high';

              ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
              const pngDataUrl = canvas.toDataURL('image/png');
              imageBytes = await fetch(pngDataUrl).then((res) => res.arrayBuffer());
              isPng = true;
            } else {
              throw new Error('Could not get canvas context');
            }
          } else {
            // PNG ou JPG normal
            imageBytes = await fetch(element.src).then((res) => res.arrayBuffer());
            isPng = element.src.includes('png') || element.src.includes('image/png');
          }

          const image = isPng
            ? await pdfDoc.embedPng(imageBytes)
            : await pdfDoc.embedJpg(imageBytes);

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
  scale: number,
  labelIndex: number,
  defaultSequence: SequentialConfig,
  csvRow?: Record<string, string>
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
      const value = getElementValue(element, labelIndex, defaultSequence, csvRow);

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
      const value = getElementValue(element, labelIndex, defaultSequence, csvRow);

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
  const markLength = 3 * MM_TO_PT; // Marcas pequenas de 3mm
  const markThickness = 0.3; // Linhas finas

  const pageHeight = paper.height * MM_TO_PT;

  // Desenhar marcas de corte em cada canto de cada etiqueta
  for (let col = 0; col < sheetConfig.columns; col++) {
    for (let row = 0; row < sheetConfig.rows; row++) {
      // Posição da etiqueta (com espaçamento)
      const labelLeft = (sheetConfig.marginLeft + col * (sheetConfig.labelWidth + sheetConfig.spacingHorizontal)) * MM_TO_PT;
      const labelRight = labelLeft + sheetConfig.labelWidth * MM_TO_PT;
      const labelTop = pageHeight - (sheetConfig.marginTop + row * (sheetConfig.labelHeight + sheetConfig.spacingVertical)) * MM_TO_PT;
      const labelBottom = labelTop - sheetConfig.labelHeight * MM_TO_PT;

      // Canto superior esquerdo (L)
      // Linha horizontal (para esquerda)
      page.drawLine({
        start: { x: labelLeft, y: labelTop },
        end: { x: labelLeft - markLength, y: labelTop },
        thickness: markThickness,
        color: rgb(0, 0, 0),
      });
      // Linha vertical (para cima)
      page.drawLine({
        start: { x: labelLeft, y: labelTop },
        end: { x: labelLeft, y: labelTop + markLength },
        thickness: markThickness,
        color: rgb(0, 0, 0),
      });

      // Canto superior direito (L invertido)
      // Linha horizontal (para direita)
      page.drawLine({
        start: { x: labelRight, y: labelTop },
        end: { x: labelRight + markLength, y: labelTop },
        thickness: markThickness,
        color: rgb(0, 0, 0),
      });
      // Linha vertical (para cima)
      page.drawLine({
        start: { x: labelRight, y: labelTop },
        end: { x: labelRight, y: labelTop + markLength },
        thickness: markThickness,
        color: rgb(0, 0, 0),
      });

      // Canto inferior esquerdo (L de ponta cabeça)
      // Linha horizontal (para esquerda)
      page.drawLine({
        start: { x: labelLeft, y: labelBottom },
        end: { x: labelLeft - markLength, y: labelBottom },
        thickness: markThickness,
        color: rgb(0, 0, 0),
      });
      // Linha vertical (para baixo)
      page.drawLine({
        start: { x: labelLeft, y: labelBottom },
        end: { x: labelLeft, y: labelBottom - markLength },
        thickness: markThickness,
        color: rgb(0, 0, 0),
      });

      // Canto inferior direito (L espelhado e de ponta cabeça)
      // Linha horizontal (para direita)
      page.drawLine({
        start: { x: labelRight, y: labelBottom },
        end: { x: labelRight + markLength, y: labelBottom },
        thickness: markThickness,
        color: rgb(0, 0, 0),
      });
      // Linha vertical (para baixo)
      page.drawLine({
        start: { x: labelRight, y: labelBottom },
        end: { x: labelRight, y: labelBottom - markLength },
        thickness: markThickness,
        color: rgb(0, 0, 0),
      });
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
