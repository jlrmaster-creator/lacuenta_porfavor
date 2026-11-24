import { ArrowRight, BookOpen, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDate, timeAgo } from '@/core/date';
import { formatCents } from '@/core/money';
import { Card, EmptyState } from '@/presentation/components/ui';
import { useAccounts, useGroups } from '@/state/hooks';

export function HomeScreen() {
  const accounts = useAccounts();
  const groups = useGroups();
  const openAccounts = accounts.value.filter((a) => a.status === 'open').sort((a, b) => b.openedAt.localeCompare(a.openedAt));
  const activeGroups = groups.value.filter((g) => g.status === 'active').sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return (
    <div className="column">
      <Link to="/new-account"><button className="btn btn-primary btn-lg btn-block">+ Nueva cuenta</button></Link>

      <Card>
        <div className="row-between">
          <h2 className="card-title" style={{ margin: 0 }}>Cuentas abiertas</h2>
          <span className="badge">{openAccounts.length}</span>
        </div>
        <div className="divider" />
        {openAccounts.length === 0 ? (
          <EmptyState icon="🧾" title="No tienes cuentas abiertas" text="Crea una cuenta cuando llegues al establecimiento." />
        ) : (
          openAccounts.map((account) => (
            <Link key={account.id} to={`/accounts/${account.id}`}>
              <div className="row-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <strong>{account.venueName || 'Sin establecimiento'}</strong>
                  <small className="muted" style={{ display: 'block' }}>{formatDate(account.openedAt)}</small>
                </div>
                <div className="right">
                  <strong>{formatCents(account.totalCents)}</strong>
                  <ArrowRight size={16} className="muted" />
                </div>
              </div>
            </Link>
          ))
        )}
      </Card>

      <Card>
        <div className="row-between">
          <h2 className="card-title" style={{ margin: 0 }}>Grupos activos</h2>
          <span className="badge">{activeGroups.length}</span>
        </div>
        <div className="divider" />
        {activeGroups.length === 0 ? (
          <EmptyState icon="👥" title="Sin grupos activos" text="Crea un grupo o introduce un código de invitación." />
        ) : (
          activeGroups.map((group) => (
            <Link key={group.id} to={`/groups/${group.id}`}>
              <div className="row-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <strong>{group.name}</strong>
                  <small className="muted" style={{ display: 'block' }}>{timeAgo(group.createdAt)}</small>
                </div>
                <div className="right">
                  <strong>{formatCents(group.totalCents)}</strong>
                  <ArrowRight size={16} className="muted" />
                </div>
              </div>
            </Link>
          ))
        )}
        <div className="row mt-2" style={{ gap: 8 }}>
          <Link to="/groups/new" style={{ flex: 1 }}><button className="btn btn-secondary btn-block"><Users size={16} /> Crear grupo</button></Link>
          <Link to="/catalog" style={{ flex: 1 }}><button className="btn btn-secondary btn-block"><BookOpen size={16} /> Catálogo</button></Link>
        </div>
      </Card>
    </div>
  );
}
