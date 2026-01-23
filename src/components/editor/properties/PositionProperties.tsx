import { memo, useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface PositionPropertiesProps {
    elementId: string;
    x: number;
    y: number;
    width: number;
    height: number;
    onUpdate: (updates: { x?: number; y?: number; width?: number; height?: number }) => void;
}

export const PositionProperties = memo(function PositionProperties({
    elementId,
    x,
    y,
    width,
    height,
    onUpdate
}: PositionPropertiesProps) {
    const [localValues, setLocalValues] = useState({ x, y, width, height });
    const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

    // Sync only when elementId changes (switching selection)
    // We explicitly ignore prop updates for the same element to preventing typing interruption
    // This trade-off means external updates (like Undo) won't reflect immediately if selected
    useEffect(() => {
        setLocalValues({ x, y, width, height });

        // Clear any pending timeouts when switching elements
        Object.values(timeoutRef.current).forEach(t => clearTimeout(t));
        timeoutRef.current = {};
    }, [elementId, x, y, width, height]);

    const updateWithDebounce = (key: keyof typeof localValues, value: number) => {
        setLocalValues(prev => ({ ...prev, [key]: value }));

        if (timeoutRef.current[key]) {
            clearTimeout(timeoutRef.current[key]);
        }

        timeoutRef.current[key] = setTimeout(() => {
            onUpdate({ [key]: value });
        }, 300);
    };

    // Immediate update on blur
    const handleBlur = (key: keyof typeof localValues) => {
        if (timeoutRef.current[key]) clearTimeout(timeoutRef.current[key]);
        onUpdate({ [key]: localValues[key] });
    };

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium">Posição e Tamanho (mm)</h3>
            <div className="grid grid-cols-2 gap-2">
                <div>
                    <Label className="text-xs">X</Label>
                    <Input
                        type="number"
                        value={localValues.x}
                        onChange={(e) => updateWithDebounce('x', parseFloat(e.target.value) || 0)}
                        onBlur={() => handleBlur('x')}
                        step={0.5}
                        className="h-8"
                    />
                </div>
                <div>
                    <Label className="text-xs">Y</Label>
                    <Input
                        type="number"
                        value={localValues.y}
                        onChange={(e) => updateWithDebounce('y', parseFloat(e.target.value) || 0)}
                        onBlur={() => handleBlur('y')}
                        step={0.5}
                        className="h-8"
                    />
                </div>
                <div>
                    <Label className="text-xs">Largura</Label>
                    <Input
                        type="number"
                        value={localValues.width}
                        onChange={(e) => updateWithDebounce('width', parseFloat(e.target.value) || 1)}
                        onBlur={() => handleBlur('width')}
                        step={0.5}
                        min={1}
                        className="h-8"
                    />
                </div>
                <div>
                    <Label className="text-xs">Altura</Label>
                    <Input
                        type="number"
                        value={localValues.height}
                        onChange={(e) => updateWithDebounce('height', parseFloat(e.target.value) || 1)}
                        onBlur={() => handleBlur('height')}
                        step={0.5}
                        min={1}
                        className="h-8"
                    />
                </div>
            </div>
        </div>
    );
}, (prev, next) => {
    // Custom equality check to avoid re-render if props are chemically equal
    // Note: Since we rely on elementId change to reset localValues, we can use that primarily
    return prev.elementId === next.elementId &&
        prev.x === next.x &&
        prev.y === next.y &&
        prev.width === next.width &&
        prev.height === next.height;
});
