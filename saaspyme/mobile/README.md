# GestorPyme Mobile

Cliente Android en Flutter para [GestorPyme](https://gestorpyme-ir60.onrender.com/).

## Requisitos

- Flutter 3.44+
- Android SDK
- Llave pública de Clerk (`PUBLIC_CLERK_PUBLISHABLE_KEY` del backend)

## Configuración

1. Copia el archivo de variables:

```bash
cp dart_defines.example.json dart_defines.json
```

2. Edita `dart_defines.json` con tu `CLERK_PUBLISHABLE_KEY` de Clerk.

3. La URL del backend por defecto es `https://gestorpyme-ir60.onrender.com`.

## Ejecutar en Android

```bash
cd mobile
flutter pub get
flutter run --dart-define-from-file=dart_defines.json
```

## Build APK

```bash
flutter build apk --dart-define-from-file=dart_defines.json
```

El APK quedará en `build/app/outputs/flutter-apk/app-release.apk`.

## Funcionalidades

- Login con Google vía Clerk
- Dashboard con KPIs financieros
- Listado y detalle de clientes
- Listado y detalle de cotizaciones
- Cobranza con registro de pagos

## API consumida

La app consume los endpoints REST del backend:

| Endpoint | Descripción |
|----------|-------------|
| `POST /api/auth/session` | Sincronizar sesión Clerk |
| `GET /api/v1/me` | Usuario autenticado |
| `GET /api/v1/dashboard` | KPIs y resumen |
| `GET /api/v1/clientes` | Lista de clientes |
| `GET /api/v1/clientes/:id` | Detalle de cliente |
| `GET /api/v1/cotizaciones` | Lista de cotizaciones |
| `GET /api/v1/cotizaciones/:id` | Detalle de cotización |
| `GET /api/v1/cobranza` | Cartera pendiente |
| `POST /api/v1/cobranza` | Registrar pagos |

> **Nota:** Los endpoints `/api/v1/*` deben estar desplegados en Render. Si aún no los tienes en producción, haz deploy del backend actualizado antes de probar la app móvil.

## Autenticación

1. El usuario inicia sesión con Clerk (Google OAuth).
2. La app obtiene el JWT de sesión de Clerk.
3. Se envía a `POST /api/auth/session` para validar y enlazar con el usuario local.
4. Las peticiones siguientes usan `Authorization: Bearer <token>`.
