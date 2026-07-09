import { redirect } from '@sveltejs/kit';
import { ensureUsuarioForSession, isPublicPath, readSession } from '$lib/server/auth.js';

export async function handle({ event, resolve }) {
	const session = await readSession(event);

	event.locals.userId = session?.userId ?? null;
	event.locals.sessionId = session?.sessionId ?? null;
	event.locals.usuario = null;

	if (event.locals.userId) {
		event.locals.usuario = await ensureUsuarioForSession(event.locals.userId);
	}

	if (!event.locals.userId && !isPublicPath(event.url.pathname)) {
		redirect(303, '/login');
	}

	if (event.locals.userId && event.locals.usuario && event.url.pathname === '/login') {
		redirect(303, '/dashboard');
	}

	if (
		event.locals.userId &&
		!event.locals.usuario &&
		!isPublicPath(event.url.pathname) &&
		event.url.pathname !== '/pendiente'
	) {
		redirect(303, '/pendiente');
	}

	if (event.locals.userId && event.locals.usuario && event.url.pathname === '/pendiente') {
		redirect(303, '/dashboard');
	}

	return resolve(event);
}
