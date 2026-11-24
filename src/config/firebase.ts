import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

/**
 * Configuración pública del proyecto Firebase.
 * Se lee SOLO de variables de entorno que el propietario del proyecto facilita.
 * No hay valores por defecto, credenciales ni claves privadas en el código.
 */
export interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

export function readFirebaseConfig(): FirebaseConfig | null {
  const env = import.meta.env;
  const config: FirebaseConfig = {
    apiKey: env.VITE_FIREBASE_API_KEY?.trim() ?? '',
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN?.trim() ?? '',
    projectId: env.VITE_FIREBASE_PROJECT_ID?.trim() ?? '',
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET?.trim() ?? '',
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID?.trim() ?? '',
    appId: env.VITE_FIREBASE_APP_ID?.trim() ?? '',
  };
  return Object.values(config).every(Boolean) ? config : null;
}

export const firebaseConfig = readFirebaseConfig();

const app: FirebaseApp | null = firebaseConfig
  ? getApps().length > 0
    ? getApp()
    : initializeApp(firebaseConfig)
  : null;

export const firebaseAuth: Auth | null = app ? getAuth(app) : null;
export const firestore: Firestore | null = app ? getFirestore(app) : null;
export const firebaseStorage: FirebaseStorage | null = app ? getStorage(app) : null;
export const isFirebaseConfigured = app !== null;

export function requireFirestore(): Firestore {
  if (!firestore) {
    throw new Error('Firebase no está configurado. Copia .env.example a .env.local con tu configuración oficial.');
  }
  return firestore;
}

export function requireAuth(): Auth {
  if (!firebaseAuth) {
    throw new Error('Firebase Auth no está configurado. Revisa tu archivo .env.local.');
  }
  return firebaseAuth;
}
