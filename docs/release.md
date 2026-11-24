# Versiones de producción

## 1. Comprobaciones previas

```bash
npm run typecheck
npm test
npm run build
```

No despliegues si hay errores de TypeScript o tests fallidos. Revisa que `.env.local` contiene la configuración del proyecto de producción y que está excluido de Git.

## 2. Despliegue de Firebase

```bash
firebase deploy --only firestore:rules,firestore:indexes,storage
```

## 3. Despliegue de la PWA

El resultado está en `dist/`. El service worker se genera automáticamente (`sw.js`) y usa `registerType: 'autoUpdate'`.

Opciones habituales:

- **Firebase Hosting**: `firebase deploy --only hosting` (crea `firebase.json` con `"hosting": { "public": "dist", "rewrites": [{ "source": "**", "destination": "/index.html" }] }`).
- **Vercel / Netlify**: conectar el repo, build `npm run build`, directorio `dist`.
- **Servidor propio**: servir `dist/` con HTTPS y rewrite de todas las rutas a `index.html` (necesario porque la app usa React Router).

## 4. Variables de entorno en producción

Las mismas seis variables `VITE_FIREBASE_*` del entorno de build. En Firebase Hosting con GitHub Actions, configúralas como secrets del repositorio; **nunca** las commits.

## 5. Versionado

- `package.json` usa semver; etiqueta cada release con `git tag vX.Y.Z`.
- `npm version patch|minor|major` actualiza la versión y crea el tag.
- La caché del service worker se invalida en cada build; los usuarios reciben la nueva versión en la siguiente visita.

## 6. Monitorización

Activa en tu proyecto Firebase: Authentication → cuotas, Firestore → reglas (revisa los rechazos `permission-denied`) y Crashlytics solo si decides añadirlo (no está incluido para mantener el proyecto libre de dependencias de pago).
