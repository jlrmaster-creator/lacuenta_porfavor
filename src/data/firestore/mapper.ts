import { Timestamp, type DocumentData, type QueryDocumentSnapshot } from 'firebase/firestore';

const TIMESTAMP_FIELDS = [
  'createdAt',
  'updatedAt',
  'openedAt',
  'closedAt',
  'reopenedAt',
  'joinedAt',
  'expiresAt',
] as const;

/** Convierte un documento Firestore en una entidad de dominio con fechas ISO. */
export function fromDoc<T>(snapshot: QueryDocumentSnapshot<DocumentData>): T {
  const data = snapshot.data();
  const result: Record<string, unknown> = { ...data, id: snapshot.id };
  for (const field of TIMESTAMP_FIELDS) {
    const value = result[field];
    if (value instanceof Timestamp) {
      result[field] = value.toDate().toISOString();
    } else if (value === null || value === undefined) {
      delete result[field];
    }
  }
  return result as T;
}

export function fromOptionalDoc<T>(snapshot: { data(): DocumentData | undefined; id: string } | null): T | null {
  if (!snapshot) return null;
  const data = snapshot.data();
  if (!data) return null;
  const result: Record<string, unknown> = { ...data, id: snapshot.id };
  for (const field of TIMESTAMP_FIELDS) {
    const value = result[field];
    if (value instanceof Timestamp) result[field] = value.toDate().toISOString();
  }
  return result as T;
}

export function watchMapper<T>(next: (items: T[]) => void) {
  return (snapshot: { docs: QueryDocumentSnapshot<DocumentData>[] }) => {
    next(snapshot.docs.map((doc) => fromDoc<T>(doc)));
  };
}
