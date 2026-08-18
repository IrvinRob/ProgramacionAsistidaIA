import { json } from '@sveltejs/kit';
import { authenticateApiRequest } from '$lib/server/apiAuth.js';
import { prisma } from '$lib/server/prisma.js';
import { clienteSchema, formErrors } from '$lib/server/validation.js';
import { toCalendarDate } from '$lib/dates.js';

function cleanOptional(value) {
	return value === '' ? null : value;
}

function serializeCotizacion(cotizacion) {
	const pagado = cotizacion.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
	const pendiente = ['APROBADA', 'FACTURADA'].includes(cotizacion.estado)
		? Math.max(Number(cotizacion.total) - pagado, 0)
		: 0;

	return {
		id: cotizacion.id,
		numero: cotizacion.numero,
		estado: cotizacion.estado,
		fecha: toCalendarDate(cotizacion.fecha),
		vencimiento: toCalendarDate(cotizacion.vencimiento),
		subtotal: Number(cotizacion.subtotal),
		iva: Number(cotizacion.iva),
		total: Number(cotizacion.total),
		pagado,
		pendiente,
		conceptos: cotizacion.conceptos.map((concepto) => ({
			id: concepto.id,
			descripcion: concepto.descripcion,
			cantidad: Number(concepto.cantidad),
			precioUnitario: Number(concepto.precioUnitario),
			subtotal: Number(concepto.subtotal)
		})),
		pagos: cotizacion.pagos.map((pago) => ({
			id: pago.id,
			fecha: toCalendarDate(pago.fecha),
			monto: Number(pago.monto),
			metodo: pago.metodo,
			referencia: pago.referencia
		}))
	};
}

export async function GET(event) {
	const auth = await authenticateApiRequest(event);

	if (auth instanceof Response) {
		return auth;
	}

	const cliente = await prisma.cliente.findUnique({
		where: { id: event.params.id },
		include: {
			cotizaciones: {
				orderBy: { fecha: 'desc' },
				include: {
					conceptos: { orderBy: { id: 'asc' } },
					pagos: { orderBy: [{ fecha: 'desc' }, { creadoEn: 'desc' }] }
				}
			}
		}
	});

	if (!cliente) {
		return json({ ok: false, error: 'Cliente no encontrado' }, { status: 404 });
	}

	const cotizaciones = cliente.cotizaciones.map(serializeCotizacion);
	const totalCotizado = cotizaciones.reduce((sum, cotizacion) => sum + cotizacion.total, 0);
	const totalPagado = cotizaciones.reduce((sum, cotizacion) => sum + cotizacion.pagado, 0);
	const totalPendiente = cotizaciones.reduce((sum, cotizacion) => sum + cotizacion.pendiente, 0);

	return json({
		ok: true,
		cliente: {
			id: cliente.id,
			nombre: cliente.nombre,
			empresa: cliente.empresa,
			rfc: cliente.rfc,
			correo: cliente.correo,
			telefono: cliente.telefono,
			direccion: cliente.direccion,
			notas: cliente.notas,
			activo: cliente.activo
		},
		cotizaciones,
		resumen: {
			totalCotizado,
			totalPagado,
			totalPendiente,
			totalCotizaciones: cotizaciones.length,
			totalPagos: cotizaciones.reduce((sum, cotizacion) => sum + cotizacion.pagos.length, 0)
		}
	});
}

export async function PUT(event) {
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
		await prisma.cliente.update({
			where: { id: event.params.id },
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

		return json({ ok: true });
	} catch (cause) {
		if (cause?.code === 'P2002') {
			return json({ ok: false, errors: { rfc: 'Ya existe otro cliente con este RFC' } }, { status: 400 });
		}

		if (cause?.code === 'P2025') {
			return json({ ok: false, error: 'Cliente no encontrado' }, { status: 404 });
		}

		console.error('[api/clientes] No se pudo editar cliente', cause);
		return json({ ok: false, error: 'No se pudo actualizar el cliente' }, { status: 500 });
	}
}

export async function PATCH(event) {
	const auth = await authenticateApiRequest(event);

	if (auth instanceof Response) {
		return auth;
	}

	const data = await event.request.json().catch(() => ({}));
	const activo = Boolean(data.activo);

	try {
		if (!activo) {
			const cotizacionesAbiertas = await prisma.cotizacion.count({
				where: {
					clienteId: event.params.id,
					estado: { in: ['APROBADA', 'FACTURADA'] }
				}
			});

			if (cotizacionesAbiertas > 0) {
				return json(
					{
						ok: false,
						error:
							'No se puede desactivar este cliente porque tiene cotizaciones aprobadas o facturadas.'
					},
					{ status: 400 }
				);
			}
		}

		await prisma.cliente.update({
			where: { id: event.params.id },
			data: { activo }
		});

		return json({ ok: true });
	} catch (cause) {
		if (cause?.code === 'P2025') {
			return json({ ok: false, error: 'Cliente no encontrado' }, { status: 404 });
		}

		console.error('[api/clientes] No se pudo cambiar estado', cause);
		return json({ ok: false, error: 'No se pudo cambiar el estado del cliente' }, { status: 500 });
	}
}
