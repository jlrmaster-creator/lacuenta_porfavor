# Configuración de Firebase (la aporta el propietario)

**Este repositorio no contiene credenciales y no crea proyectos Firebase.** Sigue estos pasos con tu propio proyecto.

## 1. Crear/abrir el proyecto

1. En [Firebase Console](https://console.firebase.google.com/) usa tu proyecto o crea uno nuevo.
2. Añade una **app web** y copia el objeto `firebaseConfig` que muestra el asistente.
3. Habilita:
   - **Authentication → Sign-in Method → Correo electrónico/contraseña**.
   - **Cloud Firestore** (production mode; después despliega las reglas de este repo).
   - **Cloud Storage** (solo para la foto de perfil opcional).
4. En Authentication → Settings → Authorized domains añade tu dominio local (`localhost`) y el de producción.

## 2. Variables de entorno

```bash
copy .env.example .env.local
```

Rellena con los valores de tu `firebaseConfig`:

```
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=tu-proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu-proyecto
VITE_FIREBASE_STORAGE_BUCKET=tu-proyecto.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc...
```

Son valores públicos del SDK web (no secretos), pero **nunca** pongas aquí una clave privada de cuenta de servicio ni un token de administrador. `.env.local` está ignorado por Git.

Reinicia `npm run dev` después de crear el archivo. Si falta cualquier valor, la app muestra la pantalla "Configuración de Firebase pendiente".

## 3. Reglas e índices

Instala Firebase CLI si aún no la tienes (fuera de este repo) y, desde la raíz del proyecto:

```bash
firebase login
firebase use --add   # selecciona TU projectId
firebase deploy --only firestore
```

El repo ya incluye `firebase.json`, que apunta a `firestore.rules` y `firestore.indexes.json`. Tras corregir las reglas hay que volver a desplegarlas; el código de la app no cambia.

## 4. Storage

Ajusta las reglas de Storage en tu proyecto para permitir que cada usuario escriba solo en `profileImages/{su-uid}/…`:

```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /profileImages/{uid}/{file} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == uid
                   && request.resource.size < 5 * 1024 * 1024
                   && request.resource.contentType.matches('image/.*');
    }
  }
}
```

## 5. Verificación

1. Regístrate con email/contraseña en la app.
2. Comprueba en Firestore que se han creado `users/{uid}`, `categories` y `products` con `ownerId = tu uid`.
3. Crea una cuenta, añade una consumición y verifica que `totalCents` se actualiza.
4. Crea un grupo desde otro dispositivo/usuario con el código de invitación y comprueba que los totales se sincronizan en tiempo real.
5. Prueba que un miembro no puede editar la consumición de otro y que el administrador no puede cerrar el grupo si no es el creador.

## 6. Tests de reglas (recomendado)

`scripts/rules-smoke.mjs` comprueba contra el emulador las operaciones críticas: crear un grupo, crear una cuenta con consumición y unirse mediante código de invitación.

```bash
npx --yes -p firebase-tools@13.35.1 firebase emulators:exec --only firestore --project demo-lacuentaporfavor "node scripts/rules-smoke.mjs"
```

Se usa una versión fija de Firebase CLI compatible con JDK 17. Si tienes JDK 21 o superior, también sirve la CLI instalada en tu máquina. El emulador usa un `projectId` de prueba, sin credenciales reales.

Los tests unitarios validan además la lógica de permisos en TypeScript (`test/unit/permissions.test.ts`).
