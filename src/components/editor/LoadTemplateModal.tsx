import { useMemo } from 'react';
import { FolderOpen, Trash2, Calendar, Layers, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { LabelThumbnail } from '@/components/os/LabelThumbnail';
import { useLabelStore } from '@/store/labelStore';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { useState } from 'react';

interface LoadTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function LoadTemplateModal({ open, onOpenChange }: LoadTemplateModalProps) {
    const { templates, loadTemplate, deleteTemplate, sheetConfig } = useLabelStore();
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [templateToDelete, setTemplateToDelete] = useState<string | null>(null);

    // Filtrar templates com as mesmas dimensões da etiqueta atual
    const compatibleTemplates = useMemo(() => {
        return templates.filter(
            (template) =>
                template.sheetConfig.labelWidth === sheetConfig.labelWidth &&
                template.sheetConfig.labelHeight === sheetConfig.labelHeight
        );
    }, [templates, sheetConfig.labelWidth, sheetConfig.labelHeight]);

    const handleLoadTemplate = (templateId: string) => {
        loadTemplate(templateId);
        toast.success('Template carregado com sucesso!');
        onOpenChange(false);
    };

    const handleDeleteClick = (e: React.MouseEvent, templateId: string) => {
        e.stopPropagation();
        setTemplateToDelete(templateId);
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        if (templateToDelete) {
            deleteTemplate(templateToDelete);
            toast.success('Template excluído com sucesso!');
            setTemplateToDelete(null);
            setDeleteDialogOpen(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={onOpenChange}>
                <DialogContent className="sm:max-w-[900px] max-h-[90vh] p-0">
                    <DialogHeader className="px-6 pt-6 pb-4 border-b">
                        <DialogTitle className="text-xl">Carregar Template</DialogTitle>
                        <DialogDescription className="text-sm">
                            Selecione um template compatível com as dimensões da etiqueta atual ({sheetConfig.labelWidth} × {sheetConfig.labelHeight} mm)
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="h-[600px] px-6 py-4">
                        {compatibleTemplates.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-20 text-center">
                                <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mb-6">
                                    <FolderOpen className="h-10 w-10 text-muted-foreground" />
                                </div>
                                <h3 className="text-xl font-semibold mb-3">Nenhum template compatível</h3>
                                <p className="text-sm text-muted-foreground max-w-md mb-6">
                                    Não há templates salvos com as dimensões {sheetConfig.labelWidth} × {sheetConfig.labelHeight} mm.
                                </p>
                                <div className="bg-muted/50 rounded-lg p-4 max-w-md">
                                    <p className="text-xs text-muted-foreground">
                                        💡 <strong>Dica:</strong> Crie um template para reutilizar este design em outras O.S com as mesmas dimensões.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {compatibleTemplates.map((template) => (
                                    <Card
                                        key={template.id}
                                        className="cursor-pointer hover:shadow-xl transition-all duration-200 hover:border-primary group overflow-hidden"
                                        onClick={() => handleLoadTemplate(template.id)}
                                    >
                                        <CardContent className="p-0">
                                            {/* Preview Section */}
                                            <div className="relative bg-gradient-to-br from-muted/30 to-muted/10 p-4 border-b">
                                                <div className="flex items-center justify-center">
                                                    <LabelThumbnail
                                                        elements={template.elements}
                                                        width={280}
                                                        height={160}
                                                        className="shadow-md"
                                                    />
                                                </div>

                                                {/* Badge de elementos */}
                                                <div className="absolute top-3 right-3">
                                                    <Badge variant="secondary" className="shadow-sm bg-background/90 backdrop-blur-sm">
                                                        <Layers className="h-3 w-3 mr-1" />
                                                        {template.elements.length}
                                                    </Badge>
                                                </div>

                                                {/* Botão de excluir */}
                                                <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <Button
                                                        variant="destructive"
                                                        size="icon"
                                                        className="h-8 w-8 shadow-lg"
                                                        onClick={(e) => handleDeleteClick(e, template.id)}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            {/* Info Section */}
                                            <div className="p-4 space-y-3">
                                                {/* Nome e Data */}
                                                <div>
                                                    <h3 className="font-semibold text-base mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                                                        {template.name}
                                                    </h3>
                                                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{format(new Date(template.createdAt), "dd/MM/yyyy 'às' HH:mm")}</span>
                                                    </div>
                                                </div>

                                                {/* Badges de informação */}
                                                <div className="flex flex-wrap gap-1.5">
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        📏 {template.sheetConfig.labelWidth}×{template.sheetConfig.labelHeight}mm
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        📄 {template.sheetConfig.paperSize}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-xs font-normal">
                                                        📊 {template.sheetConfig.columns}×{template.sheetConfig.rows}
                                                    </Badge>
                                                </div>

                                                {/* Tipos de elementos */}
                                                <div className="pt-2 border-t">
                                                    <p className="text-xs text-muted-foreground line-clamp-2">
                                                        <strong>Elementos:</strong>{' '}
                                                        {Array.from(new Set(template.elements.map(el => {
                                                            const typeNames: Record<string, string> = {
                                                                text: 'Texto',
                                                                image: 'Imagem',
                                                                qrcode: 'QR Code',
                                                                barcode: 'Código de Barras',
                                                                datamatrix: 'Data Matrix',
                                                                pdf417: 'PDF417',
                                                                rectangle: 'Retângulo',
                                                                circle: 'Círculo',
                                                                line: 'Linha'
                                                            };
                                                            return typeNames[el.type] || el.type;
                                                        }))).join(', ')}
                                                    </p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        )}
                    </ScrollArea>

                    {/* Footer com informações */}
                    {compatibleTemplates.length > 0 && (
                        <div className="px-6 py-4 border-t bg-muted/30">
                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    <span>
                                        {compatibleTemplates.length} {compatibleTemplates.length === 1 ? 'template disponível' : 'templates disponíveis'}
                                    </span>
                                </div>
                                <span>Clique em um template para carregar</span>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir este template? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
