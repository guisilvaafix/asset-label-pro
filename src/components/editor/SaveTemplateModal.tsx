import { useState } from 'react';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLabelStore } from '@/store/labelStore';
import { toast } from 'sonner';

interface SaveTemplateModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SaveTemplateModal({ open, onOpenChange }: SaveTemplateModalProps) {
    const [templateName, setTemplateName] = useState('');
    const { saveTemplate, sheetConfig } = useLabelStore();

    const handleSave = () => {
        // Se não digitou nome, gera automaticamente com as medidas
        const finalName = templateName.trim() ||
            `Template ${sheetConfig.labelWidth}×${sheetConfig.labelHeight}mm`;

        saveTemplate(finalName);
        toast.success('Template salvo com sucesso!');
        setTemplateName('');
        onOpenChange(false);
    };

    const handleCancel = () => {
        setTemplateName('');
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Salvar Template</DialogTitle>
                    <DialogDescription>
                        Salve o design atual como um template para reutilizar em outras O.S com as mesmas dimensões.
                    </DialogDescription>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="template-name">
                            Nome do Template <span className="text-muted-foreground text-xs">(opcional)</span>
                        </Label>
                        <Input
                            id="template-name"
                            placeholder={`Template ${sheetConfig.labelWidth}×${sheetConfig.labelHeight}mm`}
                            value={templateName}
                            onChange={(e) => setTemplateName(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleSave();
                                }
                            }}
                        />
                        <p className="text-xs text-muted-foreground">
                            Se deixar em branco, será salvo como "Template {sheetConfig.labelWidth}×{sheetConfig.labelHeight}mm"
                        </p>
                    </div>

                    <div className="rounded-lg border border-border bg-muted/50 p-3">
                        <p className="text-sm font-medium mb-2">Informações do Template:</p>
                        <div className="text-xs text-muted-foreground space-y-1">
                            <p>• Dimensões da etiqueta: {sheetConfig.labelWidth} × {sheetConfig.labelHeight} mm</p>
                            <p>• Tamanho do papel: {sheetConfig.paperSize}</p>
                            <p>• Layout: {sheetConfig.columns} × {sheetConfig.rows}</p>
                        </div>
                    </div>
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={handleCancel}>
                        Cancelar
                    </Button>
                    <Button onClick={handleSave} className="gap-2">
                        <Save className="h-4 w-4" />
                        Salvar Template
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
