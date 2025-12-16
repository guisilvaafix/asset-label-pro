import { z } from 'zod';

// Schema para configuração de sequência
export const sequentialConfigSchema = z.object({
    start: z.number().int().min(0, 'Início deve ser maior ou igual a 0'),
    end: z.number().int().min(0, 'Fim deve ser maior ou igual a 0'),
    step: z.number().int().min(1, 'Passo deve ser maior que 0'),
    prefix: z.string().max(50, 'Prefixo muito longo'),
    suffix: z.string().max(50, 'Sufixo muito longo'),
    padLength: z.number().int().min(0).max(20, 'Comprimento de padding inválido'),
}).refine(data => data.end >= data.start, {
    message: 'Fim deve ser maior ou igual ao início',
    path: ['end'],
});

// Schema para configuração da chapa
export const sheetConfigSchema = z.object({
    paperSize: z.string().min(1, 'Tamanho do papel é obrigatório'),
    customWidth: z.number().positive('Largura deve ser positiva'),
    customHeight: z.number().positive('Altura deve ser positiva'),
    labelWidth: z.number().positive('Largura da etiqueta deve ser positiva').max(1000, 'Largura muito grande'),
    labelHeight: z.number().positive('Altura da etiqueta deve ser positiva').max(1000, 'Altura muito grande'),
    columns: z.number().int().positive('Número de colunas deve ser positivo').max(50, 'Muitas colunas'),
    rows: z.number().int().positive('Número de linhas deve ser positivo').max(100, 'Muitas linhas'),
    marginTop: z.number().min(0, 'Margem superior não pode ser negativa').max(100, 'Margem muito grande'),
    marginBottom: z.number().min(0, 'Margem inferior não pode ser negativa').max(100, 'Margem muito grande'),
    marginLeft: z.number().min(0, 'Margem esquerda não pode ser negativa').max(100, 'Margem muito grande'),
    marginRight: z.number().min(0, 'Margem direita não pode ser negativa').max(100, 'Margem muito grande'),
    spacingHorizontal: z.number().min(0, 'Espaçamento horizontal não pode ser negativo').max(50, 'Espaçamento muito grande'),
    spacingVertical: z.number().min(0, 'Espaçamento vertical não pode ser negativo').max(50, 'Espaçamento muito grande'),
    autoCalculate: z.boolean().optional(),
});

// Schema base para elementos
const baseElementSchema = z.object({
    id: z.string().min(1, 'ID do elemento é obrigatório'),
    x: z.number().min(0, 'Posição X não pode ser negativa'),
    y: z.number().min(0, 'Posição Y não pode ser negativa'),
    width: z.number().positive('Largura deve ser positiva').max(1000, 'Largura muito grande'),
    height: z.number().positive('Altura deve ser positiva').max(1000, 'Altura muito grande'),
    rotation: z.number().min(-360).max(360).optional(),
    opacity: z.number().min(0).max(1).optional(),
    zIndex: z.number().int().optional(),
    locked: z.boolean().optional(),
    visible: z.boolean().optional(),
});

// Schema para elemento de texto
export const textElementSchema = baseElementSchema.extend({
    type: z.literal('text'),
    text: z.string().max(1000, 'Texto muito longo'),
    fontSize: z.number().positive('Tamanho da fonte deve ser positivo').max(500, 'Fonte muito grande').optional(),
    fontFamily: z.string().optional(),
    fontWeight: z.enum(['normal', 'bold']).optional(),
    fontStyle: z.enum(['normal', 'italic']).optional(),
    textAlign: z.enum(['left', 'center', 'right']).optional(),
    fill: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
    stroke: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor da borda inválida').optional(),
    strokeWidth: z.number().min(0).max(50).optional(),
    shadow: z.boolean().optional(),
    shadowColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor da sombra inválida').optional(),
    shadowBlur: z.number().min(0).max(100).optional(),
    customSequence: sequentialConfigSchema.optional(),
});

// Schema para elemento de QR Code
export const qrCodeElementSchema = baseElementSchema.extend({
    type: z.literal('qrcode'),
    qrValue: z.string().min(1, 'Valor do QR Code é obrigatório').max(2000, 'Valor muito longo'),
    qrErrorLevel: z.enum(['L', 'M', 'Q', 'H']).optional(),
    qrForeground: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor inválida').optional(),
    qrBackground: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor de fundo inválida').optional(),
    customSequence: sequentialConfigSchema.optional(),
});

// Schema para elemento de código de barras
export const barcodeElementSchema = baseElementSchema.extend({
    type: z.enum(['barcode', 'datamatrix', 'pdf417']),
    barcodeValue: z.string().min(1, 'Valor do código de barras é obrigatório').max(500, 'Valor muito longo'),
    barcodeType: z.string().optional(),
    displayValue: z.boolean().optional(),
    customSequence: sequentialConfigSchema.optional(),
});

// Schema para elemento de imagem
export const imageElementSchema = baseElementSchema.extend({
    type: z.literal('image'),
    src: z.string().url('URL da imagem inválida').or(z.string().startsWith('data:', 'Deve ser URL ou data URL')),
});

// Schema para elementos de forma
export const shapeElementSchema = baseElementSchema.extend({
    type: z.enum(['rectangle', 'circle', 'line']),
    shapeFill: z.string().regex(/^#[0-9A-Fa-f]{6}$|^transparent$/, 'Cor de preenchimento inválida').optional(),
    shapeStroke: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Cor da borda inválida').optional(),
    shapeStrokeWidth: z.number().min(0).max(50).optional(),
    cornerRadius: z.number().min(0).max(100).optional(),
});

// Schema discriminado para todos os tipos de elementos
export const labelElementSchema = z.discriminatedUnion('type', [
    textElementSchema,
    qrCodeElementSchema,
    barcodeElementSchema,
    imageElementSchema,
    shapeElementSchema,
]);

// Schema para configuração de exportação
export const exportConfigSchema = z.object({
    format: z.enum(['pdf', 'png', 'zip']),
    quality: z.number().min(0.1).max(1).optional(),
    includeBleed: z.boolean().optional(),
    cropMarks: z.boolean().optional(),
});

// Schema para template de etiqueta
export const labelTemplateSchema = z.object({
    id: z.string().min(1),
    name: z.string().min(1, 'Nome do template é obrigatório').max(100, 'Nome muito longo'),
    description: z.string().max(500, 'Descrição muito longa').optional(),
    sheetConfig: sheetConfigSchema,
    elements: z.array(labelElementSchema),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
});

// Schema para dados CSV
export const csvDataSchema = z.array(
    z.record(z.string(), z.string())
).min(1, 'Dados CSV não podem estar vazios');

// Tipos TypeScript inferidos dos schemas
export type SequentialConfig = z.infer<typeof sequentialConfigSchema>;
export type SheetConfig = z.infer<typeof sheetConfigSchema>;
export type TextElement = z.infer<typeof textElementSchema>;
export type QRCodeElement = z.infer<typeof qrCodeElementSchema>;
export type BarcodeElement = z.infer<typeof barcodeElementSchema>;
export type ImageElement = z.infer<typeof imageElementSchema>;
export type ShapeElement = z.infer<typeof shapeElementSchema>;
export type LabelElement = z.infer<typeof labelElementSchema>;
export type ExportConfig = z.infer<typeof exportConfigSchema>;
export type LabelTemplate = z.infer<typeof labelTemplateSchema>;
export type CSVData = z.infer<typeof csvDataSchema>;
