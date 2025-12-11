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
  Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useLabelStore } from '@/store/labelStore';
import { LabelElement, BARCODE_TYPES, DYNAMIC_FIELDS } from '@/types/label';
import { toast } from 'sonner';

export function ElementsSidebar() {
  const { addElement, sheetConfig } = useLabelStore();

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

  const handleAddDynamicField = (field: string) => {
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
    toast.success('Campo dinâmico adicionado');
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

  const handleAddBarcode = (barcodeType: string) => {
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
    toast.success(`Código de barras ${barcodeType} adicionado`);
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

  const handleAddShape = (type: 'rectangle' | 'circle' | 'line') => {
    const element = createElement(type, {
      width: type === 'line' ? 20 : 15,
      height: type === 'line' ? 2 : 15,
      shapeFill: type === 'line' ? undefined : '#ffffff',
      shapeStroke: '#000000',
      shapeStrokeWidth: 1,
      cornerRadius: 0,
    });
    addElement(element);
    toast.success('Forma adicionada');
  };

  return (
    <aside className="w-64 border-r border-border bg-card flex flex-col">
      <div className="p-3 border-b border-border">
        <h2 className="font-semibold text-sm">Elementos</h2>
        <p className="text-xs text-muted-foreground">Arraste para o canvas</p>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-3">
          <Accordion type="multiple" defaultValue={['basic', 'dynamic', 'codes', 'shapes']} className="space-y-2">
            <AccordionItem value="basic" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                Básico
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={handleAddText}
                  >
                    <Type className="h-5 w-5" />
                    <span className="text-xs">Texto</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={handleAddImage}
                  >
                    <Image className="h-5 w-5" />
                    <span className="text-xs">Imagem</span>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="dynamic" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                Campos Dinâmicos
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-1">
                  {DYNAMIC_FIELDS.slice(0, 6).map((field) => (
                    <Button
                      key={field.value}
                      variant="ghost"
                      size="sm"
                      className="w-full justify-start h-8 text-xs"
                      onClick={() => handleAddDynamicField(field.value)}
                    >
                      <Hash className="h-3 w-3 mr-2" />
                      {field.label}
                    </Button>
                  ))}
                  <Accordion type="single" collapsible>
                    <AccordionItem value="more" className="border-none">
                      <AccordionTrigger className="py-1 text-xs hover:no-underline">
                        Mais campos...
                      </AccordionTrigger>
                      <AccordionContent>
                        {DYNAMIC_FIELDS.slice(6).map((field) => (
                          <Button
                            key={field.value}
                            variant="ghost"
                            size="sm"
                            className="w-full justify-start h-8 text-xs"
                            onClick={() => handleAddDynamicField(field.value)}
                          >
                            <Hash className="h-3 w-3 mr-2" />
                            {field.label}
                          </Button>
                        ))}
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="codes" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                Códigos
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 flex-col gap-1"
                      onClick={handleAddQRCode}
                    >
                      <QrCode className="h-5 w-5" />
                      <span className="text-xs">QR Code</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 flex-col gap-1"
                      onClick={handleAddDataMatrix}
                    >
                      <Grid2X2 className="h-5 w-5" />
                      <span className="text-xs">DataMatrix</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-auto py-3 flex-col gap-1 col-span-2"
                      onClick={handleAddPDF417}
                    >
                      <FileText className="h-5 w-5" />
                      <span className="text-xs">PDF417</span>
                    </Button>
                  </div>

                  <Separator />

                  <p className="text-xs text-muted-foreground font-medium">Códigos de Barras 1D</p>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {BARCODE_TYPES.map((type) => (
                      <Button
                        key={type.value}
                        variant="ghost"
                        size="sm"
                        className="w-full justify-start h-8 text-xs"
                        onClick={() => handleAddBarcode(type.value)}
                      >
                        <Barcode className="h-3 w-3 mr-2" />
                        <span className="truncate">{type.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="shapes" className="border-none">
              <AccordionTrigger className="py-2 text-sm font-medium hover:no-underline">
                Formas
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={() => handleAddShape('rectangle')}
                  >
                    <Square className="h-5 w-5" />
                    <span className="text-xs">Retângulo</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={() => handleAddShape('circle')}
                  >
                    <Circle className="h-5 w-5" />
                    <span className="text-xs">Círculo</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-auto py-3 flex-col gap-1"
                    onClick={() => handleAddShape('line')}
                  >
                    <Minus className="h-5 w-5" />
                    <span className="text-xs">Linha</span>
                  </Button>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </ScrollArea>
    </aside>
  );
}
