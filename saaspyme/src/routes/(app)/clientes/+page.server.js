import { fail, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { requireUsuario } from '$lib/server/auth.js';
import { clienteSchema, formErrors } from '$lib/server/validation.js';

const PAGE_SIZE = 20;

function cleanOptional(value) {
	return value === '' ? null : value;
}

function clienteWhere(q, activo) {
	return {
		activo,
		...(q
			? {
					OR: [
						{ nombre: { contains: q, mode: 'insensitive' } },
						{ empresa: { contains: q, mode: 'insensitive' } },
						{ rfc: { contains: q, mode: 'insensitive' } }
					]
				}
			: {})
	};
}

function serializeCliente(cliente) {
	const totalFacturado = cliente.cotizaciones.reduce((sum, cotizacion) => {
		return sum + Number(cotizacion.total);
	}, 0);
	const totalCobrado = cliente.cotizaciones.reduce((sum, cotizacion) => {
		return sum + cotizacion.pagos.reduce((pagoSum, pago) => pagoSum + Number(pago.monto), 0);
	}, 0);

	return {
		id: cliente.id,
		nombre: cliente.nombre,
		empresa: cliente.empresa,
		rfc: cliente.rfc,
		correo: cliente.correo,
		telefono: cliente.telefono,
		direccion: cliente.direccion,
		notas: cliente.notas,
		activo: cliente.activo,
		creadoEn: cliente.creadoEn.toISOString(),
		totalFacturado,
		totalCobrado,
		saldoPendiente: totalFacturado - totalCobrado,
		cotizaciones: cliente._count.cotizaciones
	};
}

export async function load({ locals, url }) {
	requireUsuario(locals);

	const q = url.searchParams.get('q')?.trim() ?? '';
	const page = Math.max(Number(url.searchParams.get('page') ?? 1), 1);
	const skip = (page - 1) * PAGE_SIZE;
	const activosWhere = clienteWhere(q, true);
	const inactivosWhere = clienteWhere(q, false);

	const [clientes, clientesInactivos, total, totalInactivos] = await Promise.all([
		prisma.cliente.findMany({
			where: activosWhere,
			orderBy: { creadoEn: 'desc' },
			skip,
			take: PAGE_SIZE,
			include: {
				_count: { select: { cotizaciones: true } },
				cotizaciones: {
					select: {
						total: true,
						pagos: { select: { monto: true } }
					}
				}
			}
		}),
		prisma.cliente.findMany({
			where: inactivosWhere,
			orderBy: { actualizadoEn: 'desc' },
			include: {
				_count: { select: { cotizaciones: true } },
				cotizaciones: {
					select: {
						total: true,
						pagos: { select: { monto: true } }
					}
				}
			}
		}),
		prisma.cliente.count({ where: activosWhere }),
		prisma.cliente.count({ where: inactivosWhere })
	]);

	return {
		clientes: clientes.map(serializeCliente),
		clientesInactivos: clientesInactivos.map(serializeCliente),
		q,
		created: url.searchParams.get('created') === '1',
		updated: url.searchParams.get('updated') === '1',
		statusChanged: url.searchParams.get('statusChanged') === '1',
		page,
		total,
		totalInactivos,
		pageSize: PAGE_SIZE,
		pages: Math.max(Math.ceil(total / PAGE_SIZE), 1)
	};
}

export const actions = {
	crear: async ({ request, locals }) => {
		requireUsuario(locals);

		const data = Object.fromEntries(await request.formData());
		const parsed = clienteSchema.safeParse(data);

		if (!parsed.success) {
			return fail(400, { values: data, errors: formErrors(parsed) });
		}

		try {
			await prisma.cliente.create({
				data: {
					nombre: parsed.data.nombre,
					empresa: cleanOptional(parsed.data.empresa),
					rfc: cleanOptional(parsed.data.rfc),
					correo: parsed.data.correo.toLowerCase(),
					telefono: cleanOptional(parsed.data.telefono),
					direccion: cleanOptional(parsed.data.direccion),
					notas: cleanOptional(parsed.data.notas)
				}
			});
		} catch (cause) {
			if (cause?.code === 'P2002') {
				return fail(400, {
					values: data,
					errors: { rfc: 'Ya existe un cliente con este RFC' }
				});
			}

			console.error('[clientes] No se pudo crear cliente', cause);
			return fail(500, {
				values: data,
				errors: { general: 'No se pudo crear el cliente.' }
			});
		}

		redirect(303, '/clientes?created=1');
	},
	editar: async ({ request, locals }) => {
		requireUsuario(locals);

		const formData = await request.formData();
		const id = String(formData.get('id') ?? '');
		const data = Object.fromEntries(formData);
		const parsed = clienteSchema.safeParse(data);

		if (!id) {
			return fail(400, { errors: { general: 'No se recibio el cliente a editar.' } });
		}

		if (!parsed.success) {
			return fail(400, { editId: id, values: data, errors: formErrors(parsed) });
		}

		try {
			await prisma.cliente.update({
				where: { id },
				data: {
					nombre: parsed.data.nombre,
					empresa: cleanOptional(parsed.data.empresa),
					rfc: cleanOptional(parsed.data.rfc),
					correo: parsed.data.correo.toLowerCase(),
					telefono: cleanOptional(parsed.data.telefono),
					direccion: cleanOptional(parsed.data.direccion),
					notas: cleanOptional(parsed.data.notas)
				}
			});
		} catch (cause) {
			if (cause?.code === 'P2002') {
				return fail(400, {
					editId: id,
					values: data,
					errors: { rfc: 'Ya existe otro cliente con este RFC' }
				});
			}

			console.error('[clientes] No se pudo editar cliente', { id, cause });
			return fail(500, {
				editId: id,
				values: data,
				errors: { general: 'No se pudo actualizar el cliente.' }
			});
		}

		redirect(303, '/clientes?updated=1');
	},
	cambiarEstado: async ({ request, locals }) => {
		requireUsuario(locals);

		const data = await request.formData();
		const id = String(data.get('id') ?? '');
		const activo = String(data.get('activo') ?? '') === 'true';

		if (!id) {
			return fail(400, { errors: { general: 'No se recibio el cliente a modificar.' } });
		}

		try {
			await prisma.cliente.update({
				where: { id },
				data: { activo }
			});
		} catch (cause) {
			console.error('[clientes] No se pudo cambiar estado de cliente', { id, activo, cause });
			return fail(500, {
				errors: { general: 'No se pudo cambiar el estado del cliente.' }
			});
		}

		redirect(303, '/clientes?statusChanged=1');
	}
};
