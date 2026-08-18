import { visibleNavItems } from '$lib/shared/nav.js';
import { prisma } from '$lib/server/prisma.js';

const PAGE_HINTS = {
	'/dashboard': 'Panel principal con KPIs, gráficas de ventas e ingresos, y resumen de cartera.',
	'/clientes': 'Listado y gestión de clientes. Crear, editar y ver historial por cliente.',
	'/cotizaciones': 'Listado de cotizaciones con filtros por estado.',
	'/cotizaciones/nueva': 'Formulario para crear una nueva cotización con conceptos e IVA.',
	'/cobranza': 'Registro de pagos y seguimiento de cartera pendiente.',
	'/usuarios': 'Administración de usuarios del sistema (solo ADMIN).',
	'/engagement': 'Dashboard de engagement: emociones detectadas y ayudas proactivas del asistente.'
};

const ESTADOS_COT = {
	BORRADOR: 'Borrador (editable)',
	ENVIADA: 'Enviada al cliente',
	APROBADA: 'Aprobada por el cliente',
	RECHAZADA: 'Rechazada',
	FACTURADA: 'Facturada',
	PAGADA: 'Pagada completamente'
};

function describePage(pagePath) {
	if (!pagePath) return 'Página desconocida';

	const exact = PAGE_HINTS[pagePath];
	if (exact) return exact;

	if (pagePath.startsWith('/clientes/') && pagePath.includes('/historial')) {
		return 'Historial de cotizaciones y pagos de un cliente específico.';
	}
	if (pagePath.startsWith('/cotizaciones/') && pagePath.includes('/editar')) {
		return 'Edición de una cotización existente.';
	}
	if (pagePath.startsWith('/cotizaciones/')) {
		return 'Detalle o acción sobre una cotización específica.';
	}

	return 'Sección de la aplicación.';
}

/**
 * @param {{ usuario: { nombre: string, rol: string }, pagePath: string }} params
 */
export async function buildAppContext({ usuario, pagePath }) {
	const nav = visibleNavItems(usuario);
	const navLines = nav.map((item) => `- ${item.label}: ${item.href}`).join('\n');

	let statsBlock = '';
	try {
		const [clientesActivos, cotizacionesAbiertas, carteraPendiente] = await Promise.all([
			prisma.cliente.count({ where: { activo: true } }),
			prisma.cotizacion.count({
				where: { estado: { in: ['BORRADOR', 'ENVIADA', 'APROBADA', 'FACTURADA'] } }
			}),
			prisma.cotizacion.findMany({
				where: { estado: { in: ['APROBADA', 'FACTURADA'] } },
				select: { total: true, pagos: { select: { monto: true } } }
			})
		]);

		const pendiente = carteraPendiente.reduce((sum, cot) => {
			const pagado = cot.pagos.reduce((s, p) => s + Number(p.monto), 0);
			return sum + Math.max(0, Number(cot.total) - pagado);
		}, 0);

		const formatter = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' });

		statsBlock = `
Resumen del negocio (tiempo real):
- Clientes activos: ${clientesActivos}
- Cotizaciones abiertas: ${cotizacionesAbiertas}
- Cartera pendiente de cobro: ${formatter.format(pendiente)}`;
	} catch (cause) {
		console.warn('[assistant] No se pudo cargar resumen de negocio', cause);
	}

	const estadosBlock = Object.entries(ESTADOS_COT)
		.map(([key, desc]) => `- ${key}: ${desc}`)
		.join('\n');

	return `## Usuario actual
- Nombre: ${usuario.nombre}
- Rol: ${usuario.rol}

## Página actual
- Ruta: ${pagePath || '/'}
- Descripción: ${describePage(pagePath)}

## Secciones disponibles para este usuario
${navLines}

## Estados de cotización
${estadosBlock}
${statsBlock}

## Acciones comunes
- Crear cotización: /cotizaciones/nueva
- Ver clientes: /clientes
- Registrar pago: /cobranza
- Ver dashboard: /dashboard
- Ver engagement: /engagement`;
}
