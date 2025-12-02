import { useState } from 'react';
import { Upload, FileSpreadsheet, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useLabelStore } from '@/store/labelStore';
import { toast } from 'sonner';
import Papa from 'papaparse';

export function DataPanel() {
  const { 
    dataMode, 
    setDataMode, 
    sequentialConfig, 
    setSequentialConfig,
    csvData,
    csvHeaders,
    setCsvData,
    sheetConfig
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

  const totalLabels = dataMode === 'sequential'
    ? Math.ceil((sequentialConfig.end - sequentialConfig.start + 1) / sequentialConfig.step)
    : csvData.length;
  
  const labelsPerPage = sheetConfig.columns * sheetConfig.rows;
  const totalPages = Math.ceil(totalLabels / labelsPerPage);

  return (
    <Card className="border-none shadow-none bg-transparent">
      <CardHeader className="px-0 py-3">
        <CardTitle className="text-sm">Dados para Geração</CardTitle>
      </CardHeader>
      <CardContent className="px-0">
        <Tabs value={dataMode} onValueChange={(v) => setDataMode(v as 'sequential' | 'csv')}>
          <TabsList className="grid w-full grid-cols-2 h-9">
            <TabsTrigger value="sequential" className="text-xs gap-1">
              <Hash className="h-3 w-3" />
              Sequencial
            </TabsTrigger>
            <TabsTrigger value="csv" className="text-xs gap-1">
              <FileSpreadsheet className="h-3 w-3" />
              CSV/Excel
            </TabsTrigger>
          </TabsList>

          <TabsContent value="sequential" className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Início</Label>
                <Input
                  type="number"
                  value={sequentialConfig.start}
                  onChange={(e) => setSequentialConfig({ start: parseInt(e.target.value) || 1 })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Fim</Label>
                <Input
                  type="number"
                  value={sequentialConfig.end}
                  onChange={(e) => setSequentialConfig({ end: parseInt(e.target.value) || 1 })}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Incremento</Label>
                <Input
                  type="number"
                  value={sequentialConfig.step}
                  onChange={(e) => setSequentialConfig({ step: parseInt(e.target.value) || 1 })}
                  min={1}
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Zeros à esquerda</Label>
                <Input
                  type="number"
                  value={sequentialConfig.padLength}
                  onChange={(e) => setSequentialConfig({ padLength: parseInt(e.target.value) || 0 })}
                  min={0}
                  max={20}
                  className="h-8"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div>
                <Label className="text-xs">Prefixo</Label>
                <Input
                  value={sequentialConfig.prefix}
                  onChange={(e) => setSequentialConfig({ prefix: e.target.value })}
                  placeholder="Ex: PAT-, ATIVO-, INF-"
                  className="h-8"
                />
              </div>
              <div>
                <Label className="text-xs">Sufixo</Label>
                <Input
                  value={sequentialConfig.suffix}
                  onChange={(e) => setSequentialConfig({ suffix: e.target.value })}
                  placeholder="Opcional"
                  className="h-8"
                />
              </div>
            </div>

            <div className="p-3 bg-muted/50 rounded-lg">
              <p className="text-xs font-medium">Exemplo de Numeração</p>
              <p className="text-sm font-mono mt-1">
                {sequentialConfig.prefix}
                {sequentialConfig.start.toString().padStart(sequentialConfig.padLength, '0')}
                {sequentialConfig.suffix}
                {' → '}
                {sequentialConfig.prefix}
                {sequentialConfig.end.toString().padStart(sequentialConfig.padLength, '0')}
                {sequentialConfig.suffix}
              </p>
            </div>
          </TabsContent>

          <TabsContent value="csv" className="space-y-4 mt-4">
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
          </TabsContent>
        </Tabs>

        {/* Summary */}
        <div className="mt-4 p-3 bg-primary/10 rounded-lg space-y-1">
          <p className="text-xs font-medium text-primary">Total de Etiquetas</p>
          <p className="text-lg font-bold">{totalLabels.toLocaleString('pt-BR')}</p>
          <p className="text-xs text-muted-foreground">
            {totalPages} página(s) • {labelsPerPage} etiquetas/página
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
