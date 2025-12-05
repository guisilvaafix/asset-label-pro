export interface SheetConfig {
  paperSize: string;
  customWidth: number;
  customHeight: number;
  marginTop: number;
  marginBottom: number;
  marginLeft: number;
  marginRight: number;
  labelWidth: number;
  labelHeight: number;
  spacingHorizontal: number;
  spacingVertical: number;
  columns: number;
  rows: number;
  autoCalculate: boolean;
}

export interface LabelElement {
  id: string;
  type: 'text' | 'image' | 'qrcode' | 'barcode' | 'datamatrix' | 'pdf417' | 'rectangle' | 'circle' | 'line';
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  opacity: number;
  zIndex: number;
  locked: boolean;
  // Text properties
  text?: string;
  fontFamily?: string;
  fontSize?: number;
  fontWeight?: string;
  fontStyle?: string;
  fill?: string;
  textAlign?: string;
  shadow?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  stroke?: string;
  strokeWidth?: number;
  // Image properties
  src?: string;
  // Barcode properties
  barcodeType?: BarcodeType;
  barcodeValue?: string;
  displayValue?: boolean;
  // QR Code properties
  qrErrorLevel?: 'L' | 'M' | 'Q' | 'H';
  qrValue?: string;
  qrForeground?: string;
  qrBackground?: string;
  // Data source configuration for this element
  dataSourceType?: 'sequential' | 'csv' | 'fixed';
  // Sequential configuration (when dataSourceType is 'sequential')
  customSequence?: {
    start: number;
    end: number;
    step: number;
    padLength: number;
    prefix: string;
    suffix: string;
  };
  // CSV column name (when dataSourceType is 'csv')
  csvColumn?: string;
  // Shape properties
  shapeFill?: string;
  shapeStroke?: string;
  shapeStrokeWidth?: number;
  cornerRadius?: number;
  // Dynamic field
  isDynamic?: boolean;
  dynamicField?: string;
}

export type BarcodeType = 
  | 'CODE128'
  | 'CODE128A'
  | 'CODE128B'
  | 'CODE128C'
  | 'CODE39'
  | 'CODE39EXT'
  | 'CODE93'
  | 'EAN13'
  | 'EAN8'
  | 'UPCA'
  | 'UPCE'
  | 'ITF14'
  | 'ITF'
  | 'CODABAR'
  | 'PHARMACODE'
  | 'MSI'
  | 'DATAMATRIX'
  | 'PDF417';

export interface DataRow {
  [key: string]: string;
}

export interface SequentialConfig {
  start: number;
  end: number;
  step: number;
  padLength: number;
  prefix: string;
  suffix: string;
}

export interface LabelTemplate {
  id: string;
  name: string;
  sheetConfig: SheetConfig;
  elements: LabelElement[];
  createdAt: string;
  updatedAt: string;
}

export interface ExportConfig {
  format: 'pdf' | 'png' | 'pdf-single';
  dpi: number;
  includeBleed: boolean;
  includeCropMarks: boolean;
  bleedSize: number;
}

export const PAPER_SIZES: Record<string, { width: number; height: number; label: string }> = {
  A4: { width: 210, height: 297, label: 'A4 (210 × 297 mm)' },
  A3: { width: 297, height: 420, label: 'A3 (297 × 420 mm)' },
  LETTER: { width: 215.9, height: 279.4, label: 'Letter (8.5 × 11 in)' },
  LEGAL: { width: 215.9, height: 355.6, label: 'Ofício (8.5 × 14 in)' },
  ROLL_100x30: { width: 100, height: 30, label: 'Bobina 100 × 30 mm' },
  ROLL_100x50: { width: 100, height: 50, label: 'Bobina 100 × 50 mm' },
  ROLL_60x40: { width: 60, height: 40, label: 'Bobina 60 × 40 mm' },
  CUSTOM: { width: 210, height: 297, label: 'Personalizado' },
};

export const BARCODE_TYPES: { value: BarcodeType; label: string; description: string }[] = [
  { value: 'CODE128', label: 'Code 128', description: 'Mais usado no Brasil' },
  { value: 'CODE128A', label: 'Code 128-A', description: 'Maiúsculas e controle' },
  { value: 'CODE128B', label: 'Code 128-B', description: 'Maiúsculas e minúsculas' },
  { value: 'CODE128C', label: 'Code 128-C', description: 'Apenas números (pares)' },
  { value: 'CODE39', label: 'Code 39', description: 'Alfanumérico padrão' },
  { value: 'CODE39EXT', label: 'Code 39 Extended', description: 'ASCII completo' },
  { value: 'CODE93', label: 'Code 93', description: 'Alta densidade' },
  { value: 'EAN13', label: 'EAN-13', description: 'Produtos (13 dígitos)' },
  { value: 'EAN8', label: 'EAN-8', description: 'Produtos pequenos (8 dígitos)' },
  { value: 'UPCA', label: 'UPC-A', description: 'EUA/Canadá (12 dígitos)' },
  { value: 'UPCE', label: 'UPC-E', description: 'Compacto (8 dígitos)' },
  { value: 'ITF14', label: 'ITF-14', description: 'Caixas/paletes' },
  { value: 'ITF', label: 'Interleaved 2 of 5', description: 'Apenas números' },
  { value: 'CODABAR', label: 'Codabar', description: 'Bibliotecas/bancos de sangue' },
  { value: 'PHARMACODE', label: 'Pharmacode', description: 'Indústria farmacêutica' },
  { value: 'MSI', label: 'MSI Plessey', description: 'Inventário/estoque' },
];

export const DYNAMIC_FIELDS = [
  { value: '{NUMERO}', label: 'Número', description: 'Número sequencial ou do CSV' },
  { value: '{PREFIXO}', label: 'Prefixo', description: 'Prefixo configurado' },
  { value: '{SUFIXO}', label: 'Sufixo', description: 'Sufixo configurado' },
  { value: '{DATA}', label: 'Data', description: 'Data atual (DD/MM/AAAA)' },
  { value: '{ANO}', label: 'Ano', description: 'Ano atual' },
  { value: '{MES}', label: 'Mês', description: 'Mês atual' },
  { value: '{CUSTOM1}', label: 'Campo 1', description: 'Campo personalizado 1' },
  { value: '{CUSTOM2}', label: 'Campo 2', description: 'Campo personalizado 2' },
  { value: '{CUSTOM3}', label: 'Campo 3', description: 'Campo personalizado 3' },
  { value: '{CUSTOM4}', label: 'Campo 4', description: 'Campo personalizado 4' },
  { value: '{CUSTOM5}', label: 'Campo 5', description: 'Campo personalizado 5' },
  { value: '{CUSTOM6}', label: 'Campo 6', description: 'Campo personalizado 6' },
  { value: '{CUSTOM7}', label: 'Campo 7', description: 'Campo personalizado 7' },
  { value: '{CUSTOM8}', label: 'Campo 8', description: 'Campo personalizado 8' },
  { value: '{CUSTOM9}', label: 'Campo 9', description: 'Campo personalizado 9' },
  { value: '{CUSTOM10}', label: 'Campo 10', description: 'Campo personalizado 10' },
];
