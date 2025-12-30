import { useState, useMemo } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Plus, FileText, Calendar, Trash2, Search, Filter, MoreVertical, Layers, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useOSStore } from '@/store/osStore';
import { useChapasStore } from '@/store/chapasStore';
import { CreateOSModal } from '@/components/os/CreateOSModal';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { LabelThumbnail } from '@/components/os/LabelThumbnail';

export default function Home() {
  const navigate = useNavigate();
  const { osList, deleteOS } = useOSStore();
  const { chapas } = useChapasStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [osToDelete, setOsToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [clientCodeFilter, setClientCodeFilter] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'date'>('date');

  const filteredAndSortedOS = useMemo(() => {
    let filtered = osList;

    // Filtrar por busca
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (os) =>
          os.name.toLowerCase().includes(query) ||
          os.description?.toLowerCase().includes(query)
      );
    }

    // Filtrar por código do cliente
    if (clientCodeFilter.trim()) {
      const codeQuery = clientCodeFilter.toLowerCase();
      filtered = filtered.filter(
        (os) => os.clientCode?.toLowerCase().includes(codeQuery)
      );
    }

    // Ordenar
    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return a.name.localeCompare(b.name);
      } else {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      }
    });

    return sorted;
  }, [osList, searchQuery, clientCodeFilter, sortBy]);

  const handleCreateOS = () => {
    setCreateModalOpen(true);
  };

  const handleOpenOS = (osId: string) => {
    navigate(`/editor/${osId}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, osId: string) => {
    e.stopPropagation();
    setOsToDelete(osId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (osToDelete) {
      deleteOS(osToDelete);
      setOsToDelete(null);
      setDeleteDialogOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <FileText className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">FinalPrint</span>
            </div>
            <div className="flex items-center gap-2">
              <Button asChild variant="outline" className="gap-2">
                <Link to="/clients">
                  <Users className="h-4 w-4" />
                  Clientes
                </Link>
              </Button>
              <Button asChild variant="outline" className="gap-2">
                <Link to="/chapas">
                  <Layers className="h-4 w-4" />
                  Gerenciar Chapas
                  {chapas.length > 0 && (
                    <Badge variant="secondary" className="ml-1">{chapas.length}</Badge>
                  )}
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Ordens de Serviço</h1>
            <p className="text-muted-foreground mt-1">
              Gerencie seus projetos de etiquetas
            </p>
          </div>
          <Button onClick={handleCreateOS} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nova O.S
          </Button>
        </div>

        {osList.length > 0 && (
          <div className="flex flex-col gap-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar O.S por nome ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="relative sm:w-64">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Filtrar por código do cliente..."
                  value={clientCodeFilter}
                  onChange={(e) => setClientCodeFilter(e.target.value)}
                  className="pl-9"
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-2">
                    <Filter className="h-4 w-4" />
                    Ordenar
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={() => setSortBy('date')}
                    className={cn(sortBy === 'date' && 'bg-accent')}
                  >
                    Mais recente
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => setSortBy('name')}
                    className={cn(sortBy === 'name' && 'bg-accent')}
                  >
                    Nome (A-Z)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            {(searchQuery || clientCodeFilter) && (
              <div className="flex items-center gap-2 text-sm">
                <span className="text-muted-foreground">Filtros ativos:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="gap-1">
                    Busca: {searchQuery}
                    <button
                      onClick={() => setSearchQuery('')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                {clientCodeFilter && (
                  <Badge variant="secondary" className="gap-1">
                    Código: {clientCodeFilter}
                    <button
                      onClick={() => setClientCodeFilter('')}
                      className="ml-1 hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery('');
                    setClientCodeFilter('');
                  }}
                  className="h-6 text-xs"
                >
                  Limpar todos
                </Button>
              </div>
            )}
          </div>
        )}

        {osList.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <FileText className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma O.S criada</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Comece criando uma nova Ordem de Serviço para projetar suas etiquetas personalizadas
              </p>
              <Button onClick={handleCreateOS} className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                Criar Primeira O.S
              </Button>
            </CardContent>
          </Card>
        ) : filteredAndSortedOS.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma O.S encontrada</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                Tente ajustar os filtros de busca
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchQuery('');
                  setClientCodeFilter('');
                }}
                className="gap-2"
              >
                Limpar filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredAndSortedOS.length} {filteredAndSortedOS.length === 1 ? 'O.S encontrada' : 'O.S encontradas'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAndSortedOS.map((os) => (
                <Card
                  key={os.id}
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 hover:border-primary/50 group overflow-hidden"
                  onClick={() => handleOpenOS(os.id)}
                >
                  {/* Preview da Etiqueta */}
                  <div className="relative bg-gradient-to-br from-muted/30 to-muted/10 p-4 border-b border-border">
                    <div className="flex items-center justify-center">
                      {os.elements && os.elements.length > 0 ? (
                        <LabelThumbnail
                          elements={os.elements}
                          width={280}
                          height={160}
                          className="shadow-sm"
                        />
                      ) : (
                        <div className="w-[280px] h-[160px] flex items-center justify-center bg-muted/50 rounded border-2 border-dashed border-border">
                          <div className="text-center text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p className="text-xs">Sem elementos</p>
                            <p className="text-xs opacity-70">Adicione elementos no editor</p>
                          </div>
                        </div>
                      )}
                    </div>
                    {/* Badge de quantidade de elementos */}
                    {os.elements && os.elements.length > 0 && (
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="text-xs shadow-sm">
                          {os.elements.length} {os.elements.length === 1 ? 'elemento' : 'elementos'}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                          {os.name}
                        </CardTitle>
                        {os.clientCode && os.clientRazaoSocial && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1 mb-2">
                            <span className="font-mono font-semibold text-primary">
                              {os.clientCode}
                            </span>
                            <span className="text-xs">•</span>
                            <span className="line-clamp-1">
                              {os.clientRazaoSocial}
                            </span>
                          </div>
                        )}
                        {os.description && (
                          <CardDescription className="line-clamp-2 mt-1">
                            {os.description}
                          </CardDescription>
                        )}
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenOS(os.id);
                            }}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Abrir
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => handleDeleteClick(e, os.id)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    {/* Informações da Chapa */}
                    {os.config && (
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pb-2 border-b border-border">
                        <div className="flex items-center gap-1">
                          <span className="font-medium">📄</span>
                          <span>{os.config.paperSize || 'A4'}</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">🏷️</span>
                          <span>{os.config.labelWidth}×{os.config.labelHeight}mm</span>
                        </div>
                        <span>•</span>
                        <div className="flex items-center gap-1">
                          <span className="font-medium">📊</span>
                          <span>{os.config.columns}×{os.config.rows}</span>
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>
                          {format(new Date(os.createdAt), "dd/MM/yyyy")}
                        </span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        O.S
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <CreateOSModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta O.S? Esta ação não pode ser desfeita e todos os dados relacionados serão perdidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
