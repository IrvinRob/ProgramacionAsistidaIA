import { json } from '@sveltejs/kit';
import { ensureUsuarioForSession, readSession, verifySessionToken } from '$lib/server/auth.js';

export function isApiPath(pathname) {
	return pathname.startsWith('/api/v1');
}

async function resolveBearerSession(request) {
	const header = request.headers.get('authorization') ?? '';
	const match = header.match(/^Bearer\s+(.+)$/i);

	if (!match) {
		return null;
	}

	const token = match[1].trim();
	const clerkSession = await verifySessionToken(token);

	if (!clerkSession) {
		return null;
	}

	return {
		userId: clerkSession.userId,
		sessionId: clerkSession.sessionId ?? null,
		imageUrl: clerkSession.claims?.image_url ?? null
	};
}

export async function authenticateApiRequest(event) {
	if (event.locals.userId && event.locals.usuario) {
		return event.locals.usuario;
	}

	const bearerSession = await resolveBearerSession(event.request);

	if (bearerSession) {
		event.locals.userId = bearerSession.userId;
		event.locals.sessionId = bearerSession.sessionId;
		event.locals.imageUrl = bearerSession.imageUrl;
		event.locals.usuario = await ensureUsuarioForSession(bearerSession.userId);
	}

	if (!event.locals.userId) {
		return json({ ok: false, error: 'No autenticado' }, { status: 401 });
	}

	if (!event.locals.usuario) {
		return json({ ok: false, error: 'Usuario no autorizado' }, { status: 403 });
	}

	return event.locals.usuario;
}

export async function readApiSession(event) {
	const session = await readSession(event);

	if (session) {
		return session;
	}

	return resolveBearerSession(event.request);
}
