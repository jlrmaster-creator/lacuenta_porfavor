# La Cuenta Por Favor

PWA (React + TypeScript + Vite) para registrar consumiciones en bares y restaurantes, tanto individuales como en grupos compartidos, con Firebase (Authentication + Cloud Firestore + Storage opcional) y actualización en tiempo real.

> **Nota sobre la tecnología:** el enunciado original proponía Flutter. Por decisión explícita del propietario del proyecto se ha implementado una **PWA en React + TypeScript**, que funciona en Android e iOS mediante "Añadir a pantalla de inicio" y es desplegable como sitio web. No se ha creado ningún proyecto Firebase ni se han inventado credenciales.

## Funcionalidades implementadas

- Registro / login / recuperación de contraseña / logout con Firebase Authentication.
- Perfil con nombre visible y fotografía opcional (Firebase Storage).
- Catálogo base de 22 productos (bebidas y comidas) + categorías, copiado al catálogo personal del usuario en su primer acceso mediante transacción. Búsqueda, filtros, alta/modificación/borrado lógico y precios orientativos opcionales.
- Cuentas individuales: apertura, consumiciones con cantidad/precio unitario/nota, botones de añadido rápido, edición/borrado, total en céntimos, resumen, pago, cancelación y reapertura explícita registrada.
- Grupos: creación (el creador es administrador), código de invitación de 8 caracteres, unión por código, miembros, consumiciones propias en tiempo real, total individual y total del grupo.
- Panel del administrador: totales por participante, número de consumiciones, historial de movimientos y cierre de cuenta. Las correcciones de consumiciones ajenas se escriben en la misma transacción que un `activityLog` inmutable.
- Historial y estadísticas: gasto semanal/mensual, media por salida, gasto por categoría y productos más consumidos.
- Tema claro/oscuro, interfaz en español, formato de precios es-ES, navegación inferior de 5 apartados y feedback visual (toasts).
- Service worker (PWA) para uso offline de la interfaz.

## Puesta en marcha

```bash
npm install
cp .env.example .env.local   # en Windows: copy .env.example .env.local
# rellena .env.local con la configuración web de TU proyecto Firebase
npm run dev
```

La aplicación muestra una pantalla de configuración mientras `.env.local` no esté completo. **No hay credenciales en el repositorio.**

## Configuración de Firebase

Ver [`docs/firebase-setup.md`](docs/firebase-setup.md). Resumen:

1. Crea tú el proyecto Firebase y habilita Email/Password, Firestore y Storage.
2. Copia los 6 valores de *Configuración de la app web* en `.env.local`.
3. Despliega reglas e índices:
   ```bash
   firebase deploy --only firestore:rules,firestore:indexes
   ```
4. Configura el dominio como autorizado en Authentication.

## Calidad

```bash
npm run typecheck   # TypeScript estricto
npm test            # 20 tests (cálculos, validaciones, permisos y UI)
npm run build       # bundle de producción + service worker
```

## Estructura

```
src/
  app/                 router y rutas protegidas
  config/              lectura de configuración Firebase (solo entorno)
  core/                dinero, fechas, errores, compartir
  domain/              entidades, puertos, servicios (totales, permisos, validadores, catálogo)
  data/firestore/      repositorios Firestore y mapeo de documentos
  state/               stores Zustand, hooks en tiempo real, instancias de repositorios
  presentation/        layouts, componentes y pantallas
  styles/              tema claro/oscuro
test/                  tests unitarios y de componente
docs/                  arquitectura, esquema, dependencias, despliegue
firestore.rules        reglas de seguridad
firestore.indexes.json índices compuestos
public/                iconos PWA
```

## Documentación

- [Arquitectura](docs/architecture.md)
- [Esquema de Firestore e índices](docs/firestore-schema.md)
- [Dependencias y licencias](docs/dependencies-licenses.md)
- [Configuración de Firebase](docs/firebase-setup.md)
- [Instalación en Android e iOS (PWA)](docs/mobile-install.md)
- [Versiones de producción](docs/release.md)

## Licencia

MIT. Dependencias con licencias MIT, Apache-2.0 e ISC (compatibles con uso comercial); detalle en `docs/dependencies-licenses.md`.
