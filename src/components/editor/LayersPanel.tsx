import { useLabelStore } from '@/store/labelStore';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useState } from 'react';
import {
    Eye,
    EyeOff,
    Lock,
    Unlock,
    Trash2,
    Copy,
    Type,
    Square,
    Circle as CircleIcon,
    Minus,
    QrCode,
    Barcode,
    Image as ImageIcon,
    FileText,
    GripVertical,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function LayersPanel() {
    const {
        elements,
        selectedElementId,
        selectedElementIds,
        setSelectedElement,
        updateElement,
        removeElement,
        duplicateElement,
        moveElementLayer,
    } = useLabelStore();

    const [draggedId, setDraggedId] = useState<string | null>(null);
    const [dragOverId, setDragOverId] = useState<string | null>(null);

    // Ordenar elementos por zIndex (do maior para o menor - topo para base)
    const sortedElements = [...elements].sort((a, b) => b.zIndex - a.zIndex);

    const handleLayerClick = (id: string, e: React.MouseEvent) => {
        if (e.shiftKey) {
            // Shift+Click para seleção múltipla será tratado pelo canvas
            return;
        }
        setSelectedElement(id);
    };

    const toggleVisibility = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const element = elements.find(el => el.id === id);
        if (element) {
            updateElement(id, { opacity: element.opacity === 0 ? 1 : 0 });
        }
    };

    const toggleLock = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        const element = elements.find(el => el.id === id);
        if (element) {
            updateElement(id, { locked: !element.locked });
        }
    };

    const handleDelete = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        removeElement(id);
    };

    const handleDuplicate = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        duplicateElement(id);
    };

    // Drag and Drop handlers
    const handleDragStart = (e: React.DragEvent, id: string) => {
        setDraggedId(id);
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/html', id);
    };

    const handleDragOver = (e: React.DragEvent, id: string) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';

        if (draggedId && draggedId !== id) {
            setDragOverId(id);
        }
    };

    const handleDragLeave = () => {
        setDragOverId(null);
    };

    const handleDrop = (e: React.DragEvent, targetId: string) => {
        e.preventDefault();

        if (!draggedId || draggedId === targetId) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        const draggedElement = elements.find(el => el.id === draggedId);
        const targetElement = elements.find(el => el.id === targetId);

        if (!draggedElement || !targetElement) {
            setDraggedId(null);
            setDragOverId(null);
            return;
        }

        // Trocar os zIndex dos elementos
        const draggedZIndex = draggedElement.zIndex;
        const targetZIndex = targetElement.zIndex;

        updateElement(draggedId, { zIndex: targetZIndex });
        updateElement(targetId, { zIndex: draggedZIndex });

        setDraggedId(null);
        setDragOverId(null);
    };

    const handleDragEnd = () => {
        setDraggedId(null);
        setDragOverId(null);
    };

    const getElementIcon = (type: string) => {
        const iconClass = "h-4 w-4";

        switch (type) {
            case 'text':
                return <Type className={cn(iconClass, "text-blue-500")} />;
            case 'rectangle':
                return <Square className={cn(iconClass, "text-purple-500")} />;
            case 'circle':
                return <CircleIcon className={cn(iconClass, "text-pink-500")} />;
            case 'line':
                return <Minus className={cn(iconClass, "text-gray-500")} />;
            case 'qrcode':
                return <QrCode className={cn(iconClass, "text-green-500")} />;
            case 'barcode':
            case 'datamatrix':
            case 'pdf417':
                return <Barcode className={cn(iconClass, "text-orange-500")} />;
            case 'image':
                return <ImageIcon className={cn(iconClass, "text-cyan-500")} />;
            default:
                return <FileText className={cn(iconClass, "text-gray-400")} />;
        }
    };

    const getElementName = (element: any) => {
        if (element.text) return element.text.substring(0, 20);
        if (element.qrValue) return `QR: ${element.qrValue.substring(0, 15)}`;
        if (element.barcodeValue) return `Barcode: ${element.barcodeValue.substring(0, 15)}`;
        return element.type.charAt(0).toUpperCase() + element.type.slice(1);
    };

    if (elements.length === 0) {
        return (
            <div className="p-4 text-center text-sm text-muted-foreground">
                Nenhuma camada ainda
            </div>
        );
    }

    return (
        <ScrollArea className="h-full">
            <div className="p-2 space-y-1">
                {sortedElements.map((element, index) => {
                    const isSelected = selectedElementId === element.id || selectedElementIds.includes(element.id);
                    const isVisible = element.opacity !== 0;
                    const isLocked = element.locked;
                    const isDragging = draggedId === element.id;
                    const isDragOver = dragOverId === element.id;

                    return (
                        <div
                            key={element.id}
                            draggable={!isLocked}
                            onDragStart={(e) => handleDragStart(e, element.id)}
                            onDragOver={(e) => handleDragOver(e, element.id)}
                            onDragLeave={handleDragLeave}
                            onDrop={(e) => handleDrop(e, element.id)}
                            onDragEnd={handleDragEnd}
                            onClick={(e) => handleLayerClick(element.id, e)}
                            className={cn(
                                "group flex items-center gap-2 p-2 rounded-md cursor-pointer transition-all",
                                isSelected
                                    ? "bg-primary/10 border border-primary/30"
                                    : "hover:bg-muted border border-transparent",
                                isDragging && "opacity-50 scale-95",
                                isDragOver && "border-primary border-2 bg-primary/5"
                            )}
                        >
                            {/* Handle de arrasto */}
                            <div className={cn(
                                "flex-shrink-0 cursor-grab active:cursor-grabbing",
                                isLocked && "opacity-30 cursor-not-allowed"
                            )}>
                                <GripVertical className="h-4 w-4 text-muted-foreground" />
                            </div>

                            {/* Ícone do tipo */}
                            <div className="flex-shrink-0 flex items-center justify-center w-8 h-8 rounded bg-muted/50">
                                {getElementIcon(element.type)}
                            </div>

                            {/* Nome da camada */}
                            <div className="flex-1 min-w-0">
                                <div className="text-sm font-medium truncate">
                                    {getElementName(element)}
                                </div>
                                <div className="text-xs text-muted-foreground">
                                    Camada {elements.length - index}
                                </div>
                            </div>

                            {/* Todos os controles - sempre visíveis */}
                            <div className="flex items-center gap-0.5 flex-shrink-0">
                                {/* Visibilidade */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => toggleVisibility(element.id, e)}
                                    title={isVisible ? "Ocultar" : "Mostrar"}
                                >
                                    {isVisible ? (
                                        <Eye className="h-3 w-3" />
                                    ) : (
                                        <EyeOff className="h-3 w-3 text-muted-foreground" />
                                    )}
                                </Button>

                                {/* Lock */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => toggleLock(element.id, e)}
                                    title={isLocked ? "Desbloquear" : "Bloquear"}
                                >
                                    {isLocked ? (
                                        <Lock className="h-3 w-3 text-muted-foreground" />
                                    ) : (
                                        <Unlock className="h-3 w-3" />
                                    )}
                                </Button>

                                {/* Duplicar */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={(e) => handleDuplicate(element.id, e)}
                                    title="Duplicar"
                                >
                                    <Copy className="h-3 w-3" />
                                </Button>

                                {/* Deletar */}
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-destructive hover:text-destructive"
                                    onClick={(e) => handleDelete(element.id, e)}
                                    title="Deletar"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        </div>
                    );
                })}
            </div>
        </ScrollArea>
    );
}
