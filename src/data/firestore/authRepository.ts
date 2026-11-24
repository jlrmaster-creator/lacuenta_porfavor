import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile as firebaseUpdateProfile,
  type Unsubscribe,
} from 'firebase/auth';
import { getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { requireAuth, requireFirestore } from '@/config/firebase';
import type { UserProfile } from '@/domain/entities';
import type { AuthPort } from '@/domain/ports';
import { paths } from './paths';

function toIso(value: unknown, fallback: string): string {
  if (value && typeof value === 'object' && 'toDate' in value) {
    return (value as { toDate: () => Date }).toDate().toISOString();
  }
  if (typeof value === 'string') return value;
  return fallback;
}

export class FirebaseAuthRepository implements AuthPort {
  observeAuth(next: (user: UserProfile | null) => void, error?: (e: unknown) => void): Unsubscribe {
    const auth = requireAuth();
    const db = requireFirestore();
    return onAuthStateChanged(
      auth,
      (user) => {
        if (!user) {
          next(null);
          return;
        }
        void (async () => {
          try {
            const snap = await getDoc(paths.users(db, user.uid));
            const data = snap.data();
            const fallback = user.metadata.creationTime ?? new Date().toISOString();
            next({
              uid: user.uid,
              displayName: data?.displayName ?? user.displayName ?? user.email?.split('@')[0] ?? 'Usuario',
              email: user.email ?? '',
              photoURL: data?.photoURL ?? user.photoURL ?? null,
              createdAt: toIso(data?.createdAt, fallback),
              updatedAt: toIso(data?.updatedAt, fallback),
            });
          } catch (e) {
            // Si falla la lectura del perfil, usamos los datos básicos de Auth.
            next({
              uid: user.uid,
              displayName: user.displayName ?? user.email?.split('@')[0] ?? 'Usuario',
              email: user.email ?? '',
              photoURL: user.photoURL ?? null,
              createdAt: user.metadata.creationTime ?? new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
            error?.(e);
          }
        })();
      },
      (e) => {
        next(null);
        error?.(e);
      },
    );
  }

  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    const auth = requireAuth();
    const db = requireFirestore();
    const credential = await createUserWithEmailAndPassword(auth, email, password);
    await firebaseUpdateProfile(credential.user, { displayName });
    await setDoc(paths.users(db, credential.user.uid), {
      uid: credential.user.uid,
      displayName,
      email,
      photoURL: null,
      catalogInitialized: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return {
      uid: credential.user.uid,
      displayName,
      email,
      photoURL: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async signIn(email: string, password: string): Promise<UserProfile> {
    const credential = await signInWithEmailAndPassword(requireAuth(), email, password);
    return {
      uid: credential.user.uid,
      displayName: credential.user.displayName ?? credential.user.email?.split('@')[0] ?? 'Usuario',
      email: credential.user.email ?? email,
      photoURL: credential.user.photoURL ?? null,
      createdAt: credential.user.metadata.creationTime ?? new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(requireAuth(), email);
  }

  async signOut(): Promise<void> {
    await firebaseSignOut(requireAuth());
  }

  async updateProfile(displayName: string, photoURL: string | null): Promise<void> {
    const auth = requireAuth();
    const db = requireFirestore();
    const user = auth.currentUser;
    if (!user) throw new Error('No hay sesión iniciada');
    await firebaseUpdateProfile(user, { displayName, photoURL: photoURL ?? null });
    await setDoc(
      paths.users(db, user.uid),
      { displayName, photoURL, updatedAt: serverTimestamp() },
      { merge: true },
    );
  }
}
