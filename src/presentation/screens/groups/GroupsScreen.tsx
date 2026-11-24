import { useState } from 'react';
import { ArrowRight, Plus, Ticket } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { formatCents } from '@/core/money';
import { invitationCodeSchema } from '@/domain/services/validators';
import { Banner, Button, Card, EmptyState, Field } from '@/presentation/components/ui';
import { useAction, useAuth, useGroups } from '@/state/hooks';
import { groupsRepository } from '@/state/repositories';

export function GroupsScreen() {
  const groups = useGroups();
  const { user } = useAuth();
  const { run, pending } = useAction();
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState('');
  const navigate = useNavigate();

  const join = async () => {
    const parsed = invitationCodeSchema.safeParse(code);
    if (!parsed.success || !user) {
      setCodeError(parsed.success ? '' : 'Código no válido');
      return;
    }
    setCodeError('');
    const groupId = await run(() => groupsRepository.joinGroup(user.uid, user.displayName, parsed.data), 'Te has unido al grupo');
    if (groupId) navigate(`/groups/${groupId}`);
  };

  return (
    <div className="column">
      <Link to="/groups/new"><Button block size="lg"><Plus size={18} /> Crear grupo</Button></Link>

      <Card>
        <h2 className="card-title">Unirse con un código</h2>
        <Field label="Código de invitación" error={codeError}>
          <input value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} maxLength={10} placeholder="ABC12345" />
        </Field>
        <Button variant="secondary" block onClick={() => void join()} loading={pending}><Ticket size={16} /> Unirse</Button>
      </Card>

      {groups.error ? <Banner>{groups.error}</Banner> : null}

      <Card>
        <h2 className="card-title">Mis grupos</h2>
        <div className="divider" />
        {groups.value.length === 0 ? (
          <EmptyState icon="👥" title="Todavía no perteneces a ningún grupo" text="Crea uno o introduce el código que te hayan compartido." />
        ) : (
          groups.value.map((group) => (
            <Link key={group.id} to={`/groups/${group.id}`}>
              <div className="row-between" style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <strong>{group.name}</strong>
                  <small className="muted" style={{ display: 'block' }}>
                    {group.status === 'active' ? 'Activo' : 'Cerrado'} · código {group.inviteCode}
                  </small>
                </div>
                <div className="right"><strong>{formatCents(group.totalCents)}</strong><ArrowRight size={16} className="muted" /></div>
              </div>
            </Link>
          ))
        )}
      </Card>
    </div>
  );
}
