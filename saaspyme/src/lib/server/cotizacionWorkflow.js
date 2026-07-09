import { PUBLIC_ORIGIN } from '$env/static/public';
import { createCotizacionToken } from './cotizacionTokens.js';
import { sendEmail } from './email.js';
import { templateCotizacionEnviada, templateFacturaEnviada } from './emailTemplates.js';
import { generarFacturaPdf } from './facturaPdf.js';

function publicActionUrl(cotizacionId, action) {
	const origin = PUBLIC_ORIGIN || 'http://localhost:5173';
	const token = createCotizacionToken(cotizacionId, action);
	return `${origin}/api/public/cotizacion?token=${encodeURIComponent(token)}`;
}

export async function enviarCotizacionCliente({ cotizacion, cliente, conceptos }) {
	return sendEmail({
		to: cliente.correo,
		subject: `Cotizacion ${cotizacion.numero}`,
		html: templateCotizacionEnviada({
			cliente,
			cotizacion,
			conceptos,
			aprobarUrl: publicActionUrl(cotizacion.id, 'aprobar'),
			rechazarUrl: publicActionUrl(cotizacion.id, 'rechazar')
		})
	});
}

export async function enviarFacturaCliente({ cotizacion, cliente, conceptos }) {
	const pdf = await generarFacturaPdf({ cotizacion, cliente, conceptos });

	return sendEmail({
		to: cliente.correo,
		subject: `Factura ${cotizacion.numero}`,
		html: templateFacturaEnviada({
			cliente,
			cotizacion,
			conceptos,
			pagarUrl: publicActionUrl(cotizacion.id, 'pagar')
		}),
		attachments: [
			{
				filename: `factura-${cotizacion.numero}.pdf`,
				content: pdf.toString('base64')
			}
		]
	});
}
