import { Upload, FileSpreadsheet, Trash2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLabelStore } from '@/store/labelStore';
import { toast } from 'sonner';
import Papa from 'papaparse';
import { CSVImport } from '@/types/label';

export function DataPanel() {
  const {
    csvImports,
    addCsvImport,
    removeCsvImport,
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

          const newCsvImport: CSVImport = {
            id: `csv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            name: file.name.replace(/\.(csv|xlsx|xls)$/i, ''),
            fileName: file.name,
            headers: headers,
            data: results.data as any[],
            importedAt: new Date().toISOString(),
          };

          addCsvImport(newCsvImport);
          toast.success(`${file.name}: ${results.data.length} registros importados`);
        }
      },
      error: (error) => {
        toast.error('Erro ao importar arquivo: ' + error.message);
      },
    });

    // Reset input para permitir reimportar o mesmo arquivo
    event.target.value = '';
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
        // Buscar a planilha correta
        const csvImport = element.csvImportId
          ? csvImports.find(csv => csv.id === element.csvImportId)
          : csvImports[0]; // Primeira planilha se não especificado

        if (csvImport) {
          maxLabels = Math.max(maxLabels, csvImport.data.length);
        }
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
              Importe arquivos CSV para usar colunas nos elementos
            </p>
          </div>

          {csvImports.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium">Planilhas Importadas ({csvImports.length}):</p>

              <Accordion type="single" collapsible className="w-full">
                {csvImports.map((csvImport) => (
                  <AccordionItem key={csvImport.id} value={csvImport.id}>
                    <AccordionTrigger className="text-sm py-2">
                      <div className="flex items-center justify-between w-full pr-2">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4 w-4" />
                          <span className="font-medium">{csvImport.name}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {csvImport.data.length} registros
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="space-y-3 pt-2">
                        {/* Colunas */}
                        <div>
                          <p className="text-xs font-medium mb-1">Colunas:</p>
                          <div className="flex flex-wrap gap-1">
                            {csvImport.headers.map((header) => (
                              <span
                                key={header}
                                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded font-mono"
                              >
                                {'{' + header + '}'}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* Preview */}
                        <div>
                          <p className="text-xs font-medium mb-1">Preview (5 primeiras linhas):</p>
                          <ScrollArea className="h-32 border rounded-lg">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className="text-xs">#</TableHead>
                                  {csvImport.headers.slice(0, 3).map((header) => (
                                    <TableHead key={header} className="text-xs">{header}</TableHead>
                                  ))}
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {csvImport.data.slice(0, 5).map((row, index) => (
                                  <TableRow key={index}>
                                    <TableCell className="text-xs">{index + 1}</TableCell>
                                    {csvImport.headers.slice(0, 3).map((header) => (
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

                        {/* Botão Remover */}
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full gap-2"
                          onClick={() => {
                            removeCsvImport(csvImport.id);
                            toast.success(`${csvImport.name} removida`);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                          Remover Planilha
                        </Button>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
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
