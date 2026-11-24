import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BarChart3 } from 'lucide-react';
import { formatDate } from '@/core/date';
import { formatCents } from '@/core/money';
import { Banner, Card, EmptyState } from '@/presentation/components/ui';
import { useAccounts, useGroups } from '@/state/hooks';

type Tab = 'accounts' | 'groups';

export function HistoryScreen() {
  const [tab, setTab] = useState<Tab>('accounts');
  const accounts = useAccounts();
  const groups = useGroups();
  const error = accounts.error ?? groups.error;

  return (
    <div className="column">
      <div className="chip-row">
        <button className={`chip ${tab === 'accounts' ? 'active' : ''}`} onClick={() => setTab('accounts')}>Cuentas individuales</button>
        <button className={`chip ${tab === 'groups' ? 'active' : ''}`} onClick={() => setTab('groups')}>Grupos</button>
      </div>
      {error ? <Banner>{error}</Banner> : null}
      <Link to="/stats"><button className="btn btn-secondary btn-block"><BarChart3 size={16} /> Ver estadísticas</button></Link>

      <Card>
        <h2 className="card-title">{tab === 'accounts' ? 'Historial de cuentas' : 'Historial de grupos'}</h2>
        <div className="divider" />
        {tab === 'accounts' ? (
          accounts.value.length === 0 ? <EmptyState title="Sin cuentas" /> : (
            [...accounts.value].sort((a, b) => b.openedAt.localeCompare(a.openedAt)).map((a) => (
              <Link key={a.id} to={`/accounts/${a.id}`}>
                <div className="row-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <strong>{a.venueName || 'Sin establecimiento'}</strong>
                    <small className="muted" style={{ display: 'block' }}>{formatDate(a.openedAt)} · {a.status}</small>
                  </div>
                  <strong>{formatCents(a.totalCents)}</strong>
                </div>
              </Link>
            ))
          )
        ) : (
          groups.value.length === 0 ? <EmptyState title="Sin grupos" /> : (
            [...groups.value].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).map((g) => (
              <Link key={g.id} to={`/groups/${g.id}`}>
                <div className="row-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                  <div>
                    <strong>{g.name}</strong>
                    <small className="muted" style={{ display: 'block' }}>{formatDate(g.createdAt)} · {g.status}</small>
                  </div>
                  <strong>{formatCents(g.totalCents)}</strong>
                </div>
              </Link>
            ))
          )
        )}
      </Card>
    </div>
  );
}
