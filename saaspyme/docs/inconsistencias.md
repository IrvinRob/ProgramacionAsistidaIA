# Inconsistencias Detectadas en GestorPyme_Requerimientos.xlsx

Fuente revisada: `GestorPyme_Requerimientos.xlsx`, todas sus hojas.

Este archivo registra contradicciones, ambiguedades y puntos que podrian causar decisiones incorrectas durante la construccion. Las decisiones finales confirmadas por el usuario ya estan reflejadas en `docs/PROJECT_INSTRUCTIONS.md`.

## 1. Stack: SvelteKit vs Next.js

Inconsistencia:

- La portada, restricciones y prompt maestro indican SvelteKit con JavaScript.
- La historia `US-001` dice "Next.js 14 con TypeScript, Prisma, shadcn/ui y Clerk".
- La misma `US-001` tambien incluye criterio de aceptacion de Svelte: `npm create svelte@latest` y `+page.svelte`.
- `US-001` menciona ruta `/api/auth/[...nextauth]`, propia de Auth.js/NextAuth, no de Clerk con SvelteKit.

Decision confirmada:

- Usar SvelteKit + JavaScript.
- No usar Next.js.
- No usar TypeScript.
- No usar Auth.js/NextAuth.

## 2. UI: shadcn/ui vs componentes propios

Inconsistencia:

- `US-001` y alcance mencionan shadcn/ui.
- Las restricciones dicen Tailwind CSS, componentes propios y daisyUI opcional.
- shadcn/ui es principalmente para React; en SvelteKit existe la alternativa shadcn-svelte, pero agrega complejidad.

Decision confirmada:

- No usar shadcn salvo que sea conveniente y no complique el proyecto.
- Priorizar Tailwind CSS y componentes propios.

## 3. Base de datos: Supabase vs Neon

Inconsistencia:

- Portada, restricciones y alcance indican PostgreSQL en Supabase.
- La descripcion de `DATABASE_URL` dice "Cadena de conexion PostgreSQL de Neon".

Decision confirmada:

- Usar Supabase PostgreSQL.

## 4. Ruta de login: `/sign-in` vs `/login`

Inconsistencia:

- El prompt maestro pide crear `/src/routes/sign-in/+page.svelte`.
- La historia `US-003` habla de redirigir a `/login`.

Decision confirmada:

- Usar `/login`.

## 5. Graficas: Chart.js vs Recharts

Inconsistencia:

- Restricciones tecnicas indican Chart.js con `svelte-chartjs`.
- `US-020` menciona Recharts.
- Recharts esta orientado a React, no SvelteKit.

Decision confirmada:

- Usar Chart.js con `svelte-chartjs`.
- No usar Recharts.

## 6. PDF: fuera de MVP vs historia de usuario

Inconsistencia:

- La hoja de alcance marca "Generacion de PDF de cotizaciones" como fuera del MVP.
- La historia `US-013` define PDF como prioridad media.
- El correo de cotizacion enviada menciona boton "Ver cotizacion" con link al PDF o vista web.

Decision confirmada:

- Agregar PDF si no retrasa ni modifica de forma relevante el proyecto.
- Si PDF empieza a afectar el avance del MVP, preguntar antes de seguir.

## 7. Recordatorios de pago: v1.1 vs MVP

Inconsistencia:

- `US-019` aparece como prioridad media.
- La vista de cobranza del prompt incluye boton "Enviar recordatorio".
- El usuario pidio incluirlo en MVP.

Decision confirmada:

- Recordatorios de pago entran en MVP usando Resend.

## 8. Fecha de entrega: 2025 vs 2026

Inconsistencia:

- La portada dice fecha de entrega: 9 de julio de 2025.
- El contexto actual del proyecto es 2026.

Decision confirmada:

- La fecha 2025 fue error de captura.
- Fecha limite correcta: 9 de julio de 2026.

## 9. Clerk y modelo `User`

Inconsistencia:

- El proyecto pide Clerk con Google OAuth.
- El schema del Excel incluye modelo `User` y comentario de tablas `Account`, `Session`, `VerificationToken`, que son mas propios de Auth.js/NextAuth.

Decision confirmada:

- No crear tabla `User` propia al inicio.
- Clerk sera la fuente de usuario.
- Guardar `clerkUserId` o metadata donde haga falta para auditoria e historial.

## 10. Variable de origen: `ORIGIN` vs `PUBLIC_ORIGIN`

Inconsistencia:

- Algunas instrucciones mencionan `ORIGIN`.
- Otras mencionan `PUBLIC_ORIGIN`.

Decision confirmada:

- Usar `PUBLIC_ORIGIN` como variable estandar para la URL publica.

## 11. Supabase escrito con errores

Inconsistencia menor:

- En algunas celdas aparece "Suupabase" o variaciones de escritura.

Decision confirmada:

- Interpretar todas esas referencias como Supabase.

## 12. Dashboard: Server Component

Inconsistencia:

- `US-020` dice "Server Component", termino propio de React/Next.js.
- En SvelteKit la logica equivalente debe ir en `+page.server.js`.

Decision confirmada:

- Calcular datos del dashboard en `+page.server.js`.
- No usar fetch manual desde cliente para los datos principales.

## 13. Paquete Clerk para SvelteKit

Inconsistencia / hallazgo tecnico:

- El Excel indica instalar `@clerk/sveltekit`.
- Ese paquete no existe en npm al momento del setup.
- Existe `svelte-clerk`, pero es comunitario, no el SDK oficial de Clerk.

Decision aplicada:

- Usar paquetes oficiales de Clerk disponibles en npm:
  - `@clerk/backend` para verificacion en servidor.
  - `@clerk/clerk-js` para montar el login en cliente.
- No instalar `svelte-clerk` sin autorizacion explicita, para evitar depender de una capa comunitaria de autenticacion.
