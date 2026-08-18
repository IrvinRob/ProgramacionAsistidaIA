# Setup de Servicios Externos

Este archivo indica que valores debes conseguir y pegar en `.env`. No compartas llaves secretas en chat si no es necesario.

## 1. Supabase

Necesito que crees o abras tu proyecto en Supabase y obtengas la cadena de conexion PostgreSQL.

Valor a pegar:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/postgres?sslmode=require"
```

Intervencion tuya:

1. Entrar a Supabase.
2. Crear proyecto o abrir uno existente.
3. Ir a la seccion de conexion de base de datos.
4. Copiar la connection string de PostgreSQL.
5. Reemplazar usuario, password, host y base en `DATABASE_URL`.

Despues de pegarlo, yo puedo ejecutar:

```sh
npm run db:migrate -- --name init
```

## 2. Clerk

Necesito dos llaves de Clerk:

```env
PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
```

Intervencion tuya:

1. Crear una aplicacion en Clerk.
2. Activar Google como proveedor de login.
3. Copiar la Publishable Key y pegarla en `PUBLIC_CLERK_PUBLISHABLE_KEY`.
4. Copiar la Secret Key y pegarla en `CLERK_SECRET_KEY`.
5. Configurar las URLs de desarrollo:
   - App local: `http://localhost:5173`
   - Login: `http://localhost:5173/login`
   - Redirect despues de login: `http://localhost:5173/dashboard`

## 3. Resend

Necesito una API key y un remitente.

```env
RESEND_API_KEY="re_..."
FROM_EMAIL="onboarding@resend.dev"
```

Intervencion tuya:

1. Crear cuenta en Resend.
2. Crear una API key.
3. Pegarla en `RESEND_API_KEY`.
4. Para pruebas, puedes dejar `FROM_EMAIL="onboarding@resend.dev"`.
5. Para produccion, agrega y verifica tu dominio.
6. Cuando el dominio este verificado, cambia `FROM_EMAIL` a algo como `noreply@tudominio.com`.

## 4. Anthropic (asistente por texto)

```env
ANTHROPIC_API_KEY="sk-ant-..."
```

Intervencion tuya:

1. Crear o abrir tu cuenta en Anthropic.
2. Copiar la API key.
3. Pegarla en `ANTHROPIC_API_KEY`.

## 5. MorphCast (emociones en el navegador)

La license key se usa en el frontend porque el SDK corre en el browser.

```env
PUBLIC_MORPHCAST_LICENSE_KEY="..."
```

Intervencion tuya:

1. Registrarte en https://www.morphcast.com y obtener una license key (trial 60 dias o licencia academica).
2. Pegarla en `PUBLIC_MORPHCAST_LICENSE_KEY`.
3. En produccion (Render) agregar la misma variable. MorphCast requiere HTTPS.

Despues de pegar las keys, ejecuta la migracion de engagement:

```sh
npm run db:deploy
```

## 6. Cuando Termines

Avísame cuando hayas pegado los valores reales en `.env`.

Yo continuare con:

1. Validar conexion a Supabase.
2. Ejecutar migracion inicial.
3. Probar login con Clerk.
4. Probar envio basico con Resend.
5. Empezar el modulo de Clientes.
