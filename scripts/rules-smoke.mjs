import { readFileSync } from 'node:fs';
import { assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';
import { arrayUnion, collection, doc, getDocs, getDoc, query, runTransaction, serverTimestamp, where } from 'firebase/firestore';

const env = await initializeTestEnvironment({
  projectId: 'demo-lacuentaporfavor',
  firestore: {
    rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
    host: '127.0.0.1',
    port: 8080,
  },
});

try {
  await env.clearFirestore();

  const uid = 'user1';
  const groupId = 'g1';
  const code = 'ABCDEFGH';
  const db = env.authenticatedContext(uid).firestore();

  await assertSucceeds(
    runTransaction(db, async (tx) => {
      const now = serverTimestamp();
      tx.set(doc(db, `groups/${groupId}`), {
        name: 'Cena del sábado',
        createdBy: uid,
        status: 'active',
        inviteCode: code,
        openedAt: now,
        closedAt: null,
        totalCents: 0,
        memberUids: [uid],
        createdAt: now,
        updatedAt: now,
      });
      tx.set(doc(db, `groups/${groupId}/members/${uid}`), {
        groupId,
        displayName: 'Jose',
        photoURL: null,
        role: 'admin',
        invitedViaCode: null,
        joinedAt: now,
      });
      tx.set(doc(db, `invitations/${code}`), {
        code,
        groupId,
        createdBy: uid,
        createdAt: now,
        expiresAt: null,
        uses: 0,
        maxUses: null,
      });
      tx.set(doc(db, 'activityLogs/log1'), {
        action: 'group.created',
        actorId: uid,
        groupId,
        accountId: null,
        targetId: groupId,
        details: 'Grupo creado',
        createdAt: now,
      });
    }),
  );

  const snap = await getDoc(doc(db, `groups/${groupId}`));
  if (!snap.exists()) throw new Error('El grupo no se creó');
  console.log('OK: transacción de creación de grupo permitida por firestore.rules');

  // Cuenta individual y consumición: valida accountPath().
  const accountId = 'a1';
  await assertSucceeds(
    runTransaction(db, async (tx) => {
      const now = serverTimestamp();
      tx.set(doc(db, `individualAccounts/${accountId}`), {
        ownerId: uid,
        venueName: 'Bar Centro',
        status: 'open',
        openedAt: now,
        closedAt: null,
        reopenedAt: null,
        totalCents: 0,
        createdAt: now,
        updatedAt: now,
      });
    }),
  );
  await assertSucceeds(
    runTransaction(db, async (tx) => {
      const now = serverTimestamp();
      tx.set(doc(db, 'individualConsumptions/c1'), {
        accountId,
        groupId: null,
        userId: uid,
        productId: 'p1',
        productName: 'Caña',
        categoryId: 'c1',
        quantity: 2,
        unitPriceCents: 350,
        subtotalCents: 700,
        note: '',
        createdAt: now,
        updatedAt: now,
      });
    }),
  );
  console.log('OK: cuenta individual y consumición permitidas por firestore.rules');

  // Unirse a un grupo con invitación: valida invitationPath() y memberPath().
  const otherUid = 'user2';
  const otherDb = env.authenticatedContext(otherUid).firestore();
  await assertSucceeds(
    runTransaction(otherDb, async (tx) => {
      const now = serverTimestamp();
      tx.update(doc(otherDb, `groups/${groupId}`), {
        memberUids: arrayUnion(otherUid),
        updatedAt: now,
      });
      tx.set(doc(otherDb, `groups/${groupId}/members/${otherUid}`), {
        groupId,
        displayName: 'Ana',
        photoURL: null,
        role: 'member',
        invitedViaCode: code,
        joinedAt: now,
      });
    }),
  );
  console.log('OK: unión por código de invitación permitida por firestore.rules');

  // Estadísticas: consulta de consumiciones de grupo por userId.
  await assertSucceeds(
    runTransaction(db, async (tx) => {
      const now = serverTimestamp();
      tx.set(doc(db, 'groupConsumptions/cg1'), {
        accountId: null,
        groupId,
        userId: uid,
        productId: 'p1',
        productName: 'Caña',
        categoryId: 'c1',
        quantity: 1,
        unitPriceCents: 350,
        subtotalCents: 350,
        note: '',
        createdAt: now,
        updatedAt: now,
      });
    }),
  );
  await assertSucceeds(getDocs(query(collection(db, 'groupConsumptions'), where('userId', '==', uid))));
  console.log('OK: consulta de consumiciones de grupo por usuario permitida por firestore.rules');

  await assertSucceeds(getDocs(query(collection(db, 'groupConsumptions'), where('groupId', '==', groupId))));
  console.log('OK: consulta de consumiciones por grupo permitida por firestore.rules');

  // Historial de actividad: consultas por cuenta y por grupo.
  await assertSucceeds(
    runTransaction(db, async (tx) => {
      tx.set(doc(db, 'activityLogs/log2'), {
        action: 'consumption.added',
        actorId: uid,
        groupId: null,
        accountId,
        targetId: 'c1',
        details: 'Consumición añadida',
        createdAt: serverTimestamp(),
      });
    }),
  );
  await assertSucceeds(getDocs(query(collection(db, 'activityLogs'), where('accountId', '==', accountId))));
  await assertSucceeds(getDocs(query(collection(db, 'activityLogs'), where('groupId', '==', groupId))));
  console.log('OK: consultas de historial por cuenta y por grupo permitidas por firestore.rules');
} finally {
  await env.cleanup();
}
