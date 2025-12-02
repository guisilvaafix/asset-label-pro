import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Header } from '@/components/editor/Header';
import { ElementsSidebar } from '@/components/editor/ElementsSidebar';
import { PropertiesPanel } from '@/components/editor/PropertiesPanel';
import { SheetConfigPanel } from '@/components/editor/SheetConfigPanel';
import { DataPanel } from '@/components/editor/DataPanel';
import { LabelCanvas } from '@/components/editor/LabelCanvas';
import { SheetPreview } from '@/components/editor/SheetPreview';
import { ExportDialog } from '@/components/editor/ExportDialog';
import { Settings, Database, LayoutTemplate } from 'lucide-react';

const Index = () => {
  const [exportDialogOpen, setExportDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('config');

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      <Header 
        onExport={() => setExportDialogOpen(true)}
        onSaveTemplate={() => {}}
        onLoadTemplate={() => {}}
      />
      
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar - Elements */}
        <ElementsSidebar />
        
        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1 flex overflow-hidden">
            {/* Canvas Area */}
            <div className="flex-1 flex flex-col">
              <div className="border-b border-border px-4 py-2 bg-card">
                <h3 className="text-sm font-medium">Editor da Etiqueta</h3>
                <p className="text-xs text-muted-foreground">Arraste e edite os elementos</p>
              </div>
              <LabelCanvas />
            </div>
            
            {/* Sheet Preview */}
            <div className="w-80 border-l border-border flex flex-col bg-card">
              <SheetPreview />
            </div>
          </div>
        </div>

        {/* Right Sidebar - Config & Properties */}
        <div className="w-80 border-l border-border flex flex-col bg-card">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
            <TabsList className="m-2 grid grid-cols-3">
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
            
            <ScrollArea className="flex-1">
              <TabsContent value="config" className="m-0 p-3">
                <SheetConfigPanel />
              </TabsContent>
              <TabsContent value="data" className="m-0 p-3">
                <DataPanel />
              </TabsContent>
              <TabsContent value="props" className="m-0 p-0">
                <PropertiesPanel />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>
      </div>

      <ExportDialog open={exportDialogOpen} onOpenChange={setExportDialogOpen} />
    </div>
  );
};

export default Index;
