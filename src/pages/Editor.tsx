import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Header } from '@/components/editor/Header';
import { ElementsSidebar } from '@/components/editor/ElementsSidebar';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { DataPanel } from '@/components/editor/DataPanel';
import { LabelCanvas } from '@/components/editor/LabelCanvas';
import { SheetPreview } from '@/components/editor/SheetPreview';
import { ExportDialog } from '@/components/editor/ExportDialog';
import { GenerateLayoutModal } from '@/components/editor/GenerateLayoutModal';
import { LayersPanel } from '@/components/editor/LayersPanel';
import { AlignmentPanel } from '@/components/editor/AlignmentPanel';
import { Database, LayoutTemplate, Save, Check } from 'lucide-react';
import { useOSStore } from '@/store/osStore';
import { useLabelStore } from '@/store/labelStore';
import { toast } from 'sonner';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from '@/components/editor/KeyboardShortcutsHelp';
import { PAPER_SIZES } from '@/types/label';

const Editor = () => {
  const { osId } = useParams<{ osId: string }>();
  const navigate = useNavigate();
  const { getOS, updateOS, saveOSElements } = useOSStore();
  const { elements, setSheetConfig, lockSheetConfig, resetToDefault, loadElements } = useLabelStore();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [generateLayoutOpen, setGenerateLayoutOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('props');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (!osId) {
      navigate('/');
      return;
    }

    const os = getOS(osId);
    if (!os) {
      toast.error('O.S não encontrada');
      navigate('/');
      return;
    }

    // Resetar para limpar elementos de outras O.S
    resetToDefault();

    // Carregar configurações da O.S se existirem
    if (os.config) {
      const paper = os.config.paperSize ? PAPER_SIZES[os.config.paperSize] : null;
      // Usar force=true para permitir a configuração inicial mesmo que esteja bloqueada
      setSheetConfig({
        paperSize: os.config.paperSize || 'A4',
        customWidth: paper?.width ?? 210,
        customHeight: paper?.height ?? 297,
        labelWidth: os.config.labelWidth ?? 50,
        labelHeight: os.config.labelHeight ?? 30,
        columns: os.config.columns ?? 4,
        rows: os.config.rows ?? 8,
        marginTop: os.config.marginTop ?? 10,
        marginBottom: os.config.marginBottom ?? 10,
        marginLeft: os.config.marginLeft ?? 10,
        marginRight: os.config.marginRight ?? 10,
        spacingHorizontal: os.config.spacingHorizontal ?? 2,
        spacingVertical: os.config.spacingVertical ?? 2,
        autoCalculate: false, // Desabilitar auto-cálculo para manter as configurações da O.S
      }, true);

      // Bloquear as configurações para evitar edições acidentais
      lockSheetConfig();
    }

    // Carregar elementos salvos desta O.S com um pequeno delay
    // para garantir que o reset completou
    setTimeout(() => {
      if (os.elements && os.elements.length > 0) {
        // Restaurar elementos da O.S usando loadElements
        loadElements(os.elements);
      }
      setIsInitialized(true);
    }, 100);
  }, [osId, getOS, navigate, setSheetConfig, lockSheetConfig, resetToDefault, loadElements]);

  // Auto-save: Salvar elementos automaticamente quando houver mudanças
  useEffect(() => {
    if (!osId || !isInitialized) return;

    // Limpar timeout anterior
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Criar novo timeout para salvar após 1 segundo de inatividade
    saveTimeoutRef.current = setTimeout(() => {
      setIsSaving(true);

      // Salvar elementos específicos desta O.S
      saveOSElements(osId, elements);

      setLastSaved(new Date());
      setIsSaving(false);
    }, 1000);

    // Cleanup
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [elements, osId, saveOSElements, isInitialized]);

  // Keyboard shortcuts
  useKeyboardShortcuts({
    onSave: () => {
      if (osId) {
        saveOSElements(osId, elements);
        toast.success('Salvo manualmente');
      }
    },
    onExport: () => setExportDialogOpen(true),
  });

  const handleBack = () => {
    navigate('/');
  };

  if (!osId) {
    return null;
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header
        onExport={() => setExportDialogOpen(true)}
        onSaveTemplate={() => { }}
        onLoadTemplate={() => { }}
        onGenerateLayout={() => setGenerateLayoutOpen(true)}
        onBack={handleBack}
        isSaving={isSaving}
        lastSaved={lastSaved}
      />

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Elements */}
        <ElementsSidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <ResizablePanelGroup direction="horizontal" className="flex-1">
            {/* Canvas Area */}
            <ResizablePanel defaultSize={60} minSize={40}>
              <div className="flex flex-col h-full">
                <div className="border-b border-border px-4 py-2 bg-card">
                  <h3 className="text-sm font-medium">Editor da Etiqueta</h3>
                  <p className="text-xs text-muted-foreground">Arraste e edite os elementos</p>
                </div>
                <LabelCanvas />
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            {/* Sheet Preview */}
            <ResizablePanel defaultSize={40} minSize={20} maxSize={60}>
              <div className="h-full flex flex-col bg-card">
                <SheetPreview />
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>

        {/* Right Sidebar - Config & Properties */}
        <div className="w-80 border-l border-border flex flex-col bg-card h-full overflow-hidden">
          {/* Tabs superiores - Props e Dados */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="m-2 grid grid-cols-2 flex-shrink-0">
              <TabsTrigger value="props" className="text-xs gap-1">
                <LayoutTemplate className="h-3 w-3" />
                Props
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs gap-1">
                <Database className="h-3 w-3" />
                Dados
              </TabsTrigger>
            </TabsList>

            {/* Conteúdo das tabs superiores */}
            <div className="flex-1 overflow-hidden min-h-0">
              <TabsContent value="props" className="m-0 p-0 h-full overflow-hidden">
                <PropertiesPanel />
              </TabsContent>
              <TabsContent value="data" className="m-0 p-3 h-full overflow-auto">
                <DataPanel />
              </TabsContent>
            </div>
          </Tabs>

          {/* Painéis inferiores - Camadas e Alinhamento */}
          <div className="border-t border-border flex-shrink-0">
            <Tabs defaultValue="layers" className="w-full">
              <TabsList className="w-full grid grid-cols-2 rounded-none h-9">
                <TabsTrigger value="layers" className="text-xs">
                  Camadas
                </TabsTrigger>
                <TabsTrigger value="alignment" className="text-xs">
                  Alinhamento
                </TabsTrigger>
              </TabsList>

              <div className="h-64 overflow-hidden">
                <TabsContent value="layers" className="m-0 h-full">
                  <LayersPanel />
                </TabsContent>
                <TabsContent value="alignment" className="m-0 h-full overflow-auto">
                  <AlignmentPanel />
                </TabsContent>
              </div>
            </Tabs>
          </div>
        </div>
      </div>

      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
      {osId && (
        <GenerateLayoutModal
          open={generateLayoutOpen}
          onOpenChange={setGenerateLayoutOpen}
          osId={osId}
        />
      )}
    </div>
  );
};

export default Editor;

