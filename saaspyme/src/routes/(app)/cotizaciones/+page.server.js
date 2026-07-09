import { prisma } from '$lib/server/prisma.js';
import { requireUsuario } from '$lib/server/auth.js';
import { calcularSaldo } from '$lib/server/cotizaciones.js';

const ESTADOS = ['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'FACTURADA', 'PAGADA'];

function serializeCotizacion(cotizacion) {
	return {
		id: cotizacion.id,
		numero: cotizacion.numero,
		estado: cotizacion.estado,
		fecha: cotizacion.fecha.toISOString(),
		vencimiento: cotizacion.vencimiento?.toISOString() ?? null,
		subtotal: Number(cotizacion.subtotal),
		iva: Number(cotizacion.iva),
		total: Number(cotizacion.total),
		pagado: cotizacion.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0),
		saldo: calcularSaldo(cotizacion),
		conceptos: cotizacion._count.conceptos,
		cliente: {
			id: cotizacion.cliente.id,
			nombre: cotizacion.cliente.nombre,
			empresa: cotizacion.cliente.empresa
		}
	};
}

export async function load({ locals, url }) {
	requireUsuario(locals);

	const q = url.searchParams.get('q')?.trim() ?? '';
	const estado = url.searchParams.get('estado') ?? '';
	const where = {
		...(estado && ESTADOS.includes(estado) ? { estado } : {}),
		...(q
			? {
					OR: [
						{ numero: { contains: q, mode: 'insensitive' } },
						{ cliente: { nombre: { contains: q, mode: 'insensitive' } } },
						{ cliente: { empresa: { contains: q, mode: 'insensitive' } } }
					]
				}
			: {})
	};

	const cotizaciones = await prisma.cotizacion.findMany({
		where,
		orderBy: { creadoEn: 'desc' },
		take: 80,
		include: {
			cliente: true,
			pagos: true,
			_count: { select: { conceptos: true } }
		}
	});

	return {
		cotizaciones: cotizaciones.map(serializeCotizacion),
		q,
		estado,
		estados: ESTADOS
	};
}
