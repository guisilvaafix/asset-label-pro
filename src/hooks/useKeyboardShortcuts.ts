import { useEffect } from 'react';
import { useLabelStore } from '@/store/labelStore';

interface KeyboardShortcutsOptions {
    onSave?: () => void;
    onExport?: () => void;
    enabled?: boolean;
}

/**
 * Hook para gerenciar atalhos de teclado no editor
 * 
 * Atalhos disponíveis:
 * - Ctrl+Z: Desfazer
 * - Ctrl+Y / Ctrl+Shift+Z: Refazer
 * - Ctrl+D: Duplicar elemento(s) selecionado(s)
 * - Delete: Remover elemento(s) selecionado(s)
 * - Arrow Keys: Mover elemento selecionado
 * - Ctrl+S: Salvar (customizável)
 * - Ctrl+E: Exportar (customizável)
 * 
 * Seleção múltipla:
 * - Shift+Click: Adicionar/remover elementos da seleção
 * - Arrastar área: Selecionar múltiplos elementos
 */
export function useKeyboardShortcuts(options: KeyboardShortcutsOptions = {}) {
    const { enabled = true, onSave, onExport } = options;

    const {
        selectedElementId,
        selectedElementIds,
        undo,
        redo,
        canUndo,
        canRedo,
        duplicateElement,
        duplicateElements,
        removeElement,
        removeElements,
        updateElement,
        elements,
    } = useLabelStore();

    useEffect(() => {
        if (!enabled) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            const target = e.target as HTMLElement;

            // Ignorar se estiver em input/textarea
            if (
                target.tagName === 'INPUT' ||
                target.tagName === 'TEXTAREA' ||
                target.isContentEditable
            ) {
                return;
            }

            const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
            const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

            // Ctrl+Z - Undo
            if (ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                if (canUndo) {
                    undo();
                }
                return;
            }

            // Ctrl+Y ou Ctrl+Shift+Z - Redo
            if (ctrlKey && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                e.preventDefault();
                if (canRedo) {
                    redo();
                }
                return;
            }

            // Ctrl+D - Duplicar elemento(s)
            if (ctrlKey && e.key === 'd') {
                e.preventDefault();
                if (selectedElementIds.length > 1) {
                    duplicateElements(selectedElementIds);
                } else if (selectedElementId) {
                    duplicateElement(selectedElementId);
                }
                return;
            }

            // Delete - Remover elemento(s)
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (selectedElementIds.length > 1 && !ctrlKey) {
                    e.preventDefault();
                    removeElements(selectedElementIds);
                } else if (selectedElementId && !ctrlKey) {
                    e.preventDefault();
                    removeElement(selectedElementId);
                }
                return;
            }

            // Ctrl+S - Salvar
            if (ctrlKey && e.key === 's') {
                e.preventDefault();
                if (onSave) {
                    onSave();
                }
                return;
            }

            // Ctrl+E - Exportar
            if (ctrlKey && e.key === 'e') {
                e.preventDefault();
                if (onExport) {
                    onExport();
                }
                return;
            }

            // Arrow Keys - Mover elemento
            if (selectedElementId && ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
                e.preventDefault();

                const element = elements.find(el => el.id === selectedElementId);
                if (!element) return;

                const step = e.shiftKey ? 10 : 1; // Shift = movimento maior
                let deltaX = 0;
                let deltaY = 0;

                switch (e.key) {
                    case 'ArrowUp':
                        deltaY = -step;
                        break;
                    case 'ArrowDown':
                        deltaY = step;
                        break;
                    case 'ArrowLeft':
                        deltaX = -step;
                        break;
                    case 'ArrowRight':
                        deltaX = step;
                        break;
                }

                updateElement(selectedElementId, {
                    x: Math.max(0, element.x + deltaX),
                    y: Math.max(0, element.y + deltaY),
                });
                return;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [
        enabled,
        selectedElementId,
        selectedElementIds,
        undo,
        redo,
        canUndo,
        canRedo,
        duplicateElement,
        duplicateElements,
        removeElement,
        removeElements,
        updateElement,
        elements,
        onSave,
        onExport,
    ]);
}
