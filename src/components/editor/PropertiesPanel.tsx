import {
  Trash2,
  Copy,
  Lock,
  Unlock,
  ChevronUp,
  ChevronDown,
  ChevronsUp,
  ChevronsDown,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Toggle } from '@/components/ui/toggle';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLabelStore } from '@/store/labelStore';
import { BARCODE_TYPES, DYNAMIC_FIELDS, SequentialConfig } from '@/types/label';

const FONT_FAMILIES = [
  'Arial',
  'Helvetica',
  'Times New Roman',
  'Courier New',
  'Georgia',
  'Verdana',
  'Impact',
  'Comic Sans MS',
];

export function PropertiesPanel() {
  const {
    elements,
    selectedElementId,
    updateElement,
    removeElement,
    duplicateElement,
    moveElementLayer,
    sequentialConfig,
    csvHeaders
  } = useLabelStore();

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Estado local para inputs (evita re-renderização e perda de foco)
  const [localValues, setLocalValues] = useState<Record<string, string | number>>({});
  const updateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Sincronizar estado local quando o elemento muda
  useEffect(() => {
    if (selectedElement) {
      setLocalValues({
        x: selectedElement.x,
        y: selectedElement.y,
        width: selectedElement.width,
        height: selectedElement.height,
        text: selectedElement.text || '',
        qrValue: selectedElement.qrValue || '',
        barcodeValue: selectedElement.barcodeValue || '',
        fill: selectedElement.fill || '#000000',
        qrForeground: selectedElement.qrForeground || '#000000',
        qrBackground: selectedElement.qrBackground || '#ffffff',
        shapeFill: selectedElement.shapeFill || '#ffffff',
        shapeStroke: selectedElement.shapeStroke || '#000000',
        prefix: selectedElement.customSequence?.prefix || '',
        suffix: selectedElement.customSequence?.suffix || '',
      });
    }
  }, [selectedElement?.id]); // Apenas quando o ID muda, não quando os valores mudam

  // Limpar timeouts ao desmontar ou mudar elemento
  useEffect(() => {
    return () => {
      Object.values(updateTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
    };
  }, [selectedElement?.id]);

  // Função para atualizar com debounce
  const updateWithDebounce = useCallback((key: string, value: string | number, finalUpdate: (val: any) => void, delay: number = 300) => {
    setLocalValues(prev => ({ ...prev, [key]: value }));

    if (updateTimeoutRef.current[key]) {
      clearTimeout(updateTimeoutRef.current[key]);
    }

    updateTimeoutRef.current[key] = setTimeout(() => {
      finalUpdate(value);
    }, delay);
  }, []);

  // Função para atualizar imediatamente (sem debounce)
  const updateImmediate = useCallback((updates: Partial<typeof selectedElement>) => {
    if (selectedElement) {
      updateElement(selectedElement.id, updates);
    }
  }, [selectedElement, updateElement]);

  // Função principal de update - DEVE estar antes do return condicional
  const update = useCallback((updates: Partial<typeof selectedElement>) => {
    if (selectedElement) {
      updateElement(selectedElement.id, updates);
    }
  }, [selectedElement, updateElement]);

  if (!selectedElement) {
    return (
      <aside className="w-72 border-l border-border bg-card flex flex-col h-full overflow-hidden">
        <div className="p-4 border-b border-border flex-shrink-0">
          <h2 className="font-semibold">Propriedades</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4 overflow-auto">
          <p className="text-sm text-muted-foreground text-center">
            Selecione um elemento no canvas para editar suas propriedades
          </p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-72 border-l border-border bg-card flex flex-col h-full overflow-hidden">
      <div className="p-4 border-b border-border flex-shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold capitalize">{selectedElement.type}</h2>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => update({ locked: !selectedElement.locked })}
            >
              {selectedElement.locked ? (
                <Lock className="h-4 w-4" />
              ) : (
                <Unlock className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => duplicateElement(selectedElement.id)}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-destructive hover:text-destructive"
              onClick={() => removeElement(selectedElement.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 overflow-auto">
        <div className="p-4 space-y-4">
          {/* Position & Size */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Posição e Tamanho (mm)</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  value={localValues.x ?? selectedElement.x}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    updateWithDebounce('x', val, (v) => update({ x: v }), 150);
                  }}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (updateTimeoutRef.current.x) clearTimeout(updateTimeoutRef.current.x);
                    update({ x: val });
                  }}
                  step={0.5}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  value={localValues.y ?? selectedElement.y}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    updateWithDebounce('y', val, (v) => update({ y: v }), 150);
                  }}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    if (updateTimeoutRef.current.y) clearTimeout(updateTimeoutRef.current.y);
                    update({ y: val });
                  }}
                  step={0.5}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Largura</Label>
                <Input
                  type="number"
                  value={localValues.width ?? selectedElement.width}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    updateWithDebounce('width', val, (v) => update({ width: v }), 150);
                  }}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    if (updateTimeoutRef.current.width) clearTimeout(updateTimeoutRef.current.width);
                    update({ width: val });
                  }}
                  step={0.5}
                  min={1}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Altura</Label>
                <Input
                  type="number"
                  value={localValues.height ?? selectedElement.height}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    updateWithDebounce('height', val, (v) => update({ height: v }), 150);
                  }}
                  onBlur={(e) => {
                    const val = parseFloat(e.target.value) || 1;
                    if (updateTimeoutRef.current.height) clearTimeout(updateTimeoutRef.current.height);
                    update({ height: val });
                  }}
                  step={0.5}
                  min={1}
                  className="h-8"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Rotation & Opacity */}
          <div className="space-y-3">
            <div>
              <Label className="text-xs">Rotação: {selectedElement.rotation}°</Label>
              <Slider
                value={[selectedElement.rotation]}
                onValueChange={([value]) => update({ rotation: value })}
                min={0}
                max={360}
                step={1}
              />
            </div>
            <div>
              <Label className="text-xs">Opacidade: {Math.round(selectedElement.opacity * 100)}%</Label>
              <Slider
                value={[selectedElement.opacity * 100]}
                onValueChange={([value]) => update({ opacity: value / 100 })}
                min={0}
                max={100}
                step={1}
              />
            </div>
          </div>

          <Separator />

          {/* Layer Order */}
          <div className="space-y-2">
            <Label className="text-xs">Ordem de Camada</Label>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => moveElementLayer(selectedElement.id, 'top')}
              >
                <ChevronsUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => moveElementLayer(selectedElement.id, 'up')}
              >
                <ChevronUp className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => moveElementLayer(selectedElement.id, 'down')}
              >
                <ChevronDown className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="h-8 w-8"
                onClick={() => moveElementLayer(selectedElement.id, 'bottom')}
              >
                <ChevronsDown className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* Type-specific properties */}
          {selectedElement.type === 'text' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Texto</h3>
              <div>
                <Label className="text-xs">Conteúdo</Label>
                <Input
                  value={(localValues.text ?? selectedElement.text) || ''}
                  onChange={(e) => updateWithDebounce('text', e.target.value, (val) => update({ text: val }))}
                  onBlur={(e) => {
                    if (updateTimeoutRef.current.text) clearTimeout(updateTimeoutRef.current.text);
                    update({ text: e.target.value });
                  }}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Fonte</Label>
                <Select
                  value={selectedElement.fontFamily || 'Arial'}
                  onValueChange={(value) => update({ fontFamily: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {FONT_FAMILIES.map((font) => (
                      <SelectItem key={font} value={font} style={{ fontFamily: font }}>
                        {font}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Tamanho: {selectedElement.fontSize}pt</Label>
                <Slider
                  value={[selectedElement.fontSize || 12]}
                  onValueChange={([value]) => update({ fontSize: value })}
                  min={4}
                  max={72}
                  step={1}
                />
              </div>
              <div className="flex gap-1">
                <Toggle
                  pressed={selectedElement.fontWeight === 'bold'}
                  onPressedChange={(pressed) => update({ fontWeight: pressed ? 'bold' : 'normal' })}
                  size="sm"
                >
                  <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={selectedElement.fontStyle === 'italic'}
                  onPressedChange={(pressed) => update({ fontStyle: pressed ? 'italic' : 'normal' })}
                  size="sm"
                >
                  <Italic className="h-4 w-4" />
                </Toggle>
                <div className="flex-1" />
                <Toggle
                  pressed={selectedElement.textAlign === 'left'}
                  onPressedChange={() => update({ textAlign: 'left' })}
                  size="sm"
                >
                  <AlignLeft className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={selectedElement.textAlign === 'center'}
                  onPressedChange={() => update({ textAlign: 'center' })}
                  size="sm"
                >
                  <AlignCenter className="h-4 w-4" />
                </Toggle>
                <Toggle
                  pressed={selectedElement.textAlign === 'right'}
                  onPressedChange={() => update({ textAlign: 'right' })}
                  size="sm"
                >
                  <AlignRight className="h-4 w-4" />
                </Toggle>
              </div>
              <div>
                <Label className="text-xs">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selectedElement.fill || '#000000'}
                    onChange={(e) => update({ fill: e.target.value })}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    value={(localValues.fill ?? selectedElement.fill) || '#000000'}
                    onChange={(e) => updateWithDebounce('fill', e.target.value, (val) => update({ fill: val }))}
                    onBlur={(e) => {
                      if (updateTimeoutRef.current.fill) clearTimeout(updateTimeoutRef.current.fill);
                      update({ fill: e.target.value });
                    }}
                    className="h-8 flex-1"
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs">Campo Dinâmico</Label>
                <Switch
                  checked={selectedElement.isDynamic || false}
                  onCheckedChange={(checked) => update({ isDynamic: checked })}
                />
              </div>
            </div>
          )}

          {selectedElement.type === 'qrcode' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">QR Code</h3>

              <Separator />

              <div>
                <Label className="text-xs font-medium mb-2 block">Fonte de Dados</Label>
                <Select
                  value={selectedElement.dataSourceType || 'fixed'}
                  onValueChange={(value: 'sequential' | 'csv' | 'fixed') => {
                    if (value === 'sequential') {
                      update({
                        dataSourceType: 'sequential',
                        isDynamic: true,
                        customSequence: {
                          start: sequentialConfig.start,
                          end: sequentialConfig.end,
                          step: sequentialConfig.step,
                          padLength: sequentialConfig.padLength,
                          prefix: sequentialConfig.prefix,
                          suffix: sequentialConfig.suffix,
                        },
                        csvColumn: undefined,
                      });
                    } else if (value === 'csv') {
                      update({
                        dataSourceType: 'csv',
                        isDynamic: true,
                        csvColumn: csvHeaders[0] || '',
                        customSequence: undefined,
                      });
                    } else {
                      update({
                        dataSourceType: 'fixed',
                        isDynamic: false,
                        csvColumn: undefined,
                        customSequence: undefined,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequential">Sequencial</SelectItem>
                    <SelectItem value="csv">CSV/Excel</SelectItem>
                    <SelectItem value="fixed">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedElement.dataSourceType === 'sequential' && selectedElement.customSequence && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-md border">
                  <Label className="text-xs font-medium">Configuração Sequencial</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="number"
                        value={selectedElement.customSequence.start}
                        onChange={(e) => update({
                          customSequence: {
                            ...selectedElement.customSequence!,
                            start: parseInt(e.target.value) || 1
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="number"
                        value={selectedElement.customSequence.end}
                        onChange={(e) => update({
                          customSequence: {
                            ...selectedElement.customSequence!,
                            end: parseInt(e.target.value) || 100
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Incremento</Label>
                      <Input
                        type="number"
                        value={selectedElement.customSequence.step}
                        onChange={(e) => update({
                          customSequence: {
                            ...selectedElement.customSequence!,
                            step: parseInt(e.target.value) || 1
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Zeros à Esquerda</Label>
                      <Input
                        type="number"
                        value={selectedElement.customSequence.padLength}
                        onChange={(e) => update({
                          customSequence: {
                            ...selectedElement.customSequence!,
                            padLength: parseInt(e.target.value) || 6
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Prefixo</Label>
                      <Input
                        value={localValues.prefix ?? selectedElement.customSequence.prefix}
                        onChange={(e) => {
                          updateWithDebounce('prefix', e.target.value, (val) => {
                            if (selectedElement.customSequence) {
                              update({
                                customSequence: {
                                  ...selectedElement.customSequence,
                                  prefix: val as string
                                }
                              });
                            }
                          });
                        }}
                        onBlur={(e) => {
                          if (updateTimeoutRef.current.prefix) clearTimeout(updateTimeoutRef.current.prefix);
                          if (selectedElement.customSequence) {
                            update({
                              customSequence: {
                                ...selectedElement.customSequence,
                                prefix: e.target.value
                              }
                            });
                          }
                        }}
                        className="h-8"
                        placeholder="Ex: QR-"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Sufixo</Label>
                      <Input
                        value={localValues.suffix ?? selectedElement.customSequence.suffix}
                        onChange={(e) => {
                          updateWithDebounce('suffix', e.target.value, (val) => {
                            if (selectedElement.customSequence) {
                              update({
                                customSequence: {
                                  ...selectedElement.customSequence,
                                  suffix: val as string
                                }
                              });
                            }
                          });
                        }}
                        onBlur={(e) => {
                          if (updateTimeoutRef.current.suffix) clearTimeout(updateTimeoutRef.current.suffix);
                          if (selectedElement.customSequence) {
                            update({
                              customSequence: {
                                ...selectedElement.customSequence,
                                suffix: e.target.value
                              }
                            });
                          }
                        }}
                        className="h-8"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <Label className="text-xs text-muted-foreground">Exemplo:</Label>
                    <p className="text-xs font-mono mt-1">
                      {selectedElement.customSequence.prefix}
                      {selectedElement.customSequence.start.toString().padStart(selectedElement.customSequence.padLength, '0')}
                      {selectedElement.customSequence.suffix}
                      {' → '}
                      {selectedElement.customSequence.prefix}
                      {Math.min(selectedElement.customSequence.end, selectedElement.customSequence.start + selectedElement.customSequence.step * 2).toString().padStart(selectedElement.customSequence.padLength, '0')}
                      {selectedElement.customSequence.suffix}
                    </p>
                  </div>
                </div>
              )}

              {selectedElement.dataSourceType === 'csv' && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Coluna do CSV</Label>
                  {csvHeaders.length > 0 ? (
                    <Select
                      value={selectedElement.csvColumn || csvHeaders[0]}
                      onValueChange={(value) => update({ csvColumn: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md border border-dashed">
                      <p className="text-xs text-muted-foreground text-center">
                        Importe um CSV na guia "Dados" primeiro
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div>
                <Label className="text-xs">Valor</Label>
                <Input
                  value={(localValues.qrValue ?? selectedElement.qrValue) || ''}
                  onChange={(e) => updateWithDebounce('qrValue', e.target.value, (val) => update({ qrValue: val }))}
                  onBlur={(e) => {
                    if (updateTimeoutRef.current.qrValue) clearTimeout(updateTimeoutRef.current.qrValue);
                    update({ qrValue: e.target.value });
                  }}
                  className="h-8"
                  placeholder={
                    selectedElement.dataSourceType === 'sequential'
                      ? 'Use {NUMERO}, {PREFIXO}, {SUFIXO}'
                      : selectedElement.dataSourceType === 'csv'
                        ? `Use {${selectedElement.csvColumn || 'COLUNA'}} ou campos dinâmicos`
                        : 'Digite o valor fixo'
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedElement.dataSourceType === 'sequential'
                    ? 'Usará a sequência configurada acima'
                    : selectedElement.dataSourceType === 'csv'
                      ? `Valor virá da coluna "${selectedElement.csvColumn || 'selecionada'}" do CSV`
                      : 'Valor fixo para todas as etiquetas'}
                </p>
              </div>
              <div>
                <Label className="text-xs">Nível de Correção</Label>
                <Select
                  value={selectedElement.qrErrorLevel || 'M'}
                  onValueChange={(value: 'L' | 'M' | 'Q' | 'H') => update({ qrErrorLevel: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="L">L - Baixo (7%)</SelectItem>
                    <SelectItem value="M">M - Médio (15%)</SelectItem>
                    <SelectItem value="Q">Q - Alto (25%)</SelectItem>
                    <SelectItem value="H">H - Máximo (30%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Cor do QR</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selectedElement.qrForeground || '#000000'}
                    onChange={(e) => update({ qrForeground: e.target.value })}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    value={(localValues.qrForeground ?? selectedElement.qrForeground) || '#000000'}
                    onChange={(e) => updateWithDebounce('qrForeground', e.target.value, (val) => update({ qrForeground: val }))}
                    onBlur={(e) => {
                      if (updateTimeoutRef.current.qrForeground) clearTimeout(updateTimeoutRef.current.qrForeground);
                      update({ qrForeground: e.target.value });
                    }}
                    className="h-8 flex-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Cor de Fundo</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selectedElement.qrBackground || '#ffffff'}
                    onChange={(e) => update({ qrBackground: e.target.value })}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    value={(localValues.qrBackground ?? selectedElement.qrBackground) || '#ffffff'}
                    onChange={(e) => updateWithDebounce('qrBackground', e.target.value, (val) => update({ qrBackground: val }))}
                    onBlur={(e) => {
                      if (updateTimeoutRef.current.qrBackground) clearTimeout(updateTimeoutRef.current.qrBackground);
                      update({ qrBackground: e.target.value });
                    }}
                    className="h-8 flex-1"
                  />
                </div>
              </div>
            </div>
          )}

          {(selectedElement.type === 'barcode' || selectedElement.type === 'datamatrix' || selectedElement.type === 'pdf417') && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Código de Barras</h3>

              {selectedElement.type === 'barcode' && (
                <div>
                  <Label className="text-xs">Tipo</Label>
                  <Select
                    value={selectedElement.barcodeType || 'CODE128'}
                    onValueChange={(value) => update({ barcodeType: value as any })}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {BARCODE_TYPES.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Separator />

              <div>
                <Label className="text-xs font-medium mb-2 block">Fonte de Dados</Label>
                <Select
                  value={selectedElement.dataSourceType || 'fixed'}
                  onValueChange={(value: 'sequential' | 'csv' | 'fixed') => {
                    if (value === 'sequential') {
                      update({
                        dataSourceType: 'sequential',
                        isDynamic: true,
                        customSequence: {
                          start: sequentialConfig.start,
                          end: sequentialConfig.end,
                          step: sequentialConfig.step,
                          padLength: sequentialConfig.padLength,
                          prefix: sequentialConfig.prefix,
                          suffix: sequentialConfig.suffix,
                        },
                        csvColumn: undefined,
                      });
                    } else if (value === 'csv') {
                      update({
                        dataSourceType: 'csv',
                        isDynamic: true,
                        csvColumn: csvHeaders[0] || '',
                        customSequence: undefined,
                      });
                    } else {
                      update({
                        dataSourceType: 'fixed',
                        isDynamic: false,
                        csvColumn: undefined,
                        customSequence: undefined,
                      });
                    }
                  }}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sequential">Sequencial</SelectItem>
                    <SelectItem value="csv">CSV/Excel</SelectItem>
                    <SelectItem value="fixed">Valor Fixo</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedElement.dataSourceType === 'sequential' && selectedElement.customSequence && (
                <div className="space-y-2 p-3 bg-muted/50 rounded-md border">
                  <Label className="text-xs font-medium">Configuração Sequencial</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">Início</Label>
                      <Input
                        type="number"
                        value={selectedElement.customSequence.start}
                        onChange={(e) => update({
                          customSequence: {
                            ...selectedElement.customSequence!,
                            start: parseInt(e.target.value) || 1
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="number"
                        value={selectedElement.customSequence.end}
                        onChange={(e) => update({
                          customSequence: {
                            ...selectedElement.customSequence!,
                            end: parseInt(e.target.value) || 100
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Incremento</Label>
                      <Input
                        type="number"
                        value={selectedElement.customSequence.step}
                        onChange={(e) => update({
                          customSequence: {
                            ...selectedElement.customSequence!,
                            step: parseInt(e.target.value) || 1
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Zeros à Esquerda</Label>
                      <Input
                        type="number"
                        value={selectedElement.customSequence.padLength}
                        onChange={(e) => update({
                          customSequence: {
                            ...selectedElement.customSequence!,
                            padLength: parseInt(e.target.value) || 6
                          }
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Prefixo</Label>
                      <Input
                        value={selectedElement.customSequence.prefix}
                        onChange={(e) => update({
                          customSequence: {
                            ...selectedElement.customSequence!,
                            prefix: e.target.value
                          }
                        })}
                        className="h-8"
                        placeholder="Ex: BAR-"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Sufixo</Label>
                      <Input
                        value={selectedElement.customSequence.suffix}
                        onChange={(e) => update({
                          customSequence: {
                            ...selectedElement.customSequence!,
                            suffix: e.target.value
                          }
                        })}
                        className="h-8"
                        placeholder="Opcional"
                      />
                    </div>
                  </div>
                  <div className="pt-2 border-t">
                    <Label className="text-xs text-muted-foreground">Exemplo:</Label>
                    <p className="text-xs font-mono mt-1">
                      {selectedElement.customSequence.prefix}
                      {selectedElement.customSequence.start.toString().padStart(selectedElement.customSequence.padLength, '0')}
                      {selectedElement.customSequence.suffix}
                      {' → '}
                      {selectedElement.customSequence.prefix}
                      {Math.min(selectedElement.customSequence.end, selectedElement.customSequence.start + selectedElement.customSequence.step * 2).toString().padStart(selectedElement.customSequence.padLength, '0')}
                      {selectedElement.customSequence.suffix}
                    </p>
                  </div>
                </div>
              )}

              {selectedElement.dataSourceType === 'csv' && (
                <div className="space-y-2">
                  <Label className="text-xs font-medium">Coluna do CSV</Label>
                  {csvHeaders.length > 0 ? (
                    <Select
                      value={selectedElement.csvColumn || csvHeaders[0]}
                      onValueChange={(value) => update({ csvColumn: value })}
                    >
                      <SelectTrigger className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {csvHeaders.map((header) => (
                          <SelectItem key={header} value={header}>
                            {header}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="p-3 bg-muted/50 rounded-md border border-dashed">
                      <p className="text-xs text-muted-foreground text-center">
                        Importe um CSV na guia "Dados" primeiro
                      </p>
                    </div>
                  )}
                </div>
              )}

              <Separator />

              <div>
                <Label className="text-xs">Valor</Label>
                <Input
                  value={(localValues.barcodeValue ?? selectedElement.barcodeValue) || ''}
                  onChange={(e) => updateWithDebounce('barcodeValue', e.target.value, (val) => update({ barcodeValue: val }))}
                  onBlur={(e) => {
                    if (updateTimeoutRef.current.barcodeValue) clearTimeout(updateTimeoutRef.current.barcodeValue);
                    update({ barcodeValue: e.target.value });
                  }}
                  className="h-8"
                  placeholder={
                    selectedElement.dataSourceType === 'sequential'
                      ? 'Use {NUMERO}, {PREFIXO}, {SUFIXO}'
                      : selectedElement.dataSourceType === 'csv'
                        ? `Use {${selectedElement.csvColumn || 'COLUNA'}} ou campos dinâmicos`
                        : 'Digite o valor fixo'
                  }
                />
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedElement.dataSourceType === 'sequential'
                    ? 'Usará a sequência configurada acima'
                    : selectedElement.dataSourceType === 'csv'
                      ? `Valor virá da coluna "${selectedElement.csvColumn || 'selecionada'}" do CSV`
                      : 'Valor fixo para todas as etiquetas'}
                </p>
              </div>
              {selectedElement.type === 'barcode' && (
                <div className="flex items-center justify-between">
                  <Label className="text-xs">Mostrar Valor</Label>
                  <Switch
                    checked={selectedElement.displayValue !== false}
                    onCheckedChange={(checked) => update({ displayValue: checked })}
                  />
                </div>
              )}
            </div>
          )}

          {(selectedElement.type === 'rectangle' || selectedElement.type === 'circle') && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Forma</h3>
              <div>
                <Label className="text-xs">Preenchimento</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selectedElement.shapeFill || '#ffffff'}
                    onChange={(e) => update({ shapeFill: e.target.value })}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    value={selectedElement.shapeFill || '#ffffff'}
                    onChange={(e) => update({ shapeFill: e.target.value })}
                    className="h-8 flex-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Cor da Borda</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selectedElement.shapeStroke || '#000000'}
                    onChange={(e) => update({ shapeStroke: e.target.value })}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    value={selectedElement.shapeStroke || '#000000'}
                    onChange={(e) => update({ shapeStroke: e.target.value })}
                    className="h-8 flex-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Espessura da Borda: {selectedElement.shapeStrokeWidth}px</Label>
                <Slider
                  value={[selectedElement.shapeStrokeWidth || 1]}
                  onValueChange={([value]) => update({ shapeStrokeWidth: value })}
                  min={0}
                  max={10}
                  step={0.5}
                />
              </div>
              {selectedElement.type === 'rectangle' && (
                <div>
                  <Label className="text-xs">Arredondamento: {selectedElement.cornerRadius || 0}mm</Label>
                  <Slider
                    value={[selectedElement.cornerRadius || 0]}
                    onValueChange={([value]) => update({ cornerRadius: value })}
                    min={0}
                    max={20}
                    step={0.5}
                  />
                </div>
              )}
            </div>
          )}

          {selectedElement.type === 'line' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Linha</h3>
              <div>
                <Label className="text-xs">Cor</Label>
                <div className="flex gap-2">
                  <Input
                    type="color"
                    value={selectedElement.shapeStroke || '#000000'}
                    onChange={(e) => update({ shapeStroke: e.target.value })}
                    className="h-8 w-12 p-1"
                  />
                  <Input
                    value={selectedElement.shapeStroke || '#000000'}
                    onChange={(e) => update({ shapeStroke: e.target.value })}
                    className="h-8 flex-1"
                  />
                </div>
              </div>
              <div>
                <Label className="text-xs">Espessura: {selectedElement.shapeStrokeWidth}px</Label>
                <Slider
                  value={[selectedElement.shapeStrokeWidth || 1]}
                  onValueChange={([value]) => update({ shapeStrokeWidth: value })}
                  min={0.5}
                  max={10}
                  step={0.5}
                />
              </div>
            </div>
          )}

          {selectedElement.type === 'image' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Imagem</h3>
              <Button
                variant="outline"
                size="sm"
                className="w-full"
                onClick={() => {
                  const input = document.createElement('input');
                  input.type = 'file';
                  input.accept = 'image/png,image/jpeg,image/jpg';
                  input.onchange = (e) => {
                    const file = (e.target as HTMLInputElement).files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (event) => {
                        update({ src: event.target?.result as string });
                      };
                      reader.readAsDataURL(file);
                    }
                  };
                  input.click();
                }}
              >
                Trocar Imagem
              </Button>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  );
}
