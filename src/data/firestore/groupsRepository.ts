import {
  arrayUnion,
  doc,
  getDoc,
  increment,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  where,
  type DocumentReference,
  type Transaction,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireFirestore } from '@/config/firebase';
import type { ActivityAction, Consumption, Group, GroupMember, Invitation } from '@/domain/entities';
import type { GroupsPort, NewConsumptionInput } from '@/domain/ports';
import { calculateSubtotal } from '@/domain/services/totals';
import { watchMapper } from './mapper';
import { generateInviteCode, paths } from './paths';

export class FirebaseGroupsRepository implements GroupsPort {
  watchGroups(uid: string, next: (items: Group[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(
      query(paths.groups(db), where('memberUids', 'array-contains', uid)),
      watchMapper<Group>(next),
      error,
    );
  }

  watchGroup(groupId: string, next: (group: Group | null) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(paths.group(db, groupId), (snap) => {
      if (!snap.exists()) {
        next(null);
        return;
      }
      const dateIso = (v: unknown) =>
        v && typeof v === 'object' && 'toDate' in v ? (v as { toDate: () => Date }).toDate().toISOString() : null;
      const data = snap.data();
      const account: Group = {
        ...(data as unknown as Group),
        id: snap.id,
        createdAt: dateIso(data.createdAt) ?? '',
        updatedAt: dateIso(data.updatedAt) ?? '',
        openedAt: dateIso(data.openedAt) ?? '',
        closedAt: dateIso(data.closedAt),
      };
      next(account);
    }, error);
  }

  watchMembers(groupId: string, next: (items: GroupMember[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(paths.members(db, groupId), (snap) => {
      next(snap.docs.map((d) => ({ ...(d.data() as Omit<GroupMember, 'uid'>), uid: d.id })));
    }, error);
  }

  watchConsumptions(groupId: string, next: (items: Consumption[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(
      query(paths.groupConsumptions(db), where('groupId', '==', groupId)),
      watchMapper<Consumption>(next),
      error,
    );
  }

  watchUserConsumptions(uid: string, next: (items: Consumption[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(
      query(paths.groupConsumptions(db), where('userId', '==', uid)),
      watchMapper<Consumption>(next),
      error,
    );
  }

  async createGroup(uid: string, displayName: string, name: string): Promise<{ groupId: string; inviteCode: string }> {
    const db = requireFirestore();
    const groupRef = doc(paths.groups(db));
    const inviteCode = generateInviteCode();
    const groupId = groupRef.id;
    await runTransaction(db, async (tx) => {
      const now = serverTimestamp();
      tx.set(groupRef, {
        name: name.trim(),
        createdBy: uid,
        status: 'active',
        inviteCode,
        openedAt: now,
        closedAt: null,
        totalCents: 0,
        memberUids: [uid],
        createdAt: now,
        updatedAt: now,
      });
      tx.set(paths.member(db, groupId, uid), {
        groupId,
        displayName,
        photoURL: null,
        role: 'admin',
        invitedViaCode: null,
        joinedAt: now,
      });
      tx.set(paths.invitation(db, inviteCode), {
        code: inviteCode,
        groupId,
        createdBy: uid,
        createdAt: now,
        expiresAt: null,
        uses: 0,
        maxUses: null,
      });
      tx.set(doc(paths.activity(db)), {
        action: 'group.created',
        actorId: uid,
        groupId,
        accountId: null,
        targetId: groupId,
        details: `Grupo "${name.trim()}" creado`,
        createdAt: now,
      });
    });
    return { groupId, inviteCode };
  }

  async findInvitation(code: string): Promise<Invitation | null> {
    const db = requireFirestore();
    const snap = await getDoc(paths.invitation(db, code.toUpperCase()));
    if (!snap.exists()) return null;
    const data = snap.data();
    const dateIso = (v: unknown) =>
      v && typeof v === 'object' && 'toDate' in v ? (v as { toDate: () => Date }).toDate().toISOString() : null;
    return {
      ...(data as unknown as Invitation),
      code: snap.id,
      createdAt: dateIso(data.createdAt) ?? '',
      expiresAt: dateIso(data.expiresAt),
    };
  }

  async joinGroup(uid: string, displayName: string, code: string): Promise<string> {
    const db = requireFirestore();
    const normalizedCode = code.trim().toUpperCase();
    const invitationRef = paths.invitation(db, normalizedCode);
    return runTransaction(db, async (tx) => {
      const inviteSnap = await tx.get(invitationRef);
      if (!inviteSnap.exists()) throw new Error('Código de invitación no válido');
      const invite = inviteSnap.data();
      if (invite.expiresAt && (invite.expiresAt as { toMillis: () => number }).toMillis() < Date.now()) {
        throw new Error('La invitación ha caducado');
      }
      if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
        throw new Error('La invitación ya no admite más miembros');
      }
      const groupId = invite.groupId as string;
      const groupRef = paths.group(db, groupId);
      const groupSnap = await tx.get(groupRef);
      if (!groupSnap.exists() || groupSnap.data().status !== 'active') {
        throw new Error('El grupo no está activo');
      }
      const memberRef = paths.member(db, groupId, uid);
      if ((await tx.get(memberRef)).exists()) return groupId; // idempotente

      const now = serverTimestamp();
      tx.set(memberRef, { groupId, displayName, photoURL: null, role: 'member', invitedViaCode: normalizedCode, joinedAt: now });
      tx.update(groupRef, { memberUids: arrayUnion(uid), updatedAt: now });
      tx.update(invitationRef, { uses: increment(1) });
      tx.set(doc(paths.activity(db)), {
        action: 'group.member_joined',
        actorId: uid,
        groupId,
        accountId: null,
        targetId: uid,
        details: `${displayName} se ha unido al grupo`,
        createdAt: now,
      });
      return groupId;
    });
  }

  async addConsumption(uid: string, groupId: string, input: NewConsumptionInput): Promise<string> {
    const db = requireFirestore();
    const groupRef = paths.group(db, groupId);
    const consumptionRef = doc(paths.groupConsumptions(db));
    const subtotalCents = calculateSubtotal(input.quantity, input.unitPriceCents);
    if (subtotalCents <= 0 && input.unitPriceCents !== 0) throw new Error('Cantidad o precio no válidos');
    await runTransaction(db, async (tx) => {
      await this.assertActiveGroup(tx, groupRef, uid);
      tx.set(consumptionRef, {
        groupId,
        accountId: null,
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
      tx.update(groupRef, { totalCents: increment(subtotalCents), updatedAt: serverTimestamp() });
    });
    return consumptionRef.id;
  }

  async updateConsumption(uid: string, groupId: string, consumption: Consumption, input: NewConsumptionInput): Promise<void> {
    const db = requireFirestore();
    const subtotalCents = calculateSubtotal(input.quantity, input.unitPriceCents);
    const delta = subtotalCents - consumption.subtotalCents;
    await runTransaction(db, async (tx) => {
      await this.assertActiveGroup(tx, paths.group(db, groupId), uid);
      const ref = doc(paths.groupConsumptions(db), consumption.id);
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().userId !== uid || snap.data().groupId !== groupId) {
        throw new Error('Solo puedes editar tus propias consumiciones');
      }
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
      tx.update(paths.group(db, groupId), { totalCents: increment(delta), updatedAt: serverTimestamp() });
    });
  }

  /** El administrador corrige una consumición ajena y deja constancia en la MISMA transacción. */
  async correctConsumption(
    adminUid: string,
    groupId: string,
    consumption: Consumption,
    input: NewConsumptionInput,
  ): Promise<void> {
    const db = requireFirestore();
    const subtotalCents = calculateSubtotal(input.quantity, input.unitPriceCents);
    const delta = subtotalCents - consumption.subtotalCents;
    await runTransaction(db, async (tx) => {
      const groupRef = paths.group(db, groupId);
      const groupSnap = await tx.get(groupRef);
      if (groupSnap.data()?.createdBy !== adminUid || groupSnap.data()?.status !== 'active') {
        throw new Error('Solo el administrador puede corregir consumiciones ajenas');
      }
      const ref = doc(paths.groupConsumptions(db), consumption.id);
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().groupId !== groupId) throw new Error('Consumición no encontrada');
      const logId = doc(paths.activity(db)).id;
      tx.update(ref, {
        productId: input.productId,
        productName: input.productName,
        categoryId: input.categoryId,
        quantity: input.quantity,
        unitPriceCents: input.unitPriceCents,
        subtotalCents,
        note: input.note,
        correctionLogId: logId,
        updatedAt: serverTimestamp(),
      });
      tx.update(groupRef, { totalCents: increment(delta), updatedAt: serverTimestamp() });
      tx.set(doc(paths.activity(db), logId), {
        action: 'group.consumption_corrected',
        actorId: adminUid,
        groupId,
        accountId: null,
        targetId: consumption.id,
        details: `Corrección de ${consumption.productName}: ${consumption.quantity} × ${consumption.unitPriceCents}€ → ${input.quantity} × ${input.unitPriceCents}€`,
        createdAt: serverTimestamp(),
      });
    });
  }

  async deleteConsumption(uid: string, groupId: string, consumption: Consumption): Promise<void> {
    const db = requireFirestore();
    await runTransaction(db, async (tx) => {
      await this.assertActiveGroup(tx, paths.group(db, groupId), uid);
      const ref = doc(paths.groupConsumptions(db), consumption.id);
      const snap = await tx.get(ref);
      if (!snap.exists() || snap.data().userId !== uid) throw new Error('Solo puedes borrar tus propias consumiciones');
      tx.delete(ref);
      tx.update(paths.group(db, groupId), {
        totalCents: increment(-consumption.subtotalCents),
        updatedAt: serverTimestamp(),
      });
    });
  }

  async closeGroup(uid: string, groupId: string): Promise<void> {
    const db = requireFirestore();
    await runTransaction(db, async (tx) => {
      const groupRef = paths.group(db, groupId);
      const snap = await tx.get(groupRef);
      if (!snap.exists() || snap.data().createdBy !== uid || snap.data().status !== 'active') {
        throw new Error('Solo el administrador puede cerrar un grupo activo');
      }
      const now = serverTimestamp();
      tx.update(groupRef, { status: 'closed', closedAt: now, updatedAt: now });
      tx.set(doc(paths.activity(db)), {
        action: 'group.closed',
        actorId: uid,
        groupId,
        accountId: null,
        targetId: groupId,
        details: 'Cuenta del grupo cerrada',
        createdAt: now,
      });
    });
  }

  private async assertActiveGroup(tx: Transaction, groupRef: DocumentReference, uid: string): Promise<void> {
    const snap = await tx.get(groupRef);
    const data = snap.data();
    if (!data || data.status !== 'active' || !(data.memberUids as string[]).includes(uid)) {
      throw new Error('El grupo no existe, no eres miembro o ya está cerrado');
    }
  }
}

export const GROUP_ACTIVITY_ACTIONS: ActivityAction[] = [
  'group.created',
  'group.closed',
  'group.member_joined',
  'group.consumption_added',
  'group.consumption_corrected',
];
