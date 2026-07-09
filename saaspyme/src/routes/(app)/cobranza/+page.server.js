import { fail } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma.js';
import { requireUsuario } from '$lib/server/auth.js';
import { calcularSaldo, redondearMoneda } from '$lib/server/cotizaciones.js';
import { pagoSchema } from '$lib/server/validation.js';
import { sendEmail } from '$lib/server/email.js';
import { templateRecordatorioPago } from '$lib/server/emailTemplates.js';
import { nextHistorialId, nextPagoId } from '$lib/server/secuencias.js';

function daysSince(date) {
	const ms = Date.now() - date.getTime();
	return Math.max(Math.floor(ms / 86_400_000), 0);
}

function serializePendiente(cotizacion) {
	const pagado = cotizacion.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
	const pendiente = redondearMoneda(Number(cotizacion.total) - pagado);

	return {
		id: cotizacion.id,
		numero: cotizacion.numero,
		estado: cotizacion.estado,
		fecha: cotizacion.fecha.toISOString(),
		total: Number(cotizacion.total),
		pagado,
		pendiente,
		dias: daysSince(cotizacion.fecha),
		pagos: cotizacion.pagos.map((pago) => ({
			id: pago.id,
			fecha: pago.fecha.toISOString(),
			monto: Number(pago.monto),
			metodo: pago.metodo,
			referencia: pago.referencia
		})),
		cliente: {
			nombre: cotizacion.cliente.nombre,
			empresa: cotizacion.cliente.empresa,
			correo: cotizacion.cliente.correo
		}
	};
}

async function getPendientes() {
	const cotizaciones = await prisma.cotizacion.findMany({
		where: { estado: { in: ['APROBADA', 'FACTURADA'] } },
		orderBy: { fecha: 'asc' },
		include: { cliente: true, pagos: { orderBy: [{ fecha: 'desc' }, { creadoEn: 'desc' }] } }
	});

	return cotizaciones.map(serializePendiente).filter((cotizacion) => cotizacion.pendiente > 0);
}

export async function load({ locals }) {
	requireUsuario(locals);

	const pendientes = await getPendientes();

	return {
		pendientes,
		totalPendiente: pendientes.reduce((sum, cotizacion) => sum + cotizacion.pendiente, 0),
		totalVencido30: pendientes
			.filter((cotizacion) => cotizacion.dias > 30)
			.reduce((sum, cotizacion) => sum + cotizacion.pendiente, 0)
	};
}

export const actions = {
	pagar: async ({ request, locals }) => {
		const usuario = requireUsuario(locals);
		const data = Object.fromEntries(await request.formData());
		const parsed = pagoSchema.safeParse(data);

		if (!parsed.success) {
			return fail(400, { errors: { general: parsed.error.issues[0]?.message } });
		}

		const cotizacion = await prisma.cotizacion.findUnique({
			where: { id: String(data.cotizacionId ?? '') },
			include: { pagos: true }
		});

		if (!cotizacion || !['APROBADA', 'FACTURADA'].includes(cotizacion.estado)) {
			return fail(400, { errors: { general: 'La cotizacion no permite registrar pagos.' } });
		}

		const saldo = calcularSaldo(cotizacion);

		if (parsed.data.monto > saldo) {
			return fail(400, { errors: { general: 'El pago no puede superar el saldo pendiente.' } });
		}

		const nuevoSaldo = redondearMoneda(saldo - parsed.data.monto);

		await prisma.$transaction(async (tx) => {
			await tx.pago.create({
				data: {
					id: await nextPagoId(tx),
					cotizacionId: cotizacion.id,
					monto: parsed.data.monto,
					fecha: parsed.data.fecha,
					metodo: parsed.data.metodo,
					referencia: parsed.data.referencia || null
				}
			});

			if (nuevoSaldo === 0) {
				await tx.cotizacion.update({
					where: { id: cotizacion.id },
					data: {
						estado: 'PAGADA',
						historial: {
							create: {
								id: await nextHistorialId(tx),
								estadoAnterior: cotizacion.estado,
								estadoNuevo: 'PAGADA',
								nota: 'Saldo liquidado por registro de pago',
								clerkUserId: usuario.clerkUserId
							}
						}
					}
				});
			}
		});

		return { ok: true };
	},
	recordatorio: async ({ request, locals }) => {
		const usuario = requireUsuario(locals);
		const data = await request.formData();
		const cotizacionId = String(data.get('cotizacionId') ?? '');
		const cotizacion = await prisma.cotizacion.findUnique({
			where: { id: cotizacionId },
			include: { cliente: true, pagos: true }
		});

		if (!cotizacion || !['APROBADA', 'FACTURADA'].includes(cotizacion.estado)) {
			return fail(400, {
				errors: { general: 'No se puede enviar recordatorio para esta cotizacion.' }
			});
		}

		const saldoPendiente = calcularSaldo(cotizacion);

		if (saldoPendiente <= 0) {
			return fail(400, { errors: { general: 'La cotizacion no tiene saldo pendiente.' } });
		}

		const result = await sendEmail({
			to: cotizacion.cliente.correo,
			subject: `Recordatorio de pago ${cotizacion.numero}`,
			html: templateRecordatorioPago({
				cliente: cotizacion.cliente,
				cotizacion,
				saldoPendiente
			})
		});

		await prisma.recordatorioPago.create({
			data: {
				cotizacionId: cotizacion.id,
				correo: cotizacion.cliente.correo,
				clerkUserId: usuario.clerkUserId,
				resultado: result.ok ? `ENVIADO:${result.id ?? ''}` : `ERROR:${result.error}`
			}
		});

		if (!result.ok) {
			return fail(500, { errors: { general: `No se pudo enviar el correo: ${result.error}` } });
		}

		return { ok: true };
	}
};
