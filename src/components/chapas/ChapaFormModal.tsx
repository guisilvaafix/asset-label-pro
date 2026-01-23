import { useState, useEffect, useMemo } from 'react';
import { useChapasStore, type Chapa } from '@/store/chapasStore';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { Grid3X3, AlertCircle, Wand2 } from 'lucide-react';

interface ChapaFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: 'create' | 'edit';
  chapaId?: string;
}

export function ChapaFormModal({ open, onOpenChange, mode, chapaId }: ChapaFormModalProps) {
  const { createChapa, updateChapa, getChapa, getChapaByName, chapas } = useChapasStore();

  const [name, setName] = useState('');
  const [width, setWidth] = useState(210);
  const [height, setHeight] = useState(297);
  const [labelWidth, setLabelWidth] = useState(50);
  const [labelHeight, setLabelHeight] = useState(30);
  const [columns, setColumns] = useState(4);
  const [rows, setRows] = useState(8);
  const [marginTop, setMarginTop] = useState(5);
  const [marginBottom, setMarginBottom] = useState(5);
  const [marginLeft, setMarginLeft] = useState(5);
  const [marginRight, setMarginRight] = useState(5);
  const [spacingHorizontal, setSpacingHorizontal] = useState(2);
  const [spacingVertical, setSpacingVertical] = useState(2);
  const [isSaving, setIsSaving] = useState(false);

  // Load existing chapa data when editing
  useEffect(() => {
    if (mode === 'edit' && chapaId) {
      const chapa = getChapa(chapaId);
      if (chapa) {
        setName(chapa.name);
        setWidth(chapa.width);
        setHeight(chapa.height);
        setLabelWidth(chapa.labelWidth);
        setLabelHeight(chapa.labelHeight);
        setColumns(chapa.columns);
        setRows(chapa.rows);
        setMarginTop(chapa.marginTop ?? 5);
        setMarginBottom(chapa.marginBottom ?? 5);
        setMarginLeft(chapa.marginLeft ?? 5);
        setMarginRight(chapa.marginRight ?? 5);
        setSpacingHorizontal(chapa.spacingHorizontal ?? 2);
        setSpacingVertical(chapa.spacingVertical ?? 2);
      }
    }
  }, [mode, chapaId, getChapa, open]);

  // Reset form when modal opens for create
  useEffect(() => {
    if (mode === 'create' && open) {
      setName('');
      setWidth(210);
      setHeight(297);
      setLabelWidth(50);
      setLabelHeight(30);
      setColumns(4);
      setRows(8);
      setMarginTop(5);
      setMarginBottom(5);
      setMarginLeft(5);
      setMarginRight(5);
      setSpacingHorizontal(2);
      setSpacingVertical(2);
    }
  }, [mode, open]);

  // Calculate total labels
  const totalLabels = useMemo(() => columns * rows, [columns, rows]);

  const recalculateLayout = (values: Partial<{
    width: number;
    height: number;
    labelWidth: number;
    labelHeight: number;
    marginTop: number;
    marginBottom: number;
    marginLeft: number;
    marginRight: number;
    spacingHorizontal: number;
    spacingVertical: number;
  }>) => {
    const w = values.width ?? width;
    const h = values.height ?? height;
    const lw = values.labelWidth ?? labelWidth;
    const lh = values.labelHeight ?? labelHeight;
    const mt = values.marginTop ?? marginTop;
    const mb = values.marginBottom ?? marginBottom;
    const ml = values.marginLeft ?? marginLeft;
    const mr = values.marginRight ?? marginRight;
    const sh = values.spacingHorizontal ?? spacingHorizontal;
    const sv = values.spacingVertical ?? spacingVertical;

    const usableWidth = w - ml - mr;
    const usableHeight = h - mt - mb;

    if (usableWidth <= 0 || usableHeight <= 0) return;

    const maxCols = Math.floor((usableWidth + sh) / (lw + sh));
    const maxRows = Math.floor((usableHeight + sv) / (lh + sv));

    setColumns(Math.max(1, maxCols));
    setRows(Math.max(1, maxRows));
  };

  // Validate form
  const validation = useMemo(() => {
    const errors: string[] = [];

    if (!name.trim()) {
      errors.push('Nome é obrigatório');
    } else {
      const existing = getChapaByName(name.trim());
      if (existing && (mode === 'create' || existing.id !== chapaId)) {
        errors.push('Já existe uma chapa com este nome');
      }
    }

    if (width <= 0) errors.push('Largura da chapa deve ser maior que 0');
    if (height <= 0) errors.push('Altura da chapa deve ser maior que 0');
    if (labelWidth <= 0) errors.push('Largura da etiqueta deve ser maior que 0');
    if (labelHeight <= 0) errors.push('Altura da etiqueta deve ser maior que 0');
    if (columns < 1) errors.push('Mínimo 1 coluna');
    if (rows < 1) errors.push('Mínimo 1 linha');

    // Check if labels fit in the sheet
    const usableWidth = width - marginLeft - marginRight;
    const usableHeight = height - marginTop - marginBottom;
    const totalLabelWidth = columns * labelWidth + (columns - 1) * spacingHorizontal;
    const totalLabelHeight = rows * labelHeight + (rows - 1) * spacingVertical;

    if (totalLabelWidth > usableWidth) {
      errors.push('Etiquetas excedem a largura disponível da chapa');
    }
    if (totalLabelHeight > usableHeight) {
      errors.push('Etiquetas excedem a altura disponível da chapa');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }, [name, width, height, labelWidth, labelHeight, columns, rows, marginTop, marginBottom, marginLeft, marginRight, spacingHorizontal, spacingVertical, mode, chapaId, getChapaByName]);

  const handleSave = async () => {
    if (!validation.isValid) {
      toast.error(validation.errors[0]);
      return;
    }

    setIsSaving(true);

    const chapaData = {
      name: name.trim(),
      width,
      height,
      labelWidth,
      labelHeight,
      columns,
      rows,
      marginTop,
      marginBottom,
      marginLeft,
      marginRight,
      spacingHorizontal,
      spacingVertical,
    };

    try {
      if (mode === 'create') {
        createChapa(chapaData);
        toast.success('Chapa cadastrada com sucesso');
      } else if (chapaId) {
        updateChapa(chapaId, chapaData);
        toast.success('Chapa atualizada com sucesso');
      }
      onOpenChange(false);
    } catch (error) {
      toast.error('Erro ao salvar chapa');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'create' ? 'Nova Chapa' : 'Editar Chapa'}
          </DialogTitle>
          <DialogDescription>
            {mode === 'create'
              ? 'Configure as dimensões da chapa e das etiquetas'
              : 'Altere as configurações da chapa. O.S existentes não serão afetadas.'
            }
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Chapa *</Label>
            <Input
              id="name"
              placeholder="Ex: A4 - 50x30mm (4x8)"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <Separator />

          {/* Dimensões da Chapa */}
          <div>
            <h4 className="text-sm font-medium mb-3">Dimensões da Chapa</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="width">Largura (mm) *</Label>
                <Input
                  id="width"
                  type="number"
                  min="10"
                  max="1000"
                  step="0.1"
                  value={width}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setWidth(val);
                    recalculateLayout({ width: val });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="height">Altura (mm) *</Label>
                <Input
                  id="height"
                  type="number"
                  min="10"
                  max="1000"
                  step="0.1"
                  value={height}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setHeight(val);
                    recalculateLayout({ height: val });
                  }}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Dimensões da Etiqueta */}
          <div>
            <h4 className="text-sm font-medium mb-3">Dimensões da Etiqueta</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="labelWidth">Largura (mm) *</Label>
                <Input
                  id="labelWidth"
                  type="number"
                  min="5"
                  max="500"
                  step="0.1"
                  value={labelWidth}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLabelWidth(val);
                    recalculateLayout({ labelWidth: val });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="labelHeight">Altura (mm) *</Label>
                <Input
                  id="labelHeight"
                  type="number"
                  min="5"
                  max="500"
                  step="0.1"
                  value={labelHeight}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setLabelHeight(val);
                    recalculateLayout({ labelHeight: val });
                  }}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Layout: Colunas e Linhas */}
          <div>
            <h4 className="text-sm font-medium mb-3">Layout da Chapa</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="columns">Colunas *</Label>
                <Input
                  id="columns"
                  type="number"
                  min="1"
                  max="50"
                  value={columns}
                  onChange={(e) => setColumns(Number(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rows">Linhas *</Label>
                <Input
                  id="rows"
                  type="number"
                  min="1"
                  max="100"
                  value={rows}
                  onChange={(e) => setRows(Number(e.target.value))}
                />
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant="secondary" className="gap-1">
                <Grid3X3 className="h-3 w-3" />
                {totalLabels} etiquetas por chapa
              </Badge>
            </div>

            {/* Preview da Chapa */}
            <div className="mt-4 p-3 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground mb-2">Pré-visualização em escala</p>
              <div className="flex justify-center">
                {(() => {
                  // Calcular escala proporcional
                  const maxPreviewWidth = 400;
                  const maxPreviewHeight = 500;
                  const scaleX = maxPreviewWidth / width;
                  const scaleY = maxPreviewHeight / height;
                  const scale = Math.min(scaleX, scaleY, 1.2); // Permitir até 120% para chapas pequenas

                  // Dimensões do preview
                  const previewWidth = width * scale;
                  const previewHeight = height * scale;

                  // Dimensões de cada etiqueta no preview
                  const previewLabelWidth = labelWidth * scale;
                  const previewLabelHeight = labelHeight * scale;

                  // Margens no preview
                  const previewMarginTop = marginTop * scale;
                  const previewMarginBottom = marginBottom * scale;
                  const previewMarginLeft = marginLeft * scale;
                  const previewMarginRight = marginRight * scale;

                  // Espaçamentos no preview
                  const previewSpacingH = spacingHorizontal * scale;
                  const previewSpacingV = spacingVertical * scale;

                  return (
                    <div
                      className="bg-white dark:bg-gray-900 border-2 border-border relative shadow-sm"
                      style={{
                        width: `${previewWidth}px`,
                        height: `${previewHeight}px`,
                      }}
                    >
                      {/* Área de margens (fundo) */}
                      <div className="absolute inset-0 bg-gray-100 dark:bg-gray-800/50" />

                      {/* Área útil (onde ficam as etiquetas) */}
                      <div
                        className="absolute bg-primary/5"
                        style={{
                          top: `${previewMarginTop}px`,
                          left: `${previewMarginLeft}px`,
                          right: `${previewMarginRight}px`,
                          bottom: `${previewMarginBottom}px`,
                        }}
                      />

                      {/* Etiquetas com dimensões reais proporcionais */}
                      {Array.from({ length: rows }).map((_, row) =>
                        Array.from({ length: columns }).map((_, col) => {
                          const x = previewMarginLeft + col * (previewLabelWidth + previewSpacingH);
                          const y = previewMarginTop + row * (previewLabelHeight + previewSpacingV);

                          return (
                            <div
                              key={`${row}-${col}`}
                              className="absolute bg-primary/20 border border-primary/40 rounded-[1px] transition-all duration-150"
                              style={{
                                left: `${x}px`,
                                top: `${y}px`,
                                width: `${previewLabelWidth}px`,
                                height: `${previewLabelHeight}px`,
                              }}
                            />
                          );
                        })
                      )}

                      {/* Indicadores de dimensões */}
                      <div className="absolute -bottom-5 left-0 right-0 text-center">
                        <span className="text-[10px] text-muted-foreground bg-background px-1 rounded">
                          {width}mm
                        </span>
                      </div>
                      <div className="absolute -right-8 top-0 bottom-0 flex items-center">
                        <span className="text-[10px] text-muted-foreground bg-background px-1 rounded rotate-90">
                          {height}mm
                        </span>
                      </div>
                    </div>
                  );
                })()}
              </div>
              <p className="text-xs text-center text-muted-foreground mt-6">
                Etiqueta: {labelWidth}×{labelHeight}mm • Layout: {columns}×{rows} = {totalLabels} etiquetas
              </p>
            </div>
          </div>

          <Separator />

          {/* Margens */}
          <div>
            <h4 className="text-sm font-medium mb-3">Margens (mm)</h4>
            <div className="grid grid-cols-4 gap-3">
              <div className="space-y-2">
                <Label htmlFor="marginTop" className="text-xs">Topo</Label>
                <Input
                  id="marginTop"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={marginTop}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMarginTop(val);
                    recalculateLayout({ marginTop: val });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marginBottom" className="text-xs">Base</Label>
                <Input
                  id="marginBottom"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={marginBottom}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMarginBottom(val);
                    recalculateLayout({ marginBottom: val });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marginLeft" className="text-xs">Esquerda</Label>
                <Input
                  id="marginLeft"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={marginLeft}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMarginLeft(val);
                    recalculateLayout({ marginLeft: val });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="marginRight" className="text-xs">Direita</Label>
                <Input
                  id="marginRight"
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={marginRight}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setMarginRight(val);
                    recalculateLayout({ marginRight: val });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Espaçamento */}
          <div>
            <h4 className="text-sm font-medium mb-3">Espaçamento entre Etiquetas (mm)</h4>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spacingHorizontal">Horizontal</Label>
                <Input
                  id="spacingHorizontal"
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={spacingHorizontal}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSpacingHorizontal(val);
                    recalculateLayout({ spacingHorizontal: val });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spacingVertical">Vertical</Label>
                <Input
                  id="spacingVertical"
                  type="number"
                  min="0"
                  max="50"
                  step="0.1"
                  value={spacingVertical}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setSpacingVertical(val);
                    recalculateLayout({ spacingVertical: val });
                  }}
                />
              </div>
            </div>
          </div>

          {/* Erros de validação */}
          {!validation.isValid && validation.errors.length > 0 && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-md p-3">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive mt-0.5" />
                <div className="text-sm text-destructive">
                  {validation.errors.map((error, i) => (
                    <p key={i}>{error}</p>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={!validation.isValid || isSaving}>
            {isSaving ? 'Salvando...' : mode === 'create' ? 'Cadastrar Chapa' : 'Salvar Alterações'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
