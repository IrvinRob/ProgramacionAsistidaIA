import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '$lib/server/prisma.js';
import { requireUsuario } from '$lib/server/auth.js';
import { calcularTotales } from '$lib/server/cotizaciones.js';
import { conceptoSchema } from '$lib/server/validation.js';
import { enviarCotizacionCliente } from '$lib/server/cotizacionWorkflow.js';

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

async function generarNumeroCotizacion(tx, fecha = new Date()) {
	const year = fecha.getFullYear();
	const prefix = `COT-${year}-`;
	const ultima = await tx.cotizacion.findFirst({
		where: { numero: { startsWith: prefix } },
		orderBy: { numero: 'desc' },
		select: { numero: true }
	});
	const lastNumber = Number(ultima?.numero?.slice(prefix.length) ?? 0);
	return `${prefix}${String(lastNumber + 1).padStart(4, '0')}`;
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
		.filter((concepto) => {
			return concepto.descripcion || concepto.cantidad || concepto.precioUnitario;
		});
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

export async function load({ locals }) {
	requireUsuario(locals);

	const [clientes, conceptosGuardados] = await Promise.all([
		prisma.cliente.findMany({
			where: { activo: true },
			orderBy: [{ nombre: 'asc' }],
			select: { id: true, nombre: true, empresa: true, correo: true }
		}),
		prisma.concepto.findMany({
			orderBy: { id: 'desc' },
			select: { descripcion: true, precioUnitario: true }
		})
	]);
	const conceptosMap = new Map();

	for (const concepto of conceptosGuardados) {
		if (!conceptosMap.has(concepto.descripcion)) {
			conceptosMap.set(concepto.descripcion, {
				descripcion: concepto.descripcion,
				precioUnitario: Number(concepto.precioUnitario)
			});
		}
	}

	return { clientes, conceptosGuardados: [...conceptosMap.values()] };
}

export const actions = {
	crear: async ({ request, locals }) => {
		const usuario = requireUsuario(locals);
		const formData = await request.formData();
		const values = valuesFromForm(formData);
		const intent = String(formData.get('intent') ?? 'enviar');
		const estadoInicial = intent === 'borrador' ? 'BORRADOR' : 'ENVIADA';
		const parsed = cotizacionSchema.safeParse(values);

		if (!parsed.success) {
			return fail(400, {
				values,
				errors: {
					general: parsed.error.issues[0]?.message ?? 'Revisa los datos de la cotizacion.'
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
		const fecha = parsed.data.fecha;
		const vencimiento = parsed.data.vencimiento ? new Date(parsed.data.vencimiento) : null;
		let cotizacionCreada;

		try {
			const cotizacion = await prisma.$transaction(async (tx) => {
				const numero = await generarNumeroCotizacion(tx, fecha);
				const creada = await tx.cotizacion.create({
					data: {
						numero,
						clienteId: parsed.data.clienteId,
						estado: estadoInicial,
						fecha,
						vencimiento,
						subtotal: totales.subtotal,
						iva: totales.iva,
						total: totales.total,
						notas: cleanOptional(parsed.data.notas),
						conceptos: { create: conceptos },
						historial: {
							create: {
								estadoAnterior: null,
								estadoNuevo: 'BORRADOR',
								nota: 'Cotizacion creada',
								clerkUserId: usuario.clerkUserId
							}
						}
					},
					include: { cliente: true, conceptos: true }
				});

				if (estadoInicial === 'ENVIADA') {
					await tx.historialCot.create({
						data: {
							cotizacionId: creada.id,
							estadoAnterior: 'BORRADOR',
							estadoNuevo: 'ENVIADA',
							nota: 'Cotizacion enviada al cliente.',
							clerkUserId: usuario.clerkUserId
						}
					});
				}

				return creada;
			});
			cotizacionCreada = cotizacion;
		} catch (cause) {
			console.error('[cotizaciones] No se pudo crear cotizacion', cause);
			return fail(500, {
				values,
				errors: { general: 'No se pudo crear la cotizacion.' }
			});
		}

		if (estadoInicial === 'ENVIADA') {
			const result = await enviarCotizacionCliente({
				cotizacion: cotizacionCreada,
				cliente,
				conceptos: cotizacionCreada.conceptos
			});

			if (!result.ok) {
				console.error('[cotizaciones] No se pudo enviar cotizacion automatica', {
					cotizacionId: cotizacionCreada.id,
					error: result.error
				});
				redirect(303, `/cotizaciones?creada=${cotizacionCreada.id}&emailError=1`);
			}
		}

		redirect(303, `/cotizaciones?creada=${cotizacionCreada.id}`);
	}
};
