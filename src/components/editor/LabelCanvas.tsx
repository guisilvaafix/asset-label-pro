import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas as FabricCanvas, Rect, Circle, Line, IText, FabricImage, FabricObject, ActiveSelection } from 'fabric';
import '@/types/fabric-extensions.d';
import { useLabelStore } from '@/store/labelStore';
import { generateBarcode, generateQRCode, replaceDynamicFields } from '@/utils/barcodeGenerator';
import { generateElementSequenceData } from '@/utils/sequenceGenerator';
import { CanvasWithRulers } from './CanvasWithRulers';
import { CanvasHints } from './CanvasHints';

const MM_TO_PX = 3.78; // Approximate conversion at 96 DPI

// Extend FabricObject to include data property
interface ExtendedFabricObject extends FabricObject {
  data?: { id: string;[key: string]: unknown };
}

interface LabelCanvasProps {
  showHints?: boolean;
  onCloseHints?: () => void;
}

export function LabelCanvas({ showHints, onCloseHints }: LabelCanvasProps = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<FabricCanvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    sheetConfig,
    elements,
    selectedElementId,
    selectedElementIds,
    setSelectedElement,
    setSelectedElements,
    updateElement,
    updateElements,
    removeElement,
    removeElements,
    undo,
    redo,
    zoom,
    setZoom,
    showGrid,
    snapToGrid,
    gridSize,
    sequentialConfig
  } = useLabelStore();

  const [isInitialized, setIsInitialized] = useState(false);

  // Rastrear posição anterior para detectar direção do movimento (para snap inteligente)
  const previousPositionRef = useRef<{ x: number; y: number } | null>(null);

  // Calculate canvas dimensions
  const labelWidthPx = sheetConfig.labelWidth * MM_TO_PX;
  const labelHeightPx = sheetConfig.labelHeight * MM_TO_PX;

  // Initialize canvas
  useEffect(() => {
    if (!canvasRef.current || fabricRef.current) return;

    const canvas = new FabricCanvas(canvasRef.current, {
      width: labelWidthPx,
      height: labelHeightPx,
      backgroundColor: '#f8f9fa',
      selection: true, // Permite seleção por área (arrastar)
      preserveObjectStacking: true,
      // Habilita seleção múltipla com Shift+Click
      fireRightClick: true,
      stopContextMenu: true,
    });

    // Configurar tecla de seleção múltipla (Shift ou Ctrl)
    canvas.selectionKey = 'shiftKey';

    fabricRef.current = canvas;
    setIsInitialized(true);

    // Handler para seleção múltipla com Shift+Click ou Ctrl+Click
    canvas.on('mouse:down', (e) => {
      const pointer = e.e as MouseEvent;

      // Se Shift ou Ctrl está pressionado e há um objeto sob o cursor
      const isMultiSelectKey = pointer.shiftKey || pointer.ctrlKey || pointer.metaKey;

      if (isMultiSelectKey && e.target) {
        // Prevenir comportamento padrão IMEDIATAMENTE
        e.e.preventDefault();
        e.e.stopPropagation();

        const clickedObject = e.target as ExtendedFabricObject;

        // Se não há data.id, não é um objeto editável
        if (!clickedObject.data?.id) return;

        const activeSelection = canvas.getActiveObject();

        // Se já existe uma seleção ativa
        if (activeSelection) {
          // Se é uma seleção múltipla (ActiveSelection)
          if (activeSelection.type === 'activeSelection') {
            const selection = activeSelection as any;
            const objects = selection.getObjects();

            // Verificar se o objeto clicado já está na seleção
            const isAlreadySelected = objects.some((obj: ExtendedFabricObject) =>
              obj.data?.id === clickedObject.data?.id
            );

            if (isAlreadySelected) {
              // Remover da seleção
              selection.removeWithUpdate(clickedObject);
              canvas.discardActiveObject();

              const remaining = selection.getObjects();
              if (remaining.length > 1) {
                const newSelection = new ActiveSelection(remaining, {
                  canvas: canvas,
                });
                canvas.setActiveObject(newSelection);
              } else if (remaining.length === 1) {
                canvas.setActiveObject(remaining[0]);
              }
            } else {
              // Adicionar à seleção
              selection.addWithUpdate(clickedObject);
              canvas.setActiveObject(selection);
            }

            canvas.requestRenderAll();
          } else {
            // É uma seleção única, criar ActiveSelection com os dois objetos
            if (activeSelection !== clickedObject) {
              canvas.discardActiveObject();
              const newSelection = new ActiveSelection(
                [activeSelection, clickedObject],
                { canvas: canvas }
              );
              canvas.setActiveObject(newSelection);
              canvas.requestRenderAll();
            }
          }
        } else {
          // Se não há seleção, selecionar o objeto clicado
          canvas.setActiveObject(clickedObject);
          canvas.requestRenderAll();
        }
      }
    });

    // Selection events
    canvas.on('selection:created', (e) => {
      const selected = e.selected;
      if (selected && selected.length > 0) {
        const selectedIds = selected
          .map(obj => (obj as ExtendedFabricObject)?.data?.id)
          .filter(Boolean) as string[];

        if (selectedIds.length === 1) {
          setSelectedElement(selectedIds[0]);
        } else if (selectedIds.length > 1) {
          setSelectedElements(selectedIds);
        }
      }
    });

    canvas.on('selection:updated', (e) => {
      const selected = e.selected;
      if (selected && selected.length > 0) {
        const selectedIds = selected
          .map(obj => (obj as ExtendedFabricObject)?.data?.id)
          .filter(Boolean) as string[];

        if (selectedIds.length === 1) {
          setSelectedElement(selectedIds[0]);
        } else if (selectedIds.length > 1) {
          setSelectedElements(selectedIds);
        }
      }
    });

    canvas.on('selection:cleared', () => {
      setSelectedElement(null);
    });

    // Object modified event (move, resize, rotate)
    canvas.on('object:modified', (e) => {
      const target = e.target;

      // Verificar se é uma seleção múltipla (ActiveSelection)
      if (target && target.type === 'activeSelection') {
        const activeSelection = target as any;
        const objects = activeSelection.getObjects() as ExtendedFabricObject[];

        objects.forEach((obj) => {
          if (obj?.data?.id) {
            const scaleX = obj.scaleX || 1;
            const scaleY = obj.scaleY || 1;
            const left = obj.left || 0;
            const top = obj.top || 0;

            // Calcular posição absoluta considerando o grupo
            const groupLeft = activeSelection.left || 0;
            const groupTop = activeSelection.top || 0;
            const absoluteLeft = groupLeft + left;
            const absoluteTop = groupTop + top;

            updateElement(obj.data.id, {
              x: absoluteLeft / MM_TO_PX,
              y: absoluteTop / MM_TO_PX,
              width: ((obj.width || 0) * scaleX) / MM_TO_PX,
              height: ((obj.height || 0) * scaleY) / MM_TO_PX,
              rotation: obj.angle || 0,
            });

            // Reset scale after updating dimensions
            obj.set({ scaleX: 1, scaleY: 1 });
          }
        });

        canvas.renderAll();
      } else {
        // Seleção única
        const obj = target as ExtendedFabricObject | undefined;
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
      }
    });

    // Text editing finished event (when user exits text editing mode)
    canvas.on('text:editing:exited', (e) => {
      const obj = e.target as ExtendedFabricObject & IText | undefined;
      if (obj?.data?.id && obj.text !== undefined) {
        updateElement(obj.data.id, {
          text: obj.text,
        });
      }
    });

    // Smart Guidelines - Linhas guias com snap magnético opcional
    const guidelines: Line[] = [];
    const GUIDELINE_TOLERANCE = 5; // pixels para mostrar a guideline (visual)
    const SNAP_TOLERANCE = 2; // pixels para snap magnético (quando snapToGrid ativo)

    const drawGuideline = (coords: [number, number, number, number]) => {
      const line = new Line(coords, {
        stroke: '#ff0000',
        strokeWidth: 1,
        selectable: false,
        evented: false,
        strokeDashArray: [5, 5],
      });
      guidelines.push(line);
      canvas.add(line);
    };

    const clearGuidelines = () => {
      guidelines.forEach(line => canvas.remove(line));
      guidelines.length = 0;
    };

    canvas.on('object:moving', (e) => {
      const activeObject = e.target;
      if (!activeObject) return;

      clearGuidelines();

      const activeObjectBounds = activeObject.getBoundingRect();
      const activeLeft = activeObjectBounds.left;
      const activeTop = activeObjectBounds.top;
      const activeRight = activeLeft + activeObjectBounds.width;
      const activeBottom = activeTop + activeObjectBounds.height;
      const activeCenterX = activeLeft + activeObjectBounds.width / 2;
      const activeCenterY = activeTop + activeObjectBounds.height / 2;

      let snappedX = false;
      let snappedY = false;

      // Função auxiliar para verificar se está se aproximando do alvo
      const isApproaching = (current: number, target: number, axis: 'x' | 'y'): boolean => {
        if (!previousPositionRef.current) return true; // Primeira vez, permite snap

        const previous = axis === 'x' ? previousPositionRef.current.x : previousPositionRef.current.y;
        const previousDiff = Math.abs(previous - target);
        const currentDiff = Math.abs(current - target);

        // Está se aproximando se a distância atual é menor que a anterior
        return currentDiff < previousDiff;
      };

      // Verificar alinhamento com outros objetos
      canvas.getObjects().forEach((obj) => {
        const extObj = obj as ExtendedFabricObject;
        if (obj === activeObject || !extObj.data || (obj.type === 'line' && obj.strokeDashArray)) return;

        const objBounds = obj.getBoundingRect();
        const objLeft = objBounds.left;
        const objTop = objBounds.top;
        const objRight = objLeft + objBounds.width;
        const objBottom = objTop + objBounds.height;
        const objCenterX = objLeft + objBounds.width / 2;
        const objCenterY = objTop + objBounds.height / 2;

        // Alinhamento vertical (esquerda, centro, direita)
        if (!snappedX) {
          const leftDiff = Math.abs(activeLeft - objLeft);
          const centerXDiff = Math.abs(activeCenterX - objCenterX);
          const rightDiff = Math.abs(activeRight - objRight);

          if (leftDiff < GUIDELINE_TOLERANCE) {
            drawGuideline([objLeft, 0, objLeft, labelHeightPx]);
            // Snap só se: Shift pressionado, dentro da tolerância E se aproximando
            if (e.e?.shiftKey && leftDiff < SNAP_TOLERANCE && isApproaching(activeLeft, objLeft, 'x')) {
              activeObject.set({ left: objLeft });
              snappedX = true;
            }
          }
          if (centerXDiff < GUIDELINE_TOLERANCE && !snappedX) {
            drawGuideline([objCenterX, 0, objCenterX, labelHeightPx]);
            if (e.e?.shiftKey && centerXDiff < SNAP_TOLERANCE && isApproaching(activeCenterX, objCenterX, 'x')) {
              const offset = activeCenterX - activeLeft;
              activeObject.set({ left: objCenterX - offset });
              snappedX = true;
            }
          }
          if (rightDiff < GUIDELINE_TOLERANCE && !snappedX) {
            drawGuideline([objRight, 0, objRight, labelHeightPx]);
            if (e.e?.shiftKey && rightDiff < SNAP_TOLERANCE && isApproaching(activeRight, objRight, 'x')) {
              activeObject.set({ left: objRight - activeObjectBounds.width });
              snappedX = true;
            }
          }
        }

        // Alinhamento horizontal (topo, centro, base)
        if (!snappedY) {
          const topDiff = Math.abs(activeTop - objTop);
          const centerYDiff = Math.abs(activeCenterY - objCenterY);
          const bottomDiff = Math.abs(activeBottom - objBottom);

          if (topDiff < GUIDELINE_TOLERANCE) {
            drawGuideline([0, objTop, labelWidthPx, objTop]);
            if (e.e?.shiftKey && topDiff < SNAP_TOLERANCE && isApproaching(activeTop, objTop, 'y')) {
              activeObject.set({ top: objTop });
              snappedY = true;
            }
          }
          if (centerYDiff < GUIDELINE_TOLERANCE && !snappedY) {
            drawGuideline([0, objCenterY, labelWidthPx, objCenterY]);
            if (e.e?.shiftKey && centerYDiff < SNAP_TOLERANCE && isApproaching(activeCenterY, objCenterY, 'y')) {
              const offset = activeCenterY - activeTop;
              activeObject.set({ top: objCenterY - offset });
              snappedY = true;
            }
          }
          if (bottomDiff < GUIDELINE_TOLERANCE && !snappedY) {
            drawGuideline([0, objBottom, labelWidthPx, objBottom]);
            if (e.e?.shiftKey && bottomDiff < SNAP_TOLERANCE && isApproaching(activeBottom, objBottom, 'y')) {
              activeObject.set({ top: objBottom - activeObjectBounds.height });
              snappedY = true;
            }
          }
        }
      });

      // Alinhamento com as bordas e centro do canvas
      if (!snappedX) {
        const leftEdgeDiff = Math.abs(activeLeft);
        const rightEdgeDiff = Math.abs(activeRight - labelWidthPx);
        const centerXDiff = Math.abs(activeCenterX - labelWidthPx / 2);

        if (leftEdgeDiff < GUIDELINE_TOLERANCE) {
          drawGuideline([0, 0, 0, labelHeightPx]);
          if (e.e?.shiftKey && leftEdgeDiff < SNAP_TOLERANCE && isApproaching(activeLeft, 0, 'x')) {
            activeObject.set({ left: 0 });
            snappedX = true;
          }
        }
        if (rightEdgeDiff < GUIDELINE_TOLERANCE && !snappedX) {
          drawGuideline([labelWidthPx, 0, labelWidthPx, labelHeightPx]);
          if (e.e?.shiftKey && rightEdgeDiff < SNAP_TOLERANCE && isApproaching(activeRight, labelWidthPx, 'x')) {
            activeObject.set({ left: labelWidthPx - activeObjectBounds.width });
            snappedX = true;
          }
        }
        if (centerXDiff < GUIDELINE_TOLERANCE && !snappedX) {
          const canvasCenterX = labelWidthPx / 2;
          drawGuideline([canvasCenterX, 0, canvasCenterX, labelHeightPx]);
          if (e.e?.shiftKey && centerXDiff < SNAP_TOLERANCE && isApproaching(activeCenterX, canvasCenterX, 'x')) {
            const offset = activeCenterX - activeLeft;
            activeObject.set({ left: canvasCenterX - offset });
            snappedX = true;
          }
        }
      }

      if (!snappedY) {
        const topEdgeDiff = Math.abs(activeTop);
        const bottomEdgeDiff = Math.abs(activeBottom - labelHeightPx);
        const centerYDiff = Math.abs(activeCenterY - labelHeightPx / 2);

        if (topEdgeDiff < GUIDELINE_TOLERANCE) {
          drawGuideline([0, 0, labelWidthPx, 0]);
          if (e.e?.shiftKey && topEdgeDiff < SNAP_TOLERANCE && isApproaching(activeTop, 0, 'y')) {
            activeObject.set({ top: 0 });
            snappedY = true;
          }
        }
        if (bottomEdgeDiff < GUIDELINE_TOLERANCE && !snappedY) {
          drawGuideline([0, labelHeightPx, labelWidthPx, labelHeightPx]);
          if (e.e?.shiftKey && bottomEdgeDiff < SNAP_TOLERANCE && isApproaching(activeBottom, labelHeightPx, 'y')) {
            activeObject.set({ top: labelHeightPx - activeObjectBounds.height });
            snappedY = true;
          }
        }
        if (centerYDiff < GUIDELINE_TOLERANCE && !snappedY) {
          const canvasCenterY = labelHeightPx / 2;
          drawGuideline([0, canvasCenterY, labelWidthPx, canvasCenterY]);
          if (e.e?.shiftKey && centerYDiff < SNAP_TOLERANCE && isApproaching(activeCenterY, canvasCenterY, 'y')) {
            const offset = activeCenterY - activeTop;
            activeObject.set({ top: canvasCenterY - offset });
            snappedY = true;
          }
        }
      }

      // Atualizar posição anterior para o próximo movimento
      previousPositionRef.current = {
        x: activeLeft,
        y: activeTop
      };

      canvas.renderAll();
    });

    // Resetar posição anterior quando parar de mover
    canvas.on('object:modified', () => {
      previousPositionRef.current = null;
      clearGuidelines();
    });
    canvas.on('selection:cleared', () => {
      previousPositionRef.current = null;
      clearGuidelines();
    });
    canvas.on('selection:updated', () => {
      previousPositionRef.current = null;
      clearGuidelines();
    });

    // Keyboard controls (Arrow keys to move, Delete to remove, Ctrl+Z/Y for undo/redo)
    const handleKeyDown = (e: KeyboardEvent) => {
      // Verificar se o foco está em um elemento editável (input, textarea, select, etc.)
      const activeElement = document.activeElement;
      const isEditableElement = activeElement && (
        activeElement.tagName === 'INPUT' ||
        activeElement.tagName === 'TEXTAREA' ||
        activeElement.tagName === 'SELECT' ||
        activeElement.getAttribute('contenteditable') === 'true'
      );

      // Não fazer nada se estiver digitando em um campo de formulário
      if (isEditableElement) return;

      const activeObject = canvas.getActiveObject() as ExtendedFabricObject | undefined;

      // Não fazer nada se estiver editando texto no canvas
      const isEditingText = activeObject && 'isEditing' in activeObject && (activeObject as any).isEditing;
      if (isEditingText) return;

      // Ctrl+Z para Undo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
        return;
      }

      // Ctrl+Y ou Ctrl+Shift+Z para Redo
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault();
        redo();
        return;
      }

      // Delete ou Backspace para remover elemento(s)
      if ((e.key === 'Delete' || e.key === 'Backspace') && activeObject) {
        e.preventDefault();

        // Verificar se é seleção múltipla
        if (activeObject.type === 'activeSelection') {
          const activeSelection = activeObject as any;
          const objects = activeSelection.getObjects() as ExtendedFabricObject[];
          const idsToRemove = objects
            .map(obj => obj.data?.id)
            .filter(Boolean) as string[];

          if (idsToRemove.length > 0) {
            removeElements(idsToRemove);
            objects.forEach(obj => canvas.remove(obj));
            canvas.discardActiveObject();
            canvas.renderAll();
          }
        } else if (activeObject?.data?.id) {
          // Seleção única
          removeElement(activeObject.data.id);
          canvas.remove(activeObject);
          canvas.renderAll();
        }
        return;
      }

      // Setas para mover elemento(s)
      if (activeObject && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();

        const moveAmount = e.shiftKey ? 5 : 1; // 5mm com Shift, 1mm sem

        // Verificar se é seleção múltipla
        if (activeObject.type === 'activeSelection') {
          const activeSelection = activeObject as any;
          const objects = activeSelection.getObjects() as ExtendedFabricObject[];

          objects.forEach(obj => {
            const currentLeft = obj.left || 0;
            const currentTop = obj.top || 0;

            switch (e.key) {
              case 'ArrowUp':
                obj.set({ top: currentTop - moveAmount * MM_TO_PX });
                break;
              case 'ArrowDown':
                obj.set({ top: currentTop + moveAmount * MM_TO_PX });
                break;
              case 'ArrowLeft':
                obj.set({ left: currentLeft - moveAmount * MM_TO_PX });
                break;
              case 'ArrowRight':
                obj.set({ left: currentLeft + moveAmount * MM_TO_PX });
                break;
            }

            obj.setCoords();

            // Atualizar no store
            if (obj.data?.id) {
              const groupLeft = activeSelection.left || 0;
              const groupTop = activeSelection.top || 0;
              const absoluteLeft = groupLeft + (obj.left || 0);
              const absoluteTop = groupTop + (obj.top || 0);

              updateElement(obj.data.id, {
                x: absoluteLeft / MM_TO_PX,
                y: absoluteTop / MM_TO_PX,
              });
            }
          });

          activeSelection.setCoords();
        } else {
          // Seleção única
          const currentLeft = activeObject.left || 0;
          const currentTop = activeObject.top || 0;

          switch (e.key) {
            case 'ArrowUp':
              activeObject.set({ top: currentTop - moveAmount * MM_TO_PX });
              break;
            case 'ArrowDown':
              activeObject.set({ top: currentTop + moveAmount * MM_TO_PX });
              break;
            case 'ArrowLeft':
              activeObject.set({ left: currentLeft - moveAmount * MM_TO_PX });
              break;
            case 'ArrowRight':
              activeObject.set({ left: currentLeft + moveAmount * MM_TO_PX });
              break;
          }

          activeObject.setCoords();

          // Atualizar no store
          if (activeObject.data?.id) {
            updateElement(activeObject.data.id, {
              x: (activeObject.left || 0) / MM_TO_PX,
              y: (activeObject.top || 0) / MM_TO_PX,
            });
          }
        }

        canvas.renderAll();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // Controle de zoom via scroll do mouse (useEffect separado)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleWheel = (e: WheelEvent) => {
      // Prevenir o comportamento padrão do navegador (zoom da página)
      e.preventDefault();

      // Determinar a direção do scroll (negativo = scroll para cima = zoom in)
      const delta = e.deltaY;
      const zoomIncrement = 10; // Incremento de 10%

      // Calcular novo zoom
      let newZoom = zoom;
      if (delta < 0) {
        // Scroll para cima - Zoom In
        newZoom = Math.min(500, zoom + zoomIncrement);
      } else {
        // Scroll para baixo - Zoom Out
        newZoom = Math.max(10, zoom - zoomIncrement);
      }

      // Aplicar novo zoom
      setZoom(newZoom);
    };

    container.addEventListener('wheel', handleWheel, { passive: false });

    return () => {
      container.removeEventListener('wheel', handleWheel);
    };
  }, [zoom, setZoom]);

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
    canvas.backgroundColor = '#f8f9fa';

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

  // Usar uma versão memoizada dos elementos para evitar re-renders desnecessários
  const elementsRef = useRef<typeof elements>([]);

  useEffect(() => {
    const previous = elementsRef.current;

    // Verificar se é uma mudança estrutural (adicionar/remover elementos)
    const isStructuralChange =
      elements.length !== previous.length ||
      elements.some((el, idx) => el.id !== previous[idx]?.id);

    // Se for mudança estrutural, sempre re-renderizar
    if (isStructuralChange) {
      elementsRef.current = elements;
      renderElements();
      return;
    }

    // Se não for estrutural, verificar se alguma propriedade visual mudou
    const hasVisualChange = elements.some((el, idx) => {
      const prev = previous[idx];
      if (!prev) return true;

      // Propriedades que afetam a renderização visual
      // NOTA: text, qrValue e barcodeValue NÃO estão aqui para evitar re-renders durante digitação
      return (
        el.x !== prev.x ||
        el.y !== prev.y ||
        el.width !== prev.width ||
        el.height !== prev.height ||
        el.rotation !== prev.rotation ||
        el.opacity !== prev.opacity ||
        el.locked !== prev.locked ||
        el.fill !== prev.fill ||
        el.src !== prev.src ||
        el.shapeFill !== prev.shapeFill ||
        el.shapeStroke !== prev.shapeStroke ||
        el.shapeStrokeWidth !== prev.shapeStrokeWidth ||
        el.fontFamily !== prev.fontFamily ||
        el.fontSize !== prev.fontSize ||
        el.fontWeight !== prev.fontWeight ||
        el.fontStyle !== prev.fontStyle ||
        el.textAlign !== prev.textAlign ||
        el.displayValue !== prev.displayValue ||
        el.barcodeType !== prev.barcodeType ||
        el.qrErrorLevel !== prev.qrErrorLevel ||
        el.qrForeground !== prev.qrForeground ||
        el.qrBackground !== prev.qrBackground ||
        el.cornerRadius !== prev.cornerRadius ||
        el.dataSourceType !== prev.dataSourceType ||
        el.csvColumn !== prev.csvColumn ||
        JSON.stringify(el.customSequence) !== JSON.stringify(prev.customSequence)
      );
    });

    if (hasVisualChange) {
      elementsRef.current = elements;
      renderElements();
    }
  }, [elements, renderElements]);

  // Re-render when grid settings change
  useEffect(() => {
    if (isInitialized) {
      renderElements();
    }
  }, [showGrid, gridSize, isInitialized, renderElements]);

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
      className="flex-1 overflow-auto bg-muted/30 flex items-center justify-center p-8 relative"
    >
      {/* Show hints when canvas is empty */}
      {elements.length === 0 && <CanvasHints show={showHints} onClose={onCloseHints} />}
      {/* Show hints when button is clicked */}
      {showHints && elements.length > 0 && <CanvasHints show={showHints} onClose={onCloseHints} />}

      <div
        style={{
          transform: `scale(${zoom / 100})`,
          transformOrigin: 'center center',
        }}
      >
        <CanvasWithRulers
          width={labelWidthPx}
          height={labelHeightPx}
          mmToPx={MM_TO_PX}
        >
          <div className="shadow-xl rounded-sm overflow-hidden">
            <canvas ref={canvasRef} />
          </div>
        </CanvasWithRulers>
      </div>
    </div>
  );
}
