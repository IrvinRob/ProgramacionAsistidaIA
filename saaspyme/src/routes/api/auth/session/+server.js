import { json } from '@sveltejs/kit';
import { ensureUsuarioForSession, SESSION_COOKIE, verifySessionToken } from '$lib/server/auth.js';

export async function POST({ request, cookies }) {
	const { token } = await request.json().catch(() => ({ token: null }));
	const session = await verifySessionToken(token);

	if (!session) {
		return json({ ok: false, error: 'Sesion invalida' }, { status: 401 });
	}

	const usuario = await ensureUsuarioForSession(session.userId);

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
