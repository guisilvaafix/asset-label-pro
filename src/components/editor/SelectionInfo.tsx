import { useEffect, useState } from 'react';
import { useLabelStore } from '@/store/labelStore';
import { LabelElement } from '@/types/label';
import { Badge } from '@/components/ui/badge';
import { Ruler, Move, RotateCw, Lock } from 'lucide-react';

export function SelectionInfo() {
    const { elements, selectedElementId, selectedElementIds } = useLabelStore();
    const [selectedElements, setSelectedElements] = useState<LabelElement[]>([]);

    useEffect(() => {
        if (selectedElementIds.length > 0) {
            const selected = elements.filter(el => selectedElementIds.includes(el.id));
            setSelectedElements(selected);
        } else if (selectedElementId) {
            const selected = elements.find(el => el.id === selectedElementId);
            setSelectedElements(selected ? [selected] : []);
        } else {
            setSelectedElements([]);
        }
    }, [selectedElementId, selectedElementIds, elements]);

    if (selectedElements.length === 0) return null;

    const isSingleSelection = selectedElements.length === 1;
    const element = selectedElements[0];

    return (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50 pointer-events-none">
            <div className="bg-background/95 backdrop-blur-sm border border-border rounded-lg shadow-lg px-4 py-2.5 pointer-events-auto">
                {isSingleSelection ? (
                    <div className="flex items-center gap-4 text-sm">
                        {/* Element Type */}
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">
                                {element.type === 'qrcode' ? 'QR Code' :
                                    element.type === 'barcode' ? 'Barcode' :
                                        element.type === 'datamatrix' ? 'Data Matrix' :
                                            element.type === 'pdf417' ? 'PDF417' :
                                                element.type}
                            </Badge>
                            {element.locked && (
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                            )}
                        </div>

                        {/* Position */}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Move className="h-3.5 w-3.5" />
                            <span className="font-mono text-xs">
                                X: {element.x.toFixed(1)}mm, Y: {element.y.toFixed(1)}mm
                            </span>
                        </div>

                        {/* Dimensions */}
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                            <Ruler className="h-3.5 w-3.5" />
                            <span className="font-mono text-xs">
                                {element.width.toFixed(1)} × {element.height.toFixed(1)}mm
                            </span>
                        </div>

                        {/* Rotation */}
                        {element.rotation !== 0 && (
                            <div className="flex items-center gap-1.5 text-muted-foreground">
                                <RotateCw className="h-3.5 w-3.5" />
                                <span className="font-mono text-xs">
                                    {element.rotation.toFixed(0)}°
                                </span>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="flex items-center gap-3 text-sm">
                        <Badge variant="secondary">
                            {selectedElements.length} elementos selecionados
                        </Badge>

                        <div className="text-muted-foreground text-xs">
                            Use Shift+Setas para mover • Delete para remover
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
