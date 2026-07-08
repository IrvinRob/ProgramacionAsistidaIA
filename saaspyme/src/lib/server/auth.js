import { verifyToken } from '@clerk/backend';
import { CLERK_SECRET_KEY } from '$env/static/private';
import { redirect } from '@sveltejs/kit';

const PUBLIC_PATHS = new Set(['/login', '/logout']);

export function isPublicPath(pathname) {
	return PUBLIC_PATHS.has(pathname) || pathname.startsWith('/api/public');
}

export async function readSession(event) {
	const token = event.cookies.get('__session');

	if (!token || !CLERK_SECRET_KEY) {
		return null;
	}

	try {
		const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
		return {
			userId: payload.sub,
			sessionId: payload.sid
		};
	} catch {
		return null;
	}
}

export function requireUser(locals) {
	if (!locals.userId) {
		redirect(303, '/login');
	}

	return locals.userId;
}
