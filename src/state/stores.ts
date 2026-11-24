import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { UserProfile } from '@/domain/entities';

interface AuthState {
  user: UserProfile | null;
  loading: boolean;
  setUser: (user: UserProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  setUser: (user) => set({ user, loading: false }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ user: null, loading: false }),
}));

export type ThemeMode = 'light' | 'dark';

interface UiState {
  theme: ThemeMode;
  toast: { id: number; message: string; kind: 'success' | 'error' } | null;
  toggleTheme: () => void;
  showToast: (message: string, kind?: 'success' | 'error') => void;
  clearToast: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      theme: 'light',
      toast: null,
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      showToast: (message, kind = 'success') => set({ toast: { id: Date.now(), message, kind } }),
      clearToast: () => set({ toast: null }),
    }),
    {
      name: 'lacuenta-ui',
      version: 3,
      migrate: (persistedState, version) => {
        const state = persistedState as Partial<UiState> | undefined;
        return { ...state, theme: version < 3 ? 'light' : (state?.theme ?? 'light') } as UiState;
      },
      partialize: (state) => ({ theme: state.theme }),
    },
  ),
);
