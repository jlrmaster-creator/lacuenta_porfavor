# Uso en Android e iOS (PWA)

La app es una PWA: se abre en el navegador móvil y puede instalarse en la pantalla de inicio con aspecto de aplicación (sin barra del navegador, a pantalla completa).

## Android (Chrome)

1. Publica el build en HTTPS (obligatorio para service workers; `localhost` también funciona en desarrollo).
2. Abre la URL en Chrome.
3. Menú ⋮ → **Instalar aplicación** o **Añadir a pantalla de inicio**.
4. Se crea un icono con el nombre "La Cuenta Por Favor" y `display: standalone`.

## iOS (Safari)

1. Abre la URL en Safari (iOS no permite instalar PWA desde otros navegadores).
2. Botón Compartir → **Añadir a pantalla de inicio**.
3. Se añade el icono `apple-touch-icon` definido en el manifiesto.

## Pruebas locales desde el móvil

```bash
npm run dev -- --host
```

El servidor muestra una IP de la red (por ejemplo `http://192.168.1.20:5173`). El móvil debe estar en la misma Wi-Fi. Ten en cuenta que Firebase Auth requiere que esa IP/dominio esté en *Authorized domains* (o usa HTTPS/túnel para pruebas).

## Limitaciones frente a una app nativa

- No hay publicación en Google Play / App Store. Si se necesita, se puede envolver la PWA con Capacitor conservando todo el código de `src/`.
- Notificaciones push y biometricidad no están implementadas (no eran requisitos).
- El service worker precarga la interfaz; los datos siguen siendo en tiempo real y requieren conexión.
