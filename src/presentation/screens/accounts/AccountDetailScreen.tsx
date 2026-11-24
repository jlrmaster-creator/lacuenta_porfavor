import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ReceiptText, RotateCcw } from 'lucide-react';
import type { Consumption, Product } from '@/domain/entities';
import type { NewConsumptionInput } from '@/domain/ports';
import { formatDateTime } from '@/core/date';
import { canEditAccount, canReopenAccount } from '@/domain/services/permissions';
import { ConsumptionFormSheet } from '@/presentation/components/ConsumptionFormSheet';
import { ConsumptionList, QuickAddRow } from '@/presentation/components/ConsumptionList';
import { Banner, Button, Card, EmptyState, Spinner, TotalDisplay } from '@/presentation/components/ui';
import { useAccount, useAction, useAuth, useCatalog } from '@/state/hooks';
import { accountsRepository } from '@/state/repositories';

export function AccountDetailScreen() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { account, consumptions, activity, error } = useAccount(id);
  const { products, categories } = useCatalog();
  const { run, pending } = useAction();
  const [sheet, setSheet] = useState<{ productId?: string; edit?: Consumption } | null>(null);

  if (error) return <Banner>{error}</Banner>;
  if (!account) return <Spinner />;
  const editable = user ? canEditAccount(account, user.uid) : false;

  const submit = async (input: NewConsumptionInput) => {
    if (!user) return;
    if (sheet?.edit) {
      await run(() => accountsRepository.updateConsumption(user.uid, sheet.edit!, input), 'Consumición actualizada');
    } else {
      await run(() => accountsRepository.addConsumption(user.uid, account.id, input), 'Consumición añadida');
    }
    setSheet(null);
  };

  const quickAdd = async (product: Product) => {
    if (!user) return;
    const last = consumptions.filter((c) => c.productId === product.id).at(-1);
    const cents = last?.unitPriceCents ?? product.suggestedPriceCents ?? 0;
    if (cents === 0) {
      setSheet({ productId: product.id });
      return;
    }
    await run(
      () => accountsRepository.addConsumption(user.uid, account.id, {
        productId: product.id,
        productName: product.name,
        categoryId: product.categoryId,
        quantity: 1,
        unitPriceCents: cents,
        note: '',
      }),
      `${product.name} añadida`,
    );
  };

  const reopen = async () => {
    if (!user) return;
    await run(() => accountsRepository.setAccountStatus(user.uid, account.id, 'open'), 'Cuenta reabierta');
  };

  return (
    <div className="column">
      <TotalDisplay cents={account.totalCents} label={account.status === 'paid' ? 'Total pagado' : 'Total acumulado'} />
      <div className="row-between">
        <span className="muted">{account.venueName || 'Sin establecimiento'} · {formatDateTime(account.openedAt)}</span>
        <span className={`badge ${account.status === 'open' ? '' : 'danger'}`}>
          {account.status === 'open' ? 'Abierta' : account.status === 'paid' ? 'Pagada' : 'Cancelada'}
        </span>
      </div>

      {editable ? (
        <>
          <Button block size="lg" onClick={() => setSheet({})}>+ Añadir consumición</Button>
          <div>
            <p className="muted small">Añadir rápido</p>
            <QuickAddRow products={products} consumptions={consumptions} onAdd={(p) => void quickAdd(p)} />
          </div>
        </>
      ) : null}

      {user && canReopenAccount(account, user.uid) ? (
        <Button variant="secondary" block onClick={() => void reopen()} loading={pending}>
          <RotateCcw size={16} /> Reabrir cuenta (acción registrada)
        </Button>
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
          editable={() => editable}
          onEdit={(c) => setSheet({ productId: c.productId, edit: c })}
          onDelete={(c) => {
            if (window.confirm('¿Eliminar esta consumición?') && user) {
              void run(() => accountsRepository.deleteConsumption(user.uid, c), 'Consumición eliminada');
            }
          }}
        />
        {consumptions.length === 0 && !editable ? <EmptyState title="Sin consumiciones" /> : null}
      </Card>

      <Link to={`/accounts/${account.id}/summary`}>
        <button className="btn btn-primary btn-lg btn-block"><ReceiptText size={18} /> Ver resumen y pagar</button>
      </Link>

      {activity.length > 0 ? (
        <Card>
          <h2 className="card-title">Historial de la cuenta</h2>
          {activity.map((log) => (
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
          initial={sheet.edit ? {
            productId: sheet.edit.productId,
            productName: sheet.edit.productName,
            categoryId: sheet.edit.categoryId,
            quantity: sheet.edit.quantity,
            unitPriceCents: sheet.edit.unitPriceCents,
            note: sheet.edit.note,
          } : sheet.productId ? (() => {
            const p = products.find((x) => x.id === sheet.productId)!;
            return {
              productId: p.id,
              productName: p.name,
              categoryId: p.categoryId,
              quantity: 1,
              unitPriceCents: p.suggestedPriceCents ?? 0,
              note: '',
            };
          })() : undefined}
          title={sheet.edit ? 'Editar consumición' : 'Añadir consumición'}
          onSubmit={submit}
          onClose={() => setSheet(null)}
          busy={pending}
        />
      ) : null}
    </div>
  );
}
