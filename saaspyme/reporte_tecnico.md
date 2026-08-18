# Reporte Técnico — Integración MorphCast en GestorPyme

**Proyecto:** GestorPyme (SvelteKit + Supabase + Render)  
**Módulo:** Programación Asistida por IA — UACH  
**Autor:** Irvin Robles

---

## API elegida y por qué

Se integró **MorphCast Emotion AI (JS Engine)** como API obligatoria del módulo, complementada con **Claude (Anthropic)** para las respuestas del asistente.

**MorphCast** procesa la webcam en el navegador del usuario y devuelve emociones en tiempo real (Happy, Sad, Angry, Surprise, etc.) sin enviar video a servidores externos. Esto encaja con GestorPyme porque permite medir engagement mientras el usuario usa el asistente flotante y registrar lecturas en Supabase para el **Dashboard de Engagement**, cumpliendo la rúbrica (demo en producción, persistencia y valor de negocio).

Se descartaron **Google Veo 3** (generación de video, no detección emocional en app) y **Tavus** (avatares conversacionales, más pesado para un SaaS de gestión). **Claude** ya estaba integrado y actúa como “cerebro”: recibe el contexto emocional y genera respuestas proactivas (aclaración, humor ante enojo, siguiente paso ante reacción positiva).

---

## Tres principales problemas encontrados

1. **Conexión Prisma ↔ Supabase (error P1001)**  
   Las migraciones fallaban porque `DIRECT_URL` apuntaba al host directo `db.*.supabase.co:5432`, inaccesible por IPv6 en el entorno local.

2. **MorphCast no activaba la cámara ni analizaba emociones**  
   El SDK cargaba, pero sin `PUBLIC_MORPHCAST_LICENSE_KEY` en `.env` no iniciaba el módulo `FACE_EMOTION`. En producción, las variables tampoco se suben con Git; hay que configurarlas en Render.

3. **Interpretación emocional y UX del asistente**  
   El enojo se agrupaba con frustración; Claude reaccionaba antes de que el usuario leyera la respuesta; el chat no hacía scroll automático y, en pruebas, el asistente podía asumir una conversación previa que no existía.

---

## Cómo se resolvieron

1. **Base de datos:** `DATABASE_URL` con pooler (puerto 6543) y `DIRECT_URL` con pooler en modo sesión (puerto 5432). Migración `add_engagement` aplicada con tablas `SesionEngagement`, `LecturaEmocion` e `IntervencionAsistente`.

2. **MorphCast:** License key JS Engine en `.env` / Render; widget con vista previa de cámara, inicio al abrir el asistente y registro de lecturas vía `/api/engagement/*`.

3. **Asistente empático:** Interpretación separada para **enojo** vs **frustración**; pausa de 4 s post-respuesta antes de vigilar reacción; scroll automático; prompts ajustados para no inventar contexto; respuestas proactivas con tono ligero (respiración, chiste corto) ante enojo.

---

## Qué haría diferente

- Incluir `prisma migrate deploy` en el build de Render para no aplicar migraciones manualmente.  
- Validar variables de entorno al arranque con mensajes claros en logs.  
- Quitar el prefijo de emoción en respuestas antes de producción final (solo útil para testing).  
- Afinar umbrales de MorphCast con datos reales del dashboard y reducir falsos positivos en `detectProactiveReaction`.  
- Documentar desde el inicio el flujo Render + Supabase + Clerk para evitar retrabajo en deploy.

---

*Deploy: https://github.com/IrvinRob/ProgramacionAsistidaIA (carpeta `saaspyme`, Render.com)*
