import { useEffect } from 'react';
import { Coffee, Moon, Sun } from 'lucide-react';
import { Outlet, useLocation } from 'react-router-dom';
import { BottomNav } from '@/presentation/components/BottomNav';
import { useUiStore } from '@/state/stores';

const TITLES: Record<string, string> = {
  '/': 'La Cuenta Por Favor',
  '/new-account': 'Nueva cuenta',
  '/catalog': 'Catálogo',
  '/groups': 'Grupos',
  '/groups/new': 'Nuevo grupo',
  '/history': 'Historial',
  '/stats': 'Estadísticas',
  '/profile': 'Perfil',
};

function titleFor(pathname: string): string {
  if (TITLES[pathname]) return TITLES[pathname] ?? 'La Cuenta Por Favor';
  if (pathname.startsWith('/accounts/')) return pathname.endsWith('/summary') ? 'Resumen de cuenta' : 'Cuenta';
  if (pathname.startsWith('/groups/')) return pathname.endsWith('/summary') ? 'Resumen del grupo' : 'Grupo';
  return 'La Cuenta Por Favor';
}

export function AppLayout() {
  const { pathname } = useLocation();
  const theme = useUiStore((s) => s.theme);
  const toggleTheme = useUiStore((s) => s.toggleTheme);
  const toast = useUiStore((s) => s.toast);
  const clearToast = useUiStore((s) => s.clearToast);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(clearToast, 3200);
    return () => window.clearTimeout(timer);
  }, [toast, clearToast]);

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="brand">
          <Coffee size={22} />
          <h1>{titleFor(pathname)}</h1>
        </div>
        <button className="icon-button" onClick={toggleTheme} aria-label="Cambiar tema">
          {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
        </button>
      </header>
      <main className="app-content">
        <Outlet />
      </main>
      <BottomNav />
      {toast ? <div className={`toast ${toast.kind === 'error' ? 'error' : ''}`} role="status">{toast.message}</div> : null}
    </div>
  );
}
