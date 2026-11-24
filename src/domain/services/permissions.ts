import type { AccountStatus, Consumption, Group, GroupMember, GroupRole, IndividualAccount } from '@/domain/entities';

export function canEditAccount(account: IndividualAccount, uid: string): boolean {
  return account.ownerId === uid && account.status === 'open';
}

/** Reabrir una cuenta pagada es una acción explícita y queda registrada. */
export function canReopenAccount(account: IndividualAccount, uid: string): boolean {
  return account.ownerId === uid && account.status === 'paid';
}

export function canPayAccount(account: IndividualAccount, uid: string): boolean {
  return account.ownerId === uid && account.status === 'open';
}

export function isGroupAdmin(membership: GroupMember | null): boolean {
  return membership?.role === 'admin';
}

export function canCloseGroup(group: Group, membership: GroupMember | null): boolean {
  return group.status === 'active' && group.createdBy === membership?.uid && isGroupAdmin(membership);
}

export function canManageGroup(membership: GroupMember | null): boolean {
  return isGroupAdmin(membership);
}

/**
 * Un miembro siempre puede editar SUS propias consumiciones mientras el grupo esté abierto.
 * La corrección de consumiciones ajenas solo la hace el administrador y queda registrada
 * en activityLogs (misma transacción; ver repositorio y reglas de Firestore).
 */
export function canEditOwnConsumption(
  consumption: Consumption,
  uid: string,
  groupStatus: AccountStatus | 'active' | 'closed' | null,
): boolean {
  return consumption.userId === uid && groupStatus !== 'closed';
}

export function canCorrectAsAdmin(membership: GroupMember | null, group: Group): boolean {
  return isGroupAdmin(membership) && group.status === 'active';
}

export function roleLabel(role: GroupRole): string {
  return role === 'admin' ? 'Administrador' : 'Miembro';
}
