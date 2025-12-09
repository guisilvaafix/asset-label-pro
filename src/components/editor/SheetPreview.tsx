import { useEffect, useRef, useCallback } from 'react';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { useLabelStore } from '@/store/labelStore';
import { PAPER_SIZES } from '@/types/label';

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

  const paper = PAPER_SIZES[sheetConfig.paperSize] || {
    width: sheetConfig.customWidth,
    height: sheetConfig.customHeight,
  };

  const labelsPerPage = sheetConfig.columns * sheetConfig.rows;
  const totalLabels = dataMode === 'sequential'
    ? Math.ceil((sequentialConfig.end - sequentialConfig.start + 1) / sequentialConfig.step)
    : csvData.length || 1;
  const totalPages = Math.max(1, Math.ceil(totalLabels / labelsPerPage));

  // Render blueprint (simplified preview)
  const renderBlueprint = useCallback(() => {
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
    ctx.strokeStyle = '#000000';
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
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 1.5;
        ctx.strokeRect(labelX, labelY, labelWidth, labelHeight);

        // Draw element outlines (blueprint style)
        const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

        for (const element of sortedElements) {
          const elemX = labelX + element.x * MM_TO_PX;
          const elemY = labelY + element.y * MM_TO_PX;
          const elemWidth = element.width * MM_TO_PX;
          const elemHeight = element.height * MM_TO_PX;

          ctx.globalAlpha = element.opacity * 0.7; // More visible for better clarity

          // Draw outline based on element type - all in black
          switch (element.type) {
            case 'text': {
              // Draw text box outline
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              ctx.setLineDash([2, 2]);
              ctx.strokeRect(elemX, elemY, elemWidth, elemHeight);
              ctx.setLineDash([]);
              
              // Draw text label with better quality
              ctx.fillStyle = '#000000';
              const fontSize = Math.max(8, Math.min(12, (element.fontSize || 12) * (MM_TO_PX / 3.78) * 0.7));
              ctx.font = `${element.fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px ${element.fontFamily || 'Arial'}`;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              const text = element.text?.substring(0, 15) || 'Texto';
              ctx.fillText(text, elemX + elemWidth / 2, elemY + elemHeight / 2);
              break;
            }

            case 'qrcode': {
              // Draw QR code placeholder with pattern
              // Indicação visual se tem sequência personalizada
              if (element.customSequence) {
                ctx.strokeStyle = '#8b5cf6';
                ctx.lineWidth = 2.5;
              } else {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
              }
              ctx.strokeRect(elemX, elemY, elemWidth, elemHeight);
              
              // Draw QR pattern (simplified) in black
              ctx.fillStyle = element.customSequence ? '#8b5cf6' : '#000000';
              const moduleSize = Math.max(1.5, Math.min(4, elemWidth / 20));
              for (let i = 0; i < 7; i++) {
                for (let j = 0; j < 7; j++) {
                  if ((i === 0 || i === 6 || j === 0 || j === 6) || 
                      ((i === 2 || i === 4) && (j === 2 || j === 4))) {
                    ctx.fillRect(
                      elemX + i * moduleSize * 3,
                      elemY + j * moduleSize * 3,
                      moduleSize * 2,
                      moduleSize * 2
                    );
                  }
                }
              }
              
              ctx.font = 'bold 8px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('QR', elemX + elemWidth / 2, elemY + elemHeight / 2);
              break;
            }

            case 'barcode':
            case 'datamatrix':
            case 'pdf417': {
              // Draw barcode placeholder with better pattern
              // Indicação visual se tem sequência personalizada
              if (element.customSequence) {
                ctx.strokeStyle = '#8b5cf6';
                ctx.lineWidth = 2.5;
              } else {
                ctx.strokeStyle = '#000000';
                ctx.lineWidth = 2;
              }
              ctx.strokeRect(elemX, elemY, elemWidth, elemHeight);
              
              // Draw more detailed bars pattern
              ctx.fillStyle = element.customSequence ? '#8b5cf6' : '#000000';
              const barWidth = Math.max(1.5, elemWidth / 20);
              const numBars = Math.floor(elemWidth / (barWidth * 2));
              for (let i = 0; i < numBars; i++) {
                // Vary bar heights for more realistic look
                const barHeight = elemHeight * (0.6 + (i % 3) * 0.15);
                const barY = elemY + (elemHeight - barHeight) / 2;
                if (i % 2 === 0 || (i % 3 === 0)) {
                  ctx.fillRect(elemX + i * barWidth * 2, barY, barWidth, barHeight);
                }
              }
              break;
            }

            case 'rectangle': {
              if (element.shapeFill && element.shapeFill !== 'transparent') {
                ctx.fillStyle = '#000000';
                ctx.globalAlpha = element.opacity * 0.15;
                ctx.fillRect(elemX, elemY, elemWidth, elemHeight);
              }
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              ctx.globalAlpha = element.opacity * 0.8;
              if (element.cornerRadius && element.cornerRadius > 0) {
                const radius = element.cornerRadius * MM_TO_PX;
                ctx.beginPath();
                // Draw rounded rectangle manually for compatibility
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
              break;
            }

            case 'circle': {
              ctx.beginPath();
              ctx.ellipse(elemX + elemWidth / 2, elemY + elemHeight / 2, elemWidth / 2, elemHeight / 2, 0, 0, Math.PI * 2);
              if (element.shapeFill && element.shapeFill !== 'transparent') {
                ctx.fillStyle = '#000000';
                ctx.globalAlpha = element.opacity * 0.15;
                ctx.fill();
              }
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              ctx.globalAlpha = element.opacity * 0.8;
              ctx.stroke();
              break;
            }

            case 'line': {
              ctx.beginPath();
              ctx.moveTo(elemX, elemY + elemHeight / 2);
              ctx.lineTo(elemX + elemWidth, elemY + elemHeight / 2);
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = Math.max(2, (element.shapeStrokeWidth || 1) * MM_TO_PX / 3.78);
              ctx.globalAlpha = element.opacity * 0.8;
              ctx.stroke();
              break;
            }

            case 'image': {
              // Image placeholder with better quality
              ctx.fillStyle = '#f5f5f5';
              ctx.fillRect(elemX, elemY, elemWidth, elemHeight);
              ctx.strokeStyle = '#000000';
              ctx.lineWidth = 2;
              ctx.setLineDash([3, 3]);
              ctx.strokeRect(elemX, elemY, elemWidth, elemHeight);
              ctx.setLineDash([]);
              ctx.fillStyle = '#000000';
              ctx.font = 'bold 8px Arial';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText('IMG', elemX + elemWidth / 2, elemY + elemHeight / 2);
              break;
            }
          }

          ctx.globalAlpha = 1;
        }
      }
    }
  }, [paper, sheetConfig, elements, previewPage, labelsPerPage, totalLabels]);

  useEffect(() => {
    renderBlueprint();
  }, [renderBlueprint]);

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
