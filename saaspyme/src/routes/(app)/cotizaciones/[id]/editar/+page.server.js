import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma.js';
import { requireUsuario } from '$lib/server/auth.js';
import { calcularTotales } from '$lib/server/cotizaciones.js';
import { enviarCotizacionCliente } from '$lib/server/cotizacionWorkflow.js';
import { nextConceptoIds, nextHistorialId } from '$lib/server/secuencias.js';
import { conceptoSchema } from '$lib/server/validation.js';
import { calendarDateWithCurrentTime, toCalendarDate } from '$lib/dates.js';

const ESTADOS_EDITABLES = new Set(['BORRADOR', 'ENVIADA']);

const cotizacionSchema = z.object({
	clienteId: z.string().min(1, 'Selecciona un cliente'),
	fecha: z.coerce.date(),
	vencimiento: z.string().trim().optional(),
	notas: z.string().trim().max(1000).optional().or(z.literal('')),
	conceptos: z.array(conceptoSchema).min(1, 'Agrega al menos un concepto')
});

function cleanOptional(value) {
	return value === '' ? null : value;
}

function formatDateInput(value) {
	return toCalendarDate(value);
}

function parseConceptos(formData) {
	const descripciones = formData.getAll('descripcion');
	const cantidades = formData.getAll('cantidad');
	const precios = formData.getAll('precioUnitario');

	return descripciones
		.map((descripcion, index) => ({
			descripcion,
			cantidad: cantidades[index],
			precioUnitario: precios[index]
		}))
		.filter((concepto) => concepto.descripcion);
}

function valuesFromForm(formData) {
	return {
		clienteId: formData.get('clienteId') ?? '',
		fecha: formData.get('fecha') ?? '',
		vencimiento: formData.get('vencimiento') ?? '',
		notas: formData.get('notas') ?? '',
		conceptos: parseConceptos(formData)
	};
}

function serializeCotizacion(cotizacion) {
	return {
		id: cotizacion.id,
		numero: cotizacion.numero,
		estado: cotizacion.estado,
		clienteId: cotizacion.clienteId,
		fecha: formatDateInput(cotizacion.fecha),
		vencimiento: formatDateInput(cotizacion.vencimiento),
		notas: cotizacion.notas ?? '',
		conceptos: cotizacion.conceptos.map((concepto) => ({
			descripcion: concepto.descripcion,
			cantidad: Number(concepto.cantidad),
			precioUnitario: Number(concepto.precioUnitario)
		}))
	};
}

async function conceptosCatalogo() {
	const conceptosGuardados = await prisma.concepto.findMany({
		orderBy: { id: 'desc' },
		select: { descripcion: true, precioUnitario: true }
	});
	const conceptosMap = new Map();

	for (const concepto of conceptosGuardados) {
		if (!conceptosMap.has(concepto.descripcion)) {
			conceptosMap.set(concepto.descripcion, {
				descripcion: concepto.descripcion,
				precioUnitario: Number(concepto.precioUnitario)
			});
		}
	}

	return [...conceptosMap.values()];
}

export async function load({ locals, params }) {
	requireUsuario(locals);

	const cotizacion = await prisma.cotizacion.findUnique({
		where: { id: params.id },
		include: {
			conceptos: { orderBy: { id: 'asc' } },
			cliente: true
		}
	});

	if (!cotizacion) {
		redirect(303, '/cotizaciones');
	}

	if (!ESTADOS_EDITABLES.has(cotizacion.estado)) {
		redirect(303, '/cotizaciones');
	}

	const [clientes, conceptosGuardados] = await Promise.all([
		prisma.cliente.findMany({
			where: { OR: [{ activo: true }, { id: cotizacion.clienteId }] },
			orderBy: [{ nombre: 'asc' }],
			select: { id: true, nombre: true, empresa: true, correo: true, activo: true }
		}),
		conceptosCatalogo()
	]);

	return {
		cotizacion: serializeCotizacion(cotizacion),
		clientes,
		conceptosGuardados
	};
}

export const actions = {
	guardar: async ({ request, locals, params }) => {
		const usuario = requireUsuario(locals);
		const formData = await request.formData();
		const values = valuesFromForm(formData);
		const parsed = cotizacionSchema.safeParse(values);

		if (!parsed.success) {
			return fail(400, {
				values,
				errors: {
					general: parsed.error.issues[0]?.message ?? 'Revisa los datos de la cotizacion.'
				}
			});
		}

		const actual = await prisma.cotizacion.findUnique({
			where: { id: params.id },
			include: { cliente: true, conceptos: true }
		});

		if (!actual) {
			return fail(404, {
				values,
				errors: { general: 'La cotizacion no existe.' }
			});
		}

		if (!ESTADOS_EDITABLES.has(actual.estado)) {
			return fail(400, {
				values,
				errors: {
					general:
						'Solo se pueden editar cotizaciones en borrador o enviadas. Las aprobadas, facturadas y pagadas estan bloqueadas.'
				}
			});
		}

		const cliente = await prisma.cliente.findUnique({
			where: { id: parsed.data.clienteId },
			select: { id: true, nombre: true, empresa: true, correo: true, activo: true }
		});

		if (!cliente?.activo) {
			return fail(400, {
				values,
				errors: { clienteId: 'El cliente no existe o esta inactivo.' }
			});
		}

		const conceptos = parsed.data.conceptos.map((concepto) => ({
			descripcion: concepto.descripcion,
			cantidad: concepto.cantidad,
			precioUnitario: concepto.precioUnitario,
			subtotal: Number(concepto.cantidad) * Number(concepto.precioUnitario)
		}));
		const totales = calcularTotales(conceptos);
		const fecha = calendarDateWithCurrentTime(parsed.data.fecha);
		const vencimiento = parsed.data.vencimiento ? new Date(parsed.data.vencimiento) : null;
		let cotizacionEditada;

		try {
			cotizacionEditada = await prisma.$transaction(async (tx) => {
				const conceptoIds = await nextConceptoIds(tx, conceptos.length);

				await tx.concepto.deleteMany({ where: { cotizacionId: actual.id } });

				const editada = await tx.cotizacion.update({
					where: { id: actual.id },
					data: {
						clienteId: parsed.data.clienteId,
						estado: 'ENVIADA',
						fecha,
						vencimiento,
						subtotal: totales.subtotal,
						iva: totales.iva,
						total: totales.total,
						notas: cleanOptional(parsed.data.notas),
						conceptos: {
							create: conceptos.map((concepto, index) => ({
								id: conceptoIds[index],
								...concepto
							}))
						}
					},
					include: { cliente: true, conceptos: true }
				});

				await tx.historialCot.create({
					data: {
						id: await nextHistorialId(tx),
						cotizacionId: actual.id,
						estadoAnterior: actual.estado,
						estadoNuevo: 'ENVIADA',
						nota:
							actual.estado === 'BORRADOR'
								? 'Cotizacion editada y enviada al cliente.'
								: 'Cotizacion editada y reenviada al cliente.',
						clerkUserId: usuario.clerkUserId
					}
				});

				return editada;
			});
		} catch (cause) {
			console.error('[cotizaciones] No se pudo editar cotizacion', {
				cotizacionId: params.id,
				cause
			});
			return fail(500, {
				values,
				errors: { general: 'No se pudo actualizar la cotizacion.' }
			});
		}

		const result = await enviarCotizacionCliente({
			cotizacion: cotizacionEditada,
			cliente,
			conceptos: cotizacionEditada.conceptos
		});

		if (!result.ok) {
			console.error('[cotizaciones] No se pudo reenviar cotizacion editada', {
				cotizacionId: cotizacionEditada.id,
				error: result.error
			});
			redirect(303, `/cotizaciones?editada=${cotizacionEditada.id}&emailError=1`);
		}

		redirect(303, `/cotizaciones?editada=${cotizacionEditada.id}`);
	}
};
