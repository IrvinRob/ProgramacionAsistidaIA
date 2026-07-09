import { prisma } from '$lib/server/prisma.js';

function emptyDashboard(error = null) {
	return {
		kpis: {
			totalFacturado: 0,
			totalCobrado: 0,
			carteraPendiente: 0,
			cotsActivas: 0
		},
		cotsPorEstado: [],
		ultimasCots: [],
		error
	};
}

export async function load() {
	const ahora = new Date();
	const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);

	try {
		const [cotizacionesMes, pagosMes, cotsPendientes, cotsActivas, ultimasCots, cotsPorEstado] =
			await Promise.all([
				prisma.cotizacion.findMany({
					where: { estado: { not: 'BORRADOR' }, creadoEn: { gte: inicioMes } }
				}),
				prisma.pago.findMany({ where: { fecha: { gte: inicioMes } } }),
				prisma.cotizacion.findMany({
					where: { estado: { in: ['APROBADA', 'FACTURADA'] } },
					include: { pagos: true, cliente: true }
				}),
				prisma.cotizacion.count({
					where: { estado: { in: ['ENVIADA', 'APROBADA', 'FACTURADA'] } }
				}),
				prisma.cotizacion.findMany({
					take: 5,
					orderBy: { creadoEn: 'desc' },
					include: { cliente: true }
				}),
				prisma.cotizacion.groupBy({
					by: ['estado'],
					_count: { estado: true }
				})
			]);

		const totalFacturado = cotizacionesMes.reduce(
			(sum, cotizacion) => sum + Number(cotizacion.total),
			0
		);
		const totalCobrado = pagosMes.reduce((sum, pago) => sum + Number(pago.monto), 0);
		const carteraPendiente = cotsPendientes.reduce((sum, cotizacion) => {
			const pagado = cotizacion.pagos.reduce((pagoSum, pago) => pagoSum + Number(pago.monto), 0);
			return sum + (Number(cotizacion.total) - pagado);
		}, 0);

		return {
			kpis: {
				totalFacturado,
				totalCobrado,
				carteraPendiente,
				cotsActivas
			},
			cotsPorEstado,
			ultimasCots,
			error: null
		};
	} catch (cause) {
		console.error('[dashboard] No se pudo cargar el resumen financiero', cause);
		return emptyDashboard('No se pudo cargar el resumen financiero.');
	}
}
