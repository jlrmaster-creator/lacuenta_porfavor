import { FirebaseAuthRepository } from '@/data/firestore/authRepository';
import { FirebaseAccountsRepository } from '@/data/firestore/accountsRepository';
import { FirebaseActivityRepository } from '@/data/firestore/activityRepository';
import { FirebaseCatalogRepository } from '@/data/firestore/catalogRepository';
import { FirebaseGroupsRepository } from '@/data/firestore/groupsRepository';

/** Instancias únicas de la capa de datos (sin credenciales embebidas). */
export const authRepository = new FirebaseAuthRepository();
export const catalogRepository = new FirebaseCatalogRepository();
export const accountsRepository = new FirebaseAccountsRepository();
export const groupsRepository = new FirebaseGroupsRepository();
export const activityRepository = new FirebaseActivityRepository();
