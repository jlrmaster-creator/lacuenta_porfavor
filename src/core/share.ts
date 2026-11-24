import { formatCents } from '@/core/money';

/** Comparte texto usando Web Share API o, si no está disponible, el portapapeles. */
export async function shareText(text: string): Promise<boolean> {
  if (navigator.share) {
    try {
      await navigator.share({ text });
      return true;
    } catch {
      return false;
    }
  }
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }
  return false;
}

export function individualSummaryText(
  venue: string,
  date: string,
  lines: { name: string; quantity: number; subtotalCents: number }[],
  totalCents: number,
): string {
  const body = lines.map((l) => `• ${l.quantity} × ${l.name}: ${formatCents(l.subtotalCents)}`).join('\n');
  return `La Cuenta Por Favor\n${venue || 'Consumo'}\n${date}\n\n${body}\n\nTotal: ${formatCents(totalCents)}`;
}

export function groupSummaryText(
  name: string,
  perUser: { displayName: string; totalCents: number; consumptionCount: number }[],
  totalCents: number,
  consumptionCount: number,
): string {
  const body = perUser
    .map((u) => `• ${u.displayName}: ${formatCents(u.totalCents)} (${u.consumptionCount} consumiciones)`)
    .join('\n');
  return `La Cuenta Por Favor — ${name}\n\n${body}\n\nTotal del grupo: ${formatCents(totalCents)}\nProductos consumidos: ${consumptionCount}`;
}
