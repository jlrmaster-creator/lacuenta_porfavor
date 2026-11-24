import { formatCents } from '@/core/money';
import { Banner, Card, EmptyState } from '@/presentation/components/ui';
import { useCatalog, useUserStats } from '@/state/hooks';

export function StatsScreen() {
  const { stats, error } = useUserStats();
  const { categories } = useCatalog();
  const maxCategory = Math.max(...stats.byCategory.map((c) => c.totalCents), 1);

  if (error) return <Banner>{error}</Banner>;

  return (
    <div className="column">
      <div className="stat-grid">
        <div className="stat"><div className="muted small">Esta semana</div><div className="value">{formatCents(stats.weekCents)}</div></div>
        <div className="stat"><div className="muted small">Este mes</div><div className="value">{formatCents(stats.monthCents)}</div></div>
        <div className="stat"><div className="muted small">Media por salida</div><div className="value">{formatCents(stats.averageCents)}</div></div>
        <div className="stat"><div className="muted small">Salidas pagadas</div><div className="value">{stats.outings}</div></div>
      </div>

      <Card>
        <h2 className="card-title">Gasto por categoría</h2>
        {stats.byCategory.length === 0 ? <EmptyState title="Sin datos todavía" /> : stats.byCategory.map((c) => (
          <div key={c.categoryId} className="mb-1">
            <div className="row-between small">
              <span>{categories.find((x) => x.id === c.categoryId)?.name ?? 'Sin categoría'}</span>
              <strong>{formatCents(c.totalCents)} · {c.count} uds.</strong>
            </div>
            <div className="bar"><span style={{ width: `${(c.totalCents / maxCategory) * 100}%` }} /></div>
          </div>
        ))}
      </Card>

      <Card>
        <h2 className="card-title">Productos más consumidos</h2>
        {stats.topProducts.length === 0 ? <EmptyState title="Sin datos todavía" /> : stats.topProducts.map((p, i) => (
          <div className="row-between small" key={p.productName} style={{ padding: '6px 0' }}>
            <span>{i + 1}. {p.productName}</span>
            <strong>{p.count} uds.</strong>
          </div>
        ))}
      </Card>
    </div>
  );
}
