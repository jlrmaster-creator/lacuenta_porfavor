import { collection, doc, type Firestore } from 'firebase/firestore';

export const paths = {
  users: (db: Firestore, uid: string) => doc(db, 'users', uid),
  categories: (db: Firestore) => collection(db, 'categories'),
  products: (db: Firestore) => collection(db, 'products'),
  accounts: (db: Firestore) => collection(db, 'individualAccounts'),
  account: (db: Firestore, id: string) => doc(db, 'individualAccounts', id),
  individualConsumptions: (db: Firestore) => collection(db, 'individualConsumptions'),
  groups: (db: Firestore) => collection(db, 'groups'),
  group: (db: Firestore, id: string) => doc(db, 'groups', id),
  members: (db: Firestore, groupId: string) => collection(db, 'groups', groupId, 'members'),
  member: (db: Firestore, groupId: string, uid: string) => doc(db, 'groups', groupId, 'members', uid),
  groupConsumptions: (db: Firestore) => collection(db, 'groupConsumptions'),
  invitations: (db: Firestore) => collection(db, 'invitations'),
  invitation: (db: Firestore, code: string) => doc(db, 'invitations', code),
  activity: (db: Firestore) => collection(db, 'activityLogs'),
};

/** Código legible y fácil de compartir: 8 caracteres sin ambigüedad (0/O, 1/I). */
export function generateInviteCode(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  const bytes = new Uint8Array(8);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join('');
}
