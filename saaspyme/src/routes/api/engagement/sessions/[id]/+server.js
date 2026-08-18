import { json } from '@sveltejs/kit';
import { requireUsuario } from '$lib/server/auth.js';
import { closeEngagementSession } from '$lib/server/engagement.js';

export async function PATCH(event) {
	const usuario = requireUsuario(event.locals);
	const sesionId = event.params.id;

	try {
		const session = await closeEngagementSession(sesionId, usuario.id);
		if (!session) {
			return json({ ok: false, error: 'Sesion no encontrada' }, { status: 404 });
		}

		return json({ ok: true });
	} catch (cause) {
		console.error('[api/engagement/sessions] Error al cerrar sesion', cause);
		return json({ ok: false, error: 'No se pudo cerrar la sesion' }, { status: 500 });
	}
}
