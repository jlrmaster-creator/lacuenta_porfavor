import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { formatCents } from '@/core/money';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  block?: boolean;
  loading?: boolean;
}

export function Button({ variant = 'primary', size = 'md', block, loading, className = '', children, disabled, ...props }: ButtonProps) {
  return (
    <button
      className={`btn btn-${variant} ${size !== 'md' ? `btn-${size}` : ''} ${block ? 'btn-block' : ''} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <span className="spinner" style={{ margin: 0, width: 18, height: 18 }} /> : null}
      {children}
    </button>
  );
}

export function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <section className={`card ${className}`}>{children}</section>;
}

export function Banner({ children }: { children: ReactNode }) {
  return <div className="banner" role="alert">{children}</div>;
}

export function EmptyState({ icon = '🧾', title, text }: { icon?: string; title: string; text?: string }) {
  return (
    <div className="empty">
      <span className="emoji">{icon}</span>
      <strong>{title}</strong>
      {text ? <p className="muted">{text}</p> : null}
    </div>
  );
}

export function Spinner() {
  return <div className="spinner" role="status" aria-label="Cargando" />;
}

export function TotalDisplay({ cents, label = 'Total acumulado' }: { cents: number; label?: string }) {
  return (
    <div className="total-display">
      <div className="label">{label}</div>
      <div className="amount">{formatCents(cents)}</div>
    </div>
  );
}

export function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
      {error ? <span className="field-error">{error}</span> : null}
    </div>
  );
}
