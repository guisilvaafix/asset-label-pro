import { Keyboard } from 'lucide-react';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface Shortcut {
    keys: string[];
    description: string;
    category: string;
}

const shortcuts: Shortcut[] = [
    // Edição
    { keys: ['Ctrl', 'Z'], description: 'Desfazer', category: 'Edição' },
    { keys: ['Ctrl', 'Y'], description: 'Refazer', category: 'Edição' },
    { keys: ['Ctrl', 'D'], description: 'Duplicar elemento(s)', category: 'Edição' },
    { keys: ['Delete'], description: 'Remover elemento(s)', category: 'Edição' },

    // Seleção
    { keys: ['Shift', 'Click'], description: 'Adicionar à seleção', category: 'Seleção' },
    { keys: ['Arrastar'], description: 'Selecionar área', category: 'Seleção' },

    // Navegação
    { keys: ['←', '→', '↑', '↓'], description: 'Mover elemento (1mm)', category: 'Navegação' },
    { keys: ['Shift', '←', '→', '↑', '↓'], description: 'Mover elemento (5mm)', category: 'Navegação' },

    // Ações
    { keys: ['Ctrl', 'S'], description: 'Salvar', category: 'Ações' },
    { keys: ['Ctrl', 'E'], description: 'Exportar', category: 'Ações' },
];

const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0;

const formatKey = (key: string): string => {
    if (key === 'Ctrl' && isMac) return '⌘';
    if (key === 'Shift') return '⇧';
    if (key === 'Delete') return '⌫';
    return key;
};

export function KeyboardShortcutsHelp() {
    const categories = Array.from(new Set(shortcuts.map(s => s.category)));

    return (
        <Popover>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                    <Keyboard className="h-4 w-4" />
                    <span className="hidden sm:inline">Atalhos</span>
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Atalhos de Teclado</h4>
                        <p className="text-xs text-muted-foreground">
                            Use estes atalhos para trabalhar mais rápido
                        </p>
                    </div>

                    {categories.map((category, idx) => (
                        <div key={category}>
                            {idx > 0 && <Separator className="my-3" />}
                            <div className="space-y-2">
                                <h5 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                                    {category}
                                </h5>
                                {shortcuts
                                    .filter(s => s.category === category)
                                    .map((shortcut, i) => (
                                        <div
                                            key={i}
                                            className="flex items-center justify-between text-sm"
                                        >
                                            <span className="text-muted-foreground">
                                                {shortcut.description}
                                            </span>
                                            <div className="flex items-center gap-1">
                                                {shortcut.keys.map((key, j) => (
                                                    <kbd
                                                        key={j}
                                                        className="px-2 py-1 text-xs font-semibold text-foreground bg-muted border border-border rounded"
                                                    >
                                                        {formatKey(key)}
                                                    </kbd>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    ))}
                </div>
            </PopoverContent>
        </Popover>
    );
}
