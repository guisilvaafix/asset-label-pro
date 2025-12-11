import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOSStore } from '@/store/osStore';
import { useChapasStore, calcularTotalEtiquetas } from '@/store/chapasStore';
import { getClientByCode } from '@/services/afixControlApi';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, Layers, Grid3X3, Lock, Loader2, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

interface CreateOSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOSModal({ open, onOpenChange }: CreateOSModalProps) {
  const navigate = useNavigate();
  const { createOS, getNextSequentialName } = useOSStore();
  const { chapas, getChapa } = useChapasStore();
  const [description, setDescription] = useState('');
  const [selectedChapaId, setSelectedChapaId] = useState<string>('');
  const [isCreating, setIsCreating] = useState(false);

  // Estados para busca de cliente
  const [clientCode, setClientCode] = useState('');
  const [clientRazaoSocial, setClientRazaoSocial] = useState('');
  const [clientNomeComercial, setClientNomeComercial] = useState('');
  const [isLoadingClient, setIsLoadingClient] = useState(false);
  const [clientError, setClientError] = useState('');

  // Get the next OS name that will be generated
  const nextOSName = getNextSequentialName();

  // Get selected chapa details
  const selectedChapa = useMemo(() => {
    if (!selectedChapaId) return null;
    return getChapa(selectedChapaId);
  }, [selectedChapaId, getChapa]);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setDescription('');
      setSelectedChapaId('');
      setClientCode('');
      setClientRazaoSocial('');
      setClientNomeComercial('');
      setClientError('');
    }
  }, [open]);

  // Buscar cliente quando o código mudar
  useEffect(() => {
    const searchClient = async () => {
      if (!clientCode || clientCode.length < 3) {
        setClientRazaoSocial('');
        setClientNomeComercial('');
        setClientError('');
        return;
      }

      setIsLoadingClient(true);
      setClientError('');

      try {
        const client = await getClientByCode(clientCode);

        if (client) {
          setClientRazaoSocial(client.info.razaoSocial);
          setClientNomeComercial(client.info.nomeComercial);
          setClientError('');
        } else {
          setClientRazaoSocial('');
          setClientNomeComercial('');
          setClientError('Cliente não encontrado');
        }
      } catch (error) {
        console.error('Error fetching client:', error);
        setClientRazaoSocial('');
        setClientNomeComercial('');
        setClientError('Erro ao buscar cliente');
      } finally {
        setIsLoadingClient(false);
      }
    };

    // Debounce de 500ms
    const timeoutId = setTimeout(searchClient, 500);
    return () => clearTimeout(timeoutId);
  }, [clientCode]);

  const handleCreate = async () => {
    if (!selectedChapa) {
      return;
    }

    setIsCreating(true);

    // Create OS with snapshot of chapa data (name is auto-generated)
    const os = createOS(
      description.trim() || undefined,
      {
        chapaId: selectedChapa.id,
        chapaName: selectedChapa.name,
        // Snapshot das configurações da chapa no momento da criação
        paperSize: 'CUSTOM',
        customWidth: selectedChapa.width,
        customHeight: selectedChapa.height,
        labelWidth: selectedChapa.labelWidth,
        labelHeight: selectedChapa.labelHeight,
        columns: selectedChapa.columns,
        rows: selectedChapa.rows,
        marginTop: selectedChapa.marginTop ?? 5,
        marginBottom: selectedChapa.marginBottom ?? 5,
        marginLeft: selectedChapa.marginLeft ?? 5,
        marginRight: selectedChapa.marginRight ?? 5,
        spacingHorizontal: selectedChapa.spacingHorizontal ?? 2,
        spacingVertical: selectedChapa.spacingVertical ?? 2,
      },
      {
        clientCode: clientCode || undefined,
        clientRazaoSocial: clientRazaoSocial || undefined,
        clientNomeComercial: clientNomeComercial || undefined,
      }
    );

    setIsCreating(false);
    onOpenChange(false);

    // Navigate to editor
    navigate(`/editor/${os.id}`);
  };

  const handleCancel = () => {
    setDescription('');
    setSelectedChapaId('');
    onOpenChange(false);
  };

  const canCreate = !!selectedChapa;

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Selecione uma chapa previamente cadastrada para definir as dimensões das etiquetas
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Número da O.S (gerado automaticamente)</Label>
            <Input
              value={nextOSName}
              disabled
              className="bg-muted font-mono"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              placeholder="Descreva o propósito desta O.S..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>

          <Separator />

          {/* Campos de Cliente */}
          <div className="space-y-2">
            <Label htmlFor="clientCode">Código do Cliente (AfixControl)</Label>
            <div className="relative">
              <Input
                id="clientCode"
                placeholder="Digite o código do cliente..."
                value={clientCode}
                onChange={(e) => setClientCode(e.target.value)}
                className={clientError ? 'border-destructive' : ''}
              />
              {isLoadingClient && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
              )}
            </div>
            {clientError && (
              <p className="text-xs text-destructive">{clientError}</p>
            )}
            {clientRazaoSocial && (
              <div className="p-3 bg-primary/10 rounded-md border border-primary/20 space-y-1">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  <span className="text-sm font-medium text-primary">Cliente Encontrado</span>
                </div>
                <p className="text-sm font-semibold">{clientRazaoSocial}</p>
                {clientNomeComercial && clientNomeComercial !== clientRazaoSocial && (
                  <p className="text-xs text-muted-foreground">{clientNomeComercial}</p>
                )}
              </div>
            )}
          </div>

          <Separator />

          {/* Seleção de Chapa */}
          <div className="space-y-2">
            <Label htmlFor="chapa">Selecione uma Chapa *</Label>
            {chapas.length === 0 ? (
              <div className="bg-muted/50 border border-border rounded-md p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm font-medium">Nenhuma chapa cadastrada</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      É necessário cadastrar uma chapa antes de criar uma O.S.
                    </p>
                    <Button asChild variant="outline" size="sm" className="mt-3 gap-2">
                      <Link to="/chapas" onClick={() => onOpenChange(false)}>
                        <Layers className="h-4 w-4" />
                        Cadastrar Chapas
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <Select value={selectedChapaId} onValueChange={setSelectedChapaId}>
                <SelectTrigger id="chapa">
                  <SelectValue placeholder="Selecione uma chapa..." />
                </SelectTrigger>
                <SelectContent>
                  {chapas.map((chapa) => (
                    <SelectItem key={chapa.id} value={chapa.id}>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4 w-4 text-muted-foreground" />
                        <span>{chapa.name}</span>
                        <span className="text-muted-foreground text-xs">
                          ({chapa.labelWidth}×{chapa.labelHeight}mm)
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Preview das configurações da chapa selecionada */}
          {selectedChapa && (
            <div className="bg-muted/30 border border-border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  Configurações da Chapa (somente leitura)
                </h4>
                <Badge variant="secondary" className="gap-1">
                  <Grid3X3 className="h-3 w-3" />
                  {calcularTotalEtiquetas(selectedChapa)} etiquetas/chapa
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tamanho da Chapa</Label>
                  <Input
                    value={`${selectedChapa.width} × ${selectedChapa.height} mm`}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Tamanho da Etiqueta</Label>
                  <Input
                    value={`${selectedChapa.labelWidth} × ${selectedChapa.labelHeight} mm`}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Colunas</Label>
                  <Input
                    value={selectedChapa.columns}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Linhas</Label>
                  <Input
                    value={selectedChapa.rows}
                    disabled
                    className="bg-muted"
                  />
                </div>
              </div>

              <p className="text-xs text-muted-foreground">
                Estas configurações são herdadas da chapa e não podem ser editadas na O.S.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!canCreate || isCreating}>
            {isCreating ? 'Criando...' : 'Criar e Abrir Editor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
