import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  SheetConfig,
  LabelElement,
  LabelTemplate,
  SequentialConfig,
  DataRow,
  ExportConfig,
  PAPER_SIZES
} from '@/types/label';
import { labelElementSchema, sheetConfigSchema, sequentialConfigSchema } from '@/schemas/labelSchemas';
import { validateData } from '@/utils/validation';

interface LabelState {
  // Sheet configuration
  sheetConfig: SheetConfig;
  sheetConfigLocked: boolean;
  setSheetConfig: (config: Partial<SheetConfig>, force?: boolean) => void;
  lockSheetConfig: () => void;
  unlockSheetConfig: () => void;

  // Canvas elements
  elements: LabelElement[];
  selectedElementId: string | null;
  selectedElementIds: string[]; // Múltiplas seleções
  addElement: (element: LabelElement) => void;
  updateElement: (id: string, updates: Partial<LabelElement>) => void;
  updateElements: (ids: string[], updates: Partial<LabelElement>) => void; // Atualizar múltiplos
  removeElement: (id: string) => void;
  removeElements: (ids: string[]) => void; // Remover múltiplos
  setSelectedElement: (id: string | null) => void;
  setSelectedElements: (ids: string[]) => void; // Selecionar múltiplos
  duplicateElement: (id: string) => void;
  duplicateElements: (ids: string[]) => void; // Duplicar múltiplos
  moveElementLayer: (id: string, direction: 'up' | 'down' | 'top' | 'bottom') => void;

  // Data generation
  dataMode: 'sequential' | 'csv';
  setDataMode: (mode: 'sequential' | 'csv') => void;
  sequentialConfig: SequentialConfig;
  setSequentialConfig: (config: Partial<SequentialConfig>) => void;
  csvData: DataRow[];
  csvHeaders: string[];
  setCsvData: (data: DataRow[], headers: string[]) => void;

  // Templates
  templates: LabelTemplate[];
  currentTemplateId: string | null;
  saveTemplate: (name: string) => void;
  loadTemplate: (id: string) => void;
  deleteTemplate: (id: string) => void;

  // Export
  exportConfig: ExportConfig;
  setExportConfig: (config: Partial<ExportConfig>) => void;

  // Canvas state
  zoom: number;
  setZoom: (zoom: number) => void;
  showGrid: boolean;
  setShowGrid: (show: boolean) => void;
  snapToGrid: boolean;
  setSnapToGrid: (snap: boolean) => void;
  gridSize: number;
  setGridSize: (size: number) => void;

  // History (Undo/Redo)
  history: LabelElement[][];
  historyIndex: number;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;

  // Preview
  previewPage: number;
  setPreviewPage: (page: number) => void;
  previewZoom: number;
  setPreviewZoom: (zoom: number) => void;
  totalPages: number;

  // Reset
  resetToDefault: () => void;
  loadElements: (elements: LabelElement[]) => void;
}

const defaultSheetConfig: SheetConfig = {
  paperSize: 'A4',
  customWidth: 210,
  customHeight: 297,
  marginTop: 10,
  marginBottom: 10,
  marginLeft: 10,
  marginRight: 10,
  labelWidth: 50,
  labelHeight: 25,
  spacingHorizontal: 2,
  spacingVertical: 2,
  columns: 3,
  rows: 10,
  autoCalculate: true,
};

const defaultSequentialConfig: SequentialConfig = {
  start: 1,
  end: 100,
  step: 1,
  padLength: 6,
  prefix: 'PAT-',
  suffix: '',
};

const defaultExportConfig: ExportConfig = {
  format: 'pdf',
  dpi: 300,
  includeBleed: false,
  includeCropMarks: false,
  bleedSize: 3,
};

// Start with empty canvas - user can add elements as needed
const defaultElements: LabelElement[] = [];

export const useLabelStore = create<LabelState>()(
  persist(
    (set, get) => ({
      // Sheet configuration
      sheetConfig: defaultSheetConfig,
      sheetConfigLocked: false,

      setSheetConfig: (config, force = false) => {
        const state = get();
        // Se as configurações estão bloqueadas e não é uma operação forçada, não permite alteração
        if (state.sheetConfigLocked && !force) {
          console.warn('Configurações da chapa bloqueadas pela O.S');
          return;
        }

        const newConfig = { ...state.sheetConfig, ...config };

        // Validar configuração
        const validation = validateData(sheetConfigSchema, newConfig, {
          showToast: true,
          toastTitle: 'Erro na configuração da chapa',
        });

        if (!validation.success) {
          console.error('Validação falhou:', validation.errors);
          return;
        }

        set((state) => {
          const validConfig = validation.data! as SheetConfig;

          // Auto-calculate columns and rows if enabled
          if (validConfig.autoCalculate) {
            const paper = PAPER_SIZES[validConfig.paperSize] || {
              width: validConfig.customWidth,
              height: validConfig.customHeight
            };
            const availableWidth = paper.width - validConfig.marginLeft - validConfig.marginRight;
            const availableHeight = paper.height - validConfig.marginTop - validConfig.marginBottom;

            validConfig.columns = Math.floor(
              (availableWidth + validConfig.spacingHorizontal) /
              (validConfig.labelWidth + validConfig.spacingHorizontal)
            );
            validConfig.rows = Math.floor(
              (availableHeight + validConfig.spacingVertical) /
              (validConfig.labelHeight + validConfig.spacingVertical)
            );
          }

          return { sheetConfig: validConfig };
        });
      },

      lockSheetConfig: () => set({ sheetConfigLocked: true }),
      unlockSheetConfig: () => set({ sheetConfigLocked: false }),

      // Canvas elements
      elements: defaultElements,
      selectedElementId: null,
      selectedElementIds: [],

      // History
      history: [defaultElements],
      historyIndex: 0,

      addElement: (element) => {
        // Validar elemento antes de adicionar
        const validation = validateData(labelElementSchema, element, {
          showToast: true,
          toastTitle: 'Erro ao adicionar elemento',
        });

        if (!validation.success) {
          console.error('Validação do elemento falhou:', validation.errors);
          return;
        }

        set((state) => {
          const newElements = [...state.elements, validation.data! as LabelElement];
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newElements))); // Deep copy

          return {
            elements: newElements,
            history: newHistory.slice(-50), // Manter apenas últimos 50 estados
            historyIndex: Math.min(newHistory.length - 1, 49),
          };
        });
      },

      updateElement: (id, updates) => set((state) => {
        const newElements = state.elements.map((el) =>
          el.id === id ? { ...el, ...updates } : el
        );

        // Só salvar no histórico se for uma mudança significativa (não micro-movimentos)
        const shouldSaveHistory = !updates.x && !updates.y; // Não salvar movimentos pequenos

        if (shouldSaveHistory) {
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newElements)));

          return {
            elements: newElements,
            history: newHistory.slice(-50),
            historyIndex: Math.min(newHistory.length - 1, 49),
          };
        }

        return { elements: newElements };
      }),

      removeElement: (id) => set((state) => {
        const newElements = state.elements.filter((el) => el.id !== id);
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(newElements)));

        return {
          elements: newElements,
          selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
          history: newHistory.slice(-50),
          historyIndex: Math.min(newHistory.length - 1, 49),
        };
      }),

      setSelectedElement: (id) => set({
        selectedElementId: id,
        selectedElementIds: id ? [id] : []
      }),

      setSelectedElements: (ids) => set({
        selectedElementIds: ids,
        selectedElementId: ids.length === 1 ? ids[0] : null
      }),

      updateElements: (ids, updates) => set((state) => {
        const newElements = state.elements.map((el) =>
          ids.includes(el.id) ? { ...el, ...updates } : el
        );

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(newElements)));

        return {
          elements: newElements,
          history: newHistory.slice(-50),
          historyIndex: Math.min(newHistory.length - 1, 49),
        };
      }),

      removeElements: (ids) => set((state) => {
        const newElements = state.elements.filter((el) => !ids.includes(el.id));
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(newElements)));

        return {
          elements: newElements,
          selectedElementId: ids.includes(state.selectedElementId || '') ? null : state.selectedElementId,
          selectedElementIds: state.selectedElementIds.filter(id => !ids.includes(id)),
          history: newHistory.slice(-50),
          historyIndex: Math.min(newHistory.length - 1, 49),
        };
      }),

      duplicateElements: (ids) => {
        const state = get();
        const elementsToDuplicate = state.elements.filter((el) => ids.includes(el.id));

        if (elementsToDuplicate.length === 0) return;

        const newElements = elementsToDuplicate.map((element) => ({
          ...element,
          id: `${element.type}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          x: element.x + 2,
          y: element.y + 2,
        }));

        const allElements = [...state.elements, ...newElements];
        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(allElements)));

        set({
          elements: allElements,
          selectedElementIds: newElements.map(el => el.id),
          selectedElementId: newElements.length === 1 ? newElements[0].id : null,
          history: newHistory.slice(-50),
          historyIndex: Math.min(newHistory.length - 1, 49),
        });
      },

      duplicateElement: (id) => {
        const state = get();
        const element = state.elements.find((el) => el.id === id);
        if (element) {
          const newElement = {
            ...element,
            id: `${element.type}-${Date.now()}`,
            x: element.x + 2,
            y: element.y + 2,
          };
          const newElements = [...state.elements, newElement];
          const newHistory = state.history.slice(0, state.historyIndex + 1);
          newHistory.push(JSON.parse(JSON.stringify(newElements)));

          set({
            elements: newElements,
            history: newHistory.slice(-50),
            historyIndex: Math.min(newHistory.length - 1, 49),
          });
        }
      },

      moveElementLayer: (id, direction) => set((state) => {
        const elements = [...state.elements];
        const index = elements.findIndex((el) => el.id === id);
        if (index === -1) return state;

        const element = elements[index];
        const maxZ = Math.max(...elements.map((el) => el.zIndex));
        const minZ = Math.min(...elements.map((el) => el.zIndex));

        switch (direction) {
          case 'up':
            element.zIndex = Math.min(element.zIndex + 1, maxZ + 1);
            break;
          case 'down':
            element.zIndex = Math.max(element.zIndex - 1, 0);
            break;
          case 'top':
            element.zIndex = maxZ + 1;
            break;
          case 'bottom':
            element.zIndex = 0;
            break;
        }

        const newHistory = state.history.slice(0, state.historyIndex + 1);
        newHistory.push(JSON.parse(JSON.stringify(elements)));

        return {
          elements,
          history: newHistory.slice(-50),
          historyIndex: Math.min(newHistory.length - 1, 49),
        };
      }),

      // Undo/Redo
      undo: () => set((state) => {
        if (state.historyIndex > 0) {
          const newIndex = state.historyIndex - 1;
          return {
            elements: JSON.parse(JSON.stringify(state.history[newIndex])),
            historyIndex: newIndex,
            selectedElementId: null,
          };
        }
        return state;
      }),

      redo: () => set((state) => {
        if (state.historyIndex < state.history.length - 1) {
          const newIndex = state.historyIndex + 1;
          return {
            elements: JSON.parse(JSON.stringify(state.history[newIndex])),
            historyIndex: newIndex,
            selectedElementId: null,
          };
        }
        return state;
      }),

      get canUndo() {
        return get().historyIndex > 0;
      },

      get canRedo() {
        return get().historyIndex < get().history.length - 1;
      },


      // Data generation
      dataMode: 'sequential',
      setDataMode: (mode) => set({ dataMode: mode }),
      sequentialConfig: defaultSequentialConfig,
      setSequentialConfig: (config) => {
        const state = get();
        const newConfig = { ...state.sequentialConfig, ...config };

        // Validar configuração sequencial
        const validation = validateData(sequentialConfigSchema, newConfig, {
          showToast: true,
          toastTitle: 'Erro na configuração sequencial',
        });

        if (!validation.success) {
          console.error('Validação falhou:', validation.errors);
          return;
        }

        set({ sequentialConfig: validation.data! as SequentialConfig });
      },
      csvData: [],
      csvHeaders: [],
      setCsvData: (data, headers) => set({ csvData: data, csvHeaders: headers }),

      // Templates
      templates: [],
      currentTemplateId: null,
      saveTemplate: (name) => {
        const state = get();
        const template: LabelTemplate = {
          id: `template-${Date.now()}`,
          name,
          sheetConfig: state.sheetConfig,
          elements: state.elements,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set((state) => ({
          templates: [...state.templates, template],
          currentTemplateId: template.id,
        }));
      },
      loadTemplate: (id) => {
        const state = get();
        const template = state.templates.find((t) => t.id === id);
        if (template) {
          // Carregar apenas os elementos, preservando a configuração da chapa atual
          // Isso é importante porque a O.S pode ter configurações bloqueadas
          set({
            elements: JSON.parse(JSON.stringify(template.elements)), // Deep copy
            currentTemplateId: id,
            history: [JSON.parse(JSON.stringify(template.elements))],
            historyIndex: 0,
          });
        }
      },
      deleteTemplate: (id) => set((state) => ({
        templates: state.templates.filter((t) => t.id !== id),
        currentTemplateId: state.currentTemplateId === id ? null : state.currentTemplateId,
      })),

      // Export
      exportConfig: defaultExportConfig,
      setExportConfig: (config) => set((state) => ({
        exportConfig: { ...state.exportConfig, ...config },
      })),

      // Canvas state
      zoom: 100,
      setZoom: (zoom) => set({ zoom: Math.max(10, Math.min(500, zoom)) }),
      showGrid: false,
      setShowGrid: (show) => set({ showGrid: show }),
      snapToGrid: true,
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),
      gridSize: 1,
      setGridSize: (size) => set({ gridSize: size }),

      // Preview
      previewPage: 1,
      setPreviewPage: (page) => set({ previewPage: page }),
      previewZoom: 50,
      setPreviewZoom: (zoom) => set({ previewZoom: Math.max(10, Math.min(200, zoom)) }),
      get totalPages() {
        const state = get();
        const labelsPerPage = state.sheetConfig.columns * state.sheetConfig.rows;
        const totalLabels = state.dataMode === 'sequential'
          ? Math.ceil((state.sequentialConfig.end - state.sequentialConfig.start + 1) / state.sequentialConfig.step)
          : state.csvData.length;
        return Math.ceil(totalLabels / labelsPerPage) || 1;
      },

      // Reset
      resetToDefault: () => set({
        sheetConfig: defaultSheetConfig,
        sheetConfigLocked: false,
        elements: defaultElements,
        selectedElementId: null,
        selectedElementIds: [],
        sequentialConfig: defaultSequentialConfig,
        csvData: [],
        csvHeaders: [],
        dataMode: 'sequential',
        zoom: 100,
        previewPage: 1,
        previewZoom: 50,
      }),

      // Load elements (para restaurar elementos salvos de uma O.S)
      loadElements: (elements) => set({
        elements: JSON.parse(JSON.stringify(elements)), // Deep copy
        history: [JSON.parse(JSON.stringify(elements))],
        historyIndex: 0,
        selectedElementId: null,
        selectedElementIds: [],
      }),
    }),
    {
      name: 'etiquetapro-storage',
      partialize: (state) => ({
        templates: state.templates,
        exportConfig: state.exportConfig,
      }),
    }
  )
);
