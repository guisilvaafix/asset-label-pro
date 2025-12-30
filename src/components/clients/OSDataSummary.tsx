import { OS } from '@/store/osStore';
import { analyzeOSData, OSDataAnalysis } from '@/utils/dataAnalysis';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Hash, Database, FileSpreadsheet, Layers } from 'lucide-react';

interface OSDataSummaryProps {
    os: OS;
    csvDataLength?: number;
}

export function OSDataSummary({ os, csvDataLength = 0 }: OSDataSummaryProps) {
    const analysis: OSDataAnalysis = analyzeOSData(os, csvDataLength);

    const hasVariableData = analysis.sequentialData.length > 0 || analysis.csvData.length > 0;

    return (
        <Card className="border-border/50">
            <CardContent className="p-4 space-y-3">
                {/* Configuração da Chapa */}
                {os.config && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground pb-2 border-b border-border">
                        <Layers className="h-3 w-3" />
                        <span className="font-medium">Chapa:</span>
                        <span>{os.config.chapaName || 'Personalizada'}</span>
                        <span>•</span>
                        <span>{os.config.labelWidth}×{os.config.labelHeight}mm</span>
                        <span>•</span>
                        <span>{os.config.columns}×{os.config.rows}</span>
                    </div>
                )}

                {/* Dados Sequenciais */}
                {analysis.sequentialData.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <Hash className="h-3 w-3 text-primary" />
                            <span>Dados Sequenciais:</span>
                        </div>
                        {analysis.sequentialData.map((data, index) => (
                            <div
                                key={data.elementId}
                                className="ml-5 p-2 bg-primary/5 rounded border border-primary/10"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-primary">
                                            {data.formattedRange}
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Elemento {data.elementType} • {data.totalLabels.toLocaleString('pt-BR')} etiquetas
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs">
                                        {data.totalLabels}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Dados CSV */}
                {analysis.csvData.length > 0 && (
                    <div className="space-y-2">
                        <div className="flex items-center gap-2 text-xs font-medium">
                            <FileSpreadsheet className="h-3 w-3 text-green-600" />
                            <span>Dados CSV:</span>
                        </div>
                        {analysis.csvData.map((data) => (
                            <div
                                key={data.elementId}
                                className="ml-5 p-2 bg-green-50 dark:bg-green-950/20 rounded border border-green-200 dark:border-green-900"
                            >
                                <div className="flex items-center justify-between gap-2">
                                    <div className="flex-1">
                                        <p className="text-xs font-medium text-green-700 dark:text-green-400">
                                            {data.totalRecords.toLocaleString('pt-BR')} registros importados
                                        </p>
                                        <p className="text-xs text-muted-foreground mt-0.5">
                                            Elemento {data.elementType}
                                        </p>
                                    </div>
                                    <Badge variant="secondary" className="text-xs bg-green-100 dark:bg-green-900">
                                        {data.totalRecords}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Sem dados variáveis */}
                {!hasVariableData && (
                    <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted/30 rounded">
                        <Database className="h-3 w-3" />
                        <span>Sem dados variáveis configurados</span>
                    </div>
                )}

                {/* Resumo Total */}
                <div className="pt-2 border-t border-border">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-medium">Total Estimado:</span>
                        <div className="flex items-center gap-2">
                            <Badge variant="default" className="text-xs">
                                {analysis.totalLabelsEstimated.toLocaleString('pt-BR')} etiquetas
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                                {analysis.totalPages} página(s)
                            </Badge>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
