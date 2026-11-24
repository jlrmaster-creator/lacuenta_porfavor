import type { Cents, Consumption, GroupSummary, IndividualAccount, StatsSummary, UserTotals } from '@/domain/entities';
import { isWithinMonth, isWithinWeek } from '@/core/date';

/** Subtotal exacto en céntimos. Se usa tanto en la app como en las reglas de Firestore. */
export function calculateSubtotal(quantity: number, unitPriceCents: Cents): Cents {
  if (!Number.isInteger(quantity) || quantity <= 0) return 0;
  if (!Number.isInteger(unitPriceCents) || unitPriceCents < 0) return 0;
  return quantity * unitPriceCents;
}

export function sumConsumptions(consumptions: Consumption[]): Cents {
  return consumptions.reduce((total, item) => total + item.subtotalCents, 0);
}

export function accountTotal(consumptions: Consumption[]): Cents {
  return sumConsumptions(consumptions);
}

export function totalsPerUser(
  consumptions: Consumption[],
  members: { uid: string; displayName: string }[],
): UserTotals[] {
  const byUser = new Map<string, { total: Cents; count: number }>();
  for (const item of consumptions) {
    const current = byUser.get(item.userId) ?? { total: 0, count: 0 };
    byUser.set(item.userId, { total: current.total + item.subtotalCents, count: current.count + 1 });
  }
  return members.map((member) => ({
    userId: member.uid,
    displayName: member.displayName,
    totalCents: byUser.get(member.uid)?.total ?? 0,
    consumptionCount: byUser.get(member.uid)?.count ?? 0,
  }));
}

export function buildGroupSummary(
  groupId: string,
  groupName: string,
  consumptions: Consumption[],
  members: { uid: string; displayName: string }[],
  closedAt: string | null = null,
): GroupSummary {
  return {
    groupId,
    groupName,
    totalCents: sumConsumptions(consumptions),
    consumptionCount: consumptions.length,
    perUser: totalsPerUser(consumptions, members),
    closedAt,
  };
}

/** Totales de un usuario a partir de todas sus consumiciones (individuales y de grupo). */
export function buildStats(
  consumptions: Consumption[],
  accounts: IndividualAccount[],
  now = new Date(),
): StatsSummary {
  const inWeek = consumptions.filter((c) => isWithinWeek(c.createdAt, now));
  const inMonth = consumptions.filter((c) => isWithinMonth(c.createdAt, now));
  const closedOutings = accounts.filter((a) => a.status === 'paid').length;

  const byCategory = new Map<string, { totalCents: Cents; count: number }>();
  const byProduct = new Map<string, number>();
  for (const c of consumptions) {
    const cat = byCategory.get(c.categoryId) ?? { totalCents: 0, count: 0 };
    byCategory.set(c.categoryId, { totalCents: cat.totalCents + c.subtotalCents, count: cat.count + c.quantity });
    byProduct.set(c.productName, (byProduct.get(c.productName) ?? 0) + c.quantity);
  }

  const weekCents = sumConsumptions(inWeek);
  return {
    weekCents,
    monthCents: sumConsumptions(inMonth),
    averageCents: closedOutings > 0 ? Math.round(sumConsumptions(consumptions) / closedOutings) : 0,
    byCategory: [...byCategory.entries()].map(([categoryId, v]) => ({ categoryId, ...v })),
    topProducts: [...byProduct.entries()]
      .map(([productName, count]) => ({ productName, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
    outings: closedOutings,
  };
}
