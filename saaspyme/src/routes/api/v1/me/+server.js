import { json } from '@sveltejs/kit';
import { authenticateApiRequest } from '$lib/server/apiAuth.js';

export async function GET(event) {
	const usuario = await authenticateApiRequest(event);

	if (usuario instanceof Response) {
		return usuario;
	}

	return json({
		ok: true,
		usuario: {
			id: usuario.id,
			nombre: usuario.nombre,
			correo: usuario.correo,
			rol: usuario.rol,
			activo: usuario.activo,
			imageUrl: event.locals.imageUrl ?? null
		}
	});
}
