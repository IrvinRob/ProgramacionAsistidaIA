import { prisma } from '$lib/server/prisma.js';
import { requireUsuario } from '$lib/server/auth.js';
import { calcularSaldo } from '$lib/server/cotizaciones.js';

const ESTADOS = ['BORRADOR', 'ENVIADA', 'APROBADA', 'RECHAZADA', 'FACTURADA', 'PAGADA'];
const SORTS = new Set(['numero', 'cliente', 'estado', 'fecha', 'total', 'pendiente']);

function serializeCotizacion(cotizacion) {
	const saldo = cotizacion.estado === 'RECHAZADA' ? 0 : calcularSaldo(cotizacion);

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
		saldo,
		conceptos: cotizacion._count.conceptos,
		cliente: {
			id: cotizacion.cliente.id,
			nombre: cotizacion.cliente.nombre,
			empresa: cotizacion.cliente.empresa
		}
	};
}

function sortCotizaciones(cotizaciones, sort, dir) {
	const direction = dir === 'asc' ? 1 : -1;

	return [...cotizaciones].sort((a, b) => {
		const valueA = sortValue(a, sort);
		const valueB = sortValue(b, sort);

		if (typeof valueA === 'number' && typeof valueB === 'number') {
			return (valueA - valueB) * direction;
		}

		return String(valueA).localeCompare(String(valueB), 'es-MX', { numeric: true }) * direction;
	});
}

function sortValue(cotizacion, sort) {
	if (sort === 'cliente') return cotizacion.cliente.nombre;
	if (sort === 'fecha') return new Date(cotizacion.fecha).getTime();
	if (sort === 'total') return cotizacion.total;
	if (sort === 'pendiente') return cotizacion.saldo;
	return cotizacion[sort];
}

export async function load({ locals, url }) {
	requireUsuario(locals);

	const q = url.searchParams.get('q')?.trim() ?? '';
	const estado = url.searchParams.get('estado') ?? '';
	const sort = SORTS.has(url.searchParams.get('sort')) ? url.searchParams.get('sort') : 'fecha';
	const dir = url.searchParams.get('dir') === 'asc' ? 'asc' : 'desc';
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
	const serialized = cotizaciones.map(serializeCotizacion);
	const ordenadas = sortCotizaciones(serialized, sort, dir);

	return {
		cotizaciones: ordenadas.filter((cotizacion) => cotizacion.estado !== 'RECHAZADA'),
		cotizacionesRechazadas: ordenadas.filter((cotizacion) => cotizacion.estado === 'RECHAZADA'),
		q,
		estado,
		sort,
		dir,
		estados: ESTADOS
	};
}
