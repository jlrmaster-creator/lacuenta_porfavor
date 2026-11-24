import {
  addDoc,
  doc,
  increment,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireFirestore } from '@/config/firebase';
import type { ActivityAction, Consumption, IndividualAccount } from '@/domain/entities';
import type { AccountsPort, NewConsumptionInput } from '@/domain/ports';
import { calculateSubtotal } from '@/domain/services/totals';
import { watchMapper } from './mapper';
import { paths } from './paths';

export class FirebaseAccountsRepository implements AccountsPort {
  watchAccounts(uid: string, next: (items: IndividualAccount[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(query(paths.accounts(db), where('ownerId', '==', uid)), watchMapper<IndividualAccount>(next), error);
  }

  watchAccount(accountId: string, next: (account: IndividualAccount | null) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(paths.account(db, accountId), (snap) => {
      if (!snap.exists()) {
        next(null);
        return;
      }
      const data = snap.data();
      const dateIso = (v: unknown) =>
        v && typeof v === 'object' && 'toDate' in v ? (v as { toDate: () => Date }).toDate().toISOString() : null;
      const account = {
        ...data,
        id: snap.id,
        createdAt: dateIso(data.createdAt) ?? '',
        updatedAt: dateIso(data.updatedAt) ?? '',
        openedAt: dateIso(data.openedAt) ?? '',
        closedAt: dateIso(data.closedAt),
        reopenedAt: dateIso(data.reopenedAt),
      } as IndividualAccount;
      next(account);
    }, error);
  }

  watchConsumptions(accountId: string, next: (items: Consumption[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(
      query(paths.individualConsumptions(db), where('accountId', '==', accountId)),
      watchMapper<Consumption>(next),
      error,
    );
  }

  watchUserConsumptions(uid: string, next: (items: Consumption[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(
      query(paths.individualConsumptions(db), where('userId', '==', uid)),
      watchMapper<Consumption>(next),
      error,
    );
  }

  async createAccount(uid: string, venueName: string): Promise<string> {
    const db = requireFirestore();
    const ref = await addDoc(paths.accounts(db), {
      ownerId: uid,
      venueName: venueName.trim(),
      status: 'open',
      openedAt: serverTimestamp(),
      closedAt: null,
      reopenedAt: null,
      totalCents: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    await this.log(uid, 'account.opened', ref.id, null, venueName);
    return ref.id;
  }

  async addConsumption(uid: string, accountId: string, input: NewConsumptionInput): Promise<string> {
    const db = requireFirestore();
    const accountRef = paths.account(db, accountId);
    const consumptionRef = doc(paths.individualConsumptions(db));
    const subtotalCents = calculateSubtotal(input.quantity, input.unitPriceCents);
    if (subtotalCents <= 0 && input.unitPriceCents !== 0) {
      throw new Error('Cantidad o precio no válidos');
    }
    await runTransaction(db, async (tx) => {
      const accountSnap = await tx.get(accountRef);
      if (!accountSnap.exists() || accountSnap.data().ownerId !== uid || accountSnap.data().status !== 'open') {
        throw new Error('La cuenta no existe, no es tuya o ya está cerrada');
      }
      tx.set(consumptionRef, {
        accountId,
        groupId: null,
        userId: uid,
        productId: input.productId,
        productName: input.productName,
        categoryId: input.categoryId,
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents,
        subtotalCents,
        note: input.note,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      tx.update(accountRef, { totalCents: increment(subtotalCents), updatedAt: serverTimestamp() });
    });
    return consumptionRef.id;
  }

  async updateConsumption(uid: string, consumption: Consumption, input: NewConsumptionInput): Promise<void> {
    const db = requireFirestore();
    const subtotalCents = calculateSubtotal(input.quantity, input.unitPriceCents);
    const delta = subtotalCents - consumption.subtotalCents;
    await runTransaction(db, async (tx) => {
      const ref = doc(paths.individualConsumptions(db), consumption.id);
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().userId !== uid || snap.data().accountId !== consumption.accountId) {
        throw new Error('Consumición no editable');
      }
      const accountRef = paths.account(db, consumption.accountId!);
      const accountSnap = await tx.get(accountRef);
      if (accountSnap.data()?.status !== 'open') throw new Error('La cuenta ya está cerrada');
      tx.update(ref, {
        productId: input.productId,
        productName: input.productName,
        categoryId: input.categoryId,
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents,
        subtotalCents,
        note: input.note,
        updatedAt: serverTimestamp(),
      });
      tx.update(accountRef, { totalCents: increment(delta), updatedAt: serverTimestamp() });
    });
  }

  async deleteConsumption(uid: string, consumption: Consumption): Promise<void> {
    const db = requireFirestore();
    await runTransaction(db, async (tx) => {
      const ref = doc(paths.individualConsumptions(db), consumption.id);
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().userId !== uid) throw new Error('Consumición no editable');
      const accountRef = paths.account(db, consumption.accountId!);
      if ((await tx.get(accountRef)).data()?.status !== 'open') throw new Error('La cuenta ya está cerrada');
      tx.delete(ref);
      tx.update(accountRef, { totalCents: increment(-consumption.subtotalCents), updatedAt: serverTimestamp() });
    });
  }

  async setAccountStatus(uid: string, accountId: string, status: 'paid' | 'cancelled' | 'open'): Promise<void> {
    const db = requireFirestore();
    const accountRef = paths.account(db, accountId);
    const action: ActivityAction =
      status === 'paid' ? 'account.paid' : status === 'cancelled' ? 'account.cancelled' : 'account.reopened';
    await runTransaction(db, async (tx) => {
      const snap = await tx.get(accountRef);
      if (!snap.exists() || snap.data().ownerId !== uid) throw new Error('Cuenta no encontrada');
      tx.update(accountRef, {
        status,
        closedAt: status === 'open' ? null : serverTimestamp(),
        reopenedAt: status === 'open' ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      });
      tx.set(doc(paths.activity(db)), {
        action,
        actorId: uid,
        groupId: null,
        accountId,
        targetId: accountId,
        details: status === 'open' ? 'Cuenta reabierta explícitamente' : `Cuenta marcada como ${status}`,
        createdAt: serverTimestamp(),
      });
    });
  }

  private async log(uid: string, action: ActivityAction, accountId: string, groupId: string | null, details: string) {
    const db = requireFirestore();
    await addDoc(paths.activity(db), {
      action,
      actorId: uid,
      accountId,
      groupId,
      targetId: accountId,
      details,
      createdAt: serverTimestamp(),
    });
  }
}

/** Actualización simple para Campos como el nombre del establecimiento. */
export async function updateAccountVenue(uid: string, accountId: string, venueName: string): Promise<void> {
  const db = requireFirestore();
  await updateDoc(paths.account(db, accountId), { venueName: venueName.trim(), updatedAt: serverTimestamp(), ownerId: uid });
}
