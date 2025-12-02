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

interface LabelState {
  // Sheet configuration
  sheetConfig: SheetConfig;
  setSheetConfig: (config: Partial<SheetConfig>) => void;
  
  // Canvas elements
  elements: LabelElement[];
  selectedElementId: string | null;
  addElement: (element: LabelElement) => void;
  updateElement: (id: string, updates: Partial<LabelElement>) => void;
  removeElement: (id: string) => void;
  setSelectedElement: (id: string | null) => void;
  duplicateElement: (id: string) => void;
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
  
  // Preview
  previewPage: number;
  setPreviewPage: (page: number) => void;
  totalPages: number;
  
  // Reset
  resetToDefault: () => void;
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

// Default Brazilian patrimony label template
const defaultElements: LabelElement[] = [
  {
    id: 'title',
    type: 'text',
    x: 25,
    y: 3,
    width: 40,
    height: 4,
    rotation: 0,
    opacity: 1,
    zIndex: 5,
    locked: false,
    text: 'PATRIMÔNIO',
    fontFamily: 'Arial',
    fontSize: 8,
    fontWeight: 'bold',
    fill: '#000000',
    textAlign: 'center',
  },
  {
    id: 'number',
    type: 'text',
    x: 25,
    y: 8,
    width: 40,
    height: 6,
    rotation: 0,
    opacity: 1,
    zIndex: 4,
    locked: false,
    text: '{PREFIXO}{NUMERO}',
    fontFamily: 'Arial',
    fontSize: 12,
    fontWeight: 'bold',
    fill: '#000000',
    textAlign: 'center',
    isDynamic: true,
    dynamicField: '{PREFIXO}{NUMERO}',
  },
  {
    id: 'qrcode',
    type: 'qrcode',
    x: 3,
    y: 5,
    width: 15,
    height: 15,
    rotation: 0,
    opacity: 1,
    zIndex: 3,
    locked: false,
    qrValue: '{PREFIXO}{NUMERO}',
    qrErrorLevel: 'M',
    qrForeground: '#000000',
    qrBackground: '#ffffff',
    isDynamic: true,
    dynamicField: '{PREFIXO}{NUMERO}',
  },
  {
    id: 'barcode',
    type: 'barcode',
    x: 5,
    y: 16,
    width: 40,
    height: 7,
    rotation: 0,
    opacity: 1,
    zIndex: 2,
    locked: false,
    barcodeType: 'CODE128',
    barcodeValue: '{NUMERO}',
    displayValue: true,
    isDynamic: true,
    dynamicField: '{NUMERO}',
  },
  {
    id: 'warning',
    type: 'text',
    x: 25,
    y: 23,
    width: 45,
    height: 2,
    rotation: 0,
    opacity: 1,
    zIndex: 1,
    locked: false,
    text: 'Não remover do local',
    fontFamily: 'Arial',
    fontSize: 5,
    fontWeight: 'normal',
    fontStyle: 'italic',
    fill: '#666666',
    textAlign: 'center',
  },
];

export const useLabelStore = create<LabelState>()(
  persist(
    (set, get) => ({
      // Sheet configuration
      sheetConfig: defaultSheetConfig,
      setSheetConfig: (config) => {
        set((state) => {
          const newConfig = { ...state.sheetConfig, ...config };
          
          // Auto-calculate columns and rows if enabled
          if (newConfig.autoCalculate) {
            const paper = PAPER_SIZES[newConfig.paperSize] || { 
              width: newConfig.customWidth, 
              height: newConfig.customHeight 
            };
            const availableWidth = paper.width - newConfig.marginLeft - newConfig.marginRight;
            const availableHeight = paper.height - newConfig.marginTop - newConfig.marginBottom;
            
            newConfig.columns = Math.floor(
              (availableWidth + newConfig.spacingHorizontal) / 
              (newConfig.labelWidth + newConfig.spacingHorizontal)
            );
            newConfig.rows = Math.floor(
              (availableHeight + newConfig.spacingVertical) / 
              (newConfig.labelHeight + newConfig.spacingVertical)
            );
          }
          
          return { sheetConfig: newConfig };
        });
      },
      
      // Canvas elements
      elements: defaultElements,
      selectedElementId: null,
      addElement: (element) => set((state) => ({ 
        elements: [...state.elements, element] 
      })),
      updateElement: (id, updates) => set((state) => ({
        elements: state.elements.map((el) => 
          el.id === id ? { ...el, ...updates } : el
        ),
      })),
      removeElement: (id) => set((state) => ({
        elements: state.elements.filter((el) => el.id !== id),
        selectedElementId: state.selectedElementId === id ? null : state.selectedElementId,
      })),
      setSelectedElement: (id) => set({ selectedElementId: id }),
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
          set({ elements: [...state.elements, newElement] });
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
        
        return { elements };
      }),
      
      // Data generation
      dataMode: 'sequential',
      setDataMode: (mode) => set({ dataMode: mode }),
      sequentialConfig: defaultSequentialConfig,
      setSequentialConfig: (config) => set((state) => ({
        sequentialConfig: { ...state.sequentialConfig, ...config },
      })),
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
          set({
            sheetConfig: template.sheetConfig,
            elements: template.elements,
            currentTemplateId: id,
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
      showGrid: true,
      setShowGrid: (show) => set({ showGrid: show }),
      snapToGrid: true,
      setSnapToGrid: (snap) => set({ snapToGrid: snap }),
      gridSize: 1,
      setGridSize: (size) => set({ gridSize: size }),
      
      // Preview
      previewPage: 1,
      setPreviewPage: (page) => set({ previewPage: page }),
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
        elements: defaultElements,
        selectedElementId: null,
        sequentialConfig: defaultSequentialConfig,
        csvData: [],
        csvHeaders: [],
        dataMode: 'sequential',
        zoom: 100,
        previewPage: 1,
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
