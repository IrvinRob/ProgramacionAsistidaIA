import { prisma } from '$lib/server/prisma.js';

const ESTADOS_VENTA = ['APROBADA', 'FACTURADA', 'PAGADA'];

function emptyDashboard(error = null) {
	return {
		kpis: {
			totalVentas: 0,
			totalFacturadoMes: 0,
			totalCobrado: 0,
			carteraPendiente: 0
		},
		cotsPorEstado: [],
		ingresosPorMes: [],
		ultimasCots: [],
		topClientesPendiente: [],
		error
	};
}

function serializeCotizacion(cotizacion) {
	return {
		id: cotizacion.id,
		numero: cotizacion.numero,
		estado: cotizacion.estado,
		total: Number(cotizacion.total),
		cliente: {
			id: cotizacion.cliente.id,
			nombre: cotizacion.cliente.nombre
		}
	};
}

function serializeEstado(item) {
	return {
		estado: item.estado,
		_count: {
			estado: item._count.estado
		}
	};
}

export async function load() {
	const ahora = new Date();
	const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
	const inicioGrafica = new Date(ahora.getFullYear(), ahora.getMonth() - 5, 1);

	try {
		const [
			cotizacionesMes,
			cotizacionesGrafica,
			pagosMes,
			pagosGrafica,
			cotsPendientes,
			ultimasCots,
			cotsPorEstado,
			clientesConCartera
		] = await Promise.all([
			prisma.cotizacion.findMany({
				where: { estado: { in: ESTADOS_VENTA }, creadoEn: { gte: inicioMes } }
			}),
			prisma.cotizacion.findMany({
				where: { estado: { in: ESTADOS_VENTA }, fecha: { gte: inicioGrafica } },
				select: { total: true, fecha: true }
			}),
			prisma.pago.findMany({ where: { fecha: { gte: inicioMes } } }),
			prisma.pago.findMany({
				where: { fecha: { gte: inicioGrafica } },
				select: { monto: true, fecha: true }
			}),
			prisma.cotizacion.findMany({
				where: { estado: { in: ['APROBADA', 'FACTURADA'] } },
				include: { pagos: true, cliente: true }
			}),
			prisma.cotizacion.findMany({
				take: 5,
				orderBy: { creadoEn: 'desc' },
				include: { cliente: true }
			}),
			prisma.cotizacion.groupBy({
				by: ['estado'],
				_count: { estado: true }
			}),
			prisma.cliente.findMany({
				where: {
					activo: true,
					cotizaciones: { some: { estado: { in: ['APROBADA', 'FACTURADA'] } } }
				},
				include: {
					cotizaciones: {
						where: { estado: { in: ['APROBADA', 'FACTURADA'] } },
						select: { total: true, pagos: { select: { monto: true } } }
					}
				}
			})
		]);

		const totalVentas = cotizacionesMes.reduce(
			(sum, cotizacion) => sum + Number(cotizacion.total),
			0
		);
		const totalFacturadoMes = cotizacionesMes.reduce((sum, cotizacion) => {
			return cotizacion.estado === 'FACTURADA' ? sum + Number(cotizacion.total) : sum;
		}, 0);
		const totalCobrado = pagosMes.reduce((sum, pago) => sum + Number(pago.monto), 0);
		const carteraPendiente = cotsPendientes.reduce((sum, cotizacion) => {
			const pagado = cotizacion.pagos.reduce((pagoSum, pago) => pagoSum + Number(pago.monto), 0);
			return sum + (Number(cotizacion.total) - pagado);
		}, 0);
		const meses = Array.from({ length: 6 }, (_, index) => {
			const fecha = new Date(ahora.getFullYear(), ahora.getMonth() - (5 - index), 1);
			return {
				key: `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`,
				label: new Intl.DateTimeFormat('es-MX', { month: 'short' }).format(fecha),
				ventas: 0,
				total: 0
			};
		});
		cotizacionesGrafica.reduce((items, cotizacion) => {
			const fecha = new Date(cotizacion.fecha);
			const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
			const item = items.find((mes) => mes.key === key);
			if (item) item.ventas += Number(cotizacion.total);
			return items;
		}, meses);
		const ingresosPorMes = pagosGrafica.reduce((items, pago) => {
			const fecha = new Date(pago.fecha);
			const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
			const item = items.find((mes) => mes.key === key);
			if (item) item.total += Number(pago.monto);
			return items;
		}, meses);
		const topClientesPendiente = clientesConCartera
			.map((cliente) => {
				const pendiente = cliente.cotizaciones.reduce((sum, cotizacion) => {
					const pagado = cotizacion.pagos.reduce(
						(pagoSum, pago) => pagoSum + Number(pago.monto),
						0
					);
					return sum + Number(cotizacion.total) - pagado;
				}, 0);

				return {
					id: cliente.id,
					nombre: cliente.nombre,
					empresa: cliente.empresa,
					pendiente
				};
			})
			.filter((cliente) => cliente.pendiente > 0)
			.sort((a, b) => b.pendiente - a.pendiente)
			.slice(0, 3);

		return {
			kpis: {
				totalVentas,
				totalFacturadoMes,
				totalCobrado,
				carteraPendiente
			},
			cotsPorEstado: cotsPorEstado.map(serializeEstado),
			ingresosPorMes,
			ultimasCots: ultimasCots.map(serializeCotizacion),
			topClientesPendiente,
			error: null
		};
	} catch (cause) {
		console.error('[dashboard] No se pudo cargar el resumen financiero', cause);
		return emptyDashboard('No se pudo cargar el resumen financiero.');
	}
}
