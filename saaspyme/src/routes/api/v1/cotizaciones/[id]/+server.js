import { json } from '@sveltejs/kit';
import { authenticateApiRequest } from '$lib/server/apiAuth.js';
import { prisma } from '$lib/server/prisma.js';
import { calcularSaldo } from '$lib/server/cotizaciones.js';
import { toCalendarDate } from '$lib/dates.js';

function serializeCotizacion(cotizacion) {
	const pagado = cotizacion.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
	const saldo = cotizacion.estado === 'RECHAZADA' ? 0 : calcularSaldo(cotizacion);

	return {
		id: cotizacion.id,
		numero: cotizacion.numero,
		estado: cotizacion.estado,
		fecha: toCalendarDate(cotizacion.fecha),
		vencimiento: toCalendarDate(cotizacion.vencimiento),
		subtotal: Number(cotizacion.subtotal),
		iva: Number(cotizacion.iva),
		total: Number(cotizacion.total),
		notas: cotizacion.notas,
		pagado,
		saldo,
		cliente: {
			id: cotizacion.cliente.id,
			nombre: cotizacion.cliente.nombre,
			empresa: cotizacion.cliente.empresa,
			correo: cotizacion.cliente.correo
		},
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
		})),
		historial: cotizacion.historial.map((item) => ({
			id: item.id,
			estadoAnterior: item.estadoAnterior,
			estadoNuevo: item.estadoNuevo,
			nota: item.nota,
			creadoEn: item.creadoEn.toISOString()
		}))
	};
}

export async function GET(event) {
	const auth = await authenticateApiRequest(event);

	if (auth instanceof Response) {
		return auth;
	}

	const cotizacion = await prisma.cotizacion.findUnique({
		where: { id: event.params.id },
		include: {
			cliente: true,
			conceptos: { orderBy: { id: 'asc' } },
			pagos: { orderBy: [{ fecha: 'desc' }, { creadoEn: 'desc' }] },
			historial: { orderBy: { creadoEn: 'desc' } }
		}
	});

	if (!cotizacion) {
		return json({ ok: false, error: 'Cotizacion no encontrada' }, { status: 404 });
	}

	return json({ ok: true, cotizacion: serializeCotizacion(cotizacion) });
}
