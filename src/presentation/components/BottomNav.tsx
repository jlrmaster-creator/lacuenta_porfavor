import { BarChart3, History, House, Plus, Users } from 'lucide-react';
import { NavLink } from 'react-router-dom';

const items = [
  { to: '/', label: 'Inicio', Icon: House, end: true },
  { to: '/new-account', label: 'Nueva cuenta', Icon: Plus, end: false },
  { to: '/groups', label: 'Grupos', Icon: Users, end: false },
  { to: '/history', label: 'Historial', Icon: History, end: false },
  { to: '/profile', label: 'Perfil', Icon: BarChart3, end: false },
];

export function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Navegación principal">
      {items.map(({ to, label, Icon, end }) => (
        <NavLink key={to} to={to} end={end} className={({ isActive }) => (isActive ? 'active' : '')}>
          <Icon size={21} strokeWidth={2} />
          <span>{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
