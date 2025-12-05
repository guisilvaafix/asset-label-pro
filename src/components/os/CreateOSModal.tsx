import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useOSStore } from '@/store/osStore';
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
import { PAPER_SIZES } from '@/types/label';

interface CreateOSModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateOSModal({ open, onOpenChange }: CreateOSModalProps) {
  const navigate = useNavigate();
  const { createOS } = useOSStore();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [paperSize, setPaperSize] = useState('A4');
  const [labelWidth, setLabelWidth] = useState(50);
  const [labelHeight, setLabelHeight] = useState(30);
  const [columns, setColumns] = useState(4);
  const [rows, setRows] = useState(8);
  const [isCreating, setIsCreating] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      return;
    }

    setIsCreating(true);

    const paper = PAPER_SIZES[paperSize] || PAPER_SIZES.A4;
    const margin = 5;
    const spacing = 2;

    // Calcular dimensões disponíveis
    const availableWidth = paper.width - (margin * 2);
    const availableHeight = paper.height - (margin * 2);

    // Calcular dimensões reais considerando espaçamento
    const totalSpacingWidth = spacing * (columns - 1);
    const totalSpacingHeight = spacing * (rows - 1);
    const calculatedWidth = (availableWidth - totalSpacingWidth) / columns;
    const calculatedHeight = (availableHeight - totalSpacingHeight) / rows;

    const os = createOS(name.trim(), description.trim() || undefined, {
      paperSize,
      labelWidth: calculatedWidth,
      labelHeight: calculatedHeight,
      columns,
      rows,
    });

    setIsCreating(false);
    onOpenChange(false);
    
    // Reset form
    setName('');
    setDescription('');
    setPaperSize('A4');
    setLabelWidth(50);
    setLabelHeight(30);
    setColumns(4);
    setRows(8);

    // Navegar para o editor
    navigate(`/editor/${os.id}`);
  };

  const handleCancel = () => {
    setName('');
    setDescription('');
    setPaperSize('A4');
    setLabelWidth(50);
    setLabelHeight(30);
    setColumns(4);
    setRows(8);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleCancel}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Configure as informações básicas da O.S e as dimensões da etiqueta
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome da O.S *</Label>
            <Input
              id="name"
              placeholder="Ex: Etiquetas de Patrimônio"
              value={name}
              onChange={(e) => setName(e.target.value)}
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

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paperSize">Tamanho do Papel</Label>
              <Select value={paperSize} onValueChange={setPaperSize}>
                <SelectTrigger id="paperSize">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.keys(PAPER_SIZES).map((size) => (
                    <SelectItem key={size} value={size}>
                      {size}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="labelWidth">Largura da Etiqueta (mm)</Label>
              <Input
                id="labelWidth"
                type="number"
                min="10"
                max="300"
                step="0.1"
                value={labelWidth}
                onChange={(e) => setLabelWidth(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="labelHeight">Altura da Etiqueta (mm)</Label>
              <Input
                id="labelHeight"
                type="number"
                min="10"
                max="300"
                step="0.1"
                value={labelHeight}
                onChange={(e) => setLabelHeight(Number(e.target.value))}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="columns">Colunas</Label>
              <Input
                id="columns"
                type="number"
                min="1"
                max="20"
                value={columns}
                onChange={(e) => setColumns(Number(e.target.value))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="rows">Linhas</Label>
              <Input
                id="rows"
                type="number"
                min="1"
                max="50"
                value={rows}
                onChange={(e) => setRows(Number(e.target.value))}
              />
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel} disabled={isCreating}>
            Cancelar
          </Button>
          <Button onClick={handleCreate} disabled={!name.trim() || isCreating}>
            {isCreating ? 'Criando...' : 'Criar e Abrir Editor'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

