import type { Category, Product, ProductKind } from '@/domain/entities';

export const SYSTEM_OWNER = 'system';

const drinkCategories: { id: string; name: string; icon: string }[] = [
  { id: 'cat-beer', name: 'Cervezas', icon: '🍺' },
  { id: 'cat-wine', name: 'Vino', icon: '🍷' },
  { id: 'cat-soft', name: 'Refrescos y aguas', icon: '🥤' },
  { id: 'cat-coffee', name: 'Cafés e infusiones', icon: '☕' },
  { id: 'cat-spirits', name: 'Copas y cócteles', icon: '🍸' },
  { id: 'cat-other-drinks', name: 'Otras bebidas', icon: '🧃' },
];

const foodCategories: { id: string; name: string; icon: string }[] = [
  { id: 'cat-tapas', name: 'Tapas', icon: '🍢' },
  { id: 'cat-portions', name: 'Raciones', icon: '🍽️' },
  { id: 'cat-sandwiches', name: 'Bocadillos y sándwiches', icon: '🥪' },
  { id: 'cat-burgers', name: 'Hamburguesas', icon: '🍔' },
  { id: 'cat-snacks', name: 'Aperitivos', icon: '🥨' },
  { id: 'cat-desserts', name: 'Postres', icon: '🍰' },
  { id: 'cat-other-foods', name: 'Otros alimentos', icon: '🍲' },
];

function makeCategory(id: string, name: string, icon: string, kind: ProductKind): Category {
  return {
    id,
    name,
    kind,
    icon,
    ownerId: SYSTEM_OWNER,
    active: true,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  };
}

function makeProduct(
  id: string,
  name: string,
  categoryId: string,
  subcategory: string,
  icon: string,
): Product {
  return {
    id,
    name,
    categoryId,
    subcategory,
    icon,
    imageUrl: null,
    suggestedPriceCents: null,
    active: true,
    ownerId: SYSTEM_OWNER,
    createdAt: '1970-01-01T00:00:00.000Z',
    updatedAt: '1970-01-01T00:00:00.000Z',
  };
}

export const DEFAULT_CATEGORIES: Category[] = [
  ...drinkCategories.map((c) => makeCategory(c.id, c.name, c.icon, 'drink')),
  ...foodCategories.map((c) => makeCategory(c.id, c.name, c.icon, 'food')),
];

/** Catálogo base del enunciado. Los precios se dejan vacíos a propósito: varían por establecimiento. */
export const DEFAULT_PRODUCTS: Product[] = [
  // Bebidas
  makeProduct('prod-cerveza', 'Cerveza', 'cat-beer', 'Cerveza', '🍺'),
  makeProduct('prod-cana', 'Caña', 'cat-beer', 'Caña', '🍺'),
  makeProduct('prod-doble', 'Doble', 'cat-beer', 'Doble', '🍺'),
  makeProduct('prod-tercio', 'Tercio', 'cat-beer', 'Tercio', '🍺'),
  makeProduct('prod-botellin', 'Botellín', 'cat-beer', 'Botellín', '🍺'),
  makeProduct('prod-vino', 'Vino', 'cat-wine', 'Vino', '🍷'),
  makeProduct('prod-copa-vino', 'Copa de vino', 'cat-wine', 'Copa', '🍷'),
  makeProduct('prod-refrescos', 'Refrescos', 'cat-soft', 'Refresco', '🥤'),
  makeProduct('prod-agua', 'Agua', 'cat-soft', 'Agua', '💧'),
  makeProduct('prod-cafe', 'Café', 'cat-coffee', 'Café', '☕'),
  makeProduct('prod-infusiones', 'Infusiones', 'cat-coffee', 'Infusión', '🍵'),
  makeProduct('prod-copas', 'Copas', 'cat-spirits', 'Copa', '🥃'),
  makeProduct('prod-cocteles', 'Cócteles', 'cat-spirits', 'Cóctel', '🍸'),
  makeProduct('prod-otras-bebidas', 'Otras bebidas', 'cat-other-drinks', 'Otro', '🧃'),
  // Comidas
  makeProduct('prod-tapas', 'Tapas', 'cat-tapas', 'Tapa', '🍢'),
  makeProduct('prod-raciones', 'Raciones', 'cat-portions', 'Ración', '🍽️'),
  makeProduct('prod-bocadillos', 'Bocadillos', 'cat-sandwiches', 'Bocadillo', '🥖'),
  makeProduct('prod-hamburguesas', 'Hamburguesas', 'cat-burgers', 'Hamburguesa', '🍔'),
  makeProduct('prod-sandwiches', 'Sándwiches', 'cat-sandwiches', 'Sándwich', '🥪'),
  makeProduct('prod-aperitivos', 'Aperitivos', 'cat-snacks', 'Aperitivo', '🥨'),
  makeProduct('prod-postres', 'Postres', 'cat-desserts', 'Postre', '🍰'),
  makeProduct('prod-otros-alimentos', 'Otros alimentos', 'cat-other-foods', 'Otro', '🍲'),
];

export function categoryKindLabel(kind: ProductKind): string {
  return kind === 'drink' ? 'Bebidas' : kind === 'food' ? 'Comidas' : 'Otros';
}
