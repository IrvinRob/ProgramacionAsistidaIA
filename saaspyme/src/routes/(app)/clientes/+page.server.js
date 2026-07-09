import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { requireUsuario } from '$lib/server/auth.js';
import { clienteSchema, formErrors } from '$lib/server/validation.js';

const PAGE_SIZE = 20;

function cleanOptional(value) {
	return value === '' ? null : value;
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
	const where = {
		activo: true,
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

	const [clientes, total] = await Promise.all([
		prisma.cliente.findMany({
			where,
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
		prisma.cliente.count({ where })
	]);

	return {
		clientes: clientes.map(serializeCliente),
		q,
		page,
		total,
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

		return { ok: true };
	}
};
