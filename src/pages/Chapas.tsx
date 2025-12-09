import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FileText, Calendar, Trash2, Search, Edit, ArrowLeft, Layers, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useChapasStore, calcularTotalEtiquetas } from '@/store/chapasStore';
import { ChapaFormModal } from '@/components/chapas/ChapaFormModal';
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
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function Chapas() {
  const navigate = useNavigate();
  const { chapas, deleteChapa } = useChapasStore();
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [chapaToEdit, setChapaToEdit] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [chapaToDelete, setChapaToDelete] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredChapas = useMemo(() => {
    if (!searchQuery.trim()) return chapas;
    const query = searchQuery.toLowerCase();
    return chapas.filter((chapa) =>
      chapa.name.toLowerCase().includes(query)
    );
  }, [chapas, searchQuery]);

  const handleEditClick = (chapaId: string) => {
    setChapaToEdit(chapaId);
    setEditModalOpen(true);
  };

  const handleDeleteClick = (chapaId: string) => {
    setChapaToDelete(chapaId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (chapaToDelete) {
      deleteChapa(chapaToDelete);
      setChapaToDelete(null);
      setDeleteDialogOpen(false);
      toast.success('Chapa excluída com sucesso');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                  <Layers className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-bold text-lg">Configuração de Chapas</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-bold">Chapas Cadastradas</h1>
            <p className="text-muted-foreground mt-1">
              Configure chapas para padronizar as dimensões das etiquetas nas O.S
            </p>
          </div>
          <Button onClick={() => setCreateModalOpen(true)} className="gap-2 w-full sm:w-auto">
            <Plus className="h-4 w-4" />
            Nova Chapa
          </Button>
        </div>

        {chapas.length > 0 && (
          <div className="flex gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar chapa por nome..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        )}

        {chapas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                <Layers className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Nenhuma chapa cadastrada</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-md">
                Cadastre chapas para definir as dimensões padrão das etiquetas usadas nas Ordens de Serviço
              </p>
              <Button onClick={() => setCreateModalOpen(true)} className="gap-2" size="lg">
                <Plus className="h-4 w-4" />
                Cadastrar Primeira Chapa
              </Button>
            </CardContent>
          </Card>
        ) : filteredChapas.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Search className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma chapa encontrada</h3>
              <p className="text-muted-foreground text-center mb-6 max-w-sm">
                Tente ajustar os filtros de busca
              </p>
              <Button variant="outline" onClick={() => setSearchQuery('')} className="gap-2">
                Limpar busca
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-muted-foreground">
              {filteredChapas.length} {filteredChapas.length === 1 ? 'chapa encontrada' : 'chapas encontradas'}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredChapas.map((chapa) => (
                <Card key={chapa.id} className="hover:shadow-lg transition-all duration-200 hover:border-primary/50 group">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-lg mb-1 line-clamp-1 group-hover:text-primary transition-colors">
                          {chapa.name}
                        </CardTitle>
                        <CardDescription>
                          Chapa: {chapa.width} × {chapa.height} mm
                        </CardDescription>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => handleEditClick(chapa.id)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleDeleteClick(chapa.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0 space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="bg-muted/50 rounded-md p-2">
                        <span className="text-muted-foreground block text-xs">Etiqueta</span>
                        <span className="font-medium">{chapa.labelWidth} × {chapa.labelHeight} mm</span>
                      </div>
                      <div className="bg-muted/50 rounded-md p-2">
                        <span className="text-muted-foreground block text-xs">Layout</span>
                        <span className="font-medium">{chapa.columns} × {chapa.rows}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        <span>{format(new Date(chapa.createdAt), "dd/MM/yyyy")}</span>
                      </div>
                      <Badge variant="secondary" className="gap-1">
                        <Grid3X3 className="h-3 w-3" />
                        {calcularTotalEtiquetas(chapa)} etiquetas
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </>
        )}
      </main>

      <ChapaFormModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        mode="create"
      />

      <ChapaFormModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        mode="edit"
        chapaId={chapaToEdit || undefined}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta chapa? Esta ação não pode ser desfeita.
              As O.S já criadas não serão afetadas, pois mantêm uma cópia das configurações.
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
