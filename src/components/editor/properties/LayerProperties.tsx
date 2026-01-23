import { memo } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ChevronUp, ChevronDown, ChevronsUp, ChevronsDown } from 'lucide-react';

interface LayerPropertiesProps {
    onMoveLayer: (direction: 'up' | 'down' | 'top' | 'bottom') => void;
}

export const LayerProperties = memo(function LayerProperties({ onMoveLayer }: LayerPropertiesProps) {
    return (
        <div className="space-y-2">
            <Label className="text-xs">Ordem de Camada</Label>
            <div className="flex gap-1">
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onMoveLayer('top')}
                >
                    <ChevronsUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onMoveLayer('up')}
                >
                    <ChevronUp className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onMoveLayer('down')}
                >
                    <ChevronDown className="h-4 w-4" />
                </Button>
                <Button
                    variant="outline"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => onMoveLayer('bottom')}
                >
                    <ChevronsDown className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
});
