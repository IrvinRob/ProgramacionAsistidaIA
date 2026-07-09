import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { requireAdmin } from '$lib/server/auth.js';

const ROLES = new Set(['ADMIN', 'SOCIO', 'ASISTENTE']);

function normalizeEmail(value) {
	return String(value ?? '')
		.trim()
		.toLowerCase();
}

function normalizeText(value) {
	return String(value ?? '').trim();
}

function readUserForm(formData) {
	const nombre = normalizeText(formData.get('nombre'));
	const correo = normalizeEmail(formData.get('correo'));
	const rol = normalizeText(formData.get('rol'));

	if (!nombre || !correo || !ROLES.has(rol)) {
		return {
			error: 'Captura nombre, correo y un rol valido.'
		};
	}

	return { nombre, correo, rol };
}

export async function load({ locals }) {
	const usuarioActual = requireAdmin(locals);
	const usuarios = await prisma.usuario.findMany({
		orderBy: [{ activo: 'desc' }, { rol: 'asc' }, { nombre: 'asc' }]
	});

	return {
		usuarioActualId: usuarioActual.id,
		usuarios
	};
}

export const actions = {
	crear: async ({ request, locals }) => {
		requireAdmin(locals);

		const data = readUserForm(await request.formData());

		if (data.error) {
			return fail(400, { error: data.error });
		}

		try {
			await prisma.usuario.create({
				data: {
					nombre: data.nombre,
					correo: data.correo,
					rol: data.rol,
					activo: true
				}
			});
		} catch {
			return fail(400, { error: 'Ese correo ya esta registrado.' });
		}

		return { ok: true };
	},
	actualizar: async ({ request, locals }) => {
		requireAdmin(locals);

		const formData = await request.formData();
		const id = normalizeText(formData.get('id'));
		const data = readUserForm(formData);

		if (!id || data.error) {
			return fail(400, { error: data.error ?? 'Usuario invalido.' });
		}

		try {
			await prisma.usuario.update({
				where: { id },
				data: {
					nombre: data.nombre,
					correo: data.correo,
					rol: data.rol
				}
			});
		} catch {
			return fail(400, { error: 'No se pudo actualizar el usuario.' });
		}

		return { ok: true };
	},
	cambiarEstado: async ({ request, locals }) => {
		const admin = requireAdmin(locals);
		const formData = await request.formData();
		const id = normalizeText(formData.get('id'));
		const activo = formData.get('activo') === 'true';

		if (!id) {
			return fail(400, { error: 'Usuario invalido.' });
		}

		if (id === admin.id && !activo) {
			return fail(400, { error: 'No puedes desactivar tu propio usuario administrador.' });
		}

		await prisma.usuario.update({
			where: { id },
			data: { activo }
		});

		return { ok: true };
	}
};
