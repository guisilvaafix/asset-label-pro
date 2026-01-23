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
import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { useSelectedElement, useElementUpdate, useLocalValues } from '@/hooks/usePropertiesOptimization';
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

import { DynamicFieldConfig } from './DynamicFieldConfig';
import { PositionProperties } from './properties/PositionProperties';
import { StyleProperties } from './properties/StyleProperties';
import { LayerProperties } from './properties/LayerProperties';
import { ShapeProperties } from './properties/ShapeProperties';

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
  // Optimized hooks to prevent re-renders
  const selectedElementId = useLabelStore((state) => state.selectedElementId);
  const selectedElement = useSelectedElement();
  const update = useElementUpdate();
  const { localValues, updateWithDebounce } = useLocalValues(selectedElementId);

  // Get store functions directly (stable references)
  const removeElement = useLabelStore.getState().removeElement;
  const duplicateElement = useLabelStore.getState().duplicateElement;
  const moveElementLayer = useLabelStore.getState().moveElementLayer;

  // Get data for child components (memoized)
  const sequentialConfig = useLabelStore((state) => state.sequentialConfig);
  const csvHeaders = useLabelStore((state) => state.csvHeaders);
  const csvImports = useLabelStore((state) => state.csvImports);
  const getCsvImport = useLabelStore((state) => state.getCsvImport);
  const elements = useLabelStore((state) => state.elements);

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
          {/* Position & Size */}
          <PositionProperties
            elementId={selectedElement.id}
            x={selectedElement.x}
            y={selectedElement.y}
            width={selectedElement.width}
            height={selectedElement.height}
            onUpdate={update}
          />

          <Separator />

          {/* Rotation & Opacity */}
          {/* Rotation & Opacity */}
          <StyleProperties
            rotation={selectedElement.rotation}
            opacity={selectedElement.opacity}
            onUpdate={update}
          />

          <Separator />

          {/* Layer Order */}
          {/* Layer Order */}
          <LayerProperties
            onMoveLayer={(dir) => moveElementLayer(selectedElement.id, dir)}
          />

          <Separator />

          {/* Type-specific properties */}
          {selectedElement.type === 'text' && (
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Texto</h3>
              {/* Conteúdo - só mostrar se NÃO for dinâmico */}
              {!selectedElement.isDynamic && (
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
              )}
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
              <DynamicFieldConfig
                element={selectedElement}
                allElements={elements}
                csvImports={csvImports}
                sequentialConfig={sequentialConfig}
                getCsvImport={getCsvImport}
                onUpdate={update}
              />
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
                        value={localValues.seqStart ?? selectedElement.customSequence.start}
                        onChange={(e) => updateWithDebounce('seqStart', e.target.value, (val) => {
                          update({
                            customSequence: {
                              ...selectedElement.customSequence!,
                              start: parseInt(val as string) || 1
                            }
                          });
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="number"
                        value={localValues.seqEnd ?? selectedElement.customSequence.end}
                        onChange={(e) => updateWithDebounce('seqEnd', e.target.value, (val) => {
                          update({
                            customSequence: {
                              ...selectedElement.customSequence!,
                              end: parseInt(val as string) || 100
                            }
                          });
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Incremento</Label>
                      <Input
                        type="number"
                        value={localValues.seqStep ?? selectedElement.customSequence.step}
                        onChange={(e) => updateWithDebounce('seqStep', e.target.value, (val) => {
                          update({
                            customSequence: {
                              ...selectedElement.customSequence!,
                              step: parseInt(val as string) || 1
                            }
                          });
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Zeros à Esquerda</Label>
                      <Input
                        type="number"
                        value={localValues.seqPadLength ?? selectedElement.customSequence.padLength}
                        onChange={(e) => updateWithDebounce('seqPadLength', e.target.value, (val) => {
                          update({
                            customSequence: {
                              ...selectedElement.customSequence!,
                              padLength: parseInt(val as string) || 6
                            }
                          });
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
                        value={localValues.seqStart ?? selectedElement.customSequence.start}
                        onChange={(e) => updateWithDebounce('seqStart', e.target.value, (val) => {
                          update({
                            customSequence: {
                              ...selectedElement.customSequence!,
                              start: parseInt(val as string) || 1
                            }
                          });
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Fim</Label>
                      <Input
                        type="number"
                        value={localValues.seqEnd ?? selectedElement.customSequence.end}
                        onChange={(e) => updateWithDebounce('seqEnd', e.target.value, (val) => {
                          update({
                            customSequence: {
                              ...selectedElement.customSequence!,
                              end: parseInt(val as string) || 100
                            }
                          });
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Incremento</Label>
                      <Input
                        type="number"
                        value={localValues.seqStep ?? selectedElement.customSequence.step}
                        onChange={(e) => updateWithDebounce('seqStep', e.target.value, (val) => {
                          update({
                            customSequence: {
                              ...selectedElement.customSequence!,
                              step: parseInt(val as string) || 1
                            }
                          });
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Zeros à Esquerda</Label>
                      <Input
                        type="number"
                        value={localValues.seqPadLength ?? selectedElement.customSequence.padLength}
                        onChange={(e) => updateWithDebounce('seqPadLength', e.target.value, (val) => {
                          update({
                            customSequence: {
                              ...selectedElement.customSequence!,
                              padLength: parseInt(val as string) || 6
                            }
                          });
                        })}
                        className="h-8"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Prefixo</Label>
                      <Input
                        value={localValues.prefix ?? selectedElement.customSequence.prefix}
                        onChange={(e) => updateWithDebounce('prefix', e.target.value, (val) => {
                          update({
                            customSequence: {
                              ...selectedElement.customSequence!,
                              prefix: val as string
                            }
                          });
                        })}
                        className="h-8"
                        placeholder="Ex: BAR-"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">Sufixo</Label>
                      <Input
                        value={localValues.suffix ?? selectedElement.customSequence.suffix}
                        onChange={(e) => updateWithDebounce('suffix', e.target.value, (val) => {
                          update({
                            customSequence: {
                              ...selectedElement.customSequence!,
                              suffix: val as string
                            }
                          });
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

          {(selectedElement.type === 'rectangle' || selectedElement.type === 'circle' || selectedElement.type === 'line') && (
            <ShapeProperties
              elementId={selectedElement.id}
              type={selectedElement.type}
              fill={selectedElement.shapeFill}
              stroke={selectedElement.shapeStroke}
              strokeWidth={selectedElement.shapeStrokeWidth}
              cornerRadius={selectedElement.cornerRadius}
              onUpdate={update}
            />
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
