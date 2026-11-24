import { describe, expect, it } from 'vitest';
import type { Consumption, IndividualAccount } from '@/domain/entities';
import {
  accountTotal,
  buildGroupSummary,
  buildStats,
  calculateSubtotal,
  sumConsumptions,
  totalsPerUser,
} from '@/domain/services/totals';

function consumption(userId: string, productName: string, quantity: number, price: number, id: string): Consumption {
  return {
    id,
    accountId: 'acc1',
    groupId: 'g1',
    userId,
    productId: 'p1',
    productName,
    categoryId: 'cat-beer',
    quantity,
    unitPriceCents: price,
    subtotalCents: quantity * price,
    note: '',
    createdAt: '2026-11-20T20:00:00.000Z',
    updatedAt: '2026-11-20T20:00:00.000Z',
  };
}

describe('cálculo de totales', () => {
  it('calcula el subtotal y valida cantidades y precios', () => {
    expect(calculateSubtotal(3, 300)).toBe(900);
    expect(calculateSubtotal(0, 300)).toBe(0);
    expect(calculateSubtotal(-1, 300)).toBe(0);
    expect(calculateSubtotal(2, -5)).toBe(0);
    expect(calculateSubtotal(1.5, 100)).toBe(0);
  });

  it('el total del grupo es la suma de los totales individuales', () => {
    const items = [
      consumption('juan', 'Cerveza', 3, 300, 'c1'),
      consumption('juan', 'Hamburguesa', 1, 1200, 'c2'),
      consumption('pedro', 'Cerveza', 2, 300, 'c3'),
      consumption('pedro', 'Ración', 1, 800, 'c4'),
      consumption('maria', 'Refresco', 1, 300, 'c5'),
      consumption('maria', 'Cena', 1, 1500, 'c6'),
    ];
    const members = [
      { uid: 'juan', displayName: 'Juan' },
      { uid: 'pedro', displayName: 'Pedro' },
      { uid: 'maria', displayName: 'María' },
    ];
    const totals = totalsPerUser(items, members);
    expect(totals.map((t) => t.totalCents)).toEqual([2100, 1400, 1800]);
    const summary = buildGroupSummary('g1', 'Cena del sábado', items, members);
    expect(summary.totalCents).toBe(5300);
    expect(summary.totalCents).toBe(totals.map((t) => t.totalCents).reduce((a, b) => a + b, 0));
    expect(summary.consumptionCount).toBe(6);
  });

  it('el total de una cuenta individual coincide con sus consumiciones', () => {
    const items = [consumption('juan', 'Cerveza', 2, 300, 'c1'), consumption('juan', 'Agua', 1, 250, 'c2')];
    expect(accountTotal(items)).toBe(850);
  });

  it('calcula estadísticas semanales, mensuales y por categoría', () => {
    const items = [{ ...consumption('juan', 'Cerveza', 2, 300, 'c1'), createdAt: '2026-11-24T11:00:00.000Z' }];
    const account = { status: 'paid' } as IndividualAccount;
    const stats = buildStats(items, [account], new Date('2026-11-24T12:00:00.000Z'));
    expect(stats.weekCents).toBe(600);
    expect(stats.monthCents).toBe(600);
    expect(stats.averageCents).toBe(600);
    expect(stats.byCategory[0]?.totalCents).toBe(600);
    expect(stats.topProducts[0]).toEqual({ productName: 'Cerveza', count: 2 });
    expect(stats.outings).toBe(1);
  });

  it('no cuenta consumiciones duplicadas dos veces en el resumen', () => {
    const items = [consumption('juan', 'Cerveza', 1, 300, 'c1')];
    const summary = buildGroupSummary('g1', 'G', items, [{ uid: 'juan', displayName: 'Juan' }]);
    expect(summary.perUser[0]?.consumptionCount).toBe(1);
    expect(summary.totalCents).toBe(300);
  });
});
