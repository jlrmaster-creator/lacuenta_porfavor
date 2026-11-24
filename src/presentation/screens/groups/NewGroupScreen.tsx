import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { groupSchema } from '@/domain/services/validators';
import { Button, Card, Field } from '@/presentation/components/ui';
import { useAction, useAuth } from '@/state/hooks';
import { groupsRepository } from '@/state/repositories';

export function NewGroupScreen() {
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { run, pending } = useAction();
  const navigate = useNavigate();

  const create = async () => {
    const parsed = groupSchema.safeParse({ name });
    if (!parsed.success || !user) {
      setError(parsed.success ? '' : 'El nombre debe tener entre 2 y 60 caracteres');
      return;
    }
    const result = await run(() => groupsRepository.createGroup(user.uid, user.displayName, parsed.data.name), 'Grupo creado');
    if (result) navigate(`/groups/${result.groupId}`);
  };

  return (
    <Card>
      <h2 className="card-title">Nombre del grupo</h2>
      <p className="muted">Ej. Cena del sábado, Viaje a la playa… Tú serás el administrador.</p>
      <Field label="Nombre" error={error}>
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={60} placeholder="Cena del sábado" />
      </Field>
      <Button block size="lg" onClick={() => void create()} loading={pending}>Crear grupo</Button>
    </Card>
  );
}
