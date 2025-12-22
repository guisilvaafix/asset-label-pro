import { MousePointer2, Move, Trash2, Copy, Layers } from 'lucide-react';
import { Card } from '@/components/ui/card';

export function CanvasHints() {
    return (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <Card className="p-6 max-w-md bg-background/95 backdrop-blur-sm shadow-lg pointer-events-auto">
                <h3 className="font-semibold text-lg mb-4 text-center">
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
                                Segure <kbd className="px-1 py-0.5 bg-muted rounded text-xs">Shift</kbd> + Clique para selecionar múltiplos elementos
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

                <div className="mt-4 pt-4 border-t border-border text-center text-xs text-muted-foreground">
                    Pressione <kbd className="px-1 py-0.5 bg-muted rounded">?</kbd> para ver todos os atalhos
                </div>
            </Card>
        </div>
    );
}
