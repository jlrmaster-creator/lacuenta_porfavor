import { z } from 'zod';
import { parseEuroToCents } from '@/core/money';

export const loginSchema = z.object({
  email: z.email('Introduce un correo válido'),
  password: z.string().min(6, 'Mínimo 6 caracteres'),
});

export const registerSchema = loginSchema.extend({
  displayName: z.string().trim().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
});

export const resetPasswordSchema = z.object({
  email: z.email('Introduce un correo válido'),
});

export const profileSchema = z.object({
  displayName: z.string().trim().min(2, 'Mínimo 2 caracteres').max(50, 'Máximo 50 caracteres'),
});

export const accountSchema = z.object({
  venueName: z.string().trim().max(80, 'Máximo 80 caracteres'),
});

/** El precio se valida como texto y se convierte a céntimos para evitar errores de coma flotante. */
export const consumptionSchema = z.object({
  productId: z.string().min(1, 'Selecciona un producto'),
  quantity: z.number().int().min(1, 'Mínimo 1').max(99, 'Máximo 99'),
  priceInput: z.string().regex(/^\d+([.,]\d{1,2})?$/, 'Precio no válido'),
  note: z.string().trim().max(200, 'Máximo 200 caracteres'),
});

export type ConsumptionForm = z.infer<typeof consumptionSchema>;

export function validatedUnitPriceCents(form: ConsumptionForm): number | null {
  return parseEuroToCents(form.priceInput);
}

export const productSchema = z.object({
  name: z.string().trim().min(1, 'Nombre obligatorio').max(60, 'Máximo 60 caracteres'),
  categoryId: z.string().min(1, 'Selecciona una categoría'),
  subcategory: z.string().trim().max(40, 'Máximo 40 caracteres'),
  suggestedPriceInput: z.union([z.literal(''), z.string().regex(/^\d+([.,]\d{1,2})?$/, 'Precio no válido')]),
  icon: z.string().max(8),
});

export type ProductForm = z.infer<typeof productSchema>;

export const categorySchema = z.object({
  name: z.string().trim().min(1, 'Nombre obligatorio').max(40, 'Máximo 40 caracteres'),
  kind: z.enum(['drink', 'food', 'other']),
  icon: z.string().max(8),
});

export type CategoryForm = z.infer<typeof categorySchema>;

export const groupSchema = z.object({
  name: z.string().trim().min(2, 'Mínimo 2 caracteres').max(60, 'Máximo 60 caracteres'),
});

export const invitationCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6,10}$/, 'El código debe tener entre 6 y 10 letras o números');

export function isValidQuantity(value: number): boolean {
  return Number.isInteger(value) && value >= 1 && value <= 99;
}

export function isValidPriceCents(value: number): boolean {
  return Number.isInteger(value) && value >= 0 && value <= 1_000_000;
}
