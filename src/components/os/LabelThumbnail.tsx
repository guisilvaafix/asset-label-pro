import { useEffect, useRef } from 'react';
import { LabelElement } from '@/types/label';
import { generateBarcode, generateQRCode, replaceDynamicFields } from '@/utils/barcodeGenerator';

interface LabelThumbnailProps {
    elements: LabelElement[];
    width?: number;
    height?: number;
    className?: string;
}

const MM_TO_PX = 3; // Escala menor para thumbnail

export function LabelThumbnail({ elements, width = 200, height = 120, className }: LabelThumbnailProps) {
    const canvasRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
        if (!elements || elements.length === 0) return;

        renderThumbnail();
    }, [elements, width, height]);

    const renderThumbnail = async () => {
        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = width;
        canvas.height = height;

        // Background branco
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);

        // Calcular escala para caber no thumbnail
        const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

        // Encontrar bounds dos elementos
        let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
        sortedElements.forEach(el => {
            minX = Math.min(minX, el.x);
            minY = Math.min(minY, el.y);
            maxX = Math.max(maxX, el.x + el.width);
            maxY = Math.max(maxY, el.y + el.height);
        });

        const contentWidth = (maxX - minX) * MM_TO_PX;
        const contentHeight = (maxY - minY) * MM_TO_PX;

        // Calcular escala para caber no canvas com padding
        const padding = 10;
        const scaleX = (width - padding * 2) / contentWidth;
        const scaleY = (height - padding * 2) / contentHeight;
        const scale = Math.min(scaleX, scaleY, 1); // Não aumentar, apenas reduzir

        // Centralizar
        const offsetX = (width - contentWidth * scale) / 2 - minX * MM_TO_PX * scale;
        const offsetY = (height - contentHeight * scale) / 2 - minY * MM_TO_PX * scale;

        ctx.save();
        ctx.translate(offsetX, offsetY);
        ctx.scale(scale, scale);

        // Renderizar elementos
        for (const element of sortedElements) {
            await renderElement(ctx, element);
        }

        ctx.restore();
    };

    const renderElement = async (ctx: CanvasRenderingContext2D, element: LabelElement) => {
        const elemX = element.x * MM_TO_PX;
        const elemY = element.y * MM_TO_PX;
        const elemWidth = element.width * MM_TO_PX;
        const elemHeight = element.height * MM_TO_PX;

        ctx.save();
        ctx.globalAlpha = element.opacity ?? 1;

        // Aplicar rotação se necessário
        if (element.rotation && element.rotation !== 0) {
            ctx.translate(elemX + elemWidth / 2, elemY + elemHeight / 2);
            ctx.rotate((element.rotation * Math.PI) / 180);
            ctx.translate(-(elemX + elemWidth / 2), -(elemY + elemHeight / 2));
        }

        switch (element.type) {
            case 'text': {
                // Usar padLength da customSequence ou padrão 6
                const padLength = element.customSequence?.padLength ?? 6;
                const numero = '1'.padStart(padLength, '0');

                const text = replaceDynamicFields(element.text || 'Texto', {
                    numero,
                    prefixo: element.customSequence?.prefix || '',
                    sufixo: element.customSequence?.suffix || '',
                    custom: {},
                });

                ctx.fillStyle = element.fill || '#000000';
                const fontSize = ((element.fontSize || 12) * MM_TO_PX) / 3.78;
                ctx.font = `${element.fontStyle === 'italic' ? 'italic ' : ''}${element.fontWeight === 'bold' ? 'bold ' : ''}${fontSize}px ${element.fontFamily || 'Arial'}`;
                ctx.textAlign = (element.textAlign as CanvasTextAlign) || 'left';
                ctx.textBaseline = 'top';

                if (element.stroke && element.strokeWidth) {
                    ctx.strokeStyle = element.stroke;
                    ctx.lineWidth = element.strokeWidth;
                    ctx.strokeText(text, elemX, elemY);
                }

                ctx.fillText(text, elemX, elemY);
                break;
            }

            case 'qrcode': {
                try {
                    // Usar padLength da customSequence ou padrão 6
                    const padLength = element.customSequence?.padLength ?? 6;
                    const numero = '1'.padStart(padLength, '0');

                    const qrValue = replaceDynamicFields(element.qrValue || 'SAMPLE', {
                        numero,
                        prefixo: element.customSequence?.prefix || '',
                        sufixo: element.customSequence?.suffix || '',
                        custom: {},
                    });

                    const dataUrl = await generateQRCode(qrValue, {
                        width: elemWidth,
                        errorCorrectionLevel: element.qrErrorLevel || 'M',
                        color: {
                            dark: element.qrForeground || '#000000',
                            light: element.qrBackground || '#ffffff',
                        },
                    });

                    const img = new Image();
                    await new Promise<void>((resolve) => {
                        img.onload = () => {
                            ctx.drawImage(img, elemX, elemY, elemWidth, elemHeight);
                            resolve();
                        };
                        img.onerror = () => resolve();
                        img.src = dataUrl;
                    });
                } catch (error) {
                    console.error('Error rendering QR code in thumbnail:', error);
                }
                break;
            }

            case 'barcode':
            case 'datamatrix':
            case 'pdf417': {
                try {
                    // Usar padLength da customSequence ou padrão 6
                    const padLength = element.customSequence?.padLength ?? 6;
                    const numero = '1'.padStart(padLength, '0');

                    const barcodeValue = replaceDynamicFields(element.barcodeValue || '123456789', {
                        numero,
                        prefixo: element.customSequence?.prefix || '',
                        sufixo: element.customSequence?.suffix || '',
                        custom: {},
                    });

                    const dataUrl = await generateBarcode(barcodeValue, element.barcodeType || 'CODE128', {
                        width: 2,
                        height: elemHeight * 0.8,
                        displayValue: false, // Não mostrar texto em thumbnail
                        fontSize: 10,
                    });

                    const img = new Image();
                    await new Promise<void>((resolve) => {
                        img.onload = () => {
                            ctx.drawImage(img, elemX, elemY, elemWidth, elemHeight);
                            resolve();
                        };
                        img.onerror = () => resolve();
                        img.src = dataUrl;
                    });
                } catch (error) {
                    console.error('Error rendering barcode in thumbnail:', error);
                }
                break;
            }

            case 'image': {
                if (element.src) {
                    const img = new Image();
                    await new Promise<void>((resolve) => {
                        img.onload = () => {
                            ctx.drawImage(img, elemX, elemY, elemWidth, elemHeight);
                            resolve();
                        };
                        img.onerror = () => resolve();
                        img.src = element.src!;
                    });
                }
                break;
            }

            case 'rectangle': {
                if (element.shapeFill && element.shapeFill !== 'transparent') {
                    ctx.fillStyle = element.shapeFill;
                    if (element.cornerRadius && element.cornerRadius > 0) {
                        const radius = element.cornerRadius * MM_TO_PX;
                        ctx.beginPath();
                        ctx.moveTo(elemX + radius, elemY);
                        ctx.lineTo(elemX + elemWidth - radius, elemY);
                        ctx.quadraticCurveTo(elemX + elemWidth, elemY, elemX + elemWidth, elemY + radius);
                        ctx.lineTo(elemX + elemWidth, elemY + elemHeight - radius);
                        ctx.quadraticCurveTo(elemX + elemWidth, elemY + elemHeight, elemX + elemWidth - radius, elemY + elemHeight);
                        ctx.lineTo(elemX + radius, elemY + elemHeight);
                        ctx.quadraticCurveTo(elemX, elemY + elemHeight, elemX, elemY + elemHeight - radius);
                        ctx.lineTo(elemX, elemY + radius);
                        ctx.quadraticCurveTo(elemX, elemY, elemX + radius, elemY);
                        ctx.closePath();
                        ctx.fill();
                    } else {
                        ctx.fillRect(elemX, elemY, elemWidth, elemHeight);
                    }
                }

                if (element.shapeStroke && element.shapeStrokeWidth) {
                    ctx.strokeStyle = element.shapeStroke;
                    ctx.lineWidth = (element.shapeStrokeWidth * MM_TO_PX) / 3.78;
                    if (element.cornerRadius && element.cornerRadius > 0) {
                        const radius = element.cornerRadius * MM_TO_PX;
                        ctx.beginPath();
                        ctx.moveTo(elemX + radius, elemY);
                        ctx.lineTo(elemX + elemWidth - radius, elemY);
                        ctx.quadraticCurveTo(elemX + elemWidth, elemY, elemX + elemWidth, elemY + radius);
                        ctx.lineTo(elemX + elemWidth, elemY + elemHeight - radius);
                        ctx.quadraticCurveTo(elemX + elemWidth, elemY + elemHeight, elemX + elemWidth - radius, elemY + elemHeight);
                        ctx.lineTo(elemX + radius, elemY + elemHeight);
                        ctx.quadraticCurveTo(elemX, elemY + elemHeight, elemX, elemY + elemHeight - radius);
                        ctx.lineTo(elemX, elemY + radius);
                        ctx.quadraticCurveTo(elemX, elemY, elemX + radius, elemY);
                        ctx.closePath();
                        ctx.stroke();
                    } else {
                        ctx.strokeRect(elemX, elemY, elemWidth, elemHeight);
                    }
                }
                break;
            }

            case 'circle': {
                ctx.beginPath();
                ctx.ellipse(elemX + elemWidth / 2, elemY + elemHeight / 2, elemWidth / 2, elemHeight / 2, 0, 0, Math.PI * 2);

                if (element.shapeFill && element.shapeFill !== 'transparent') {
                    ctx.fillStyle = element.shapeFill;
                    ctx.fill();
                }

                if (element.shapeStroke && element.shapeStrokeWidth) {
                    ctx.strokeStyle = element.shapeStroke;
                    ctx.lineWidth = (element.shapeStrokeWidth * MM_TO_PX) / 3.78;
                    ctx.stroke();
                }
                break;
            }

            case 'line': {
                ctx.beginPath();
                ctx.moveTo(elemX, elemY + elemHeight / 2);
                ctx.lineTo(elemX + elemWidth, elemY + elemHeight / 2);
                ctx.strokeStyle = element.shapeStroke || '#000000';
                ctx.lineWidth = ((element.shapeStrokeWidth || 1) * MM_TO_PX) / 3.78;
                ctx.stroke();
                break;
            }
        }

        ctx.restore();
    };

    if (!elements || elements.length === 0) {
        return (
            <div
                className={`flex items-center justify-center bg-muted rounded ${className}`}
                style={{ width, height }}
            >
                <div className="text-center text-muted-foreground text-xs">
                    <p>Sem elementos</p>
                </div>
            </div>
        );
    }

    return (
        <canvas
            ref={canvasRef}
            className={`rounded border border-border ${className}`}
            style={{ width, height }}
        />
    );
}
