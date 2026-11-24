import { useCallback, useEffect, useState } from 'react';
import type { Unsubscribe } from 'firebase/auth';
import { isFirebaseConfigured } from '@/config/firebase';
import { errorMessage } from '@/core/errors';
import type {
  ActivityLog,
  Category,
  Consumption,
  Group,
  GroupMember,
  IndividualAccount,
  Product,
  UserProfile,
} from '@/domain/entities';
import { buildStats } from '@/domain/services/totals';
import { useAuthStore, useUiStore } from './stores';
import { accountsRepository, activityRepository, authRepository, catalogRepository, groupsRepository } from './repositories';

export function useAuth(): { user: UserProfile | null; loading: boolean } {
  const user = useAuthStore((s) => s.user);
  const loading = useAuthStore((s) => s.loading);
  return { user, loading };
}

export function useAuthBootstrap(): void {
  const setUser = useAuthStore((s) => s.setUser);
  const setLoading = useAuthStore((s) => s.setLoading);
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }
    return authRepository.observeAuth(setUser, () => setUser(null));
  }, [setUser, setLoading]);
}

function useWatch<T>(
  subscribe: ((next: (value: T) => void, error: (e: unknown) => void) => Unsubscribe) | null,
  initial: T,
  deps: unknown[],
): { value: T; error: string | null } {
  const [value, setValue] = useState<T>(initial);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    setError(null);
    setValue(initial);
    if (!subscribe) return;
    let unsub: Unsubscribe | undefined;
    try {
      unsub = subscribe(setValue, (e) => setError(errorMessage(e)));
    } catch (e) {
      setError(errorMessage(e));
    }
    return () => unsub?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return { value, error };
}

export function useCatalog() {
  const { user } = useAuth();
  const [initializing, setInitializing] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setInitializing(false);
      return;
    }
    let active = true;
    setInitializing(true);
    catalogRepository
      .initializeCatalog(user.uid)
      .catch((e: unknown) => {
        if (active) setInitError(errorMessage(e));
      })
      .finally(() => {
        if (active) setInitializing(false);
      });
    return () => {
      active = false;
    };
  }, [user?.uid]);

  const categories = useWatch<Category[]>(
    user && !initError ? (next, error) => catalogRepository.watchCategories(user.uid, next, error) : null,
    [],
    [user?.uid, initError],
  );
  const products = useWatch<Product[]>(
    user && !initError ? (next, error) => catalogRepository.watchProducts(user.uid, next, error) : null,
    [],
    [user?.uid, initError],
  );

  return {
    categories: categories.value,
    products: products.value,
    loading: initializing || (categories.value.length === 0 && products.value.length === 0 && !initError),
    error: initError ?? categories.error ?? products.error,
  };
}

export function useAccounts() {
  const { user } = useAuth();
  return useWatch<IndividualAccount[]>(
    user ? (next, error) => accountsRepository.watchAccounts(user.uid, next, error) : null,
    [],
    [user?.uid],
  );
}

export function useAccount(accountId: string | undefined) {
  const account = useWatch<IndividualAccount | null>(
    accountId ? (next, error) => accountsRepository.watchAccount(accountId, next, error) : null,
    null,
    [accountId],
  );
  const consumptions = useWatch<Consumption[]>(
    accountId ? (next, error) => accountsRepository.watchConsumptions(accountId, next, error) : null,
    [],
    [accountId],
  );
  const activity = useWatch<ActivityLog[]>(
    accountId ? (next, error) => activityRepository.watchAccountActivity(accountId, next, error) : null,
    [],
    [accountId],
  );
  return { account: account.value, consumptions: consumptions.value, activity: activity.value, error: account.error ?? consumptions.error };
}

export function useGroups() {
  const { user } = useAuth();
  return useWatch<Group[]>(
    user ? (next, error) => groupsRepository.watchGroups(user.uid, next, error) : null,
    [],
    [user?.uid],
  );
}

export function useGroup(groupId: string | undefined) {
  const group = useWatch<Group | null>(
    groupId ? (next, error) => groupsRepository.watchGroup(groupId, next, error) : null,
    null,
    [groupId],
  );
  const members = useWatch<GroupMember[]>(
    groupId ? (next, error) => groupsRepository.watchMembers(groupId, next, error) : null,
    [],
    [groupId],
  );
  const consumptions = useWatch<Consumption[]>(
    groupId ? (next, error) => groupsRepository.watchConsumptions(groupId, next, error) : null,
    [],
    [groupId],
  );
  const activity = useWatch<ActivityLog[]>(
    groupId ? (next, error) => activityRepository.watchGroupActivity(groupId, next, error) : null,
    [],
    [groupId],
  );
  return {
    group: group.value,
    members: members.value,
    consumptions: consumptions.value,
    activity: activity.value,
    error: group.error ?? members.error ?? consumptions.error,
  };
}

/** Estadísticas del usuario: consumiciones individuales + consumiciones en grupos. */
export function useUserStats() {
  const { user } = useAuth();
  const accounts = useAccounts();
  const [individual, setIndividual] = useState<Consumption[]>([]);
  const [inGroups, setInGroups] = useState<Consumption[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const stop1 = accountsRepository.watchUserConsumptions(user.uid, setIndividual, (e) => setError(errorMessage(e)));
    const stop2 = groupsRepository.watchUserConsumptions(user.uid, setInGroups, (e) => setError(errorMessage(e)));
    return () => { stop1(); stop2(); };
  }, [user?.uid]);

  const all = [...individual, ...inGroups];
  return { stats: buildStats(all, accounts.value), consumptions: all, accounts: accounts.value, error };
}

/** Ejecuta una acción asíncrona mostrando errores y feedback al usuario. */
export function useAction() {
  const showToast = useUiStore((s) => s.showToast);
  const [pending, setPending] = useState(false);
  const run = useCallback(
    async <T,>(fn: () => Promise<T>, successMessage?: string): Promise<T | undefined> => {
      setPending(true);
      try {
        const result = await fn();
        if (successMessage) showToast(successMessage);
        return result;
      } catch (e) {
        showToast(errorMessage(e), 'error');
        return undefined;
      } finally {
        setPending(false);
      }
    },
    [showToast],
  );
  return { run, pending };
}
