# Dependencias y licencias

Todas las dependencias directas usan licencias permisivas compatibles con uso comercial. Versiones instaladas (se actualizan con `npm install`).

## Producción

| Paquete | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| `react` | 19.3.1 | MIT | UI |
| `react-dom` | 19.3.1 | MIT | Renderizado |
| `react-router-dom` | 7.18.7 | MIT | Navegación y rutas protegidas |
| `zustand` | 5.1.0 | MIT | Estado global |
| `firebase` | 12.19.0 | Apache-2.0 | Auth, Firestore y Storage |
| `zod` | 4.6.7 | MIT | Validación de formularios |
| `react-hook-form` | 7.92.0 | MIT | Formularios |
| `@hookform/resolvers` | 5.9.2 | MIT | Puente zod ↔ react-hook-form |
| `date-fns` | 4.4.0 | MIT | Fechas y locale español |
| `lucide-react` | 0.544.0 | ISC | Iconos |

## Desarrollo / tests

| Paquete | Versión | Licencia | Uso |
| --- | --- | --- | --- |
| `typescript` | 5.9.3 | Apache-2.0 | Tipado estricto |
| `vite` | 7.3.8 | MIT | Bundler y servidor |
| `@vitejs/plugin-react` | 5.2.0 | MIT | Plugin React |
| `vite-plugin-pwa` | 2.0.0 | MIT | Service worker y manifiesto |
| `vitest` | 5.1.1 | MIT | Tests |
| `@firebase/rules-unit-testing` | 5.0.2 | Apache-2.0 | Tests de reglas con emulador |
| `jsdom` | 26.1.0 | MIT | DOM de prueba |
| `@testing-library/react` | 16.3.3 | MIT | Tests de componentes |
| `@testing-library/jest-dom` | 6.9.1 | MIT | Matchers de DOM |
| `@testing-library/user-event` | 14.6.13 | MIT | Simulación de interacción |
| `@types/*` | — | MIT | Tipos de Node/React |

No se usan SDK, servicios ni librerías de pago obligatorios. Firebase puede usarse en su plan gratuito (Spark) para desarrollo; el coste de producción depende del proyecto del propietario.

## Notas de seguridad

- `npm audit --omit=dev` no reporta vulnerabilidades de producción. Se añadió un `override` para `@grpc/grpc-js@^1.14.7` (dependencia transitiva de Firebase en Node, no incluida en el bundle del navegador).
- Quedan 4 avisos **moderados** en dependencias de desarrollo (`glob`/`minimatch` vía `workbox-build`, usado solo al generar el service worker). No afectan a la app en producción. Se resolverán al actualizar `vite-plugin-pwa`/`workbox-build` cuando haya una versión compatible.
