import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { requireUsuario } from '$lib/server/auth.js';
import { createEngagementSession } from '$lib/server/engagement.js';

const schema = z.object({
	rutaInicio: z.string().trim().max(200).optional(),
	camaraActiva: z.boolean().optional()
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
		return json({ ok: false, error: 'Datos de sesion invalidos' }, { status: 400 });
	}

	try {
		const session = await createEngagementSession({
			usuarioId: usuario.id,
			rutaInicio: parsed.data.rutaInicio ?? '/',
			camaraActiva: parsed.data.camaraActiva ?? true
		});

		return json({ ok: true, sessionId: session.id });
	} catch (cause) {
		console.error('[api/engagement/sessions] Error al crear sesion', cause);
		return json({ ok: false, error: 'No se pudo crear la sesion de engagement' }, { status: 500 });
	}
}
