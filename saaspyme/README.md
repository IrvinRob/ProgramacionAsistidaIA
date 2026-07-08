# GestorPyme

Aplicacion web privada para gestion de clientes, cotizaciones, pagos, cobranza y dashboard financiero de un despacho contable o consultoria pequena en Mexico.

## Stack confirmado

- SvelteKit con JavaScript.
- Tailwind CSS.
- Prisma ORM.
- Supabase PostgreSQL.
- Clerk con Google OAuth.
- Resend para correos transaccionales.
- Chart.js con `svelte-chartjs`.
- Render.com con adapter Node para despliegue.

## Documentacion del proyecto

- Requerimientos alineados al Excel: `docs/PROJECT_INSTRUCTIONS.md`
- Inconsistencias detectadas: `docs/inconsistencias.md`

## Variables de entorno

Copia `.env.example` a `.env` y llena los valores reales:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/DATABASE?sslmode=require"
PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_xxxxxxxxxxxxxxxxxxxxx"
CLERK_SECRET_KEY="sk_test_xxxxxxxxxxxxxxxxxxxxx"
RESEND_API_KEY="re_xxxxxxxxxxxxxxxxxxxxx"
FROM_EMAIL="onboarding@resend.dev"
PUBLIC_ORIGIN="http://localhost:5173"
```

## Desarrollo local

```sh
npm install
npm run db:generate
npm run dev
```

URL local:

```text
http://127.0.0.1:5173/
```

## Base de datos

El schema Prisma inicial esta en `prisma/schema.prisma`.

Cuando `DATABASE_URL` apunte a Supabase:

```sh
npm run db:migrate -- --name init
```

Para produccion:

```sh
npm run db:deploy
```

## Verificacion

Comandos usados para validar el setup:

```sh
npm run db:generate
npm run lint
npm run build
```

El servidor local tambien fue verificado por HTTP:

- `/` redirige a `/login`.
- `/dashboard` redirige a `/login` sin sesion.
- `/login` responde correctamente.

## Seguridad inicial

- Rutas privadas protegidas desde `src/hooks.server.js`.
- Sesion Clerk verificada en servidor con `@clerk/backend`.
- Sin tabla `User` propia; Clerk es fuente de identidad.
- `clerkUserId` disponible para auditoria/historial donde aplique.
- Validaciones base con Zod en `src/lib/server/validation.js`.
- Totales de cotizacion y saldos tienen helpers de servidor.
- Correos HTML escapan datos interpolados.
- Secretos se leen desde `$env/static/private`.

## Nota de audit

`npm audit` reporta vulnerabilidades moderadas transitivas en dependencias de Prisma, SvelteKit y Clerk. `npm audit fix` no las corrige sin cambios rompientes; no se aplico `--force` para evitar downgrades o cambios mayores que rompan el proyecto.
