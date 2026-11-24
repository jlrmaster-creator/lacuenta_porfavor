import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { LockKeyhole, ReceiptText, Share2 } from 'lucide-react';
import type { Consumption } from '@/domain/entities';
import type { NewConsumptionInput } from '@/domain/ports';
import { formatDateTime } from '@/core/date';
import { formatCents } from '@/core/money';
import { shareText } from '@/core/share';
import { roleLabel } from '@/domain/services/permissions';
import { totalsPerUser } from '@/domain/services/totals';
import { ConsumptionFormSheet } from '@/presentation/components/ConsumptionFormSheet';
import { ConsumptionList, QuickAddRow } from '@/presentation/components/ConsumptionList';
import { Banner, Button, Card, Spinner, TotalDisplay } from '@/presentation/components/ui';
import { useAction, useAuth, useCatalog, useGroup } from '@/state/hooks';
import { groupsRepository } from '@/state/repositories';

export function GroupDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { group, members, consumptions, activity, error } = useGroup(id);
  const { products, categories } = useCatalog();
  const { run, pending } = useAction();
  const [sheet, setSheet] = useState<Consumption | 'new' | null>(null);

  if (error) return <Banner>{error}</Banner>;
  if (!group) return <Spinner />;

  const membership = members.find((m) => m.uid === user?.uid) ?? null;
  const isAdmin = membership?.role === 'admin';
  const active = group.status === 'active';
  const memberNames = Object.fromEntries(members.map((m) => [m.uid, m.displayName]));
  const totals = totalsPerUser(consumptions, members);
  const maxTotal = Math.max(...totals.map((t) => t.totalCents), 1);

  const submit = async (input: NewConsumptionInput) => {
    if (!user || !sheet) return;
    if (sheet === 'new') {
      await run(() => groupsRepository.addConsumption(user.uid, group.id, input), 'Consumición añadida');
    } else if (sheet.userId === user.uid) {
      await run(() => groupsRepository.updateConsumption(user.uid, group.id, sheet, input), 'Consumición actualizada');
    } else if (isAdmin) {
      await run(() => groupsRepository.correctConsumption(user.uid, group.id, sheet, input), 'Corrección registrada en el historial');
    }
    setSheet(null);
  };

  const close = async () => {
    if (!user) return;
    await run(() => groupsRepository.closeGroup(user.uid, group.id), 'Cuenta del grupo cerrada');
  };

  return (
    <div className="column">
      <TotalDisplay cents={group.totalCents} label={active ? 'Total del grupo' : 'Total final del grupo'} />
      <div className="row-between">
        <span className="muted">Desde {formatDateTime(group.openedAt)}</span>
        <span className={`badge ${active ? '' : 'danger'}`}>{active ? 'Activo' : 'Cerrado'}</span>
      </div>

      <Card>
        <div className="row-between">
          <h2 className="card-title" style={{ margin: 0 }}>Invitación</h2>
          <span className="badge">{members.length} miembros</span>
        </div>
        <div className="code-box">{group.inviteCode}</div>
        <Button
          variant="secondary"
          block
          onClick={() => void shareText(`Únete a "${group.name}" en La Cuenta Por Favor con el código ${group.inviteCode}`)}
        >
          <Share2 size={16} /> Compartir código
        </Button>
        <div className="divider" />
        {members.map((m) => (
          <div className="row-between small" key={m.uid} style={{ padding: '6px 0' }}>
            <span>{m.displayName}{m.uid === user?.uid ? ' (tú)' : ''}</span>
            <span className={`badge ${m.role === 'admin' ? '' : 'danger'}`}>{roleLabel(m.role)}</span>
          </div>
        ))}
      </Card>

      {isAdmin ? (
        <Card>
          <h2 className="card-title">Panel del administrador</h2>
          {totals.map((t) => (
            <div key={t.userId} className="mb-1">
              <div className="row-between small">
                <span>{t.displayName}{t.userId === user?.uid ? ' (tú)' : ''}</span>
                <strong>{formatCents(t.totalCents)} · {t.consumptionCount}</strong>
              </div>
              <div className="bar"><span style={{ width: `${(t.totalCents / maxTotal) * 100}%` }} /></div>
            </div>
          ))}
          <div className="divider" />
          <p className="muted small">Consumiciones totales: {consumptions.length}</p>
          {active ? (
            <Button variant="danger" block onClick={() => void close()} loading={pending}>
              <LockKeyhole size={16} /> Cerrar cuenta del grupo
            </Button>
          ) : (
            <Banner>El grupo está cerrado. El resumen es definitivo.</Banner>
          )}
        </Card>
      ) : null}

      {active && membership ? (
        <>
          <Button block size="lg" onClick={() => setSheet('new')}>+ Añadir mi consumición</Button>
          <div>
            <p className="muted small">Añadir rápido</p>
            <QuickAddRow
              products={products}
              consumptions={consumptions}
              onAdd={(p) => {
                if (!user) return;
                const last = consumptions.filter((c) => c.userId === user.uid && c.productId === p.id).at(-1);
                const cents = last?.unitPriceCents ?? p.suggestedPriceCents ?? 0;
                if (cents === 0) {
                  setSheet({
                    id: '', accountId: null, groupId: group.id, userId: user.uid, productId: p.id, productName: p.name,
                    categoryId: p.categoryId, quantity: 1, unitPriceCents: 0, subtotalCents: 0, note: '',
                    createdAt: '', updatedAt: '',
                  });
                  return;
                }
                void run(() => groupsRepository.addConsumption(user.uid, group.id, {
                  productId: p.id, productName: p.name, categoryId: p.categoryId,
                  quantity: 1, unitPriceCents: cents, note: '',
                }), `${p.name} añadida`);
              }}
            />
          </div>
        </>
      ) : null}

      <Card>
        <div className="row-between">
          <h2 className="card-title" style={{ margin: 0 }}>Consumiciones</h2>
          <span className="badge">{consumptions.length}</span>
        </div>
        <div className="divider" />
        <ConsumptionList
          consumptions={consumptions}
          products={products}
          memberNames={memberNames}
          editable={(c) => active && !!user && (c.userId === user.uid || isAdmin)}
          onEdit={(c) => setSheet(c)}
          onDelete={(c) => {
            if (user && c.userId === user.uid && window.confirm('¿Eliminar esta consumición?')) {
              void run(() => groupsRepository.deleteConsumption(user.uid, group.id, c), 'Consumición eliminada');
            }
          }}
        />
      </Card>

      <Link to={`/groups/${group.id}/summary`}><button className="btn btn-primary btn-lg btn-block"><ReceiptText size={18} /> Ver resumen</button></Link>

      {activity.length > 0 ? (
        <Card>
          <h2 className="card-title">Historial de movimientos</h2>
          {[...activity].reverse().map((log) => (
            <div key={log.id} className="row-between small">
              <span className="muted">{log.details}</span>
              <span>{formatDateTime(log.createdAt)}</span>
            </div>
          ))}
        </Card>
      ) : null}

      {sheet ? (
        <ConsumptionFormSheet
          products={products}
          categories={categories}
          initial={sheet === 'new' ? undefined : {
            productId: sheet.productId,
            productName: sheet.productName,
            categoryId: sheet.categoryId,
            quantity: sheet.quantity,
            unitPriceCents: sheet.unitPriceCents,
            note: sheet.note,
          }}
          title={sheet === 'new' || sheet.userId === user?.uid ? 'Añadir/Editar mi consumición' : 'Corregir consumición (quedará registrado)'}
          onSubmit={submit}
          onClose={() => setSheet(null)}
          busy={pending}
        />
      ) : null}
    </div>
  );
}
