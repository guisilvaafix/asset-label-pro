import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, Line, IText, FabricImage, FabricObject } from 'fabric';
import '@/types/fabric-extensions.d';
import { useLabelStore } from '@/store/labelStore';
import { generateBarcode, generateQRCode, replaceDynamicFields } from '@/utils/barcodeGenerator';
import { generateElementSequenceData } from '@/utils/sequenceGenerator';

const MM_TO_PX = 3.78; // Approximate conversion at 96 DPI

// Extend FabricObject to include data property
interface ExtendedFabricObject extends FabricObject {
  data?: { id: string; [key: string]: unknown };
}

export function LabelCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { 
    sheetConfig, 
    elements, 
    selectedElementId, 
    setSelectedElement,
    updateElement,
    zoom,
    showGrid,
    snapToGrid,
    gridSize,
    sequentialConfig
  } = useLabelStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Calculate canvas dimensions
  const labelWidthPx = sheetConfig.labelWidth * MM_TO_PX;
  const labelHeightPx = sheetConfig.labelHeight * MM_TO_PX;

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: labelWidthPx,
      height: labelHeightPx,
      backgroundColor: '#ffffff',
      selection: true,
      preserveObjectStacking: true,
    });

    fabricRef.current = canvas;
    setIsInitialized(true);

    // Selection event
    canvas.on('selection:created', (e) => {
      const selected = e.selected?.[0] as ExtendedFabricObject | undefined;
      if (selected?.data?.id) {
        setSelectedElement(selected.data.id);
      }
    });

    canvas.on('selection:updated', (e) => {
      const selected = e.selected?.[0] as ExtendedFabricObject | undefined;
      if (selected?.data?.id) {
        setSelectedElement(selected.data.id);
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedElement(null);
    });

    // Object modified event
    canvas.on('object:modified', (e) => {
      const obj = e.target as ExtendedFabricObject | undefined;
      if (obj?.data?.id) {
        const scaleX = obj.scaleX || 1;
        const scaleY = obj.scaleY || 1;
        
        updateElement(obj.data.id, {
          x: (obj.left || 0) / MM_TO_PX,
          y: (obj.top || 0) / MM_TO_PX,
          width: ((obj.width || 0) * scaleX) / MM_TO_PX,
          height: ((obj.height || 0) * scaleY) / MM_TO_PX,
          rotation: obj.angle || 0,
        });

        // Reset scale after updating dimensions
        obj.set({ scaleX: 1, scaleY: 1 });
        canvas.renderAll();
      }
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Update canvas size
  useEffect(() => {
    if (!fabricRef.current) return;
    
    fabricRef.current.setDimensions({
      width: labelWidthPx,
      height: labelHeightPx,
    });
    fabricRef.current.renderAll();
  }, [labelWidthPx, labelHeightPx]);

  // Render elements
  const renderElements = useCallback(async () => {
    if (!fabricRef.current || !isInitialized) return;

    const canvas = fabricRef.current;
    
    // Store current selection
    const activeObj = canvas.getActiveObject() as ExtendedFabricObject | undefined;
    const currentSelection = activeObj?.data?.id;
    
    // Clear canvas
    canvas.clear();
    canvas.backgroundColor = '#ffffff';

    // Draw grid if enabled
    if (showGrid) {
      const gridSizePx = gridSize * MM_TO_PX;
      for (let x = 0; x <= labelWidthPx; x += gridSizePx) {
        const line = new Line([x, 0, x, labelHeightPx], {
          stroke: '#e0e0e0',
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
      for (let y = 0; y <= labelHeightPx; y += gridSizePx) {
        const line = new Line([0, y, labelWidthPx, y], {
          stroke: '#e0e0e0',
          strokeWidth: 0.5,
          selectable: false,
          evented: false,
        });
        canvas.add(line);
      }
    }

    // Sample data for preview
    const sampleData = {
      numero: sequentialConfig.start.toString().padStart(sequentialConfig.padLength, '0'),
      prefixo: sequentialConfig.prefix,
      sufixo: sequentialConfig.suffix,
      custom: {},
    };

    // Sort elements by zIndex and render
    const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

    for (const element of sortedElements) {
      let fabricObj: ExtendedFabricObject | null = null;

      switch (element.type) {
        case 'text': {
          let text = element.text || '';
          if (element.isDynamic) {
            text = replaceDynamicFields(text, sampleData);
          }
          
          const textObj = new IText(text, {
            left: element.x * MM_TO_PX,
            top: element.y * MM_TO_PX,
            fontSize: element.fontSize || 12,
            fontFamily: element.fontFamily || 'Arial',
            fontWeight: element.fontWeight as 'normal' | 'bold' || 'normal',
            fontStyle: element.fontStyle as 'normal' | 'italic' || 'normal',
            fill: element.fill || '#000000',
            textAlign: element.textAlign as 'left' | 'center' | 'right' || 'left',
            angle: element.rotation,
            opacity: element.opacity,
            lockMovementX: element.locked,
            lockMovementY: element.locked,
            lockRotation: element.locked,
            lockScalingX: element.locked,
            lockScalingY: element.locked,
          });
          fabricObj = textObj as ExtendedFabricObject;
          break;
        }

        case 'rectangle': {
          const rectObj = new Rect({
            left: element.x * MM_TO_PX,
            top: element.y * MM_TO_PX,
            width: element.width * MM_TO_PX,
            height: element.height * MM_TO_PX,
            fill: element.shapeFill || 'transparent',
            stroke: element.shapeStroke || '#000000',
            strokeWidth: element.shapeStrokeWidth || 1,
            rx: (element.cornerRadius || 0) * MM_TO_PX,
            ry: (element.cornerRadius || 0) * MM_TO_PX,
            angle: element.rotation,
            opacity: element.opacity,
            lockMovementX: element.locked,
            lockMovementY: element.locked,
            lockRotation: element.locked,
            lockScalingX: element.locked,
            lockScalingY: element.locked,
          });
          fabricObj = rectObj as ExtendedFabricObject;
          break;
        }

        case 'circle': {
          const circleObj = new Circle({
            left: element.x * MM_TO_PX,
            top: element.y * MM_TO_PX,
            radius: Math.min(element.width, element.height) * MM_TO_PX / 2,
            fill: element.shapeFill || 'transparent',
            stroke: element.shapeStroke || '#000000',
            strokeWidth: element.shapeStrokeWidth || 1,
            angle: element.rotation,
            opacity: element.opacity,
            lockMovementX: element.locked,
            lockMovementY: element.locked,
            lockRotation: element.locked,
            lockScalingX: element.locked,
            lockScalingY: element.locked,
          });
          fabricObj = circleObj as ExtendedFabricObject;
          break;
        }

        case 'line': {
          const lineObj = new Line([0, 0, element.width * MM_TO_PX, 0], {
            left: element.x * MM_TO_PX,
            top: element.y * MM_TO_PX,
            stroke: element.shapeStroke || '#000000',
            strokeWidth: element.shapeStrokeWidth || 1,
            angle: element.rotation,
            opacity: element.opacity,
            lockMovementX: element.locked,
            lockMovementY: element.locked,
            lockRotation: element.locked,
            lockScalingX: element.locked,
            lockScalingY: element.locked,
          });
          fabricObj = lineObj as ExtendedFabricObject;
          break;
        }

        case 'qrcode': {
          let value = element.qrValue || '';
          if (element.isDynamic) {
            // Usa sequência personalizada se configurada
            const elementData = generateElementSequenceData(element, 0, sequentialConfig);
            value = replaceDynamicFields(value, {
              ...elementData,
              custom: {},
            });
          }
          
          try {
            const qrDataUrl = await generateQRCode(value, {
              width: Math.round(element.width * MM_TO_PX * 2),
              errorCorrectionLevel: element.qrErrorLevel || 'M',
              color: {
                dark: element.qrForeground || '#000000',
                light: element.qrBackground || '#ffffff',
              },
            });
            
            const img = await FabricImage.fromURL(qrDataUrl);
            img.set({
              left: element.x * MM_TO_PX,
              top: element.y * MM_TO_PX,
              scaleX: (element.width * MM_TO_PX) / (img.width || 1),
              scaleY: (element.height * MM_TO_PX) / (img.height || 1),
              angle: element.rotation,
              opacity: element.opacity,
              lockMovementX: element.locked,
              lockMovementY: element.locked,
              lockRotation: element.locked,
              lockScalingX: element.locked,
              lockScalingY: element.locked,
            });
            fabricObj = img as ExtendedFabricObject;
          } catch (error) {
            console.error('Error generating QR code:', error);
          }
          break;
        }

        case 'barcode':
        case 'datamatrix':
        case 'pdf417': {
          let value = element.barcodeValue || '';
          if (element.isDynamic) {
            // Usa sequência personalizada se configurada
            const elementData = generateElementSequenceData(element, 0, sequentialConfig);
            value = replaceDynamicFields(value, {
              ...elementData,
              custom: {},
            });
          }
          
          try {
            const barcodeType = element.type === 'datamatrix' ? 'DATAMATRIX' :
                               element.type === 'pdf417' ? 'PDF417' :
                               element.barcodeType || 'CODE128';
            
            const barcodeDataUrl = await generateBarcode(value, barcodeType, {
              height: Math.round(element.height * MM_TO_PX * 0.8),
              displayValue: element.displayValue !== false,
            });
            
            const img = await FabricImage.fromURL(barcodeDataUrl);
            img.set({
              left: element.x * MM_TO_PX,
              top: element.y * MM_TO_PX,
              scaleX: (element.width * MM_TO_PX) / (img.width || 1),
              scaleY: (element.height * MM_TO_PX) / (img.height || 1),
              angle: element.rotation,
              opacity: element.opacity,
              lockMovementX: element.locked,
              lockMovementY: element.locked,
              lockRotation: element.locked,
              lockScalingX: element.locked,
              lockScalingY: element.locked,
            });
            fabricObj = img as ExtendedFabricObject;
          } catch (error) {
            console.error('Error generating barcode:', error);
          }
          break;
        }

        case 'image': {
          if (element.src) {
            try {
              const img = await FabricImage.fromURL(element.src);
              img.set({
                left: element.x * MM_TO_PX,
                top: element.y * MM_TO_PX,
                scaleX: (element.width * MM_TO_PX) / (img.width || 1),
                scaleY: (element.height * MM_TO_PX) / (img.height || 1),
                angle: element.rotation,
                opacity: element.opacity,
                lockMovementX: element.locked,
                lockMovementY: element.locked,
                lockRotation: element.locked,
                lockScalingX: element.locked,
                lockScalingY: element.locked,
              });
              fabricObj = img as ExtendedFabricObject;
            } catch (error) {
              console.error('Error loading image:', error);
            }
          }
          break;
        }
      }

      if (fabricObj) {
        fabricObj.data = { id: element.id };
        canvas.add(fabricObj);
        
        // Restore selection
        if (element.id === currentSelection) {
          canvas.setActiveObject(fabricObj);
        }
      }
    }

    canvas.renderAll();
  }, [elements, showGrid, gridSize, labelWidthPx, labelHeightPx, isInitialized, sequentialConfig]);

  useEffect(() => {
    renderElements();
  }, [renderElements]);

  // Handle selection from store
  useEffect(() => {
    if (!fabricRef.current) return;
    
    const canvas = fabricRef.current;
    if (selectedElementId) {
      const obj = canvas.getObjects().find((o) => {
        const extObj = o as ExtendedFabricObject;
        return extObj.data?.id === selectedElementId;
      });
      if (obj && canvas.getActiveObject() !== obj) {
        canvas.setActiveObject(obj);
        canvas.renderAll();
      }
    } else {
      canvas.discardActiveObject();
      canvas.renderAll();
    }
  }, [selectedElementId]);

  return (
    <div 
      ref={containerRef}
      className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-8"
    >
      <div 
        className="shadow-xl rounded-sm"
        style={{ 
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
        }}
      >
        <canvas ref={canvasRef} />
      </div>
    </div>
  );
}
