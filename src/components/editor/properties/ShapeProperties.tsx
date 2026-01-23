import { memo, useEffect, useRef, useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

interface ShapePropertiesProps {
    elementId: string;
    type: 'rectangle' | 'circle' | 'line';
    fill?: string;
    stroke?: string;
    strokeWidth?: number;
    cornerRadius?: number;
    onUpdate: (updates: { shapeFill?: string; shapeStroke?: string; shapeStrokeWidth?: number; cornerRadius?: number }) => void;
}

export const ShapeProperties = memo(function ShapeProperties({
    elementId,
    type,
    fill,
    stroke,
    strokeWidth,
    cornerRadius,
    onUpdate
}: ShapePropertiesProps) {
    const [localValues, setLocalValues] = useState({
        shapeFill: fill || '#ffffff',
        shapeStroke: stroke || '#000000'
    });
    const timeoutRef = useRef<Record<string, NodeJS.Timeout>>({});

    useEffect(() => {
        setLocalValues({
            shapeFill: fill || '#ffffff',
            shapeStroke: stroke || '#000000'
        });

        Object.values(timeoutRef.current).forEach(t => clearTimeout(t));
        timeoutRef.current = {};
    }, [elementId, fill, stroke]);

    const updateWithDebounce = (key: keyof typeof localValues, value: string) => {
        setLocalValues(prev => ({ ...prev, [key]: value }));

        if (timeoutRef.current[key]) {
            clearTimeout(timeoutRef.current[key]);
        }

        timeoutRef.current[key] = setTimeout(() => {
            onUpdate({ [key]: value });
        }, 300);
    };

    const handleBlur = (key: keyof typeof localValues) => {
        if (timeoutRef.current[key]) clearTimeout(timeoutRef.current[key]);
        onUpdate({ [key]: localValues[key] });
    };

    return (
        <div className="space-y-3">
            <h3 className="text-sm font-medium">{type === 'line' ? 'Linha' : 'Forma'}</h3>

            {type !== 'line' && (
                <div>
                    <Label className="text-xs">Preenchimento</Label>
                    <div className="flex gap-2">
                        <Input
                            type="color"
                            value={localValues.shapeFill}
                            onChange={(e) => onUpdate({ shapeFill: e.target.value })}
                            className="h-8 w-12 p-1"
                        />
                        <Input
                            value={localValues.shapeFill}
                            onChange={(e) => updateWithDebounce('shapeFill', e.target.value)}
                            onBlur={() => handleBlur('shapeFill')}
                            className="h-8 flex-1"
                        />
                    </div>
                </div>
            )}

            <div>
                <Label className="text-xs">{type === 'line' ? 'Cor' : 'Cor da Borda'}</Label>
                <div className="flex gap-2">
                    <Input
                        type="color"
                        value={localValues.shapeStroke}
                        onChange={(e) => onUpdate({ shapeStroke: e.target.value })}
                        className="h-8 w-12 p-1"
                    />
                    <Input
                        value={localValues.shapeStroke}
                        onChange={(e) => updateWithDebounce('shapeStroke', e.target.value)}
                        onBlur={() => handleBlur('shapeStroke')}
                        className="h-8 flex-1"
                    />
                </div>
            </div>

            <div>
                <Label className="text-xs">Espessura: {strokeWidth}px</Label>
                <Slider
                    value={[strokeWidth || 1]}
                    onValueChange={([value]) => onUpdate({ shapeStrokeWidth: value })}
                    min={type === 'line' ? 0.5 : 0}
                    max={10}
                    step={0.5}
                />
            </div>

            {type === 'rectangle' && (
                <div>
                    <Label className="text-xs">Arredondamento: {cornerRadius || 0}mm</Label>
                    <Slider
                        value={[cornerRadius || 0]}
                        onValueChange={([value]) => onUpdate({ cornerRadius: value })}
                        min={0}
                        max={20}
                        step={0.5}
                    />
                </div>
            )}
        </div>
    );
}, (prev, next) => {
    return prev.elementId === next.elementId &&
        prev.fill === next.fill &&
        prev.stroke === next.stroke &&
        prev.strokeWidth === next.strokeWidth &&
        prev.cornerRadius === next.cornerRadius &&
        prev.type === next.type;
});
