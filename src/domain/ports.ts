import type { Unsubscribe } from 'firebase/auth';
import type {
  ActivityLog,
  Category,
  Consumption,
  Group,
  GroupMember,
  IndividualAccount,
  Invitation,
  Product,
  UserProfile,
} from '@/domain/entities';

export interface AuthPort {
  observeAuth(next: (user: UserProfile | null) => void, error?: (e: unknown) => void): Unsubscribe;
  signUp(email: string, password: string, displayName: string): Promise<UserProfile>;
  signIn(email: string, password: string): Promise<UserProfile>;
  sendPasswordReset(email: string): Promise<void>;
  signOut(): Promise<void>;
  updateProfile(displayName: string, photoURL: string | null): Promise<void>;
}

export interface CatalogPort {
  watchCategories(uid: string, next: (items: Category[]) => void, error?: (e: unknown) => void): Unsubscribe;
  watchProducts(uid: string, next: (items: Product[]) => void, error?: (e: unknown) => void): Unsubscribe;
  initializeCatalog(uid: string): Promise<void>;
  createCategory(uid: string, data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<string>;
  createProduct(uid: string, data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>): Promise<string>;
  updateProduct(uid: string, product: Product): Promise<void>;
  deleteProduct(uid: string, productId: string): Promise<void>;
}

export interface AccountsPort {
  watchAccounts(uid: string, next: (items: IndividualAccount[]) => void, error?: (e: unknown) => void): Unsubscribe;
  watchAccount(accountId: string, next: (account: IndividualAccount | null) => void, error?: (e: unknown) => void): Unsubscribe;
  watchConsumptions(accountId: string, next: (items: Consumption[]) => void, error?: (e: unknown) => void): Unsubscribe;
  watchUserConsumptions(uid: string, next: (items: Consumption[]) => void, error?: (e: unknown) => void): Unsubscribe;
  createAccount(uid: string, venueName: string): Promise<string>;
  addConsumption(uid: string, accountId: string, input: NewConsumptionInput): Promise<string>;
  updateConsumption(uid: string, consumption: Consumption, input: NewConsumptionInput): Promise<void>;
  deleteConsumption(uid: string, consumption: Consumption): Promise<void>;
  setAccountStatus(uid: string, accountId: string, status: 'paid' | 'cancelled' | 'open'): Promise<void>;
}

export interface NewConsumptionInput {
  productId: string;
  productName: string;
  categoryId: string;
  quantity: number;
  unitPriceCents: number;
  note: string;
}

export interface GroupsPort {
  watchGroups(uid: string, next: (items: Group[]) => void, error?: (e: unknown) => void): Unsubscribe;
  watchGroup(groupId: string, next: (group: Group | null) => void, error?: (e: unknown) => void): Unsubscribe;
  watchMembers(groupId: string, next: (items: GroupMember[]) => void, error?: (e: unknown) => void): Unsubscribe;
  watchConsumptions(groupId: string, next: (items: Consumption[]) => void, error?: (e: unknown) => void): Unsubscribe;
  watchUserConsumptions(uid: string, next: (items: Consumption[]) => void, error?: (e: unknown) => void): Unsubscribe;
  createGroup(uid: string, displayName: string, name: string): Promise<{ groupId: string; inviteCode: string }>;
  findInvitation(code: string): Promise<Invitation | null>;
  joinGroup(uid: string, displayName: string, code: string): Promise<string>;
  addConsumption(uid: string, groupId: string, input: NewConsumptionInput): Promise<string>;
  updateConsumption(uid: string, groupId: string, consumption: Consumption, input: NewConsumptionInput): Promise<void>;
  /** Corrección del administrador: escribe la consumición y un activityLog en la MISMA transacción. */
  correctConsumption(adminUid: string, groupId: string, consumption: Consumption, input: NewConsumptionInput): Promise<void>;
  deleteConsumption(uid: string, groupId: string, consumption: Consumption): Promise<void>;
  closeGroup(uid: string, groupId: string): Promise<void>;
}

export interface ActivityPort {
  watchGroupActivity(groupId: string, next: (items: ActivityLog[]) => void, error?: (e: unknown) => void): Unsubscribe;
  watchAccountActivity(accountId: string, next: (items: ActivityLog[]) => void, error?: (e: unknown) => void): Unsubscribe;
}
