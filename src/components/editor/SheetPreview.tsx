import { useEffect, useRef, useCallback, useState } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useLabelStore } from '@/store/labelStore';
import { PAPER_SIZES, LabelElement } from '@/types/label';
import { generateBarcode, generateQRCode, replaceDynamicFields } from '@/utils/barcodeGenerator';

const MM_TO_PX = 4; // Higher quality scale for preview

export function SheetPreview() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const {
    sheetConfig,
    elements,
    sequentialConfig,
    csvData,
    dataMode,
    previewPage,
    setPreviewPage,
    previewZoom,
    setPreviewZoom,
  } = useLabelStore();

  const [renderedImages, setRenderedImages] = useState<Map<string, string>>(new Map());

  const paper = PAPER_SIZES[sheetConfig.paperSize] || {
    width: sheetConfig.customWidth,
    height: sheetConfig.customHeight,
  };

  const labelsPerPage = sheetConfig.columns * sheetConfig.rows;
  const totalLabels = dataMode === 'sequential'
    ? Math.ceil((sequentialConfig.end - sequentialConfig.start + 1) / sequentialConfig.step)
    : csvData.length || 1;
  const totalPages = Math.max(1, Math.ceil(totalLabels / labelsPerPage));

  // Generate data for a specific label index
  const generateLabelData = useCallback((labelIndex: number): { numero?: string; prefixo?: string; sufixo?: string; custom?: Record<string, string> } => {
    if (dataMode === 'sequential') {
      const currentNumber = sequentialConfig.start + labelIndex * sequentialConfig.step;
      const paddedNumber = currentNumber.toString().padStart(sequentialConfig.padLength, '0');
      return {
        numero: paddedNumber,
        prefixo: sequentialConfig.prefix,
        sufixo: sequentialConfig.suffix,
      };
    } else if (dataMode === 'csv' && csvData[labelIndex]) {
      return {
        custom: csvData[labelIndex],
      };
    }
    return {};
  }, [dataMode, sequentialConfig, csvData]);

  // Render barcode/QR code for an element
  const renderCodeElement = useCallback(async (element: LabelElement, labelIndex: number): Promise<string | null> => {
    const cacheKey = `${element.id}-${labelIndex}`;

    if (renderedImages.has(cacheKey)) {
      return renderedImages.get(cacheKey) || null;
    }

    try {
      let dataUrl: string | null = null;

      if (element.type === 'qrcode') {
        const labelData = generateLabelData(labelIndex);
        const sequenceData = element.customSequence
          ? {
            numero: (element.customSequence.start + labelIndex * element.customSequence.step).toString().padStart(element.customSequence.padLength, '0'),
            prefixo: element.customSequence.prefix,
            sufixo: element.customSequence.suffix,
          }
          : null;

        const qrData = sequenceData || labelData;
        const qrValue = replaceDynamicFields(element.qrValue || 'SAMPLE', {
          numero: qrData.numero,
          prefixo: qrData.prefixo,
          sufixo: qrData.sufixo,
          custom: ('custom' in qrData ? qrData.custom : undefined) || {},
        });

        dataUrl = await generateQRCode(qrValue, {
          width: element.width * MM_TO_PX,
          errorCorrectionLevel: element.qrErrorLevel || 'M',
          color: {
            dark: element.qrForeground || '#000000',
            light: element.qrBackground || '#ffffff',
          },
        });
      } else if (element.type === 'barcode' || element.type === 'datamatrix' || element.type === 'pdf417') {
        const labelData = generateLabelData(labelIndex);
        const sequenceData = element.customSequence
          ? {
            numero: (element.customSequence.start + labelIndex * element.customSequence.step).toString().padStart(element.customSequence.padLength, '0'),
            prefixo: element.customSequence.prefix,
            sufixo: element.customSequence.suffix,
          }
          : null;

        const barcodeData = sequenceData || labelData;
        const barcodeValue = replaceDynamicFields(element.barcodeValue || '123456789', {
          numero: barcodeData.numero,
          prefixo: barcodeData.prefixo,
          sufixo: barcodeData.sufixo,
          custom: ('custom' in barcodeData ? barcodeData.custom : undefined) || {},
        });

        dataUrl = await generateBarcode(barcodeValue, element.barcodeType || 'CODE128', {
          width: 2,
          height: element.height * MM_TO_PX * 0.8,
          displayValue: element.displayValue !== false,
          fontSize: 12,
        });
      }

      if (dataUrl) {
        setRenderedImages(prev => new Map(prev).set(cacheKey, dataUrl));
        return dataUrl;
      }
    } catch (error) {
      console.error('Error rendering code element:', error);
    }

    return null;
  }, [generateLabelData, renderedImages]);

  // Render the sheet preview
  const renderSheet = useCallback(async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const paperWidthPx = paper.width * MM_TO_PX;
    const paperHeightPx = paper.height * MM_TO_PX;

    canvas.width = paperWidthPx;
    canvas.height = paperHeightPx;

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, paperWidthPx, paperHeightPx);

    // Draw margins (subtle guides)
    ctx.strokeStyle = '#e0e0e0';
    ctx.lineWidth = 1;
    ctx.setLineDash([3, 3]);
    ctx.strokeRect(
      sheetConfig.marginLeft * MM_TO_PX,
      sheetConfig.marginTop * MM_TO_PX,
      (paper.width - sheetConfig.marginLeft - sheetConfig.marginRight) * MM_TO_PX,
      (paper.height - sheetConfig.marginTop - sheetConfig.marginBottom) * MM_TO_PX
    );
    ctx.setLineDash([]);

    // Draw labels grid
    const startLabelIndex = (previewPage - 1) * labelsPerPage;

    for (let row = 0; row < sheetConfig.rows; row++) {
      for (let col = 0; col < sheetConfig.columns; col++) {
        const labelIndex = startLabelIndex + row * sheetConfig.columns + col;
        if (labelIndex >= totalLabels) continue;

        const labelX = (sheetConfig.marginLeft + col * (sheetConfig.labelWidth + sheetConfig.spacingHorizontal)) * MM_TO_PX;
        const labelY = (sheetConfig.marginTop + row * (sheetConfig.labelHeight + sheetConfig.spacingVertical)) * MM_TO_PX;
        const labelWidth = sheetConfig.labelWidth * MM_TO_PX;
        const labelHeight = sheetConfig.labelHeight * MM_TO_PX;

        // Label background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(labelX, labelY, labelWidth, labelHeight);

        // Label border
        ctx.strokeStyle = '#cccccc';
        ctx.lineWidth = 0.5;
        ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

        // Render elements
        await renderLabelElements(ctx, labelX, labelY, labelIndex);
      }
    }
  }, [paper, sheetConfig, elements, previewPage, labelsPerPage, totalLabels]);

  // Render elements within a single label
  const renderLabelElements = async (
    ctx: CanvasRenderingContext2D,
    labelX: number,
    labelY: number,
    labelIndex: number
  ) => {
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);
    const labelData = generateLabelData(labelIndex);

    for (const element of sortedElements) {
      const elemX = labelX + element.x * MM_TO_PX;
      const elemY = labelY + element.y * MM_TO_PX;
      const elemWidth = element.width * MM_TO_PX;
      const elemHeight = element.height * MM_TO_PX;

      ctx.save();
      ctx.globalAlpha = element.opacity;

      // Apply rotation if needed
      if (element.rotation && element.rotation !== 0) {
        ctx.translate(elemX + elemWidth / 2, elemY + elemHeight / 2);
        ctx.rotate((element.rotation * Math.PI) / 180);
        ctx.translate(-(elemX + elemWidth / 2), -(elemY + elemHeight / 2));
      }

      switch (element.type) {
        case 'text': {
          const sequenceData = element.customSequence
            ? {
              numero: (element.customSequence.start + labelIndex * element.customSequence.step).toString().padStart(element.customSequence.padLength, '0'),
              prefixo: element.customSequence.prefix,
              sufixo: element.customSequence.suffix,
            }
            : null;

          const textData = sequenceData || labelData;
          const text = replaceDynamicFields(element.text || 'Texto', {
            numero: textData.numero,
            prefixo: textData.prefixo,
            sufixo: textData.sufixo,
            custom: ('custom' in textData ? textData.custom : undefined) || {},
          });

          ctx.fillStyle = element.fill || '#000000';
          const fontSize = (element.fontSize || 12) * (MM_TO_PX / 3.78);
          ctx.font = `${element.fontStyle === 'italic' ? 'italic ' : ''}${element.fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px ${element.fontFamily || 'Arial'}`;
          ctx.textAlign = (element.textAlign as CanvasTextAlign) || 'left';
          ctx.textBaseline = 'top';

          // Shadow
          if (element.shadow) {
            ctx.shadowColor = element.shadowColor || '#000000';
            ctx.shadowBlur = element.shadowBlur || 4;
          }

          // Stroke
          if (element.stroke && element.strokeWidth) {
            ctx.strokeStyle = element.stroke;
            ctx.lineWidth = element.strokeWidth;
            ctx.strokeText(text, elemX, elemY);
          }

          ctx.fillText(text, elemX, elemY);
          break;
        }

        case 'qrcode':
        case 'barcode':
        case 'datamatrix':
        case 'pdf417': {
          const imageUrl = await renderCodeElement(element, labelIndex);
          if (imageUrl) {
            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => {
                ctx.drawImage(img, elemX, elemY, elemWidth, elemHeight);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = imageUrl;
            });
          }
          break;
        }

        case 'image': {
          if (element.src) {
            const img = new Image();
            await new Promise<void>((resolve) => {
              img.onload = () => {
                ctx.drawImage(img, elemX, elemY, elemWidth, elemHeight);
                resolve();
              };
              img.onerror = () => resolve();
              img.src = element.src!;
            });
          }
          break;
        }

        case 'rectangle': {
          if (element.shapeFill && element.shapeFill !== 'transparent') {
            ctx.fillStyle = element.shapeFill;
            if (element.cornerRadius && element.cornerRadius > 0) {
              const radius = element.cornerRadius * MM_TO_PX;
              ctx.beginPath();
              ctx.moveTo(elemX + radius, elemY);
              ctx.lineTo(elemX + elemWidth - radius, elemY);
              ctx.quadraticCurveTo(elemX + elemWidth, elemY, elemX + elemWidth, elemY + radius);
              ctx.lineTo(elemX + elemWidth, elemY + elemHeight - radius);
              ctx.quadraticCurveTo(elemX + elemWidth, elemY + elemHeight, elemX + elemWidth - radius, elemY + elemHeight);
              ctx.lineTo(elemX + radius, elemY + elemHeight);
              ctx.quadraticCurveTo(elemX, elemY + elemHeight, elemX, elemY + elemHeight - radius);
              ctx.lineTo(elemX, elemY + radius);
              ctx.quadraticCurveTo(elemX, elemY, elemX + radius, elemY);
              ctx.closePath();
              ctx.fill();
            } else {
              ctx.fillRect(elemX, elemY, elemWidth, elemHeight);
            }
          }

          if (element.shapeStroke && element.shapeStrokeWidth) {
            ctx.strokeStyle = element.shapeStroke;
            ctx.lineWidth = element.shapeStrokeWidth * MM_TO_PX / 3.78;
            if (element.cornerRadius && element.cornerRadius > 0) {
              const radius = element.cornerRadius * MM_TO_PX;
              ctx.beginPath();
              ctx.moveTo(elemX + radius, elemY);
              ctx.lineTo(elemX + elemWidth - radius, elemY);
              ctx.quadraticCurveTo(elemX + elemWidth, elemY, elemX + elemWidth, elemY + radius);
              ctx.lineTo(elemX + elemWidth, elemY + elemHeight - radius);
              ctx.quadraticCurveTo(elemX + elemWidth, elemY + elemHeight, elemX + elemWidth - radius, elemY + elemHeight);
              ctx.lineTo(elemX + radius, elemY + elemHeight);
              ctx.quadraticCurveTo(elemX, elemY + elemHeight, elemX, elemY + elemHeight - radius);
              ctx.lineTo(elemX, elemY + radius);
              ctx.quadraticCurveTo(elemX, elemY, elemX + radius, elemY);
              ctx.closePath();
              ctx.stroke();
            } else {
              ctx.strokeRect(elemX, elemY, elemWidth, elemHeight);
            }
          }
          break;
        }

        case 'circle': {
          ctx.beginPath();
          ctx.ellipse(elemX + elemWidth / 2, elemY + elemHeight / 2, elemWidth / 2, elemHeight / 2, 0, 0, Math.PI * 2);

          if (element.shapeFill && element.shapeFill !== 'transparent') {
            ctx.fillStyle = element.shapeFill;
            ctx.fill();
          }

          if (element.shapeStroke && element.shapeStrokeWidth) {
            ctx.strokeStyle = element.shapeStroke;
            ctx.lineWidth = element.shapeStrokeWidth * MM_TO_PX / 3.78;
            ctx.stroke();
          }
          break;
        }

        case 'line': {
          ctx.beginPath();
          ctx.moveTo(elemX, elemY + elemHeight / 2);
          ctx.lineTo(elemX + elemWidth, elemY + elemHeight / 2);
          ctx.strokeStyle = element.shapeStroke || '#000000';
          ctx.lineWidth = (element.shapeStrokeWidth || 1) * MM_TO_PX / 3.78;
          ctx.stroke();
          break;
        }
      }

      ctx.restore();
    }
  };

  useEffect(() => {
    renderSheet();
  }, [renderSheet]);

  // Clear cache when elements change
  useEffect(() => {
    setRenderedImages(new Map());
  }, [elements, sequentialConfig, csvData, dataMode]);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between p-2 border-b border-border">
        <span className="text-xs font-medium">Preview da Chapa</span>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setPreviewPage(Math.max(1, previewPage - 1))}
            disabled={previewPage <= 1}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-xs min-w-[3rem] text-center">
            {previewPage} / {totalPages}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={() => setPreviewPage(Math.min(totalPages, previewPage + 1))}
            disabled={previewPage >= totalPages}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-2 px-2 py-1.5 border-b border-border bg-muted/30">
        <ZoomOut className="h-3 w-3 text-muted-foreground" />
        <Slider
          value={[previewZoom]}
          onValueChange={([value]) => setPreviewZoom(value)}
          min={10}
          max={200}
          step={5}
          className="flex-1"
        />
        <ZoomIn className="h-3 w-3 text-muted-foreground" />
        <span className="text-xs text-muted-foreground w-10 text-right">{previewZoom}%</span>
      </div>

      <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-muted/20">
        <div
          className="shadow-lg"
          style={{
            transform: `scale(${previewZoom / 100})`,
            transformOrigin: 'center center',
          }}
        >
          <canvas ref={canvasRef} className="border border-border" />
        </div>
      </div>
    </div>
  );
}
