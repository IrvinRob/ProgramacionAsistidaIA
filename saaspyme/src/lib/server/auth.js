import { verifyToken } from '@clerk/backend';
import { CLERK_SECRET_KEY } from '$env/static/private';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';

const PUBLIC_PATHS = new Set(['/login', '/logout', '/pendiente']);
const ADMIN_ROLES = new Set(['ADMIN']);

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

async function getClerkUserProfile(clerkUserId) {
	const response = await fetch(`https://api.clerk.com/v1/users/${clerkUserId}`, {
		headers: {
			Authorization: `Bearer ${CLERK_SECRET_KEY}`
		}
	});

	if (!response.ok) {
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
		correo: correo.toLowerCase()
	};
}

export async function ensureUsuarioForSession(clerkUserId) {
	const current = await prisma.usuario.findUnique({ where: { clerkUserId } });

	if (current) {
		return current.activo ? current : null;
	}

	const profile = await getClerkUserProfile(clerkUserId);
	const existing = await prisma.usuario.findUnique({ where: { correo: profile.correo } });

	if (existing) {
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
