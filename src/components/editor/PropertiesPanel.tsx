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
import { BARCODE_TYPES, DYNAMIC_FIELDS } from '@/types/label';

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
    moveElementLayer 
  } = useLabelStore();

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  if (!selectedElement) {
    return (
      <aside className="w-72 border-l border-border bg-card flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold">Propriedades</h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-4">
          <p className="text-sm text-muted-foreground text-center">
            Selecione um elemento no canvas para editar suas propriedades
          </p>
        </div>
      </aside>
    );
  }

  const update = (updates: Partial<typeof selectedElement>) => {
    updateElement(selectedElement.id, updates);
  };

  return (
    <aside className="w-72 border-l border-border bg-card flex flex-col">
      <div className="p-4 border-b border-border">
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

      <ScrollArea className="flex-1">
        <div className="p-4 space-y-4">
          {/* Position & Size */}
          <div className="space-y-3">
            <h3 className="text-sm font-medium">Posição e Tamanho (mm)</h3>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">X</Label>
                <Input
                  type="number"
                  value={selectedElement.x}
                  onChange={(e) => update({ x: parseFloat(e.target.value) || 0 })}
                  step={0.5}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Y</Label>
                <Input
                  type="number"
                  value={selectedElement.y}
                  onChange={(e) => update({ y: parseFloat(e.target.value) || 0 })}
                  step={0.5}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Largura</Label>
                <Input
                  type="number"
                  value={selectedElement.width}
                  onChange={(e) => update({ width: parseFloat(e.target.value) || 1 })}
                  step={0.5}
                  min={1}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Altura</Label>
                <Input
                  type="number"
                  value={selectedElement.height}
                  onChange={(e) => update({ height: parseFloat(e.target.value) || 1 })}
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
                  value={selectedElement.text || ''}
                  onChange={(e) => update({ text: e.target.value })}
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
                    value={selectedElement.fill || '#000000'}
                    onChange={(e) => update({ fill: e.target.value })}
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
              <div>
                <Label className="text-xs">Valor</Label>
                <Input
                  value={selectedElement.qrValue || ''}
                  onChange={(e) => update({ qrValue: e.target.value })}
                  className="h-8"
                />
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
                    value={selectedElement.qrForeground || '#000000'}
                    onChange={(e) => update({ qrForeground: e.target.value })}
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
                    value={selectedElement.qrBackground || '#ffffff'}
                    onChange={(e) => update({ qrBackground: e.target.value })}
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
              <div>
                <Label className="text-xs">Valor</Label>
                <Input
                  value={selectedElement.barcodeValue || ''}
                  onChange={(e) => update({ barcodeValue: e.target.value })}
                  className="h-8"
                />
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
