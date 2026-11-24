import {
  addDoc,
  onSnapshot,
  query,
  runTransaction,
  serverTimestamp,
  doc,
  updateDoc,
  where,
  type Unsubscribe,
} from 'firebase/firestore';
import { requireFirestore } from '@/config/firebase';
import { DEFAULT_CATEGORIES, DEFAULT_PRODUCTS } from '@/domain/services/catalog';
import type { Category, Product } from '@/domain/entities';
import type { CatalogPort } from '@/domain/ports';
import { fromDoc, watchMapper } from './mapper';
import { paths } from './paths';

export class FirebaseCatalogRepository implements CatalogPort {
  watchCategories(uid: string, next: (items: Category[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(
      query(paths.categories(db), where('ownerId', '==', uid)),
      (snap) => watchMapper<Category>((items) => next(items.filter((c) => c.active)))(snap),
      error,
    );
  }

  watchProducts(uid: string, next: (items: Product[]) => void, error?: (e: unknown) => void): Unsubscribe {
    const db = requireFirestore();
    return onSnapshot(
      query(paths.products(db), where('ownerId', '==', uid)),
      (snap) => watchMapper<Product>((items) => next(items.filter((p) => p.active)))(snap),
      error,
    );
  }

  /** Copia el catálogo base al catálogo personal del usuario una sola vez (transacción atómica). */
  async initializeCatalog(uid: string): Promise<void> {
    const db = requireFirestore();
    await runTransaction(db, async (tx) => {
      const userRef = paths.users(db, uid);
      const userSnap = await tx.get(userRef);
      if (userSnap.data()?.catalogInitialized === true) return;

      const now = serverTimestamp();
      for (const category of DEFAULT_CATEGORIES) {
        tx.set(doc(paths.categories(db), `${uid}_${category.id}`), {
          ...category,
          id: `${uid}_${category.id}`,
          ownerId: uid,
          createdAt: now,
          updatedAt: now,
        });
      }
      for (const product of DEFAULT_PRODUCTS) {
        tx.set(doc(paths.products(db), `${uid}_${product.id}`), {
          ...product,
          id: `${uid}_${product.id}`,
          ownerId: uid,
          createdAt: now,
          updatedAt: now,
        });
      }
      if (userSnap.exists()) {
        tx.set(userRef, { catalogInitialized: true, updatedAt: now }, { merge: true });
      } else {
        // Usuarios que ya existían en Firebase Auth antes de usar la app.
        tx.set(userRef, {
          uid,
          displayName: '',
          email: '',
          photoURL: null,
          catalogInitialized: true,
          createdAt: now,
          updatedAt: now,
        });
      }
    });
  }

  async createCategory(
    uid: string,
    data: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
  ): Promise<string> {
    const db = requireFirestore();
    const ref = await addDoc(paths.categories(db), {
      ...data,
      ownerId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async createProduct(
    uid: string,
    data: Omit<Product, 'id' | 'createdAt' | 'updatedAt' | 'ownerId'>,
  ): Promise<string> {
    const db = requireFirestore();
    const ref = await addDoc(paths.products(db), {
      ...data,
      ownerId: uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return ref.id;
  }

  async updateProduct(uid: string, product: Product): Promise<void> {
    const db = requireFirestore();
    await updateDoc(doc(paths.products(db), product.id), {
      name: product.name,
      categoryId: product.categoryId,
      subcategory: product.subcategory,
      icon: product.icon,
      imageUrl: product.imageUrl,
      suggestedPriceCents: product.suggestedPriceCents,
      active: product.active,
      ownerId: uid,
      updatedAt: serverTimestamp(),
    });
  }

  async deleteProduct(_uid: string, productId: string): Promise<void> {
    const db = requireFirestore();
    await updateDoc(doc(paths.products(db), productId), {
      active: false,
      updatedAt: serverTimestamp(),
    });
  }
}

export function mapProduct(doc: Parameters<typeof fromDoc<Product>>[0]): Product {
  return fromDoc<Product>(doc);
}
