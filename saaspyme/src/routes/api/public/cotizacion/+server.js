import { prisma } from '$lib/server/prisma.js';
import { verifyCotizacionToken } from '$lib/server/cotizacionTokens.js';
import { enviarFacturaCliente } from '$lib/server/cotizacionWorkflow.js';
import { calcularSaldo } from '$lib/server/cotizaciones.js';
import { nextHistorialId, nextPagoId } from '$lib/server/secuencias.js';
import { currentDateTimeInDefaultTimeZone } from '$lib/dates.js';

function htmlResponse(title, message) {
	return new Response(
		`<!doctype html>
<html lang="es">
	<head>
		<meta charset="utf-8" />
		<meta name="viewport" content="width=device-width, initial-scale=1" />
		<title>${title} | GestorPyme</title>
		<style>
			body { font-family: Arial, sans-serif; background: #f8fafc; color: #0f172a; margin: 0; padding: 40px; }
			main { max-width: 560px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 32px; }
			h1 { margin: 0 0 12px; font-size: 24px; }
			p { color: #475569; line-height: 1.5; }
		</style>
	</head>
	<body>
		<main>
			<h1>${title}</h1>
			<p>${message}</p>
		</main>
	</body>
</html>`,
		{ headers: { 'content-type': 'text/html; charset=utf-8' } }
	);
}

export async function GET({ url }) {
	const verified = verifyCotizacionToken(url.searchParams.get('token'));

	if (!verified) {
		return htmlResponse('Liga invalida', 'La liga no es valida o fue modificada.');
	}

	const cotizacion = await prisma.cotizacion.findUnique({
		where: { id: verified.cotizacionId },
		include: {
			cliente: true,
			conceptos: true,
			pagos: true,
			historial: { where: { estadoNuevo: 'APROBADA' }, select: { id: true }, take: 1 }
		}
	});

	if (!cotizacion) {
		return htmlResponse('Cotizacion no encontrada', 'No encontramos la cotizacion solicitada.');
	}

	if (verified.action === 'rechazar') {
		const yaFueAprobada =
			['APROBADA', 'FACTURADA', 'PAGADA'].includes(cotizacion.estado) ||
			cotizacion.historial.length > 0;

		if (yaFueAprobada) {
			return htmlResponse(
				'Cotizacion ya aprobada',
				'La cotización ya ha sido aprobada anteriormente, en caso de necesitar cancelación, póngase en contacto con nosotros.'
			);
		}

		if (cotizacion.estado === 'RECHAZADA') {
			return htmlResponse('Cotizacion ya rechazada', 'Esta cotizacion ya habia sido rechazada.');
		}

		await prisma.cotizacion.update({
			where: { id: cotizacion.id },
			data: {
				estado: 'RECHAZADA',
				historial: {
					create: {
						id: await nextHistorialId(prisma),
						estadoAnterior: cotizacion.estado,
						estadoNuevo: 'RECHAZADA',
						nota: 'Cliente rechazo desde correo.'
					}
				}
			}
		});

		return htmlResponse('Cotizacion rechazada', 'Registramos la respuesta. Gracias.');
	}

	if (verified.action === 'aprobar') {
		if (['FACTURADA', 'PAGADA'].includes(cotizacion.estado)) {
			return htmlResponse('Cotizacion ya aprobada', 'Esta cotizacion ya fue aprobada y facturada.');
		}

		if (cotizacion.estado === 'RECHAZADA') {
			return htmlResponse('Cotizacion rechazada', 'Esta cotizacion ya fue rechazada.');
		}

		const actualizada = await prisma.$transaction(async (tx) => {
			await tx.historialCot.create({
				data: {
					id: await nextHistorialId(tx),
					cotizacionId: cotizacion.id,
					estadoAnterior: cotizacion.estado,
					estadoNuevo: 'APROBADA',
					nota: 'Cliente aprobo desde correo.'
				}
			});
			await tx.historialCot.create({
				data: {
					id: await nextHistorialId(tx),
					cotizacionId: cotizacion.id,
					estadoAnterior: 'APROBADA',
					estadoNuevo: 'FACTURADA',
					nota: 'Factura generada automaticamente.'
				}
			});

			return tx.cotizacion.update({
				where: { id: cotizacion.id },
				data: { estado: 'FACTURADA' },
				include: { cliente: true, conceptos: true }
			});
		});

		const result = await enviarFacturaCliente({
			cotizacion: actualizada,
			cliente: actualizada.cliente,
			conceptos: actualizada.conceptos
		});

		if (!result.ok) {
			console.error('[cotizaciones] No se pudo enviar factura automatica', {
				cotizacionId: cotizacion.id,
				error: result.error
			});
		}

		return htmlResponse(
			'Cotizacion aprobada',
			'La cotizacion fue aprobada y facturada. Enviaremos la factura al correo registrado.'
		);
	}

	if (verified.action === 'pagar') {
		if (cotizacion.estado === 'PAGADA') {
			return htmlResponse('Factura pagada', 'Esta factura ya estaba marcada como pagada.');
		}

		if (cotizacion.estado !== 'FACTURADA') {
			return htmlResponse('Factura no disponible', 'La cotizacion aun no esta lista para pago.');
		}

		const saldoPendiente = calcularSaldo(cotizacion);

		if (saldoPendiente <= 0) {
			await prisma.cotizacion.update({
				where: { id: cotizacion.id },
				data: {
					estado: 'PAGADA',
					historial: {
						create: {
							id: await nextHistorialId(prisma),
							estadoAnterior: 'FACTURADA',
							estadoNuevo: 'PAGADA',
							nota: 'Factura sin saldo pendiente.'
						}
					}
				}
			});

			return htmlResponse('Factura pagada', 'Esta factura ya no tenia saldo pendiente.');
		}

		await prisma.$transaction(async (tx) => {
			await tx.pago.create({
				data: {
					id: await nextPagoId(tx),
					cotizacionId: cotizacion.id,
					monto: saldoPendiente,
					fecha: currentDateTimeInDefaultTimeZone(),
					metodo: 'TRANSFERENCIA',
					referencia: 'Liquidacion desde correo'
				}
			});

			await tx.cotizacion.update({
				where: { id: cotizacion.id },
				data: {
					estado: 'PAGADA',
					historial: {
						create: {
							id: await nextHistorialId(tx),
							estadoAnterior: 'FACTURADA',
							estadoNuevo: 'PAGADA',
							nota: `Cliente liquido factura desde correo por ${saldoPendiente}.`
						}
					}
				}
			});
		});

		return htmlResponse('Factura pagada', 'Registramos la liquidacion de la factura. Gracias.');
	}

	return htmlResponse('Accion no disponible', 'La accion solicitada no esta disponible.');
}
