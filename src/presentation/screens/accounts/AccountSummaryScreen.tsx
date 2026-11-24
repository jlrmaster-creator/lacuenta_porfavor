import { CheckCheck, Share2, XCircle } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { formatDateTime } from '@/core/date';
import { formatCents } from '@/core/money';
import { individualSummaryText, shareText } from '@/core/share';
import { ConsumptionList } from '@/presentation/components/ConsumptionList';
import { Banner, Button, Card, Spinner, TotalDisplay } from '@/presentation/components/ui';
import { useAccount, useAction, useAuth, useCatalog } from '@/state/hooks';
import { accountsRepository } from '@/state/repositories';

export function AccountSummaryScreen() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { account, consumptions, error } = useAccount(id);
  const { products } = useCatalog();
  const { run, pending } = useAction();

  if (error) return <Banner>{error}</Banner>;
  if (!account) return <Spinner />;

  const changeStatus = async (status: 'paid' | 'cancelled') => {
    if (!user) return;
    await run(() => accountsRepository.setAccountStatus(user.uid, account.id, status), status === 'paid' ? 'Cuenta marcada como pagada' : 'Cuenta cancelada');
  };

  return (
    <div className="column">
      <TotalDisplay cents={account.totalCents} label="Importe total" />
      <Card>
        <div className="row-between"><span className="muted">Establecimiento</span><strong>{account.venueName || 'Sin establecimiento'}</strong></div>
        <div className="row-between"><span className="muted">Fecha</span><strong>{formatDateTime(account.openedAt)}</strong></div>
        <div className="row-between"><span className="muted">Consumiciones</span><strong>{consumptions.length}</strong></div>
        <div className="row-between"><span className="muted">Estado</span><span className={`badge ${account.status === 'open' ? '' : 'danger'}`}>{account.status}</span></div>
      </Card>

      <Card>
        <h2 className="card-title">Detalle</h2>
        <ConsumptionList consumptions={consumptions} products={products} />
      </Card>

      {account.status === 'open' ? (
        <>
          <Button block size="lg" onClick={() => void changeStatus('paid')} loading={pending}>
            <CheckCheck size={18} /> Marcar como pagada
          </Button>
          <Button variant="secondary" block onClick={() => void changeStatus('cancelled')} loading={pending}>
            <XCircle size={16} /> Cancelar cuenta
          </Button>
        </>
      ) : (
        <Banner>Esta cuenta está {account.status === 'paid' ? 'pagada' : 'cancelada'}. Para modificarla, reabrirla explícitamente desde el detalle.</Banner>
      )}

      <Button
        variant="secondary"
        block
        onClick={() => {
          void shareText(
            individualSummaryText(
              account.venueName,
              formatDateTime(account.openedAt),
              consumptions.map((c) => ({ name: c.productName, quantity: c.quantity, subtotalCents: c.subtotalCents })),
              account.totalCents,
            ),
          );
        }}
      >
        <Share2 size={16} /> Compartir resumen
      </Button>
      <p className="muted center small">Total: {formatCents(account.totalCents)}</p>
    </div>
  );
}
