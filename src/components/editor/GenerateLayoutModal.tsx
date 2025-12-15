import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileText, Loader2 } from 'lucide-react';
import { useOSStore } from '@/store/osStore';
import { useLabelStore } from '@/store/labelStore';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface GenerateLayoutModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    osId: string;
}

const MATERIALS = [
    'Alumínio',
    'VOID',
    'Vinil',
    'Policarbonato cristal',
    'Policarbonato texturizado'
];

const THICKNESSES = ['0,1', '0,15', '0,30', '0,5'];

export function GenerateLayoutModal({ open, onOpenChange, osId }: GenerateLayoutModalProps) {
    const { getOS } = useOSStore();
    const { elements, sheetConfig } = useLabelStore();
    const [isGenerating, setIsGenerating] = useState(false);

    const os = getOS(osId);

    const [formData, setFormData] = useState({
        material: 'Alumínio',
        thickness: '0,30',
        dimension: os?.config ? `${os.config.labelWidth} x ${os.config.labelHeight}mm` : `${sheetConfig.labelWidth} x ${sheetConfig.labelHeight}mm`,
        rebite: 'Não',
        adhesive: 'Não',
        bisnagaCola: 'Não',
        frontColor: 'Preto',
        backColor: 'Colorido',
        finish: 'Brilhante',
        printType: 'laCoast128C',
        numberOfDigits: '6',
        numericalRange: '000001',
        quantity: '1000',
        observations: ''
    });

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const generatePDF = async () => {
        if (!os) {
            toast.error('O.S não encontrada');
            return;
        }

        setIsGenerating(true);

        try {
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const margin = 15;
            let yPosition = margin;

            // Cores da paleta laranja
            const primaryOrange = [255, 140, 0]; // Laranja principal
            const lightOrange = [255, 248, 240]; // Laranja claro
            const darkOrange = [230, 120, 0]; // Laranja escuro
            const warningRed = [220, 53, 69]; // Vermelho para avisos

            // Header com gradiente simulado
            pdf.setFillColor(255, 250, 245);
            pdf.rect(0, 0, pageWidth, 30, 'F');

            // Logo/Marca
            pdf.setFontSize(16);
            pdf.setTextColor(darkOrange[0], darkOrange[1], darkOrange[2]);
            pdf.setFont(undefined, 'bold');
            pdf.text('AFIXGRAF', margin, 12);

            // Título
            pdf.setFontSize(18);
            pdf.setTextColor(30, 30, 30);
            pdf.text('Relatório de Aprovação Específico', margin, 22);

            // Número da página
            pdf.setFontSize(9);
            pdf.setTextColor(120, 120, 120);
            pdf.text(`Página 1`, pageWidth - margin - 15, 12);

            yPosition = 38;

            // Informações da O.S em cards
            pdf.setFillColor(255, 250, 245);
            pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 20, 2, 2, 'F');

            pdf.setFontSize(10);
            pdf.setTextColor(80, 80, 80);
            pdf.setFont(undefined, 'bold');
            pdf.text('Ordem de Serviço:', margin + 3, yPosition + 6);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(50, 50, 50);
            pdf.text(os.name, margin + 3, yPosition + 11);

            if (os.clientCode && os.clientRazaoSocial) {
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(80, 80, 80);
                pdf.text('Cliente:', margin + 3, yPosition + 16);
                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(50, 50, 50);
                pdf.text(`${os.clientCode} - ${os.clientRazaoSocial}`, margin + 20, yPosition + 16);
            }

            yPosition += 25;

            // Seção de Layout com cor laranja
            pdf.setFillColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
            pdf.rect(margin, yPosition, pageWidth - 2 * margin, 8, 'F');
            pdf.setFontSize(12);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(255, 255, 255);
            pdf.text('Layout de Aprovação', margin + 3, yPosition + 5.5);
            yPosition += 12;

            // Capturar a imagem da etiqueta do canvas do editor SEM o grid
            let labelImageData = null;
            try {
                // Procurar pelo canvas do LabelCanvas (menor canvas, que é o editor)
                const canvasElements = document.querySelectorAll('canvas');
                let labelCanvas: HTMLCanvasElement | null = null;
                let minArea = Infinity;

                // Encontrar o canvas menor (que é o LabelCanvas, não o SheetPreview)
                canvasElements.forEach(canvas => {
                    const area = canvas.width * canvas.height;
                    // O LabelCanvas geralmente tem área entre 1000 e 100000 pixels
                    if (area > 1000 && area < 100000 && area < minArea) {
                        minArea = area;
                        labelCanvas = canvas;
                    }
                });

                if (labelCanvas) {
                    // Criar canvas temporário para renderizar sem o grid
                    const tempCanvas = document.createElement('canvas');
                    tempCanvas.width = labelCanvas.width;
                    tempCanvas.height = labelCanvas.height;
                    const ctx = tempCanvas.getContext('2d');

                    if (ctx) {
                        // Fundo branco (ou cinza para alumínio)
                        const isAluminum = formData.material.toLowerCase().includes('alumínio') ||
                            formData.material.toLowerCase().includes('aluminio');
                        ctx.fillStyle = isAluminum ? '#f5f5f5' : '#ffffff';
                        ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

                        // Copiar apenas o conteúdo do canvas original (sem o grid)
                        ctx.drawImage(labelCanvas, 0, 0);

                        labelImageData = tempCanvas.toDataURL('image/png');
                    }
                }
            } catch (error) {
                console.warn('Não foi possível capturar a prévia da etiqueta:', error);
            }

            // Container da prévia e características
            const previewBoxHeight = 70;

            // Box da prévia com sombra e cantos arredondados
            pdf.setDrawColor(200, 200, 200);
            pdf.setLineWidth(0.3);
            pdf.setFillColor(250, 250, 250);
            pdf.roundedRect(margin, yPosition, 95, previewBoxHeight, 3, 3, 'FD');

            // Sombra simulada
            pdf.setDrawColor(220, 220, 220);
            pdf.setLineWidth(0.5);
            pdf.line(margin + 1, yPosition + previewBoxHeight + 0.5, margin + 95, yPosition + previewBoxHeight + 0.5);
            pdf.line(margin + 95 + 0.5, yPosition + 1, margin + 95 + 0.5, yPosition + previewBoxHeight);

            if (labelImageData) {
                try {
                    // Calcular dimensões proporcionais da etiqueta
                    const labelWidth = os?.config?.labelWidth || sheetConfig.labelWidth;
                    const labelHeight = os?.config?.labelHeight || sheetConfig.labelHeight;
                    const aspectRatio = labelWidth / labelHeight;

                    // Definir tamanho máximo para a prévia
                    const maxWidth = 80;
                    const maxHeight = 55;

                    let previewWidth = maxWidth;
                    let previewHeight = maxWidth / aspectRatio;

                    if (previewHeight > maxHeight) {
                        previewHeight = maxHeight;
                        previewWidth = maxHeight * aspectRatio;
                    }

                    // Centralizar a imagem
                    const xOffset = margin + (95 - previewWidth) / 2;
                    const yOffset = yPosition + (previewBoxHeight - previewHeight) / 2;

                    // Adicionar a imagem
                    pdf.addImage(labelImageData, 'PNG', xOffset, yOffset, previewWidth, previewHeight);
                } catch (error) {
                    console.warn('Erro ao adicionar imagem:', error);
                    pdf.setFontSize(10);
                    pdf.setTextColor(150, 150, 150);
                    pdf.text('[Prévia da Etiqueta]', margin + 25, yPosition + previewBoxHeight / 2);
                }
            } else {
                pdf.setFontSize(10);
                pdf.setTextColor(150, 150, 150);
                pdf.text('[Prévia da Etiqueta]', margin + 25, yPosition + previewBoxHeight / 2);
            }

            // Box de características com design melhorado
            const charBoxX = margin + 100;
            pdf.setFillColor(255, 250, 245);
            pdf.roundedRect(charBoxX, yPosition, pageWidth - charBoxX - margin, previewBoxHeight, 2, 2, 'FD');

            pdf.setFontSize(10);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
            pdf.text('CARACTERÍSTICAS DO MATERIAL', charBoxX + 3, yPosition + 6);

            let charY = yPosition + 12;
            const lineHeight = 5;

            // Helper para destacar campos importantes
            const addSpec = (label: string, value: string, highlight: boolean = false) => {
                pdf.setFont(undefined, highlight ? 'bold' : 'normal');
                pdf.setTextColor(highlight ? warningRed[0] : 60, highlight ? warningRed[1] : 60, highlight ? warningRed[2] : 60);
                pdf.text(`${label}: ${value}`, charBoxX + 3, charY);
                charY += lineHeight;
            };

            // Material - SEMPRE destacado
            addSpec('Material', formData.material, true);

            // Espessura - SEMPRE destacado
            addSpec('Espessura', `${formData.thickness}mm`, true);

            // Dimensão
            addSpec('Dimensão', formData.dimension, false);

            // Rebite - Destacar se for "Sim"
            const hasRebite = formData.rebite.toLowerCase() === 'sim';
            addSpec('Rebite', formData.rebite, hasRebite);

            // Adesivo - Destacar se for "Sim"
            const hasAdhesive = formData.adhesive.toLowerCase() === 'sim';
            addSpec('Adesivo', formData.adhesive, hasAdhesive);

            // Bisnaga de Cola - Destacar se for "Sim"
            const hasBisnaga = formData.bisnagaCola.toLowerCase() === 'sim';
            addSpec('Bisnaga de Cola', formData.bisnagaCola, hasBisnaga);

            // Demais campos sem destaque
            addSpec('Cor dados variáveis', formData.frontColor, false);
            addSpec('Cor do logo', formData.backColor, false);
            addSpec('Acabamento', formData.finish, false);
            addSpec('Padrão', formData.printType, false);
            addSpec('Nº de dígitos', formData.numberOfDigits, false);
            addSpec('Código inicial', formData.numericalRange, false);

            yPosition += previewBoxHeight + 8;

            // Faixa numérica e quantidade em destaque (laranja claro)
            pdf.setFillColor(lightOrange[0], lightOrange[1], lightOrange[2]);
            pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 15, 2, 2, 'F');

            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(50, 50, 50);
            pdf.text(`Faixa Numérica: ${formData.numericalRange} até ${(parseInt(formData.numericalRange) + parseInt(formData.quantity) - 1).toString().padStart(formData.numericalRange.length, '0')}`, margin + 3, yPosition + 6);
            pdf.text(`Quantidade: ${formData.quantity} unidades`, margin + 3, yPosition + 11);

            yPosition += 20;

            // Aviso importante com vermelho
            pdf.setFillColor(255, 243, 243);
            pdf.setDrawColor(warningRed[0], warningRed[1], warningRed[2]);
            pdf.setLineWidth(0.8);
            pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 22, 2, 2, 'FD');

            pdf.setTextColor(warningRed[0], warningRed[1], warningRed[2]);
            pdf.setFontSize(8);
            pdf.setFont(undefined, 'bold');
            const warningLines = [
                'ATENÇÃO: O CONTEÚDO DESTE FORMULÁRIO (FORMA DE FIXAÇÃO, FAIXA NUMÉRICA, ETC)',
                'É DE RESPONSABILIDADE DO CLIENTE. AO APROVAR, FICARÁ IMPLÍCITO QUE O',
                'FORMULÁRIO FOI CHECADO E VALIDADO, RESPONSABILIZANDO-SE POR EVENTUAIS',
                'DIVERGÊNCIAS FUTURAS.'
            ];

            warningLines.forEach((line, index) => {
                pdf.text(line, margin + 3, yPosition + 5 + (index * 4));
            });

            yPosition += 27;

            // Observações
            if (formData.observations) {
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(80, 80, 80);
                pdf.text('Observações:', margin, yPosition);
                yPosition += 5;

                pdf.setFont(undefined, 'normal');
                pdf.setTextColor(60, 60, 60);
                const obsLines = pdf.splitTextToSize(formData.observations, pageWidth - 2 * margin);
                pdf.text(obsLines, margin, yPosition);
                yPosition += (obsLines.length * 5) + 5;
            } else {
                pdf.setFontSize(10);
                pdf.setFont(undefined, 'bold');
                pdf.setTextColor(80, 80, 80);
                pdf.text('Observações:', margin, yPosition);
                yPosition += 6;

                pdf.setDrawColor(200, 200, 200);
                for (let i = 0; i < 3; i++) {
                    pdf.line(margin, yPosition, pageWidth - margin, yPosition);
                    yPosition += 7;
                }
                yPosition += 3;
            }

            // Seção de aprovação com design melhorado (laranja)
            pdf.setFillColor(255, 250, 245);
            pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 45, 2, 2, 'F');

            pdf.setFontSize(11);
            pdf.setFont(undefined, 'bold');
            pdf.setTextColor(primaryOrange[0], primaryOrange[1], primaryOrange[2]);
            pdf.text('Conferência, Aprovação e Autorização do Cliente', margin + 3, yPosition + 6);

            pdf.setFontSize(9);
            pdf.setFont(undefined, 'normal');
            pdf.setTextColor(80, 80, 80);
            pdf.text('Aprovo a arte e autorizo a execução do serviço.', margin + 3, yPosition + 12);

            yPosition += 17;

            pdf.setDrawColor(180, 180, 180);
            pdf.text('Layout aprovado:', margin + 3, yPosition);
            pdf.line(margin + 35, yPosition, margin + 70, yPosition);

            yPosition += 7;
            pdf.text('Nome:', margin + 3, yPosition);
            pdf.line(margin + 18, yPosition, pageWidth - margin - 3, yPosition);

            yPosition += 7;
            pdf.text('Data:', margin + 3, yPosition);
            pdf.line(margin + 15, yPosition, margin + 50, yPosition);
            pdf.text('/', margin + 35, yPosition - 1);
            pdf.text('/', margin + 45, yPosition - 1);

            yPosition += 7;
            pdf.text('Assinatura:', margin + 3, yPosition);
            pdf.line(margin + 25, yPosition, pageWidth - margin - 3, yPosition);

            // Rodapé
            pdf.setFontSize(8);
            pdf.setTextColor(150, 150, 150);
            pdf.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, margin, pageHeight - 10);

            // Save PDF
            const fileName = `Layout_Aprovacao_${os.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.pdf`;
            pdf.save(fileName);

            toast.success('PDF gerado com sucesso!');
            onOpenChange(false);
        } catch (error) {
            console.error('Erro ao gerar PDF:', error);
            toast.error('Erro ao gerar PDF');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Gerar Layout de Aprovação
                    </DialogTitle>
                    <DialogDescription>
                        Configure as características do material para gerar o relatório de aprovação
                    </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                    {/* Material */}
                    <div className="space-y-2">
                        <Label htmlFor="material">Material *</Label>
                        <Select value={formData.material} onValueChange={(value) => handleInputChange('material', value)}>
                            <SelectTrigger id="material">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {MATERIALS.map((material) => (
                                    <SelectItem key={material} value={material}>
                                        {material}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Thickness */}
                    <div className="space-y-2">
                        <Label htmlFor="thickness">Espessura *</Label>
                        <Select value={formData.thickness} onValueChange={(value) => handleInputChange('thickness', value)}>
                            <SelectTrigger id="thickness">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {THICKNESSES.map((thickness) => (
                                    <SelectItem key={thickness} value={thickness}>
                                        {thickness}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Dimension */}
                    <div className="space-y-2">
                        <Label htmlFor="dimension">Dimensão</Label>
                        <Input
                            id="dimension"
                            value={formData.dimension}
                            onChange={(e) => handleInputChange('dimension', e.target.value)}
                            placeholder="Ex: 50 x 30mm"
                        />
                    </div>

                    {/* Rebite */}
                    <div className="space-y-2">
                        <Label htmlFor="rebite">Rebite</Label>
                        <Select value={formData.rebite} onValueChange={(value) => handleInputChange('rebite', value)}>
                            <SelectTrigger id="rebite">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sim">Sim</SelectItem>
                                <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Adhesive */}
                    <div className="space-y-2">
                        <Label htmlFor="adhesive">Adesivo</Label>
                        <Select value={formData.adhesive} onValueChange={(value) => handleInputChange('adhesive', value)}>
                            <SelectTrigger id="adhesive">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sim">Sim</SelectItem>
                                <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Bisnaga de Cola */}
                    <div className="space-y-2">
                        <Label htmlFor="bisnagaCola">Bisnaga de Cola</Label>
                        <Select value={formData.bisnagaCola} onValueChange={(value) => handleInputChange('bisnagaCola', value)}>
                            <SelectTrigger id="bisnagaCola">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Sim">Sim</SelectItem>
                                <SelectItem value="Não">Não</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Front Color */}
                    <div className="space-y-2">
                        <Label htmlFor="frontColor">Cor dados variáveis</Label>
                        <Input
                            id="frontColor"
                            value={formData.frontColor}
                            onChange={(e) => handleInputChange('frontColor', e.target.value)}
                            placeholder="Ex: Preto"
                        />
                    </div>

                    {/* Back Color */}
                    <div className="space-y-2">
                        <Label htmlFor="backColor">Cor do logo</Label>
                        <Input
                            id="backColor"
                            value={formData.backColor}
                            onChange={(e) => handleInputChange('backColor', e.target.value)}
                            placeholder="Ex: Colorido"
                        />
                    </div>

                    {/* Finish */}
                    <div className="space-y-2">
                        <Label htmlFor="finish">Acabamento</Label>
                        <Select value={formData.finish} onValueChange={(value) => handleInputChange('finish', value)}>
                            <SelectTrigger id="finish">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Brilhante">Brilhante</SelectItem>
                                <SelectItem value="Fosco">Fosco</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Print Type */}
                    <div className="space-y-2">
                        <Label htmlFor="printType">Padrão</Label>
                        <Input
                            id="printType"
                            value={formData.printType}
                            onChange={(e) => handleInputChange('printType', e.target.value)}
                            placeholder="Ex: laCoast128C"
                        />
                    </div>

                    {/* Number of Digits */}
                    <div className="space-y-2">
                        <Label htmlFor="numberOfDigits">Nº de dígitos</Label>
                        <Input
                            id="numberOfDigits"
                            type="number"
                            value={formData.numberOfDigits}
                            onChange={(e) => handleInputChange('numberOfDigits', e.target.value)}
                            placeholder="Ex: 6"
                        />
                    </div>

                    {/* Numerical Range */}
                    <div className="space-y-2">
                        <Label htmlFor="numericalRange">Faixa Numérica Inicial</Label>
                        <Input
                            id="numericalRange"
                            value={formData.numericalRange}
                            onChange={(e) => handleInputChange('numericalRange', e.target.value)}
                            placeholder="Ex: 000001"
                        />
                    </div>

                    {/* Quantity */}
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantidade</Label>
                        <Input
                            id="quantity"
                            type="number"
                            value={formData.quantity}
                            onChange={(e) => handleInputChange('quantity', e.target.value)}
                            placeholder="Ex: 1000"
                        />
                    </div>

                    {/* Observations */}
                    <div className="space-y-2 col-span-2">
                        <Label htmlFor="observations">Observações</Label>
                        <Textarea
                            id="observations"
                            value={formData.observations}
                            onChange={(e) => handleInputChange('observations', e.target.value)}
                            placeholder="Observações adicionais..."
                            rows={4}
                        />
                    </div>
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
                        Cancelar
                    </Button>
                    <Button onClick={generatePDF} disabled={isGenerating} className="gap-2">
                        {isGenerating ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Gerando...
                            </>
                        ) : (
                            <>
                                <FileText className="h-4 w-4" />
                                Gerar Layout
                            </>
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
