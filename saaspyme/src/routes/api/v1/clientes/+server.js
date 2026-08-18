import { json } from '@sveltejs/kit';
import { authenticateApiRequest } from '$lib/server/apiAuth.js';
import { prisma } from '$lib/server/prisma.js';
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
	const totalCotizado = cliente.cotizaciones.reduce((sum, cotizacion) => {
		return sum + Number(cotizacion.total);
	}, 0);
	const totalFacturado = cliente.cotizaciones.reduce((sum, cotizacion) => {
		return cotizacion.estado === 'FACTURADA' ? sum + Number(cotizacion.total) : sum;
	}, 0);
	const totalCobrado = cliente.cotizaciones.reduce((sum, cotizacion) => {
		return sum + cotizacion.pagos.reduce((pagoSum, pago) => pagoSum + Number(pago.monto), 0);
	}, 0);
	const saldoPendiente = cliente.cotizaciones.reduce((sum, cotizacion) => {
		if (!['APROBADA', 'FACTURADA'].includes(cotizacion.estado)) return sum;

		const pagado = cotizacion.pagos.reduce((pagoSum, pago) => pagoSum + Number(pago.monto), 0);
		return sum + Math.max(Number(cotizacion.total) - pagado, 0);
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
		totalCotizado,
		totalFacturado,
		totalCobrado,
		saldoPendiente,
		cotizaciones: cliente._count.cotizaciones
	};
}

export async function GET(event) {
	const auth = await authenticateApiRequest(event);

	if (auth instanceof Response) {
		return auth;
	}

	const q = event.url.searchParams.get('q')?.trim() ?? '';
	const page = Math.max(Number(event.url.searchParams.get('page') ?? 1), 1);
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
						estado: true,
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
						estado: true,
						total: true,
						pagos: { select: { monto: true } }
					}
				}
			}
		}),
		prisma.cliente.count({ where: activosWhere }),
		prisma.cliente.count({ where: inactivosWhere })
	]);

	return json({
		ok: true,
		clientes: clientes.map(serializeCliente),
		clientesInactivos: clientesInactivos.map(serializeCliente),
		q,
		page,
		total,
		totalInactivos,
		pageSize: PAGE_SIZE,
		pages: Math.max(Math.ceil(total / PAGE_SIZE), 1)
	});
}

export async function POST(event) {
	const auth = await authenticateApiRequest(event);

	if (auth instanceof Response) {
		return auth;
	}

	const data = await event.request.json().catch(() => ({}));
	const parsed = clienteSchema.safeParse(data);

	if (!parsed.success) {
		return json({ ok: false, errors: formErrors(parsed) }, { status: 400 });
	}

	try {
		const cliente = await prisma.cliente.create({
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

		return json({ ok: true, cliente: { id: cliente.id } }, { status: 201 });
	} catch (cause) {
		if (cause?.code === 'P2002') {
			return json({ ok: false, errors: { rfc: 'Ya existe un cliente con este RFC' } }, { status: 400 });
		}

		console.error('[api/clientes] No se pudo crear cliente', cause);
		return json({ ok: false, error: 'No se pudo crear el cliente' }, { status: 500 });
	}
}
