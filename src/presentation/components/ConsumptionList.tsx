import { Pencil, Trash2 } from 'lucide-react';
import type { Consumption, Product } from '@/domain/entities';
import { formatCents } from '@/core/money';
import { EmptyState } from './ui';

interface Props {
  consumptions: Consumption[];
  products: Product[];
  memberNames?: Record<string, string>;
  editable?: (consumption: Consumption) => boolean;
  onEdit?: (consumption: Consumption) => void;
  onDelete?: (consumption: Consumption) => void;
}

export function ConsumptionList({ consumptions, products, memberNames, editable, onEdit, onDelete }: Props) {
  if (consumptions.length === 0) {
    return <EmptyState icon="🍽️" title="Sin consumiciones" text="Añade la primera bebida o comida para empezar." />;
  }
  const iconFor = (c: Consumption) => products.find((p) => p.id === c.productId)?.icon ?? '🍴';
  return (
    <div>
      {consumptions.map((c) => {
        const canEdit = editable?.(c) ?? false;
        return (
          <div className="consumption-item" key={c.id}>
            <span className="emoji">{iconFor(c)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{c.productName}</strong>
              <small>
                {c.quantity} × {formatCents(c.unitPriceCents)}
                {memberNames?.[c.userId] ? ` · ${memberNames[c.userId]}` : ''}
                {c.note ? ` · ${c.note}` : ''}
              </small>
            </div>
            <strong>{formatCents(c.subtotalCents)}</strong>
            {canEdit ? (
              <div className="row" style={{ gap: 2 }}>
                {onEdit ? (
                  <button className="icon-button" onClick={() => onEdit(c)} aria-label="Editar"><Pencil size={16} /></button>
                ) : null}
                {onDelete ? (
                  <button className="icon-button" onClick={() => onDelete(c)} aria-label="Eliminar"><Trash2 size={16} color="var(--danger)" /></button>
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Botones rápidos con los productos más recientes para añadir una unidad de un toque. */
export function QuickAddRow({
  products,
  consumptions,
  onAdd,
}: {
  products: Product[];
  consumptions: Consumption[];
  onAdd: (product: Product) => void;
}) {
  const recentIds = [...new Set(consumptions.map((c) => c.productId))].slice(0, 6);
  const recent = recentIds
    .map((id) => products.find((p) => p.id === id))
    .filter((p): p is Product => p !== undefined);
  const fallback = products.filter((p) => recentIds.includes(p.id) === false).slice(0, 6 - recent.length);
  const all = [...recent, ...fallback];
  if (all.length === 0) return null;
  return (
    <div className="chip-row" aria-label="Añadir rápido">
      {all.map((p) => (
        <button key={p.id} className="chip" onClick={() => onAdd(p)} title={`Añadir ${p.name}`}>
          {p.icon} {p.name} <strong>+</strong>
        </button>
      ))}
    </div>
  );
}
