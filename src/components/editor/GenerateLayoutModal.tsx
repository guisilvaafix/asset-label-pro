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
    const { elements, sheetConfig, sequentialConfig } = useLabelStore();
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
            const margin = 12;
            let yPosition = margin;

            // Paleta minimalista moderna
            const primary = [45, 55, 72];        // Cinza escuro azulado
            const secondary = [100, 116, 139];   // Cinza médio
            const accent = [59, 130, 246];       // Azul moderno
            const lightBg = [248, 250, 252];     // Cinza muito claro
            const border = [226, 232, 240];      // Borda suave

            // ===== HEADER MINIMALISTA (COMPACTO - 2 LINHAS) =====
            pdf.setFillColor(255, 255, 255);
            pdf.rect(0, 0, pageWidth, pageHeight, 'F');

            // LINHA 1: Logo + Data
            pdf.setFontSize(16);
            pdf.setTextColor(primary[0], primary[1], primary[2]);
            pdf.setFont(undefined, 'bold');
            pdf.text('AFIXGRAF', margin, yPosition + 4);

            // Data de geração (alinhada à direita)
            pdf.setFontSize(9);
            pdf.setTextColor(secondary[0], secondary[1], secondary[2]);
            pdf.setFont(undefined, 'normal');
            const dateText = new Date().toLocaleDateString('pt-BR');
            pdf.text(dateText, pageWidth - margin, yPosition + 4, { align: 'right' });

            yPosition += 9;

            // LINHA 2: Número da O.S. + Cliente (ambos em negrito, alinhados à esquerda)
            pdf.setFontSize(11);
            pdf.setTextColor(primary[0], primary[1], primary[2]);
            pdf.setFont(undefined, 'bold');
            const osNameWidth = pdf.getTextWidth(os.name);
            pdf.text(os.name, margin, yPosition + 3);

            if (os.clientCode && os.clientRazaoSocial) {
                const clientText = `${os.clientCode} - ${os.clientRazaoSocial}`;
                // Posicionar após o nome da O.S. com espaço adequado
                const clientX = margin + osNameWidth + 8;
                const maxWidth = pageWidth - margin - clientX;
                const truncatedClient = pdf.splitTextToSize(clientText, maxWidth)[0];
                pdf.text(truncatedClient, clientX, yPosition + 3);
            }

            yPosition += 8;

            // Linha divisória
            pdf.setDrawColor(border[0], border[1], border[2]);
            pdf.setLineWidth(0.3);
            pdf.line(margin, yPosition, pageWidth - margin, yPosition);

            yPosition += 10;

            // ===== RENDERIZAR ETIQUETA EM TAMANHO REAL =====
            const labelWidth = os?.config?.labelWidth || sheetConfig.labelWidth;
            const labelHeight = os?.config?.labelHeight || sheetConfig.labelHeight;

            // Título da seção
            pdf.setFontSize(10);
            pdf.setTextColor(primary[0], primary[1], primary[2]);
            pdf.setFont(undefined, 'bold');
            pdf.text('Preview da Etiqueta (Tamanho Real)', margin, yPosition);

            pdf.setFontSize(8);
            pdf.setTextColor(secondary[0], secondary[1], secondary[2]);
            pdf.setFont(undefined, 'normal');
            pdf.text(`Dimensões: ${labelWidth} × ${labelHeight} mm`, margin, yPosition + 4);

            yPosition += 10;

            // Calcular posição centralizada para a etiqueta
            const labelX = (pageWidth - labelWidth) / 2;
            const labelY = yPosition;

            // Fundo da etiqueta baseado no material
            const isAluminum = formData.material.toLowerCase().includes('alumínio') ||
                formData.material.toLowerCase().includes('aluminio');

            if (isAluminum) {
                pdf.setFillColor(245, 245, 245);
            } else {
                pdf.setFillColor(255, 255, 255);
            }
            pdf.roundedRect(labelX, labelY, labelWidth, labelHeight, 1.5, 1.5, 'F');

            // Borda da etiqueta
            pdf.setDrawColor(border[0], border[1], border[2]);
            pdf.setLineWidth(0.3);
            pdf.roundedRect(labelX, labelY, labelWidth, labelHeight, 1.5, 1.5, 'S');

            // Renderizar elementos da etiqueta
            const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

            for (const element of sortedElements) {
                const elemX = labelX + element.x;
                const elemY = labelY + element.y;

                pdf.saveGraphicsState();
                if (element.opacity < 1) {
                    pdf.setGState({ opacity: element.opacity });
                }

                try {
                    switch (element.type) {
                        case 'text': {
                            let text = element.text || '';
                            if (element.isDynamic) {
                                // Substituir campos dinâmicos com dados de exemplo
                                text = text.replace(/{PREFIXO}/g, sequentialConfig.prefix || '');
                                text = text.replace(/{NUMERO}/g, sequentialConfig.start.toString().padStart(sequentialConfig.padLength, '0'));
                                text = text.replace(/{SUFIXO}/g, sequentialConfig.suffix || '');
                            }

                            pdf.setFontSize(element.fontSize || 12);
                            pdf.setFont(undefined, element.fontWeight === 'bold' ? 'bold' : 'normal');

                            // Converter cor hex para RGB
                            const color = element.fill || '#000000';
                            const r = parseInt(color.slice(1, 3), 16);
                            const g = parseInt(color.slice(3, 5), 16);
                            const b = parseInt(color.slice(5, 7), 16);
                            pdf.setTextColor(r, g, b);

                            const textAlign = element.textAlign as 'left' | 'center' | 'right' || 'left';
                            let textX = elemX;
                            if (textAlign === 'center') {
                                textX = elemX + element.width / 2;
                            } else if (textAlign === 'right') {
                                textX = elemX + element.width;
                            }

                            pdf.text(text, textX, elemY + element.height / 2, {
                                align: textAlign,
                                baseline: 'middle'
                            });
                            break;
                        }

                        case 'qrcode': {
                            let value = element.qrValue || 'SAMPLE';
                            if (element.isDynamic) {
                                value = value.replace(/{PREFIXO}/g, sequentialConfig.prefix || '');
                                value = value.replace(/{NUMERO}/g, sequentialConfig.start.toString().padStart(sequentialConfig.padLength, '0'));
                                value = value.replace(/{SUFIXO}/g, sequentialConfig.suffix || '');
                            }

                            try {
                                const { generateQRCode } = await import('@/utils/barcodeGenerator');
                                const qrDataUrl = await generateQRCode(value, {
                                    width: Math.round(element.width * 10),
                                    errorCorrectionLevel: element.qrErrorLevel || 'M',
                                    color: {
                                        dark: element.qrForeground || '#000000',
                                        light: element.qrBackground || '#ffffff',
                                    },
                                });
                                pdf.addImage(qrDataUrl, 'PNG', elemX, elemY, element.width, element.height);
                            } catch (error) {
                                console.warn('Erro ao gerar QR code:', error);
                            }
                            break;
                        }

                        case 'barcode':
                        case 'datamatrix':
                        case 'pdf417': {
                            let value = element.barcodeValue || '000001';
                            if (element.isDynamic) {
                                value = value.replace(/{PREFIXO}/g, sequentialConfig.prefix || '');
                                value = value.replace(/{NUMERO}/g, sequentialConfig.start.toString().padStart(sequentialConfig.padLength, '0'));
                                value = value.replace(/{SUFIXO}/g, sequentialConfig.suffix || '');
                            }

                            try {
                                const { generateBarcode } = await import('@/utils/barcodeGenerator');
                                const barcodeType = element.type === 'datamatrix' ? 'DATAMATRIX' :
                                    element.type === 'pdf417' ? 'PDF417' :
                                        element.barcodeType || 'CODE128';

                                const barcodeDataUrl = await generateBarcode(value, barcodeType, {
                                    height: Math.round(element.height * 10),
                                    displayValue: element.displayValue !== false,
                                });
                                pdf.addImage(barcodeDataUrl, 'PNG', elemX, elemY, element.width, element.height);
                            } catch (error) {
                                console.warn('Erro ao gerar código de barras:', error);
                            }
                            break;
                        }

                        case 'image': {
                            if (element.src) {
                                try {
                                    // Verificar se é SVG
                                    const isSVG = element.src.includes('data:image/svg+xml') ||
                                        element.src.toLowerCase().includes('.svg');

                                    if (isSVG) {
                                        // SVG precisa ser convertido para PNG via canvas
                                        const img = new Image();
                                        img.src = element.src;

                                        await new Promise<void>((resolve, reject) => {
                                            img.onload = () => {
                                                try {
                                                    const canvas = document.createElement('canvas');
                                                    const scale = 3; // Alta resolução
                                                    canvas.width = element.width * 10 * scale;
                                                    canvas.height = element.height * 10 * scale;
                                                    const ctx = canvas.getContext('2d');

                                                    if (ctx) {
                                                        ctx.scale(scale, scale);
                                                        ctx.drawImage(img, 0, 0, element.width * 10, element.height * 10);
                                                        const pngDataUrl = canvas.toDataURL('image/png', 1.0);
                                                        pdf.addImage(pngDataUrl, 'PNG', elemX, elemY, element.width, element.height);
                                                    }
                                                    resolve();
                                                } catch (err) {
                                                    console.warn('Erro ao converter SVG:', err);
                                                    reject(err);
                                                }
                                            };
                                            img.onerror = () => {
                                                console.warn('Erro ao carregar SVG');
                                                reject(new Error('Failed to load SVG'));
                                            };
                                        });
                                    } else {
                                        // Para imagens raster (PNG, JPEG, WEBP)
                                        let format: 'PNG' | 'JPEG' | 'WEBP' = 'PNG';

                                        if (element.src.includes('data:image/jpeg') || element.src.includes('data:image/jpg')) {
                                            format = 'JPEG';
                                        } else if (element.src.includes('data:image/webp')) {
                                            format = 'WEBP';
                                        }

                                        pdf.addImage(element.src, format, elemX, elemY, element.width, element.height);
                                    }
                                } catch (error) {
                                    console.warn('Erro ao adicionar imagem:', error, element.src?.substring(0, 100));
                                    // Desenhar placeholder se falhar
                                    pdf.setDrawColor(200, 200, 200);
                                    pdf.setLineWidth(0.5);
                                    pdf.rect(elemX, elemY, element.width, element.height, 'S');
                                    pdf.setFontSize(6);
                                    pdf.setTextColor(150, 150, 150);
                                    pdf.text('[Imagem]', elemX + element.width / 2, elemY + element.height / 2, {
                                        align: 'center',
                                        baseline: 'middle'
                                    });
                                }
                            }
                            break;
                        }

                        case 'rectangle': {
                            if (element.shapeFill && element.shapeFill !== 'transparent') {
                                const fillColor = element.shapeFill;
                                const r = parseInt(fillColor.slice(1, 3), 16);
                                const g = parseInt(fillColor.slice(3, 5), 16);
                                const b = parseInt(fillColor.slice(5, 7), 16);
                                pdf.setFillColor(r, g, b);
                            }

                            if (element.shapeStroke && element.shapeStroke !== 'transparent') {
                                const strokeColor = element.shapeStroke;
                                const r = parseInt(strokeColor.slice(1, 3), 16);
                                const g = parseInt(strokeColor.slice(3, 5), 16);
                                const b = parseInt(strokeColor.slice(5, 7), 16);
                                pdf.setDrawColor(r, g, b);
                                pdf.setLineWidth(element.shapeStrokeWidth || 1);
                            }

                            const style = element.shapeFill && element.shapeFill !== 'transparent' ?
                                (element.shapeStroke && element.shapeStroke !== 'transparent' ? 'FD' : 'F') :
                                'S';

                            if (element.cornerRadius && element.cornerRadius > 0) {
                                pdf.roundedRect(elemX, elemY, element.width, element.height, element.cornerRadius, element.cornerRadius, style);
                            } else {
                                pdf.rect(elemX, elemY, element.width, element.height, style);
                            }
                            break;
                        }

                        case 'circle': {
                            const centerX = elemX + element.width / 2;
                            const centerY = elemY + element.height / 2;
                            const radiusX = element.width / 2;
                            const radiusY = element.height / 2;

                            if (element.shapeFill && element.shapeFill !== 'transparent') {
                                const fillColor = element.shapeFill;
                                const r = parseInt(fillColor.slice(1, 3), 16);
                                const g = parseInt(fillColor.slice(3, 5), 16);
                                const b = parseInt(fillColor.slice(5, 7), 16);
                                pdf.setFillColor(r, g, b);
                            }

                            if (element.shapeStroke && element.shapeStroke !== 'transparent') {
                                const strokeColor = element.shapeStroke;
                                const r = parseInt(strokeColor.slice(1, 3), 16);
                                const g = parseInt(strokeColor.slice(3, 5), 16);
                                const b = parseInt(strokeColor.slice(5, 7), 16);
                                pdf.setDrawColor(r, g, b);
                                pdf.setLineWidth(element.shapeStrokeWidth || 1);
                            }

                            const style = element.shapeFill && element.shapeFill !== 'transparent' ?
                                (element.shapeStroke && element.shapeStroke !== 'transparent' ? 'FD' : 'F') :
                                'S';

                            pdf.ellipse(centerX, centerY, radiusX, radiusY, style);
                            break;
                        }

                        case 'line': {
                            if (element.shapeStroke && element.shapeStroke !== 'transparent') {
                                const strokeColor = element.shapeStroke;
                                const r = parseInt(strokeColor.slice(1, 3), 16);
                                const g = parseInt(strokeColor.slice(3, 5), 16);
                                const b = parseInt(strokeColor.slice(5, 7), 16);
                                pdf.setDrawColor(r, g, b);
                                pdf.setLineWidth(element.shapeStrokeWidth || 1);
                            }
                            pdf.line(elemX, elemY, elemX + element.width, elemY);
                            break;
                        }
                    }
                } catch (error) {
                    console.warn(`Erro ao renderizar elemento ${element.type}:`, error);
                }

                pdf.restoreGraphicsState();
            }

            yPosition += labelHeight + 25;

            // ===== ESPECIFICAÇÕES TÉCNICAS (GRID MINIMALISTA) =====
            pdf.setFontSize(10);
            pdf.setTextColor(primary[0], primary[1], primary[2]);
            pdf.setFont(undefined, 'bold');
            pdf.text('Especificações Técnicas', margin, yPosition);

            yPosition += 8;

            // Grid de especificações
            const specs = [
                { label: 'Material', value: formData.material, highlight: true },
                { label: 'Espessura', value: `${formData.thickness}mm`, highlight: true },
                { label: 'Dimensão', value: formData.dimension, highlight: false },
                { label: 'Rebite', value: formData.rebite, highlight: formData.rebite === 'Sim' },
                { label: 'Adesivo', value: formData.adhesive, highlight: formData.adhesive === 'Sim' },
                { label: 'Bisnaga de Cola', value: formData.bisnagaCola, highlight: formData.bisnagaCola === 'Sim' },
                { label: 'Cor dados variáveis', value: formData.frontColor, highlight: false },
                { label: 'Cor do logo', value: formData.backColor, highlight: false },
                { label: 'Acabamento', value: formData.finish, highlight: false },
                { label: 'Padrão', value: formData.printType, highlight: false },
            ];

            const colWidth = (pageWidth - 2 * margin - 10) / 2;
            let specX = margin;
            let specY = yPosition;
            let col = 0;

            specs.forEach((spec, index) => {
                // Alternar colunas
                if (col === 2) {
                    col = 0;
                    specY += 12;
                    specX = margin;
                }

                // Label
                pdf.setFontSize(8);
                pdf.setTextColor(secondary[0], secondary[1], secondary[2]);
                pdf.setFont(undefined, 'normal');
                pdf.text(spec.label, specX, specY);

                // Value
                pdf.setFontSize(9);
                if (spec.highlight) {
                    pdf.setTextColor(accent[0], accent[1], accent[2]);
                    pdf.setFont(undefined, 'bold');
                } else {
                    pdf.setTextColor(primary[0], primary[1], primary[2]);
                    pdf.setFont(undefined, 'normal');
                }
                pdf.text(spec.value, specX, specY + 4);

                specX += colWidth + 5;
                col++;
            });

            yPosition = specY + 15;

            // ===== OBSERVAÇÕES =====
            if (formData.observations) {
                pdf.setFontSize(9);
                pdf.setTextColor(primary[0], primary[1], primary[2]);
                pdf.setFont(undefined, 'bold');
                pdf.text('Observações', margin, yPosition);
                yPosition += 5;

                pdf.setFontSize(9);
                pdf.setTextColor(secondary[0], secondary[1], secondary[2]);
                pdf.setFont(undefined, 'normal');
                const obsLines = pdf.splitTextToSize(formData.observations, pageWidth - 2 * margin);
                pdf.text(obsLines, margin, yPosition);
                yPosition += (obsLines.length * 4.5) + 8;
            } else {
                yPosition += 5;
            }

            // ===== ALERTA DE RESPONSABILIDADE =====
            const warningRed = [220, 53, 69];
            const lightRed = [254, 242, 242];

            pdf.setFillColor(lightRed[0], lightRed[1], lightRed[2]);
            pdf.setDrawColor(warningRed[0], warningRed[1], warningRed[2]);
            pdf.setLineWidth(0.5);
            pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 20, 2, 2, 'FD');

            pdf.setFontSize(9);
            pdf.setTextColor(warningRed[0], warningRed[1], warningRed[2]);
            pdf.setFont(undefined, 'bold');
            pdf.text('ATENÇÃO', margin + 4, yPosition + 6);

            pdf.setFontSize(8);
            pdf.setFont(undefined, 'normal');
            const disclaimerText = 'Este documento é de responsabilidade do cliente. Ao aprovar, o cliente se responsabiliza pela conferência de todas as informações.';
            const disclaimerLines = pdf.splitTextToSize(disclaimerText, pageWidth - 2 * margin - 8);
            pdf.text(disclaimerLines, margin + 4, yPosition + 11);

            yPosition += 25;

            // ===== FAIXA NUMÉRICA (DESTAQUE) =====
            pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
            pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 18, 2, 2, 'F');

            pdf.setFontSize(9);
            pdf.setTextColor(secondary[0], secondary[1], secondary[2]);
            pdf.setFont(undefined, 'normal');
            pdf.text('Faixa Numérica', margin + 4, yPosition + 5);

            pdf.setFontSize(11);
            pdf.setTextColor(primary[0], primary[1], primary[2]);
            pdf.setFont(undefined, 'bold');
            const finalNumber = (parseInt(formData.numericalRange) + parseInt(formData.quantity) - 1).toString().padStart(formData.numericalRange.length, '0');
            pdf.text(`${formData.numericalRange} até ${finalNumber}`, margin + 4, yPosition + 10);

            pdf.setFontSize(9);
            pdf.setTextColor(secondary[0], secondary[1], secondary[2]);
            pdf.setFont(undefined, 'normal');
            pdf.text(`Quantidade: ${formData.quantity} unidades`, margin + 4, yPosition + 15);

            yPosition += 23;

            // ===== APROVAÇÃO (MINIMALISTA) =====
            pdf.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
            pdf.roundedRect(margin, yPosition, pageWidth - 2 * margin, 40, 2, 2, 'F');

            pdf.setFontSize(10);
            pdf.setTextColor(primary[0], primary[1], primary[2]);
            pdf.setFont(undefined, 'bold');
            pdf.text('Aprovação do Cliente', margin + 4, yPosition + 6);

            pdf.setFontSize(8);
            pdf.setTextColor(secondary[0], secondary[1], secondary[2]);
            pdf.setFont(undefined, 'normal');
            pdf.text('Aprovo a arte e autorizo a execução do serviço conforme especificações acima.', margin + 4, yPosition + 11);

            yPosition += 17;

            // Campos de assinatura
            pdf.setDrawColor(border[0], border[1], border[2]);
            pdf.setLineWidth(0.3);

            pdf.setFontSize(8);
            pdf.setTextColor(secondary[0], secondary[1], secondary[2]);

            pdf.text('Nome:', margin + 4, yPosition);
            pdf.line(margin + 18, yPosition, pageWidth - margin - 4, yPosition);

            yPosition += 8;
            pdf.text('Data:', margin + 4, yPosition);
            pdf.line(margin + 15, yPosition, margin + 45, yPosition);
            pdf.text('___/___/______', margin + 16, yPosition - 1);

            pdf.text('Assinatura:', pageWidth / 2, yPosition);
            pdf.line(pageWidth / 2 + 18, yPosition, pageWidth - margin - 4, yPosition);

            // ===== RODAPÉ =====
            pdf.setFontSize(7);
            pdf.setTextColor(secondary[0], secondary[1], secondary[2]);
            pdf.text(`Gerado em ${new Date().toLocaleString('pt-BR')}`, margin, pageHeight - 8);

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
