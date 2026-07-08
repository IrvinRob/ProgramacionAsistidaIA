# GestorPyme - Instrucciones del Proyecto

Fuente: `GestorPyme_Requerimientos.xlsx` revisado en todas sus hojas:

- `Portada`
- `Vision y Problema`
- `Personas`
- `Restricciones`
- `Historias de Usuario`
- `Alcance y DB Schema`
- `Prompt Maestro`

Este documento es la referencia de trabajo para construir GestorPyme. Si alguna instruccion del Excel entra en conflicto con otra, se debe preguntar antes de implementar.

## 1. Producto

GestorPyme es una aplicacion web privada para despachos contables y consultoras pequenas en Mexico. El flujo principal es:

1. Gestionar clientes.
2. Crear cotizaciones profesionales.
3. Dar seguimiento al estado de cada cotizacion.
4. Registrar pagos parciales o totales.
5. Ver cobranza pendiente y KPIs financieros.
6. Enviar notificaciones transaccionales por correo.

El sistema esta pensado para un despacho pequeno de 1 a 10 colaboradores. La version MVP es monousuario por despacho: un despliegue equivale a un despacho.

## 2. Problema a Resolver

Los despachos pequenos gestionan clientes, cotizaciones y cobros con WhatsApp, Excel, Word y correo informal. Esto causa:

- Falta de visibilidad de cobranza pendiente.
- Cotizaciones olvidadas o sin seguimiento.
- Historial incompleto por cliente.
- Perdida de ingresos por facturas o pagos no registrados.
- Trabajo manual repetido entre WhatsApp, Excel, Word y correo.

## 3. Propuesta de Valor

GestorPyme debe ser mas simple que un CRM generico y adaptado al flujo real de servicios profesionales en Mexico:

`cotizacion -> aprobacion -> entrega del servicio -> factura -> pago`

No debe incluir funciones innecesarias del MVP. Debe privilegiar captura rapida, claridad financiera, seguridad desde el inicio y despliegue simple.

## 4. Metricas de Exito del MVP

- Registrar un cliente completo en menos de 90 segundos.
- Crear, enviar por correo y marcar como aprobada una cotizacion en menos de 3 minutos.
- Dashboard con total facturado, cobrado y pendiente del mes actual sin calculos manuales.
- Correo automatico cuando la cotizacion cambia de estado, especialmente `Enviada`.
- Carga inicial de cualquier pantalla menor a 2 segundos en conexion 4G.

## 5. Usuarios

### Carlos Mendoza - Socio Director

- Revisa el dashboard cada manana.
- Registra cobros 2 a 3 veces por semana.
- Quiere ver dinero pendiente, clientes activos e ingreso mensual sin abrir varios archivos.
- Nivel tecnico basico-intermedio.
- Usa laptop Windows e iPhone.
- No tolera interfaces complejas.

### Daniela Rios - Asistente Administrativa

- Usuario principal del sistema.
- Usa el sistema 4 a 6 horas diarias.
- Captura clientes, genera cotizaciones y da seguimiento a pagos.
- Necesita generar y enviar cotizaciones rapido.
- Nivel tecnico intermedio.
- Usa laptop Windows.

### Roberto Alvarado - Cliente Externo

- No tiene login.
- Recibe correos automaticos con cotizaciones y estados.
- Lee principalmente desde smartphone Android.
- Necesita correos claros, profesionales y moviles.

## 6. Stack y Restricciones Tecnicas

Stack confirmado por el usuario:

- Framework: SvelteKit.
- Lenguaje: JavaScript puro, sin TypeScript.
- Rutas: filesystem routing en `src/routes`.
- Vistas: `+page.svelte`.
- Logica servidor: `+page.server.js`.
- API/backend: endpoints y form actions de SvelteKit, sin backend separado.
- Base de datos: PostgreSQL en Supabase.
- ORM: Prisma Client.
- Autenticacion: Clerk con Google OAuth.
- Correos: Resend API.
- Estilos: Tailwind CSS.
- Graficas: Chart.js con `svelte-chartjs`.
- Estado cliente: Svelte stores ligeros.
- Deploy: Render.com Web Service conectado a GitHub.
- CI/CD: push a `main` despliega automaticamente.
- Moneda y fechas: `es-MX`, MXN.

Restricciones importantes:

- No usar SQL crudo si Prisma puede cubrir el caso.
- No usar usuario/contrasena ni magic links.
- Google OAuth es el unico proveedor.
- No crear app movil nativa en el MVP.
- No implementar multi-tenant en el MVP.
- No implementar facturacion CFDI/SAT en el MVP.
- No implementar portal de cliente con login en el MVP.

## 7. Variables de Entorno

Requeridas para local y Render:

```env
DATABASE_URL=""
PUBLIC_CLERK_PUBLISHABLE_KEY=""
CLERK_SECRET_KEY=""
RESEND_API_KEY=""
FROM_EMAIL=""
PUBLIC_ORIGIN=""
```

Notas:

- `CLERK_SECRET_KEY` y `RESEND_API_KEY` nunca deben exponerse al cliente.
- `PUBLIC_CLERK_PUBLISHABLE_KEY` puede exponerse porque tiene prefijo `PUBLIC_`.
- El Excel menciona `ORIGIN` en una hoja y `PUBLIC_ORIGIN` en otra. Confirmar el nombre definitivo antes de desplegar.
- Base de datos confirmada: Supabase PostgreSQL.

## 8. Alcance del MVP

Incluido:

- Login con Google via Clerk.
- Proteccion de rutas privadas.
- CRUD completo de clientes.
- Perfil de cliente con historial.
- Desactivacion de clientes sin borrar historial.
- CRUD completo de cotizaciones.
- Conceptos multiples por cotizacion.
- Calculo de subtotal, IVA 16% y total.
- Estados de cotizacion.
- Vista de detalle de cotizacion.
- Registro, historial y eliminacion controlada de pagos.
- Calculo automatico de saldo pendiente.
- Cambio automatico a `PAGADA` cuando el saldo llega a cero.
- Vista de cobranza pendiente con alertas por antiguedad.
- Correo automatico cuando una cotizacion pasa a `ENVIADA`.
- Dashboard con KPIs y graficas.
- Deploy funcional en Render.
- Migraciones Prisma aplicadas.
- Diseno responsive mobile-first.
- PDF de cotizaciones si no retrasa ni modifica de forma relevante el proyecto.
- Recordatorios de pago por correo en MVP usando Resend.

Fuera del MVP:

- Multi-tenant.
- PDF de cotizaciones, salvo que pueda agregarse sin retraso relevante.
- Portal de cliente.
- Facturacion electronica CFDI/SAT.
- App movil nativa.
- Conciliacion bancaria automatica.
- Nomina o gastos del despacho.
- Chat interno.

Nota: el usuario confirmo agregar PDF si no retrasa ni modifica de forma relevante el proyecto. Si complica el avance del MVP, se debe avisar antes de implementarlo.

## 9. Rutas Principales

- `/login`: login con Clerk.
- `/dashboard`: dashboard principal.
- `/clientes`: lista, busqueda, paginacion y acciones.
- `/clientes/[id]`: perfil completo del cliente.
- `/cotizaciones`: lista y filtros.
- `/cotizaciones/nueva`: crear cotizacion.
- `/cotizaciones/[id]`: detalle, estados, pagos e historial.
- `/cobranza`: cobranza pendiente.
- `/reportes/mes`: reporte mensual, version 1.1 o media prioridad.

Ruta canonica confirmada por el usuario: `/login`.

## 10. Seguridad Desde el Inicio

La seguridad no debe agregarse al final. Cada modulo debe implementarse con estas reglas:

- Todas las rutas privadas deben validar sesion en servidor antes de cargar datos.
- Las acciones de servidor deben validar que exista usuario autenticado.
- Nunca confiar en datos del cliente para IDs, montos, estados o totales.
- Validar entradas con Zod o equivalente antes de llamar a Prisma.
- Validar RFC mexicano, correo, montos positivos, fechas validas y estados permitidos.
- Recalcular subtotal, IVA y total en servidor aunque el cliente los muestre reactivos.
- Recalcular saldo pendiente en servidor despues de cada pago.
- Bloquear transiciones de estado invalidas en servidor.
- Registrar historial de cambios de estado.
- No permitir crear cotizaciones para clientes inactivos.
- No borrar clientes; usar `activo = false`.
- No eliminar pagos si la cotizacion ya esta `PAGADA`.
- No exponer llaves privadas en codigo cliente.
- Usar variables `$env/static/private` para secretos.
- Sanitizar o escapar datos insertados en HTML de correos.
- Registrar errores de Resend sin impedir que el estado de cotizacion avance cuando asi lo indique la historia.
- Evitar logs con datos sensibles, tokens, URLs privadas o payloads completos de clientes.
- Usar Decimal en base de datos para montos.
- Aplicar indices donde afecte busqueda o rendimiento.
- Mantener dependencias al minimo y auditables.

## 11. Modelo de Datos Base

Modelos requeridos:

- `Cliente`
- `Cotizacion`
- `Concepto`
- `Pago`
- `HistorialCot`

Enums:

- `EstadoCot`: `BORRADOR`, `ENVIADA`, `APROBADA`, `RECHAZADA`, `FACTURADA`, `PAGADA`
- `MetodoPago`: `TRANSFERENCIA`, `EFECTIVO`, `CHEQUE`, `TARJETA`

Schema base indicado:

```prisma
model Cliente {
  id             String       @id @default(cuid())
  nombre         String
  empresa        String?
  rfc            String?      @unique
  correo         String
  telefono       String?
  direccion      String?
  notas          String?
  activo         Boolean      @default(true)
  creadoEn       DateTime     @default(now())
  actualizadoEn  DateTime     @updatedAt
  cotizaciones   Cotizacion[]
}

model Cotizacion {
  id             String         @id @default(cuid())
  numero         String         @unique
  clienteId      String
  cliente        Cliente        @relation(fields: [clienteId], references: [id])
  estado         EstadoCot      @default(BORRADOR)
  fecha          DateTime       @default(now())
  vencimiento    DateTime?
  subtotal       Decimal        @db.Decimal(12,2)
  iva            Decimal        @db.Decimal(12,2)
  total          Decimal        @db.Decimal(12,2)
  notas          String?
  conceptos      Concepto[]
  pagos          Pago[]
  historial      HistorialCot[]
  creadoEn       DateTime       @default(now())
  actualizadoEn  DateTime       @updatedAt
}

model Concepto {
  id              String      @id @default(cuid())
  cotizacionId    String
  cotizacion      Cotizacion  @relation(fields: [cotizacionId], references: [id], onDelete: Cascade)
  descripcion     String
  cantidad        Decimal     @db.Decimal(10,2)
  precioUnitario  Decimal     @db.Decimal(12,2)
  subtotal        Decimal     @db.Decimal(12,2)
}

model Pago {
  id             String      @id @default(cuid())
  cotizacionId   String
  cotizacion     Cotizacion  @relation(fields: [cotizacionId], references: [id])
  monto          Decimal     @db.Decimal(12,2)
  fecha          DateTime
  metodo         MetodoPago
  referencia     String?
  creadoEn       DateTime    @default(now())
}

model HistorialCot {
  id              String      @id @default(cuid())
  cotizacionId    String
  cotizacion      Cotizacion  @relation(fields: [cotizacionId], references: [id])
  estadoAnterior  EstadoCot?
  estadoNuevo     EstadoCot
  nota            String?
  creadoEn        DateTime    @default(now())
}
```

Pendiente de decision: si Clerk gestiona usuarios externamente, no esta claro si el modelo `User`, `Account`, `Session` y `VerificationToken` debe existir. El Excel incluye comentarios de tablas tipo Auth.js/NextAuth, pero tambien exige Clerk.

## 12. Historias de Usuario Prioridad Alta - MVP

### Setup, Deploy y Autenticacion

- `US-001`: inicializar proyecto y configurar Prisma, Tailwind, Clerk y base del proyecto.
- `US-002`: configurar deploy automatico en Render desde GitHub.
- `US-003`: login con Google, rutas privadas y cierre de sesion.

### Clientes

- `US-004`: lista de clientes con busqueda por nombre, empresa o RFC, paginada de 20 en 20.
- `US-005`: registrar cliente con nombre, empresa, RFC, correo, telefono, direccion y notas.
- `US-006`: editar cliente existente y registrar fecha de modificacion.
- `US-007`: perfil de cliente con datos, cotizaciones, total facturado, cobrado y pendiente.

### Cotizaciones

- `US-009`: crear cotizacion con cliente, fechas, numero automatico `COT-YYYY-001`, conceptos, subtotal, IVA 16%, total y notas.
- `US-010`: cambiar estado con transiciones controladas e historial.
- `US-011`: buscar y filtrar cotizaciones por cliente, estado y fechas.
- `US-012`: editar solo cotizaciones en estado `BORRADOR`.

### Pagos y Cobranza

- `US-014`: registrar pagos parciales o totales contra cotizaciones aprobadas o facturadas.
- `US-015`: ver cartera pendiente por antiguedad en `/cobranza`.

### Correos

- `US-017`: enviar correo automatico al cliente al cambiar cotizacion a `ENVIADA`.

### Dashboard

- `US-020`: dashboard con facturado del mes, cobrado del mes, cartera pendiente, cotizaciones activas, graficas y listas clave.

## 13. Historias Media Prioridad - v1.1

- `US-008`: desactivar cliente.
- `US-013`: PDF de cotizacion, aunque esta fuera del MVP segun alcance.
- `US-016`: eliminar pago si cotizacion no esta pagada.
- `US-018`: correo cuando cotizacion pasa a aprobada.
- `US-019`: recordatorio manual de pago.
- `US-021`: reporte mensual por cliente con exportacion CSV.

Nota: aunque algunas historias son media prioridad, el alcance del MVP incluye desactivacion y eliminacion controlada de pagos. Confirmar orden de entrega.

## 14. Reglas de Cotizaciones

- Estados permitidos: `BORRADOR`, `ENVIADA`, `APROBADA`, `RECHAZADA`, `FACTURADA`, `PAGADA`.
- No se deben saltar pasos.
- Una cotizacion `RECHAZADA` o `PAGADA` no puede cambiar de estado.
- Solo `BORRADOR` puede editarse.
- Al pasar a `ENVIADA`, enviar correo automatico.
- Cada cambio de estado registra timestamp y usuario cuando sea posible.
- Numero de cotizacion: `COT-YYYY-001`.
- IVA fijo del 16%.
- Montos siempre en MXN.

Transicion base sugerida:

```text
BORRADOR -> ENVIADA
ENVIADA -> APROBADA
ENVIADA -> RECHAZADA
APROBADA -> FACTURADA
APROBADA -> PAGADA
FACTURADA -> PAGADA
```

Confirmar si `APROBADA -> PAGADA` sin `FACTURADA` es valido para el negocio.

## 15. Reglas de Clientes

- Listar clientes activos por defecto.
- Buscar por nombre, empresa o RFC.
- Paginacion de 20 registros.
- RFC: 12 o 13 caracteres alfanumericos.
- Correo requerido y con formato valido.
- Cliente inactivo no debe recibir nuevas cotizaciones.
- No borrar historial de cliente.

## 16. Reglas de Pagos

- Solo registrar pago en cotizaciones `APROBADA` o `FACTURADA`.
- Campos: monto, fecha, metodo y referencia.
- Una cotizacion puede tener multiples pagos.
- Saldo pendiente = total cotizacion - suma de pagos.
- Si saldo llega a cero, estado cambia a `PAGADA`.
- Si se elimina un pago, recalcular saldo y estado segun regla que se confirme.
- No eliminar pagos de cotizacion `PAGADA`, salvo confirmacion explicita.

## 17. Vista de Cobranza

Debe mostrar cotizaciones `APROBADA` o `FACTURADA` con saldo mayor a cero.

Columnas:

- Cliente.
- Numero de cotizacion.
- Fecha.
- Total.
- Pagado.
- Pendiente.
- Dias desde emision.

Reglas:

- Ordenar por mas dias primero.
- Amarillo para 15 a 30 dias.
- Rojo para mas de 30 dias.
- Mostrar cartera pendiente total en encabezado.
- Boton de recordatorio por fila en MVP usando Resend.

## 18. Dashboard

KPIs:

- Total facturado del mes.
- Total cobrado del mes.
- Cartera pendiente total.
- Cotizaciones activas.

Visualizaciones:

- Barras: ingresos cobrados por mes, ultimos 6 meses.
- Dona: cotizaciones por estado.
- Lista: ultimas 5 cotizaciones.
- Lista: top 3 clientes con mayor saldo pendiente.

Reglas:

- Calcular datos en servidor.
- Evitar fetch manual desde cliente para dashboard.
- Cargar en menos de 2 segundos.
- Formatear montos con `Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })`.

## 19. Correos con Resend

Requisitos:

- Usar Resend API.
- Templates HTML en JavaScript puro.
- Correos transaccionales, no marketing.
- Dominio personalizado recomendado.
- Si no hay dominio, usar `onboarding@resend.dev` solo para pruebas.
- Si envio falla, registrar error y mostrar alerta; la cotizacion puede cambiar de estado.
- El correo de cotizacion enviada debe incluir saludo, numero, monto, resumen de conceptos, datos de contacto y, si aplica, link a PDF o vista web.

Implementacion esperada:

- `src/lib/email.js` para cliente Resend.
- `src/lib/emailTemplates.js` para templates.
- Importar secretos desde `$env/static/private`.
- Escapar datos de cliente antes de interpolarlos en HTML.

## 20. Deploy

Render:

- Web Service conectado a GitHub.
- Build Command sugerido: `npm install && npx prisma generate && npm run build`.
- Start Command sugerido: `node build/index.js`.
- Usar `@sveltejs/adapter-node`.
- Variables de entorno configuradas en Render.
- Ejecutar migraciones de produccion con `npx prisma migrate deploy`, confirmar si sera manual o dentro del build.
- Agregar URL de Render en Clerk como allowed origin / redirect URL.

## 21. Decisiones Confirmadas y Pendientes Antes de Implementar

Confirmado por el usuario el 7 de julio de 2026:

1. Stack definitivo: SvelteKit + JavaScript + Prisma + Supabase PostgreSQL + Clerk + Resend + Tailwind.
2. No usar Next.js ni TypeScript.
3. No usar shadcn salvo que sea conveniente y no complique el proyecto.
4. Base de datos: Supabase PostgreSQL.
5. Ruta de login: `/login`.
6. PDF: agregarlo si no retrasa ni cambia de forma relevante el proyecto.
7. Recordatorios de pago: entran en MVP usando Resend.
8. Fecha limite correcta: 9 de julio de 2026. La fecha 2025 fue error de captura.
9. Graficas: usar Chart.js con `svelte-chartjs`; no usar Recharts.
10. Usuarios: no crear tabla `User` propia al inicio; Clerk sera la fuente de usuario y se guardara `clerkUserId`/metadata donde haga falta.
11. Origen publico: usar `PUBLIC_ORIGIN` como variable estandar para la URL publica de la app.

Pendiente antes de construir:

- Sin pendientes bloqueantes al momento de iniciar.

## 22. Orden de Construccion Recomendado

1. Inicializar SvelteKit JavaScript con ESLint y Prettier.
2. Instalar y configurar Tailwind.
3. Configurar Prisma con PostgreSQL.
4. Definir schema y migracion inicial.
5. Integrar Clerk y proteger rutas.
6. Crear layout privado con sidebar y header.
7. Implementar clientes.
8. Implementar cotizaciones y reglas de estado.
9. Implementar pagos.
10. Implementar cobranza.
11. Implementar Resend, templates y recordatorios de pago.
12. Implementar dashboard.
13. Implementar PDF si no afecta de forma relevante el avance.
14. Preparar Render y variables.
15. Ejecutar pruebas manuales y revisar seguridad por modulo.

## 23. Criterio de Trabajo para Codex

- Antes de ejecutar una decision ambigua, preguntar.
- Mantener este documento actualizado si el usuario aclara una decision.
- Construir seguridad junto con cada modulo.
- No dejar validaciones o protecciones para el final.
- Evitar parches grandes y tardios de seguridad.
- Seguir el alcance MVP salvo instruccion explicita del usuario.
- Preferir implementaciones simples y mantenibles.
- Mantener UI responsive, clara y orientada a uso diario.
