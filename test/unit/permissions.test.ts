import { describe, expect, it } from 'vitest';
import type { Consumption, Group, GroupMember, IndividualAccount } from '@/domain/entities';
import {
  canCloseGroup,
  canCorrectAsAdmin,
  canEditAccount,
  canEditOwnConsumption,
  canReopenAccount,
  isGroupAdmin,
} from '@/domain/services/permissions';

const account = (status: IndividualAccount['status']): IndividualAccount => ({
  id: 'a1', ownerId: 'u1', venueName: '', status, openedAt: '', closedAt: null,
  reopenedAt: null, totalCents: 0, createdAt: '', updatedAt: '',
});

const group: Group = {
  id: 'g1', name: 'Grupo', createdBy: 'u1', status: 'active', inviteCode: 'ABC12345',
  openedAt: '', closedAt: null, totalCents: 0, createdAt: '', updatedAt: '',
};

const admin: GroupMember = { uid: 'u1', groupId: 'g1', displayName: 'Uno', photoURL: null, role: 'admin', joinedAt: '' };
const member: GroupMember = { uid: 'u2', groupId: 'g1', displayName: 'Dos', photoURL: null, role: 'member', joinedAt: '' };

const consumption: Consumption = {
  id: 'c1', accountId: null, groupId: 'g1', userId: 'u2', productId: 'p', productName: 'Cerveza',
  categoryId: 'cat', quantity: 1, unitPriceCents: 300, subtotalCents: 300, note: '', createdAt: '', updatedAt: '',
};

describe('permisos (espejo de las reglas de Firestore)', () => {
  it('solo el propietario edita una cuenta abierta', () => {
    expect(canEditAccount(account('open'), 'u1')).toBe(true);
    expect(canEditAccount(account('open'), 'u2')).toBe(false);
    expect(canEditAccount(account('paid'), 'u1')).toBe(false);
  });

  it('reabrir una cuenta pagada es una acción explícita', () => {
    expect(canReopenAccount(account('paid'), 'u1')).toBe(true);
    expect(canReopenAccount(account('open'), 'u1')).toBe(false);
    expect(canReopenAccount(account('paid'), 'u2')).toBe(false);
  });

  it('solo el administrador cierra el grupo', () => {
    expect(isGroupAdmin(admin)).toBe(true);
    expect(isGroupAdmin(member)).toBe(false);
    expect(canCloseGroup(group, admin)).toBe(true);
    expect(canCloseGroup(group, member)).toBe(false);
    expect(canCloseGroup({ ...group, status: 'closed' }, admin)).toBe(false);
  });

  it('cada usuario edita solo sus consumiciones mientras el grupo está abierto', () => {
    expect(canEditOwnConsumption(consumption, 'u2', 'active')).toBe(true);
    expect(canEditOwnConsumption(consumption, 'u1', 'active')).toBe(false);
    expect(canEditOwnConsumption(consumption, 'u2', 'closed')).toBe(false);
  });

  it('el administrador puede corregir, pero queda registrado', () => {
    expect(canCorrectAsAdmin(admin, group)).toBe(true);
    expect(canCorrectAsAdmin(member, group)).toBe(false);
    expect(canCorrectAsAdmin(admin, { ...group, status: 'closed' })).toBe(false);
  });
});
