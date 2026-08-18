import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUsuario } from '$lib/server/auth.js';
import { saveEmotionReading } from '$lib/server/engagement.js';

const schema = z.object({
	sesionId: z.string().trim().min(1),
	emocionDominante: z.string().trim().max(40).nullable().optional(),
	emociones: z.record(z.string(), z.number()).default({}),
	atencion: z.number().min(0).max(1).nullable().optional(),
	ruta: z.string().trim().max(200).optional(),
	motivo: z.enum(['SESSION_START', 'POST_RESPONSE', 'MILESTONE', 'SESSION_END'])
});

export async function POST(event) {
	const usuario = requireUsuario(event.locals);

	let body;
	try {
		body = await event.request.json();
	} catch {
		return json({ ok: false, error: 'Cuerpo de solicitud invalido' }, { status: 400 });
	}

	const parsed = schema.safeParse(body);
	if (!parsed.success) {
		return json({ ok: false, error: 'Datos de lectura invalidos' }, { status: 400 });
	}

	try {
		const lectura = await saveEmotionReading({
			...parsed.data,
			usuarioId: usuario.id,
			ruta: parsed.data.ruta ?? '/'
		});

		if (!lectura) {
			return json({ ok: false, error: 'Sesion no encontrada' }, { status: 404 });
		}

		return json({ ok: true, id: lectura.id });
	} catch (cause) {
		console.error('[api/engagement/lecturas] Error al guardar lectura', cause);
		return json({ ok: false, error: 'No se pudo guardar la lectura' }, { status: 500 });
	}
}
