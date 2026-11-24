import { describe, expect, it } from 'vitest';
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } from '@/domain/services/catalog';
import {
  accountSchema,
  categorySchema,
  consumptionSchema,
  groupSchema,
  invitationCodeSchema,
  isValidPriceCents,
  isValidQuantity,
  productSchema,
  validatedUnitPriceCents,
} from '@/domain/services/validators';

describe('validaciones', () => {
  it('valida credenciales y nombres', () => {
    expect(accountSchema.safeParse({ venueName: 'Bar Centro' }).success).toBe(true);
    expect(accountSchema.safeParse({ venueName: 'x'.repeat(81) }).success).toBe(false);
    expect(groupSchema.safeParse({ name: 'Cena' }).success).toBe(true);
    expect(groupSchema.safeParse({ name: 'x' }).success).toBe(false);
  });

  it('valida cantidades y precios de consumiciones', () => {
    const valid = { productId: 'p1', quantity: 2, priceInput: '3,50', note: '' };
    expect(consumptionSchema.safeParse(valid).success).toBe(true);
    expect(validatedUnitPriceCents(valid)).toBe(350);
    expect(consumptionSchema.safeParse({ ...valid, quantity: 0 }).success).toBe(false);
    expect(consumptionSchema.safeParse({ ...valid, priceInput: 'abc' }).success).toBe(false);
    expect(isValidQuantity(1)).toBe(true);
    expect(isValidQuantity(100)).toBe(false);
    expect(isValidPriceCents(350)).toBe(true);
    expect(isValidPriceCents(-1)).toBe(false);
  });

  it('valida códigos de invitación', () => {
    expect(invitationCodeSchema.safeParse('abc12345').success).toBe(true);
    expect(invitationCodeSchema.safeParse('ABC').success).toBe(false);
    expect(invitationCodeSchema.safeParse('ABC-1234').success).toBe(false);
  });

  it('valida productos y categorías', () => {
    expect(productSchema.safeParse({ name: 'Caña', categoryId: 'c1', subcategory: '', suggestedPriceInput: '', icon: '🍺' }).success).toBe(true);
    expect(categorySchema.safeParse({ name: 'Bebidas', kind: 'drink', icon: '🍺' }).success).toBe(true);
    expect(categorySchema.safeParse({ name: '', kind: 'drink', icon: '🍺' }).success).toBe(false);
  });

  it('el catálogo base contiene todos los productos del enunciado', () => {
    const expected = [
      'Cerveza', 'Caña', 'Doble', 'Tercio', 'Botellín', 'Vino', 'Copa de vino', 'Refrescos', 'Agua',
      'Café', 'Infusiones', 'Copas', 'Cócteles', 'Otras bebidas', 'Tapas', 'Raciones', 'Bocadillos',
      'Hamburguesas', 'Sándwiches', 'Aperitivos', 'Postres', 'Otros alimentos',
    ];
    expect(DEFAULT_PRODUCTS.map((p) => p.name)).toEqual(expected);
    expect(DEFAULT_CATEGORIES.length).toBeGreaterThanOrEqual(10);
    expect(DEFAULT_PRODUCTS.every((p) => p.suggestedPriceCents === null)).toBe(true);
  });
});
