import { redirect } from '@sveltejs/kit';
import {
	APP_SESSION_MAX_AGE,
	createAppSessionToken,
	ensureUsuarioForSession,
	getClerkUserProfile,
	isPublicPath,
	readSession,
	SESSION_COOKIE
} from '$lib/server/auth.js';

export async function handle({ event, resolve }) {
	const session = await readSession(event);

	event.locals.userId = session?.userId ?? null;
	event.locals.sessionId = session?.sessionId ?? null;
	event.locals.imageUrl = session?.imageUrl ?? null;
	event.locals.usuario = null;

	if (event.locals.userId) {
		try {
			event.locals.usuario = await ensureUsuarioForSession(event.locals.userId);
		} catch (cause) {
			console.error('[auth] No se pudo asegurar el usuario local', {
				pathname: event.url.pathname,
				userId: event.locals.userId,
				cause
			});
			event.locals.usuario = null;
		}

		if (event.locals.usuario && !event.locals.imageUrl) {
			try {
				const profile = await getClerkUserProfile(event.locals.userId);
				event.locals.imageUrl = profile.imageUrl;

				if (event.locals.imageUrl) {
					event.cookies.set(
						SESSION_COOKIE,
						createAppSessionToken({
							userId: event.locals.userId,
							sessionId: event.locals.sessionId,
							imageUrl: event.locals.imageUrl
						}),
						{
							path: '/',
							httpOnly: true,
							secure: process.env.NODE_ENV === 'production',
							sameSite: 'lax',
							maxAge: APP_SESSION_MAX_AGE
						}
					);
				}
			} catch (cause) {
				console.warn('[auth] No se pudo obtener foto de perfil de Clerk', {
					userId: event.locals.userId,
					cause
				});
			}
		}
	}

	if (!event.locals.userId && !isPublicPath(event.url.pathname)) {
		redirect(303, `/login?redirectTo=${encodeURIComponent(event.url.pathname + event.url.search)}`);
	}

	if (event.locals.userId && event.locals.usuario && event.url.pathname === '/login') {
		const redirectTo = event.url.searchParams.get('redirectTo');
		redirect(
			303,
			redirectTo &&
				redirectTo.startsWith('/') &&
				!redirectTo.startsWith('//') &&
				!['/login', '/logout'].includes(redirectTo)
				? redirectTo
				: '/dashboard'
		);
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

export function handleError({ error, event }) {
	console.error('[server] Error no controlado', {
		pathname: event.url.pathname,
		error
	});

	return {
		message: 'Error interno del servidor'
	};
}
