# Deploy en Render

El proyecto ya incluye `render.yaml` para crear un Web Service en Render.

## 1. Antes de conectar Render

Sube el proyecto a GitHub.

Verifica que estos archivos esten incluidos:

- `package.json`
- `package-lock.json`
- `render.yaml`
- `prisma/schema.prisma`
- `prisma/migrations/20260708201000_init/migration.sql`
- `src/`
- `docs/`

No subas `.env`.

## 2. Crear Web Service

En Render:

1. Crear **New +**.
2. Elegir **Blueprint** si quieres usar `render.yaml`, o **Web Service** si lo haras manual.
3. Conectar el repositorio de GitHub.
4. Branch: `main`.

## 3. Configuracion si lo haces manual

Build Command:

```sh
npm install && npx prisma generate && npm run build
```

Start Command:

```sh
node build/index.js
```

Environment:

```text
Node
```

## 4. Variables de entorno en Render

Agrega estas variables:

```env
DATABASE_URL="postgresql://postgres.mzvqmadoykukgqjdhavc:TU_PASSWORD@aws-1-us-west-2.pooler.supabase.com:6543/postgres?sslmode=require"
PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."
RESEND_API_KEY="re_..."
FROM_EMAIL="onboarding@resend.dev"
PUBLIC_ORIGIN="https://TU-SERVICIO.onrender.com"
```

Importante:

- En Render, `PUBLIC_ORIGIN` debe ser la URL real de Render.
- Despues del primer deploy, copia la URL publica de Render y actualiza `PUBLIC_ORIGIN`.
- Agrega esa URL en Clerk como origen/redirect permitido.

## 5. Migraciones

Las migraciones no se ejecutan dentro del build de Render. Esto evita que el deploy quede bloqueado si Supabase o el pooler tardan en responder.

Ejecutalas aparte con:

```sh
npx prisma migrate deploy
```

Eso aplicara la migracion local:

```text
prisma/migrations/20260708201000_init/migration.sql
```

No uses `prisma migrate dev` en Render.

## 6. Si falla el deploy

Revisa primero:

1. Que `DATABASE_URL` tenga `?sslmode=require`.
2. Que la contraseña no tenga corchetes.
3. Que el host sea el pooler correcto.
4. Que `PUBLIC_ORIGIN` no tenga slash final.
5. Que Clerk tenga permitida la URL de Render.
