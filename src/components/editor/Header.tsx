import {
  Save,
  FolderOpen,
  FileDown,
  Settings,
  Undo,
  Redo,
  ZoomIn,
  ZoomOut,
  LayoutGrid,
  Grid3X3,
  Magnet,
  ArrowLeft,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { useLabelStore } from '@/store/labelStore';
import { toast } from 'sonner';

interface HeaderProps {
  onExport: () => void;
  onSaveTemplate: () => void;
  onLoadTemplate: () => void;
  onGenerateLayout: () => void;
  onBack?: () => void;
  isSaving?: boolean;
  lastSaved?: Date | null;
}

export function Header({ onExport, onSaveTemplate, onLoadTemplate, onGenerateLayout, onBack, isSaving, lastSaved }: HeaderProps) {
  const {
    zoom,
    setZoom,
    showGrid,
    setShowGrid,
    snapToGrid,
    setSnapToGrid,
    resetToDefault
  } = useLabelStore();

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <LayoutGrid className="h-5 w-5 text-primary-foreground" />
          </div>
          <span className="font-bold text-lg">FinalPrint</span>
        </div>

        <div className="h-6 w-px bg-border mx-2" />

        {onBack && (
          <>
            <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Voltar
            </Button>
            <div className="h-6 w-px bg-border mx-2" />
          </>
        )}

        {/* Auto-save indicator */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {isSaving ? (
            <>
              <Save className="h-3 w-3 animate-pulse" />
              <span>Salvando...</span>
            </>
          ) : lastSaved ? (
            <>
              <Save className="h-3 w-3 text-green-600" />
              <span className="text-green-600">Salvo automaticamente</span>
            </>
          ) : null}
        </div>

        <div className="h-6 w-px bg-border mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Arquivo
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={onSaveTemplate}>
              <Save className="mr-2 h-4 w-4" />
              Salvar Template
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onLoadTemplate}>
              <FolderOpen className="mr-2 h-4 w-4" />
              Carregar Template
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onExport}>
              <FileDown className="mr-2 h-4 w-4" />
              Exportar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => {
              resetToDefault();
              toast.success('Projeto resetado para o padrão');
            }}>
              <Settings className="mr-2 h-4 w-4" />
              Resetar para Padrão
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <Toggle
            pressed={showGrid}
            onPressedChange={setShowGrid}
            size="sm"
            aria-label="Mostrar grid"
          >
            <Grid3X3 className="h-4 w-4" />
          </Toggle>
          <Toggle
            pressed={snapToGrid}
            onPressedChange={setSnapToGrid}
            size="sm"
            aria-label="Snap to grid"
          >
            <Magnet className="h-4 w-4" />
          </Toggle>
        </div>

        <div className="h-6 w-px bg-border" />

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(zoom - 10)}
            disabled={zoom <= 10}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <div className="w-24">
            <Slider
              value={[zoom]}
              onValueChange={([value]) => setZoom(value)}
              min={10}
              max={500}
              step={10}
            />
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setZoom(zoom + 10)}
            disabled={zoom >= 500}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <span className="text-sm text-muted-foreground w-12">{zoom}%</span>
        </div>

        <div className="h-6 w-px bg-border" />

        <Button onClick={onGenerateLayout} variant="outline" className="gap-2">
          <FileText className="h-4 w-4" />
          Gerar Layout
        </Button>

        <Button onClick={onExport} className="gap-2">
          <FileDown className="h-4 w-4" />
          Exportar
        </Button>
      </div>
    </header>
  );
}
