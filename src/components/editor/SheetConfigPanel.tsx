import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useLabelStore } from '@/store/labelStore';
import { PAPER_SIZES } from '@/types/label';

export function SheetConfigPanel() {
  const { sheetConfig, setSheetConfig } = useLabelStore();

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 py-3">
        <CardTitle className="text-sm">Configuração da Chapa</CardTitle>
      </CardHeader>
      <CardContent className="px-0 space-y-4">
        {/* Paper Size */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Tamanho do Papel</Label>
          <Select
            value={sheetConfig.paperSize}
            onValueChange={(value) => setSheetConfig({ paperSize: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PAPER_SIZES).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Custom size inputs */}
        {sheetConfig.paperSize === 'CUSTOM' && (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Largura (mm)</Label>
              <Input
                type="number"
                value={sheetConfig.customWidth}
                onChange={(e) => setSheetConfig({ customWidth: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs">Altura (mm)</Label>
              <Input
                type="number"
                value={sheetConfig.customHeight}
                onChange={(e) => setSheetConfig({ customHeight: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
          </div>
        )}

        {/* Label size */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Tamanho da Etiqueta (mm)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Largura</Label>
              <Input
                type="number"
                value={sheetConfig.labelWidth}
                onChange={(e) => setSheetConfig({ labelWidth: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Altura</Label>
              <Input
                type="number"
                value={sheetConfig.labelHeight}
                onChange={(e) => setSheetConfig({ labelHeight: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Margins */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Margens (mm)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Superior</Label>
              <Input
                type="number"
                value={sheetConfig.marginTop}
                onChange={(e) => setSheetConfig({ marginTop: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Inferior</Label>
              <Input
                type="number"
                value={sheetConfig.marginBottom}
                onChange={(e) => setSheetConfig({ marginBottom: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Esquerda</Label>
              <Input
                type="number"
                value={sheetConfig.marginLeft}
                onChange={(e) => setSheetConfig({ marginLeft: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Direita</Label>
              <Input
                type="number"
                value={sheetConfig.marginRight}
                onChange={(e) => setSheetConfig({ marginRight: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Spacing */}
        <div className="space-y-2">
          <Label className="text-xs font-medium">Espaçamento (mm)</Label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Horizontal</Label>
              <Input
                type="number"
                value={sheetConfig.spacingHorizontal}
                onChange={(e) => setSheetConfig({ spacingHorizontal: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Vertical</Label>
              <Input
                type="number"
                value={sheetConfig.spacingVertical}
                onChange={(e) => setSheetConfig({ spacingVertical: parseFloat(e.target.value) || 0 })}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Grid layout */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">Grid de Etiquetas</Label>
            <div className="flex items-center gap-2">
              <Label className="text-xs text-muted-foreground">Auto</Label>
              <Switch
                checked={sheetConfig.autoCalculate}
                onCheckedChange={(checked) => setSheetConfig({ autoCalculate: checked })}
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs text-muted-foreground">Colunas</Label>
              <Input
                type="number"
                value={sheetConfig.columns}
                onChange={(e) => setSheetConfig({ columns: parseInt(e.target.value) || 1, autoCalculate: false })}
                disabled={sheetConfig.autoCalculate}
                className="h-8"
              />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Linhas</Label>
              <Input
                type="number"
                value={sheetConfig.rows}
                onChange={(e) => setSheetConfig({ rows: parseInt(e.target.value) || 1, autoCalculate: false })}
                disabled={sheetConfig.autoCalculate}
                className="h-8"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        <div className="p-3 bg-muted/50 rounded-lg space-y-1">
          <p className="text-xs font-medium">Resumo</p>
          <p className="text-xs text-muted-foreground">
            {sheetConfig.columns} × {sheetConfig.rows} = {sheetConfig.columns * sheetConfig.rows} etiquetas por folha
          </p>
          <p className="text-xs text-muted-foreground">
            Etiqueta: {sheetConfig.labelWidth} × {sheetConfig.labelHeight} mm
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
