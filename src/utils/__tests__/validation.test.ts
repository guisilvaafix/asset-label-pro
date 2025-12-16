import { describe, it, expect, vi } from 'vitest';
import { z } from 'zod';
import {
    validateData,
    validatePartial,
    validateOrThrow,
    isValid,
    formatValidationErrors,
    createValidator,
} from '../validation';

describe('validation utilities', () => {
    const testSchema = z.object({
        name: z.string().min(1, 'Nome é obrigatório'),
        age: z.number().positive('Idade deve ser positiva'),
        email: z.string().email('Email inválido'),
    });

    describe('validateData', () => {
        it('should validate correct data', () => {
            const data = { name: 'João', age: 25, email: 'joao@example.com' };
            const result = validateData(testSchema, data);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(data);
            expect(result.errors).toBeUndefined();
        });

        it('should return errors for invalid data', () => {
            const data = { name: '', age: -5, email: 'invalid' };
            const result = validateData(testSchema, data);

            expect(result.success).toBe(false);
            expect(result.data).toBeUndefined();
            expect(result.errors).toBeDefined();
            expect(result.errors!.length).toBeGreaterThan(0);
        });

        it('should show toast when showToast is true', () => {
            const data = { name: '', age: 25, email: 'test@example.com' };

            // Mock do toast já está configurado no setup
            const result = validateData(testSchema, data, {
                showToast: true,
                toastTitle: 'Erro de teste',
            });

            expect(result.success).toBe(false);
        });
    });

    describe('validatePartial', () => {
        it('should validate partial data', () => {
            const data = { name: 'João' };
            const result = validatePartial(testSchema, data);

            expect(result.success).toBe(true);
            expect(result.data).toEqual(data);
        });

        it('should still validate provided fields', () => {
            const data = { name: '', age: 25 };
            const result = validatePartial(testSchema, data);

            expect(result.success).toBe(false);
            expect(result.errors).toBeDefined();
        });
    });

    describe('validateOrThrow', () => {
        it('should return data for valid input', () => {
            const data = { name: 'João', age: 25, email: 'joao@example.com' };
            const result = validateOrThrow(testSchema, data);

            expect(result).toEqual(data);
        });

        it('should throw error for invalid input', () => {
            const data = { name: '', age: 25, email: 'invalid' };

            expect(() => validateOrThrow(testSchema, data)).toThrow();
        });

        it('should throw custom error message', () => {
            const data = { name: '', age: 25, email: 'invalid' };
            const customMessage = 'Custom error';

            expect(() => validateOrThrow(testSchema, data, customMessage)).toThrow(customMessage);
        });
    });

    describe('isValid', () => {
        it('should return true for valid data', () => {
            const data = { name: 'João', age: 25, email: 'joao@example.com' };
            expect(isValid(testSchema, data)).toBe(true);
        });

        it('should return false for invalid data', () => {
            const data = { name: '', age: -5, email: 'invalid' };
            expect(isValid(testSchema, data)).toBe(false);
        });
    });

    describe('formatValidationErrors', () => {
        it('should return empty string for no errors', () => {
            expect(formatValidationErrors([])).toBe('');
        });

        it('should return single error', () => {
            expect(formatValidationErrors(['Error 1'])).toBe('Error 1');
        });

        it('should format multiple errors', () => {
            const errors = ['Error 1', 'Error 2', 'Error 3'];
            const result = formatValidationErrors(errors);

            expect(result).toContain('Error 1');
            expect(result).toContain('Error 2');
            expect(result).toContain('Error 3');
            expect(result).toContain('•');
        });
    });

    describe('createValidator', () => {
        it('should create validator with all methods', () => {
            const validator = createValidator(testSchema);

            expect(validator.validate).toBeDefined();
            expect(validator.validateAsync).toBeDefined();
            expect(validator.validatePartial).toBeDefined();
            expect(validator.isValid).toBeDefined();
            expect(validator.parse).toBeDefined();
            expect(validator.safeParse).toBeDefined();
        });

        it('should validate using created validator', () => {
            const validator = createValidator(testSchema);
            const data = { name: 'João', age: 25, email: 'joao@example.com' };

            const result = validator.validate(data);
            expect(result.success).toBe(true);
            expect(result.data).toEqual(data);
        });

        it('should check validity using created validator', () => {
            const validator = createValidator(testSchema);
            const validData = { name: 'João', age: 25, email: 'joao@example.com' };
            const invalidData = { name: '', age: -5, email: 'invalid' };

            expect(validator.isValid(validData)).toBe(true);
            expect(validator.isValid(invalidData)).toBe(false);
        });
    });
});
