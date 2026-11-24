# Esquema de Cloud Firestore

Todos los importes son **enteros en céntimos**. Las fechas se guardan con `serverTimestamp()` (Timestamp de Firestore); el cliente las convierte a ISO para mostrarlas. Identificadores generados por Firestore salvo que se indique lo contrario.

## Colecciones

### `users/{uid}`
| Campo | Tipo | Notas |
| --- | --- | --- |
| `uid` | string | Igual que el ID del documento |
| `displayName` | string | Nombre visible |
| `email` | string | Email de Authentication |
| `photoURL` | string \| null | Foto opcional (Storage) |
| `catalogInitialized` | bool | Evita duplicar el catálogo base en cada acceso |
| `createdAt`, `updatedAt` | timestamp | |

### `categories/{categoryId}`
`name`, `kind` (`drink`/`food`/`other`), `icon`, `ownerId` (`uid`), `active`, `createdAt`, `updatedAt`.

### `products/{productId}`
`name`, `categoryId` (FK → categories), `subcategory`, `icon`, `imageUrl` (string|null), `suggestedPriceCents` (int|null), `active`, `ownerId` (uid), `createdAt`, `updatedAt`.

> El catálogo base (22 productos y 13 categorías) se copia una sola vez al catálogo personal del usuario con ID `${uid}_${idBase}`. El usuario puede modificar o desactivar **cualquier** producto de su catálogo.

### `individualAccounts/{accountId}`
`ownerId` (FK → users), `venueName`, `status` (`open`/`paid`/`cancelled`), `openedAt`, `closedAt` (timestamp|null), `reopenedAt` (timestamp|null), `totalCents` (int, cache), `createdAt`, `updatedAt`.

### `individualConsumptions/{consumptionId}`
`accountId` (FK), `groupId` = null, `userId` (FK), `productId`, `productName` (snapshot), `categoryId` (snapshot), `quantity` (1..99), `unitPriceCents`, `subtotalCents = quantity × unitPriceCents`, `note`, `createdAt`, `updatedAt`.

### `groups/{groupId}`
`name`, `createdBy` (FK → users), `status` (`active`/`closed`), `inviteCode` (8 chars), `memberUids` (array de uid, usado por `array-contains`), `openedAt`, `closedAt`, `totalCents` (cache), `createdAt`, `updatedAt`.

### `groups/{groupId}/members/{uid}`
`groupId`, `displayName` (snapshot), `photoURL`, `role` (`admin`/`member`), `invitedViaCode` (string|null, validado por reglas), `joinedAt`.

### `groupConsumptions/{consumptionId}`
Igual que `individualConsumptions`, pero `groupId` (FK) y `accountId` = null. `correctionLogId` (string) solo aparece cuando un administrador corrige una consumición ajena y apunta al `activityLogs/{id}` creado en la misma transacción.

### `invitations/{code}`
`code` (= ID), `groupId` (FK), `createdBy`, `createdAt`, `expiresAt` (timestamp|null), `uses` (int), `maxUses` (int|null).

### `activityLogs/{logId}`
`action` (ver `ActivityAction` en `src/domain/entities.ts`), `actorId` (FK), `groupId` (string|null), `accountId` (string|null), `targetId`, `details`, `createdAt`. **Inmutable**: prohibido update/delete.

## Relaciones

```
users 1──N individualAccounts 1──N individualConsumptions
users 1──N products / categories
users N──N groups  (a través de groups/{id}/members/{uid} y groups.memberUids)
groups 1──N groupConsumptions (autor = users)
groups 1──N invitations
groups/accounts 1──N activityLogs
```

## Índices

Definidos en `firestore.indexes.json`:

| Colección | Campos |
| --- | --- |
| `individualAccounts` | `ownerId ASC`, `status ASC`, `openedAt DESC` |
| `individualConsumptions` | `accountId ASC`, `createdAt ASC` · `userId ASC`, `createdAt DESC` |
| `groups` | `memberUids ARRAY_CONTAINS`, `createdAt DESC` |
| `groupConsumptions` | `groupId ASC`, `createdAt ASC` · `userId ASC`, `createdAt DESC` |
| `activityLogs` | `groupId ASC`, `createdAt DESC` · `accountId ASC`, `createdAt DESC` |
| `products` / `categories` | `ownerId ASC`, `active ASC` |

## Reglas de seguridad

En `firestore.rules`. Puntos clave:

- Solo usuarios autenticados; un usuario solo lee/escribe sus propios documentos de usuario, cuentas y consumiciones.
- Catálogo: lectura y escritura solo del `ownerId` (o catálogo `system` de solo lectura).
- Cuenta individual: cerrar permitido; reabrir exige `reopenedAt == request.time` (acción explícita).
- Grupo: lectura solo si el uid está en `memberUids`; cierre solo si `createdBy == uid` y `role == admin`.
- Unirse: existe invitación válida, no caducada ni agotada, y se escribe `invitedViaCode` en el documento de miembro.
- Consumiciones: `subtotal` validado en servidor; el autor edita las suyas; el administrador solo puede corregir ajenas si escribe un log de corrección en la misma transacción (`getAfter`).
- `activityLogs`: `createdAt == request.time`, `actorId == uid`, sin actualizaciones ni borrados.
