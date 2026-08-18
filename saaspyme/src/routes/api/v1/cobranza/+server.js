import { json } from '@sveltejs/kit';
import { authenticateApiRequest } from '$lib/server/apiAuth.js';
import { prisma } from '$lib/server/prisma.js';
import { calcularSaldo, redondearMoneda } from '$lib/server/cotizaciones.js';
import { pagoSchema } from '$lib/server/validation.js';
import { sendEmail } from '$lib/server/email.js';
import { templateRecordatorioPago } from '$lib/server/emailTemplates.js';
import { nextHistorialId, nextPagoId } from '$lib/server/secuencias.js';
import { calendarDateWithCurrentTime, toCalendarDate } from '$lib/dates.js';

function daysSince(date) {
	const ms = Date.now() - date.getTime();
	return Math.max(Math.floor(ms / 86_400_000), 0);
}

function todayRange() {
	const start = new Date();
	start.setHours(0, 0, 0, 0);

	const end = new Date(start);
	end.setDate(end.getDate() + 1);

	return { start, end };
}

function serializePendiente(cotizacion) {
	const pagado = cotizacion.pagos.reduce((sum, pago) => sum + Number(pago.monto), 0);
	const pendiente = redondearMoneda(Number(cotizacion.total) - pagado);

	return {
		id: cotizacion.id,
		numero: cotizacion.numero,
		estado: cotizacion.estado,
		fecha: toCalendarDate(cotizacion.fecha),
		total: Number(cotizacion.total),
		pagado,
		pendiente,
		dias: daysSince(cotizacion.fecha),
		pagos: cotizacion.pagos.map((pago) => ({
			id: pago.id,
			fecha: toCalendarDate(pago.fecha),
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

export async function GET(event) {
	const auth = await authenticateApiRequest(event);

	if (auth instanceof Response) {
		return auth;
	}

	const pendientes = await getPendientes();

	return json({
		ok: true,
		pendientes,
		totalPendiente: pendientes.reduce((sum, cotizacion) => sum + cotizacion.pendiente, 0),
		totalVencido30: pendientes
			.filter((cotizacion) => cotizacion.dias > 30)
			.reduce((sum, cotizacion) => sum + cotizacion.pendiente, 0)
	});
}

export async function POST(event) {
	const auth = await authenticateApiRequest(event);

	if (auth instanceof Response) {
		return auth;
	}

	const body = await event.request.json().catch(() => ({}));
	const action = body.action;

	if (action === 'pagar') {
		const parsed = pagoSchema.safeParse(body);

		if (!parsed.success) {
			return json({ ok: false, error: parsed.error.issues[0]?.message }, { status: 400 });
		}

		const cotizacion = await prisma.cotizacion.findUnique({
			where: { id: String(body.cotizacionId ?? '') },
			include: { pagos: true }
		});

		if (!cotizacion || !['APROBADA', 'FACTURADA'].includes(cotizacion.estado)) {
			return json({ ok: false, error: 'La cotizacion no permite registrar pagos.' }, { status: 400 });
		}

		const saldo = calcularSaldo(cotizacion);

		if (parsed.data.monto > saldo) {
			return json({ ok: false, error: 'El pago no puede superar el saldo pendiente.' }, { status: 400 });
		}

		const nuevoSaldo = redondearMoneda(saldo - parsed.data.monto);
		const fechaPago = calendarDateWithCurrentTime(parsed.data.fecha);

		await prisma.$transaction(async (tx) => {
			await tx.pago.create({
				data: {
					id: await nextPagoId(tx),
					cotizacionId: cotizacion.id,
					monto: parsed.data.monto,
					fecha: fechaPago,
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
								clerkUserId: auth.clerkUserId
							}
						}
					}
				});
			}
		});

		return json({ ok: true });
	}

	if (action === 'recordatorio') {
		const cotizacionId = String(body.cotizacionId ?? '');
		const cotizacion = await prisma.cotizacion.findUnique({
			where: { id: cotizacionId },
			include: { cliente: true, pagos: true }
		});

		if (!cotizacion || !['APROBADA', 'FACTURADA'].includes(cotizacion.estado)) {
			return json(
				{ ok: false, error: 'No se puede enviar recordatorio para esta cotizacion.' },
				{ status: 400 }
			);
		}

		const saldoPendiente = calcularSaldo(cotizacion);

		if (saldoPendiente <= 0) {
			return json({ ok: false, error: 'La cotizacion no tiene saldo pendiente.' }, { status: 400 });
		}

		const { start, end } = todayRange();
		const recordatorioHoy = await prisma.recordatorioPago.findFirst({
			where: {
				cotizacionId: cotizacion.id,
				enviadoEn: { gte: start, lt: end },
				resultado: { startsWith: 'ENVIADO:' }
			},
			select: { id: true }
		});

		if (recordatorioHoy) {
			return json({ ok: false, error: 'Ya se envió recordatorio hoy' }, { status: 400 });
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
				clerkUserId: auth.clerkUserId,
				resultado: result.ok ? `ENVIADO:${result.id ?? ''}` : `ERROR:${result.error}`
			}
		});

		if (!result.ok) {
			return json({ ok: false, error: `No se pudo enviar el correo: ${result.error}` }, { status: 500 });
		}

		return json({ ok: true, recordatorio: { cotizacionId: cotizacion.id, status: 'sent' } });
	}

	return json({ ok: false, error: 'Accion no reconocida' }, { status: 400 });
}
