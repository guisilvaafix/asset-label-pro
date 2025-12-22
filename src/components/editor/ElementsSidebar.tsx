import {
  Type,
  Image,
  QrCode,
  Barcode,
  Square,
  Circle,
  Minus,
  Grid2X2,
  FileText,
  Hash,
  Shapes,
  Home,
  ChevronRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { useLabelStore } from '@/store/labelStore';
import { LabelElement, BARCODE_TYPES, DYNAMIC_FIELDS } from '@/types/label';
import { toast } from 'sonner';

export function ElementsSidebar() {
  const { addElement } = useLabelStore();
  const navigate = useNavigate();

  const createElement = (type: LabelElement['type'], extra: Partial<LabelElement> = {}): LabelElement => ({
    id: `${type}-${Date.now()}`,
    type,
    x: 5,
    y: 5,
    width: 20,
    height: 10,
    rotation: 0,
    opacity: 1,
    zIndex: Date.now(),
    locked: false,
    ...extra,
  });

  const handleAddText = () => {
    const element = createElement('text', {
      text: 'Texto',
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'normal',
      fill: '#000000',
      textAlign: 'left',
    });
    addElement(element);
    toast.success('Texto adicionado');
  };

  const handleAddDynamicField = (field: string, label: string) => {
    const element = createElement('text', {
      text: field,
      fontFamily: 'Arial',
      fontSize: 12,
      fontWeight: 'normal',
      fill: '#000000',
      textAlign: 'left',
      isDynamic: true,
      dynamicField: field,
    });
    addElement(element);
    toast.success(`${label} adicionado`);
  };

  const handleAddImage = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png,image/jpeg,image/jpg,image/svg+xml';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const element = createElement('image', {
            src: event.target?.result as string,
            width: 15,
            height: 15,
          });
          addElement(element);
          toast.success('Imagem adicionada');
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const handleAddQRCode = () => {
    const element = createElement('qrcode', {
      width: 15,
      height: 15,
      qrValue: '{PREFIXO}{NUMERO}',
      qrErrorLevel: 'M',
      qrForeground: '#000000',
      qrBackground: '#ffffff',
      isDynamic: true,
      dynamicField: '{PREFIXO}{NUMERO}',
    });
    addElement(element);
    toast.success('QR Code adicionado');
  };

  const handleAddBarcode = (barcodeType: string, label: string) => {
    const element = createElement('barcode', {
      width: 30,
      height: 10,
      barcodeType: barcodeType as LabelElement['barcodeType'],
      barcodeValue: '{NUMERO}',
      displayValue: true,
      isDynamic: true,
      dynamicField: '{NUMERO}',
    });
    addElement(element);
    toast.success(`${label} adicionado`);
  };

  const handleAddDataMatrix = () => {
    const element = createElement('datamatrix', {
      width: 10,
      height: 10,
      barcodeValue: '{PREFIXO}{NUMERO}',
      isDynamic: true,
      dynamicField: '{PREFIXO}{NUMERO}',
    });
    addElement(element);
    toast.success('DataMatrix adicionado');
  };

  const handleAddPDF417 = () => {
    const element = createElement('pdf417', {
      width: 25,
      height: 10,
      barcodeValue: '{PREFIXO}{NUMERO}',
      isDynamic: true,
      dynamicField: '{PREFIXO}{NUMERO}',
    });
    addElement(element);
    toast.success('PDF417 adicionado');
  };

  const handleAddShape = (type: 'rectangle' | 'circle' | 'line', label: string) => {
    const element = createElement(type, {
      width: type === 'line' ? 20 : 15,
      height: type === 'line' ? 2 : 15,
      shapeFill: type === 'line' ? undefined : '#ffffff',
      shapeStroke: '#000000',
      shapeStrokeWidth: 1,
      cornerRadius: 0,
    });
    addElement(element);
    toast.success(`${label} adicionado`);
  };

  return (
    <TooltipProvider delayDuration={300}>
      <aside className="w-16 border-r border-border bg-card flex flex-col items-center py-3 gap-2">
        {/* Home Button */}
        <div className="mb-2 pb-2 border-b border-border w-full flex justify-center">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 rounded-lg"
                onClick={() => navigate('/')}
              >
                <Home className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Voltar para Home</p>
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Text */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-lg"
              onClick={handleAddText}
            >
              <Type className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Adicionar Texto</p>
          </TooltipContent>
        </Tooltip>

        {/* Dynamic Fields Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-lg"
                >
                  <Hash className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Campos Dinâmicos</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuLabel>Campos Dinâmicos</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {DYNAMIC_FIELDS.map((field) => (
              <DropdownMenuItem
                key={field.value}
                onClick={() => handleAddDynamicField(field.value, field.label)}
                className="cursor-pointer"
              >
                <Hash className="h-4 w-4 mr-2" />
                <div className="flex flex-col">
                  <span className="font-medium">{field.label}</span>
                  <span className="text-xs text-muted-foreground">{field.description}</span>
                </div>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Image */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-12 w-12 rounded-lg"
              onClick={handleAddImage}
            >
              <Image className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="right">
            <p>Adicionar Imagem</p>
          </TooltipContent>
        </Tooltip>

        <div className="w-8 border-t border-border my-1" />

        {/* Codes Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-lg"
                >
                  <QrCode className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Códigos</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="start" className="w-56">
            <DropdownMenuLabel>Códigos 2D</DropdownMenuLabel>
            <DropdownMenuItem onClick={handleAddQRCode} className="cursor-pointer">
              <QrCode className="h-4 w-4 mr-2" />
              QR Code
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddDataMatrix} className="cursor-pointer">
              <Grid2X2 className="h-4 w-4 mr-2" />
              DataMatrix
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleAddPDF417} className="cursor-pointer">
              <FileText className="h-4 w-4 mr-2" />
              PDF417
            </DropdownMenuItem>

            <DropdownMenuSeparator />

            <DropdownMenuSub>
              <DropdownMenuSubTrigger>
                <Barcode className="h-4 w-4 mr-2" />
                Códigos de Barras 1D
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent className="w-56 max-h-96 overflow-y-auto">
                {BARCODE_TYPES.map((type) => (
                  <DropdownMenuItem
                    key={type.value}
                    onClick={() => handleAddBarcode(type.value, type.label)}
                    className="cursor-pointer"
                  >
                    <Barcode className="h-4 w-4 mr-2" />
                    <div className="flex flex-col">
                      <span className="font-medium">{type.label}</span>
                      <span className="text-xs text-muted-foreground">{type.description}</span>
                    </div>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Shapes Dropdown */}
        <DropdownMenu>
          <Tooltip>
            <TooltipTrigger asChild>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-lg"
                >
                  <Shapes className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Formas</p>
            </TooltipContent>
          </Tooltip>
          <DropdownMenuContent side="right" align="start" className="w-48">
            <DropdownMenuLabel>Formas</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => handleAddShape('rectangle', 'Retângulo')}
              className="cursor-pointer"
            >
              <Square className="h-4 w-4 mr-2" />
              Retângulo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAddShape('circle', 'Círculo')}
              className="cursor-pointer"
            >
              <Circle className="h-4 w-4 mr-2" />
              Círculo
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => handleAddShape('line', 'Linha')}
              className="cursor-pointer"
            >
              <Minus className="h-4 w-4 mr-2" />
              Linha
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

      </aside>
    </TooltipProvider>
  );
}
