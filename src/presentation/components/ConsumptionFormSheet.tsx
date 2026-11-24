import { useMemo, useState } from 'react';
import { X } from 'lucide-react';
import type { Category, Product } from '@/domain/entities';
import type { NewConsumptionInput } from '@/domain/ports';
import { formatCents, parseEuroToCents } from '@/core/money';
import { Button, Field } from './ui';

interface Props {
  products: Product[];
  categories: Category[];
  initial?: NewConsumptionInput & { productId: string };
  title?: string;
  onSubmit: (input: NewConsumptionInput) => Promise<void> | void;
  onClose: () => void;
  busy?: boolean;
}

export function ConsumptionFormSheet({ products, categories, initial, title = 'Añadir consumición', onSubmit, onClose, busy }: Props) {
  const [search, setSearch] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [productId, setProductId] = useState(initial?.productId ?? '');
  const [quantity, setQuantity] = useState(initial?.quantity ?? 1);
  const [price, setPrice] = useState(
    initial ? (initial.unitPriceCents / 100).toFixed(2).replace('.', ',') : '',
  );
  const [note, setNote] = useState(initial?.note ?? '');
  const [error, setError] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es');
    return products.filter(
      (p) =>
        (categoryId === 'all' || p.categoryId === categoryId) &&
        (term === '' || p.name.toLocaleLowerCase('es').includes(term)),
    );
  }, [products, search, categoryId]);

  const selected = products.find((p) => p.id === productId);
  const total = parseEuroToCents(price) !== null ? quantity * parseEuroToCents(price)! : 0;

  const choose = (product: Product) => {
    setProductId(product.id);
    if (!price) {
      setPrice(product.suggestedPriceCents !== null ? (product.suggestedPriceCents / 100).toFixed(2).replace('.', ',') : '');
    }
  };

  const submit = async () => {
    const cents = parseEuroToCents(price);
    if (!selected) return setError('Selecciona un producto');
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return setError('Cantidad no válida');
    if (cents === null || cents < 0) return setError('Introduce un precio válido');
    setError('');
    await onSubmit({
      productId: selected.id,
      productName: selected.name,
      categoryId: selected.categoryId,
      quantity,
      unitPriceCents: cents,
      note: note.trim(),
    });
  };

  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="sheet" role="dialog" aria-modal="true" aria-label={title}>
        <div className="sheet-handle" />
        <div className="row-between">
          <h2>{title}</h2>
          <button className="icon-button" onClick={onClose} aria-label="Cerrar"><X size={20} /></button>
        </div>

        {!initial ? (
          <>
            <Field label="Buscar producto">
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Ej. caña, tapas…" autoFocus />
            </Field>
            <div className="chip-row">
              <button className={`chip ${categoryId === 'all' ? 'active' : ''}`} onClick={() => setCategoryId('all')}>Todos</button>
              {categories.map((c) => (
                <button key={c.id} className={`chip ${categoryId === c.id ? 'active' : ''}`} onClick={() => setCategoryId(c.id)}>
                  {c.icon} {c.name}
                </button>
              ))}
            </div>
            <div className="product-grid mt-1">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  className="product-tile"
                  style={productId === p.id ? { borderColor: 'var(--primary)', background: 'var(--primary-soft)' } : undefined}
                  onClick={() => choose(p)}
                >
                  <span className="emoji">{p.icon}</span>
                  <span>{p.name}</span>
                  {p.suggestedPriceCents !== null ? <small className="muted">{formatCents(p.suggestedPriceCents)}</small> : null}
                </button>
              ))}
            </div>
            {filtered.length === 0 ? <p className="muted center mt-2">No hay productos con ese filtro.</p> : null}
            <div className="divider" />
          </>
        ) : (
          <p className="muted mb-1">{selected?.name ?? 'Producto'}</p>
        )}

        <div className="row">
          <div className="field" style={{ flex: 1 }}>
            <label>Cantidad</label>
            <div className="stepper">
              <button onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Quitar una unidad">−</button>
              <span>{quantity}</span>
              <button onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Añadir una unidad">+</button>
            </div>
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>Precio unitario (€)</label>
            <input inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="0,00" />
          </div>
        </div>
        <Field label="Nota (opcional)">
          <input value={note} onChange={(e) => setNote(e.target.value)} maxLength={200} placeholder="Ej. sin hielo" />
        </Field>
        {error ? <div className="banner">{error}</div> : null}
        <div className="row-between mt-1">
          <span className="muted">Subtotal: <strong>{formatCents(total)}</strong></span>
          <div className="row">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button onClick={() => void submit()} disabled={busy} loading={busy}>Guardar</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
