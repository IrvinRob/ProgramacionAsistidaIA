import { error } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { requireUsuario } from '$lib/server/auth.js';
import { toCalendarDate } from '$lib/dates.js';

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

export async function load({ locals, params }) {
	requireUsuario(locals);

	const cliente = await prisma.cliente.findUnique({
		where: { id: params.id },
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
		error(404, 'Cliente no encontrado.');
	}

	const cotizaciones = cliente.cotizaciones.map(serializeCotizacion);
	const totalCotizado = cotizaciones.reduce((sum, cotizacion) => sum + cotizacion.total, 0);
	const totalPagado = cotizaciones.reduce((sum, cotizacion) => sum + cotizacion.pagado, 0);
	const totalPendiente = cotizaciones.reduce((sum, cotizacion) => sum + cotizacion.pendiente, 0);

	return {
		cliente: {
			id: cliente.id,
			nombre: cliente.nombre,
			empresa: cliente.empresa,
			rfc: cliente.rfc,
			correo: cliente.correo,
			telefono: cliente.telefono,
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
	};
}
