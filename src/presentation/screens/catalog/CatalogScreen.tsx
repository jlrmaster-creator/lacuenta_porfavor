import { useMemo, useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { formatCents, parseEuroToCents } from '@/core/money';
import type { Product } from '@/domain/entities';
import { categoryKindLabel } from '@/domain/services/catalog';
import { categorySchema, productSchema, type ProductForm } from '@/domain/services/validators';
import { Banner, Button, Card, Field, Spinner } from '@/presentation/components/ui';
import { useAction, useAuth, useCatalog } from '@/state/hooks';
import { catalogRepository } from '@/state/repositories';

const emptyDraft: ProductForm = { name: '', categoryId: '', subcategory: '', suggestedPriceInput: '', icon: '🍴' };

export function CatalogScreen() {
  const { categories, products, loading, error } = useCatalog();
  const { user } = useAuth();
  const { run, pending } = useAction();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [sheet, setSheet] = useState<'product' | 'category' | null>(null);
  const [editing, setEditing] = useState<Product | null>(null);
  const [draft, setDraft] = useState<ProductForm>(emptyDraft);
  const [catDraft, setCatDraft] = useState({ name: '', kind: 'drink' as 'drink' | 'food' | 'other', icon: '🥤' });
  const [formError, setFormError] = useState('');

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('es');
    return products.filter(
      (p) => (filter === 'all' || p.categoryId === filter) && (term === '' || p.name.toLocaleLowerCase('es').includes(term)),
    );
  }, [products, search, filter]);

  const openProduct = (product?: Product) => {
    setEditing(product ?? null);
    setDraft(product ? {
      name: product.name,
      categoryId: product.categoryId,
      subcategory: product.subcategory,
      suggestedPriceInput: product.suggestedPriceCents !== null ? (product.suggestedPriceCents / 100).toFixed(2).replace('.', ',') : '',
      icon: product.icon,
    } : { ...emptyDraft, categoryId: categories[0]?.id ?? '' });
    setFormError('');
    setSheet('product');
  };

  const saveProduct = async () => {
    if (!user) return;
    const parsed = productSchema.safeParse(draft);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Datos no válidos');
      return;
    }
    const price = parsed.data.suggestedPriceInput === '' ? null : parseEuroToCents(parsed.data.suggestedPriceInput);
    const data = {
      name: parsed.data.name,
      categoryId: parsed.data.categoryId,
      subcategory: parsed.data.subcategory,
      icon: parsed.data.icon || '🍴',
      imageUrl: editing?.imageUrl ?? null,
      suggestedPriceCents: price,
      active: true,
    };
    if (editing) {
      await run(() => catalogRepository.updateProduct(user.uid, { ...editing, ...data }), 'Producto actualizado');
    } else {
      await run(() => catalogRepository.createProduct(user.uid, data), 'Producto creado');
    }
    setSheet(null);
  };

  const saveCategory = async () => {
    if (!user) return;
    const parsed = categorySchema.safeParse(catDraft);
    if (!parsed.success) {
      setFormError(parsed.error.issues[0]?.message ?? 'Datos no válidos');
      return;
    }
    await run(() => catalogRepository.createCategory(user.uid, { ...parsed.data, active: true }), 'Categoría creada');
    setSheet(null);
  };

  if (error) return <Banner>{error}</Banner>;
  if (loading && products.length === 0) return <Spinner />;

  return (
    <div className="column">
      <div className="row">
        <Button block onClick={() => openProduct()}><Plus size={16} /> Producto</Button>
        <Button variant="secondary" block onClick={() => { setSheet('category'); setFormError(''); }}><Plus size={16} /> Categoría</Button>
      </div>

      <Card>
        <Field label="Buscar">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar producto…" />
        </Field>
        <div className="chip-row">
          <button className={`chip ${filter === 'all' ? 'active' : ''}`} onClick={() => setFilter('all')}>Todas</button>
          {categories.map((c) => (
            <button key={c.id} className={`chip ${filter === c.id ? 'active' : ''}`} onClick={() => setFilter(c.id)}>{c.icon} {c.name}</button>
          ))}
        </div>
      </Card>

      <Card>
        <h2 className="card-title">Productos ({filtered.length})</h2>
        <div className="divider" />
        {filtered.map((p) => (
          <div className="consumption-item" key={p.id}>
            <span className="emoji">{p.icon}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <strong>{p.name}</strong>
              <small>{categories.find((c) => c.id === p.categoryId)?.name ?? 'Sin categoría'}{p.suggestedPriceCents !== null ? ` · ${formatCents(p.suggestedPriceCents)}` : ''}</small>
            </div>
            <button className="icon-button" onClick={() => openProduct(p)} aria-label="Editar"><Pencil size={16} /></button>
            <button className="icon-button" onClick={() => {
              if (user && window.confirm(`¿Eliminar ${p.name} de tu catálogo?`)) {
                void run(() => catalogRepository.deleteProduct(user.uid, p.id), 'Producto eliminado');
              }
            }} aria-label="Eliminar"><Trash2 size={16} color="var(--danger)" /></button>
          </div>
        ))}
        {filtered.length === 0 ? <p className="muted center">No hay productos que coincidan.</p> : null}
      </Card>

      <Card>
        <h2 className="card-title">Categorías</h2>
        {categories.map((c) => (
          <div className="row-between small" key={c.id} style={{ padding: '6px 0' }}>
            <span>{c.icon} {c.name}</span>
            <span className="badge">{categoryKindLabel(c.kind)}</span>
          </div>
        ))}
      </Card>

      {sheet ? (
        <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && setSheet(null)}>
          <div className="sheet" role="dialog" aria-modal="true">
            <div className="sheet-handle" />
            <div className="row-between">
              <h2>{sheet === 'product' ? (editing ? 'Editar producto' : 'Nuevo producto') : 'Nueva categoría'}</h2>
              <button className="icon-button" onClick={() => setSheet(null)} aria-label="Cerrar"><X size={20} /></button>
            </div>
            {formError ? <div className="banner">{formError}</div> : null}
            {sheet === 'product' ? (
              <div>
                <Field label="Nombre"><input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} /></Field>
                <Field label="Categoría">
                  <select value={draft.categoryId} onChange={(e) => setDraft({ ...draft, categoryId: e.target.value })}>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </Field>
                <Field label="Subcategoría"><input value={draft.subcategory} onChange={(e) => setDraft({ ...draft, subcategory: e.target.value })} /></Field>
                <div className="row">
                  <div className="field" style={{ flex: 1 }}><label>Icono</label><input value={draft.icon} maxLength={8} onChange={(e) => setDraft({ ...draft, icon: e.target.value })} /></div>
                  <div className="field" style={{ flex: 1 }}><label>Precio orientativo (€)</label><input inputMode="decimal" value={draft.suggestedPriceInput} onChange={(e) => setDraft({ ...draft, suggestedPriceInput: e.target.value })} placeholder="Opcional" /></div>
                </div>
                <Button block size="lg" onClick={() => void saveProduct()} loading={pending}>Guardar producto</Button>
              </div>
            ) : (
              <div>
                <Field label="Nombre"><input value={catDraft.name} onChange={(e) => setCatDraft({ ...catDraft, name: e.target.value })} /></Field>
                <Field label="Tipo">
                  <select value={catDraft.kind} onChange={(e) => setCatDraft({ ...catDraft, kind: e.target.value as 'drink' | 'food' | 'other' })}>
                    <option value="drink">Bebidas</option><option value="food">Comidas</option><option value="other">Otros</option>
                  </select>
                </Field>
                <Field label="Icono"><input value={catDraft.icon} maxLength={8} onChange={(e) => setCatDraft({ ...catDraft, icon: e.target.value })} /></Field>
                <Button block size="lg" onClick={() => void saveCategory()} loading={pending}>Guardar categoría</Button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
