import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUsuario } from '$lib/server/auth.js';
import { saveAssistantIntervention } from '$lib/server/engagement.js';

const schema = z.object({
	sesionId: z.string().trim().min(1),
	tipo: z.enum(['SALUDO_INICIAL', 'OFERTA_AYUDA', 'ACLARACION']),
	emocionDisparadora: z.string().trim().max(40).nullable().optional(),
	respuestaClaude: z.string().trim().min(1).max(4000)
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
		return json({ ok: false, error: 'Datos de intervencion invalidos' }, { status: 400 });
	}

	try {
		const intervencion = await saveAssistantIntervention({
			...parsed.data,
			usuarioId: usuario.id
		});

		if (!intervencion) {
			return json({ ok: false, error: 'Sesion no encontrada' }, { status: 404 });
		}

		return json({ ok: true, id: intervencion.id });
	} catch (cause) {
		console.error('[api/engagement/intervenciones] Error al guardar intervencion', cause);
		return json({ ok: false, error: 'No se pudo guardar la intervencion' }, { status: 500 });
	}
}
