import { json } from '@sveltejs/kit';
import { ensureUsuarioForSession, SESSION_COOKIE, verifySessionToken } from '$lib/server/auth.js';

export async function POST({ request, cookies }) {
	const { token } = await request.json().catch(() => ({ token: null }));
	console.info('[auth] Recibida solicitud de sincronizacion de sesion', { hasToken: Boolean(token) });

	const session = await verifySessionToken(token);

	if (!session) {
		console.warn('[auth] Token de Clerk invalido o ausente');
		return json({ ok: false, error: 'Sesion invalida' }, { status: 401 });
	}

	const usuario = await ensureUsuarioForSession(session.userId);
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
