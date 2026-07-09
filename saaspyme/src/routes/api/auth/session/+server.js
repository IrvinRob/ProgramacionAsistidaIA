import { json } from '@sveltejs/kit';
import { ensureUsuarioForSession, SESSION_COOKIE, verifySessionToken } from '$lib/server/auth.js';

export async function POST({ request, cookies }) {
	const { token, profile } = await request.json().catch(() => ({ token: null, profile: null }));
	console.info('[auth] Recibida solicitud de sincronizacion de sesion', {
		hasToken: Boolean(token)
	});

	const session = await verifySessionToken(token);

	if (!session) {
		console.warn('[auth] Token de Clerk invalido o ausente');
		return json({ ok: false, error: 'Sesion invalida' }, { status: 401 });
	}

	let usuario;

	try {
		usuario = await ensureUsuarioForSession(session.userId, profile);
	} catch (cause) {
		console.error('[auth] No se pudo crear o enlazar el usuario local', {
			userId: session.userId,
			cause
		});
		return json({ ok: false, error: 'No se pudo crear el usuario local' }, { status: 500 });
	}
	console.info('[auth] Sesion de Clerk sincronizada', {
		userId: session.userId,
		hasUsuario: Boolean(usuario),
		rol: usuario?.rol ?? null
	});

	cookies.set(SESSION_COOKIE, token, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60
	});

	return json({
		ok: true,
		redirectTo: usuario ? '/dashboard' : '/pendiente'
	});
}
