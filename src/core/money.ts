import type { Cents } from '@/domain/entities';

const formatter = new Intl.NumberFormat('es-ES', {
  style: 'currency',
  currency: 'EUR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** Formatea céntimos como importe español: 1.234,50 € */
export function formatCents(cents: Cents): string {
  return formatter.format(cents / 100);
}

/** Convierte una entrada de texto en euros a céntimos enteros. Acepta "," y ".". */
export function parseEuroToCents(input: string): Cents | null {
  const normalized = input.trim().replace(/\s/g, '').replace(/€/g, '').replace(',', '.');
  if (!/^\d+(\.\d{1,2})?$/.test(normalized)) return null;
  const [euros, decimals = ''] = normalized.split('.');
  if (euros === undefined) return null;
  return Number(euros) * 100 + Number(decimals.padEnd(2, '0'));
}

/** Convierte un número (puede venir de una BD antigua) a céntimos redondeados. */
export function roundToCents(amount: number): Cents {
  return Math.round(amount * 100);
}

export function centsToEuros(cents: Cents): number {
  return cents / 100;
}
