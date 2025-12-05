import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Header } from '@/components/editor/Header';
import { ElementsSidebar } from '@/components/editor/ElementsSidebar';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { SheetConfigPanel } from '@/components/editor/SheetConfigPanel';
import { DataPanel } from '@/components/editor/DataPanel';
import { LabelCanvas } from '@/components/editor/LabelCanvas';
import { SheetPreview } from '@/components/editor/SheetPreview';
import { ExportDialog } from '@/components/editor/ExportDialog';
import { Settings, Database, LayoutTemplate } from 'lucide-react';
import { useOSStore } from '@/store/osStore';
import { useLabelStore } from '@/store/labelStore';
import { toast } from 'sonner';
import { PAPER_SIZES } from '@/types/label';

const Editor = () => {
  const { osId } = useParams<{ osId: string }>();
  const navigate = useNavigate();
  const { getOS } = useOSStore();
  const { setSheetConfig, resetToDefault } = useLabelStore();
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('config');

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

    // Carregar configurações da O.S se existirem
    if (os.config) {
      const paper = os.config.paperSize ? PAPER_SIZES[os.config.paperSize] : null;
      setSheetConfig({
        paperSize: os.config.paperSize || 'A4',
        customWidth: paper?.width || 210,
        customHeight: paper?.height || 297,
        labelWidth: os.config.labelWidth || 50,
        labelHeight: os.config.labelHeight || 30,
        columns: os.config.columns || 4,
        rows: os.config.rows || 8,
        autoCalculate: false, // Desabilitar auto-cálculo para manter as configurações da O.S
      });
    }
  }, [osId, getOS, navigate, setSheetConfig]);

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
        onSaveTemplate={() => {}}
        onLoadTemplate={() => {}}
        onBack={handleBack}
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="m-2 grid grid-cols-3 flex-shrink-0">
              <TabsTrigger value="config" className="text-xs gap-1">
                <Settings className="h-3 w-3" />
                Chapa
              </TabsTrigger>
              <TabsTrigger value="data" className="text-xs gap-1">
                <Database className="h-3 w-3" />
                Dados
              </TabsTrigger>
              <TabsTrigger value="props" className="text-xs gap-1">
                <LayoutTemplate className="h-3 w-3" />
                Props
              </TabsTrigger>
            </TabsList>
            
            <div className="flex-1 overflow-hidden">
              <TabsContent value="config" className="m-0 p-3 h-full overflow-auto">
                <SheetConfigPanel />
              </TabsContent>
              <TabsContent value="data" className="m-0 p-3 h-full overflow-auto">
                <DataPanel />
              </TabsContent>
              <TabsContent value="props" className="m-0 p-0 h-full overflow-hidden">
                <PropertiesPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>

      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
    </div>
  );
};

export default Editor;

