import { memo } from 'react';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';

interface StylePropertiesProps {
    rotation: number;
    opacity: number;
    onUpdate: (updates: { rotation?: number; opacity?: number }) => void;
}

export const StyleProperties = memo(function StyleProperties({
    rotation,
    opacity,
    onUpdate
}: StylePropertiesProps) {
    return (
        <div className="space-y-3">
            <div>
                <Label className="text-xs">Rotação: {rotation}°</Label>
                <Slider
                    value={[rotation]}
                    onValueChange={([value]) => onUpdate({ rotation: value })}
                    min={0}
                    max={360}
                    step={1}
                />
            </div>
            <div>
                <Label className="text-xs">Opacidade: {Math.round(opacity * 100)}%</Label>
                <Slider
                    value={[opacity * 100]}
                    onValueChange={([value]) => onUpdate({ opacity: value / 100 })}
                    min={0}
                    max={100}
                    step={1}
                />
            </div>
        </div>
    );
});
