import { Upload, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLabelStore } from '@/store/labelStore';
import { toast } from 'sonner';
import Papa from 'papaparse';

export function DataPanel() {
  const { 
    csvData,
    csvHeaders,
    setCsvData,
    sheetConfig,
    elements
  } = useLabelStore();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        if (results.data && results.data.length > 0) {
          const headers = Object.keys(results.data[0] as object);
          setCsvData(results.data as any[], headers);
          toast.success(`${results.data.length} registros importados`);
        }
      },
      error: (error) => {
        toast.error('Erro ao importar arquivo: ' + error.message);
      },
    });
  };

  // Calculate total labels based on elements with sequential data sources
  const calculateTotalLabels = () => {
    // Find the maximum sequence end from all sequential elements
    let maxLabels = 0;
    
    for (const element of elements) {
      if (element.dataSourceType === 'sequential' && element.customSequence) {
        const count = Math.ceil((element.customSequence.end - element.customSequence.start + 1) / element.customSequence.step);
        maxLabels = Math.max(maxLabels, count);
      } else if (element.dataSourceType === 'csv') {
        maxLabels = Math.max(maxLabels, csvData.length);
      }
    }
    
    // If no sequential elements, default to 1
    return maxLabels || 1;
  };

  const totalLabels = calculateTotalLabels();
  const labelsPerPage = sheetConfig.columns * sheetConfig.rows;
  const totalPages = Math.ceil(totalLabels / labelsPerPage);

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 py-3">
        <CardTitle className="text-sm">Dados CSV/Excel</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileUpload}
              className="hidden"
              id="csv-upload"
            />
            <label htmlFor="csv-upload">
              <Button variant="outline" className="w-full gap-2" asChild>
                <span>
                  <Upload className="h-4 w-4" />
                  Importar CSV/Excel
                </span>
              </Button>
            </label>
            <p className="text-xs text-muted-foreground mt-2">
              Importe um arquivo CSV para usar colunas nos elementos QR Code e Código de Barras
            </p>
          </div>

          {csvHeaders.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Colunas Disponíveis:</p>
              <div className="flex flex-wrap gap-1">
                {csvHeaders.map((header) => (
                  <span
                    key={header}
                    className="px-2 py-1 bg-primary/10 text-primary text-xs rounded font-mono"
                  >
                    {'{' + header + '}'}
                  </span>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                Use essas colunas no campo "Valor" dos elementos ou selecione "CSV/Excel" como fonte de dados
              </p>
            </div>
          )}

          {csvData.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Preview ({csvData.length} registros)</p>
              <ScrollArea className="h-40 border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-xs">#</TableHead>
                      {csvHeaders.slice(0, 3).map((header) => (
                        <TableHead key={header} className="text-xs">{header}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {csvData.slice(0, 5).map((row, index) => (
                      <TableRow key={index}>
                        <TableCell className="text-xs">{index + 1}</TableCell>
                        {csvHeaders.slice(0, 3).map((header) => (
                          <TableCell key={header} className="text-xs truncate max-w-20">
                            {row[header]}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            </div>
          )}

          {/* Summary */}
          <div className="mt-4 p-3 bg-primary/10 rounded-lg space-y-1">
            <p className="text-xs font-medium text-primary">Total de Etiquetas Estimado</p>
            <p className="text-lg font-bold">{totalLabels.toLocaleString('pt-BR')}</p>
            <p className="text-xs text-muted-foreground">
              {totalPages} página(s) • {labelsPerPage} etiquetas/página
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Baseado nas sequências configuradas nos elementos
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
