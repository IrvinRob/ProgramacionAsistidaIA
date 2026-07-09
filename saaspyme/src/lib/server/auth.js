import { verifyToken } from '@clerk/backend';
import { CLERK_SECRET_KEY } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { prisma } from '$lib/server/prisma.js';

const PUBLIC_PATHS = new Set(['/login', '/logout', '/pendiente']);
const ADMIN_ROLES = new Set(['ADMIN']);
export const SESSION_COOKIE = 'gestorpyme_session';
export const APP_SESSION_MAX_AGE = 60 * 60 * 8;

export function isPublicPath(pathname) {
	return (
		PUBLIC_PATHS.has(pathname) ||
		pathname.startsWith('/api/public') ||
		pathname.startsWith('/api/auth')
	);
}

function signSessionPayload(payload) {
	return createHmac('sha256', CLERK_SECRET_KEY).update(payload).digest('base64url');
}

function verifySignature(payload, signature) {
	const expected = Buffer.from(signSessionPayload(payload));
	const actual = Buffer.from(signature);

	if (expected.length !== actual.length) {
		return false;
	}

	return timingSafeEqual(expected, actual);
}

export function createAppSessionToken({ userId, sessionId, imageUrl }) {
	if (!CLERK_SECRET_KEY) {
		throw new Error('Falta CLERK_SECRET_KEY para firmar la sesion');
	}

	const payload = Buffer.from(
		JSON.stringify({
			userId,
			sessionId,
			imageUrl: imageUrl || null,
			exp: Math.floor(Date.now() / 1000) + APP_SESSION_MAX_AGE
		})
	).toString('base64url');

	return `${payload}.${signSessionPayload(payload)}`;
}

function readAppSessionToken(token) {
	if (!token || !CLERK_SECRET_KEY) {
		return null;
	}

	const [payload, signature] = token.split('.');

	if (!payload || !signature || !verifySignature(payload, signature)) {
		return null;
	}

	try {
		const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));

		if (!session.userId || session.exp < Math.floor(Date.now() / 1000)) {
			return null;
		}

		return {
			userId: session.userId,
			sessionId: session.sessionId ?? null,
			imageUrl: session.imageUrl ?? null
		};
	} catch (cause) {
		console.warn('[auth] No se pudo leer la sesion interna', cause);
		return null;
	}
}

export async function readSession(event) {
	const appSession = readAppSessionToken(event.cookies.get(SESSION_COOKIE));

	if (appSession) {
		return appSession;
	}

	const clerkToken = event.cookies.get('__session');

	if (!clerkToken || !CLERK_SECRET_KEY) {
		return null;
	}

	try {
		const payload = await verifyToken(clerkToken, { secretKey: CLERK_SECRET_KEY });
		return {
			userId: payload.sub,
			sessionId: payload.sid,
			imageUrl: payload.image_url ?? null
		};
	} catch (cause) {
		console.warn('[auth] No se pudo validar la cookie de sesion', cause);
		return null;
	}
}

export async function verifySessionToken(token) {
	if (!token || !CLERK_SECRET_KEY) {
		return null;
	}

	try {
		const payload = await verifyToken(token, { secretKey: CLERK_SECRET_KEY });
		return {
			userId: payload.sub,
			sessionId: payload.sid,
			claims: payload
		};
	} catch (cause) {
		console.warn('[auth] No se pudo validar el token de Clerk', cause);
		return null;
	}
}

function normalizeProfile(profile) {
	const correo = String(profile?.correo ?? profile?.email ?? '')
		.trim()
		.toLowerCase();
	const nombre = String(profile?.nombre ?? profile?.name ?? correo).trim();

	if (!correo) {
		return null;
	}

	return {
		correo,
		nombre: nombre || correo,
		imageUrl: profile?.imageUrl ?? profile?.image_url ?? null
	};
}

export async function getClerkUserProfile(clerkUserId) {
	const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
		headers: {
			Authorization: `Bearer ${CLERK_SECRET_KEY}`
		}
	});

	if (!response.ok) {
		console.error('[auth] Clerk no devolvio el perfil del usuario', {
			status: response.status,
			clerkUserId
		});
		throw new Error('No se pudo consultar el usuario de Clerk');
	}

	const user = await response.json();
	const primaryEmail = user.email_addresses?.find(
		(email) => email.id === user.primary_email_address_id
	);
	const correo = primaryEmail?.email_address ?? user.email_addresses?.[0]?.email_address;
	const nombre = [user.first_name, user.last_name].filter(Boolean).join(' ') || correo;

	if (!correo) {
		throw new Error('El usuario de Clerk no tiene correo disponible');
	}

	return {
		nombre,
		correo: correo.toLowerCase(),
		imageUrl: user.image_url ?? null
	};
}

export async function ensureUsuarioForSession(clerkUserId, fallbackProfile = null) {
	const current = await prisma.usuario.findUnique({ where: { clerkUserId } });

	if (current) {
		console.info('[auth] Usuario encontrado por Clerk ID', {
			id: current.id,
			rol: current.rol,
			activo: current.activo
		});
		return current.activo ? current : null;
	}

	let profile;

	try {
		profile = await getClerkUserProfile(clerkUserId);
	} catch (cause) {
		console.warn('[auth] Usando perfil alterno del cliente despues de falla con Clerk API', {
			clerkUserId,
			cause
		});
		profile = normalizeProfile(fallbackProfile);
	}

	if (!profile) {
		console.warn('[auth] No hay correo disponible para enlazar usuario local', { clerkUserId });
		return null;
	}

	const existing = await prisma.usuario.findUnique({ where: { correo: profile.correo } });

	if (existing) {
		console.info('[auth] Usuario encontrado por correo', {
			id: existing.id,
			rol: existing.rol,
			activo: existing.activo
		});

		if (!existing.activo) {
			return null;
		}

		return prisma.usuario.update({
			where: { id: existing.id },
			data: {
				clerkUserId,
				nombre: existing.nombre || profile.nombre
			}
		});
	}

	const usuariosCount = await prisma.usuario.count();

	if (usuariosCount === 0) {
		console.info('[auth] Creando primer usuario como ADMIN', { correo: profile.correo });
		return prisma.usuario.create({
			data: {
				clerkUserId,
				nombre: profile.nombre,
				correo: profile.correo,
				rol: 'ADMIN',
				activo: true
			}
		});
	}

	return null;
}

export function requireUser(locals) {
	if (!locals.userId) {
		redirect(303, '/login');
	}

	return locals.userId;
}

export function requireUsuario(locals) {
	requireUser(locals);

	if (!locals.usuario) {
		redirect(303, '/pendiente');
	}

	return locals.usuario;
}

export function requireAdmin(locals) {
	const usuario = requireUsuario(locals);

	if (!ADMIN_ROLES.has(usuario.rol)) {
		redirect(303, '/dashboard');
	}

	return usuario;
}
