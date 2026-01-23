import { useCallback, useEffect, useRef, useState } from 'react';
import { useLabelStore } from '@/store/labelStore';

/**
 * Hook otimizado que retorna apenas o elemento selecionado
 * sem causar re-renders quando outros elementos mudam
 */
export function useSelectedElement() {
    const selectedElementId = useLabelStore((state) => state.selectedElementId);
    const [element, setElement] = useState(() => {
        const state = useLabelStore.getState();
        return state.elements.find((el) => el.id === selectedElementId);
    });

    useEffect(() => {
        const state = useLabelStore.getState();
        const newElement = state.elements.find((el) => el.id === selectedElementId);
        setElement(newElement);
    }, [selectedElementId]);

    return element;
}

/**
 * Hook para atualizar elemento sem causar re-render
 */
export function useElementUpdate() {
    const selectedElementId = useLabelStore((state) => state.selectedElementId);

    return useCallback((updates: Record<string, any>) => {
        if (selectedElementId) {
            useLabelStore.getState().updateElement(selectedElementId, updates);
        }
    }, [selectedElementId]);
}

/**
 * Hook para gerenciar valores locais com debounce
 */
export function useLocalValues(selectedElementId: string | null) {
    const [localValues, setLocalValues] = useState<Record<string, string | number>>({});
    const updateTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

    // Sincronizar quando o elemento muda
    useEffect(() => {
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
            });
        }
    }, [selectedElementId]);

    // Limpar timeouts
    useEffect(() => {
        return () => {
            Object.values(updateTimeoutRef.current).forEach(timeout => clearTimeout(timeout));
        };
    }, [selectedElementId]);

    const updateWithDebounce = useCallback((
        key: string,
        value: string | number,
        finalUpdate: (val: any) => void,
        delay: number = 300
    ) => {
        setLocalValues(prev => ({ ...prev, [key]: value }));

        if (updateTimeoutRef.current[key]) {
            clearTimeout(updateTimeoutRef.current[key]);
        }

        updateTimeoutRef.current[key] = setTimeout(() => {
            finalUpdate(value);
        }, delay);
    }, []);

    return { localValues, updateWithDebounce };
}
