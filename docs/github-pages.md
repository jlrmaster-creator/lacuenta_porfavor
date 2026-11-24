# Despliegue en GitHub Pages

La app está preparada para publicarse en:

```text
https://jlrmaster-creator.github.io/lacuenta_porfavor/
```

## 1. Repositorio

1. Entra en **Settings → Pages → Build and deployment**.
2. En **Source**, selecciona **GitHub Actions**.
3. El workflow [`deploy-pages.yml`](../.github/workflows/deploy-pages.yml) se ejecuta en cada push a `master` y también manualmente desde **Actions → Deploy to GitHub Pages → Run workflow**.

No hace falta cambiar el branch ni usar `gh-pages`.

## 2. Configuración Firebase en GitHub Actions

La configuración web de Firebase se inyecta en el build mediante `import.meta.env`. Como `.env.local` no se sube al repo, hay que crear estos **Repository secrets** en **Settings → Secrets and variables → Actions → New repository secret**:

| Secret | Valor |
| --- | --- |
| `VITE_FIREBASE_API_KEY` | `apiKey` de *Configuración de la app web* |
| `VITE_FIREBASE_AUTH_DOMAIN` | `authDomain` |
| `VITE_FIREBASE_PROJECT_ID` | `projectId` |
| `VITE_FIREBASE_STORAGE_BUCKET` | `storageBucket` |
| `VITE_FIREBASE_MESSAGING_SENDER_ID` | `messagingSenderId` |
| `VITE_FIREBASE_APP_ID` | `appId` |

Son los mismos seis valores que tienes en `.env.local`. Aunque son datos públicos de la app web, se guardan como secretos para no dejarlos en el historial del repo.

Después de crear o cambiar un secret, vuelve a ejecutar el workflow: el valor queda compilado en los ficheros de `dist`.

## 3. Dominio autorizado en Firebase

En Firebase Console → **Authentication → Settings → Authorized domains**, añade:

```text
jlrmaster-creator.github.io
```

Mantén también `localhost` para desarrollo local. Si más adelante usas un dominio propio, añádelo aquí también.

## 4. Detalles de la configuración del build

- `vite.config.ts` usa `PAGES_BASE=/lacuenta_porfavor/` en el workflow, de modo que los assets y el service worker apuntan a la subcarpeta del sitio.
- El router usa `HashRouter`, por lo que las rutas son estables en Pages: por ejemplo `/#/grupos`, `/#/catalogo`. No se necesita un `404.html` especial.
- El manifest PWA usa `start_url: './'` y `scope: './'`; el service worker tiene como fallback `/lacuenta_porfavor/index.html`.
- Se publica un `.nojekyll` para que GitHub no procese los archivos con Jekyll.

## 5. Verificación

Tras el despliegue:

1. Abre `https://jlrmaster-creator.github.io/lacuenta_porfavor/`.
2. Comprueba que aparece la pantalla de inicio de sesión (no la pantalla «Firebase no configurado»).
3. Inicia sesión con un usuario de tu proyecto Firebase.
4. Revisa en DevTools → Console que no haya `auth/unauthorized-domain` ni `permission-denied`.
5. Comprueba que «Añadir a pantalla de inicio» instala la PWA desde esa URL.
