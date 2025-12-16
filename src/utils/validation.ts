import { z } from 'zod';
import { toast } from 'sonner';

/**
 * Resultado de validação
 */
export interface ValidationResult<T> {
    success: boolean;
    data?: T;
    errors?: string[];
}

/**
 * Valida dados com um schema Zod e retorna resultado estruturado
 */
export function validateData<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    options?: {
        showToast?: boolean;
        toastTitle?: string;
    }
): ValidationResult<T> {
    try {
        const validData = schema.parse(data);
        return {
            success: true,
            data: validData,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.errors.map(err => {
                const path = err.path.join('.');
                return path ? `${path}: ${err.message}` : err.message;
            });

            if (options?.showToast) {
                toast.error(options.toastTitle || 'Erro de validação', {
                    description: errors[0],
                });
            }

            return {
                success: false,
                errors,
            };
        }

        // Erro não esperado
        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

        if (options?.showToast) {
            toast.error('Erro de validação', {
                description: errorMessage,
            });
        }

        return {
            success: false,
            errors: [errorMessage],
        };
    }
}

/**
 * Valida dados de forma assíncrona
 */
export async function validateDataAsync<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    options?: {
        showToast?: boolean;
        toastTitle?: string;
    }
): Promise<ValidationResult<T>> {
    try {
        const validData = await schema.parseAsync(data);
        return {
            success: true,
            data: validData,
        };
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.errors.map(err => {
                const path = err.path.join('.');
                return path ? `${path}: ${err.message}` : err.message;
            });

            if (options?.showToast) {
                toast.error(options.toastTitle || 'Erro de validação', {
                    description: errors[0],
                });
            }

            return {
                success: false,
                errors,
            };
        }

        const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';

        if (options?.showToast) {
            toast.error('Erro de validação', {
                description: errorMessage,
            });
        }

        return {
            success: false,
            errors: [errorMessage],
        };
    }
}

/**
 * Valida parcialmente (permite campos opcionais ausentes)
 */
export function validatePartial<T extends z.ZodRawShape>(
    schema: z.ZodObject<T>,
    data: unknown,
    options?: {
        showToast?: boolean;
        toastTitle?: string;
    }
): ValidationResult<Partial<z.infer<z.ZodObject<T>>>> {
    return validateData(schema.partial(), data, options);
}

/**
 * Valida e retorna dados ou lança erro
 */
export function validateOrThrow<T>(
    schema: z.ZodSchema<T>,
    data: unknown,
    errorMessage?: string
): T {
    try {
        return schema.parse(data);
    } catch (error) {
        if (error instanceof z.ZodError) {
            const errors = error.errors.map(err => err.message).join(', ');
            throw new Error(errorMessage || `Validação falhou: ${errors}`);
        }
        throw error;
    }
}

/**
 * Verifica se os dados são válidos (retorna boolean)
 */
export function isValid<T>(
    schema: z.ZodSchema<T>,
    data: unknown
): data is T {
    return schema.safeParse(data).success;
}

/**
 * Formata erros de validação para exibição
 */
export function formatValidationErrors(errors: string[]): string {
    if (errors.length === 0) return '';
    if (errors.length === 1) return errors[0];
    return `• ${errors.join('\n• ')}`;
}

/**
 * Hook para validação em tempo real
 */
export function createValidator<T>(schema: z.ZodSchema<T>) {
    return {
        validate: (data: unknown) => validateData(schema, data),
        validateAsync: (data: unknown) => validateDataAsync(schema, data),
        validatePartial: (data: unknown) =>
            schema instanceof z.ZodObject
                ? validatePartial(schema as z.ZodObject<any>, data)
                : validateData(schema, data),
        isValid: (data: unknown): data is T => isValid(schema, data),
        parse: (data: unknown) => schema.parse(data),
        safeParse: (data: unknown) => schema.safeParse(data),
    };
}
