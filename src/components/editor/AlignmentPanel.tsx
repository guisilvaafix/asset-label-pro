import { useLabelStore } from '@/store/labelStore';
import { Button } from '@/components/ui/button';
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignVerticalJustifyCenter,
    AlignHorizontalJustifyCenter,
    AlignVerticalJustifyStart,
    AlignVerticalJustifyEnd,
    AlignHorizontalJustifyStart,
    AlignHorizontalJustifyEnd,
} from 'lucide-react';
import { Separator } from '@/components/ui/separator';

export function AlignmentPanel() {
    const {
        elements,
        selectedElementId,
        selectedElementIds,
        updateElement,
        updateElements,
        sheetConfig,
    } = useLabelStore();

    const selectedElements = elements.filter(el =>
        selectedElementIds.includes(el.id) || el.id === selectedElementId
    );

    const hasSelection = selectedElements.length > 0;
    const hasMultipleSelection = selectedElements.length > 1;

    const alignLeft = () => {
        if (!hasSelection) return;

        if (hasMultipleSelection) {
            const minX = Math.min(...selectedElements.map(el => el.x));
            const updates = selectedElements.map(el => el.id);
            updateElements(updates, { x: minX });
        } else {
            updateElement(selectedElements[0].id, { x: 0 });
        }
    };

    const alignCenter = () => {
        if (!hasSelection) return;

        if (hasMultipleSelection) {
            const minX = Math.min(...selectedElements.map(el => el.x));
            const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
            const centerX = (minX + maxX) / 2;

            selectedElements.forEach(el => {
                updateElement(el.id, { x: centerX - el.width / 2 });
            });
        } else {
            const centerX = sheetConfig.labelWidth / 2;
            updateElement(selectedElements[0].id, {
                x: centerX - selectedElements[0].width / 2
            });
        }
    };

    const alignRight = () => {
        if (!hasSelection) return;

        if (hasMultipleSelection) {
            const maxX = Math.max(...selectedElements.map(el => el.x + el.width));
            selectedElements.forEach(el => {
                updateElement(el.id, { x: maxX - el.width });
            });
        } else {
            updateElement(selectedElements[0].id, {
                x: sheetConfig.labelWidth - selectedElements[0].width
            });
        }
    };

    const alignTop = () => {
        if (!hasSelection) return;

        if (hasMultipleSelection) {
            const minY = Math.min(...selectedElements.map(el => el.y));
            const updates = selectedElements.map(el => el.id);
            updateElements(updates, { y: minY });
        } else {
            updateElement(selectedElements[0].id, { y: 0 });
        }
    };

    const alignMiddle = () => {
        if (!hasSelection) return;

        if (hasMultipleSelection) {
            const minY = Math.min(...selectedElements.map(el => el.y));
            const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
            const centerY = (minY + maxY) / 2;

            selectedElements.forEach(el => {
                updateElement(el.id, { y: centerY - el.height / 2 });
            });
        } else {
            const centerY = sheetConfig.labelHeight / 2;
            updateElement(selectedElements[0].id, {
                y: centerY - selectedElements[0].height / 2
            });
        }
    };

    const alignBottom = () => {
        if (!hasSelection) return;

        if (hasMultipleSelection) {
            const maxY = Math.max(...selectedElements.map(el => el.y + el.height));
            selectedElements.forEach(el => {
                updateElement(el.id, { y: maxY - el.height });
            });
        } else {
            updateElement(selectedElements[0].id, {
                y: sheetConfig.labelHeight - selectedElements[0].height
            });
        }
    };

    const distributeHorizontally = () => {
        if (selectedElements.length < 3) return;

        const sorted = [...selectedElements].sort((a, b) => a.x - b.x);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalSpace = (last.x + last.width) - first.x;
        const totalWidth = sorted.reduce((sum, el) => sum + el.width, 0);
        const spacing = (totalSpace - totalWidth) / (sorted.length - 1);

        let currentX = first.x + first.width + spacing;
        for (let i = 1; i < sorted.length - 1; i++) {
            updateElement(sorted[i].id, { x: currentX });
            currentX += sorted[i].width + spacing;
        }
    };

    const distributeVertically = () => {
        if (selectedElements.length < 3) return;

        const sorted = [...selectedElements].sort((a, b) => a.y - b.y);
        const first = sorted[0];
        const last = sorted[sorted.length - 1];
        const totalSpace = (last.y + last.height) - first.y;
        const totalHeight = sorted.reduce((sum, el) => sum + el.height, 0);
        const spacing = (totalSpace - totalHeight) / (sorted.length - 1);

        let currentY = first.y + first.height + spacing;
        for (let i = 1; i < sorted.length - 1; i++) {
            updateElement(sorted[i].id, { y: currentY });
            currentY += sorted[i].height + spacing;
        }
    };

    return (
        <div className="p-3 space-y-3">
            {/* Alinhamento Horizontal */}
            <div>
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                    Alinhamento Horizontal
                </h4>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={alignLeft}
                        disabled={!hasSelection}
                        title="Alinhar à esquerda"
                    >
                        <AlignHorizontalJustifyStart className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={alignCenter}
                        disabled={!hasSelection}
                        title="Centralizar horizontalmente"
                    >
                        <AlignHorizontalJustifyCenter className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={alignRight}
                        disabled={!hasSelection}
                        title="Alinhar à direita"
                    >
                        <AlignHorizontalJustifyEnd className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Separator />

            {/* Alinhamento Vertical */}
            <div>
                <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                    Alinhamento Vertical
                </h4>
                <div className="flex gap-1">
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={alignTop}
                        disabled={!hasSelection}
                        title="Alinhar ao topo"
                    >
                        <AlignVerticalJustifyStart className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={alignMiddle}
                        disabled={!hasSelection}
                        title="Centralizar verticalmente"
                    >
                        <AlignVerticalJustifyCenter className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={alignBottom}
                        disabled={!hasSelection}
                        title="Alinhar à base"
                    >
                        <AlignVerticalJustifyEnd className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {hasMultipleSelection && selectedElements.length >= 3 && (
                <>
                    <Separator />

                    {/* Distribuição */}
                    <div>
                        <h4 className="text-xs font-semibold mb-2 text-muted-foreground">
                            Distribuição
                        </h4>
                        <div className="flex gap-1">
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={distributeHorizontally}
                                title="Distribuir horizontalmente"
                            >
                                <AlignLeft className="h-4 w-4 mr-1" />
                                <span className="text-xs">Horizontal</span>
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                onClick={distributeVertically}
                                title="Distribuir verticalmente"
                            >
                                <AlignVerticalJustifyCenter className="h-4 w-4 mr-1" />
                                <span className="text-xs">Vertical</span>
                            </Button>
                        </div>
                    </div>
                </>
            )}

            {!hasSelection && (
                <div className="text-xs text-center text-muted-foreground py-4">
                    Selecione um ou mais elementos para alinhar
                </div>
            )}
        </div>
    );
}
