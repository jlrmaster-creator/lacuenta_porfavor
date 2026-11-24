import { Link, useParams } from 'react-router-dom';
import { Share2 } from 'lucide-react';
import { formatDate } from '@/core/date';
import { formatCents } from '@/core/money';
import { groupSummaryText, shareText } from '@/core/share';
import { buildGroupSummary } from '@/domain/services/totals';
import { Banner, Button, Card, Spinner, TotalDisplay } from '@/presentation/components/ui';
import { useGroup } from '@/state/hooks';

export function GroupSummaryScreen() {
  const { id } = useParams<{ id: string }>();
  const { group, members, consumptions, error } = useGroup(id);
  if (error) return <Banner>{error}</Banner>;
  if (!group) return <Spinner />;

  const summary = buildGroupSummary(group.id, group.name, consumptions, members, group.closedAt);
  const max = Math.max(...summary.perUser.map((u) => u.totalCents), 1);

  return (
    <div className="column">
      <TotalDisplay cents={summary.totalCents} label={group.closedAt ? 'Total final' : 'Total acumulado'} />
      <Card>
        <div className="row-between"><span className="muted">Grupo</span><strong>{group.name}</strong></div>
        <div className="row-between"><span className="muted">Inicio</span><strong>{formatDate(group.openedAt)}</strong></div>
        <div className="row-between"><span className="muted">Productos consumidos</span><strong>{summary.consumptionCount}</strong></div>
        <div className="row-between"><span className="muted">Estado</span><span className={`badge ${group.status === 'active' ? '' : 'danger'}`}>{group.status === 'active' ? 'Abierto' : 'Cerrado'}</span></div>
      </Card>

      <Card>
        <h2 className="card-title">Total por participante</h2>
        {summary.perUser.map((u) => (
          <div key={u.userId} className="mb-1">
            <div className="row-between small">
              <span>{u.displayName}</span>
              <strong>{formatCents(u.totalCents)} · {u.consumptionCount} uds.</strong>
            </div>
            <div className="bar"><span style={{ width: `${(u.totalCents / max) * 100}%` }} /></div>
          </div>
        ))}
      </Card>

      <Card>
        <h2 className="card-title">Detalle por participante</h2>
        {summary.perUser.map((u) => (
          <div key={u.userId} style={{ marginBottom: 12 }}>
            <strong>{u.displayName}</strong>
            {consumptions.filter((c) => c.userId === u.userId).map((c) => (
              <div key={c.id} className="row-between small">
                <span className="muted">{c.quantity} × {c.productName}</span>
                <span>{formatCents(c.subtotalCents)}</span>
              </div>
            ))}
          </div>
        ))}
      </Card>

      <Button block onClick={() => void shareText(groupSummaryText(group.name, summary.perUser, summary.totalCents, summary.consumptionCount))}>
        <Share2 size={16} /> Compartir resumen
      </Button>
      <Link to={`/groups/${group.id}`}><Button variant="secondary" block>Volver al grupo</Button></Link>
    </div>
  );
}
