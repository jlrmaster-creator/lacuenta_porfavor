import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { accountSchema } from '@/domain/services/validators';
import { Button, Card, Field } from '@/presentation/components/ui';
import { useAction, useAuth } from '@/state/hooks';
import { accountsRepository } from '@/state/repositories';

export function NewAccountScreen() {
  const [venueName, setVenueName] = useState('');
  const [error, setError] = useState('');
  const { user } = useAuth();
  const { run, pending } = useAction();
  const navigate = useNavigate();

  const create = async () => {
    const parsed = accountSchema.safeParse({ venueName });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Nombre no válido');
      return;
    }
    if (!user) return;
    const id = await run(() => accountsRepository.createAccount(user.uid, parsed.data.venueName), 'Cuenta creada');
    if (id) navigate(`/accounts/${id}`);
  };

  return (
    <Card>
      <h2 className="card-title">¿Dónde estás?</h2>
      <p className="muted">El nombre del establecimiento es opcional. Podrás verlo en el resumen y en el historial.</p>
      <Field label="Establecimiento (opcional)" error={error}>
        <input value={venueName} onChange={(e) => setVenueName(e.target.value)} maxLength={80} placeholder="Ej. Bar El Rincón" />
      </Field>
      <Button block size="lg" onClick={() => void create()} loading={pending}>Empezar cuenta</Button>
    </Card>
  );
}
