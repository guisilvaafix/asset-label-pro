import { useState } from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useLabelStore } from '@/store/labelStore';
import { exportToPDF, exportToPDFSingle, exportToPNG } from '@/utils/pdfExporter';
import { toast } from 'sonner';

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ExportDialog({ open, onOpenChange }: ExportDialogProps) {
  const { sheetConfig, elements, exportConfig, setExportConfig, csvData } = useLabelStore();
  const [isExporting, setIsExporting] = useState(false);

  // Calculate total labels based on elements
  const calculateTotalLabels = () => {
    let maxLabels = 0;
    
    for (const element of elements) {
      if (element.dataSourceType === 'sequential' && element.customSequence) {
        const count = Math.ceil((element.customSequence.end - element.customSequence.start + 1) / element.customSequence.step);
        maxLabels = Math.max(maxLabels, count);
      } else if (element.dataSourceType === 'csv') {
        maxLabels = Math.max(maxLabels, csvData.length);
      }
    }
    
    // If no sequential/csv elements, default to 1
    return maxLabels || 1;
  };

  const generateLabelDataList = () => {
    const totalLabels = calculateTotalLabels();
    const list = [];
    
    // Find the maximum sequence to generate
    let maxSequence = { start: 1, end: totalLabels, step: 1, padLength: 6, prefix: '', suffix: '' };
    
    for (const element of elements) {
      if (element.dataSourceType === 'sequential' && element.customSequence) {
        const seq = element.customSequence;
        const count = Math.ceil((seq.end - seq.start + 1) / seq.step);
        if (count > maxSequence.end) {
          maxSequence = seq;
        }
      }
    }
    
    // Generate labels based on max sequence or CSV
    const hasCsvElements = elements.some(el => el.dataSourceType === 'csv');
    
    if (hasCsvElements && csvData.length > 0) {
      // Use CSV data
      for (const row of csvData) {
        list.push({
          numero: row['NUMERO'] || row['numero'] || '000001',
          prefixo: row['PREFIXO'] || row['prefixo'] || '',
          sufixo: row['SUFIXO'] || row['sufixo'] || '',
          custom: row,
        });
      }
    } else {
      // Generate sequential data
      for (let i = 0; i < totalLabels; i++) {
        const num = maxSequence.start + i * maxSequence.step;
        list.push({
          numero: num.toString().padStart(maxSequence.padLength, '0'),
          prefixo: maxSequence.prefix,
          sufixo: maxSequence.suffix,
          custom: {},
        });
      }
    }
    
    return list;
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const labelDataList = generateLabelDataList();
      
      if (labelDataList.length === 0) {
        toast.error('Nenhuma etiqueta para exportar');
        return;
      }

      // Get default sequence from first sequential element or create default
      let defaultSequence = { start: 1, end: 100, step: 1, padLength: 6, prefix: '', suffix: '' };
      for (const element of elements) {
        if (element.dataSourceType === 'sequential' && element.customSequence) {
          defaultSequence = element.customSequence;
          break;
        }
      }

      switch (exportConfig.format) {
        case 'pdf':
          await exportToPDF(sheetConfig, elements, labelDataList, exportConfig, defaultSequence);
          toast.success(`PDF exportado com ${labelDataList.length} etiquetas`);
          break;
        case 'pdf-single':
          await exportToPDFSingle(sheetConfig, elements, labelDataList, exportConfig, defaultSequence);
          toast.success(`PDF individual exportado com ${labelDataList.length} páginas`);
          break;
        case 'png':
          await exportToPNG(sheetConfig, elements, labelDataList, exportConfig, defaultSequence);
          toast.success(`ZIP com ${labelDataList.length} imagens PNG exportado`);
          break;
      }
      onOpenChange(false);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Erro ao exportar: ' + (error as Error).message);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Exportar Etiquetas</DialogTitle>
          <DialogDescription>Configure as opções de exportação</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Formato</Label>
            <RadioGroup
              value={exportConfig.format}
              onValueChange={(v) => setExportConfig({ format: v as typeof exportConfig.format })}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label htmlFor="pdf" className="font-normal">PDF (múltiplas etiquetas por página)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="pdf-single" id="pdf-single" />
                <Label htmlFor="pdf-single" className="font-normal">PDF (1 etiqueta por página)</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="png" id="png" />
                <Label htmlFor="png" className="font-normal">PNG individual (ZIP)</Label>
              </div>
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label>Resolução (DPI)</Label>
            <Select
              value={exportConfig.dpi.toString()}
              onValueChange={(v) => setExportConfig({ dpi: parseInt(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="150">150 DPI (Rascunho)</SelectItem>
                <SelectItem value="300">300 DPI (Alta qualidade)</SelectItem>
                <SelectItem value="600">600 DPI (Profissional)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {exportConfig.format === 'pdf' && (
            <div className="flex items-center justify-between">
              <Label>Marcas de corte</Label>
              <Switch
                checked={exportConfig.includeCropMarks}
                onCheckedChange={(v) => setExportConfig({ includeCropMarks: v })}
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={handleExport} disabled={isExporting}>
            {isExporting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileDown className="mr-2 h-4 w-4" />}
            Exportar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
