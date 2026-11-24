# Arquitectura

## Decisión tecnológica

El enunciado pedía Flutter. El propietario del proyecto eligió expresamente una **PWA React + TypeScript + Vite** para poder ejecutarla y verificarla sin instalar Flutter. La app es mobile-first, se instala en Android/iOS desde el navegador y usa Firebase Web SDK. Si en el futuro se desea una app nativa en tiendas, la capa de dominio y los repositorios son reutilizables desde un proyecto Capacitor o React Native.

## Capas

| Capa | Responsabilidad | Ejemplos |
| --- | --- | --- |
| `domain/` | Entidades, contratos de repositorio y lógica pura de negocio. Sin Firebase. | `entities.ts`, `ports.ts`, `services/totals.ts`, `services/permissions.ts` |
| `data/firestore/` | Implementación de los puertos con Firebase Web SDK. Transacciones y mapeo Timestamp ↔ ISO. | `accountsRepository.ts`, `groupsRepository.ts` |
| `state/` | Gestión de estado (Zustand), hooks `onSnapshot` y ejecución de acciones con反馈. | `hooks.ts`, `stores.ts` |
| `presentation/` | Pantallas, componentes, layout y navegación. No contiene reglas de negocio. | `screens/`, `components/` |
| `config/` | Configuración de Firebase leída de `import.meta.env`. Sin valores embebidos. | `firebase.ts` |
| `core/` | Utilidades transversales: dinero (céntimos), fechas, errores, compartir. | `money.ts`, `errors.ts` |

## Gestión de estado

- **Zustand** para sesión (`useAuthStore`) y preferencias/toasts (`useUiStore`, persistido en localStorage).
- **Hooks de suscripción** (`useWatch`) con `onSnapshot` para datos en tiempo real de Firestore. Cada hook devuelve `{ value, error }` y cancela la suscripción al desmontar.
- Las escrituras usan `useAction`, que centraliza `pending`, mensajes de éxito y traducción de errores de Firebase.

## Flujo de datos

1. `useAuthBootstrap` escucha `onAuthStateChanged` y carga/crea el perfil en `users/{uid}`.
2. `useCatalog` inicializa el catálogo personal del usuario con una transacción y se suscribe a `categories` y `products` filtrados por `ownerId`.
3. Las pantallas se suscriben a cuentas/grupos/consumiciones. Cualquier cambio de otro miembro llega por `onSnapshot` sin recargar.
4. Las escrituras críticas (añadir/editar/borrar consumición, cerrar cuenta/grupo, unirse) usan `runTransaction` para actualizar la consumición y el total cacheado de forma atómica.

## Dinero

- Firestore guarda **céntimos como enteros** (`subtotalCents`, `unitPriceCents`, `totalCents`).
- `parseEuroToCents` convierte la entrada del usuario y `formatCents` muestra el importe con `Intl.NumberFormat('es-ES', { currency: 'EUR' })`.
- Las reglas de seguridad exigen `subtotalCents == quantity * unitPriceCents` y rangos válidos.

## Seguridad

- Reglas en `firestore.rules`: acceso por propietario o miembro, validación de importes/cantidades, consumiciones solo del autor, cierre solo del administrador, invitaciones válidas, logs inmutables y correcciones administrativas con `getAfter` sobre un `activityLog` creado en la misma transacción.
- `permissions.ts` replica las reglas en cliente para ocultar acciones no permitidas (pero la autoridad está en Firestore).

## Tiempo real y consistencia

- `onSnapshot` actualiza totales, listados, miembros y estado sin recarga manual.
- Los totales se almacenan cacheados en el documento padre y se actualizan con `increment()` dentro de transacciones para evitar pérdidas por escrituras concurrentes.
- El historial (`activityLogs`) es de solo lectura y escritura, nunca se modifica.

## Limitaciones conocidas

- Los tests de reglas de Firestore requieren el **Emulator Suite** y un projectId de prueba; no se han ejecutado aquí porque no hay proyecto Firebase configurado (ver `docs/firebase-setup.md`).
- La PWA precarga la interfaz; los datos de Firestore requieren conexión.
- `memberUids` es un array en el documento del grupo (consultas `array-contains`); pensado para grupos de tamaño razonable. Para grupos muy grandes se migraría a una colección `groupMembers` global con consultas por usuario.
