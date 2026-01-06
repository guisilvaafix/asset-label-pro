import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { LabelElement, CSVImport, SequentialConfig } from '@/types/label';
import { useMemo } from 'react';

interface DynamicFieldConfigProps {
    element: LabelElement;
    allElements: LabelElement[]; // Todos os elementos para listar QR/Barcodes
    csvImports: CSVImport[];
    sequentialConfig: SequentialConfig;
    getCsvImport: (id: string) => CSVImport | undefined;
    onUpdate: (updates: Partial<LabelElement>) => void;
}

// Opções de formato de valor
const VALUE_FORMAT_OPTIONS = [
    { value: '{NUMERO}', label: 'Número', example: '000001' },
    { value: '{PREFIXO}{NUMERO}', label: 'Prefixo + Número', example: 'QR-000001' },
    { value: '{PREFIXO}{NUMERO}{SUFIXO}', label: 'Prefixo + Número + Sufixo', example: 'QR-000001-A' },
    { value: '{NUMERO}{SUFIXO}', label: 'Número + Sufixo', example: '000001-A' },
];

export function DynamicFieldConfig({
    element,
    allElements,
    csvImports,
    sequentialConfig,
    getCsvImport,
    onUpdate,
}: DynamicFieldConfigProps) {
    // Filtrar apenas QR Codes e Barcodes com configuração sequencial
    const sequentialElements = useMemo(() => {
        return allElements.filter(el =>
            (el.type === 'qrcode' || el.type === 'barcode' || el.type === 'datamatrix' || el.type === 'pdf417') &&
            el.dataSourceType === 'sequential' &&
            el.customSequence &&
            el.id !== element.id // Não incluir o próprio elemento
        );
    }, [allElements, element.id]);

    return (
        <>
            {/* Switch para ativar/desativar Campo Dinâmico */}
            <div className="flex items-center justify-between">
                <Label className="text-xs">Campo Dinâmico</Label>
                <Switch
                    checked={element.isDynamic || false}
                    onCheckedChange={(checked) => {
                        if (checked) {
                            // Ativar com tipo padrão (planilha se houver, senão sequencial)
                            const defaultType = csvImports.length > 0 ? 'csv' : 'sequential';
                            if (defaultType === 'csv') {
                                const firstValue = csvImports[0].data[0]?.[csvImports[0].headers[0]] || '';
                                onUpdate({
                                    isDynamic: true,
                                    dataSourceType: 'csv',
                                    csvImportId: csvImports[0]?.id,
                                    csvColumn: csvImports[0]?.headers[0],
                                    text: firstValue,
                                });
                            } else {
                                onUpdate({
                                    isDynamic: true,
                                    dataSourceType: 'sequential',
                                    text: '{NUMERO}', // Valor padrão para sequencial
                                });
                            }
                        } else {
                            // Desativar
                            onUpdate({
                                isDynamic: false,
                                dataSourceType: undefined,
                                csvImportId: undefined,
                                csvColumn: undefined,
                                customSequence: undefined,
                            });
                        }
                    }}
                />
            </div>

            {/* Opções de Campo Dinâmico */}
            {element.isDynamic && (
                <div className="space-y-3 p-3 bg-muted/50 rounded-md border">
                    {/* Seletor de Tipo */}
                    <div>
                        <Label className="text-xs font-medium">Tipo</Label>
                        <Select
                            value={element.dataSourceType || 'sequential'}
                            onValueChange={(value: 'sequential' | 'csv') => {
                                if (value === 'sequential') {
                                    onUpdate({
                                        dataSourceType: 'sequential',
                                        csvImportId: undefined,
                                        csvColumn: undefined,
                                        text: '{NUMERO}', // Valor padrão
                                        customSequence: {
                                            start: sequentialConfig.start,
                                            end: sequentialConfig.end,
                                            step: sequentialConfig.step,
                                            padLength: sequentialConfig.padLength,
                                            prefix: sequentialConfig.prefix,
                                            suffix: sequentialConfig.suffix,
                                        },
                                    });
                                } else if (value === 'csv' && csvImports.length > 0) {
                                    const firstValue = csvImports[0].data[0]?.[csvImports[0].headers[0]] || '';
                                    onUpdate({
                                        dataSourceType: 'csv',
                                        csvImportId: csvImports[0]?.id,
                                        csvColumn: csvImports[0]?.headers[0],
                                        customSequence: undefined,
                                        text: firstValue,
                                    });
                                }
                            }}
                        >
                            <SelectTrigger className="h-8">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="sequential">Sequencial</SelectItem>
                                <SelectItem value="csv" disabled={csvImports.length === 0}>
                                    Planilha {csvImports.length === 0 && '(importe um CSV primeiro)'}
                                </SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Opções Sequenciais */}
                    {element.dataSourceType === 'sequential' && (
                        <div className="space-y-2 pt-2 border-t">
                            <Label className="text-xs font-medium">Configuração Sequencial</Label>

                            {/* Select de Elemento de Referência */}
                            <div>
                                <Label className="text-xs">Referência (QR Code/Barcode)</Label>
                                {sequentialElements.length > 0 ? (
                                    <Select
                                        value={element.sequentialReference || ''}
                                        onValueChange={(value) => {
                                            const refElement = allElements.find(el => el.id === value);
                                            onUpdate({
                                                sequentialReference: value,
                                                // Copiar a configuração sequencial do elemento de referência
                                                customSequence: refElement?.customSequence ? {
                                                    ...refElement.customSequence
                                                } : element.customSequence,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue placeholder="Selecione um elemento" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {sequentialElements.map((el) => (
                                                <SelectItem key={el.id} value={el.id}>
                                                    {el.type === 'qrcode' ? '📱 QR Code' :
                                                        el.type === 'barcode' ? '📊 Barcode' :
                                                            el.type === 'datamatrix' ? '⬛ DataMatrix' : '📄 PDF417'}
                                                    {' - '}
                                                    {el.customSequence?.prefix || ''}
                                                    {el.customSequence?.start.toString().padStart(el.customSequence?.padLength || 0, '0') || ''}
                                                    {el.customSequence?.suffix || ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <div className="p-3 bg-muted/50 rounded-md border border-dashed">
                                        <p className="text-xs text-muted-foreground text-center">
                                            Nenhum QR Code ou Barcode sequencial encontrado
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Select de Formato de Valor */}
                            {element.sequentialReference && (
                                <div>
                                    <Label className="text-xs">Formato do Valor</Label>
                                    <Select
                                        value={element.sequentialFormat || '{NUMERO}'}
                                        onValueChange={(value) => {
                                            onUpdate({
                                                sequentialFormat: value,
                                                text: value, // Atualizar o texto com o formato selecionado
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {VALUE_FORMAT_OPTIONS.map((option) => (
                                                <SelectItem key={option.value} value={option.value}>
                                                    <div className="flex flex-col">
                                                        <span className="font-medium">{option.label}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            Ex: {option.example}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Preview do valor */}
                            {element.sequentialReference && element.customSequence && (
                                <div className="pt-2 border-t">
                                    <Label className="text-xs text-muted-foreground">Preview:</Label>
                                    <p className="text-xs font-mono mt-1 p-2 bg-background rounded">
                                        {(() => {
                                            const format = element.sequentialFormat || '{NUMERO}';
                                            const seq = element.customSequence;
                                            const numero = seq.start.toString().padStart(seq.padLength, '0');
                                            return format
                                                .replace('{NUMERO}', numero)
                                                .replace('{PREFIXO}', seq.prefix)
                                                .replace('{SUFIXO}', seq.suffix);
                                        })()}
                                    </p>
                                </div>
                            )}

                            <p className="text-xs text-muted-foreground mt-2">
                                {element.sequentialReference
                                    ? 'O texto capturará o valor do elemento selecionado.'
                                    : 'Selecione um QR Code ou Barcode sequencial como referência.'}
                            </p>
                        </div>
                    )}

                    {/* Opções de Planilha */}
                    {element.dataSourceType === 'csv' && csvImports.length > 0 && (() => {
                        const currentCsvImport = element.csvImportId
                            ? getCsvImport(element.csvImportId)
                            : csvImports[0];

                        if (!currentCsvImport) return null;

                        return (
                            <>
                                <div className="pt-2 border-t">
                                    <Label className="text-xs">Planilha</Label>
                                    <Select
                                        value={element.csvImportId || csvImports[0]?.id}
                                        onValueChange={(id) => {
                                            const csvImport = getCsvImport(id);
                                            if (csvImport) {
                                                const firstColumn = csvImport.headers[0];
                                                const firstValue = csvImport.data[0]?.[firstColumn] || '';
                                                onUpdate({
                                                    csvImportId: id,
                                                    csvColumn: firstColumn,
                                                    text: firstValue,
                                                });
                                            }
                                        }}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {csvImports.map((csv) => (
                                                <SelectItem key={csv.id} value={csv.id}>
                                                    {csv.name} ({csv.data.length} registros)
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div>
                                    <Label className="text-xs">Coluna</Label>
                                    <Select
                                        value={element.csvColumn || currentCsvImport.headers[0]}
                                        onValueChange={(column) => {
                                            const firstValue = currentCsvImport.data[0]?.[column] || '';
                                            onUpdate({
                                                csvColumn: column,
                                                text: firstValue,
                                            });
                                        }}
                                    >
                                        <SelectTrigger className="h-8">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {currentCsvImport.headers.map((header) => (
                                                <SelectItem key={header} value={header}>
                                                    {header}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="pt-2 border-t">
                                    <Label className="text-xs text-muted-foreground">Preview (linha 1):</Label>
                                    <p className="text-xs font-mono mt-1 p-2 bg-background rounded">
                                        {currentCsvImport.data[0]?.[element.csvColumn || currentCsvImport.headers[0]] || '—'}
                                    </p>
                                </div>
                            </>
                        );
                    })()}
                </div>
            )}
        </>
    );
}
