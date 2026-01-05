import { useState, useEffect } from 'react';
import { MousePointer2, Move, Trash2, Copy, Layers, X } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

const HINTS_STORAGE_KEY = 'etiquetapro-hide-hints';

interface CanvasHintsProps {
    show?: boolean;
    onClose?: () => void;
}

export function CanvasHints({ show, onClose }: CanvasHintsProps = {}) {
    const [isVisible, setIsVisible] = useState(true);
    const [dontShowAgain, setDontShowAgain] = useState(false);

    // Verificar se o usuário escolheu não exibir novamente
    useEffect(() => {
        const hideHints = localStorage.getItem(HINTS_STORAGE_KEY);
        if (hideHints === 'true') {
            setIsVisible(false);
        }
    }, []);

    // Controle externo via prop 'show'
    useEffect(() => {
        if (show !== undefined) {
            setIsVisible(show);
        }
    }, [show]);

    const handleClose = () => {
        if (dontShowAgain) {
            localStorage.setItem(HINTS_STORAGE_KEY, 'true');
        }
        setIsVisible(false);
        onClose?.();
    };

    if (!isVisible) {
        return null;
    }

    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-50">
            <Card className="relative p-6 max-w-md bg-white dark:bg-gray-950 shadow-2xl border-2 pointer-events-auto">
                {/* Botão de fechar */}
                <Button
                    variant="ghost"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full hover:bg-muted"
                    onClick={handleClose}
                >
                    <X className="h-4 w-4" />
                </Button>

                <h3 className="font-semibold text-lg mb-4 text-center pr-8">
                    💡 Dicas do Editor
                </h3>

                <div className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                            <MousePointer2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">Adicionar Elementos</p>
                            <p className="text-muted-foreground text-xs">
                                Use a barra lateral esquerda para adicionar textos, QR codes, códigos de barras e formas
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                            <Move className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">Mover e Redimensionar</p>
                            <p className="text-muted-foreground text-xs">
                                Arraste elementos para mover • Segure <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift</kbd> ao mover para ativar snap magnético
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                            <Layers className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">Seleção Múltipla</p>
                            <p className="text-muted-foreground text-xs">
                                Segure <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift</kbd> ou <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl</kbd> + Clique para selecionar múltiplos elementos
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                            <Copy className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">Atalhos Úteis</p>
                            <p className="text-muted-foreground text-xs">
                                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Z</kbd> Desfazer •{' '}
                                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Ctrl+Y</kbd> Refazer •{' '}
                                <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Del</kbd> Excluir
                            </p>
                        </div>
                    </div>

                    <div className="flex items-start gap-3">
                        <div className="bg-primary/10 rounded-full p-2 flex-shrink-0">
                            <Trash2 className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <p className="font-medium">Réguas e Guias</p>
                            <p className="text-muted-foreground text-xs">
                                As réguas mostram medidas em mm • Linhas vermelhas aparecem ao alinhar elementos
                            </p>
                        </div>
                    </div>
                </div>

                <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="dont-show-again"
                                checked={dontShowAgain}
                                onCheckedChange={(checked) => setDontShowAgain(checked as boolean)}
                            />
                            <Label
                                htmlFor="dont-show-again"
                                className="text-xs text-muted-foreground cursor-pointer"
                            >
                                Não exibir novamente
                            </Label>
                        </div>
                        <Button
                            onClick={handleClose}
                            size="sm"
                            className="h-8"
                        >
                            Entendi
                        </Button>
                    </div>
                </div>

                <div className="mt-3 text-center text-xs text-muted-foreground">
                    Pressione <kbd className="px-1 py-0.5 bg-muted rounded">?</kbd> para ver todos os atalhos
                </div>
            </Card>
        </div>
    );
}
