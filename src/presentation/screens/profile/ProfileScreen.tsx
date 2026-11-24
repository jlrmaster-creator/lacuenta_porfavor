import { useState } from 'react';
import { getDownloadURL, ref, uploadBytes } from 'firebase/storage';
import { BookOpen, Camera, LogOut, Moon, Sun } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { isFirebaseConfigured, firebaseStorage } from '@/config/firebase';
import { errorMessage } from '@/core/errors';
import { profileSchema } from '@/domain/services/validators';
import { Button, Card, Field } from '@/presentation/components/ui';
import { useAction, useAuth } from '@/state/hooks';
import { authRepository } from '@/state/repositories';
import { useUiStore } from '@/state/stores';

export function ProfileScreen() {
  const { user } = useAuth();
  const { run, pending } = useAction();
  const [name, setName] = useState(user?.displayName ?? '');
  const [error, setError] = useState('');
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const clear = useUiStore((s) => s.clearToast);
  const navigate = useNavigate();

  if (!user) return null;

  const save = async () => {
    const parsed = profileSchema.safeParse({ displayName: name });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'Nombre no válido');
      return;
    }
    setError('');
    await run(() => authRepository.updateProfile(parsed.data.displayName, user.photoURL), 'Perfil actualizado');
  };

  const uploadPhoto = async (file: File) => {
    const storage = firebaseStorage;
    if (!storage) return;
    await run(async () => {
      const photoRef = ref(storage, `profileImages/${user.uid}/${Date.now()}-${file.name}`);
      await uploadBytes(photoRef, file);
      const url = await getDownloadURL(photoRef);
      await authRepository.updateProfile(user.displayName, url);
    }, 'Fotografía actualizada');
  };

  const signOut = async () => {
    await run(async () => {
      await authRepository.signOut();
      clear();
      navigate('/login');
    }, 'Sesión cerrada');
  };

  return (
    <div className="column">
      <Card>
        <div className="row" style={{ gap: 14 }}>
          {user.photoURL ? (
            <img src={user.photoURL} alt="Foto de perfil" style={{ width: 64, height: 64, borderRadius: '50%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-soft)', display: 'grid', placeItems: 'center', fontSize: '1.8rem' }}>
              {user.displayName.slice(0, 1).toUpperCase()}
            </div>
          )}
          <div>
            <strong>{user.displayName}</strong>
            <div className="muted small">{user.email}</div>
            <div className="muted small">ID: {user.uid.slice(0, 12)}…</div>
          </div>
        </div>
        {isFirebaseConfigured && firebaseStorage ? (
          <label className="btn btn-secondary btn-block mt-2" style={{ cursor: 'pointer' }}>
            <Camera size={16} /> Cambiar fotografía
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) void uploadPhoto(file).catch((err: unknown) => setError(errorMessage(err)));
              }}
            />
          </label>
        ) : null}
      </Card>

      <Card>
        <h2 className="card-title">Nombre visible</h2>
        <Field label="Nombre" error={error}>
          <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
        </Field>
        <Button block onClick={() => void save()} loading={pending}>Guardar cambios</Button>
      </Card>

      <Card>
        <h2 className="card-title">Preferencias</h2>
        <Button variant="secondary" block onClick={toggleTheme}>
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />} Tema {theme === 'light' ? 'oscuro' : 'claro'}
        </Button>
        <Link to="/catalog"><Button variant="secondary" block className="mt-1"><BookOpen size={16} /> Gestionar catálogo</Button></Link>
      </Card>

      <Button variant="danger" block onClick={() => void signOut()} loading={pending}><LogOut size={16} /> Cerrar sesión</Button>
    </div>
  );
}
