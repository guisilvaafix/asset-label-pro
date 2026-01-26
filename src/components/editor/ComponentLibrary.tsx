import { useState } from 'react';
import { useLabelStore } from '@/store/labelStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Save,
    Trash2,
    Search,
    Plus,
    FolderPlus,
    Image,
    Type,
    QrCode,
    Shapes,
    LayoutTemplate,
    Folder,
} from 'lucide-react';
import { COMPONENT_CATEGORIES, ComponentCategory } from '@/types/label';
import { toast } from 'sonner';

const CATEGORY_ICONS: Record<string, any> = {
    Image,
    Type,
    QrCode,
    Shapes,
    LayoutTemplate,
    Folder,
};

export function ComponentLibrary() {
    const {
        componentLibrary,
        selectedElementIds,
        saveAsComponent,
        loadComponent,
        deleteComponent,
        searchComponents,
        filterComponentsByCategory,
    } = useLabelStore();

    const [saveDialogOpen, setSaveDialogOpen] = useState(false);
    const [componentName, setComponentName] = useState('');
    const [componentCategory, setComponentCategory] = useState<ComponentCategory>('outros');
    const [componentTags, setComponentTags] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<ComponentCategory | 'all'>('all');

    const handleSaveComponent = () => {
        if (!componentName.trim()) {
            toast.error('Digite um nome para o componente');
            return;
        }

        if (selectedElementIds.length === 0) {
            toast.error('Selecione pelo menos um elemento');
            return;
        }

        const tags = componentTags
            .split(',')
            .map(tag => tag.trim())
            .filter(tag => tag.length > 0);

        saveAsComponent(componentName, componentCategory, selectedElementIds, tags);
        toast.success(`Componente "${componentName}" salvo!`);

        // Reset form
        setComponentName('');
        setComponentTags('');
        setSaveDialogOpen(false);
    };

    const handleLoadComponent = (componentId: string) => {
        loadComponent(componentId);
        const component = componentLibrary.find(c => c.id === componentId);
        toast.success(`Componente "${component?.name}" adicionado ao canvas`);
    };

    const handleDeleteComponent = (componentId: string, componentName: string) => {
        if (confirm(`Deseja realmente excluir o componente "${componentName}"?`)) {
            deleteComponent(componentId);
            toast.success('Componente excluído');
        }
    };

    // Filtrar componentes
    const filteredComponents = (() => {
        let components = componentLibrary;

        // Filtrar por categoria
        if (selectedCategory !== 'all') {
            components = filterComponentsByCategory(selectedCategory);
        }

        // Filtrar por pesquisa
        if (searchQuery.trim()) {
            components = searchComponents(searchQuery);
        }

        return components;
    })();

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="p-4 border-b border-border flex-shrink-0">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="font-semibold text-sm">Biblioteca de Componentes</h2>
                    <Button
                        size="sm"
                        onClick={() => setSaveDialogOpen(true)}
                        disabled={selectedElementIds.length === 0}
                        className="gap-2"
                    >
                        <FolderPlus className="h-4 w-4" />
                        Salvar
                    </Button>
                </div>

                {/* Search */}
                <div className="relative mb-3">
                    <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Pesquisar componentes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-8 h-8"
                    />
                </div>

                {/* Category Filter */}
                <div className="flex gap-1 flex-wrap">
                    <Button
                        variant={selectedCategory === 'all' ? 'default' : 'outline'}
                        size="sm"
                        className="h-7 text-xs"
                        onClick={() => setSelectedCategory('all')}
                    >
                        Todos ({componentLibrary.length})
                    </Button>
                    {COMPONENT_CATEGORIES.map((cat) => {
                        const Icon = CATEGORY_ICONS[cat.icon];
                        const count = filterComponentsByCategory(cat.value).length;

                        return (
                            <Button
                                key={cat.value}
                                variant={selectedCategory === cat.value ? 'default' : 'outline'}
                                size="sm"
                                className="h-7 text-xs gap-1"
                                onClick={() => setSelectedCategory(cat.value)}
                            >
                                <Icon className="h-3 w-3" />
                                {cat.label} ({count})
                            </Button>
                        );
                    })}
                </div>
            </div>

            {/* Components List */}
            <ScrollArea className="flex-1">
                <div className="p-4 space-y-2">
                    {filteredComponents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <Folder className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-sm">
                                {searchQuery || selectedCategory !== 'all'
                                    ? 'Nenhum componente encontrado'
                                    : 'Nenhum componente salvo ainda'}
                            </p>
                            <p className="text-xs mt-1">
                                {!searchQuery && selectedCategory === 'all' &&
                                    'Selecione elementos e clique em "Salvar"'}
                            </p>
                        </div>
                    ) : (
                        filteredComponents.map((component) => {
                            const category = COMPONENT_CATEGORIES.find(c => c.value === component.category);
                            const Icon = category ? CATEGORY_ICONS[category.icon] : Folder;

                            return (
                                <Card key={component.id} className="hover:bg-accent/50 transition-colors">
                                    <CardContent className="p-3">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Icon className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                                    <h3 className="font-medium text-sm truncate">{component.name}</h3>
                                                </div>
                                                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                    <span>{category?.label || 'Outros'}</span>
                                                    <span>•</span>
                                                    <span>{component.elements.length} elemento(s)</span>
                                                </div>
                                                {component.tags && component.tags.length > 0 && (
                                                    <div className="flex gap-1 mt-2 flex-wrap">
                                                        {component.tags.map((tag, idx) => (
                                                            <span
                                                                key={idx}
                                                                className="px-2 py-0.5 bg-primary/10 text-primary text-xs rounded"
                                                            >
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex gap-1 flex-shrink-0">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8"
                                                    onClick={() => handleLoadComponent(component.id)}
                                                    title="Adicionar ao canvas"
                                                >
                                                    <Plus className="h-4 w-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 text-destructive hover:text-destructive"
                                                    onClick={() => handleDeleteComponent(component.id, component.name)}
                                                    title="Excluir componente"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })
                    )}
                </div>
            </ScrollArea>

            {/* Save Component Dialog */}
            <Dialog open={saveDialogOpen} onOpenChange={setSaveDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Salvar como Componente</DialogTitle>
                        <DialogDescription>
                            Salve {selectedElementIds.length} elemento(s) selecionado(s) como componente reutilizável
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div>
                            <Label>Nome do Componente</Label>
                            <Input
                                placeholder="Ex: Logo Principal"
                                value={componentName}
                                onChange={(e) => setComponentName(e.target.value)}
                                className="mt-1"
                            />
                        </div>

                        <div>
                            <Label>Categoria</Label>
                            <Select
                                value={componentCategory}
                                onValueChange={(value: ComponentCategory) => setComponentCategory(value)}
                            >
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {COMPONENT_CATEGORIES.map((cat) => {
                                        const Icon = CATEGORY_ICONS[cat.icon];
                                        return (
                                            <SelectItem key={cat.value} value={cat.value}>
                                                <div className="flex items-center gap-2">
                                                    <Icon className="h-4 w-4" />
                                                    {cat.label}
                                                </div>
                                            </SelectItem>
                                        );
                                    })}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <Label>Tags (opcional)</Label>
                            <Input
                                placeholder="Ex: header, vermelho, importante (separadas por vírgula)"
                                value={componentTags}
                                onChange={(e) => setComponentTags(e.target.value)}
                                className="mt-1"
                            />
                            <p className="text-xs text-muted-foreground mt-1">
                                Use tags para facilitar a busca depois
                            </p>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSaveDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSaveComponent}>
                            <Save className="h-4 w-4 mr-2" />
                            Salvar Componente
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
