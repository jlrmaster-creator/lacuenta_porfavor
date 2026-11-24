/** Entidades del dominio. Todos los importes se expresan en CÉNTIMOS (int). */

export type ISODateTime = string;
export type Cents = number;

export type AccountStatus = 'open' | 'paid' | 'cancelled';
export type GroupStatus = 'active' | 'closed';
export type ProductKind = 'drink' | 'food' | 'other';
export type GroupRole = 'admin' | 'member';

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Category {
  id: string;
  name: string;
  kind: ProductKind;
  icon: string;
  ownerId: string; // 'system' para el catálogo base, uid para catálogo personal
  active: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  subcategory: string;
  icon: string;
  imageUrl: string | null;
  /** Precio orientativo opcional; el precio real se introduce en cada consumición. */
  suggestedPriceCents: Cents | null;
  active: boolean;
  ownerId: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface IndividualAccount {
  id: string;
  ownerId: string;
  venueName: string;
  status: AccountStatus;
  openedAt: ISODateTime;
  closedAt: ISODateTime | null;
  reopenedAt: ISODateTime | null;
  totalCents: Cents;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Consumption {
  id: string;
  /** exactly one of accountId / groupId */
  accountId: string | null;
  groupId: string | null;
  userId: string;
  productId: string;
  /** snapshot del producto para que el histórico no cambie si se edita el catálogo */
  productName: string;
  categoryId: string;
  quantity: number;
  unitPriceCents: Cents;
  subtotalCents: Cents;
  note: string;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface Group {
  id: string;
  name: string;
  createdBy: string;
  status: GroupStatus;
  inviteCode: string;
  openedAt: ISODateTime;
  closedAt: ISODateTime | null;
  totalCents: Cents;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
}

export interface GroupMember {
  uid: string;
  groupId: string;
  displayName: string;
  photoURL: string | null;
  role: GroupRole;
  joinedAt: ISODateTime;
}

export interface Invitation {
  code: string;
  groupId: string;
  createdBy: string;
  createdAt: ISODateTime;
  expiresAt: ISODateTime | null;
  uses: number;
  maxUses: number | null;
}

export type ActivityAction =
  | 'account.opened'
  | 'account.paid'
  | 'account.reopened'
  | 'account.cancelled'
  | 'group.created'
  | 'group.closed'
  | 'group.member_joined'
  | 'group.consumption_added'
  | 'group.consumption_corrected'
  | 'product.created'
  | 'product.updated'
  | 'product.deleted';

export interface ActivityLog {
  id: string;
  action: ActivityAction;
  actorId: string;
  /** grupo o cuenta afectada (al menos uno) */
  groupId: string | null;
  accountId: string | null;
  targetId: string;
  details: string;
  createdAt: ISODateTime;
}

export interface UserTotals {
  userId: string;
  displayName: string;
  consumptionCount: number;
  totalCents: Cents;
}

export interface GroupSummary {
  groupId: string;
  groupName: string;
  totalCents: Cents;
  consumptionCount: number;
  perUser: UserTotals[];
  closedAt: ISODateTime | null;
}

export interface StatsSummary {
  weekCents: Cents;
  monthCents: Cents;
  averageCents: Cents;
  byCategory: { categoryId: string; totalCents: Cents; count: number }[];
  topProducts: { productName: string; count: number }[];
  outings: number;
}
