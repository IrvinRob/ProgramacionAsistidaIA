import { redirect } from '@sveltejs/kit';
import { isPublicPath, readSession } from '$lib/server/auth.js';

export async function handle({ event, resolve }) {
	const session = await readSession(event);

	event.locals.userId = session?.userId ?? null;
	event.locals.sessionId = session?.sessionId ?? null;

	if (!event.locals.userId && !isPublicPath(event.url.pathname)) {
		redirect(303, '/login');
	}

	if (event.locals.userId && event.url.pathname === '/login') {
		redirect(303, '/dashboard');
	}

	return resolve(event);
}
