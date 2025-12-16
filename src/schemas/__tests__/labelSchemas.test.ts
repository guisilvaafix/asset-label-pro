import { describe, it, expect } from 'vitest';
import {
    sequentialConfigSchema,
    sheetConfigSchema,
    textElementSchema,
    qrCodeElementSchema,
    barcodeElementSchema,
    imageElementSchema,
    shapeElementSchema,
    labelElementSchema,
} from '../labelSchemas';

describe('Label Schemas', () => {
    describe('sequentialConfigSchema', () => {
        it('should validate correct sequential config', () => {
            const config = {
                start: 1,
                end: 100,
                step: 1,
                prefix: 'PAT-',
                suffix: '',
                padLength: 6,
            };

            expect(() => sequentialConfigSchema.parse(config)).not.toThrow();
        });

        it('should reject when end < start', () => {
            const config = {
                start: 100,
                end: 1,
                step: 1,
                prefix: '',
                suffix: '',
                padLength: 0,
            };

            expect(() => sequentialConfigSchema.parse(config)).toThrow();
        });

        it('should reject negative start', () => {
            const config = {
                start: -1,
                end: 100,
                step: 1,
                prefix: '',
                suffix: '',
                padLength: 0,
            };

            expect(() => sequentialConfigSchema.parse(config)).toThrow();
        });

        it('should reject step <= 0', () => {
            const config = {
                start: 1,
                end: 100,
                step: 0,
                prefix: '',
                suffix: '',
                padLength: 0,
            };

            expect(() => sequentialConfigSchema.parse(config)).toThrow();
        });
    });

    describe('sheetConfigSchema', () => {
        it('should validate correct sheet config', () => {
            const config = {
                paperSize: 'A4',
                customWidth: 210,
                customHeight: 297,
                labelWidth: 50,
                labelHeight: 30,
                columns: 4,
                rows: 8,
                marginTop: 10,
                marginBottom: 10,
                marginLeft: 10,
                marginRight: 10,
                spacingHorizontal: 2,
                spacingVertical: 2,
                autoCalculate: false,
            };

            expect(() => sheetConfigSchema.parse(config)).not.toThrow();
        });

        it('should reject negative dimensions', () => {
            const config = {
                paperSize: 'A4',
                customWidth: -210,
                customHeight: 297,
                labelWidth: 50,
                labelHeight: 30,
                columns: 4,
                rows: 8,
                marginTop: 10,
                marginBottom: 10,
                marginLeft: 10,
                marginRight: 10,
                spacingHorizontal: 2,
                spacingVertical: 2,
            };

            expect(() => sheetConfigSchema.parse(config)).toThrow();
        });

        it('should reject too many columns', () => {
            const config = {
                paperSize: 'A4',
                customWidth: 210,
                customHeight: 297,
                labelWidth: 50,
                labelHeight: 30,
                columns: 100,
                rows: 8,
                marginTop: 10,
                marginBottom: 10,
                marginLeft: 10,
                marginRight: 10,
                spacingHorizontal: 2,
                spacingVertical: 2,
            };

            expect(() => sheetConfigSchema.parse(config)).toThrow();
        });
    });

    describe('textElementSchema', () => {
        it('should validate correct text element', () => {
            const element = {
                id: 'text-1',
                type: 'text' as const,
                x: 10,
                y: 10,
                width: 100,
                height: 20,
                text: 'Hello World',
                fontSize: 12,
                fontFamily: 'Arial',
                fill: '#000000',
            };

            expect(() => textElementSchema.parse(element)).not.toThrow();
        });

        it('should reject invalid color', () => {
            const element = {
                id: 'text-1',
                type: 'text' as const,
                x: 10,
                y: 10,
                width: 100,
                height: 20,
                text: 'Hello',
                fill: 'invalid-color',
            };

            expect(() => textElementSchema.parse(element)).toThrow();
        });

        it('should reject negative position', () => {
            const element = {
                id: 'text-1',
                type: 'text' as const,
                x: -10,
                y: 10,
                width: 100,
                height: 20,
                text: 'Hello',
            };

            expect(() => textElementSchema.parse(element)).toThrow();
        });
    });

    describe('qrCodeElementSchema', () => {
        it('should validate correct QR code element', () => {
            const element = {
                id: 'qr-1',
                type: 'qrcode' as const,
                x: 10,
                y: 10,
                width: 50,
                height: 50,
                qrValue: 'https://example.com',
                qrErrorLevel: 'M' as const,
            };

            expect(() => qrCodeElementSchema.parse(element)).not.toThrow();
        });

        it('should reject empty QR value', () => {
            const element = {
                id: 'qr-1',
                type: 'qrcode' as const,
                x: 10,
                y: 10,
                width: 50,
                height: 50,
                qrValue: '',
            };

            expect(() => qrCodeElementSchema.parse(element)).toThrow();
        });

        it('should reject invalid error level', () => {
            const element = {
                id: 'qr-1',
                type: 'qrcode' as const,
                x: 10,
                y: 10,
                width: 50,
                height: 50,
                qrValue: 'test',
                qrErrorLevel: 'X' as any,
            };

            expect(() => qrCodeElementSchema.parse(element)).toThrow();
        });
    });

    describe('barcodeElementSchema', () => {
        it('should validate correct barcode element', () => {
            const element = {
                id: 'barcode-1',
                type: 'barcode' as const,
                x: 10,
                y: 10,
                width: 100,
                height: 30,
                barcodeValue: '123456789',
                barcodeType: 'CODE128',
            };

            expect(() => barcodeElementSchema.parse(element)).not.toThrow();
        });

        it('should reject empty barcode value', () => {
            const element = {
                id: 'barcode-1',
                type: 'barcode' as const,
                x: 10,
                y: 10,
                width: 100,
                height: 30,
                barcodeValue: '',
            };

            expect(() => barcodeElementSchema.parse(element)).toThrow();
        });
    });

    describe('imageElementSchema', () => {
        it('should validate correct image element with URL', () => {
            const element = {
                id: 'image-1',
                type: 'image' as const,
                x: 10,
                y: 10,
                width: 100,
                height: 100,
                src: 'https://example.com/image.png',
            };

            expect(() => imageElementSchema.parse(element)).not.toThrow();
        });

        it('should validate correct image element with data URL', () => {
            const element = {
                id: 'image-1',
                type: 'image' as const,
                x: 10,
                y: 10,
                width: 100,
                height: 100,
                src: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
            };

            expect(() => imageElementSchema.parse(element)).not.toThrow();
        });

        it('should reject invalid image URL', () => {
            const element = {
                id: 'image-1',
                type: 'image' as const,
                x: 10,
                y: 10,
                width: 100,
                height: 100,
                src: 'invalid-url',
            };

            expect(() => imageElementSchema.parse(element)).toThrow();
        });
    });

    describe('shapeElementSchema', () => {
        it('should validate correct shape element', () => {
            const element = {
                id: 'shape-1',
                type: 'rectangle' as const,
                x: 10,
                y: 10,
                width: 100,
                height: 50,
                shapeFill: '#FF0000',
                shapeStroke: '#000000',
                shapeStrokeWidth: 2,
            };

            expect(() => shapeElementSchema.parse(element)).not.toThrow();
        });

        it('should accept transparent fill', () => {
            const element = {
                id: 'shape-1',
                type: 'rectangle' as const,
                x: 10,
                y: 10,
                width: 100,
                height: 50,
                shapeFill: 'transparent',
            };

            expect(() => shapeElementSchema.parse(element)).not.toThrow();
        });
    });

    describe('labelElementSchema (discriminated union)', () => {
        it('should validate text element', () => {
            const element = {
                id: 'text-1',
                type: 'text' as const,
                x: 10,
                y: 10,
                width: 100,
                height: 20,
                text: 'Test',
            };

            expect(() => labelElementSchema.parse(element)).not.toThrow();
        });

        it('should validate QR code element', () => {
            const element = {
                id: 'qr-1',
                type: 'qrcode' as const,
                x: 10,
                y: 10,
                width: 50,
                height: 50,
                qrValue: 'test',
            };

            expect(() => labelElementSchema.parse(element)).not.toThrow();
        });

        it('should reject invalid element type', () => {
            const element = {
                id: 'invalid-1',
                type: 'invalid' as any,
                x: 10,
                y: 10,
                width: 100,
                height: 20,
            };

            expect(() => labelElementSchema.parse(element)).toThrow();
        });

        it('should reject element with missing required fields', () => {
            const element = {
                id: 'text-1',
                type: 'text' as const,
                x: 10,
                y: 10,
                // missing width and height
            };

            expect(() => labelElementSchema.parse(element)).toThrow();
        });
    });
});
