import { OS } from '@/store/osStore';
import { LabelElement, SequentialConfig } from '@/types/label';

export interface SequentialDataInfo {
    elementId: string;
    elementType: string;
    config: SequentialConfig;
    formattedRange: string;
    totalLabels: number;
}

export interface CSVDataInfo {
    elementId: string;
    elementType: string;
    totalRecords: number;
}

export interface OSDataAnalysis {
    osId: string;
    osName: string;
    sequentialData: SequentialDataInfo[];
    csvData: CSVDataInfo[];
    totalLabelsEstimated: number;
    labelsPerPage: number;
    totalPages: number;
}

export interface ClientOSGroup {
    clientCode: string;
    clientRazaoSocial: string;
    clientNomeComercial?: string;
    osList: OS[];
    totalOS: number;
    totalLabelsEstimated: number;
}

/**
 * Formata uma faixa numérica sequencial de forma legível
 */
export function formatSequentialRange(config: SequentialConfig): string {
    const start = config.start;
    const end = config.end;
    const prefix = config.prefix || '';
    const suffix = config.suffix || '';
    const padLength = config.padLength || 0;

    const formatNumber = (num: number) => {
        const numStr = num.toString().padStart(padLength, '0');
        return `${prefix}${numStr}${suffix}`;
    };

    return `${formatNumber(start)} até ${formatNumber(end)}`;
}

/**
 * Calcula o total de etiquetas de um elemento sequencial
 */
function calculateSequentialLabels(config: SequentialConfig): number {
    return Math.ceil((config.end - config.start + 1) / config.step);
}

/**
 * Analisa os elementos de uma O.S e retorna informações sobre dados variáveis
 */
export function analyzeOSData(os: OS, csvDataLength: number = 0): OSDataAnalysis {
    const elements = os.elements || [];
    const sequentialData: SequentialDataInfo[] = [];
    const csvData: CSVDataInfo[] = [];
    let maxLabels = 0;

    // Analisar cada elemento
    elements.forEach((element: LabelElement) => {
        // Elementos com dados sequenciais
        if (element.dataSourceType === 'sequential' && element.customSequence) {
            const totalLabels = calculateSequentialLabels(element.customSequence);
            maxLabels = Math.max(maxLabels, totalLabels);

            sequentialData.push({
                elementId: element.id,
                elementType: element.type,
                config: element.customSequence,
                formattedRange: formatSequentialRange(element.customSequence),
                totalLabels,
            });
        }

        // Elementos com dados CSV
        if (element.dataSourceType === 'csv' && csvDataLength > 0) {
            maxLabels = Math.max(maxLabels, csvDataLength);

            csvData.push({
                elementId: element.id,
                elementType: element.type,
                totalRecords: csvDataLength,
            });
        }
    });

    // Se não há dados variáveis, considerar 1 etiqueta
    const totalLabelsEstimated = maxLabels || 1;

    // Calcular páginas
    const labelsPerPage = (os.config?.columns || 1) * (os.config?.rows || 1);
    const totalPages = Math.ceil(totalLabelsEstimated / labelsPerPage);

    return {
        osId: os.id,
        osName: os.name,
        sequentialData,
        csvData,
        totalLabelsEstimated,
        labelsPerPage,
        totalPages,
    };
}

/**
 * Calcula o total de etiquetas estimadas de uma O.S
 */
export function calculateTotalLabels(os: OS, csvDataLength: number = 0): number {
    const analysis = analyzeOSData(os, csvDataLength);
    return analysis.totalLabelsEstimated;
}

/**
 * Agrupa O.S's por código de cliente
 */
export function groupOSByClient(osList: OS[]): ClientOSGroup[] {
    const grouped = new Map<string, ClientOSGroup>();

    osList.forEach((os) => {
        // Apenas O.S's com cliente definido
        if (!os.clientCode || !os.clientRazaoSocial) {
            return;
        }

        const key = os.clientCode;

        if (!grouped.has(key)) {
            grouped.set(key, {
                clientCode: os.clientCode,
                clientRazaoSocial: os.clientRazaoSocial,
                clientNomeComercial: os.clientNomeComercial,
                osList: [],
                totalOS: 0,
                totalLabelsEstimated: 0,
            });
        }

        const group = grouped.get(key)!;
        group.osList.push(os);
        group.totalOS++;
        group.totalLabelsEstimated += calculateTotalLabels(os);
    });

    // Converter Map para Array e ordenar por razão social
    return Array.from(grouped.values()).sort((a, b) =>
        a.clientRazaoSocial.localeCompare(b.clientRazaoSocial)
    );
}

/**
 * Filtra grupos de clientes por query de busca
 */
export function filterClientGroups(
    groups: ClientOSGroup[],
    query: string
): ClientOSGroup[] {
    if (!query.trim()) {
        return groups;
    }

    const lowerQuery = query.toLowerCase();

    return groups.filter(
        (group) =>
            group.clientCode.toLowerCase().includes(lowerQuery) ||
            group.clientRazaoSocial.toLowerCase().includes(lowerQuery) ||
            group.clientNomeComercial?.toLowerCase().includes(lowerQuery)
    );
}
