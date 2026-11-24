import { describe, expect, it } from 'vitest';
import { centsToEuros, formatCents, parseEuroToCents, roundToCents } from '@/core/money';

describe('importes en céntimos', () => {
  it('parsea precios españoles con coma y punto', () => {
    expect(parseEuroToCents('3,50')).toBe(350);
    expect(parseEuroToCents('12.90')).toBe(1290);
    expect(parseEuroToCents('8')).toBe(800);
    expect(parseEuroToCents('0,05 €')).toBe(5);
  });

  it('rechaza entradas inválidas', () => {
    expect(parseEuroToCents('1,234')).toBeNull();
    expect(parseEuroToCents('abc')).toBeNull();
    expect(parseEuroToCents('-2')).toBeNull();
  });

  it('formatea con el estilo español', () => {
    // Intl es-ES no agrupa los números de 4 cifras (convención RAE).
    expect(formatCents(123450)).toBe('1234,50 €');
    expect(centsToEuros(350)).toBe(3.5);
    expect(roundToCents(3.4567)).toBe(346);
  });
});
