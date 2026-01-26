import { useCallback, useEffect, useRef, useState } from 'react';
import { useLabelStore } from '@/store/labelStore';
import { LabelElement } from '@/types/label';

/**
 * Hook simples que retorna o elemento selecionado
 */
export function useSelectedElement() {
    const selectedElementId = useLabelStore((state) => state.selectedElementId);
    const elements = useLabelStore((state) => state.elements);

    return elements.find((el) => el.id === selectedElementId);
}

/**
 * Hook para atualizar elemento
 */
export function useElementUpdate() {
    const selectedElementId = useLabelStore((state) => state.selectedElementId);
    const updateElement = useLabelStore((state) => state.updateElement);

    return useCallback((updates: Record<string, any>) => {
        if (selectedElementId) {
            updateElement(selectedElementId, updates);
        }
    }, [selectedElementId, updateElement]);
}

/**
 * Hook para gerenciar valores locais com debounce
 * Evita atualizar a store a cada keystroke
 */
export function useLocalValues(selectedElementId: string | null) {
    const [localValues, setLocalValues] = useState<Record<string, string | number>>({});
    const updateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

    // Sincronizar quando o elemento muda (apenas quando ID muda)
    useEffect(() => {
        if (!selectedElementId) {
            setLocalValues({});
            return;
        }

        const state = useLabelStore.getState();
        const element = state.elements.find((el) => el.id === selectedElementId);

        if (element) {
            setLocalValues({
                x: element.x,
                y: element.y,
                width: element.width,
                height: element.height,
                text: element.text || '',
                qrValue: element.qrValue || '',
                barcodeValue: element.barcodeValue || '',
                fill: element.fill || '#000000',
                qrForeground: element.qrForeground || '#000000',
                qrBackground: element.qrBackground || '#ffffff',
                shapeFill: element.shapeFill || '#ffffff',
                shapeStroke: element.shapeStroke || '#000000',
                prefix: element.customSequence?.prefix || '',
                suffix: element.customSequence?.suffix || '',
                seqStart: element.customSequence?.start || 1,
                seqEnd: element.customSequence?.end || 100,
                seqStep: element.customSequence?.step || 1,
                seqPadLength: element.customSequence?.padLength || 6,
            });
        }
    }, [selectedElementId]);

    // Limpar timeouts quando elemento muda
    useEffect(() => {
        return () => {
            Object.values(updateTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
            updateTimeoutRef.current = {};
        };
    }, [selectedElementId]);

    const updateWithDebounce = useCallback((
        key: string,
        value: string | number,
        finalUpdate: (val: any) => void,
        delay: number = 300
    ) => {
        // Atualizar valor local imediatamente
        setLocalValues(prev => ({ ...prev, [key]: value }));

        // Limpar timeout anterior para esta chave
        if (updateTimeoutRef.current[key]) {
            clearTimeout(updateTimeoutRef.current[key]);
        }

        // Criar novo timeout para atualização da store
        updateTimeoutRef.current[key] = setTimeout(() => {
            finalUpdate(value);
            delete updateTimeoutRef.current[key];
        }, delay);
    }, []);

    // Função para forçar atualização imediata (útil para onBlur)
    const flushValue = useCallback((key: string, value: string | number, finalUpdate: (val: any) => void) => {
        if (updateTimeoutRef.current[key]) {
            clearTimeout(updateTimeoutRef.current[key]);
            delete updateTimeoutRef.current[key];
        }
        finalUpdate(value);
    }, []);

    return { localValues, updateWithDebounce, flushValue, updateTimeoutRef };
}

/**
 * Hook para obter dados do store
 */
export function useStoreData() {
    const sequentialConfig = useLabelStore((state) => state.sequentialConfig);
    const csvHeaders = useLabelStore((state) => state.csvHeaders);
    const csvImports = useLabelStore((state) => state.csvImports);
    const getCsvImport = useLabelStore((state) => state.getCsvImport);
    const elements = useLabelStore((state) => state.elements);

    return {
        sequentialConfig,
        csvHeaders,
        csvImports,
        getCsvImport,
        elements,
    };
}
